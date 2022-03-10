/*
 * Copyright © 2022 EC2U Consortium. All rights reserved.
 */

import { DataHome } from "@ec2u/data/client/pages/home";
import "@metreeca/skin/index.css";
import * as React from "react";
import { render } from "react-dom";
import "./index.css";


render((

    <React.StrictMode>

        <DataHome/>

    </React.StrictMode>

), document.body.firstElementChild);

