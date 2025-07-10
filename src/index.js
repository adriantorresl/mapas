import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
// src/setupTests.js o al inicio de index.js
global.Buffer = require("buffer").Buffer;
global.process = require("process");

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
