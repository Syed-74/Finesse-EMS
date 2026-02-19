import React, { useState, useEffect } from "react";
import { useAuth } from "../../../AuthContext/AuthContext";
import axios from "axios";
import toast from "react-hot-toast";
import {
  User,
  Lock,
  Shield,
  Bell,
  Eye,
  EyeOff,
  CheckCircle,
  Circle,
  Clock,
  Globe,
  LogOut,
  Save,
  ShieldCheck
} from "lucide-react";
import { motion } from "framer-motion";

const Settings = () => {
  const { admin, signOut } = useAuth();
  const [loading, setLoading] = useState(false);

  // Profile Data (derived from admin context)
  const profileInfo = {
    name: `${admin?.firstName || ""} ${admin?.lastName || ""}`,
    email: admin?.email || "admin@finesse-cs.tech",
    role: admin?.role || "Administrator",
    lastLogin: admin?.security?.lastLoginTime ? new Date(admin.security.lastLoginTime).toLocaleString() : "N/A",
    lastLoginIP: admin?.security?.lastLoginIP || "N/A",
    createdAt: admin?.createdAt ? new Date(admin.createdAt).toLocaleDateString() : "N/A",
  };

  // --- Change Password State ---
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [passwordStrength, setPasswordStrength] = useState(0);

  // --- Preferences State ---
  const [preferences, setPreferences] = useState({
    emailNotifications: admin?.preferences?.emailNotifications ?? true,
    payrollAlerts: admin?.preferences?.payrollAlerts ?? true,
    leaveAlerts: admin?.preferences?.leaveAlerts ?? true,
  });
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: admin?.security?.twoFactorEnabled ?? false,
  });

  useEffect(() => {
    if (admin) {
      setPreferences({
        emailNotifications: admin.preferences?.emailNotifications ?? true,
        payrollAlerts: admin.preferences?.payrollAlerts ?? true,
        leaveAlerts: admin.preferences?.leaveAlerts ?? true,
      });
      setSecuritySettings({
        twoFactorEnabled: admin.security?.twoFactorEnabled ?? false,
      });
    }
  }, [admin]);

  // --- Password Strength Logic ---
  const checkPasswordStrength = (pass) => {
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    setPasswordStrength(score);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordStrength < 4) {
      toast.error("Password does not meet security requirements");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.put("http://localhost:5000/api/auth/change-password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success(res.data.message);

      // Auto logout after password change
      setTimeout(() => {
        signOut();
      }, 2000);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSettings = async () => {
    setLoading(true);
    try {
      const res = await axios.put("http://localhost:5000/api/auth/settings", {
        preferences,
        security: securitySettings
      });
      toast.success(res.data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update settings");
    } finally {
      setLoading(false);
    }
  };

  const togglePreference = (key) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggle2FA = () => {
    setSecuritySettings(prev => ({ ...prev, twoFactorEnabled: !prev.twoFactorEnabled }));
  };

  const getStrengthLabel = () => {
    switch (passwordStrength) {
      case 0: return { label: "Very Weak", color: "bg-red-500", width: "25%" };
      case 1: return { label: "Weak", color: "bg-orange-500", width: "40%" };
      case 2: return { label: "Fair", color: "bg-yellow-500", width: "60%" };
      case 3: return { label: "Strong", color: "bg-blue-500", width: "80%" };
      case 4: return { label: "Very Strong", color: "bg-green-500", width: "100%" };
      default: return { label: "", color: "bg-gray-200", width: "0%" };
    }
  };

  return (
    <div className="p-4 md:p-8 min-h-screen bg-transparent text-[#212121]">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-[#1e293b]">Admin Settings</h1>
        <p className="text-gray-500 mt-2">Manage your account security and preferences</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN: Profile & Notifications */}
        <div className="lg:col-span-1 space-y-8">

          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <User size={32} />
              </div>
              <div>
                <h2 className="text-xl font-bold">{profileInfo.name}</h2>
                <span className="text-xs font-semibold px-2 py-1 bg-blue-50 text-blue-600 rounded-full uppercase tracking-wider">
                  {profileInfo.role}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-gray-500 text-sm">Email</span>
                <span className="text-sm font-medium">{profileInfo.email}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-gray-500 text-sm">Created At</span>
                <span className="text-sm font-medium">{profileInfo.createdAt}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-gray-500 text-sm">Last Login</span>
                <span className="text-sm font-medium flex items-center gap-1">
                  <Clock size={14} className="text-gray-400" /> {profileInfo.lastLogin}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-500 text-sm">System IP</span>
                <span className="text-sm font-medium flex items-center gap-1">
                  <Globe size={14} className="text-gray-400" /> {profileInfo.lastLoginIP}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Notification Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                <Bell size={20} />
              </div>
              <h2 className="text-lg font-bold">Notifications</h2>
            </div>

            <div className="space-y-6">
              {[
                { label: "Email Notifications", key: "emailNotifications", desc: "Receive summary reports via email" },
                { label: "Payroll Alerts", key: "payrollAlerts", desc: "Get notified when payroll is processed" },
                { label: "Leave Requests", key: "leaveAlerts", desc: "Alerts for new leave applications" },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold">{item.label}</h3>
                    <p className="text-xs text-gray-400">{item.desc}</p>
                  </div>
                  <button
                    onClick={() => togglePreference(item.key)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${preferences[item.key] ? 'bg-purple-600' : 'bg-gray-200'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out ${preferences[item.key] ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={handleUpdateSettings}
              disabled={loading}
              className="w-full mt-8 py-2.5 bg-[#1e293b] text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-[#334155] transition-all disabled:opacity-50"
            >
              <Save size={18} />
              {loading ? "Saving..." : "Save Preferences"}
            </button>
          </motion.div>

        </div>

        {/* RIGHT COLUMN: Change Password & Security */}
        <div className="lg:col-span-2 space-y-8">

          {/* Change Password Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8"
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                <Lock size={20} />
              </div>
              <h2 className="text-lg font-bold">Security Settings</h2>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-600">Current Password</label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? "text" : "password"}
                      placeholder="••••••••"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all pr-12"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div></div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-600">New Password</label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? "text" : "password"}
                      placeholder="••••••••"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all pr-12"
                      value={passwordForm.newPassword}
                      onChange={(e) => {
                        setPasswordForm({ ...passwordForm, newPassword: e.target.value });
                        checkPasswordStrength(e.target.value);
                      }}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {/* Strength Indicator */}
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                      <span className="text-gray-400">Strength:</span>
                      <span className={getStrengthLabel().color.replace('bg-', 'text-')}>{getStrengthLabel().label}</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${getStrengthLabel().color}`}
                        style={{ width: getStrengthLabel().width }}
                      />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">
                      Min 8 chars, 1 uppercase, 1 number & 1 special char.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-600">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? "text" : "password"}
                      placeholder="••••••••"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all pr-12"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {passwordForm.confirmPassword && (
                    <div className="flex items-center gap-1 mt-1">
                      {passwordForm.newPassword === passwordForm.confirmPassword ? (
                        <span className="text-[10px] text-green-500 flex items-center gap-1 font-medium italic">
                          <CheckCircle size={10} /> Passwords match
                        </span>
                      ) : (
                        <span className="text-[10px] text-red-500 flex items-center gap-1 font-medium italic">
                          <Circle size={10} /> Passwords do not match
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-4 pt-4">
                <button
                  type="submit"
                  disabled={loading || passwordStrength < 4 || passwordForm.newPassword !== passwordForm.confirmPassword}
                  className="px-8 py-3 bg-[#1e293b] text-white rounded-xl font-semibold hover:bg-[#334155] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? "Updating..." : "Update Password"}
                </button>
                <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-4 py-2 rounded-lg">
                  <Shield size={14} />
                  Change password will log you out of all sessions.
                </div>
              </div>
            </form>
          </motion.div>

          {/* Advanced Security Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Two-Factor Authentication</h2>
                  <p className="text-xs text-gray-400">Add an extra layer of security to your account</p>
                </div>
              </div>
              <button
                onClick={toggle2FA}
                className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${securitySettings.twoFactorEnabled ? 'bg-green-500' : 'bg-gray-200'}`}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition duration-200 ease-in-out ${securitySettings.twoFactorEnabled ? 'translate-x-8' : 'translate-x-1'}`} />
              </button>
            </div>

            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="flex-1">
                  <h3 className="text-sm font-bold mb-1 italic">Active Sessions</h3>
                  <p className="text-xs text-gray-500 mb-4 italic">You are currently logged in on this browser.</p>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-bold uppercase italic tracking-wider flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> This Device
                    </div>
                    <span className="text-gray-400 text-xs italic">Chrome on Windows 11</span>
                  </div>
                </div>
                <button
                  onClick={() => signOut()}
                  className="flex items-center gap-2 text-sm font-bold text-red-500 hover:text-red-600 transition-colors uppercase tracking-widest italic"
                >
                  <LogOut size={16} /> Logout All Other Devices
                </button>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
};

export default Settings;