/*
 * Copyright (c) 2022. Dmitry Grebenin
 */

import { logger } from "./logger.js";
import { sessionManager } from "./sessionManager.js";
import { HttpException } from "./httpException.js";
import { getUserByUsername } from "./users.js";

export async function getSession(username: string, password: string) {
  const tag = "getSession";

  try {
    let user = await getUserByUsername(username);
    let session = await sessionManager.createSession(user.id, password);

    logger.info(`getSession: ${user.id}`);
    return { id: session.id, user: user, expiryTime: session.expiryTime };
  } catch (err: any) {
    if (err instanceof HttpException) throw err;

    logger.error("sendMessage: Error code: %s. Error stack:\n%s", err.code, err.stack);
    throw new HttpException(tag, 500, "Failed to send message (internal error)");
  }
}
