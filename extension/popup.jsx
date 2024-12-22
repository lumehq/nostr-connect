import * as Tabs from "@radix-ui/react-tabs";
import { minidenticon } from "minidenticons";
import { getPublicKey, nip19 } from "nostr-tools";
import React, { useState, useMemo, useEffect } from "react";
import QRCode from "react-qr-code";
import browser from "webextension-polyfill";
import { SettingsIcon } from "./icons";

function Popup() {
	const [keys, setKeys] = useState(null);
	const avatarURI = useMemo(
		() =>
			keys
				? `data:image/svg+xml;utf8,${encodeURIComponent(minidenticon(keys.npub, 90, 30))}`
				: null,
		[keys],
	);

	const gotoSettings = () => {
		browser.tabs.create({
			url: browser.runtime.getURL("/options.html"),
		});
	};

	useEffect(() => {
		browser.storage.local.get(["private_key", "relays"]).then((results) => {
			if (results.private_key) {
				const hexKey = getPublicKey(results.private_key);
				const npubKey = nip19.npubEncode(hexKey);

				setKeys({ npub: npubKey, hex: hexKey });

				if (results.relays) {
					const relaysList = [];
					for (const url in results.relays) {
						if (results.relays[url].write) {
							relaysList.push(url);
							if (relaysList.length >= 3) break;
						}
					}
					if (relaysList.length) {
						const nprofileKey = nip19.nprofileEncode({
							pubkey: hexKey,
							relays: relaysList,
						});
						setKeys((prev) => ({ ...prev, nprofile: nprofileKey }));
					}
				}
			} else {
				setKeys(null);
			}
		});
	}, []);

	return (
		<div className="w-[320px] p-6">
			{!keys ? (
				<div className="flex items-center justify-between gap-6">
					<div className="flex-1 flex items-center justify-between">
						<p className="text-sm font-medium">
							Click here to enter or create
							<br />
							your first identity
						</p>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							strokeWidth={1.5}
							stroke="currentColor"
							className="w-6 h-6"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
							/>
						</svg>
					</div>
					<button
						type="button"
						onClick={() => gotoSettings()}
						className="w-9 h-9 shrink-0 border border-primary shadow-sm rounded-xl inline-flex items-center justify-center"
					>
						<SettingsIcon className="w-5 h-5 text-muted" />
					</button>
				</div>
			) : (
				<div>
					<div className="mb-2 flex items-center justify-between">
						<div className="flex items-center gap-2">
							{avatarURI ? (
								<img
									src={avatarURI}
									alt="Avatar"
									className="w-9 h-9 rounded-full bg-muted"
								/>
							) : (
								<div className="w-9 h-9 rounded-full bg-muted" />
							)}
							<p className="font-semibold">Account</p>
						</div>
						<button
							type="button"
							onClick={() => gotoSettings()}
							className="w-9 h-9 shrink-0 border border-primary shadow-sm rounded-xl inline-flex items-center justify-center"
						>
							<SettingsIcon className="w-5 h-5 text-muted" />
						</button>
					</div>
					<div>
						<Tabs.Root defaultValue="npub">
							<Tabs.List className="w-full border-b border-primary h-10 flex items-center">
								<Tabs.Trigger
									value="npub"
									className="font-medium flex-1 flex items-center justify-center text-muted h-10 data-[state=active]:text-primary data-[state=active]:border-b data-[state=active]:border-secondary"
								>
									npub
								</Tabs.Trigger>
								<Tabs.Trigger
									value="hex"
									className="font-medium flex-1 flex items-center justify-center text-muted h-10 data-[state=active]:text-primary data-[state=active]:border-b data-[state=active]:border-secondary"
								>
									hex
								</Tabs.Trigger>
								{keys.nprofile ? (
									<Tabs.Trigger
										value="nprofile"
										className="font-medium flex-1 flex items-center justify-center text-muted h-10 data-[state=active]:text-primary data-[state=active]:border-b data-[state=active]:border-secondary"
									>
										nprofile
									</Tabs.Trigger>
								) : null}
							</Tabs.List>
							<Tabs.Content value="npub">
								<div className="my-4">
									<textarea
										value={keys.npub}
										readOnly
										className="w-full h-20 resize-none p-3 bg-muted rounded-xl"
									/>
								</div>
								<div className="w-full rounded-xl border border-primary p-4 flex items-center justify-center">
									<QRCode size={128} value={keys.npub} />
								</div>
							</Tabs.Content>
							<Tabs.Content value="hex">
								<div className="my-4">
									<textarea
										value={keys.hex}
										readOnly
										className="w-full h-20 resize-none p-3 bg-muted rounded-xl"
									/>
								</div>
								<div className="w-full rounded-xl border border-primary p-4 flex items-center justify-center">
									<QRCode size={128} value={keys.hex} />
								</div>
							</Tabs.Content>
							{keys.nprofile ? (
								<Tabs.Content value="nprofile">
									<div className="my-4">
										<textarea
											value={keys.nprofile}
											readOnly
											className="w-full h-20 resize-none p-3 bg-muted rounded-xl"
										/>
									</div>
									<div className="w-full rounded-xl border border-primary p-4 flex items-center justify-center">
										<QRCode size={128} value={keys.nprofile} />
									</div>
								</Tabs.Content>
							) : null}
						</Tabs.Root>
					</div>
				</div>
			)}
		</div>
	);
}

const container = document.getElementById("main");
const root = createRoot(container);

root.render(<Popup />);
