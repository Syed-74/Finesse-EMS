import React, { useState, useEffect, createContext, useContext } from "react";
import axios from "../api/axios";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);      // currently signed in user (null if none)
  const [loading, setLoading] = useState(true);  // true while checking/refreshing auth
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Helper: set axios default Authorization header when token available
  const setAuthHeader = (token) => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common["Authorization"];
    }
  };

  // Fetch current user/profile from backend and populate 'admin'
  const Adminfetch = async () => {
    setLoading(true);   // important — set loading *before* the request
    setError(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setAdmin(null);
        setAuthHeader(null);
        return null;
      }

      // set header so this request uses token (and future requests too)
      setAuthHeader(token);

      const res = await axios.get("/auth/profile");
      // backend may return { user: {...} } or directly user object — handle both
      const userPayload = res.data?.user ?? res.data;
      setAdmin(userPayload || null);

      return userPayload || null;
    } catch (err) {
      console.error("Auth fetch error:", err?.response?.data ?? err.message);
      localStorage.removeItem("token");
      setAuthHeader(null);
      setAdmin(null);
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // call once on mount to restore auth state
  useEffect(() => {
    Adminfetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Useful helpers exposed by context
  const signOut = async () => {
    try {
      // Optional: notify backend about logout
      await axios.post("/auth/logout");
    } catch (err) {
      console.error("Backend logout failed:", err.message);
    } finally {
      localStorage.removeItem("token");
      setAuthHeader(null);
      setAdmin(null);
      navigate("/");
    }
  };

  const values = {
    admin,
    loading,
    error,
    Adminfetch,
    signOut,
    setAuthHeader,
  };

  return <AuthContext.Provider value={values}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
