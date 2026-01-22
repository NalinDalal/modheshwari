const server = Bun.serve({
  port: 3000,

  fetch(req, server) {
    if (server.upgrade(req)) {
      return; // upgraded to WebSocket
    }
    return new Response("WS server running");
  },

  websocket: {
    open(ws) {
      console.log("client connected");
      ws.send("hello from bun");
    },

    message(ws, message) {
      console.log("received:", message.toString());
      ws.send(`echo: ${message}`);
    },

    close(ws) {
      console.log("client disconnected");
    },
  },
});

console.log(`Listening on ws://localhost:${server.port}`);

