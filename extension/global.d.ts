import type { WindowNostr } from "nostr-tools/nip07";

declare global {
	interface Window {
		nostr?: WindowNostr;
	}
}
