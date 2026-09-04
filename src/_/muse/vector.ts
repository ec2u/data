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
 * Numeric vector processing.
 *
 * @module
 */

/**
 * Numeric vector.
 *
 * Reports the components of a vector, typically a text embedding, in a fixed coordinate order. Components are matched
 * by position, so vectors are meaningfully compared only if produced by the same source.
 */
export type Vector = readonly number[];


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Computes the cosine distance between two vectors.
 *
 * Cosine distance is defined as `1 - cosine similarity`, where cosine similarity measures the cosine of the angle
 * between two vectors in n-dimensional space: values range from 0 to 2, with 0 reporting identical direction, 1
 * orthogonality and 2 opposite directions.
 *
 * Vectors of different lengths are compared by zero-padding the shorter one, so missing components are treated as 0.
 *
 * @param x The first vector
 * @param y The second vector
 *
 * @returns The cosine distance between `x` and `y`
 *
 * @throws RangeError If either `x` or `y` has a zero norm, that is if it is empty or all its components are 0
 *
 * @see {@link https://en.wikipedia.org/wiki/Cosine_similarity | Cosine similarity}
 */
export function distance(x: Vector, y: Vector) : number {

	let dot = 0;
	let xnorm = 0;
	let ynorm = 0;

	const length = Math.max(x.length, y.length);

	for (let i = 0; i < length; i++) {

		const xi = x[i] || 0;
		const yi = y[i] || 0;

		dot += xi*yi;
		xnorm += xi*xi;
		ynorm += yi*yi;
	}

	if ( !xnorm ) {
		throw new RangeError("zero-length x vector");
	}

	if ( !ynorm ) {
		throw new RangeError("zero-length y vector");
	}

	return 1-dot/(Math.sqrt(xnorm)*Math.sqrt(ynorm));
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Compresses a vector to a compact textual form.
 *
 * Quantises components to 16-bit integers scaled to the `int16` range and reports them as base64-encoded binary,
 * cutting storage size by roughly 75% compared to a JSON array, at a precision loss negligible for semantic similarity
 * ranking. Components are expected in the `[-1, 1]` range, as reported by normalised embedding models; values outside
 * it aren't preserved by the conversion.
 *
 * @param vector The vector to compress
 *
 * @returns The base64-encoded quantised representation of `vector`, to be restored as by {@link decompress}
 */
export function compress(vector: Vector): string {

	const int16Array = new Int16Array(vector.length);

	for (let i = 0; i < vector.length; i++) {
		int16Array[i] = Math.round(vector[i]*32767);
	}

	const buffer = Buffer.from(int16Array.buffer);

	return buffer.toString("base64");
}

/**
 * Decompresses a vector from its compact textual form.
 *
 * Rescales the components quantised by {@link compress} back to the `[-1, 1]` range, approximating the original values
 * within the quantisation step.
 *
 * @param compressed The base64-encoded quantised representation of the vector to restore, as reported by
 * {@link compress}
 *
 * @returns The vector restored from `compressed`
 */
export function decompress(compressed: string): Vector {

	const buffer = Buffer.from(compressed, "base64");

	const int16Array = new Int16Array(
		buffer.buffer,
		buffer.byteOffset,
		buffer.byteLength/Int16Array.BYTES_PER_ELEMENT
	);

	return Array.from(int16Array, v => v/32767);
}
