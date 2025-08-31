import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faVideo, faKeyboard } from "@fortawesome/free-solid-svg-icons";
import shortid from "shortid";
import "./HomePage.scss";
import Header from "../UI/Header/Header";
import { useContext, useRef } from "react"; 
import { UserContext } from "../../UserContext"; 

const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useContext(UserContext); 
  const inputRef = useRef(null);

  const startCall = () => {
    const uid = shortid.generate();
    localStorage.setItem("meetingID", uid); 
    localStorage.setItem("role", "host");
    navigate(`/meeting/${uid}`);
  };

  const joinMeeting = () => {
    const id = inputRef.current.value.trim();
    if (!id) return;

    let roomId = id;
    try {
      const url = new URL(id);
      roomId = url.pathname.split("/").pop();
    } catch (e) {
    }

    localStorage.setItem("meetingID", roomId);
    localStorage.setItem("role", "guest"); 
    navigate(`/meeting/${roomId}`);
  };

  return (
    <div className="home-page">
      <Header />
      <div className="body">
        <div className="left-side">
          <div className="content">
            <h2>Premium video meetings. Now free for everyone.</h2>
            <p>
              We re-engineered the service we built for secure business
              meetings, Google Meet, to make it free and available for all.
            </p>

            {user ? (
              <div className="action-btn">
                <button className="btn green" onClick={startCall}>
                  <FontAwesomeIcon className="icon-block" icon={faVideo} />
                  New Meeting
                </button>
                <div className="input-block">
                  <div className="input-section">
                    <FontAwesomeIcon className="icon-block" icon={faKeyboard} />
                    <input
                      type="text"
                      ref={inputRef}
                      placeholder="Enter a code or link"
                      onKeyDown={(e) => e.key === "Enter" && joinMeeting()}
                    />
                  </div>
                  <button className="btn no-bg" onClick={joinMeeting}>Join</button>
                </div>
              </div>
            ) : (
              <p><i>Please sign in to start or join a meeting.</i></p>
            )}
          </div>
        </div>

        <div className="right-side">
          <div className="content">
            <img src="https://www.gstatic.com/meet/google_meet_marketing_ongoing_meeting_grid_427cbb32d746b1d0133b898b50115e96.jpg" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
