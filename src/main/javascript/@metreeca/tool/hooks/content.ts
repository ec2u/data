/*
 * Copyright © 2020-2022 Metreeca srl
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

import { Immutable, isString } from "@metreeca/core";
import { DataTypes, Error, isFocus, isLiteral, Literal, Query, State, string, Value } from "@metreeca/link";
import { Setter } from "@metreeca/tool/hooks/index";
import { useStats, useTerms } from "@metreeca/tool/nests/graph";
import { useEffect, useState } from "react";


export interface Range {

    readonly min?: Literal;
    readonly max?: Literal;

    readonly gte?: Literal;
    readonly lte?: Literal;

}

export interface RangeDelta {

    readonly gte?: Literal;
    readonly lte?: Literal;

}


export interface Options extends Immutable<Array<{

    readonly value: Value;
    readonly count: number;

    readonly selected?: boolean;

}>> {}

export interface OptionsDelta extends Immutable<Array<{

    readonly value: Literal;

    readonly selected: boolean;

}>> {}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function useKeywords(
    id: string, path: string,
    [query, setQuery]: [Query, Setter<Query>]
): [string, Setter<string>] {

    const keywords=query[`~${path}`];

    return [isString(keywords) ? keywords.trim() : "", keywords => {
        setQuery({ ...query, [`~${path}`]: keywords.trim() || undefined });
    }];

}


export function useRange<E>(
    id: string, path: string, type: keyof typeof DataTypes,
    [query, setQuery]: [Query, Setter<Query>]
): [State<Range>, Setter<RangeDelta>] {

    const lower=`>=${path}`;
    const upper=`<=${path}`;

    const stats=useStats<E>(id, path, query);

    const [range, setRange]=useState<Range>();

    const gte=asLiteral(query[lower]);
    const lte=asLiteral(query[upper]);

    const value: Range=stats({

        value: ({ stats }) => {

            const entry=stats?.filter(({ id }) => id === DataTypes[type])[0];

            const min=asLiteral(entry?.min);
            const max=asLiteral(entry?.max);

            return { min, max, gte, lte };
        },

        other: { ...range, gte, lte }

    });

    useEffect(() => setRange(value), [JSON.stringify(value)]);

    const probe={

        fetch: (abort: () => void) => range ? State({ value: range }) : State<Range>({ fetch: abort }),
        value: () => range ? State({ value: range }) : State<Range>({ fetch: () => {} }),
        error: (error: Error<unknown>) => State<Range>({ error })

    };


    return [

        State({ value: range || {} }),

        ({ gte, lte }) => setQuery({

            ...query,

            [lower]: gte ?? query[lower],
            [upper]: lte ?? query[upper]

        })

    ];

}

export function useOptions(
    id: string,
    {

        path,

        keywords,
        offset,
        limit

    }: {

        path: string,

        keywords?: string,
        offset?: number,
        limit?: number

    },
    [query, setQuery]: [Query, Setter<Query>]
): [

    State<Options>, Setter<OptionsDelta>

] {

    const label=`?${path}`;

    const constraint=query[path] || query[label] || [];
    const selection=isLiteral(constraint) ? [constraint] : constraint;

    const baseline=useTerms(id, path, { // ignoring all facets // !!! review offset/limit

    });

    const matching=useTerms(id, path, { // ignoring this facet

        ".offset": offset,
        ".limit": limit,

        ...Object.entries(query)
            .filter(([key]) => !key.startsWith(".") && key !== path && key !== label)
            .reduce((current, [key, value]) => ({ ...current, [key]: value }), {})

    });


    const value=baseline({

        fetch: abort => State<Options>({ fetch: abort }),

        error: error => State<Options>({ error }),

        value: ({ terms }) => {

            const baseline=terms ?? [];

            return matching({

                fetch: abort => State<Options>({ fetch: abort }),

                error: error => State<Options>({ error }),

                value: ({ terms }) => {

                    const matching=terms ?? [];

                    return State<Options>({

                        value: [...matching, ...baseline

                            .filter(term => !matching.some(match => equals(term.value, match.value)))
                            .filter((term, index) => limit === undefined || limit === 0 || index < limit-matching.length)

                            .map(term => ({ ...term, count: 0 }))

                        ]

                            .map(term => ({

                                ...term, selected: selection.some(value =>
                                    isFocus(term.value) ? term.value.id === value : term.value === value
                                )

                            }))

                            .sort((x, y): number =>
                                x.selected && !y.selected ? -1 : !x.selected && y.selected ? +1
                                    : x.count > y.count ? -1 : x.count < y.count ? +1
                                        : string(x.value).toUpperCase().localeCompare(string(y.value).toUpperCase())
                            )
                    });
                }

            });
        }

    });

    const updater=(terms: OptionsDelta) => {

        const stable=selection.filter(selected => terms.every(({ value }) => !equals(selected, value)));
        const added=terms.filter(({ selected }) => selected).map(({ value }) => value);

        const update=[

            ...stable,
            ...added

        ];

        return setQuery({ ...query, [path]: update.length > 0 ? update : undefined });
    };

    return [value, updater];
}


export function useCount(id: string, path: string, query: Query): undefined | number {

    const stats=useStats(id, path, query);

    const [count, setCount]=useState<number>();

    useEffect(() => setCount(stats({

        value: ({ count }) => count,

        other: count

    })));


    return count;

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function equals(x: Value, y: Value): boolean {
    return isFocus(x) && isFocus(y) ? equals(x.id, y.id) : x === y;
}


//// !!! ///////////////////////////////////////////////////////////////////////////////////////////////////////////////

function asLiteral(value: unknown): undefined | Literal {
    return isLiteral(value) ? value : undefined;
}