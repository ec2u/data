/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

import { Custom } from "@metreeca/tile/tiles/custom";
import { RefreshCw } from "preact-feather";
import "./loader.less";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export interface Props {

	size?: string
	color?: string
	period?: string

}

export default function ToolLoader({

	size="1em",
	color="#CCC",
	period="1.5s"

}: Props) {

	return (
		<Custom tag="tool-loader">

			<RefreshCw style={{ // @ts-ignore

				"--tool-loader-size": size,
				"--tool-loader-color": color,
				"--tool-loader-period": period

			}}/>

		</Custom>
	);

}
