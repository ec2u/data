/*
 * Copyright © 2020-2021 Metreeca srl. All rights reserved.
 */

import { createContext } from "preact";
import { useContext, useEffect, useState } from "preact/hooks";
import RESTTGraph from "./rest";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export type Hints=Partial<{

	"~": string
	"?": { [key: string]: any }

	_terms: string
	_stats: string

	_offset: number
	_limit: number
	_order: string | string[]

}>

export type Query<T>=Hints & Required<{
	[K in keyof T]: T[K] extends Array<infer I> ? Array<Query<I>> : Query<T[K]>
}>

export type Patch<T>=Partial<{
	[K in keyof T]: T[K] extends Array<infer I> ? Array<Patch<I>> : Patch<T[K]>
}>


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export interface Graph {

	<V, E>(id: string): Entry<V, E>;

}

/**
 * Graph entry point.
 */
export interface Entry<V, E> {

	get(query: Query<V>): V;

	patch(patch: Patch<V>): void;


	probe<R>(probe: Probe<V, E, R>): R;

	observe(observer: (entry: Entry<V, E>) => void): () => void;

}

export interface Probe<V, E, R> {

	blank: R | (() => R);
	value: R | ((value: V) => R);
	error: R | ((error: E) => R);

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const GraphContext=createContext(RESTTGraph());


export function useGraph<V, E=object>(id: string, query: Query<V>): [V, Entry<V, E>] {

	const graph=useContext(GraphContext);

	const [entry, setEntry]=useState(graph<V, E>(id));

	useEffect(() => entry.observe(setEntry));

	return [entry.get(query), entry];

}

export default GraphContext;