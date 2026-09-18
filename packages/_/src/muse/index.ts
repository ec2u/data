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
 * Semantic vectors.
 *
 * Provides the vocabulary and the primitives for working with the vectors a language model positions meaning by,
 * independently of the provider computing them: a consumer condenses the fields describing a resource into the text
 * to be embedded, weighs vectors by semantic proximity, and retains them in a form compact enough for bulk storage.
 *
 * @module index
 */

import { some, type Some } from "@metreeca/core/arrays";
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
 * A vector.
 *
 * Holds the components positioning a point in a multi-dimensional space, for instance the embedding of a text in a
 * semantic space. Components are matched by position, so two vectors are comparable only if produced by the same
 * source.
 */
export type Vector =
	readonly number[];

/**
 * A distance between two vectors.
 *
 * Measures how far apart two vectors stand, the smaller value standing for the closer pair. The scale and the range
 * depend on the measure used, so distances are worth ranking and comparing against thresholds tuned for that measure,
 * but carry no absolute meaning of their own.
 */
export type Distance =
	number;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Builds the synopsis of a resource.
 *
 * Empty and undefined fragments are dropped and the rest joined one to a line, so that a caller can pass in every
 * field of a resource without first filtering out the ones it leaves unset.
 *
 * @param values The fragments describing the resource, each either a single text or a collection of texts, so that
 *     repeatable properties can be passed in as they are
 *
 * @returns The synopsis of the resource `values` describes, empty if none of the fragments carries any text
 */
export function synopsis(...values: readonly Some<Text>[]): Text {

	return values
		.flatMap(value => some(value))
		.map(text => text.trim())
		.filter(text => text !== "")
		.join("\n");

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Computes the cosine distance between two vectors.
 *
 * Cosine distance is defined as `1 - cosine similarity`, where cosine similarity measures the cosine of the angle
 * between two vectors in n-dimensional space: values range from 0 to 2, with 0 for identical direction, 1 for
 * orthogonality and 2 for opposite directions.
 *
 * Only vectors of the same length are comparable, as components are matched by position: vectors of different length,
 * as produced by different sources, are rejected rather than reconciled.
 *
 * @param x The first vector
 * @param y The second vector
 *
 * @returns The cosine distance between `x` and `y`
 *
 * @throws {@link !RangeError RangeError} If `x` and `y` have different lengths, if either carries a non-finite
 * component, or if either has a zero norm, that is if it is empty or all its components are 0
 *
 * @see {@link https://en.wikipedia.org/wiki/Cosine_similarity Cosine similarity}
 */
export function cosine(x: Vector, y: Vector): Distance {

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


	function norm(embedding: Vector): number {

		return Math.sqrt(embedding.reduce((sum, component) => sum+component*component, 0));

	}

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Compresses a vector to a compact textual form.
 *
 * Trades precision for size, quantising components to 16-bit integers and encoding them as base64 text: storage
 * shrinks by roughly 75% compared to a JSON array, at a loss negligible for similarity ranking. Components must lie
 * in the `[-1, 1]` range, as they do in a normalised vector: values outside it are rejected rather than silently
 * wrapped around by the conversion.
 *
 * @param vector The vector to compress
 *
 * @returns The compact textual form of `vector`, to be restored by {@link decompress}
 *
 * @throws {@link !RangeError RangeError} If `vector` carries a non-finite component or a component outside the
 * `[-1, 1]` range
 */
export function compress(vector: Vector): string {

	if ( !vector.every(Number.isFinite) ) {
		throw new RangeError("non-finite vector components");
	}

	if ( vector.some(component => component < -1 || component > 1) ) {
		throw new RangeError("out-of-range vector components");
	}

	const quantised = Int16Array.from(vector, component => Math.round(component*Scale));

	return Buffer.from(quantised.buffer).toString("base64");
}

/**
 * Decompresses a vector from its compact textual form.
 *
 * Restores components to the `[-1, 1]` range, approximating the original values within the quantisation step applied
 * by {@link compress}. Truncated input is rejected rather than restored as a silently shortened vector.
 *
 * @param vector The compact textual form of the vector to restore, as produced by {@link compress}
 *
 * @returns The vector encoded by `vector`
 *
 * @throws {@link !RangeError RangeError} If `vector` doesn't decode to a whole number of components
 */
export function decompress(vector: string): Vector {

	const buffer = Buffer.from(vector, "base64");

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
