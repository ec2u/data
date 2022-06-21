/*
 *   Copyright © 2021 Luxottica. All rights reserved.
 */

import { isBoolean } from "@metreeca/core";
import { DataTypes, isFocus, isLiteral, Literal, Query, string } from "@metreeca/link";
import { AlertIcon, Check, CheckSquare, ChevronLeft, ChevronRight, ChevronsLeft, ClearIcon, X } from "@metreeca/tile/widgets/icon";
import { NodeLink } from "@metreeca/tile/widgets/link";
import { NodeSpin } from "@metreeca/tile/widgets/spin";
import { Setter } from "@metreeca/tool/hooks";
import { useCache } from "@metreeca/tool/hooks/cache";
import { useDelay } from "@metreeca/tool/hooks/delay";
import { Options, useOptions } from "@metreeca/tool/nests/graph";
import * as React from "react";
import { createElement, useEffect, useRef, useState } from "react";
import { classes } from "../../tool";
import "./terms.css";


const PageSize=10;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function NodeTerms({

    id,
    path,
    type,

    compact=true,
    placeholder,

    state: [query, setQuery]

}: {

    id: string
    path: string,
    type: keyof typeof DataTypes

    compact?: boolean
    placeholder?: string

    state: [Query, Setter<Query>]

}) {

    const root=useRef<Element>(null);
    const [focused, setFocused]=useState(false);


    useEffect(() => {

        const focus=(e: FocusEvent) => doActivate(
            e.target instanceof Node && root.current?.contains(e.target) || false
        );

        window.addEventListener("focus", focus, true);

        return () => {
            window.removeEventListener("focus", focus, true);
        };

    });


    const [keywords, setKeywords]=useState("");
    const [offset, setOffset]=useState(0);
    const limit=PageSize+1;

    const search=useDelay(true, [keywords, doSearch]);

    const [options, setOptions]=useOptions(id, path, type, { keywords, offset, limit }, [query, setQuery]);
    const cache=useCache(options({ value: options => options }));


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
        setOptions([{ value, selected }]);
        setKeywords("");
        setOffset(0);
    }

    function doReset() {
        setOptions(null);
        setKeywords("");
        setOffset(0);
    }


    function option({ selected, value, count }: Options[number]) {
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


    const expanded=!compact || focused;
    const count=cache?.length ?? 0;
    const paging=count > PageSize || offset > 0;

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

            <i><CheckSquare/></i>

            <input ref={search} type={"text"} placeholder={placeholder}/>

            <nav>{options({

                fetch: <NodeSpin/>,
                error: <AlertIcon/>, // !!! tooltip

                value:
                    search.current?.value ? <button title={"Clear"} onClick={() => doSearch("")}><ClearIcon/></button>
                        : cache?.some(({ selected }) => selected) ?
                            <button title={"Reset"} onClick={doReset}><X/></button>
                            : null

            })}</nav>

        </header>

        <section>{cache && (cache.length
                ? cache.filter(({ selected }) => expanded || selected).map(option)
                : expanded && <small>No Matches</small>
        )}</section>

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

    </>);

}