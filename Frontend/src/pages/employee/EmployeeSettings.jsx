import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Building2,
  Calendar,
  Users,
  Camera,
  Save,
  Bell,
  CheckCircle2,
  AlertCircle,
  Shield,
  Upload
} from "lucide-react";
import { useAuth } from "../../AuthContext/AuthContext";

const EmployeeSettings = () => {
  const { setAuthHeader } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      setAuthHeader(token);
      const res = await axios.get("http://localhost:5000/api/employees/me");
      setProfileData(res.data);
    } catch (error) {
      console.error("Error fetching profile:", error);
      setMessage({ type: "error", text: "Failed to load profile data." });
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validation
    const validTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      setMessage({ type: "error", text: "Invalid file format. Please use JPG or PNG." });
      return;
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB
      setMessage({ type: "error", text: "File size exceeds 2MB limit." });
      return;
    }

    setSelectedImage(file);
    setPreviewImage(URL.createObjectURL(file));
    setMessage({ type: "", text: "" });
  };

  const executeUpload = async () => {
    if (!selectedImage) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("profileImage", selectedImage);

    try {
      const token = localStorage.getItem("token");
      await axios.put("http://localhost:5000/api/employees/me/image", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`
        }
      });

      setMessage({ type: "success", text: "Profile picture updated successfully!" });
      fetchProfile(); // Refresh data
      setSelectedImage(null);
      setPreviewImage(null);
    } catch (error) {
      console.error("Upload error:", error);
      setMessage({ type: "error", text: error.response?.data?.message || "Failed to update profile picture." });
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-slate-500">
        <AlertCircle className="w-12 h-12 mb-4 text-red-400" />
        <p>Unable to load employee profile.</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 space-y-8 max-w-7xl mx-auto animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Personal Settings</h1>
          <p className="text-slate-500 mt-1 font-medium">Manage your personal information and preferences.</p>
        </div>
        {message.text && (
          <div className={`px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-bold ${message.type === "success" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-rose-50 text-rose-600 border border-rose-100"
            }`}>
            {message.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {message.text}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* LEFT COLUMN - Profile Picture & Basic Info */}
        <div className="lg:col-span-1 space-y-8">

          {/* Section 1: Profile Picture */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-indigo-500 to-purple-600 opacity-10"></div>

            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="relative mb-6">
                <div className="w-32 h-32 rounded-full border-4 border-white shadow-xl overflow-hidden bg-slate-100">
                  <img
                    src={previewImage || (profileData.profileImage ? `http://localhost:5000${profileData.profileImage}` : "https://ui-avatars.com/api/?name=" + profileData.firstName + "+" + profileData.lastName)}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </div>
                <label className="absolute bottom-0 right-0 p-2 bg-indigo-600 text-white rounded-full cursor-pointer hover:bg-indigo-700 transition-colors shadow-lg">
                  <Camera className="w-4 h-4" />
                  <input
                    type="file"
                    className="hidden"
                    accept="image/png, image/jpeg, image/jpg"
                    onChange={handleImageChange}
                  />
                </label>
              </div>

              <h2 className="text-xl font-black text-slate-900">{profileData.firstName} {profileData.lastName}</h2>
              <p className="text-sm text-slate-500 font-bold uppercase tracking-wider mt-1">{profileData.designation}</p>

              <div className={`mt-6 transition-all duration-300 ${selectedImage ? 'opacity-100 max-h-20' : 'opacity-0 max-h-0 overflow-hidden'}`}>
                <button
                  onClick={executeUpload}
                  disabled={uploading}
                  className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 hover:shadow-indigo-300 hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {uploading ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {uploading ? "Saving..." : "Save New Picture"}
                </button>
              </div>
            </div>
          </div>

          {/* Contact Info (Read Only) */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-500" />
              Contact Details
            </h3>

            <div className="space-y-5">
              <div className="group">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Email Address</label>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-slate-500 group-hover:border-indigo-100 transition-colors">
                  <Mail className="w-4 h-4 text-indigo-400" />
                  <span className="text-sm font-medium">{profileData.email}</span>
                </div>
              </div>

              <div className="group">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Phone Number</label>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-slate-500 group-hover:border-indigo-100 transition-colors">
                  <Phone className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-medium">{profileData.mobileNumber || "Not Provided"}</span>
                </div>
              </div>

              <div className="group">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Address</label>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-slate-500 group-hover:border-indigo-100 transition-colors">
                  <MapPin className="w-4 h-4 text-rose-400" />
                  <span className="text-sm font-medium truncate">{profileData.address || "Not Provided"}</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN - Work Info & Settings */}
        <div className="lg:col-span-2 space-y-8">

          {/* Section 2: Work Information */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-indigo-500" />
                Professional Profile
              </h3>
              <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                Read Only
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Employee ID</label>
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-slate-600">
                  <Shield className="w-5 h-5 text-slate-400" />
                  <span className="font-bold tracking-tight">{profileData.employeeCode || profileData._id?.substring(0, 8).toUpperCase()}</span>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Department</label>
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-slate-600">
                  <Building2 className="w-5 h-5 text-slate-400" />
                  <span className="font-bold tracking-tight">{profileData.department}</span>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Designation</label>
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-slate-600">
                  <Briefcase className="w-5 h-5 text-slate-400" />
                  <span className="font-bold tracking-tight">{profileData.designation}</span>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Date of Joining</label>
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-slate-600">
                  <Calendar className="w-5 h-5 text-slate-400" />
                  <span className="font-bold tracking-tight">
                    {new Date(profileData.dateOfJoining).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Reporting Manager</label>
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-slate-600">
                  <Users className="w-5 h-5 text-slate-400" />
                  <span className="font-bold tracking-tight">
                    {/* We might need to populate this on backend or just show ID if name not provided */}
                    {typeof profileData.reportingManager === 'object'
                      ? `${profileData.reportingManager?.firstName || 'Unknown'} ${profileData.reportingManager?.lastName || ''}`
                      : "HR Department"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Notification Preferences (Mock / Disabled) */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm opacity-90">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <Bell className="w-4 h-4 text-indigo-500" />
                Preferences
              </h3>
            </div>

            <div className="space-y-4">
              {[
                { label: "Attendance Reminders", desc: "Get notified when you forget to punch out.", active: true },
                { label: "Leave Approval Notifications", desc: "Receive updates on your leave requests.", active: true },
                { label: "Email Alerts", desc: "Receive important system announcements via email.", active: false }
              ].map((pref, i) => (
                <div key={i} className="flex items-center justify-between p-4 border border-slate-100 rounded-xl bg-slate-50/50">
                  <div>
                    <h4 className="text-sm font-bold text-slate-700">{pref.label}</h4>
                    <p className="text-xs text-slate-400">{pref.desc}</p>
                  </div>
                  {/* Disabled Toggle Switch */}
                  <div className={`w-11 h-6 flex items-center rounded-full p-1 cursor-not-allowed ${pref.active ? 'bg-indigo-300' : 'bg-slate-200'}`}>
                    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out ${pref.active ? 'translate-x-5' : ''}`}></div>
                  </div>
                </div>
              ))}
              <div className="text-center mt-4">
                <p className="text-[10px] text-slate-400 uppercase tracking-widest italic">
                  Note: Notification settings are managed by system administration.
                </p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default EmployeeSettings;