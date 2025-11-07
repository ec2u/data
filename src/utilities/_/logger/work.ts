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


import { Level, log, simple, Sink } from "@/utilities/_/logger/index";

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

log({

	console: simple(),

	"": {
		level: Level.info,
		pipe: upper,
		sink: "console"
	}

});


function upper(sink: Sink): Sink {
	return (path: string, level: Level, message: TemplateStringsArray, values: unknown[]) => {
		const parts = message.map(s => s.toUpperCase());
		const uppercased = Object.assign(parts, { raw: message.raw.map(s => s.toUpperCase()) });
		sink(path, level, uppercased as TemplateStringsArray, values);
	};
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const logger = log(import.meta.url);


function work() {

	logger.info`ciao!`;
	logger.warning`this is a warning`;

	logger.info`ciao ${() => "heavy"}!`;


	// Test with function value that gets executed
	let counter = 0;
	const getValue = () => ++counter;

	logger.info`count: ${getValue}`;
	logger.info`count: ${getValue}`;

}

work();
