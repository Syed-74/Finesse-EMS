import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../AuthContext/AuthContext.jsx";

const ProtectedRoute = ({ children }) => {
  const { admin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!admin) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
