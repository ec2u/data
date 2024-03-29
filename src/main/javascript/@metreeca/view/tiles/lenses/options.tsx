import {isBoolean} from "@metreeca/core";
import {DataTypes, isFocus, isLiteral, Literal, Query, string} from "@metreeca/core/value";
import {Setter} from "@metreeca/view/hooks";
import {useCache} from "@metreeca/view/hooks/cache";
import {useDelay} from "@metreeca/view/hooks/delay";
import {Options, useOptions} from "@metreeca/view/nests/graph";
import {useRoute} from "@metreeca/view/nests/router";
import {
    AlertIcon,
    Check,
    CheckSquare,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ClearIcon,
    X
} from "@metreeca/view/tiles/icon";
import {NodeLink} from "@metreeca/view/tiles/link";
import {NodeSpin} from "@metreeca/view/tiles/spin";
import * as React from "react";
import {createElement, useEffect, useRef, useState} from "react";
import {classes} from "../../index";
import "./options.css";


const PageSize=10;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function NodeOptions({

    id,
    path,
    type,

    compact=true,
    placeholder,

    state: [query, setQuery]

}: {

    id?: string
    path: string,
    type: keyof typeof DataTypes

    compact?: boolean
    placeholder?: string

    state: [Query, Setter<Query>]

}) {

    const element=useRef<Element>(null);
    const [focused, setFocused]=useState(false);


    useEffect(() => {

        const focus=(e: FocusEvent) => {
            return setFocused(
                e.target instanceof Node && (element.current?.contains(e.target) || false) && (
                    focused || e.target instanceof HTMLInputElement && e.target.parentElement?.tagName === "HEADER"
                )
            );
        };

        window.addEventListener("focus", focus, true);

        return () => {
            window.removeEventListener("focus", focus, true);
        };

    });


    const [route]=useRoute();

    const [keywords, setKeywords]=useState("");
    const [offset, setOffset]=useState(0);
    const limit=PageSize+1;

    const search=useDelay(true, [keywords, doSearch]);

    const [options, setOptions]=useOptions(id || route, path, type, { keywords, offset, limit }, [query, setQuery]);
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

            {type === "boolean" && isBoolean(value) ? value ? <Check/> : <X/>
                : type === "anyURI" && isFocus(value) ? <NodeLink>{value}</NodeLink>
                    : <span data-placeholder={"blank"}>{string(value)}</span>
            }

            <small>{string(count)}</small>

        </div>;
    }


    const expanded=!compact || focused;
    const count=cache?.length ?? 0;
    const paging=count > PageSize || offset > 0;

    return createElement("node-options", {

        ref: element,
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