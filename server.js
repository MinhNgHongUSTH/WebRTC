// server/server.js
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import Redis from "ioredis";
import cors from "cors";

const app = express();
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true,
    },
});

const redis = new Redis(); 

// Helpers
async function getRoomUsers(roomId) {
    const ids = await redis.smembers(`room:${roomId}:sockets`);
    if (ids.length === 0) return [];

    const pipeline = redis.pipeline();
    ids.forEach((sid) => pipeline.hgetall(`user:${sid}`));
    const results = await pipeline.exec();

    return results
        .map(([, data]) => data)
        .filter((u) => u && u.id)
        .map((u) => ({ id: u.id, name: u.name, role: u.role }));
}

async function broadcastRoomUsers(roomId) {
    const users = await getRoomUsers(roomId);
    io.to(roomId).emit("room:users", users);
}

app.post("/api/save-call-id", async (req, res) => {
    const { roomId, username, role, token } = req.body;
    // validate token ở đây nếu cần
    const fakeId = Date.now().toString(); // hoặc dùng socket.id sau này
    await redis.sadd(`room:${roomId}:users`, JSON.stringify({ id: fakeId, name: username, role }));
    res.json({ success: true });
});

app.get("/api/get-call-id", async (req, res) => {
    const { roomId } = req.query;
    const ids = await redis.smembers(`room:${roomId}:users`);
    res.json({ users: ids.map((u) => JSON.parse(u)) });
});

// Socket handlers
io.on("connection", (socket) => {
    console.log("🔌 Connected:", socket.id);

    socket.on("room:join", async ({ roomId, username, role = "guest" }) => {
        try {
            socket.join(roomId);

            await redis.hset(`user:${socket.id}`, {
                id: socket.id,
                name: username,
                role,
                roomId,
            });

            await redis.sadd(`room:${roomId}:sockets`, socket.id);

            await broadcastRoomUsers(roomId);
            console.log(`✅ ${username} (${role}) joined ${roomId}`);
        } catch (e) {
            console.error("room:join error:", e);
        }
    });

    socket.on("room:leave", async ({ roomId }) => {
        try {
            await redis.srem(`room:${roomId}:sockets`, socket.id);
            await redis.del(`user:${socket.id}`);
            socket.leave(roomId);

            await broadcastRoomUsers(roomId);
            console.log(`↩️ ${socket.id} left ${roomId}`);
        } catch (e) {
            console.error("room:leave error:", e);
        }
    });

    socket.on("disconnecting", async () => {
        try {
            const user = await redis.hgetall(`user:${socket.id}`);
            if (user && user.roomId) {
                await redis.srem(`room:${user.roomId}:sockets`, socket.id);
                await redis.del(`user:${socket.id}`);
                await broadcastRoomUsers(user.roomId);
            }
        } catch (e) {
            console.error("disconnecting error:", e);
        }
    });

    socket.on("disconnect", () => {
        console.log("❌ Disconnected:", socket.id);
    });

    // WebRTC signaling relay
    socket.on("webrtc:offer", ({ to, offer }) => {
        io.to(to).emit("webrtc:offer", { from: socket.id, offer });
    });

    socket.on("webrtc:answer", ({ to, answer }) => {
        io.to(to).emit("webrtc:answer", { from: socket.id, answer });
    });

    socket.on("webrtc:ice-candidate", ({ to, candidate }) => {
        io.to(to).emit("webrtc:ice-candidate", { from: socket.id, candidate });
    });

});

// Start server
httpServer.listen(4000, () => {
    console.log("✅ Socket server running on http://localhost:4000");
});
