// import { StrictMode } from 'react'
// import { createRoot } from 'react-dom/client'
// import './index.css'
// import App from './App.jsx'

// createRoot(document.getElementById('root')).render(
//   <StrictMode>
//     <App />
//   </StrictMode>,
// )

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import AuthProvider from "../src/AuthContext/AuthContext.jsx";
import { MsalProvider } from "@azure/msal-react";
import { msalInstance } from "../../Frontend/src/AuthContext/msalConfig.js";
import { BrowserRouter } from "react-router-dom";

// Initialize MSAL instance before rendering
const initializeApp = async () => {
  try {
    await msalInstance.initialize();
    console.log("MSAL initialized successfully");
    
    createRoot(document.getElementById("root")).render(
      <StrictMode>
        <BrowserRouter>
          <MsalProvider instance={msalInstance}>
            <AuthProvider>
              <App />
            </AuthProvider>
          </MsalProvider>
        </BrowserRouter>
      </StrictMode>,
    );
  } catch (error) {
    console.error("Failed to initialize MSAL:", error);
    // Fallback rendering without MSAL
    createRoot(document.getElementById("root")).render(
      <StrictMode>
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      </StrictMode>,
    );
  }
};

initializeApp();
