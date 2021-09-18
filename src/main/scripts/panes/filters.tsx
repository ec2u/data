/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

import * as React from "react";
import { Filter } from "../@metreeca/tool/tiles/icon";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function DataFiltersButton({

	onClick

}: {

	onClick: () => void

}) {

	return <button title={"Filters"} onClick={onClick}><Filter/></button>;

}
