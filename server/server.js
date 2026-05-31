import http from "http";
import { Server } from "socket.io";

const PORT = process.env.PORT || 3001;

const server = http.createServer();

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log("🔌 WebSocket connecté :", socket.id);

  // --- ROOM SYSTEM ---
  socket.on("setup", (userId) => {
    socket.join(userId);
    console.log("👤 Utilisateur connecté à la room :", userId);
  });

  // --- STATUS ---
  socket.on("user-online", (username) => {
    io.emit("update-status", { username, online: true });
  });

  socket.on("user-offline", (username) => {
    io.emit("update-status", { username, online: false });
  });

  // --- CALL SIGNALING ---
  socket.on("call-user", ({ from, to }) => {
    console.log(`📞 ${from} appelle ${to}`);
    io.to(to).emit("incoming-call", { from });
  });

  socket.on("call-declined", ({ from, to }) => {
    io.to(from).emit("call-declined");
  });

  socket.on("call-accepted", ({ from, to }) => {
    io.to(from).emit("call-accepted");
  });

  // --- WEBRTC SIGNALING ---
  socket.on("webrtc-offer", ({ to, offer }) => {
    console.log("📡 Offer envoyée à :", to);
    io.to(to).emit("webrtc-offer", { offer });
  });

  socket.on("webrtc-answer", ({ to, answer }) => {
    console.log("📡 Answer envoyée à :", to);
    io.to(to).emit("webrtc-answer", { answer });
  });

  socket.on("webrtc-ice-candidate", ({ to, candidate }) => {
    io.to(to).emit("webrtc-ice-candidate", { candidate });
  });

  // --- HANGUP ---
  socket.on("hangup", ({ to }) => {
    console.log("❌ Raccroché");
    io.to(to).emit("hangup");
  });

  socket.on("disconnect", () => {
    console.log("🔌 Déconnecté :", socket.id);
  });
});

server.listen(PORT, () => {
  console.log("🚀 Socket.io en ligne sur le port " + PORT);
});
