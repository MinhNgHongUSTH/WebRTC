// socket.js
import { io } from "socket.io-client";

const socket = io("http://localhost:4000", {
  withCredentials: true, // ✅ gửi cookie session kèm request
  transports: ["websocket", "polling"], // fallback
});

export default socket;
