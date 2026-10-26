/*
 * Copyright © 2020-2026 EC2U Alliance
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

import { Datasets } from "@ec2u/data-shared/datasets/index.js";
import { type Driver, driver } from "@metreeca/gate/driver";


export function datasets(): Driver {

	return driver(Datasets).lookup({

		model: { resources: { ">=issued": "0001-01-01" } } // !!! "!issued": [null] (metreeca/qest#26)

	});

}
