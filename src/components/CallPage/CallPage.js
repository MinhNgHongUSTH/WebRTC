import { useEffect, useReducer, useRef, useState } from "react";
import { useParams, useNavigate } from 'react-router-dom';
import { getRequest, postRequest } from "./../../utils/apiRequests";
import {
    BASE_URL,
    GET_CALL_ID,
    SAVE_CALL_ID,
} from "./../../utils/apiEndpoints";
import io from "socket.io-client";
import Peer from "simple-peer";
import "./CallPage.scss";
import Messenger from "./../UI/Messenger/Messenger";
import MessageListReducer from "../../reducers/MessageListReducer";
import Alert from "../UI/Alert/Alert";
import MeetingInfo from "../UI/MeetingInfo/MeetingInfo";
import CallPageFooter from "../UI/CallPageFooter/CallPageFooter";
import CallPageHeader from "../UI/CallPageHeader/CallPageHeader";

let peer = null;
const socket = io.connect(process.env.REACT_APP_BASE_URL);
const initialState = [];

const CallPage = () => {
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

    useEffect(() => {
        if (isAdmin) {
            setMeetInfoPopup(true);
        }
        initWebRTC();

        socket.on("code", (data) => {
            if (data.url === url) {
                peer.signal(data.code);
            }
        });
    }, []);

    const getRecieverCode = async () => {
        const response = await getRequest(`${BASE_URL}${GET_CALL_ID}/${id}`);
        if (response.code) {
            peer.signal(response.code);
        }
    };

    const initWebRTC = () => {
        navigator.mediaDevices
            .getUserMedia({
                video: true,
                audio: true,
            })
            .then((stream) => {
                setStreamObj(stream);

                // Hiển thị local stream
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.onloadedmetadata = () => {
                        videoRef.current.play().catch((err) => {
                            console.warn("Autoplay error:", err);
                        });
                    };
                }

                peer = new Peer({
                    initiator: isAdmin,
                    trickle: false,
                    stream: stream,
                });

                if (!isAdmin) {
                    getRecieverCode();
                }

                peer.on("signal", async (data) => {
                    if (isAdmin) {
                        let payload = {
                            id,
                            signalData: data,
                        };
                        await postRequest(`${BASE_URL}${SAVE_CALL_ID}`, payload);
                    } else {
                        socket.emit("code", { code: data, url }, () => {
                            console.log("code sent");
                        });
                    }
                });

                peer.on("connect", () => {
                    console.log("connected");
                });

                peer.on("data", (data) => {
                console.log("Received message:", data.toString()); // debug

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

                peer.on("stream", (remoteStream) => {
                    console.log("Remote stream received");
                });

            })
            .catch((err) => {
                console.error("getUserMedia error", err);
            });
    };

    const sendMsg = (msg) => {
        peer.send(msg);
        messageListReducer({
            type: "addMessage",
            payload: {
            user: "you",
            msg: msg,
            time: Date.now(),
            },
        });
    };

    const screenShare = () => {
    navigator.mediaDevices
        .getDisplayMedia({ cursor: true })
        .then((screenStream) => {
        peer.replaceTrack(
            streamObj.getVideoTracks()[0],
            screenStream.getVideoTracks()[0],
            streamObj
        );
        setScreenCastStream(screenStream);

        screenStream.getTracks()[0].onended = () => {
            peer.replaceTrack(
            screenStream.getVideoTracks()[0],
            streamObj.getVideoTracks()[0],
            streamObj
            );
        };

        setIsPresenting(true);
        })
        .catch((err) => {
        console.warn("User cancelled screen share or error occurred:", err);
        // Optionally, you can also show a message or toast here
        });
    };


    const stopScreenShare = () => {
        screenCastStream.getVideoTracks().forEach(function (track) {
            track.stop();
        });
        peer.replaceTrack(
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

    const disconnectCall = () => {
        peer.destroy();
        navigate("/"); // ✅ dùng navigate("/") thay vì navigate.push
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

            <CallPageHeader
                isMessenger={isMessenger}
                setIsMessenger={setIsMessenger}
                messageAlert={messageAlert}
                setMessageAlert={setMessageAlert}
            />
            <CallPageFooter
                isPresenting={isPresenting}
                stopScreenShare={stopScreenShare}
                screenShare={screenShare}
                isAudio={isAudio}
                toggleAudio={toggleAudio}
                disconnectCall={disconnectCall}
            />

            {isAdmin && meetInfoPopup && (
                <MeetingInfo setMeetInfoPopup={setMeetInfoPopup} url={url} />
            )}
            {isMessenger ? (
                <Messenger
                    setIsMessenger={setIsMessenger}
                    sendMsg={sendMsg}
                    messageList={messageList}
                />
            ) : (
                messageAlert.isPopup && <Alert messageAlert={messageAlert} />
            )}
        </div>
    );
};

export default CallPage;
