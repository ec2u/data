/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

import { Filter } from "@metreeca/tool/tiles/icon";
import * as React from "react";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function DataFiltersButton({

	onClick

}: {

	onClick: () => void

}) {

	return <button title={"Filters"} onClick={onClick}><Filter/></button>;

}
