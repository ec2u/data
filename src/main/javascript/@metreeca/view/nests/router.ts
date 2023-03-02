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

import { normalize } from "@metreeca/core/string";
import { string } from "@metreeca/core/value";
import { createContext, createElement, FunctionComponent, ReactNode, useCallback, useContext, useEffect, useMemo, useReducer } from "react";
import { app } from "../index";


/**
 * Router context.

 * @module
 */


/**
 * Route store.
 */
export interface Store {

    /**
     * Converts browser location to a route.
     *
     * @returns the current route as extracted from the current browser location
     */
    (): Route;

    /**
     * Converts a route to a browser location.
     *
     * @param route the route to be converted
     *
     * @returns a root-relative string representing `route`
     */
    (route: Route): string;

}

/**
 * Routing switch.
 */
export interface Switch {

    /**
     * Retrieves a component responsible for rendering a route.
     *
     * @param route the route to be rendered
     *
     * @returns a a rendering of `route` or a new route if a redirection is required
     */
    (route: string): undefined | string | ReactNode;

}

/**
 * Routing table.
 */
export interface Table {

    /**
     * Maps glob patterns either to components or redirection patterns.
     *
     * Patterns may include the following wildcards, where `step` is a sequence of word chars:
     *
     * - `{step}` matches a non empty named path step
     * - `{}` matches a non-empty anonymous path step
     * - `/*` matches a trailing path
     *
     * Redirection patterns may refer to wildcards in the matched route pattern as:
     *
     * - `{step}` replaced with the matched non empty named path step
     * - `{}` replaced with the whole matched route
     * - `/*` replaced with the matched trailing path
     *
     * Named path step in the matched route pattern are also included in the `props` argument of the component as:
     *
     * - `step` the matched non empty named path step
     * - `$` the matched trailing path
     */
    readonly [pattern: string]: string | FunctionComponent;

}


/**
 * The value component of the router context state.
 */
export type Route=string

/**
 * The updater component of the router context state.
 */
export interface SetRoute {

    (route: string | { route?: string, title?: string, state?: any }, replace?: boolean): void;

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const ActiveAttribute="active";
const NativeAttribute="native";
const TargetAttribute="target";

const Context=createContext<{

    store: Store,
    update: () => void,

}>({

    store: () => "",
    update: () => {}

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * The path {@link Store route store}.
 *
 * @return a function managing routes as relative-relative paths including search and hash
 */
export const path=(route?: string) => {

    if ( route === undefined ) {

        return location.pathname;

    } else {

        return route.startsWith("/") ? route : `${location.pathname}${location.search}${location.hash}`;

    }

};

/**
 * The hash {@link Store route store}.
 *
 * @return a function managing routes as hashes
 */
export const hash=(route?: string) => {

    if ( route === undefined ) {

        return location.hash.substring(1);

    } else {

        return route ? route : `${location.search}${location.hash}`;

    }

};


/**
 * Creates an attribute spread for active links.
 *
 * @param route the target link route; may include a trailing `*` to match nested routes
 *
 * @return an attribute spread including an `href` attribute for `route` and an optional `active` boolean
 * attribute if `route` matches the current route
 */
export function active(route: string): { href: string, [ActiveAttribute]?: "" } {

    const wild=route.endsWith("*");

    const href=wild ? route.substring(0, route.length-1) : route;

    function matches(target: string, current: string) {
        return wild ? current.startsWith(target) : current === target;
    }

    return { href: href, [ActiveAttribute]: matches(href, useContext(Context).store()) ? "" : undefined };

}

/**
 * Creates an attribute spread for native links.
 *
 * @param route the target link route
 *
 * @return an attribute spread including an `href` attribute for `route` and an `native` boolean attribute
 */
export function native(route: string): { href: string, [NativeAttribute]?: "" } {
    return { href: route, [NativeAttribute]: "" };
}


export function container(id: string) {
    return /^(\S*\/)(?:[^/]*|[^/]+\/)$/.exec(id)?.[1] ?? "/";
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function NodeRouter({

    store=path,

    children

}: {

    /**
     * The route store
     *
     * @default {@link path}
     */
    store?: Store

    children: Table | Switch

}) {

    const table=useMemo(() => {

        return children instanceof Function ? children : compile(children);

    }, [children]);


    const update=useReducer(v => v+1, 0)[1];

    const click=useCallback((e: MouseEvent) => {

        if ( !(e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || e.defaultPrevented) ) { // only plain events

            const anchor=(e.target as Element).closest("a");
            const image=(e.target as Element).closest("img");

            const native=anchor?.getAttribute(NativeAttribute);
            const target=anchor?.getAttribute(TargetAttribute);

            if ( anchor && !anchor.getAttribute("href")?.startsWith("#")
                && native === null // only non-native anchors
                && (target === null || target === "_self") // only local anchors
            ) {

                e.preventDefault();

                const href=anchor.href;
                const file="file:///";

                const route=href.startsWith(app.base) ? href.substring(app.base.length-1)
                    : href.startsWith(app.root) ? href.substring(app.root.length-1)
                        : href.startsWith(file) ? href.substring(file.length-1)
                            : "";

                if ( route ) { // internal routes

                    try {

                        history.pushState(undefined, document.title, store(route));

                    } finally {

                        update();

                    }

                } else { // external links

                    window.open(href, "_blank");

                }

            } else if ( image ) {

                if ( image.getAttribute(ActiveAttribute) ) {

                    image.removeAttribute(ActiveAttribute);

                } else {

                    image.setAttribute(ActiveAttribute, "true");

                }

            }

        }

    }, [store]);


    useEffect(() => {

        window.addEventListener("popstate", update);
        window.addEventListener("click", click);

        return () => {
            window.removeEventListener("popstate", update);
            window.removeEventListener("click", click);
        };

    }, [update, click]);


    return createElement(Context.Provider, {

        value: { store, update }

    }, lookup(store(), table));

}


export function useRoute(): [Route, SetRoute] {

    const { store, update }=useContext(Context);

    return [store(), (entry, replace) => {

        const { route, title, state }=(typeof entry === "string")
            ? { route: entry, title: undefined, state: undefined }
            : entry;

        const _route=normalize(route === undefined ? location.href : route === null ? location.origin : store(route));
        const _title=normalize((title === undefined) ? document.title : title && app.name ? `${title} | ${(app.name)}` : title || app.name);
        const _state=(state === undefined) ? history.state : (state === null) ? undefined : state;

        const modified=_route !== location.href || _state !== history.state;

        try {

            if ( replace || _route === location.href ) {

                history.replaceState(_state, document.title=_title, _route);

            } else {

                history.pushState(state, document.title=_title, _route);

            }

        } finally {

            if ( modified ) { update(); }

        }

    }];

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function compile(table: Table): Switch {

    function pattern(glob: string): string { // convert a glob pattern to a regular expression
        return glob === "*" ? "^.*$" : `^${glob

            .replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&") // escape special regex characters
            .replace(/\\{(\w+)\\}/g, "(?<$1>[^/]+)") // convert glob named parameters
            .replace(/\\{\\}/g, "(?:[^/]+)") // convert glob anonymous parameters
            .replace(/\/\\\*$/, "(?<$>/.*)") // convert glob trailing path

        }([?#].*)?$`; // ignore trailing query/hash
    }


    const entries: [string, string | FunctionComponent][]=Object
        .entries(table)
        .map(([glob, entry]) => [pattern(glob), entry]);


    return route => {

        for (const [pattern, entry] of entries) {

            const match=new RegExp(pattern).exec(route);

            if ( match ) {
                if ( typeof entry === "string" ) {

                    return entry.replace(/{(\w*)}|\/\*$/g, ($0, $1) => // replace wildcard references
                        $0 === "/*" ? match?.groups?.$ || ""
                            : $1 ? match?.groups?.[$1] || ""
                                : route
                    );

                } else {

                    return createElement(entry, { ...match?.groups });

                }
            }

        }

        return undefined;

    };

}

function lookup(route: string, table: Switch) {

    const redirects=new Set([route]);

    var current=route;

    while ( true ) {

        const component=table(current);

        if ( component === undefined ) {

            throw new Error(`unhandled route ${route}`);


        } else if ( typeof component === "string" ) {

            if ( redirects.has(component) ) {

                throw new Error(`redirection loop <${Array.from(redirects)}>`);

            }

            redirects.add(current=component);

        } else {

            return component;

        }

    }

}

