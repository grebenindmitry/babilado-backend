/*
 * Copyright (c) 2022. Dmitry Grebenin
 */

import { logger } from "./logger.js";
import { pool } from "./db.js";
import crypto from "crypto";
import { HttpException } from "./httpException.js";

export interface Session {
  id: string;
  expiryTime: number;
}

export class SessionManager {
  sessions = new Map<string, Session>();

  async createSession(userId: string, password: string): Promise<Session> {
    let existingSession = this.sessions.get(userId);

    if (existingSession !== undefined) {
      existingSession.expiryTime = Date.now() + 10 * 100000000 * 60;
      this.sessions.set(userId, existingSession);
      return existingSession;
    }

    try {
      let result = await pool.query({
        text: "SELECT password_hash = crypt($2, password_hash) AS check FROM users WHERE id=$1",
        values: [userId, password]
      });

      if (result.rows.length !== 0) {
        if (result.rows[0].check == true) {
          let session = { id: crypto.randomUUID(), expiryTime: Date.now() + 10 * 100000000 * 60 };
          this.sessions.set(userId, session);
          return session;
        }
      }
    } catch (err: any) {
      if (err instanceof HttpException) throw err;

      logger.error(`getSession: Error code: ${err.code}. Error stack:\n${err.stack}`);
      throw new HttpException("sessionManager", 500, "Internal error");
    }

    throw new HttpException("sessionManager", 401, "Invalid credentials");
  }

  verifySession(userId: string, sessionId: string) {
    let savedSession = this.sessions.get(userId);

    if (savedSession !== undefined)
      if (savedSession.id === sessionId && savedSession.expiryTime > Date.now()) return true;
    return false;
  }
}

export const sessionManager = new SessionManager();
