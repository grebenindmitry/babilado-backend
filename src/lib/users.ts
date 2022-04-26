/*
 * Copyright (c) 2022. Dmitry Grebenin
 */

import { logger } from "./logger.js";
import { pool } from "./db.js";
import { HttpException } from "./httpException.js";
import { getLastMessage } from "./messages.js";

interface User {
  id: string;
  username: string;
}

export async function getUserById(userId: string): Promise<User> {
  let tag = "getUserById";

  try {
    let userQuery = await pool.query("SELECT id, username FROM users WHERE id=$1", [userId]);

    if (userQuery.rows.length === 0) throw new HttpException(tag, 404, `${userId} not found`);

    let uId = userQuery.rows[0]['id'];
    let uName = userQuery.rows[0]['username'];

    if (typeof uId !== "string" || typeof uName !== "string") {
      logger.error(`${tag}: Inconsistent return from db`);
      throw new HttpException(tag, 500, "Failed to get user (internal error)");
    }

    logger.info(`${tag}: %s`, userId);
    return { id: uId, username: uName };
  } catch (err: any) {
    if (err instanceof HttpException) throw err;

    logger.error(`${tag}: Error code %s. Error stack:\n%s`, err.code, err.stack);
    throw new HttpException(tag, 500, "Failed to get user (internal error)");
  }
}

export async function getUserByUsername(username: string): Promise<User> {
  let tag = "getUserByUsername";

  try {
    let userQuery = await pool.query("SELECT id, username FROM users WHERE username=$1", [username]);

    if (userQuery.rows.length === 0) throw new HttpException(tag, 404, `${username} not found`);

    let uId = userQuery.rows[0]['id'];
    let uName = userQuery.rows[0]['username'];

    if (typeof uId !== "string" || typeof uName !== "string") {
      logger.error(`${tag}: Inconsistent return from db`);
      throw new HttpException(tag, 500, "Failed to get user (internal error)");
    }

    logger.info(`${tag}: %s`, uId);
    return { id: uId, username: uName };
  } catch (err: any) {
    if (err instanceof HttpException) throw err;

    logger.error(`${tag}: Error code %s. Error stack:\n%s`, err.code, err.stack);
    throw new HttpException(tag, 500, "Failed to get user (internal error)");
  }
}

export async function getConversations(userId: string) {
  const tag = "getConversations";

  try {
    let conversationsQuery = await pool.query(
      `SELECT sender AS id, username FROM messages 
            LEFT JOIN users ON users.id = messages.sender WHERE recipient = $1
                UNION
            SELECT recipient AS id, username FROM messages
            LEFT JOIN users ON users.id = messages.recipient WHERE sender = $1;`,
      [userId]
    );

    if (conversationsQuery.rows.length === 0) throw new HttpException(tag, 404, `No conversations for ${userId} found`);

    let conversations = [];

    for (const conversation of conversationsQuery.rows) {
      try {
        let lastMessage = await getLastMessage(userId, conversation.id);
        conversations.push({ user: conversation, lastMsg: lastMessage });
      } catch (err) {
        if (err instanceof HttpException) throw err;
      }
    }

    logger.info(`${tag}: ${userId}`);
    return conversations;
  } catch (err: any) {
    if (err instanceof HttpException) throw err;
    else {
      logger.error(`${tag}: Error code %s. Error stack:\n%s`, err.code, err.stack);
      throw new HttpException(tag, 500, "Failed to get conversations (internal error)");
    }
  }
}

export async function createUser(username: string, password: string) {
  let tag = "createUser";

  try {
    let userQuery = await pool.query(
      "INSERT INTO users (username, password_hash) VALUES ($1, crypt($2, gen_salt('bf'))) RETURNING id, username",
      [username, password]
    );

    logger.info("createUser(%o)", userQuery.rows[0]);
    return userQuery.rows[0];
  } catch (err: any) {
    if (err instanceof HttpException) throw err;
    if (err.code === "23505") throw new HttpException(tag, 409, `${username} already exists`);

    logger.error("createUser: Error code : %s. Error stack:\n%s", err.code, err.stack);
    throw new HttpException(tag, 500, "Failed to create user (internal error)");
  }
}
