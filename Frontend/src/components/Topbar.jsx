import React from "react";
import { useAuth } from "../AuthContext/AuthContext";
import ProfileAvatar from "./ProfileAvatar";
import { Menu } from "lucide-react";

/**
 * Topbar Component
 * 
 * Clean, minimal top navigation bar.
 * Removes all popup logic. 
 * Shows current user info and ProfileAvatar.
 */
const Topbar = ({ toggleSidebar }) => {
  const { admin } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200">
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

          {/* User Info & Avatar */}
          <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-sm font-bold text-slate-700 leading-tight">
                {admin?.firstName} {admin?.lastName}
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {admin?.role}
              </span>
            </div>

            {/* Reusable Profile Avatar Component */}
            <div className="group relative cursor-pointer">
              <div className="absolute -inset-0.5 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
              <ProfileAvatar
                user={admin}
                className="w-10 h-10 ring-2 ring-white relative z-10"
                showStatus={true}
              />
            </div>
          </div>

        </div>
      </div>
    </header>
  );
};

export default Topbar;
