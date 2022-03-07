/*
 * Copyright © 2022 EC2U Consortium. All rights reserved.
 */

import express, { Request, Response } from "express";


const data=express();
const port=process.env.PORT || 8080;


data

    .get("/", (req: Request, res: Response) => {
        res.send("Hello World!");
    })

    .listen(port, () => {
        console.info(`listening on port ${port}`);
    });