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

import { opt, type Optional } from "@metreeca/core";
import { pipe, type Task } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { distinct, fork } from "@metreeca/flow/tasks";
import { html, link, string, type Target, xpath, type XPath } from "@metreeca/mime-xml";
import { crawl, fetch } from "@metreeca/pipe-url";


const retrieval = 4; // the number of catalogue pages fetched at the same time from the portal // !!! as option

const Cards = "//*[contains(concat(' ', normalize-space(@class), ' '), ' card-corsi ')]";
const Pages = "//*[contains(concat(' ', normalize-space(@class), ' '), ' js-pager__items ')]//a/@href";

/**
 * The ISO 8601 periods of the durations the catalogues state in words.
 */
const Periods: { readonly [duration: string]: string } = {
	annuale: "P1Y",
	biennale: "P2Y"
};


/**
 * An offering as a catalogue of the Pavia University portal lists it on a card.
 */
export type Card = {

	/**
	 * The address of the page describing the offering.
	 */
	readonly url: string

	/**
	 * The kind of offering or of audience the card heads with, such as `Master 1° livello` or `Laureati medici`.
	 */
	readonly type: string

	/**
	 * The academic year the card states, formatted as `YYYY/YYYY`.
	 */
	readonly year?: string

	readonly name: string

	/**
	 * The further facts the card states, one text per box, each led by its label, such as `Durata Annuale (60 CFU)`.
	 */
	readonly notes: readonly string[]

}


/**
 * Lists the offerings the catalogues of the Pavia University portal list.
 *
 * Reads every page each catalogue paginates to and lists every offering card once, however many pages repeat it. A
 * page that fails to load is logged and lists nothing, so a catalogue read in part lists only the offerings of the
 * pages that loaded; a card linking no page of its own is left out, as nothing could describe its offering.
 *
 * @returns A task converting a feed of catalogue addresses into a feed of the offering cards they list
 */
export function catalogue(): Task<string, Card> {
	return urls => pipe(
		(items(urls))
		(crawl(
			fork(retrieval, pages => pipe(
				(items(pages))
				(fetch())
				(html())
				(xpath())
			)),
			path => path(Pages).map(link),
			path => path(Cards).flatMap(node => opt(card(xpath(node)), card => [card]) ?? [])
		))
		(distinct(({ url }) => url))
	);
}

/**
 * Reads an offering card.
 *
 * @param path A selector over the card
 *
 * @returns The offering the card lists, or `undefined` if it links no page
 */
export function card(path: XPath): Optional<Card> {

	// boxes are read text node by text node, as labels and values are told apart by markup alone

	const words = (nodes: readonly Target[]) => nodes.map(string).filter(text => text !== "").join(" ");

	const text = (box: string) => words(
		path(`.//*[contains(concat(' ', normalize-space(@class), ' '), ' elenco-corsi__${box} ')]//text()`)
	);

	const [, type = "", year] = /^(.*?)(?:\s+-\s+A\.A\.\s+(\d{4})\/\d{2})?$/.exec(text("tipologia")) ?? [];

	return opt(path(".//*[contains(concat(' ', normalize-space(@class), ' '), ' rubrica__button ')]//a/@href")[0], href => ({

		url: link(href),
		type,
		...opt(year, start => ({ year: `${start}/${Number(start)+1}` })),
		name: text("nome"),

		notes: path(".//*[contains(concat(' ', normalize-space(@class), ' '), ' elenco-corsi__card ')]/*[not("
			+"contains(@class, 'elenco-corsi__tipologia') or contains(@class, 'elenco-corsi__nome')"
			+")]")
			.map(box => words(xpath(box)(".//text()")))
			.filter(note => note !== "")

	}));

}


/**
 * Reads the duration a card states as an ISO 8601 period.
 *
 * @param notes The facts the card states
 *
 * @returns The period stated as `Durata Annuale`, `Durata Biennale` or `Durata` a number of years, or `undefined` if
 * the card states no duration or states one in other terms, such as a semester or a number of months
 */
export function period(notes: readonly string[]): Optional<string> {
	return notes.flatMap(note => opt(/^Durata\s+(?:(\d+)\s+ann[io]\b|(\p{L}+))/iu.exec(note) ?? undefined, ([, years, words]) =>
		opt(years !== undefined ? `P${years}Y` : Periods[words.toLowerCase()], period => [period])
	) ?? [])[0];
}

/**
 * Reads the ECTS credits a card states.
 *
 * @param notes The facts the card states
 *
 * @returns The positive number of credits stated as `(… CFU)`, or `undefined` if the card states none
 */
export function credits(notes: readonly string[]): Optional<number> {
	return notes.flatMap(note => opt(/\((\d+(?:[.,]\d+)?)\s*CFU\)/i.exec(note) ?? undefined, ([, amount]) =>
		opt(Number.parseFloat(amount.replace(",", ".")), credits => credits > 0 ? [credits] : undefined)
	) ?? [])[0];
}
