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

import { ai } from "@/utilities/gcp/gemini";

export async function embedding(text: string): Promise<readonly number[]> {
	return ai().then(async ai => {

		const response=await ai.models.embedContent({
			model: "text-embedding-004", //  see https://ai.google.dev/models
			contents: text
		});

		return response.embeddings?.[0]?.values || [];

	});
}

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
