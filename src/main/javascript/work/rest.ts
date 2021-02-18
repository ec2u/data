/*
 * Copyright © 2020-2021 Metreeca srl. All rights reserved.
 */

import { Entry, Patch, Probe, Query } from "./graph";

export default function RESTTGraph(): <V, E>(id: string) => Entry<any, any> {

	const cache: { [key: string]: Entry<any, any> }={};

	return function <V, E>(id: string) {
		return cache[id] || (cache[id]=entry(id));
	};

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function entry<V, E>(id: string): Entry<V, E> {

	let model: V;

	let value: V | undefined;
	let error: E | undefined;

	const observers=new Set<(entry: any) => void>();

	function notify() {
		observers.forEach(observer => observer({ ...entry }));
	}

	const entry: Entry<V, E>={

		get(query: Query<V>): V {

			if ( value ) {

				return value;

			} else {

				model=clean(query); // provide writable placeholders

				value=undefined;
				error=undefined;

				notify();

				const params=new URLSearchParams();

				if ( query["~"] ) { params.append("~", String(query["~"])); }

				if ( query._offset ) { params.append("_offset", String(query._offset)); }
				if ( query._limit ) { params.append("_limit", String(query._limit)); }
				if ( query._order ) { params.append("_order", String(query._order)); } // !!! handle lists

				const search=params.toString();

				fetch(search ? `${id}?${search}` : id)

					.then(response => response.json())

					.then(json => { // !!! resolvers

						value=freeze(json);

						notify();

					})

					.catch(reason => {
						// !!! report reason as <E>
					});

			}

			return model;
		},

		patch(patch: Patch<V>): void { // !!!

			value=freeze({ ...model, ...patch });

			notify();
		},


		// !!! return writable deep clones

		probe<R>(probe: Probe<V, E, R>): R {
			return value ? ((probe.value instanceof Function ? probe.value(value) : probe.value))
				: error ? ((probe.error instanceof Function ? probe.error(error) : probe.error))
					: ((probe.blank instanceof Function ? probe.blank() : probe.blank));
		},

		observe(observer: (focus: Entry<V, E>) => void): () => void {

			observers.add(observer);

			return () => observers.delete(observer);

		}

	};

	return entry;
}

function clean(value: any) {
	return Array.isArray(value) ? []
		: typeof value === "object" ? map({ ...value }, clean)
			: value;
}

function freeze(value: any) {
	return Object.freeze(map(value, freeze));
}

function map(value: any, mapper: (value: any) => any): any {

	if ( typeof value === "object" ) {
		for (const key of Object.getOwnPropertyNames(value)) {
			value[key]=mapper(value[key]);
		}
	}

	return value;
}