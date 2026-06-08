import express from "express";
import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import Message from "./models/Message.js";

// 🔔 IMPORTS MANQUANTS
import webpush from "web-push";
import fetch from "node-fetch";

const PORT = process.env.PORT || 3001;

// ----------------------
// 🔗 CONNEXION MONGODB
// ----------------------
mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 5000,
})
.then(() => console.log("📦 MongoDB connecté"))
.catch(err => console.error("❌ Erreur MongoDB :", err));

// ----------------------
// 🔔 CONFIG WEB-PUSH
// ----------------------
webpush.setVapidDetails(
  "mailto:tonmail@example.com",
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// ----------------------
// 🚀 EXPRESS POUR RENDER
// ----------------------
const app = express();

app.get("/", (req, res) => {
  res.send("Socket.io server is running");
});

// ----------------------
// 🔥 SERVEUR HTTP
// ----------------------
const server = http.createServer(app);

// ----------------------
// 🔥 SOCKET.IO
// ----------------------
const io = new Server(server, {
  cors: { origin: "*" },
  transports: ["websocket"],
  pingInterval: 25000,
  pingTimeout: 60000,
});

// Map username -> socket.id
const users = {};

// ----------------------
// 🔔 ENVOI PUSH
// ----------------------
async function sendPush(username, msg) {
  try {
    const res = await fetch("https://ami-zeta.vercel.app/api/push/get", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });

    const data = await res.json();
    const subscription = data.subscription;

    if (!subscription) {
      console.log("❌ Aucun abonnement push pour", username);
      return;
    }

    await webpush.sendNotification(
      subscription,
      JSON.stringify({
        title: msg.from,
        body: msg.text,
      })
    );

    console.log("📨 Push envoyée à", username);
  } catch (err) {
    console.error("❌ Erreur envoi push :", err);
  }
}

// ----------------------
// 🔥 SOCKET.IO EVENTS
// ----------------------
io.on("connection", (socket) => {
  console.log("🔌 WebSocket connecté :", socket.id);

  socket.on("setup", (username) => {
    users[username] = socket.id;
    socket.join(username);
    console.log("👤 Utilisateur connecté :", username);
  });

  socket.on("user-online", (username) => {
    io.emit("update-status", { username, online: true });
  });

  socket.on("user-offline", (username) => {
    io.emit("update-status", { username, online: false });
  });

  socket.on("call-user", ({ from, to }) => {
    if (users[to]) io.to(users[to]).emit("incoming-call", { from });
  });

  socket.on("call-declined", ({ from, to }) => {
    if (users[from]) io.to(users[from]).emit("call-declined", { from: to });
  });

  socket.on("call-accepted", ({ from, to }) => {
    if (users[to]) io.to(users[to]).emit("call-accepted", { from });
  });

  socket.on("webrtc-offer", ({ to, offer, from }) => {
    if (users[to]) io.to(users[to]).emit("webrtc-offer", { offer, from });
  });

  socket.on("webrtc-answer", ({ to, answer, from }) => {
    if (users[to]) io.to(users[to]).emit("webrtc-answer", { answer, from });
  });

  socket.on("webrtc-ice-candidate", ({ to, candidate, from }) => {
    if (users[to]) io.to(users[to]).emit("webrtc-ice-candidate", { candidate, from });
  });

  socket.on("hangup", ({ to, from }) => {
    if (users[to]) io.to(users[to]).emit("hangup", { from });
  });

  // ----------------------
  // 💬 MESSAGES
  // ----------------------
  socket.on("send-message", async (msg) => {
    const { from, to, text, time } = msg;

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

    if (users[to]) {
      io.to(users[to]).emit("new-message", msg);
    }

    // 🔔 ENVOI PUSH
    await sendPush(to, msg);
  });

  socket.on("disconnect", () => {
    for (const username in users) {
      if (users[username] === socket.id) {
        delete users[username];
        io.emit("update-status", { username, online: false });
        break;
      }
    }
  });
});

// ----------------------
// 🚀 LANCEMENT SERVEUR
// ----------------------
server.listen(PORT, () => {
  console.log("🚀 Socket.io en ligne sur le port " + PORT);
});
