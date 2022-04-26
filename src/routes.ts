/*
 * Copyright (c) 2022. Dmitry Grebenin
 */

import express from "express";
import * as messages from "./lib/messages.js";
import * as sessions from "./lib/sessions.js";
import * as users from "./lib/users.js";
import { sessionManager } from "./lib/sessionManager.js";
import { logger } from "./lib/logger.js";
const router = express.Router();
const uuidRegex = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";

router.use(express.json());

// getUserById
// Params: userId (path)
// Return value:
// {
//   id: 'c4fa9444-37d4-4757-9947-05c32b5fd79a',
//   username: DGrebenin
// }
// Error codes: 400 - Invalid parameters, 404 - User not found, 500 - Internal error
router.get("/users/:userId([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})", (request, response) => {
  users
    .getUserById(request.params.userId)
    .then(result => response.json(result))
    .catch(err => response.status(err.code).json({ message: err.message }));
});

// getUserByUsername (session-protected)
// Params: username (path)
// Return value:
// {
//   id: 'c4fa9444-37d4-4757-9947-05c32b5fd79a',
//	 username: DGrebenin
// }
// Error codes: 400- Inavalid parameters, 401 - Unautorized, 404 - User not found, 500 - Internal error
router.get("/users/:username", (req, res) => {
  let userId = req.headers["userid"];
  let sessionId = req.headers["sessionid"];

  if (typeof userId !== "string" || typeof sessionId !== "string") {
    logger.warn("getUser: Unauthorized");
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  if (!sessionManager.verifySession(userId, sessionId)) {
    logger.warn("getUser: Unauthorized");
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  users
    .getUserByUsername(req.params.username)
    .then(result => res.json(result))
    .catch(err => res.status(err.code).json({ message: err.message }));
});

// getConversations (session-protected)
// Params: userId (path)
// Return value:
// [
//   {
//	   id: 'c4fa9444-37d4-4757-9947-05c32b5fd79a',
//	   username: DGrebenin,
//     lastMsg: {Message}
//	 },...
// ]
// Error codes: 401 - Unautorized, 404 - Conversations not found, 500 - Internal error
router.get(`/users/:userId(${uuidRegex})/conversations`, (req, res) => {
  let userId = req.headers["userid"];
  let sessionId = req.headers["sessionid"];

  if (typeof userId !== "string" || typeof sessionId !== "string") {
    logger.warn("getConversations: Unauthorized");
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  if (!sessionManager.verifySession(userId, sessionId)) {
    logger.warn("getConversations: Unauthorized");
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  users
    .getConversations(req.params.userId)
    .then(result => res.json(result))
    .catch(err => res.status(err.code).json({ message: err.message }));
});

// createUser
// Params: username (body.json), password (body.json)
// Return value:
// {
//   id: 'c4fa9444-37d4-4757-9947-05c32b5fd79a',
//   username: DGrebenin
// }
// Error codes: 400 - Invalid parameters, 409 - User already exists, 500 - Internal error
router.post("/users", (req, res) => {
  let username = req.body["username"];
  let password = req.body["password"];

  if (typeof username !== "string" || typeof password !== "string") {
    logger.warn("createUser: Invalid parameters");
    res.status(400).json({ message: "Invalid parameters" });
    return;
  }

  users
    .createUser(username, password)
    .then(result => res.json(result))
    .catch(err => res.status(err.code).json({ message: err.message }));
});

// getSession
// Params: username (header), password (header)
// Return value:
// {
//   id: "c4fa9444-37d4-4757-9947-05c32b5fd79a",
//	 user: {User}
//	 expiryTime: 991661400
// }
// Error codes: 400 - Invalid parameters, 401 - Invalid credentials, 500 - Internal error
router.get("/session", (req, res) => {
  let username = req.headers["username"];
  let password = req.headers["password"];

  if (typeof username !== "string" || typeof password !== "string") {
    logger.warn("getSession: Invalid parameters");
    res.status(400).json({ message: "Invalid parameters" });
    return;
  }

  sessions
    .getSession(username, password)
    .then(result => res.json(result))
    .catch(err => res.status(err.code).json({ message: err.message }));
});

// sendMessage (session-protected)
// Params: recipient (body.json), msg_data (body.json), [time_sent (body.json), msg_type (body.json)]
// Return value:
// {
//   message: "Message sent"
// }
// Error codes: 400 - Invalid parameters, 401 - Unautorized, 500 - Internal error
router.post("/message", (req, res) => {
  let userId = req.headers["userid"];
  let sessionId = req.headers["sessionid"];

  let recipient = req.body["recipient"];
  let msg_data = req.body["msg_data"];
  let time_sent = req.body["time_sent"];
  let msg_type = req.body["msg_type"]

  if (typeof userId !== "string" || typeof sessionId !== "string") {
    logger.warn("sendMessage: Unauthorized");
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  if (!sessionManager.verifySession(userId, sessionId)) {
    logger.warn("sendMessage: Unauthorized");
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  if (typeof recipient !== "string" || typeof msg_data !== "string") {
    logger.warn("sendMessage: Invalid parameters");
    res.status(400).json({ message: "Invalid parameters" });
    return;
  }

  if (typeof msg_type !== "number" && msg_type != undefined) {
    logger.warn("sendMessage: Invalid parameters");
    res.status(400).json({ message: "Invalid parameters" });
    return;
  }

  messages
    .sendMessage(userId, recipient, msg_data, time_sent, msg_type)
    .then(result => res.json(result))
    .catch(err => res.status(err.code).json({ message: err.message }));
});

// getMessages (session-protected)
// Params: recipient (query)
// Return value:
// [
//   {
//     id: 'c4fabbbbb-37d4-4757-9947-05c32b5fd79a',
//     sender: 'c4fa9444-37d4-4757-9947-05c32b5fd79a',
//     recipient: 'c4fa9444-37d4-4757-9947-05c32b5fd79a',
//     msg_data: 'Hello There',
//     msg_type: 0,
//     time_sent: 991661400
//   },...
// ]
// Error codes: 400 - Invalid parameters, 401 - Unautorized, 404 - Conversation not found, 500 - Internal error
router.get(`/messages`, (req, res) => {
  let userId = req.headers["userid"];
  let sessionId = req.headers["sessionid"];
  let recipient = req.query["recipient"];

  if (typeof userId !== "string" || typeof sessionId !== "string") {
    logger.warn("getMessages: Unauthorized");
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  if (!sessionManager.verifySession(userId, sessionId)) {
    logger.warn("getMessages: Unauthorized");
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  if (typeof recipient !== "string") {
    logger.warn("getMessages: Invalid parameters");
    res.status(400).json({ message: "Invalid parameters" });
    return;
  }

  messages
    .getMessages(userId, recipient)
    .then(result => res.json(result))
    .catch(err => res.status(err.code).json({ message: err.message }));
});

// getLastMessage (session-protected)
// Params: recipient (query)
// Return value:
// [
//   {
//     id: 'c4fabbbbb-37d4-4757-9947-05c32b5fd79a',
//     sender: 'c4fa9444-37d4-4757-9947-05c32b5fd79a',
//     recipient: 'c4fa9444-37d4-4757-9947-05c32b5fd79a',
//     msg_data: 'Hello There',
//     msg_type: 0,
//     time_sent: 991661400
//   },...
// ]
// Error codes: 400 - Invalid parameters, 401 - Unautorized, 404 - Conversation not found, 500 - Internal error
router.get(`/messages/last`, (req, res) => {
  let userId = req.headers["userid"];
  let sessionId = req.headers["sessionid"];
  let recipient = req.query["recipient"];

  if (typeof userId !== "string" || typeof sessionId !== "string") {
    logger.warn("getLastMessage: Unauthorized");
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  if (!sessionManager.verifySession(userId, sessionId)) {
    logger.warn("getLastMessage: Unauthorized");
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  if (typeof recipient !== "string") {
    logger.warn("getLastMessage: Invalid parameters");
    res.status(400).json({ message: "Invalid parameters" });
    return;
  }

  messages
    .getLastMessage(userId, recipient)
    .then(result => res.json(result))
    .catch(err => res.status(err.code).json({ message: err.message }));
});

export default router;
