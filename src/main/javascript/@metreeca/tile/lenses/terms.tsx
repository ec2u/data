/*
 *   Copyright © 2021 Luxottica. All rights reserved.
 */

import { isBoolean } from "@metreeca/core";
import { isFocus, isLiteral, Literal, Query, string } from "@metreeca/link";
import { Check, ChevronLeft, ChevronRight, ChevronsLeft, ClearIcon, Filter, X } from "@metreeca/tile/widgets/icon";
import { NodeLink } from "@metreeca/tile/widgets/link";
import { NodeSpin } from "@metreeca/tile/widgets/spin";
import { Setter } from "@metreeca/tool/hooks";
import { useDelay } from "@metreeca/tool/hooks/delay";
import { Terms, useTerms } from "@metreeca/tool/nests/graph";
import * as React from "react";
import { createElement, useEffect, useRef, useState } from "react";
import { classes } from "../../tool";
import "./terms.css";


const PageSize=10;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function NodeTerms({

    id,
    path,

    compact=false,
    placeholder,

    state: [query, setQuery]

}: {

    id: string
    path: string,

    compact?: boolean
    placeholder?: string

    state: [Query, Setter<Query>]

}) {

    const [focused, setFocused]=useState(false);

    const [keywords, setKeywords]=useState("");
    const [offset, setOffset]=useState(0);
    const limit=PageSize+1;

    const [terms, setTerms]=useTerms(id,
        { path, keywords, offset, limit },
        [query, setQuery]
    );

    const root=useRef<Element>(null);
    const search=useDelay(true, [keywords, doSearch]);

    const count=terms({ value: value => value.length, other: 0 });

    const expanded=!compact || focused;
    const paging=count > PageSize || offset > 0;


    useEffect(() => {

        const focus=(e: FocusEvent) => doActivate(
            e.target instanceof Node && root.current?.contains(e.target) || false
        );

        window.addEventListener("focus", focus, true);

        return () => {
            window.removeEventListener("focus", focus, true);
        };

    });


    function doActivate(activate: boolean) {
        if ( activate ) {

            setFocused(true);

        } else {

            setFocused(false);
            setKeywords("");
            setOffset(0);

        }
    }

    function doSearch(keywords: string) {
        // !!! clear cache
        setKeywords(keywords);
        setOffset(0);
    }

    function doPage(delta: number) {
        setOffset(delta === 0 ? 0 : Math.max(0, offset+delta*PageSize));
    }

    function doSelect(value: Literal, selected: boolean) {
        setTerms([{ value, selected }]);
        setKeywords("");
        setOffset(0);
    }


    function option({ selected, value, count }: Terms[number]) {
        return <div key={string(value)} className={count > 0 ? "available" : "unavailable"}>

            <input type="checkbox" checked={selected} disabled={!selected && count === 0}

                onChange={e => doSelect(
                    isFocus(value) ? value.id : isLiteral(value) ? value : "",
                    e.currentTarget.checked
                )}

            />

            {isBoolean(value) ? value ? <Check/> : <X/>
                : isFocus(value) ? <NodeLink>{value}</NodeLink>
                    : <span data-placeholder={"blank"}>{string(value)}</span>
            }

            <small>{string(count)}</small>

        </div>;
    }


    return createElement("node-terms", {

            ref: root,
            class: classes({ "node-input": true, focused }),

            onKeyDown: e => {
                if ( e.key === "Escape" || e.key === "Enter" ) {

                    e.preventDefault();

                    if ( document.activeElement instanceof HTMLElement ) {
                        document.activeElement.blur();
                    }

                    doActivate(false);
                }
            }

        }, <>

            <header>

                <i><Filter/></i>

                <input ref={search} type={"text"} placeholder={placeholder}/>

                <nav>{search.current?.value

                    ? <button title={"Clear"} onClick={() => doSearch("")}><ClearIcon/></button>

                    : null

                }</nav>

            </header>

            <section>{terms({

                value: terms => terms.filter(({ selected }) => selected).map(option)

            })}</section>

            <section>{expanded && terms({

                fetch: <NodeSpin/>,

                value: terms => keywords && terms.length === 0
                    ? <small>No Matches</small>
                    : terms.filter(({ selected }) => !selected).map(option)

            })}</section>

            {expanded && paging && <footer>

                <button type={"button"} title={"First Page"}
                    disabled={offset === 0} onClick={() => doPage(0)}
                ><ChevronsLeft/></button>

                <button type={"button"} title={"Previous Page"}
                    disabled={offset === 0} onClick={() => doPage(-1)}
                ><ChevronLeft/></button>

                <button type={"button"} title={"Next Page"}
                    disabled={count <= PageSize} onClick={() => doPage(+1)}
                ><ChevronRight/></button>

            </footer>}

        </>
    );

}