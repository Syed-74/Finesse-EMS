import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext/AuthContext";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { admin, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent shadow-lg shadow-indigo-100"></div>
        <p className="mt-4 text-slate-500 font-bold tracking-widest uppercase text-[10px] animate-pulse">Authenticating Session...</p>
      </div>
    );
  }

  if (!admin) {
    // Redirect to login page (which is "/")
    return <Navigate to="/" replace />;
  }

  // Active / Approved Status Check
  if (admin.role === 'employee' && admin.status === 'PENDING') {
    return <Navigate to="/403" replace state={{ reason: "pending_approval" }} />;
  }

  if (admin.isActive === false) {
    return <Navigate to="/403" replace state={{ reason: "inactive_account" }} />;
  }

  // Role authorization check (RBAC)
  if (allowedRoles && !allowedRoles.includes(admin.role)) {
    return <Navigate to="/403" replace state={{ reason: "role_unauthorized" }} />;
  }

  return children;
};

export default ProtectedRoute;
