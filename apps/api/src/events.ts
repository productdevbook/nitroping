import { DurableObject } from "cloudflare:workers";

export type ProjectEvent = { type: string; feedbackId?: string; projectId: string; createdAt: string };

export class ProjectEventStream extends DurableObject {
  private readonly sockets = new Set<WebSocket>();

  async fetch(request: Request): Promise<Response> {
    if (request.headers.get("upgrade")?.toLowerCase() !== "websocket") return new Response("WebSocket upgrade required", { status: 426 });
    const pair = new WebSocketPair();
    const socket = pair[1];
    socket.accept();
    this.sockets.add(socket);
    socket.addEventListener("close", () => this.sockets.delete(socket));
    socket.addEventListener("error", () => this.sockets.delete(socket));
    socket.send(JSON.stringify({ type: "connected", createdAt: new Date().toISOString() }));
    return new Response(null, { status: 101, webSocket: pair[0] });
  }

  publish(event: ProjectEvent): void {
    const payload = JSON.stringify(event);
    for (const socket of this.sockets) {
      try { socket.send(payload); } catch { this.sockets.delete(socket); }
    }
  }
}
