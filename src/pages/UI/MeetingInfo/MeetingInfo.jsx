import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCopy,
  faTimes,
  faShieldAlt,
} from "@fortawesome/free-solid-svg-icons";
import "./MeetingInfo.scss";
import React from 'react';

const MeetingInfo = ({ setMeetInfoPopup }) => {
  const callId = localStorage.getItem("meetingID");
  const roomUrl = `${callId}`;

  return (
    <div className="meeting-info-block">
      <div className="meeting-header">
        <h3>Your meeting's ready</h3>
        <FontAwesomeIcon
          className="icon"
          icon={faTimes}
          onClick={() => {
            setMeetInfoPopup(false);
          }}
        />
      </div>
      <p className="info-text">
        Share this meeting link with others you want in the meeting
      </p>
      <div className="meet-link">
        <span>{roomUrl}</span>
        <FontAwesomeIcon
          className="icon"
          icon={faCopy}
          onClick={() => navigator.clipboard.writeText(roomUrl)}
        />
      </div>
      <div className="permission-text">
        <FontAwesomeIcon className="icon red" icon={faShieldAlt} />
        <p className="small-text">
          People who use this meeting link must get your permission before they
          can join.
        </p>
      </div>
    </div>
  );
};

export default MeetingInfo;
