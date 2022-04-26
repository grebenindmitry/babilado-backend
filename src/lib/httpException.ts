/*
 * Copyright (c) 2022. Dmitry Grebenin
 */

import { logger } from "./logger.js";

export class HttpException {
  code: number;
  message: string;

  constructor(tag: string, code: number, message: string = "") {
    this.code = code;
    this.message = message;

    if (code >= 200 && code < 300) logger.info(`${tag}: ${message}`);
    else if (code >= 400 && code < 500) logger.warn(`${tag}: ${message}`);
  }
}
