import { Mutex } from "async-mutex";
import {
	getEventHash,
	getPublicKey,
	getSignature,
	nip19,
	validateEvent,
} from "nostr-tools";
import { nip04 } from "nostr-tools";
import browser from "webextension-polyfill";

import {
	NO_PERMISSIONS_REQUIRED,
	getPermissionStatus,
	showNotification,
	updatePermission,
} from "./common";

const { encrypt, decrypt } = nip04;

let openPrompt = null;
const promptMutex = new Mutex();
let releasePromptMutex = () => {};

browser.runtime.onInstalled.addListener((_, __, reason) => {
	if (reason === "install") browser.runtime.openOptionsPage();
});

browser.runtime.onMessage.addListener(async (req, sender) => {
	const { prompt } = req;

	if (prompt) {
		handlePromptMessage(req, sender);
	} else {
		return handleContentScriptMessage(req);
	}
});

browser.runtime.onMessageExternal.addListener(
	async ({ type, params }, sender) => {
		const extensionId = new URL(sender.url).host;
		return handleContentScriptMessage({ type, params, host: extensionId });
	},
);

browser.windows.onRemoved.addListener((windowId) => {
	if (openPrompt) {
		// calling this with a simple "no" response will not store anything, so it's fine
		// it will just return a failure
		handlePromptMessage({ accept: false }, null);
	}
});

async function handleContentScriptMessage({ type, params, host }) {
	if (NO_PERMISSIONS_REQUIRED[type]) {
		// authorized, and we won't do anything with private key here, so do a separate handler
		switch (type) {
			case "replaceURL": {
				const { protocol_handler: ph } = await browser.storage.local.get([
					"protocol_handler",
				]);
				if (!ph) return false;

				const { url } = params;
				const raw = url.split("nostr:")[1];
				const { type, data } = nip19.decode(raw);
				const replacements = {
					raw,
					hrp: type,
					hex:
						type === "npub" || type === "note"
							? data
							: type === "nprofile"
								? data.pubkey
								: type === "nevent"
									? data.id
									: null,
					p_or_e: { npub: "p", note: "e", nprofile: "p", nevent: "e" }[type],
					u_or_n: { npub: "u", note: "n", nprofile: "u", nevent: "n" }[type],
					relay0: type === "nprofile" ? data.relays[0] : null,
					relay1: type === "nprofile" ? data.relays[1] : null,
					relay2: type === "nprofile" ? data.relays[2] : null,
				};
				let result = ph;
				// biome-ignore lint/complexity/noForEach: TODO: fix this
				Object.entries(replacements).forEach(([pattern, value]) => {
					result = result.replace(new RegExp(`{ *${pattern} *}`, "g"), value);
				});

				return result;
			}
		}

		return;
	} else {
		// acquire mutex here before reading policies
		releasePromptMutex = await promptMutex.acquire();

		const allowed = await getPermissionStatus(
			host,
			type,
			type === "signEvent" ? params.event : undefined,
		);

		if (allowed === true) {
			// authorized, proceed
			releasePromptMutex();
			showNotification(host, allowed, type, params);
		} else if (allowed === false) {
			// denied, just refuse immediately
			releasePromptMutex();
			showNotification(host, allowed, type, params);
			return {
				error: "denied",
			};
		} else {
			// ask for authorization
			try {
				const id = Math.random().toString().slice(4);
				const qs = new URLSearchParams({
					host,
					id,
					params: JSON.stringify(params),
					type,
				});

				// prompt will be resolved with true or false
				const accept = await new Promise((resolve, reject) => {
					openPrompt = { resolve, reject };
					const url = `${browser.runtime.getURL(
						"prompt.html",
					)}?${qs.toString()}`;

					if (browser.windows) {
						browser.windows.create({
							url,
							type: "popup",
							width: 600,
							height: 600,
						});
					} else {
						browser.tabs.create({
							url,
							active: true,
						});
					}
				});

				// denied, stop here
				if (!accept) return { error: "denied" };
			} catch (err) {
				// errored, stop here
				releasePromptMutex();
				return {
					error: `error: ${err}`,
				};
			}
		}
	}

	// if we're here this means it was accepted
	const results = await browser.storage.local.get("private_key");
	if (!results || !results.private_key) {
		return { error: "no private key found" };
	}

	const sk = results.private_key;

	try {
		switch (type) {
			case "getPublicKey": {
				return getPublicKey(sk);
			}
			case "getRelays": {
				const results = await browser.storage.local.get("relays");
				return results.relays || {};
			}
			case "signEvent": {
				const { event } = params;

				if (!event.pubkey) event.pubkey = getPublicKey(sk);
				if (!event.id) event.id = getEventHash(event);
				if (!validateEvent(event))
					return { error: { message: "invalid event" } };

				event.sig = await getSignature(event, sk);
				return event;
			}
			case "nip04.encrypt": {
				const { peer, plaintext } = params;
				return encrypt(sk, peer, plaintext);
			}
			case "nip04.decrypt": {
				const { peer, ciphertext } = params;
				return decrypt(sk, peer, ciphertext);
			}
		}
	} catch (error) {
		return { error: { message: error.message, stack: error.stack } };
	}
}

async function handlePromptMessage({ host, type, accept, conditions }, sender) {
	// return response
	openPrompt?.resolve?.(accept);

	// update policies
	if (conditions) {
		await updatePermission(host, type, accept, conditions);
	}

	// cleanup this
	openPrompt = null;

	// release mutex here after updating policies
	releasePromptMutex();

	// close prompt
	if (sender) {
		if (browser.windows) {
			browser.windows.remove(sender.tab.windowId);
		} else {
			// Android Firefox
			browser.tabs.remove(sender.tab.id);
		}
	}
}
