// src/pages/CallPage.jsx
import React, { useEffect, useReducer, useContext, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import socket from "../../socket";
import Peer from "simple-peer-light";
import { UserContext } from "../../UserContext";

import {
    BASE_URL,
    GET_CALL_ID,
    SAVE_CALL_ID,
} from "../../utils/apiEndpoints";
import { postRequest, getRequest } from "../../utils/apiRequests";
import { getCookie } from "../../utils/cookieUtils";

const initialState = [];
function usersReducer(state, action) {
    switch (action.type) {
        case "SET_USERS":
            return action.payload;
        default:
            return state;
    }
}


export default function CallPage() {
    const { id: roomId } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(UserContext);
    const [users, dispatch] = useReducer(usersReducer, initialState);

    const localVideoRef = useRef(null);
    const localStreamRef = useRef(null);

    const [peers, setPeers] = useState({});
    const [remoteStreams, setRemoteStreams] = useState({});

    useEffect(() => {
        if (!roomId || !user || !localStreamRef.current) return;

        const role = localStorage.getItem("role") || "guest";
        const token = getCookie("token");

        const joinRoomAPI = async () => {
            try {
                await postRequest(`${BASE_URL}${SAVE_CALL_ID}`, {
                    roomId,
                    username: user.name,
                    role,
                    token,
                });

                const res = await getRequest(`${BASE_URL}${GET_CALL_ID}?roomId=${roomId}`);
                if (!res.error && res.users) {
                    dispatch({ type: "SET_USERS", payload: res.users });
                }

                socket.emit("room:join", { roomId, username: user.name, role });
            } catch (err) {
                console.error("❌ API lỗi:", err);
            }
        };

        joinRoomAPI();

        const onUsers = (list) => {
            dispatch({ type: "SET_USERS", payload: list });
            list.forEach((u) => {
                if (u.id !== socket.id && !peers[u.id]) {
                    const peer = createPeer(true, u.id);
                    setPeers((prev) => ({ ...prev, [u.id]: peer }));
                }
            });
        };

        socket.on("room:users", onUsers);

        socket.on("webrtc:offer", ({ from, offer }) => {
            if (!peers[from]) {
                const peer = createPeer(false, from);
                setPeers((prev) => ({ ...prev, [from]: peer }));
                peer.signal(offer);
            } else {
                peers[from].signal(offer);
            }
        });

        socket.on("webrtc:answer", ({ from, answer }) => {
            peers[from]?.signal(answer);
        });

        socket.on("webrtc:ice-candidate", ({ from, candidate }) => {
            peers[from]?.signal(candidate);
        });

        return () => {
            socket.emit("room:leave", { roomId });
            socket.off("room:users", onUsers);
        };
    }, [roomId, user, localStreamRef.current]);

    useEffect(() => {
        const startStream = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true,
                });
                localStreamRef.current = stream;
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }
            } catch (e) {
                console.error("🚨 Không lấy được camera/mic:", e);
            }
        };
        startStream();
    }, []);

    const createPeer = (initiator, targetId) => {
        const peer = new Peer({
            initiator,
            trickle: true, // gửi ICE candidate ngay khi có
            stream: localStreamRef.current,
            config: {
                iceServers: [
                    { urls: "stun:stun.l.google.com:19302" }, // chỉ STUN cho LAN
                ],
            },
        });

        peer.on("signal", (data) => {
            if (data.type === "offer") {
                socket.emit("webrtc:offer", { to: targetId, offer: data });
            } else if (data.type === "answer") {
                socket.emit("webrtc:answer", { to: targetId, answer: data });
            } else if (data.candidate) {
                socket.emit("webrtc:ice-candidate", { to: targetId, candidate: data });
            }
        });

        peer.on("stream", (remoteStream) => {
            console.log("📹 Nhận remote stream từ", targetId);
            setRemoteStreams((prev) => ({
                ...prev,
                [targetId]: remoteStream,
            }));
        });

        return peer;
    };

    const isHost = (u) => u.role === "host";

    if (!user) {
        return (
            <div style={{ padding: 20 }}>
                <h2>🚨 Bạn cần đăng nhập để tham gia phòng</h2>
                <button onClick={() => navigate("/")}>⬅️ Quay lại</button>
            </div>
        );
    }

    return (
        <div style={{ padding: 20 }}>
            <h2>📹 Meeting Room: {roomId}</h2>

            <h4>🖥️ Màn hình của bạn</h4>
            <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                style={{ width: 250, border: "2px solid green", marginBottom: 10 }}
            />

            <h4>👥 Người trong phòng:</h4>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                {users.length === 0 && <div>⚠️ Chưa có ai trong phòng</div>}
                {users.map((u) =>
                    u.id !== socket.id ? (
                        <div key={u.id} style={{ textAlign: "center" }}>
                            <p>
                                {u.name} {isHost(u) ? "👑" : ""}
                            </p>
                            <video
                                autoPlay
                                playsInline
                                style={{ width: 250, border: "1px solid #ccc" }}
                                ref={(el) => {
                                    if (el && remoteStreams[u.id]) {
                                        el.srcObject = remoteStreams[u.id];
                                    }
                                }}
                            />
                        </div>
                    ) : null
                )}
            </div>

            <button onClick={() => navigate("/")}>⬅️ Rời phòng</button>
        </div>
    );
}
