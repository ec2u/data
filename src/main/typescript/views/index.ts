/*
 * Copyright © 2020-2025 EC2U Alliance
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

import { isString } from "@metreeca/core/string";
import { Text } from "@metreeca/core/text";

// remove leading alliance name

export function ec2u(label: Text): Text ;
export function ec2u(label: string): string ;

export function ec2u(label: string | Text) {
	return isString(label)
		? label.replace(/^EC2U\s+/, "")
		: Object.entries(label).reduce((labels, [lang, text]) => ({ ...labels, [lang]: ec2u(text) }), {});
}
