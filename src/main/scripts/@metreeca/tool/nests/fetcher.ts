/*
 * Copyright © 2020-2021 Metreeca srl
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { createContext, createElement, ReactNode, useContext } from "react";
import { report } from "../index";

const context=createContext<Fetcher>(wrapper(fetch));


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const Safe: Set<String>=new Set<String>(["GET", "HEAD", "OPTIONS", "TRACE"]);


/**
 * The internal status code used for reporting fetch aborts as synthetic responses.
 */
export const FetchAbort=499;

/**
 * The internal status code used for reporting fetch errors as synthetic responses.
 */
export const FetchError=599;


/**
 * Resource fetcher.
 *
 * Manages network connections.
 */
export interface Fetcher {

	/**
	 * Handles a request.
	 *
	 * @param info the request info
	 * @param init the request init parameters
	 *
	 * @returns a promise always resolving to a response generated by handling the request assembled from `info` and
	 * `init`; fetch errors are converted into synthetic responses with an internal marking status code
	 * ({@link FetchAbort}/{@link FetchError})
	 */
	(info: RequestInfo, init?: RequestInit): Promise<Response>;

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function useFetcher() {
	return useContext(context);
}

export function ToolFetcher(props: {

	value: Fetcher

	children: ReactNode

}) {

	return createElement(context.Provider, props);

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function wrapper(fetcher: Fetcher): Fetcher {
	return (info=location.href, init={}) => {

		const request=new Request(info, init);

		// default request headers

		if ( request.method === "GET" || request.method === "HEAD" ) {
			request.headers.set("Accept", request.headers.get("Accept") || "application/json");
		}

		// angular-compatible XSRF protection header

		if ( !Safe.has(request.method.toUpperCase()) && new URL(request.url).origin === location.origin ) {

			let xsrf=(document.cookie.match(/\bXSRF-TOKEN\s*=\s*"?([^\s,;\\"]*)"?/) || [])[1];

			if ( xsrf ) { request.headers.append("X-XSRF-TOKEN", xsrf); }

		}

		return new Promise(resolve => fetcher(request)

			.catch(reason => new Response("{}", { // error to synthetic response conversion

				// !!! should report aborts with AbortError but the class is not defined anywhere
				// !!! see https://developer.mozilla.org/en-US/docs/Web/API/AbortController/abort

				status: reason.constructor && reason.constructor.name === "AbortError" ? FetchAbort : FetchError,
				statusText: String(reason)

			}))

			.then(response => {

				resolve(response);

				if ( !response.ok && !response.bodyUsed ) { // error response not handled elsewhere

					// !!! provide customization hook

					response.text().then(text =>
						report(`Unhandled fetch error ${response.status} ${response.statusText}${text && "\n\n"}${text}`)
					);

				}

			})
		);
	};
}