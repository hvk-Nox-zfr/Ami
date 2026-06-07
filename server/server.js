import http from "http";
import { Server } from "socket.io";
import Message from "../models/Message.js"; // ← adapte le chemin

const PORT = process.env.PORT || 3001;

const server = http.createServer();

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// Map username -> socket.id
const users = {};

io.on("connection", (socket) => {
  console.log("🔌 WebSocket connecté :", socket.id);

  // --- ROOM SYSTEM ---
  socket.on("setup", (username) => {
    users[username] = socket.id;
    socket.join(username);
    console.log("👤 Utilisateur connecté :", username);
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

    if (!users[to]) {
      console.log("❌ Utilisateur introuvable :", to);
      return;
    }

    io.to(users[to]).emit("incoming-call", { from });
  });

  socket.on("call-declined", ({ from, to }) => {
    if (!users[from]) return;
    io.to(users[from]).emit("call-declined", { from: to });
  });

  socket.on("call-accepted", ({ from, to }) => {
    console.log(`✅ ${from} accepte l’appel de ${to}`);

    if (!users[to]) return;

    io.to(users[to]).emit("call-accepted", { from });
  });

  // --- WEBRTC SIGNALING ---
  socket.on("webrtc-offer", ({ to, offer, from }) => {
    if (!users[to]) return;
    io.to(users[to]).emit("webrtc-offer", { offer, from });
  });

  socket.on("webrtc-answer", ({ to, answer, from }) => {
    if (!users[to]) return;
    io.to(users[to]).emit("webrtc-answer", { answer, from });
  });

  socket.on("webrtc-ice-candidate", ({ to, candidate, from }) => {
    if (!users[to]) return;
    io.to(users[to]).emit("webrtc-ice-candidate", { candidate, from });
  });

  // --- HANGUP ---
  socket.on("hangup", ({ to, from }) => {
    if (!users[to]) return;
    io.to(users[to]).emit("hangup", { from });
  });

  // --- MESSAGES (NOUVEAU, IMPORTANT) ---
  socket.on("send-message", async (msg) => {
    const { from, to, text, time } = msg;

    console.log(`💬 Message de ${from} → ${to} : ${text}`);

    // 1. Sauvegarde en base
    try {
      await Message.create({
        sender: from,
        receiver: to,
        text,
        timestamp: time,
      });
    } catch (err) {
      console.error("❌ Erreur DB message :", err);
    }

    // 2. Envoi au destinataire
    if (users[to]) {
      io.to(users[to]).emit("new-message", msg);
    }

    // 3. Envoi à l’expéditeur (pour affichage instantané)
    if (users[from]) {
      io.to(users[from]).emit("new-message", msg);
    }
  });

  // --- DISCONNECT ---
  socket.on("disconnect", () => {
    console.log("🔌 Déconnecté :", socket.id);

    for (const username in users) {
      if (users[username] === socket.id) {
        delete users[username];
        io.emit("update-status", { username, online: false });
        break;
      }
    }
  });
});

server.listen(PORT, () => {
  console.log("🚀 Socket.io en ligne sur le port " + PORT);
});
