import {Server} from "socket.io";
import jwt from "jsonwebtoken";
import Message from "../models/message.model.js";

export const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: [
        "https://spotify-clone-v1-fqb8.onrender.com",
        "http://localhost:3000",
      ],
      credentials: true,
    },
  });

  // Transition-window handshake auth: validate the Phase 2 session token if
  // present and trust that identity; if absent, fall back (temporarily) to
  // the legacy unauthenticated path so in-flight clients aren't dropped the
  // instant this ships, before every frontend client has the paired change
  // from Phase 4. Every fallback hit is logged so usage is trackable ahead
  // of removing the fallback for good (see plan.md Phase 3 step 3).
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;

    if (!token) {
      console.warn(
        `[socket-auth] legacy unauthenticated connection accepted (fallback) — socket ${socket.id}`
      );
      socket.data.userId = null;
      socket.data.legacy = true;
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.SESSION_JWT_SECRET);
      socket.data.userId = decoded.sub;
      socket.data.legacy = false;
      next();
    } catch (error) {
      console.error("[socket-auth] rejected invalid session token:", error.message);
      next(new Error("Invalid or expired session token"));
    }
  });

  const userSockets = new Map(); // { userId: socketId}
  const userActivities = new Map(); // {userId: activity}

  io.on("connection", (socket) => {
    // Trusted identity from the handshake takes priority; the legacy
    // fallback path still accepts a client-supplied id in "user_connected"
    // until the fallback is removed (Phase 3 step 3).
    socket.on("user_connected", (legacyUserId) => {
      const userId = socket.data.userId || legacyUserId;
      if (!userId) return;

      userSockets.set(userId, socket.id);
      userActivities.set(userId, "Idle");

      // broadcast to all connected sockets that this user just logged in
      io.emit("user_connected", userId);

      socket.emit("users_online", Array.from(userSockets.keys()));

      io.emit("activities", Array.from(userActivities.entries()));
    });

    socket.on("update_activity", ({userId: legacyUserId, activity}) => {
      const userId = socket.data.userId || legacyUserId;
      if (!userId) return;
      userActivities.set(userId, activity);
      io.emit("activity_updated", {userId, activity});
    });

    socket.on("send_message", async (data) => {
      try {
        const {receiverId, content} = data;
        // Trusted identity, not the client-supplied senderId, once available —
        // closes the spoofing gap the legacy fallback still leaves open.
        const senderId = socket.data.userId || data.senderId;
        if (!senderId) throw new Error("No sender identity for this connection");

        const message = await Message.create({
          senderId,
          receiverId,
          content,
        });

        // send to receiver in realtime, if they're online
        const receiverSocketId = userSockets.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("receive_message", message);
        }

        socket.emit("message_sent", message);
      } catch (error) {
        console.error("Message error:", error);
        socket.emit("message_error", error.message);
      }
    });

    socket.on("disconnect", () => {
      let disconnectedUserId;
      for (const [userId, socketId] of userSockets.entries()) {
        // find disconnected user
        if (socketId === socket.id) {
          disconnectedUserId = userId;
          userSockets.delete(userId);
          userActivities.delete(userId);
          break;
        }
      }
      if (disconnectedUserId) {
        io.emit("user_disconnected", disconnectedUserId);
      }
    });
  });
};
