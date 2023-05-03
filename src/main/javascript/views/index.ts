/*
 * Copyright © 2020-2023 EC2U Alliance
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

import { Local } from "@metreeca/core/local";
import { isString } from "@metreeca/core/string";

// remove leading alliance name

export function ec2u(label: Local): Local ;
export function ec2u(label: string): string ;

export function ec2u(label: string | Local) {
	return isString(label)
		? label.replace(/^EC2U\s+/, "")
		: Object.entries(label).reduce((labels, [lang, text]) => ({ ...labels, [lang]: ec2u(text) }), {});
}
