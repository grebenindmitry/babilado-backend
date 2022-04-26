import { sessionManager } from "./sessionManager.js";
import { WebSocket, Server as WSServer } from "ws";
import { Server as HTTPServer } from "http";
import { sendMessage, Message } from "./messages.js";
import { logger } from "./logger.js";

export let wsUsers: { [userId: string]: WebSocket | undefined } = {};

const wsServer = new WSServer({ noServer: true });

export function bindWStoServer(server: HTTPServer) {
  server.on("upgrade", (req, ws, head) => {
    if (typeof req.headers["userid"] === "string" && typeof req.headers["sessionid"] === "string") {
      let userId = req.headers["userid"];
      let sessionId = req.headers["sessionid"];
      if (sessionManager.verifySession(userId, sessionId)) {
        wsServer.handleUpgrade(req, ws, head, ws => {
          wsServer.emit("connection", ws, req);
          wsUsers[userId] = ws;

          ws.on("message", data => {
            let req = JSON.parse(data.toString());

            if (req.newMessage != null) {
              let newMessage: Message = req.newMessage;
              sendMessage(userId, newMessage.recipient, newMessage.msg_data, newMessage.time_sent)
                .then(result => ws.send(JSON.stringify({ type: "newMessage", newMessage: result })))
                .catch(err => {  });
            }
          });

          ws.on("close", (code, reason) => {
            wsUsers[userId] = undefined
          })
        });
        return;
      }
    }

    ws.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
    ws.destroy();
    return;
  });
}
