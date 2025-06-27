import { WebSocketServer } from 'ws';

// const wss = new WebSocketServer({ port: 8080 });
const PORT = process.env.PORT || 8080;
const wss = new WebSocketServer({ port: PORT });

const rooms = new Map();

wss.on('connection', (ws) => {
  let currentRoomId = null;
  let role = null;

  ws.on('message', (data) => {
    let message;
    try {
      message = JSON.parse(data);
    } catch (err) {
      console.error('Invalid JSON:', err);
      return;
    }

    if (message.type === 'join') {
      const { roomId, role: userRole } = message;
      currentRoomId = roomId;
      role = userRole;

      if (!rooms.has(roomId)) {
        rooms.set(roomId, {});
      }

      const room = rooms.get(roomId);
      room[role] = ws;
      rooms.set(roomId, room);

      console.log(`[${roomId}] ${role} joined`);
      return;
    }

    if (!currentRoomId || !role) return;

    const room = rooms.get(currentRoomId);
    if (!room) return;

    // Route messages to the opposite peer
    const peer = role === 'sender' ? room.receiver : room.sender;
    if (peer && peer.readyState === WebSocket.OPEN) {
      peer.send(JSON.stringify(message));
    }
  });

  ws.on('close', () => {
    if (currentRoomId && role) {
      const room = rooms.get(currentRoomId);
      if (room && room[role] === ws) {
        delete room[role];
        if (!room.sender && !room.receiver) {
          rooms.delete(currentRoomId);
        }
      }
    }
  });

  ws.on('error', console.error);
});
