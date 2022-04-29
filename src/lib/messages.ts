/*
 * Copyright (c) 2022. Dmitry Grebenin
 */

import { logger } from "./logger.js";
import { pool } from "./db.js";
import { HttpException } from "./httpException.js";
import { wsUsers } from "./ws.js";

export class Message {
  id: string;
  sender: string;
  recipient: string;
  msg_data: any;
  msg_type: number;
  time_sent: number;

  constructor(
    id: string,
    sender: string | null,
    recipient: string,
    msg_data: string,
    msg_type: number | null,
    time_sent: number
  ) {
    this.id = id;
    this.sender = sender || "";
    this.recipient = recipient;
    this.msg_data = msg_data;
    this.msg_type = msg_type || 0;
    this.time_sent = time_sent;
  }
}

export async function sendMessage(
  sender: string,
  recipient: string,
  data: string,
  time_sent: number = Date.now(),
  type: number
): Promise<Message> {
  const tag: string = "sendMessage";

  try {
    let result = await pool.query(
      `INSERT INTO messages (sender, recipient, msg_data, time_sent, msg_type) VALUES ($1, $2, $3, $4, $5) RETURNING *;`,
      [sender, recipient, data, time_sent, type]
    );

    let message = new Message(
      result.rows[0]["id"],
      sender,
      recipient,
      data,
      result.rows[0]["msg_type"],
      result.rows[0]["time_sent"]
    );

    if (wsUsers[message.recipient] != undefined) {
      wsUsers[message.recipient]!.send(
        JSON.stringify({
          type: "newMessage",
          newMessage: message
        })
      );
    }

    if (wsUsers[message.sender] != undefined) {
      wsUsers[message.sender]!.send(
        JSON.stringify({
          type: "newMessage",
          newMessage: message
        })
      );
    }

    logger.info("sendMessage(%s, %s)", sender, recipient);
    return message;
  } catch (err: any) {
    if (err instanceof HttpException) throw err;

    if (err.code === "23503") throw new HttpException(tag, 400, "The sender or recipient does not exist");

    logger.error("sendMessage: Error code: %s. Error stack:\n%s", err.code, err.stack);
    throw new HttpException(tag, 500, "Failed to send message (internal error)");
  }
}

export async function getMessages(user1: string, user2: string) {
  const tag = "getMessages";

  try {
    let result = await pool.query(
      `SELECT id, sender, recipient, msg_data, msg_type, time_sent FROM messages
            WHERE sender = $1 AND recipient = $2 OR sender = $2 AND recipient = $1 ORDER BY time_sent DESC;`,
      [user1, user2]
    );

    if (result.rows.length === 0)
      throw new HttpException(tag, 404, `Conversation between ${user1} and ${user2} not found`);

    logger.info("getMessages: %s, %s", user1, user2);
    return result.rows;
  } catch (err: any) {
    if (err instanceof HttpException) throw err;

    logger.error("getMessages: Error code %s. Error stack:\n%s", err.code, err.stack);
    throw new HttpException(tag, 500, "Failed to access messages (internal error)");
  }
}

export async function getLastMessage(user1: string, user2: string) {
  const tag = "getLastMessage";

  try {
    let result = await pool.query(
      `SELECT id, sender, recipient, msg_data, msg_type, time_sent FROM messages
            WHERE sender = $1 AND recipient = $2 OR sender = $2 AND recipient = $1 ORDER BY time_sent DESC LIMIT 1;`,
      [user1, user2]
    );

    if (result.rows.length === 0)
      throw new HttpException(tag, 404, `Conversation between ${user1} and ${user2} not found`);

    logger.info("getMessages: %s, %s", user1, user2);
    return result.rows[0];
  } catch (err: any) {
    if (err instanceof HttpException) throw err;

    logger.error("getMessages: Error code %s. Error stack:\n%s", err.code, err.stack);
    throw new HttpException(tag, 500, "Failed to access messages (internal error)");
  }
}
