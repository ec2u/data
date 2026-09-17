/*
 * Copyright © 2020-2026 EC2U Alliance
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

import { Event } from "@/events/index.js";
import { Page } from "@/vocabularies/ec2u.js";
import type { ResourceShape } from "@metreeca/blue/resource";
import { error, type Lazy, type Optional } from "@metreeca/core";
import type { StoreOpts } from "@metreeca/keep";
import type { Projection, Template } from "@metreeca/qest/work";
import type { Reference, Resource } from "@metreeca/qest/state";
import { as, compile, count, from, gte, limit, max, order, some, where } from "./dsl.js";


// !!! shape >> model
// !!! shape+model >> type
// !!! shape/model compatibility


const store: Store = error("!!!");


interface Store {

	select<T extends Resource>(request: Select<T>, opts?: StoreOpts): Promise<readonly T[]>;

	lookup<T extends Resource>(request: Lookup<T>, opts?: StoreOpts): Promise<Optional<T>>;

}


export type Select<T extends Resource> = {

	readonly shape: Lazy<ResourceShape>;
	readonly model: Template<T> | Projection<T>;

}

export type Lookup<T extends Resource> = {

	readonly entry: Reference;
	readonly shape: Lazy<ResourceShape>;
	readonly model: Template<T>;

}


//// Lookup ////////////////////////////////////////////////////////////////////////////////////////////////////////////

await store.select(from(Page, page => as({

	id: page.id,
	digest: page.digest

}, where(
	some(page.source, "https://example.edu/news"),
	limit(100)
))));


await store.lookup(from("https://data.ec2u.eu/pages/1", Page, page => ({

	digest: page.digest

})));


//// Select ////////////////////////////////////////////////////////////////////////////////////////////////////////////

await store.select(from(Event, event => as({

	id: event.id,

	name: event.name.at("en", "fi"),

	publisher: event.publisher.select(publisher => ({

		id: publisher.id,
		label: publisher.label

	})),

	keywords: event.keywords.select(topic => as({

		id: topic.id,
		label: topic.label

	}, where(
		order(topic.label),
		limit(10)
	))),

	publisherLabel: event.publisher.label,

	topics: count(event.keywords),
	latest: max(event.startDate)

}, where(
	gte(event.startDate, "2026-01-01"),
	order(event.startDate, "desc")
))));


//// Decoding /////////////////////////////////////////////////////////////////////////////////////////////////////////

await store.select(from(Page, compile(Page, JSON.parse(`{

	"id": {},
	"?source": "https://example.edu/news"

}`))));
