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

import { HeapCache } from "./cache";
import { Artifact, pipe } from "./pipe";

const label="test";
const cache=HeapCache<Artifact>();

pipe("ciao!", { label: label, cache })
	.then(function x(d) {
		console.log("x(%s)", d);
		return d;
	})
	.then(function y(d) {
		console.log("y(%s)", d);
		return d;
	})
	.then(function z(d) {
		console.log("z(%s)", d);
		return d;
	})
	.then(d => console.log(d))

	.then(() => {


		pipe("ciao!", { label, cache })
			.then(function x(d) {
				console.log("x(%s)", d);
				return d;
			})
			.then(function y(d) {
				console.log("y(%s)", d);
				return d;
			})
			.then(function z(d) {
				console.log("z(%s)", d);
				return d;
			})
			.then(d => console.log(d));

	});
