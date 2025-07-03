import { createContext, useEffect, useState } from "react";
import { getCookie } from "./utils/cookieUtils";
import { db } from "./firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const loggedIn = sessionStorage.getItem("loggedIn");

    if (!loggedIn) {
      // Xóa cookie nếu không còn session
      document.cookie = "uid=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
      document.cookie = "email=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
      document.cookie = "name=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
      return;
    }

    const uid = getCookie("uid");
    const email = getCookie("email");
    const name = getCookie("name");

    if (uid && email && name) {
      setUser({ sub: uid, email, name });

      // ✅ Kiểm tra quyền admin từ Firestore
      const checkAdmin = async () => {
        const userRef = doc(db, "users", uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.admin === "daylaAdmin") {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
          }
        }
      };

      checkAdmin();
    }
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, isAdmin, setIsAdmin }}>
      {children}
    </UserContext.Provider>
  );
};

export default UserContext;