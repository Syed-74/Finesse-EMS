import React, { useState, useEffect } from "react";
import axios from "../../api/axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../AuthContext/AuthContext.jsx";

import { useMsal } from "@azure/msal-react";
import { loginRequest } from "../../AuthContext/msalConfig.js";

const Login = () => {
  const { Adminfetch, admin, loading } = useAuth();
  const navigate = useNavigate();

  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ||
    "https://finesse-ems.onrender.com/api";

  // ---------------- NORMAL LOGIN ----------------
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");

  // ---------------- SSO ----------------
  const { instance } = useMsal();
  const [ssoLoading, setSsoLoading] = useState(false);

  // =========================================================
  // ✅ HANDLE REDIRECT (MAIN FIX)
  // =========================================================
  useEffect(() => {
    const handleRedirect = async () => {
      try {
        const response = await instance.handleRedirectPromise();

        if (response) {
          console.log("✅ Redirect success:", response);

          // ✅ SET ACTIVE ACCOUNT
          instance.setActiveAccount(response.account);

          // ✅ HANDLE USER LOGIN
          await handleSSOUser(response.account);
        }
      } catch (err) {
        console.error("❌ Redirect error:", err);
        setError("SSO login failed");
      }
    };

    handleRedirect();
  }, [instance]);

  // =========================================================
  // ✅ MICROSOFT LOGIN
  // =========================================================
  const handleMicrosoftRedirect = async () => {
    try {
      setError("");
      setSsoLoading(true);

      await instance.loginRedirect({
        ...loginRequest,
        redirectUri: window.location.origin, // ✅ FIXED
        prompt: "select_account",
      });
    } catch (err) {
      console.error("Microsoft login error:", err);
      setError("Microsoft login failed");
      setSsoLoading(false);
    }
  };

  // =========================================================
  // ✅ HANDLE SSO USER
  // =========================================================
  const handleSSOUser = async (accountParam) => {
    try {
      setSsoLoading(true);

      const account = accountParam || instance.getActiveAccount();

      if (!account) {
        throw new Error("No active account found");
      }

      // ✅ GET TOKEN (WITH FALLBACK)
      let tokenRes;

      try {
        tokenRes = await instance.acquireTokenSilent({
          scopes: ["User.Read"],
          account,
        });
      } catch (err) {
        console.warn("Silent token failed, using popup...");
        tokenRes = await instance.acquireTokenPopup({
          scopes: ["User.Read"],
        });
      }

      const token = tokenRes.accessToken;

      // // ✅ OPTIONAL: GET PROFILE
      // const profile = await axios.get(
      //   "https://graph.microsoft.com/v1.0/me",
      //   {
      //     headers: {
      //       Authorization: `Bearer ${token}`,
      //     },
      //     withCredentials: false, // ✅ VERY IMPORTANT
      //   }
      // );

      console.log("Microsoft profile:", profile.data);

      // ✅ BACKEND CALL (FIXED URL)
      axios.post(
        `${API_BASE_URL}/auth/sso-login`,
        {
          name: account.name,
          email: account.username,
          accessToken: token,
        },
        {
          withCredentials: true // ✅ ensures cookies/session if backend uses it
        }
      );

      console.log("✅ Backend response:", res.data);

      // ✅ SAVE TOKEN
      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
        axios.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${res.data.token}`;

        // ✅ USE RESPONSE DIRECTLY (NO DELAY)
        const role = res.data?.user?.role;

        if (role === "admin") {
          navigate("/admin", { replace: true });
        } else if (role === "employee") {
          navigate("/employee", { replace: true });
        } else {
          setError("User role not found");
        }

        // Optional sync
        Adminfetch();
      } else {
        setError("No token received from server");
      }
    } catch (err) {
      console.error("❌ SSO failed:", err);
      setError(
        err.response?.data?.message || "SSO login failed. Try again."
      );
    } finally {
      setSsoLoading(false);
    }
  };

  // =========================================================
  // ✅ AUTO REDIRECT IF ALREADY LOGGED IN
  // =========================================================
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!loading && (admin || token)) {
      if (admin?.role === "admin") {
        navigate("/admin", { replace: true });
      } else if (admin?.role === "employee") {
        navigate("/employee", { replace: true });
      }
    }
  }, [admin, loading, navigate]);

  // =========================================================
  // ✅ NORMAL LOGIN
  // =========================================================
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setFormLoading(true);

      const res = await axios.post(
        `${API_BASE_URL}/auth/login`,
        {
          email: formData.username.trim().toLowerCase(),
          password: formData.password,
        },
        { withCredentials: true }
      );

      localStorage.setItem("token", res.data.token);

      const role = res.data.admin.role;

      if (role === "admin") {
        navigate("/admin");
      } else {
        navigate("/employee");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Invalid credentials");
    } finally {
      setFormLoading(false);
    }
  };

  // =========================================================
  // ✅ UI
  // =========================================================
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md p-6 bg-white shadow rounded">

        <h2 className="text-xl font-bold mb-4">Login</h2>

        {error && (
          <div className="mb-3 text-red-500 text-sm">{error}</div>
        )}

        {/* SSO BUTTON */}
        <button
          onClick={handleMicrosoftRedirect}
          disabled={ssoLoading}
          className="w-full mb-4 p-3 border rounded"
        >
          {ssoLoading ? "Loading..." : "Sign in with Microsoft"}
        </button>

        <div className="text-center mb-2">OR</div>

        {/* NORMAL LOGIN */}
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="username"
            placeholder="Email"
            value={formData.username}
            onChange={handleChange}
            className="w-full mb-2 p-2 border rounded"
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className="w-full mb-2 p-2 border rounded"
          />

          <button
            type="submit"
            className="w-full p-3 bg-black text-white rounded"
            disabled={formLoading}
          >
            {formLoading ? "Signing in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;