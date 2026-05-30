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
  console.log("🔌 WebSocket connecté");

  // Quand un utilisateur se connecte, il rejoint sa room
  socket.on("setup", (userId) => {
    socket.join(userId);
    console.log("👤 Utilisateur connecté à la room :", userId);
  });

  // Statut en ligne / hors ligne
  socket.on("user-online", (username) => {
    io.emit("update-status", { username, online: true });
  });

  socket.on("user-offline", (username) => {
    io.emit("update-status", { username, online: false });
  });

  // 📞 Quand un utilisateur appelle un ami
  socket.on("call-user", ({ from, to }) => {
    console.log(`📞 ${from} appelle ${to}`);
    io.to(to).emit("incoming-call", { from });
  });

  // ❌ Quand l'appel est refusé
  socket.on("call-declined", ({ from, to }) => {
    io.to(from).emit("call-declined");
  });

  // ✔️ Quand l'appel est accepté
  socket.on("call-accepted", ({ from, to }) => {
    io.to(from).emit("call-accepted");
  });
});

server.listen(PORT, () => {
  console.log("🚀 Socket.io en ligne sur le port " + PORT);
});
