import { WebSocketServer, type WebSocket } from "ws";
import type { Server } from "node:http";

const leagueSubs = new Map<string, Set<WebSocket>>();
let wss: WebSocketServer | null = null;
const PING_INTERVAL_MS = 30000;

export function initWs(server: Server): void {
  wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (request, socket, head) => {
    const path = request.url?.split("?")[0];
    if (path === "/ws") {
      wss!.handleUpgrade(request, socket, head, (ws) => {
        wss!.emit("connection", ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  wss.on("connection", (ws: WebSocket) => {
    const pingInterval = setInterval(() => {
      if (ws.readyState === ws.OPEN) {
        ws.ping();
      }
    }, PING_INTERVAL_MS);

    ws.on("message", (data: Buffer) => {
      try {
        const msg = JSON.parse(data.toString()) as {
          type?: string;
          leagueId?: string;
        };
        if (msg.type === "subscribe" && typeof msg.leagueId === "string") {
          const leagueId = msg.leagueId;
          if (!leagueSubs.has(leagueId)) leagueSubs.set(leagueId, new Set());
          leagueSubs.get(leagueId)!.add(ws);
        }
      } catch {
        // ignore invalid JSON
      }
    });

    ws.on("close", () => {
      clearInterval(pingInterval);
      for (const set of leagueSubs.values()) {
        set.delete(ws);
      }
    });

    ws.on("pong", () => {
      // heartbeat ok
    });
  });
}

export function broadcast(
  leagueId: string,
  event: Record<string, unknown>,
): void {
  const clients = leagueSubs.get(leagueId);
  if (!clients) return;
  const msg = JSON.stringify(event);
  for (const client of clients) {
    if (client.readyState === 1) {
      try {
        client.send(msg);
      } catch {
        // ignore
      }
    }
  }
}
