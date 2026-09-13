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
 * Gemini text embedding.
 *
 * Provides an {@link Embedder} computing embeddings through the Gemini API, so that a job binding it draws on the
 * Gemini models without handling requests, credentials or rate quotas of its own.
 *
 * @module
 *
 * @see {@link https://ai.google.dev/gemini-api/docs/embeddings Embeddings}
 */

import { createGoogleAI, embedding } from "@/_/muse-google/index.js";
import type { Embedder, Embedding } from "@/_/muse/embedder/index.js";
import type { Text } from "@metreeca/core/strings";
import { service } from "@metreeca/gear";
import { log, report, time } from "@metreeca/tape";


const logger = log(import.meta.url);


/**
 * The Gemini model embeddings are computed by.
 *
 * States the current embedding generation, which supersedes the retired `text-embedding-004`: a body embedded with the
 * retired model is not comparable to one embedded here and must be embedded again.
 *
 * @see {@link https://ai.google.dev/models Gemini models}
 */
const Model = "gemini-embedding-2";

/**
 * The number of components embeddings carry.
 *
 * Holds the embedding to a quarter of the 3072 components the model computes natively, so that a body embedded in bulk
 * is retained and compared at a fraction of the cost, at the accuracy a shorter embedding affords. The model truncates
 * and renormalises its own output, so components stay within the `[-1, 1]` range regardless of the figure stated here.
 *
 * @see {@link https://ai.google.dev/gemini-api/docs/embeddings#control-embedding-size Control embedding size}
 */
const Size = 768;

/**
 * The task embeddings are optimised for.
 *
 * States classification, so that embeddings are laid out for assigning text to a set of known categories, as topic
 * matching does, rather than for retrieval or similarity ranking at large.
 *
 * @see {@link https://ai.google.dev/gemini-api/docs/embeddings#supported-task-types Supported task types}
 */
const Task = "CLASSIFICATION";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates a Gemini embedder.
 *
 * Text is embedded one request at a time through the {@link createGoogleAI Gemini client} bound to the enclosing
 * execution, so that a consumer pays no attention to the API beyond binding that client. Requests are paced against
 * the rate quota published for the embedding model, so that a consumer embedding at speed is held back rather than
 * rejected.
 *
 * The client is resolved as the embedder is created, so the enclosing execution must already be running by then.
 *
 * @returns An embedder computing the embedding of the text handed to it through the Gemini API
 *
 * @throws {@link !Error Error} If no execution is running, as the Gemini client is resolved from the enclosing one
 *
 * @throws {@link !RangeError RangeError} While embedding, if the text is blank
 *
 * @group Implementations
 */
export function createGoogleEmbedder(): Embedder {

	const ai = service(createGoogleAI);

	return async (text: Text): Promise<Embedding> => {

		if ( text.trim() === "" ) {
			throw new RangeError("expected non-blank text");
		}

		return time(async () => embedding(await ai.models.embedContent({

			model: Model,
			contents: text,

			config: {
				taskType: Task,
				outputDimensionality: Size
			}

		})), (value, elapsed) => logger.info
			`embedded <${report(text.length)}> chars as <${report(value.length)}> components in <${report(elapsed)}> ms`
		);

	};

}
