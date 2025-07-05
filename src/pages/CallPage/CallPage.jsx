import { useEffect, useReducer, useRef, useState } from "react";
import { useParams, useNavigate } from 'react-router-dom';
import { getRequest, postRequest } from "./../../utils/apiRequests";
import {
    BASE_URL,
    GET_CALL_ID,
    SAVE_CALL_ID,
} from "../../utils/apiEndpoints";
import socket from "../../socket";
import Peer from "simple-peer-light";
import "./CallPage.scss";
import Messenger from "./../UI/Messenger/Messenger";
import MessageListReducer from "../../reducers/MessageListReducer";
import Alert from "../UI/Alert/Alert";
import MeetingInfo from "../UI/MeetingInfo/MeetingInfo";
import CallPageFooter from "../UI/CallPageFooter/CallPageFooter";

const initialState = [];

const CallPage = () => {
    const peerRef = useRef(null);
    const navigate = useNavigate();
    const { id } = useParams();
    const isAdmin = window.location.hash === "#init";
    const url = `${window.location.origin}${window.location.pathname}`;
    const videoRef = useRef(null);
    let alertTimeout = null;

    const [messageList, messageListReducer] = useReducer(
        MessageListReducer,
        initialState
    );

    const [streamObj, setStreamObj] = useState();
    const [screenCastStream, setScreenCastStream] = useState();
    const [meetInfoPopup, setMeetInfoPopup] = useState(false);
    const [isPresenting, setIsPresenting] = useState(false);
    const [isMessenger, setIsMessenger] = useState(false);
    const [messageAlert, setMessageAlert] = useState({});
    const [isAudio, setIsAudio] = useState(true);
    const [isVideo, setIsVideo] = useState(true);
    const [isPeerConnected, setIsPeerConnected] = useState(false);

    useEffect(() => {
        if (isAdmin) {
            setMeetInfoPopup(true);
        }
        initWebRTC();

        socket.on("code", (data) => {
            if (data.url === url && peerRef.current) {
                peerRef.current.signal(data.code);
            }
        });
    }, []);

    const getRecieverCode = async () => {
        const response = await getRequest(`${BASE_URL}${GET_CALL_ID}/${id}`);
        if (response.code) {
            peerRef.current.signal(response.code);
        }
    };

    const initWebRTC = () => {
        navigator.mediaDevices
            .getUserMedia({ video: true, audio: true })
            .then((stream) => {
                setStreamObj(stream);

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.onloadedmetadata = () => {
                        videoRef.current.play().catch((err) => {
                            console.warn("Autoplay error:", err);
                        });
                    };
                }

                peerRef.current = new Peer({
                    initiator: isAdmin,
                    trickle: false,
                    stream: stream,
                });

                if (!isAdmin) {
                    getRecieverCode();
                }

                peerRef.current.on("signal", async (data) => {
                    if (isAdmin) {
                        let payload = { id, signalData: data };
                        await postRequest(`${BASE_URL}${SAVE_CALL_ID}`, payload);
                    } else {
                        socket.emit("code", { code: data, url }, () => {
                            console.log("code sent");
                        });
                    }
                });

                peerRef.current.on("connect", () => {
                    console.log("Peer connected!");
                    setIsPeerConnected(true);
                });

                peerRef.current.on("data", (data) => {
                    console.log("Received message:", data.toString());

                    clearTimeout(alertTimeout);
                    messageListReducer({
                        type: "addMessage",
                        payload: {
                            user: "other",
                            msg: data.toString(),
                            time: Date.now(),
                        },
                    });

                    setMessageAlert({
                        alert: true,
                        isPopup: true,
                        payload: {
                            user: "other",
                            msg: data.toString(),
                        },
                    });

                    alertTimeout = setTimeout(() => {
                        setMessageAlert({
                            ...messageAlert,
                            isPopup: false,
                            payload: {},
                        });
                    }, 10000);
                });

                peerRef.current.on("stream", (remoteStream) => {
                    console.log("Remote stream received");
                });
            })
            .catch((err) => {
                console.error("getUserMedia error", err);
            });
    };

    const sendMsg = (msg) => {
        if (isPeerConnected && peerRef.current) {
            peerRef.current.send(msg);
            messageListReducer({
                type: "addMessage",
                payload: {
                    user: "you",
                    msg: msg,
                    time: Date.now(),
                },
            });
        } else {
            console.warn("Cannot send: Peer connection not ready.");
        }
    };

    const screenShare = () => {
        navigator.mediaDevices
            .getDisplayMedia({ cursor: true })
            .then((screenStream) => {
                peerRef.current.replaceTrack(
                    streamObj.getVideoTracks()[0],
                    screenStream.getVideoTracks()[0],
                    streamObj
                );
                setScreenCastStream(screenStream);

                screenStream.getTracks()[0].onended = () => {
                    peerRef.current.replaceTrack(
                        screenStream.getVideoTracks()[0],
                        streamObj.getVideoTracks()[0],
                        streamObj
                    );
                };

                setIsPresenting(true);
            })
            .catch((err) => {
                console.warn("User cancelled screen share or error occurred:", err);
            });
    };

    const stopScreenShare = () => {
        screenCastStream.getVideoTracks().forEach((track) => track.stop());
        peerRef.current.replaceTrack(
            screenCastStream.getVideoTracks()[0],
            streamObj.getVideoTracks()[0],
            streamObj
        );
        setIsPresenting(false);
    };

    const toggleAudio = (value) => {
        streamObj.getAudioTracks()[0].enabled = value;
        setIsAudio(value);
    };

    const toggleVideo = (state) => {
        setIsVideo(state);
        if (videoRef.current) {
            videoRef.current.srcObject.getVideoTracks().forEach(track => {
                track.enabled = state;
            });
        }
    };

    const disconnectCall = () => {
        if (peerRef.current) {
            peerRef.current.destroy();
        }
        navigate("/");
        window.location.reload();
    };

    return (
        <div className="callpage-container">
            <video
                className="video-container"
                ref={videoRef}
                autoPlay
                playsInline
                muted
            />

            <div className="call-footer">
                <CallPageFooter
                    isPresenting={isPresenting}
                    stopScreenShare={stopScreenShare}
                    screenShare={screenShare}
                    isAudio={isAudio}
                    toggleAudio={toggleAudio}
                    disconnectCall={disconnectCall}
                    isMessenger={isMessenger}
                    setIsMessenger={setIsMessenger}
                    messageAlert={messageAlert}
                    setMessageAlert={setMessageAlert}
                    isVideo={isVideo}
                    toggleVideo={toggleVideo}
                    setMeetInfoPopup={setMeetInfoPopup}
                    meetInfoPopup={meetInfoPopup}
                    isAdmin={isAdmin}
                />
            </div>

            {isAdmin && meetInfoPopup && (
                <div className="meeting-info">
                    <MeetingInfo setMeetInfoPopup={setMeetInfoPopup} url={url} />
                </div>
            )}

            {isMessenger ? (
                <div className="messenger">
                    <Messenger
                        setIsMessenger={setIsMessenger}
                        sendMsg={sendMsg}
                        messageList={messageList}
                        disabled={!isPeerConnected} // optional
                    />
                </div>
            ) : (
                messageAlert.isPopup && (
                    <div className="popup">
                        <Alert messageAlert={messageAlert} />
                    </div>
                )
            )}
        </div>
    );
};

export default CallPage;
