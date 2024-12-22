import React, { useState } from "react";
import browser from "webextension-polyfill";
import * as Checkbox from "@radix-ui/react-checkbox";
import { PERMISSION_NAMES } from "./common";
import { LogoIcon } from "./icons";

function Prompt() {
	const [isRemember, setIsRemember] = useState(false);

	const qs = new URLSearchParams(location.search);
	const id = qs.get("id");
	const host = qs.get("host");
	const type = qs.get("type");

	let params;
	let event;

	try {
		params = JSON.parse(qs.get("params"));
		if (Object.keys(params).length === 0) params = null;
		else if (params.event) event = params.event;
	} catch (err) {
		params = null;
	}

	function authorizeHandler(accept) {
		const conditions = isRemember ? {} : null;
		return (ev) => {
			ev.preventDefault();
			browser.runtime.sendMessage({
				prompt: true,
				id,
				host,
				type,
				accept,
				conditions,
			});
		};
	}

	return (
		<div className="w-screen h-screen flex flex-col items-center justify-center">
			<div className="p-8 shadow-primary border border-primary rounded-2xl max-w-xl mx-auto flex flex-col gap-5">
				<div className="flex flex-col items-center gap-5">
					<LogoIcon />
					<div className="flex flex-col items-center text-center">
						<h1 className="font-semibold text-lg">{host}</h1>
						<p>
							is requesting your permission to <b>{PERMISSION_NAMES[type]}</b>
						</p>
					</div>
				</div>
				{params && (
					<div className="flex flex-col gap-1">
						<p>Now acting on</p>
						<pre className="bg-muted px-2 rounded-xl overflow-scroll">
							<code>{JSON.stringify(event || params, null, 2)}</code>
						</pre>
					</div>
				)}
				<div className="flex flex-col gap-4">
					<div className="flex items-center justify-center gap-2">
						<Checkbox.Root
							id="remember"
							className="flex h-6 w-6 appearance-none items-center justify-center rounded-lg bg-white outline-none border border-primary data-[state=checked]:bg-primary data-[state=checked]:border-secondary"
							onCheckedChange={setIsRemember}
						>
							<Checkbox.Indicator className="text-white">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									strokeWidth={1.5}
									stroke="currentColor"
									className="w-4 h-4"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										d="M4.5 12.75l6 6 9-13.5"
									/>
								</svg>
							</Checkbox.Indicator>
						</Checkbox.Root>
						<label htmlFor="remember" className="text-muted">
							Remember my preference forever
						</label>
					</div>
					<div className="flex gap-3">
						<button
							type="button"
							onClick={authorizeHandler(false)}
							className="flex-1 h-10 rounded-lg shadow-sm border border-primary inline-flex items-center justify-center font-semibold"
						>
							Reject
						</button>
						<button
							type="button"
							onClick={authorizeHandler(true)}
							className="flex-1 h-10 rounded-lg shadow-sm border border-secondary bg-primary text-white inline-flex items-center justify-center font-semibold"
						>
							Authorize
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}

const container = document.getElementById("main");
const root = createRoot(container);

root.render(<Prompt />);
