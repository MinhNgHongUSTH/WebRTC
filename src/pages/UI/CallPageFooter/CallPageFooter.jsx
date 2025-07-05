import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faVideo,
  faMicrophone,
  faPhone,
  faDesktop,
  faMicrophoneSlash,
  faUserFriends,
  faUserPlus,
  faCommentAlt,
  faVideoSlash
} from "@fortawesome/free-solid-svg-icons";
import "./CallPageFooter.scss";
import { useState, useEffect } from "react";
import { formatDate } from "../../../utils/helpers";


const CallPageFooter = ({
  isPresenting,
  stopScreenShare,
  screenShare,
  isAudio,
  toggleAudio,
  isVideo,
  toggleVideo,
  disconnectCall,
  isMessenger,
  setIsMessenger,
  messageAlert,
  setMessageAlert,
  setMeetInfoPopup,
}) => {

  const [showMeetingInfo, setShowMeetingInfo] = useState(false);

  let interval = null;
  const [currentTime, setCurrentTime] = useState(() => {
    return formatDate();
  });

  useEffect(() => {
    interval = setInterval(() => setCurrentTime(formatDate()), 1000);
    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="footer-item">
      <div className="left-item">
        <div className="date-block" style={{ color: "white", marginLeft: "50px" }}>{currentTime}</div>
      </div>

      <div className="center-item">

        <div
          className={`icon-block ${!isAudio ? "red-bg" : null}`}
          onClick={() => toggleAudio(!isAudio)}
        >
          <FontAwesomeIcon
            className="icon"
            icon={isAudio ? faMicrophone : faMicrophoneSlash}
          />
        </div>

        <div className="icon-block" onClick={disconnectCall}>
          <FontAwesomeIcon className="icon red" icon={faPhone} />
        </div>

        <div
          className={`icon-block ${!isVideo ? "red-bg" : null}`}
          onClick={() => toggleVideo(!isVideo)}
        >
          <FontAwesomeIcon
            className="icon"
            icon={isVideo ? faVideo : faVideoSlash}
          />
        </div>

      </div>

      <div className="right-item">

        <div
          className="icon-block"
          onClick={() => setMeetInfoPopup(true)}
          style={{ cursor: "pointer" }}
        >
          <FontAwesomeIcon className="icon" icon={faUserPlus} />
        </div>

        <div className="icon-block">
          <FontAwesomeIcon className="icon" icon={faUserFriends} />
        </div>

        <div
          className="icon-block"
          onClick={() => {
            setIsMessenger(true);
            setMessageAlert({});
          }}
        >
          <FontAwesomeIcon className="icon" icon={faCommentAlt} />
          {!isMessenger && messageAlert.alert && (
            <span className="alert-circle-icon"></span>
          )}
        </div>

        {isPresenting ? (
          <div className="icon-block" style={{ color: "black", background: "#fff" }} onClick={stopScreenShare}>
            <FontAwesomeIcon className="icon red" icon={faDesktop} />
          </div>
        ) : (
          <div className="icon-block" onClick={screenShare}>
            <FontAwesomeIcon className="icon red" icon={faDesktop} />
          </div>
        )}

      </div>

    </div>
  );
};

export default CallPageFooter;
