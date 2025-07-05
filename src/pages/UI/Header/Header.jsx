import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";
import './Header.scss';
import { useContext } from "react";
import { jwtDecode } from "jwt-decode";
import { db } from "../../../firebaseConfig";
import { doc, setDoc, getDocs, collection, getDoc } from "firebase/firestore";
import { GoogleLogin, googleLogout } from "@react-oauth/google";
import { UserContext } from "../../../UserContext";
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const { user, setUser, isAdmin, setIsAdmin } = useContext(UserContext);
  const navigate = useNavigate();

  const handleCallbackResponse = async (response) => {
    const userObject = jwtDecode(response.credential);
    setUser(userObject);

    document.cookie = `uid=${userObject.sub}; path=/; max-age=3600`;
    document.cookie = `email=${userObject.email}; path=/; max-age=3600`;
    document.cookie = `name=${encodeURIComponent(userObject.name)}; path=/; max-age=3600`;

    // Save session
    sessionStorage.setItem("loggedIn", "true");

    const now = new Date();
    const formatted = now.toLocaleString("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh"
    });

    const userRef = doc(db, "users", userObject.sub);
    const snapshot = await getDocs(collection(db, "users"));
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();

      if (userData.admin === "daylaAdmin") {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }

      await setDoc(userRef, {
        ...userData,
        date: formatted
      }, { merge: true });
    } else {
      const uids = snapshot.docs
        .map(doc => doc.data().uid)
        .filter(uid => typeof uid === "number");
      const nextUid = uids.length > 0 ? Math.max(...uids) + 1 : 1;

      await setDoc(userRef, {
        uid: nextUid,
        name: userObject.name,
        email: userObject.email,
        date: formatted
      });

      setIsAdmin(false); 
    }
  };

  const dashboard = () => {
    navigate(`/dashboard`);
  };

  const handleLogout = () => {
    googleLogout();
    setUser(null);
    setIsAdmin(false);
    localStorage.removeItem("googleUser");
    sessionStorage.removeItem("loggedIn");
    document.cookie = "uid=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    document.cookie = "email=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    document.cookie = "name=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
  };

  return (
    <div className="header">
      <div className="logo">
        <img
          src="https://www.gstatic.com/meet/google_meet_horizontal_wordmark_2020q4_2x_icon_124_40_292e71bcb52a56e2a9005164118f183b.png"
          alt="Google Meet Logo"
        />
      </div>

      <div className="action-btn">
        {user ? (
          <div className="user-info" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {isAdmin && (
              <FontAwesomeIcon
                className="icon-block icon-user"
                icon={faUser}
                onClick={dashboard}
                style={{ cursor: "pointer" }}
              />
            )}
            <p>Hello {user.name}</p>
            <div id="signOutButton">
              <button onClick={handleLogout} className="btn-logout">
                Đăng xuất
              </button>
            </div>
          </div>
        ) : (
          <div id="signInButton">
            <GoogleLogin
              onSuccess={handleCallbackResponse}
              cookiePolicy={'single_host_origin'}
              useOneTap
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Header;
