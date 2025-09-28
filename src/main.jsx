import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css"; // ok if this file doesn't exist; you can remove the line

createRoot(document.getElementById("root")).render(<App />);