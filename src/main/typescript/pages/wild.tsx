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

import { Datasets } from "@ec2u/data/pages/datasets/datasets";
import { DataPage, NotFound } from "@ec2u/data/views/page";
import { immutable } from "@metreeca/core";
import { useRouter } from "@metreeca/data/contexts/router";
import { TileHint } from "@metreeca/view/widgets/hint";
import { CancelIcon, NotFoundIcon } from "@metreeca/view/widgets/icon";
import { useEffect } from "react";


export const Wild=immutable({

	id: "*",
	label: { "*": "" }

});


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export default function DataWild() {

	const [, setRoute]=useRouter();


	useEffect(() => { setRoute({ title: "Not Found" }); }, []);


	function dismiss() {
		setRoute(Datasets.id, true);
	}


	return (

		<DataPage name={NotFound}

			menu={<button title="Remove from History" onClick={dismiss}><CancelIcon/></button>}

		>

			<TileHint><NotFoundIcon/></TileHint>

		</DataPage>

	);

}
