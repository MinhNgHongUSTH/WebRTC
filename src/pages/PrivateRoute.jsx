import { Navigate } from "react-router-dom";

const getCookie = (name) => {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
};

const isAuthenticated = () => {
  return (
    sessionStorage.getItem("loggedIn") === "true" &&
    getCookie("uid") !== null
  );
};

const PrivateRoute = ({ children }) => {
  return isAuthenticated() ? children : <Navigate to="/" replace />;
};

export default PrivateRoute;
