import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ShieldAlert, ArrowLeft, LogOut, Lock } from "lucide-react";
import { useAuth } from "../../AuthContext/AuthContext";

const AccessDenied = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, admin } = useAuth();
  
  // Extract reason from router state
  const reason = location.state?.reason || "role_unauthorized";

  const getMessageContent = () => {
    switch (reason) {
      case "pending_approval":
        return {
          title: "Registration Pending",
          description: "Your employee account is registered successfully but is currently pending administrative approval. HR Operations will review your credentials shortly.",
          statusText: "Awaiting HR Review"
        };
      case "inactive_account":
        return {
          title: "Account Inactive",
          description: "Your enterprise identity profile has been deactivated. If you believe this is an error, please contact your systems administrator or IT support desk.",
          statusText: "Deactivated"
        };
      case "role_unauthorized":
      default:
        return {
          title: "Access Denied",
          description: "You do not possess the required credentials or role privilege to access this protected enterprise asset.",
          statusText: "Forbidden (403)"
        };
    }
  };

  const { title, description, statusText } = getMessageContent();

  const handleBackToSafety = () => {
    if (!admin) {
      navigate("/", { replace: true });
    } else if (admin.role === "admin") {
      navigate("/admin", { replace: true });
    } else {
      navigate("/employee", { replace: true });
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#f8fafc] flex items-center justify-center p-4 md:p-6 lg:p-8 font-sans relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-rose-50/50 blur-3xl"></div>
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] rounded-full bg-amber-50/50 blur-3xl"></div>
      </div>

      <div className="w-full max-w-xl bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-slate-100 p-8 md:p-12 text-center relative z-10 animate-in zoom-in-95 duration-500">
        
        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-rose-50 text-rose-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-rose-100/50 mb-8">
          <Lock className="w-3.5 h-3.5" />
          {statusText}
        </div>

        {/* Dynamic Icon */}
        <div className="relative w-24 h-24 mx-auto mb-8 flex items-center justify-center">
          <div className="absolute inset-0 bg-rose-500/10 rounded-[2rem] blur-xl animate-pulse"></div>
          <div className="w-20 h-20 bg-rose-50 border border-rose-100 rounded-[1.8rem] flex items-center justify-center text-rose-600 shadow-inner">
            <ShieldAlert className="w-10 h-10 animate-bounce" />
          </div>
        </div>

        {/* Title & Desc */}
        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-4 uppercase">{title}</h1>
        <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-md mx-auto mb-10">
          {description}
        </p>

        {/* Actions Grid */}
        <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
          <button
            onClick={handleBackToSafety}
            className="w-full sm:w-auto px-8 py-4 bg-[#0f172a] hover:bg-[#1e293b] text-white rounded-2xl font-black text-sm shadow-xl shadow-slate-900/10 hover:shadow-slate-900/20 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-3"
          >
            <ArrowLeft className="w-4 h-4" />
            Go to Safe Dashboard
          </button>
          
          {admin && (
            <button
              onClick={signOut}
              className="w-full sm:w-auto px-8 py-4 bg-white border-2 border-slate-100 hover:border-slate-200 text-slate-600 hover:bg-slate-50 rounded-2xl font-black text-sm active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              <LogOut className="w-4 h-4" />
              Sign Out Identity
            </button>
          )}
        </div>

        {/* Footer Brand */}
        <div className="mt-12 text-center opacity-30">
          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-400">Finesse EMS Identity Engine</p>
        </div>
      </div>
    </div>
  );
};

export default AccessDenied;
