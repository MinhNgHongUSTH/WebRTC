import { useEffect, useRef, useState } from "react";
import "./Messenger.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTimes,
  faUserFriends,
  faCommentAlt,
  faPaperPlane,
} from "@fortawesome/free-solid-svg-icons";
import { formatDate } from "../../../utils/helpers";

const Messenger = ({ setIsMessenger, sendMsg, messageList }) => {
  const [msg, setMsg] = useState("");
  const chatEndRef = useRef(null);

  const handleChangeMsg = (e) => {
    setMsg(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && msg.trim()) {
      sendMsg(msg);
      setMsg("");
    }
  };

  const handleSendMsg = () => {
    if (msg.trim()) {
      sendMsg(msg);
      setMsg("");
    }
  };

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messageList]);

  return (
    <div className="messenger-container">
      <div className="messenger-header">
        <h3>Meeting details</h3>
        <FontAwesomeIcon
          className="icon"
          icon={faTimes}
          onClick={() => {
            setIsMessenger(false);
          }}
        />
      </div>

      <div className="messenger-header-tabs">
        <div className="tab">
          <FontAwesomeIcon className="icon" icon={faUserFriends} />
          <p>People</p>
        </div>
        <div className="tab active">
          <FontAwesomeIcon className="icon" icon={faCommentAlt} />
          <p>Chat</p>
        </div>
      </div>

      <div className="chat-section">
        {messageList.map((item) => (
          <div
            key={item.time}
            className={`chat-block ${item.user === "you" ? "self" : ""}`}
          >
            <div className="sender">
              {item.user === "you" ? "You" : item.user}{" "}
              <small>{formatDate(item.time)}</small>
            </div>
            <p className="msg">{item.msg}</p>
          </div>
        ))}
        <div ref={chatEndRef}></div>
      </div>

      <div className="send-msg-section">
        <input
          placeholder="Send a message to everyone"
          value={msg}
          onChange={handleChangeMsg}
          onKeyDown={handleKeyDown}
        />
        <FontAwesomeIcon
          className="icon"
          icon={faPaperPlane}
          onClick={handleSendMsg}
        />
      </div>
    </div>
  );
};

export default Messenger;
