import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../AuthContext/AuthContext";
import ProfileAvatar from "./ProfileAvatar";
import {
  Menu,
  User,
  Briefcase,
  Mail,
  MapPin,
  Building2,
  ChevronDown,
  Shield,
  Activity,
  CreditCard,
  Calendar,
  Clock,
  ExternalLink
} from "lucide-react";

/**
 * Topbar Component
 * 
 * Clean, modern top navigation bar with glassmorphism and enhanced profile insights.
 * Features populated data mapping and premium visual interactions.
 */
const Topbar = ({ toggleSidebar }) => {
  const { admin } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

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

  // Format Date for Display
  const formatDate = (dateString) => {
    if (!dateString) return "Not Specified";
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Get Employee Data safely from populated field or admin object
  const empData = admin?.employeeId || {};
  const designation = empData.designation || admin?.designation || "Enterprise User";
  const department = empData.department || admin?.department || "Operations";
  const employeeCode = empData.employeeId || admin?.employeeId || "N/A";
  const joiningDate = empData.dateOfJoining ? formatDate(empData.dateOfJoining) : "N/A";
  const lastLoginTime = admin?.security?.lastLoginTime ? formatDate(admin.security.lastLoginTime) : "Today";

  return (
    <header className="sticky top-0 z-40 bg-white/70 backdrop-blur-xl border-b border-slate-200/50">
      <div className="flex items-center justify-between px-4 py-2.5 md:px-8 max-w-[1920px] mx-auto">

        {/* Left: Mobile Toggle & Page Context */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSidebar}
            className="md:hidden p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-2xl transition-all active:scale-90"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex flex-col">
            <h3 className="text-sm md:text-base font-black text-slate-900 tracking-tight leading-none">
              EMS Dashboard
            </h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden md:block mt-1">
              {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Right: User Identity Section */}
        <div className="flex items-center gap-2">

          {/* Notifications & Search (Placeholders for UI completeness) */}
          <div className="hidden lg:flex items-center gap-1 mr-4 pr-4 border-r border-slate-200/50">
            <div className="w-8 h-8 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-400 cursor-pointer transition-colors">
              <Activity size={18} />
            </div>
          </div>

          {/* Profile Trigger */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-3 p-1.5 pr-3 rounded-2xl border border-transparent hover:border-slate-200 hover:bg-slate-50 transition-all group outline-none"
            >
              <div className="relative">
                <div className={`absolute -inset-1 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full opacity-0 ${isDropdownOpen ? 'opacity-100 blur-sm' : 'group-hover:opacity-60 group-hover:blur-sm'} transition-all duration-500`}></div>
                <ProfileAvatar
                  user={admin}
                  className="w-9 h-9 ring-2 ring-white relative z-10"
                  showStatus={true}
                />
              </div>

              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-black text-slate-800 leading-none group-hover:text-indigo-600 transition-colors">
                  {admin?.firstName} {admin?.lastName}
                </span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                  {admin?.role === 'admin' ? 'Administrator' : 'Employee'}
                </span>
              </div>

              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-500 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Premium Profile Dropdown */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-4 w-[340px] md:w-[380px] bg-white rounded-[2rem] shadow-[0_30px_70px_-10px_rgba(0,0,0,0.2)] border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-6 duration-300 z-50">
                
                {/* Visual Header */}
                <div className="relative p-6 pb-4 overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5">
                    <Shield size={120} />
                  </div>
                  
                  <div className="flex items-start justify-between relative z-10">
                    <div className="flex items-center gap-4">
                      <ProfileAvatar
                        user={admin}
                        className="w-14 h-14 ring-4 ring-white shadow-2xl shadow-slate-200"
                      />
                      <div className="flex flex-col">
                        <h4 className="font-black text-slate-900 text-lg leading-tight">
                          {admin?.firstName} {admin?.lastName}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="px-2 py-0.5 bg-indigo-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg shadow-indigo-200">
                            {admin?.role}
                          </span>
                          <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                            admin?.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                          }`}>
                            {admin?.status || 'PENDING'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Professional Insights Grid */}
                <div className="px-6 py-4 grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100/50">
                    <div className="flex items-center gap-2 mb-2 text-indigo-600">
                      <CreditCard size={14} />
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Employee ID</span>
                    </div>
                    <p className="text-xs font-black text-slate-800">{employeeCode}</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100/50">
                    <div className="flex items-center gap-2 mb-2 text-purple-600">
                      <Building2 size={14} />
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Department</span>
                    </div>
                    <p className="text-xs font-black text-slate-800 truncate">{department}</p>
                  </div>
                </div>

                {/* Information List */}
                <div className="px-6 space-y-1">
                  <div className="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-all group">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Briefcase size={16} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] leading-none mb-1">Current Role</span>
                      <span className="text-xs font-bold text-slate-700">{designation}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-all group">
                    <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Calendar size={16} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] leading-none mb-1">Joined Date</span>
                      <span className="text-xs font-bold text-slate-700">{joiningDate}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-all group">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Mail size={16} />
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] leading-none mb-1">Work Email</span>
                      <span className="text-xs font-bold text-slate-700 truncate w-full">{admin?.email}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Meta Section */}
                <div className="m-4 mt-6 p-4 rounded-[1.5rem] bg-slate-950 text-white relative overflow-hidden group">
                  <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-indigo-500/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
                  
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Security Level: Secured</span>
                    </div>
                    <Shield size={12} className="text-slate-600" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">Last System Sync</span>
                      <div className="flex items-center gap-1.5">
                        <Clock size={12} className="text-indigo-400" />
                        <span className="text-xs font-black">{lastLoginTime}</span>
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/5 cursor-pointer hover:bg-white/20 transition-all">
                      <ExternalLink size={16} />
                    </div>
                  </div>
                </div>

                <div className="pb-4 text-center">
                   <p className="text-[8px] text-slate-300 font-black uppercase tracking-[0.4em]">Finesse EMS Identity Engine</p>
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
