import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

import axios from "axios";

axios.defaults.headers.put["Content-Type"] = "application/json";

if (process.env.NODE_ENV === "development") {
  const username = "react.app@nuvolo.com";
  const password = "ckr.*%BAJ]+Bwzg^wVka0rGfk)uS)x%8x64$oqH)";
  axios.defaults.auth = {
    username,
    password,
  };
} else {
  axios.defaults.headers["X-UserToken"] = window.servicenowUserToken;
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
