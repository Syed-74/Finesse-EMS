import React, { useState } from "react";
import { useAuth } from "../AuthContext/AuthContext";
import axios from "axios";

const Topbar = ({ toggleSidebar }) => {
  const { admin, Adminfetch } = useAuth();
  const [showProfile, setShowProfile] = useState(false);
  const [loading, setLoading] = useState(false);

  // Construct image URL helper
  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    return `http://localhost:5000${path}`;
  };

  const currentImage = getImageUrl(admin?.profileImage);

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("profileImage", file);

    try {
      setLoading(true);
      await axios.put("http://localhost:5000/api/auth/profile", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });
      
      // Refresh user data to get the new image URL
      await Adminfetch();
    } catch (error) {
      console.error("Failed to upload image", error);
      alert("Failed to upload image. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const InfoRow = ({ label, value }) => (
    <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-3 border-b py-2">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-800 break-all">
        {value || "—"}
      </span>
    </div>
  );

  return (
    <>
      <header className="sticky top-0 z-30 bg-white shadow-sm">
        <div className="flex items-center justify-between px-4 py-3 md:px-6">

          <button
            onClick={toggleSidebar}
            className="md:hidden text-2xl font-semibold transition-transform active:scale-95"
          >
            ☰
          </button>

          <h3 className="text-lg md:text-xl font-semibold text-gray-800">
            Employee Management System
          </h3>

          <div
            onClick={() => setShowProfile(true)}
            className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-1.5 rounded-lg transition-colors"
          >
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-sm font-medium text-gray-700">
                {admin?.firstName} {admin?.lastName}
              </span>
              <span className="text-xs text-gray-400 capitalize">
                {admin?.role}
              </span>
            </div>

            <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-semibold uppercase overflow-hidden border border-gray-200">
              {currentImage ? (
                <img src={currentImage} alt="profile" className="w-full h-full object-cover" />
              ) : (
                admin?.firstName?.[0] || "U"
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ================= PROFILE POPUP ================= */}
      {showProfile && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6 relative overflow-y-auto max-h-[90vh] animate-in zoom-in-95 duration-200">

            <button
              onClick={() => setShowProfile(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 text-xl p-1 rounded-full hover:bg-gray-100 transition-all"
            >
              ✕
            </button>

            <h2 className="text-xl font-bold mb-6 text-center text-gray-800">
              My Profile
            </h2>

            {/* Profile Image & Upload */}
            <div className="flex flex-col items-center mb-6 group">
              <div className="relative w-28 h-28 rounded-full shadow-md overflow-hidden bg-indigo-50 border-4 border-white ring-2 ring-gray-100">
                  {loading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white z-10">
                       <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin"/>
                    </div>
                  ) : null}

                  {currentImage ? (
                    <img src={currentImage} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="Profile" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-indigo-600 text-white text-4xl font-bold uppercase">
                      {admin?.firstName?.[0] || "U"}
                    </div>
                  )}
              </div>

              <label className={`mt-3 px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-full cursor-pointer hover:bg-indigo-100 transition-colors ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
                {loading ? 'Uploading...' : 'Change Photo'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                  disabled={loading}
                />
              </label>
            </div>

            {/* Profile Data */}
            <div className="space-y-1 bg-gray-50/50 rounded-xl p-4 border border-gray-100">
              <InfoRow label="Full Name" value={`${admin?.firstName} ${admin?.lastName}`} />
              <InfoRow label="Email" value={admin?.email} />
              <InfoRow label="Role" value={admin?.role?.toUpperCase()} />
              <InfoRow label="Designation" value={admin?.designation } />
              <InfoRow label="Department" value={admin?.department } />
              <InfoRow label="Employee ID" value={admin?.employeeId } />
              <InfoRow label="Mobile" value={admin?.mobileNumber} />
              <InfoRow label="Work Location" value={admin?.workLocation} />
            </div>

            <div className="mt-8 flex justify-center">
              <button
                onClick={() => setShowProfile(false)}
                className="w-full sm:w-auto px-8 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 focus:ring-4 focus:ring-gray-100 transition-all"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};

export default Topbar;
