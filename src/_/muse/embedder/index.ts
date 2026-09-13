/*
 * Copyright © 2026 Metreeca srl
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

/**
 * Text embedding.
 *
 * Provides the {@link Embedder} contract for mapping text to an {@link Embedding} positioning its meaning in a
 * semantic space, decoupling consumers from the embedding strategy, along with the means for searching a body of
 * embedded texts by meaning, ranking embeddings by semantic proximity and retaining them in a compact form.
 *
 * @module index
 *
 * @see {@link https://en.wikipedia.org/wiki/Cosine_similarity Cosine similarity}
 */

import type { Awaitable } from "@metreeca/core/async";
import type { Text } from "@metreeca/core/strings";


/**
 * The factor mapping normalised components onto the int16 range under quantisation.
 *
 * States the largest magnitude a signed 16-bit integer carries, so that a component of the `[-1, 1]` range
 * {@link compress} accepts spans the whole encoding and is restored by {@link decompress} within half a step of
 * `1/32767`. The bound is symmetric, leaving `-32768` unused, so that components at either end of the range are
 * quantised alike and none is clipped.
 */
const Scale = 32767;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Text embedder.
 *
 * Maps text to an {@link Embedding} positioning its meaning in a semantic space, so that related texts may be
 * identified by comparing their embeddings. Embeddings are comparable only if produced by the same embedder.
 */
export type Embedder = {

	/**
	 * Generates a text embedding.
	 *
	 * @param text The text to be embedded
	 *
	 * @returns The embedding of `text`, either directly or on settlement of the returned promise
	 *
	 * @throws {@link !RangeError RangeError} If `text` is blank
	 */
	(text: Text): Awaitable<Embedding>;

};

/**
 * Text embedding.
 *
 * Carries the components positioning a text in a semantic space, in a fixed coordinate order. Components are matched
 * by position, so embeddings are meaningfully compared only if produced by the same source.
 */
export type Embedding = readonly number[];


/**
 * A semantic index.
 *
 * Answers an embedded text with the entries closest to it in meaning, ranked by semantic distance, so that a consumer
 * searches as many texts as it likes against a body of entries handed over once, under bounds settled once. Entries
 * are named by an identifier of the consumer's own, so whatever they carry besides their embedding stays with it.
 *
 * @typeParam T The type of the identifiers the indexed entries are named by
 */
export type Index<T> = {

	/**
	 * Looks up the entries closest to an embedded text.
	 *
	 * Embeddings are comparable only if computed by the same embedder, so `query` is expected to be drawn from the one
	 * the indexed entries were embedded with.
	 *
	 * @param query The embedding of the text to search the index with
	 *
	 * @returns An immutable list of `[id, distance]` pairs naming the matching entries, ordered by increasing distance
	 * from `query`, limited to the entries accepted by the bounds the index was created under
	 *
	 * @throws {@link !RangeError RangeError} If `query` is not comparable to the embeddings the index holds
	 */
	(query: Embedding): readonly [T, Distance][];

};

/**
 * Semantic distance.
 *
 * Measures how far apart two texts stand in meaning, the smaller figure standing for the closer pair. The scale and
 * the range are the measure's own, so a consumer ranks distances and bounds them against figures tuned for the measure
 * at hand, reading nothing absolute into either.
 */
export type Distance = number;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates the default embedder.
 *
 * Embedding depends on an external provider, with no sensible in-process fallback: a job relying on this service must
 * bind a concrete embedder to it.
 *
 * @returns Nothing
 *
 * @throws {@link !Error Error} Always, reporting the service as undefined
 */
export function createEmbedder(): Embedder {

	throw new Error("undefined text embedder service");

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Assembles the text standing for a resource.
 *
 * Blank and undefined fragments are left out and the rest joined one to a line, so that a caller hands over whatever
 * a resource states without weeding out what it leaves unstated.
 *
 * @param texts The fragments describing the resource
 *
 * @returns The fragments of `texts` that are neither undefined nor blank, joined one to a line
 */
export function embeddable(...texts: readonly (undefined | Text)[]): Text {

	return texts
		.filter(text => text !== undefined && text.trim() !== "")
		.join("\n");

}


/**
 * Computes the cosine distance between two embeddings.
 *
 * Cosine distance is defined as `1 - cosine similarity`, where cosine similarity measures the cosine of the angle
 * between two embeddings in n-dimensional space: values range from 0 to 2, with 0 for identical direction, 1 for
 * orthogonality and 2 for opposite directions.
 *
 * Only embeddings of the same length are comparable, as components are matched by position: comparing embeddings of
 * different length, as produced by different embedding models, is rejected rather than reconciled.
 *
 * @param x The first embedding
 * @param y The second embedding
 *
 * @returns The cosine distance between `x` and `y`
 *
 * @throws {@link !RangeError RangeError} If `x` and `y` have different lengths, if either carries a non-finite
 * component, or if either has a zero norm, that is if it is empty or all its components are 0
 *
 * @see {@link https://en.wikipedia.org/wiki/Cosine_similarity Cosine similarity}
 */
export function cosine(x: Embedding, y: Embedding): Distance {

	if ( x.length !== y.length ) {
		throw new RangeError(`mismatched embedding lengths <${x.length}>/<${y.length}>`);
	}

	if ( !x.every(Number.isFinite) ) {
		throw new RangeError("non-finite x embedding components");
	}

	if ( !y.every(Number.isFinite) ) {
		throw new RangeError("non-finite y embedding components");
	}

	const xnorm = norm(x);
	const ynorm = norm(y);

	if ( xnorm === 0 ) {
		throw new RangeError("zero-length x embedding");
	}

	if ( ynorm === 0 ) {
		throw new RangeError("zero-length y embedding");
	}

	const dot = x.reduce((sum, xi, index) => sum+xi*y[index], 0);

	return 1-dot/(xnorm*ynorm);


	function norm(embedding: Embedding): number {

		return Math.sqrt(embedding.reduce((sum, component) => sum+component*component, 0));

	}

}


/**
 * Compresses an embedding to a compact textual form.
 *
 * Trades precision for size, quantising components to 16-bit integers and encoding them as base64 text: storage
 * shrinks by roughly 75% compared to a JSON array, at a loss negligible for semantic similarity ranking. Components
 * must lie in the `[-1, 1]` range, as produced by normalised embedding models: values outside it are rejected rather
 * than silently wrapped around by the conversion.
 *
 * @param embedding The embedding to compress
 *
 * @returns The compact textual form of `embedding`, to be restored as by {@link decompress}
 *
 * @throws {@link !RangeError RangeError} If `embedding` carries a non-finite component or a component outside the
 * `[-1, 1]` range
 */
export function compress(embedding: Embedding): string {

	if ( !embedding.every(Number.isFinite) ) {
		throw new RangeError("non-finite embedding components");
	}

	if ( embedding.some(component => component < -1 || component > 1) ) {
		throw new RangeError("out-of-range embedding components");
	}

	const quantised = Int16Array.from(embedding, component => Math.round(component*Scale));

	return Buffer.from(quantised.buffer).toString("base64");
}

/**
 * Decompresses an embedding from its compact textual form.
 *
 * Restores components to the `[-1, 1]` range, approximating the original values within the quantisation step applied
 * by {@link compress}. Truncated input is rejected rather than restored as a silently shortened embedding.
 *
 * @param compressed The compact textual form of the embedding to restore, as produced by {@link compress}
 *
 * @returns The embedding restored from `compressed`
 *
 * @throws {@link !RangeError RangeError} If `compressed` doesn't decode to a whole number of components
 */
export function decompress(compressed: string): Embedding {

	const buffer = Buffer.from(compressed, "base64");

	if ( buffer.byteLength%Int16Array.BYTES_PER_ELEMENT !== 0 ) {
		throw new RangeError(`truncated compressed embedding <${buffer.byteLength}>`);
	}

	const quantised = new Int16Array(
		buffer.buffer,
		buffer.byteOffset,
		buffer.byteLength/Int16Array.BYTES_PER_ELEMENT
	);

	return Array.from(quantised, component => component/Scale);
}
