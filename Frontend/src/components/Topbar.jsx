import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../AuthContext/AuthContext";
import ProfileAvatar from "./ProfileAvatar";
import {
  Menu,
  LogOut,
  User,
  Briefcase,
  Mail,
  MapPin,
  Building2,
  ChevronDown
} from "lucide-react";
import { useNavigate } from "react-router-dom";

/**
 * Topbar Component
 * 
 * Clean, minimal top navigation bar.
 * Enhanced with a responsive, animated profile dropdown.
 */
const Topbar = ({ toggleSidebar }) => {
  const { admin, signOut } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    signOut();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="flex items-center justify-between px-4 py-3 md:px-8 max-w-[1920px] mx-auto">

        {/* Left: Mobile Toggle & Brand/Breadcrumb */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSidebar}
            className="md:hidden p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-all active:scale-95"
          >
            <Menu className="w-6 h-6" />
          </button>

          <h3 className="text-lg md:text-xl font-black text-slate-800 tracking-tight hidden xs:block">
            Dashboard
          </h3>
        </div>

        {/* Right: User Profile Section */}
        <div className="flex items-center gap-4">

          {/* User Info & Avatar with Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-3 pl-4 border-l border-slate-200 group outline-none"
            >
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-sm font-bold text-slate-700 leading-tight group-hover:text-indigo-600 transition-colors">
                  {admin?.firstName} {admin?.lastName}
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {admin?.role}
                </span>
              </div>

              {/* Reusable Profile Avatar Component */}
              <div className="relative">
                <div className={`absolute -inset-1 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full opacity-0 ${isDropdownOpen ? 'opacity-100 blur-sm' : 'group-hover:opacity-100 group-hover:blur-sm'} transition-all duration-300`}></div>
                <ProfileAvatar
                  user={admin}
                  className="w-10 h-10 ring-2 ring-white relative z-10"
                  showStatus={true}
                />
              </div>

              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Profile Dropdown Card */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200 z-50">
                {/* Header Profile Section */}
                <div className="p-6 bg-slate-50 border-b border-slate-100">
                  <div className="flex items-center gap-4 mb-4">
                    <ProfileAvatar
                      user={admin}
                      className="w-16 h-16 ring-4 ring-white shadow-md shadow-slate-200"
                    />
                    <div>
                      <h4 className="font-black text-slate-800 leading-tight">{admin?.firstName} {admin?.lastName}</h4>
                      <p className="text-xs font-bold text-indigo-600 uppercase tracking-wide">{admin?.role}</p>
                    </div>
                  </div>
                </div>

                {/* Info List */}
                <div className="p-4 space-y-1">
                  <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                      <Mail size={16} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Email</span>
                      <span className="text-sm text-slate-700 font-medium truncate max-w-[180px]">{admin?.email}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                      <Briefcase size={16} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Designation</span>
                      <span className="text-sm text-slate-700 font-medium">{admin?.designation || "Not Specified"}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                      <Building2 size={16} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Department</span>
                      <span className="text-sm text-slate-700 font-medium">{admin?.department || "General"}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                      <MapPin size={16} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Last Login Location</span>
                      <span className="text-sm text-slate-700 font-medium">{admin?.officeLocation || "Default"}</span>
                    </div>
                  </div>
                </div>

                {/* Action Footer */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 grid grid-cols-1 gap-2">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold text-sm transition-all active:scale-[0.98]"
                  >
                    <LogOut size={16} />
                    Logout Account
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};

export default Topbar;
