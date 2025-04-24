import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

import axios from 'axios'

axios.defaults.headers.put["Content-Type"] = "application/json"

if (process.env.NODE_ENV === 'development') {
  const username = 'react.app@nuvolo.com'
  const password = 'A7g-:VULTi1B2o5s2A@FV!w)3FTZf'
  axios.defaults.auth = {
    username,
    password
  }
} else {
  axios.defaults.headers["X-UserToken"] = window.servicenowUserToken
}



const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <App />
);

