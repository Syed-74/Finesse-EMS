import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../AuthContext/AuthContext.jsx";

import { useMsal } from "@azure/msal-react";
import { loginRequest } from "../../AuthContext/msalConfig.js"; // adjust path if needed

const Login = () => {
  // Custom Styles for Animations
  const customStyles = `
    @keyframes shine {
      0% { left: -100%; transition-property: left; }
      100% { left: 100%; transition-property: left; }
    }
    .animate-shine {
      animation: shine 1.5s infinite;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in {
      animation: fadeIn 0.6s ease-out forwards;
    }
  `;
  const { Adminfetch, admin, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (loading || !admin) return;

    if (admin.role === "admin") {
      navigate("/admin", { replace: true });
    } else if (admin.role === "employee") {
      navigate("/employee", { replace: true });
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
        redirectUri: "http://localhost:3000",
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
        console.log(handleRedirectResponse, "No redirect response to handle");
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
          name: accounts[0].name,
          email: accounts[0].username,
          accessToken: token // sending token for backend sync
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

        if (user && user.role === "employee") {
          console.log("Navigating to employee dashboard...");
          navigate("/employee", { replace: true });
        } else if (user && user.role === "admin") {
          console.log("Navigating to admin dashboard...");
          navigate("/admin", { replace: true });
        } else {
          console.error("SSO login succeeded but Adminfetch couldn't load profile");
          setError("Login successful but failed to load user profile. Check backend connection.");
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

      // Normalize email to prevent failed matches due to case/whitespace
      const normalizedEmail = formData.username.trim().toLowerCase();

      const res = await axios.post(
        "http://localhost:5000/api/auth/login",
        {
          email: normalizedEmail,
          password: formData.password,
        },
        { withCredentials: true }
      );

      localStorage.setItem("token", res.data.token);
      await Adminfetch();

      if (res.data.admin.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/employee");
      }
    } catch (err) {
      console.error("Login Error:", err);
      const msg = err.response?.data?.message || "Login failed. Check your credentials.";
      setError(msg);
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#f8fafc] flex items-center justify-center p-4 md:p-6 lg:p-8 font-sans relative overflow-hidden">
      <style>{customStyles}</style>
      {/* Background decoration elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-indigo-50/50 blur-3xl"></div>
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] rounded-full bg-blue-50/50 blur-3xl"></div>
      </div>

      <div className="w-full max-w-6xl bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-slate-100 flex flex-col md:flex-row overflow-hidden min-h-[600px] relative z-10 transition-all duration-300">

        {/* LEFT PANEL - Branding (Hidden on mobile) */}
        <div className="hidden md:flex md:w-5/12 lg:w-1/2 relative overflow-hidden bg-[#0f172a]">
          {/* Animated background patterns */}
          <div className="absolute inset-0 z-0 opacity-20">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_30%,#3b82f6_0%,transparent_50%)]"></div>
            <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_70%,#6366f1_0%,transparent_50%)]"></div>
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
          </div>

          <div className="relative z-10 flex flex-col justify-between w-full p-12 lg:p-16 text-white">
            <div className="space-y-6">
              <div className="bg-white backdrop-blur-md p-3 rounded-2xl w-fit border border-white/20">
                <img src="/Finesse_logo.png" alt="Finesse Logo" className="h-10 lg:h-12 w-auto object-contain" />
              </div>

              <div className="space-y-4">
                <h1 className="text-4xl lg:text-5xl font-bold tracking-tight leading-tight">
                  Streamline Your <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">Workforce</span>
                </h1>
                <p className="text-slate-400 text-lg lg:text-xl max-w-sm font-light">
                  The ultimate Employee Management System designed for efficiency and growth.
                </p>
              </div>
            </div>

            <div className="mt-auto">
              <div className="flex items-center gap-4 text-slate-400">
                <div className="h-[1px] w-12 bg-slate-700"></div>
                <span className="text-sm font-medium tracking-widest uppercase">Finesse Customized Solutions</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL - Login Form */}
        <div className="w-full md:w-7/12 lg:w-1/2 flex items-center justify-center p-8 lg:p-20 bg-white border-l border-slate-50">
          <div className="w-full max-w-md animate-fade-in">

            <div className="md:hidden flex justify-center mb-8">
              <img src="/Finesse_logo.png" alt="Finesse Logo" className="h-10 w-auto" />
            </div>

            <div className="mb-10 text-center md:text-left">
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">
                Welcome Back
              </h2>
              <p className="text-slate-500 font-medium">
                Enter your credentials to access your portal
              </p>
            </div>

            {/* ERROR MESSAGE CONTAINER */}
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 flex items-center gap-3 text-red-600 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}

            {/* SSO SECTION */}
            <button
              onClick={handleMicrosoftRedirect}
              disabled={ssoLoading}
              className={`w-full group relative mb-8 flex items-center justify-center gap-3 py-4 px-6 border-2 border-slate-100 rounded-2xl font-semibold text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-200 active:scale-[0.98] transition-all duration-200 shadow-sm ${ssoLoading ? "opacity-75 cursor-not-allowed" : ""
                }`}
            >
              {ssoLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-slate-300 border-t-indigo-600 rounded-full animate-spin"></div>
                  <span className="text-slate-400">Authenticating...</span>
                </>
              ) : (
                <>
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg"
                    className="w-5 h-5 group-hover:scale-110 transition-transform duration-200"
                    alt="Microsoft logo"
                  />
                  <span>Sign in with Microsoft</span>
                </>
              )}
            </button>

            <div className="relative flex items-center mb-8">
              <div className="flex-grow border-t border-slate-100"></div>
              <span className="mx-4 text-xs font-bold text-slate-400 uppercase tracking-widest">or login with email</span>
              <div className="flex-grow border-t border-slate-100"></div>
            </div>

            {/* FORM SECTION */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5 focus-within:text-indigo-600 transition-colors duration-200">
                <label className="text-sm font-bold text-slate-700 ml-1">Email Address</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="name@company.com"
                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:bg-white focus:border-indigo-600 focus:outline-none transition-all duration-200"
                  />
                </div>
              </div>

              <div className="space-y-1.5 focus-within:text-indigo-600 transition-colors duration-200">
                <label className="text-sm font-bold text-slate-700 ml-1">Password</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-12 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:bg-white focus:border-indigo-600 focus:outline-none transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={formLoading}
                  className={`w-full relative overflow-hidden group py-4 rounded-2xl text-white font-bold text-lg bg-[#0f172a] hover:bg-[#1e293b] active:scale-[0.99] transition-all duration-200 shadow-[0_10px_30px_rgba(15,23,42,0.3)] ${formLoading ? "opacity-75 cursor-not-allowed" : ""
                    }`}
                >
                  <span className={`${formLoading ? "invisible" : "visible"}`}>
                    Sign In to Portal
                  </span>
                  {formLoading && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    </div>
                  )}
                  {/* Subtle shine effect on hover */}
                  <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white/10 opacity-40 group-hover:animate-shine"></div>
                </button>
              </div>
            </form>

            <div className="mt-8 text-center">
              <p className="text-slate-400 text-sm">
                Need help? <a href="#" className="font-semibold text-indigo-600 hover:text-indigo-500 underline underline-offset-4">Contact Support</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


export default Login;
