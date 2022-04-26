/*
 * Copyright (c) 2022. Dmitry Grebenin
 */

import express from "express";
import { logger } from "./lib/logger.js";
import { bindWStoServer } from "./lib/ws.js";
import router from "./routes.js";

const app = express();
const port = process.env.PORT || 5000;

app.use("/api", router);

const server = app.listen(port, () => logger.info(`Listening at ${port}`));

bindWStoServer(server)