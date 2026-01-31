import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../AuthContext/AuthContext.jsx";

import { useMsal } from "@azure/msal-react";
import { loginRequest } from "../../AuthContext/msalConfig.js"; // adjust path if needed

const Login = () => {
  const { Adminfetch } = useAuth();
  const navigate = useNavigate();

  // ---------------- NORMAL LOGIN ----------------
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ---------------- SSO ----------------
  const { instance, accounts } = useMsal();

  const handleMicrosoftLogin = async () => {
    await instance.loginPopup(loginRequest);
  };

  useEffect(() => {
    if (accounts.length) handleSSOUser();
  }, [accounts]);

  const handleSSOUser = async () => {
    try {
      const tokenRes = await instance.acquireTokenSilent({
        scopes: ["User.Read"],
        account: accounts[0],
      });

      const token = tokenRes.accessToken;

      const profile = await axios.get(
        "https://graph.microsoft.com/v1.0/me",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // 👉 Send SSO user to backend (auto login / auto create)
      const res = await axios.post(
        "/api/auth/sso-login",
        {
          name: profile.data.displayName,
          email: profile.data.mail || profile.data.userPrincipalName,
        },
        { withCredentials: true }
      );

      localStorage.setItem("token", res.data.token);

      await Adminfetch();

      navigate("/Admindashboard");
    } catch (err) {
      console.error("SSO Login failed", err);
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
      setLoading(true);

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
      setLoading(false);
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

            {/* 🔵 MICROSOFT SSO BUTTON */}
            <button
              onClick={handleMicrosoftLogin}
              className="w-full mb-6 py-4 border border-gray-300 rounded-xl font-semibold flex items-center justify-center gap-3 hover:bg-gray-50 transition"
            >
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg"
                className="w-5 h-5"
                alt="ms"
              />
              Sign in with Microsoft
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
                disabled={loading}
                className={`w-full py-4 rounded-xl text-white font-semibold text-lg ${
                  loading
                    ? "bg-gray-400"
                    : "bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};


export default Login;
