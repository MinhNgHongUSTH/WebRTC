import { useEffect, useState } from "react";
import { getCookie } from "./utils/cookieUtils";
import { db } from "./firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import React from 'react';
import { UserContext } from "./contexts/UserContext";

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const loggedIn = sessionStorage.getItem("loggedIn");

    if (!loggedIn) {
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
