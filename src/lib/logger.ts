/*
 * Copyright (c) 2022. Dmitry Grebenin
 */

import pino from "pino";
import pretty from "pino-pretty";
import fs from "fs";

const logPath = "log";
const loggerStreams = [
	{stream: fs.createWriteStream(`${logPath}`)},
	{stream: pretty({translateTime: "SYS:yyyy-mm-dd HH:MM:ss.l", ignore: "pid,hostname"})}
];

export const logger = pino({level: "debug"}, pino.multistream(loggerStreams));