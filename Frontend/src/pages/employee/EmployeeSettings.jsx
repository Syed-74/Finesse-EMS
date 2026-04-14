import React, { useState, useEffect } from "react";
import axios from "../../api/axios";
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
  Upload,
  Globe,
  RefreshCcw
} from "lucide-react";
import { useAuth } from "../../AuthContext/AuthContext";



const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://finesse-ems.onrender.com/api';

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
      const res = await axios.get("/employees/me");
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
      await axios.put("/employees/me/image", formData, {
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
      <div className="flex items-center justify-center min-h-screen bg-slate-50/50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent shadow-lg shadow-indigo-100"></div>
          <p className="text-slate-500 font-bold animate-pulse uppercase tracking-widest text-xs">Loading Secure Profile...</p>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-slate-500 bg-slate-50/50 p-6">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl max-w-md text-center">
          <AlertCircle className="w-16 h-16 mb-6 text-rose-500 mx-auto" />
          <h2 className="text-2xl font-black text-slate-900 mb-2">Access Denied</h2>
          <p className="text-slate-500 mb-6">We were unable to retrieve your employee profile data. Please try logging in again or contact IT support.</p>
          <button onClick={() => window.location.reload()} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:-translate-y-1 transition-all">Retry Access</button>
        </div>
      </div>
    );
  }

  const formatSyncDate = (date) => {
    if (!date) return "Never Synced";
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-4 md:p-8 lg:p-12 space-y-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200 pb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-none">Employee Settings</h1>
          <p className="text-slate-500 mt-2 font-medium">Manage your enterprise profile and security preferences.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {profileData.lastGraphSync && (
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 text-xs font-bold shadow-sm">
              <RefreshCcw className="w-3.5 h-3.5 animate-pulse" />
              Last Sync: {formatSyncDate(profileData.lastGraphSync)}
            </div>
          )}
          {message.text && (
            <div className={`px-4 py-2 rounded-xl flex items-center gap-3 text-xs font-bold animate-in zoom-in duration-300 ${message.type === "success" ? "bg-indigo-50 text-indigo-600 border border-indigo-100" : "bg-rose-50 text-rose-600 border border-rose-100"
              }`}>
              {message.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {message.text}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* LEFT COLUMN - Profile Picture & Basic Info (4 Cols) */}
        <div className="lg:col-span-4 space-y-8">

          {/* Section 1: Profile Picture Card */}
          <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-xl shadow-slate-200/50 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600 opacity-10"></div>
            <div className="absolute -right-12 -top-12 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl"></div>

            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="relative mb-8">
                <div className="w-36 h-36 md:w-40 md:h-40 rounded-[2.5rem] border-[6px] border-white shadow-2xl overflow-hidden bg-white ring-1 ring-slate-100">
                  <img
                    src={previewImage || (profileData.profileImage ? `${API_BASE_URL}/${profileData.profileImage}` : "https://ui-avatars.com/api/?name=" + profileData.firstName + "+" + profileData.lastName + "&background=6366f1&color=fff&size=200")}
                    alt="Profile"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                </div>
                <label className="absolute -bottom-2 -right-2 p-3 bg-indigo-600 text-white rounded-2xl cursor-pointer hover:bg-slate-900 transition-all shadow-xl hover:scale-110 active:scale-95 border-2 border-white">
                  <Camera className="w-5 h-5" />
                  <input
                    type="file"
                    className="hidden"
                    accept="image/png, image/jpeg, image/jpg"
                    onChange={handleImageChange}
                  />
                </label>
              </div>

              <h2 className="text-2xl font-black text-slate-900 tracking-tight">{profileData.firstName} {profileData.lastName}</h2>
              <div className="inline-flex items-center gap-2 mt-2 px-4 py-1.5 bg-slate-900 text-white rounded-full">
                <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">{profileData.designation}</span>
              </div>

              <div className={`mt-8 transition-all duration-500 ${selectedImage ? 'opacity-100 translate-y-0 max-h-24' : 'opacity-0 translate-y-4 max-h-0 overflow-hidden'}`}>
                <button
                  onClick={executeUpload}
                  disabled={uploading}
                  className="w-full flex items-center justify-center gap-3 px-8 py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-200 hover:shadow-indigo-400 hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  {uploading ? (
                    <span className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save className="w-5 h-5 group-hover:animate-bounce" />
                  )}
                  {uploading ? "SYNCING..." : "UPDATE PHOTO"}
                </button>
              </div>
            </div>
          </div>

          {/* Contact Details Card */}
          <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-lg shadow-slate-100/50">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
              <span className="w-8 h-1 bg-indigo-600 rounded-full"></span>
              Contact Hub
            </h3>

            <div className="space-y-6">
              {[
                { icon: <Mail className="w-4 h-4" />, color: "indigo", label: "Corporate Email", value: profileData.email },
                { icon: <Phone className="w-4 h-4" />, color: "emerald", label: "Mobile Number", value: profileData.mobileNumber || "Unavailable" },
                { icon: <MapPin className="w-4 h-4" />, color: "rose", label: "Work Location", value: profileData.officeLocation || "HQ / Remote" }
              ].map((item, i) => (
                <div key={i} className="group cursor-default">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">{item.label}</label>
                  <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 group-hover:border-indigo-200 group-hover:bg-white transition-all duration-300">
                    <div className={`p-2 rounded-xl bg-${item.color}-50 text-${item.color}-600`}>
                      {item.icon}
                    </div>
                    <span className="text-sm font-bold text-slate-700 truncate">{item.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN - Enterprise Profile (8 Cols) */}
        <div className="lg:col-span-8 space-y-8">

          {/* Professional Data Grid */}
          <div className="bg-white rounded-[2rem] p-6 md:p-10 border border-slate-200 shadow-xl shadow-slate-200/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Building2 className="w-32 h-32 text-slate-900" />
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 relative z-10">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-4">
                <Building2 className="w-6 h-6 text-indigo-600" />
                Enterprise Asset Profile
              </h3>
              <div className="px-5 py-2 bg-slate-100 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border border-slate-200 flex items-center gap-2">
                <Shield className="w-3.5 h-3.5" />
                AD SYNCHRONIZED
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Employee Signature Code</label>
                <div className="flex items-center gap-4 p-5 bg-slate-900 text-white rounded-3xl border border-slate-800 shadow-inner group transition-all">
                  <div className="p-2.5 bg-slate-800 rounded-xl text-indigo-400 group-hover:scale-110 transition-transform">
                    <Shield className="w-5 h-5" />
                  </div>
                  <span className="text-lg font-black tracking-widest uppercase">{profileData.employeeCode || profileData._id?.substring(0, 8).toUpperCase()}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Assigned Department</label>
                <div className="flex items-center gap-4 p-5 bg-slate-50 rounded-3xl border border-slate-100">
                  <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                    <Users className="w-5 h-5" />
                  </div>
                  <span className="text-lg font-bold text-slate-800">{profileData.department}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Hierarchy Placement</label>
                <div className="flex items-center gap-4 p-5 bg-slate-50 rounded-3xl border border-slate-100">
                  <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <span className="text-lg font-bold text-slate-800">{profileData.designation}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Organizational Entry Date</label>
                <div className="flex items-center gap-4 p-5 bg-slate-50 rounded-3xl border border-slate-100">
                  <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <span className="text-lg font-bold text-slate-800">
                    {new Date(profileData.dateOfJoining).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Direct Reporting Manager</label>
                <div className="flex items-center gap-4 p-5 bg-indigo-50/30 rounded-3xl border border-indigo-100 group">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-lg group-hover:rotate-12 transition-transform shadow-lg shadow-indigo-100">
                    <User className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-lg font-black text-indigo-900 uppercase tracking-tight">
                      {typeof profileData.reportingManager === 'object'
                        ? `${profileData.reportingManager?.firstName || 'ADMINISTRATOR'} ${profileData.reportingManager?.lastName || ''}`
                        : "HR OPERATIONS"}
                    </span>
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">AUTHORIZED SUPERVISOR</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Regional & Address Information */}
          <div className="bg-white rounded-[2rem] p-6 md:p-10 border border-slate-200 shadow-xl shadow-slate-200/50">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-4 mb-10">
              <Globe className="w-5 h-5 text-indigo-600" />
              Regional & Physical Placement
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4 md:col-span-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Registered Residential/Work Address</label>
                <div className="flex items-start gap-4 p-5 bg-slate-50 rounded-3xl border border-slate-100 min-h-[100px]">
                  <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl mt-1">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <p className="text-slate-700 font-bold leading-relaxed">
                    {profileData.address ? `${profileData.address}, ${profileData.city || ''}, ${profileData.state || ''}, ${profileData.country || ''}` : "Physical address data is secured or unavailable."}
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-center space-y-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Operational City</span>
                <span className="text-base font-black text-slate-800 uppercase">{profileData.city || "N/A"}</span>
              </div>
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-center space-y-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Assigned State</span>
                <span className="text-base font-black text-slate-800 uppercase">{profileData.state || "N/A"}</span>
              </div>
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-center space-y-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Global Region</span>
                <span className="text-base font-black text-slate-800 uppercase">{profileData.country || "N/A"}</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Footer Branding */}
      <div className="pt-12 text-center opacity-30">
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400">Finesse Enterprise Management System — Secured Profile Console</p>
      </div>
    </div>
  );
};

export default EmployeeSettings;
