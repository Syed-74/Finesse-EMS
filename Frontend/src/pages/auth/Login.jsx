import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../AuthContext/AuthContext.jsx";

import { useMsal } from "@azure/msal-react";
import { loginRequest } from "../../AuthContext/msalConfig.js"; // adjust path if needed

const Login = () => {
  const { Adminfetch, admin, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && admin) {
      navigate("/Admindashboard", { replace: true });
    }
  }, [admin, loading, navigate]);

  // ---------------- NORMAL LOGIN ----------------
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");

  // ---------------- SSO ----------------
  const { instance, accounts, inProgress } = useMsal();
  const [ssoLoading, setSsoLoading] = useState(false);

  // Debug MSAL state
  useEffect(() => {
    console.log("MSAL Instance:", instance);
    console.log("MSAL Accounts:", accounts);
    console.log("MSAL In Progress:", inProgress);
  }, [instance, accounts, inProgress]);

  const handleMicrosoftRedirect = async () => {
    try {
      console.log("Initiating Microsoft redirect login...");
      setError("");
      setSsoLoading(true);
      
      // Use redirect with proper configuration
      await instance.loginRedirect({
        ...loginRequest,
        redirectUri: "http://localhost:5173",
        prompt: "select_account",
        extraScopesToConsent: ["User.Read"],
      });
    } catch (err) {
      console.error("Microsoft redirect login error:", err);
      setError("Redirect login failed. Please try again.");
      setSsoLoading(false);
    }
  };

  useEffect(() => {
    if (accounts.length) handleSSOUser();
  }, [accounts]);

  // Handle redirect response
  useEffect(() => {
    const handleRedirectResponse = async () => {
      try {
        // Wait for MSAL to be fully initialized
        if (inProgress === 'startup') {
          console.log("MSAL still initializing, waiting...");
          return;
        }

        const response = await instance.handleRedirectPromise();
        if (response) {
          console.log("Redirect response received:", response);
          // Clear any loading state from redirect
          setSsoLoading(false);
          setError("");
          // SSO user will be handled by the accounts useEffect
        }
      } catch (err) {
        console.error("Redirect response error:", err);
        setSsoLoading(false);
        // Don't show error for initialization issues
        if (!err.errorMessage?.includes('uninitialized_public_client_application')) {
          setError("Login redirect failed");
        }
      }
    };

    // Add a small delay to ensure MSAL is initialized
    const timer = setTimeout(handleRedirectResponse, 200);
    return () => clearTimeout(timer);
  }, [instance, inProgress]);

  const handleSSOUser = async () => {
    try {
      setSsoLoading(true);
      console.log("Starting SSO user handling...");
      
      const tokenRes = await instance.acquireTokenSilent({
        scopes: ["User.Read"],
        account: accounts[0],
      });

      const token = tokenRes.accessToken;
      console.log("Acquired token successfully");

      const profile = await axios.get(
        "https://graph.microsoft.com/v1.0/me",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      console.log("Microsoft profile data:", profile.data);
      
      // 👉 Send SSO user to backend (auto login / auto create)
      console.log("Sending SSO data to backend...");
      const res = await axios.post(
        "http://localhost:5000/api/auth/sso-login",
        {
          name: profile.data.displayName,
          email: profile.data.mail || profile.data.userPrincipalName,
        },
        { 
          withCredentials: true,
          timeout: 10000, // 10 second timeout
        }
      );

      console.log("Backend SSO response:", res.data);

      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
        axios.defaults.headers.common["Authorization"] = `Bearer ${res.data.token}`;
        
        // Fetch user profile to update auth context
        const user = await Adminfetch();
        
        console.log("User after Adminfetch:", user);

        if (user) {
          console.log("Navigating to admin dashboard...");
          navigate("/Admindashboard", { replace: true });
        } else {
          console.error("SSO login succeeded but Adminfetch couldn't load profile");
          setError("Login successful but failed to load user profile");
        }
      } else {
        console.error("No token received from backend");
        setError("Login failed - no token received");
      }
    } catch (err) {
      console.error("SSO Login failed:", err);
      
      if (err.code === 'ECONNABORTED') {
        setError("Login timeout - please check your connection and try again");
      } else if (err.response?.status === 404) {
        setError("SSO login endpoint not found - please contact administrator");
      } else if (err.response?.status === 500) {
        setError("Server error - please try again later");
      } else {
        setError(err.response?.data?.message || "Microsoft login failed. Please try again.");
      }
    } finally {
      setSsoLoading(false);
    }
  };

  // ---------------- NORMAL LOGIN HANDLERS ----------------
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.username || !formData.password) {
      setError("Username and password are required");
      return;
    }

    try {
      setFormLoading(true);

      const res = await axios.post(
        "http://localhost:5000/api/auth/login",
        {
          email: formData.username,
          password: formData.password,
        },
        { withCredentials: true }
      );

      localStorage.setItem("token", res.data.token);
      await Adminfetch();
      navigate("/Admindashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Try again.");
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="h-screen w-full bg-white overflow-hidden py-10 flex items-center justify-center">
      <div className="w-full h-full max-w-7xl flex flex-col md:flex-row shadow-xl border border-gray-100 rounded-xl overflow-hidden-lg">

        {/* LEFT IMAGE */}
        <div
          className="hidden md:flex md:w-1/2 relative bg-no-repeat bg-center bg-contain"
          style={{ backgroundImage: "url('/Finesse_logo.png')" }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#04104a]/90 to-[#08123f]/90" />
          <div className="relative z-10 flex flex-col justify-between w-full h-full px-8 lg:px-16 py-10 text-white">
            <div>
              <h1 className="text-3xl lg:text-5xl font-extrabold leading-tight">
                Employee Management <br />
                <span className="text-sky-200">System</span>
              </h1>
              <p className="mt-5 text-indigo-100 max-w-md">
                Securely manage employees, attendance, and workflows in one
                place.
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT FORM */}
        <div className="w-full md:w-1/2 flex items-center justify-center px-6 sm:px-10 lg:px-16">
          <div className="w-full max-w-md">

            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back
            </h2>
            <p className="text-gray-500 mb-8">
              Sign in to your account
            </p>

            {/* 🔵 MICROSOFT SSO BUTTON - REDIRECT */}
            <button
              onClick={handleMicrosoftRedirect}
              disabled={ssoLoading}
              className={`w-full mb-6 py-4 border border-gray-300 rounded-xl font-semibold flex items-center justify-center gap-3 transition ${
                ssoLoading
                  ? "bg-gray-100 cursor-not-allowed" 
                  : "hover:bg-gray-50"
              }`}
            >
              {ssoLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-gray-400 border-t-blue-600 rounded-full animate-spin"></div>
                  Signing in with Microsoft...
                </>
              ) : (
                <>
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg"
                    className="w-5 h-5"
                    alt="ms"
                  />
                  Sign in with Microsoft
                </>
              )}
            </button>

            <div className="flex items-center my-6">
              <div className="flex-grow border-t" />
              <span className="px-3 text-sm text-gray-400">OR</span>
              <div className="flex-grow border-t" />
            </div>

            {/* NORMAL LOGIN */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="px-4 py-3 text-sm text-red-600 bg-red-50 rounded-lg">
                  {error}
                </div>
              )}

              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="admin@finesse-cs.tech"
                className="w-full px-5 py-4 rounded-xl border focus:ring-2 focus:ring-indigo-500 outline-none"
              />

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full px-5 py-4 rounded-xl border focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              <button
                type="submit"
                disabled={formLoading}
                className={`w-full py-4 rounded-xl text-white font-semibold text-lg ${
                  formLoading
                    ? "bg-gray-400"
                    : "bg-indigo-600 hover:bg-indigo-700"
                  }`}
              >
                {formLoading ? "Signing in..." : "Sign In"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};


export default Login;
