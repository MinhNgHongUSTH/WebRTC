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

// In-memory fallback storage when Redis is not available
const memoryStore = {
    rooms: new Map(), // roomId -> Set of socketIds
    users: new Map(), // socketId -> user data
};

let useRedis = false;
let redis = null;
let redisConnectionAttempted = false;

// Function to initialize Redis connection
async function initializeRedis() {
    if (redisConnectionAttempted) return;
    redisConnectionAttempted = true;

    try {
        redis = new Redis({
            retryDelayOnFailover: 100,
            lazyConnect: true,
            enableOfflineQueue: false, // Prevent queuing commands when disconnected
            connectTimeout: 3000,
            maxRetriesPerRequest: 0, // Don't retry failed requests
        });

        // Only set up event listeners once
        redis.on('connect', () => {
            console.log('✅ Redis connected successfully');
            useRedis = true;
        });

        redis.on('error', () => {
            if (useRedis) {
                console.warn('⚠️ Redis connection lost, switching to memory storage');
                useRedis = false;
            }
        });

        // Try to connect
        await redis.connect();
        useRedis = true;
    } catch {
        console.warn('⚠️ Redis not available, using in-memory storage');
        useRedis = false;
        redis = null;
    }
}

// Initialize Redis connection
initializeRedis(); 

// Helpers
async function getRoomUsers(roomId) {
    if (useRedis && redis) {
        try {
            const ids = await redis.smembers(`room:${roomId}:sockets`);
            if (ids.length === 0) return [];

            const pipeline = redis.pipeline();
            ids.forEach((sid) => pipeline.hgetall(`user:${sid}`));
            const results = await pipeline.exec();

            return results
                .map(([, data]) => data)
                .filter((u) => u && u.id)
                .map((u) => ({ id: u.id, name: u.name, role: u.role }));
        } catch {
            console.warn('Redis error in getRoomUsers, falling back to memory');
            useRedis = false;
        }
    }
    
    // Memory fallback
    const roomSockets = memoryStore.rooms.get(roomId) || new Set();
    const users = [];
    for (const socketId of roomSockets) {
        const user = memoryStore.users.get(socketId);
        if (user) {
            users.push({ id: user.id, name: user.name, role: user.role });
        }
    }
    return users;
}

async function broadcastRoomUsers(roomId) {
    const users = await getRoomUsers(roomId);
    io.to(roomId).emit("room:users", users);
}

app.post("/api/save-call-id", async (req, res) => {
    const { roomId, username, role } = req.body;
    // validate token ở đây nếu cần
    const fakeId = Date.now().toString(); // hoặc dùng socket.id sau này
    
    if (useRedis && redis) {
        try {
            await redis.sadd(`room:${roomId}:users`, JSON.stringify({ id: fakeId, name: username, role }));
        } catch {
            console.warn('Redis error in save-call-id, falling back to memory');
            useRedis = false;
        }
    }
    
    if (!useRedis || !redis) {
        // Memory fallback - store in a separate structure for API calls
        if (!memoryStore.apiUsers) memoryStore.apiUsers = new Map();
        if (!memoryStore.apiUsers.has(roomId)) {
            memoryStore.apiUsers.set(roomId, new Set());
        }
        memoryStore.apiUsers.get(roomId).add(JSON.stringify({ id: fakeId, name: username, role }));
    }
    
    res.json({ success: true });
});

app.get("/api/get-call-id", async (req, res) => {
    const { roomId } = req.query;
    let users = [];
    
    if (useRedis && redis) {
        try {
            const ids = await redis.smembers(`room:${roomId}:users`);
            users = ids.map((u) => JSON.parse(u));
        } catch {
            console.warn('Redis error in get-call-id, falling back to memory');
            useRedis = false;
        }
    }
    
    if (!useRedis || !redis) {
        // Memory fallback
        if (!memoryStore.apiUsers) memoryStore.apiUsers = new Map();
        const roomUsers = memoryStore.apiUsers.get(roomId) || new Set();
        users = Array.from(roomUsers).map((u) => JSON.parse(u));
    }
    
    res.json({ users });
});

// Socket handlers
io.on("connection", (socket) => {
    console.log("🔌 Connected:", socket.id);

    socket.on("room:join", async ({ roomId, username, role = "guest" }) => {
        try {
            socket.join(roomId);

            const userData = {
                id: socket.id,
                name: username,
                role,
                roomId,
            };

            if (useRedis && redis) {
                try {
                    await redis.hset(`user:${socket.id}`, userData);
                    await redis.sadd(`room:${roomId}:sockets`, socket.id);
                } catch {
                    console.warn('Redis error in room:join, falling back to memory');
                    useRedis = false;
                }
            }
            
            if (!useRedis || !redis) {
                // Memory fallback
                memoryStore.users.set(socket.id, userData);
                if (!memoryStore.rooms.has(roomId)) {
                    memoryStore.rooms.set(roomId, new Set());
                }
                memoryStore.rooms.get(roomId).add(socket.id);
            }

            await broadcastRoomUsers(roomId);
            console.log(`✅ ${username} (${role}) joined ${roomId}`);
        } catch (e) {
            console.error("room:join error:", e);
        }
    });

    socket.on("room:leave", async ({ roomId }) => {
        try {
            if (useRedis && redis) {
                try {
                    await redis.srem(`room:${roomId}:sockets`, socket.id);
                    await redis.del(`user:${socket.id}`);
                } catch {
                    console.warn('Redis error in room:leave, falling back to memory');
                    useRedis = false;
                }
            }
            
            if (!useRedis || !redis) {
                // Memory fallback
                const roomSockets = memoryStore.rooms.get(roomId);
                if (roomSockets) {
                    roomSockets.delete(socket.id);
                    if (roomSockets.size === 0) {
                        memoryStore.rooms.delete(roomId);
                    }
                }
                memoryStore.users.delete(socket.id);
            }
            
            socket.leave(roomId);
            await broadcastRoomUsers(roomId);
            console.log(`↩️ ${socket.id} left ${roomId}`);
        } catch (e) {
            console.error("room:leave error:", e);
        }
    });

    socket.on("disconnecting", async () => {
        try {
            let user = null;
            
            if (useRedis && redis) {
                try {
                    user = await redis.hgetall(`user:${socket.id}`);
                    if (user && user.roomId) {
                        await redis.srem(`room:${user.roomId}:sockets`, socket.id);
                        await redis.del(`user:${socket.id}`);
                    }
                } catch {
                    console.warn('Redis error in disconnecting, falling back to memory');
                    useRedis = false;
                }
            }
            
            if (!useRedis || !redis) {
                // Memory fallback
                user = memoryStore.users.get(socket.id);
                if (user && user.roomId) {
                    const roomSockets = memoryStore.rooms.get(user.roomId);
                    if (roomSockets) {
                        roomSockets.delete(socket.id);
                        if (roomSockets.size === 0) {
                            memoryStore.rooms.delete(user.roomId);
                        }
                    }
                }
                memoryStore.users.delete(socket.id);
            }
            
            if (user && user.roomId) {
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
