/*
 * Copyright © 2020-2023 Metreeca srl
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

import { isString } from "@metreeca/core";
import { createContext, createElement, ReactNode, useContext, useMemo, useState } from "react";


/**
 * Fetcher context.
 *
 * Provides nested components with a {@link useFetcher| head}-based shared state containing:
 *
 * - a shared fetch service
 * - a network activity status flag
 *
 * @module
 */

const Context=createContext<[FetcherValue, FetcherUpdater]>([false, standardize(fetch)]);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export type Fetcher=typeof fetch;

/**
 * The value component of the fetcher context state.
 *
 * Holds `true`, if at least a fetch request is awaiting response; `false`, otherwise
 */
export type FetcherValue=boolean;

/**
 * The updater component of the fetcher context state.
 *
 * Takes the same arguments as the global {@link fetch} function and returns a {@link Promise| promise} that always
 * resolves to a {@link Response| response}, converting error conditions into synthetic responses with special
 * internal error codes
 *
 * @see {@link FetchAborted}
 * @see {@link FetchFailed}
 */
export type FetcherUpdater=Fetcher;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


/**
 * The internal status code used for reporting fetch aborts as synthetic responses.
 */
export const FetchAborted=499;

/**
 * The internal status code used for reporting fetch errors as synthetic responses.
 */
export const FetchFailed=599;

/**
 * The set of safe HTTP methods.
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Glossary/Safe/HTTP| MDN - Safe (HTTP Methods)}
 * @see {@link https://datatracker.ietf.org/doc/html/rfc7231#section-4.2.1| RFC 7231 - Hypertext Transfer Protocol (HTTP/1.1): Semantics and Content - § 4.2.1. Safe Methods }
 */
export const Safe: Set<String>=new Set<String>(["GET", "HEAD", "OPTIONS", "TRACE"]);


/**
 * Resolves a URL.
 *
 * @param path the possibly relative URL to be resolved
 * @param base the base URL `path` is to be resolved against; defaults to {@link location.href}
 *
 * @returns a URL obtained by resolving `path` against `base`
 */
export function resolve(path: string, base: string=location.href): string {
    return new URL(path, base).href;
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates a fetcher context.
 *
 * **Warning** / The `fetcher` argument must have a stable identity.
 *
 * @param fetcher the fetch function to be exposed by the new context; defaults to the global {@link fetch} function
 * @param children the children components to be nested inside the new context component
 *
 * @return a new fetcher context component
 *
 */
export function NodeFetcher({

    fetcher=fetch,

    children

}: {

    fetcher?: Fetcher

    children: ReactNode

}) {

    const [promises, setPromises]=useState(new Set<Promise<Response>>());

    const updater: Fetcher=useMemo(() => {

        const standardized=standardize(fetcher);

        return (input, init) => {

            const promise=standardized(input, init);

            setTimeout(() => {

                const update=new Set(promises);

                update.add(promise);

                setPromises(update);

            });

            return promise.finally(() => {

                setTimeout(() => {

                    const update=new Set(promises);

                    update.delete(promise);

                    setPromises(update);

                });

            });

        };

    }, [fetcher]);


    return createElement(Context.Provider, {

        value: [promises.size > 0, updater],

        children

    });

}

/**
 * Creates a fetcher context hook.
 *
 * @return a state tuple including a current {@link Value| value} and an {@link Updater| updater} function.
 */
export function useFetcher(): [FetcherValue, FetcherUpdater] {
    return useContext(Context);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Wraps a fetcher with standard services.
 *
 * - injection of angular-compatible XSRF protection header
 * - conversion of network errors to synthetic HTTP status codes
 *
 * @param fetcher the fetcher function to be wrapped
 *
 * @return a wrapped version of `fetcher` supporting standard services
 */
function standardize(fetcher: Fetcher): Fetcher {
    return (input, init={}) => {

        const method=(init.method || "GET").toUpperCase();
        const origin=new URL(isString(input) ? input : input instanceof URL ? input : input.url, location.href).origin;
        const headers=new Headers(init.headers || {});

        // angular-compatible XSRF protection header

        if ( !Safe.has(method.toUpperCase()) && origin === location.origin ) {

            let xsrf=(document.cookie.match(/\bXSRF-TOKEN\s*=\s*"?([^\s,;\\"]*)"?/) || [])[1];

            if ( xsrf ) { headers.append("X-XSRF-TOKEN", xsrf); }

        }

        // error to synthetic response conversion

        return fetcher(input, { ...init, headers }).catch(reason =>
            new Response(null, reason.name === "AbortError"
                ? { status: FetchAborted, statusText: "Network Request Aborted" }
                : { status: FetchFailed, statusText: "Network Request Failed" }
            )
        );

    };
}