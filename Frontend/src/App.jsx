// import React from 'react'
// import {  Routes, Route } from 'react-router-dom'
// import Login from './pages/auth/Login'
// // import AdminHomepage from './pages/admin/AdminHomepage'
// import EmployeeDashboard from './pages/employee/EmployeeDashboard'
// import AdminLayout from './layouts/AdminLayout'
// import Dashboard from './pages/admin/Sidepages/Dashboard'
// import Employees from './pages/admin/Sidepages/Employees'
// import Attendance from './pages/admin/Sidepages/Attendance'
// import Leaves from './pages/admin/Sidepages/Leaves'
// import Reports from './pages/admin/Sidepages/Reports'

// function App() {

//   return (
//     <>
//       {/* Routes */}
//       <Routes>
//         <Route path="/" element={<Login />} />
//         {/* <Route path="/Admindashboard" element={<AdminHomepage />} /> */}
//         <Route path="/employeeDashboard" element={<EmployeeDashboard />} />

//         <Route path="/Admindashboard" element={<AdminLayout />}>
//         <Route index element={<Navigate to="Admindashboard" />} />
//         <Route path="dashboard" element={<Dashboard />} />
//         <Route path="employees" element={<Employees />} />
//         <Route path="attendance" element={<Attendance />} />
//         <Route path="leaves" element={<Leaves />} />
//         <Route path="reports" element={<Reports />} />
//       </Route>
//       </Routes>
//     </>
//   )
// }

// export default App

import { Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "./layouts/AdminLayout";
import Dashboard from "./pages/admin/Sidepages/Dashboard";
import Employees from "./pages/admin/Sidepages/Employees";
import Attendance from "./pages/admin/Sidepages/Attendance";
import Leaves from "./pages/admin/Sidepages/Leaves";
import Reports from "./pages/admin/Sidepages/Reports";
import EmployeeDashboard from "./pages/employee/EmployeeDashboard";
import Login from "./pages/auth/Login";
import Settings from "./pages/admin/Sidepages/Settings";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <Routes>
      <Route path="/employeeDashboard" element={<EmployeeDashboard />} />
      <Route path="/" element={<Login />} />
      <Route 
        path="/Admindashboard" 
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/Admindashboard/dashboard" />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="employees" element={<Employees />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="leaves" element={<Leaves />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}
