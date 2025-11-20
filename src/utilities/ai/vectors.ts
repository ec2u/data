/*
 * Copyright © 2025 Metreeca srl
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
 * Computes the cosine distance between two vectors.
 *
 * <p>Cosine distance is defined as {@code 1 - cosine_similarity}, where cosine similarity measures
 * the cosine of the angle between two vectors in n-dimensional space. The distance ranges from 0 to 2,
 * where 0 indicates identical direction, 1 indicates orthogonality, and 2 indicates opposite directions.</p>
 *
 * <p>Vectors of different lengths are supported by zero-padding the shorter vector. Missing elements
 * are treated as zero.</p>
 *
 * @param x the first vector
 * @param y the second vector
 *
 * @return the cosine distance between {@code x} and {@code y}
 *
 * @throws RangeError if either {@code x} or {@code y} is a zero-length vector
 */
export function distance(x: readonly number[], y: readonly number[]) {

	let dot=0;
	let xnorm=0;
	let ynorm=0;

	const length=Math.max(x.length, y.length);

	for (let i=0; i < length; i++) {

		const xi=x[i] || 0;
		const yi=y[i] || 0;

		dot+=xi*yi;
		xnorm+=xi*xi;
		ynorm+=yi*yi;
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
 * Compresses an embedding vector to base64-encoded 16-bit quantized representation.
 *
 * <p>Reduces storage size by ~75% compared to JSON array representation,
 * converting 64-bit floats to 16-bit integers with negligible precision loss
 * for cosine similarity calculations.</p>
 *
 * <p>Values are scaled to the int16 range [-32768, 32767] and rescaled on decompression.
 * This quantization preserves relative distances well for semantic similarity tasks.</p>
 *
 * @param embedding the embedding vector to compress
 *
 * @return base64-encoded binary representation of the quantized embedding
 */
export function compress(embedding: readonly number[]): string {

	const int16Array=new Int16Array(embedding.length);

	for (let i=0; i < embedding.length; i++) {
		int16Array[i]=Math.round(embedding[i]*32767);
	}

	const buffer=Buffer.from(int16Array.buffer);

	return buffer.toString("base64");
}

/**
 * Decompresses a base64-encoded 16-bit quantized embedding to a float vector.
 *
 * @param compressed the base64-encoded compressed embedding
 *
 * @return the decompressed embedding vector
 */
export function decompress(compressed: string): readonly number[] {

	const buffer=Buffer.from(compressed, "base64");

	const int16Array=new Int16Array(
		buffer.buffer,
		buffer.byteOffset,
		buffer.byteLength/Int16Array.BYTES_PER_ELEMENT
	);

	return Array.from(int16Array, v => v/32767);
}
