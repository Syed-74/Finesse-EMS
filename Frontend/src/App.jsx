// // import React from 'react'
// // import {  Routes, Route } from 'react-router-dom'
// // import Login from './pages/auth/Login'
// // // import AdminHomepage from './pages/admin/AdminHomepage'
// // import EmployeeDashboard from './pages/employee/EmployeeDashboard'
// // import AdminLayout from './layouts/AdminLayout'
// // import Dashboard from './pages/admin/Sidepages/Dashboard'
// // import Employees from './pages/admin/Sidepages/Employees'
// // import Attendance from './pages/admin/Sidepages/Attendance'
// // import Leaves from './pages/admin/Sidepages/Leaves'
// // import Reports from './pages/admin/Sidepages/Reports'

// // function App() {

// //   return (
// //     <>
// //       {/* Routes */}
// //       <Routes>
// //         <Route path="/" element={<Login />} />
// //         {/* <Route path="/Admindashboard" element={<AdminHomepage />} /> */}
// //         <Route path="/employeeDashboard" element={<EmployeeDashboard />} />

// //         <Route path="/Admindashboard" element={<AdminLayout />}>
// //         <Route index element={<Navigate to="Admindashboard" />} />
// //         <Route path="dashboard" element={<Dashboard />} />
// //         <Route path="employees" element={<Employees />} />
// //         <Route path="attendance" element={<Attendance />} />
// //         <Route path="leaves" element={<Leaves />} />
// //         <Route path="reports" element={<Reports />} />
// //       </Route>
// //       </Routes>
// //     </>
// //   )
// // }

// // export default App

// import { Routes, Route, Navigate } from "react-router-dom";
// import AdminLayout from "./layouts/AdminLayout";
// import Dashboard from "./pages/admin/Sidepages/Dashboard";
// import Employees from "./pages/admin/Sidepages/Employees";
// import Attendance from "./pages/admin/Sidepages/Attendance";
// import Leaves from "./pages/admin/Sidepages/Leaves";
// import Reports from "./pages/admin/Sidepages/Reports";
// import EmployeeDashboard from "./pages/employee/EmployeeDashboard";
// import Login from "./pages/auth/Login";
// import Settings from "./pages/admin/Sidepages/Settings";
// import ProtectedRoute from "./components/ProtectedRoute";

// export default function App() {
//   return (
//     <Routes>
//       {/* <Route path="/employeeDashboard" element={<ProtectedRoute><EmployeeDashboard /></ProtectedRoute>} /> */}
//         <Route 
//         path="/employeeDashboard" 
//         element={
//           <ProtectedRoute>
//             <AdminLayout />
//           </ProtectedRoute>
//         }
//       >
//         <Route index element={<Navigate to="/employeeDashboard/dashboard" />} />
//         <Route path="dashboard" element={<Dashboard />} />
//         <Route path="attendance" element={<Attendance />} />
//         <Route path="leaves" element={<Leaves />} />
//         <Route path="reports" element={<Reports />} />
//         <Route path="settings" element={<Settings />} />
//       </Route>
//       <Route path="/" element={<Login />} />
//       <Route 
//         path="/Admindashboard" 
//         element={
//           <ProtectedRoute>
//             <AdminLayout />
//           </ProtectedRoute>
//         }
//       >
//         <Route index element={<Navigate to="/Admindashboard/dashboard" />} />
//         <Route path="dashboard" element={<Dashboard />} />
//         <Route path="employees" element={<Employees />} />
//         <Route path="attendance" element={<Attendance />} />
//         <Route path="leaves" element={<Leaves />} />
//         <Route path="reports" element={<Reports />} />
//         <Route path="settings" element={<Settings />} />
//       </Route>
//     </Routes>
//   );
// }



// import { Routes, Route, Navigate } from "react-router-dom";

// import Login from "./pages/auth/Login";

// import AdminLayout from "./layouts/AdminLayout";
// import EmployeeLayout from "./layouts/EmployeeLayout";

// import Dashboard from "./pages/admin/Sidepages/Dashboard";
// import Employees from "./pages/admin/Sidepages/Employees";
// import Attendance from "./pages/admin/Sidepages/Attendance";
// import Leaves from "./pages/admin/Sidepages/Leaves";
// import Reports from "./pages/admin/Sidepages/Reports";
// import Settings from "./pages/admin/Sidepages/Settings";

// import EmployeeDashboard from "./pages/employee/EmployeeDashboard";

// import ProtectedRoute from "./components/ProtectedRoute";
// import RoleRoute from "./components/RoleRoute";

// export default function App() {
//   return (
//     <Routes>

//       {/* Public */}
//       <Route path="/" element={<Login />} />

//       {/* Protected */}
//       <Route element={<ProtectedRoute />}>

//         {/* ADMIN */}
//         <Route
//           path="/Admindashboard"
//           element={
//             <RoleRoute role="admin">
//               <AdminLayout />
//             </RoleRoute>
//           }
//         >
//           <Route index element={<Navigate to="dashboard" />} />
//           <Route path="dashboard" element={<Dashboard />} />
//           <Route path="employees" element={<Employees />} />
//           <Route path="attendance" element={<Attendance />} />
//           <Route path="leaves" element={<Leaves />} />
//           <Route path="reports" element={<Reports />} />
//           <Route path="settings" element={<Settings />} />
//         </Route>

//         {/* EMPLOYEE */}
//         <Route
//           path="/employeeDashboard"
//           element={
//             <RoleRoute role="employee">
//               <EmployeeLayout />
//             </RoleRoute>
//           }
//         >
//           <Route index element={<EmployeeDashboard />} />
//         </Route>

//       </Route>
//     </Routes>
//   );
// }



import { Routes, Route } from "react-router-dom";
import AdminDashboard from "./pages/admin/AdminDashboard";
// import EmployeeDashboard from "./pages/employee/EmployeeDashboard";
import Login from "./pages/auth/Login";
import Attendance from "../src/pages/admin/Sidepages/Attendance";
import Leaves from "../src/pages/admin/Sidepages/Leaves";
import Payroll from "../src/pages/admin/Sidepages/Payroll";
import Reports from "../src/pages/admin/Sidepages/Reports";
import DashboardLayout from "./layouts/DashboardLayout";
import EmployeeDashboard from "./pages/employee/EmployeeDashboard";
import Settings from "./pages/admin/Sidepages/Settings";
import EmployeePayroll from "./pages/employee/EmployeePayroll";
import EmployeeLeaves from "./pages/employee/EmployeeLeaves";
import EmployeeAttendance from "./pages/employee/EmployeeAttendance";
import EmployeeSettings from "./pages/employee/EmployeeSettings";
import Communication from "./pages/admin/Sidepages/Communication";
import EmployeeNotifications from "./pages/employee/EmployeeNotifications";
import Employees from "./pages/admin/Sidepages/Employees";


function App() {
  return (
   <Routes>
      <Route path="/" element={<Login />} />

      {/* ADMIN */}
      <Route element={<DashboardLayout role="admin" />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/employees" element={<Employees />} />
        <Route path="/admin/attendance" element={<Attendance />} />
        <Route path="/admin/leaves" element={<Leaves />} />
        <Route path="/admin/payroll" element={<Payroll />} />
        <Route path="/admin/reports" element={<Reports />} />
        <Route path="/admin/settings" element={<Settings />} />
        <Route path="/admin/communication" element={<Communication />} />
      </Route>

      {/* EMPLOYEE */}
      <Route element={<DashboardLayout role="employee" />}>
        <Route path="/employee" element={<EmployeeDashboard />} />
        <Route path="/employee/profile" element={<EmployeeSettings />} />
        <Route path="/employee/attendance" element={<EmployeeAttendance />} />
        <Route path="/employee/leaves" element={<EmployeeLeaves />} />
        <Route path="/employee/salary" element={<EmployeePayroll />} />
        <Route path="/employee/notifications" element={<EmployeeNotifications />} />
        <Route path="/employee/settings" element={<EmployeeSettings />} />
      </Route>
    </Routes>
  );
}

export default App;
