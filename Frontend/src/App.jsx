import { Routes, Route } from "react-router-dom";
import AdminDashboard from "./pages/admin/AdminDashboard";
// import EmployeeDashboard from "./pages/employee/EmployeeDashboard";
import Login from "./pages/auth/Login";
import Attendance from "../src/pages/admin/Sidepages/Attendance";
import Leaves from "../src/pages/admin/Sidepages/Leaves";
import Payroll from "../src/pages/admin/Sidepages/Payroll";
import Reports from "../src/pages/admin/Sidepages/Reports";
import DashboardLayout from "./layouts/DashboardLayout";
import ShiftManagement from "./pages/admin/Sidepages/ShiftManagement";
import EmployeeDashboard from "./pages/employee/EmployeeDashboard";
import Settings from "./pages/admin/Sidepages/Settings";
import EmployeePayroll from "./pages/employee/EmployeePayroll";
import EmployeeLeaves from "./pages/employee/EmployeeLeaves";
import EmployeeAttendance from "./pages/employee/EmployeeAttendance";
import EmployeeSettings from "./pages/employee/EmployeeSettings";
import Communication from "./pages/admin/Sidepages/Communication";
import EmployeeNotifications from "./pages/employee/EmployeeNotifications";
import Employees from "./pages/admin/Sidepages/Employees";
import CreateTask from "./pages/admin/Sidepages/CreateTask";
import TaskList from "./pages/admin/Sidepages/TaskList";
import TaskDetailAdmin from "./pages/admin/Sidepages/TaskDetailAdmin";
import OfficeIPConfig from "./pages/admin/Sidepages/OfficeIPConfig";
import EmployeeTask from "./pages/employee/EmployeeTask";
import ProtectedRoute from "./ProtectedRoute";
import AccessDenied from "./pages/auth/AccessDenied";
import { Toaster } from "react-hot-toast";
import { ConfirmProvider } from "./context/ConfirmContext";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";


function App() {
  return (
    <ConfirmProvider>
      <Routes>
        {/* PUBLIC ROUTE */}
        <Route path="/" element={<Login />} />

        {/* ACCESS DENIED */}
        <Route path="/403" element={<AccessDenied />} />

        {/* SECURE ADMIN DESK */}
        <Route element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <DashboardLayout role="admin" />
          </ProtectedRoute>
        }>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/employees" element={<Employees />} />
          <Route path="/admin/attendance" element={<Attendance />} />
          <Route path="/admin/leaves" element={<Leaves />} />
          <Route path="/admin/payroll" element={<Payroll />} />
          <Route path="/admin/reports" element={<Reports />} />
          <Route path="/admin/settings" element={<Settings />} />
          <Route path="/admin/shifts" element={<ShiftManagement />} />
          <Route path="/admin/communication" element={<Communication />} />
          <Route path="/admin/tasks" element={<TaskList />} />
          <Route path="/admin/tasks/create" element={<CreateTask />} />
          <Route path="/admin/tasks/:id" element={<TaskDetailAdmin />} />
          <Route path="/admin/office-config" element={<OfficeIPConfig />} />
        </Route>

        {/* SECURE EMPLOYEE WORKSPACE */}
        <Route element={
          <ProtectedRoute allowedRoles={["employee"]}>
            <DashboardLayout role="employee" />
          </ProtectedRoute>
        }>
          <Route path="/employee" element={<EmployeeDashboard />} />
          <Route path="/employee/profile" element={<EmployeeSettings />} />
          <Route path="/employee/attendance" element={<EmployeeAttendance />} />
          <Route path="/employee/leaves" element={<EmployeeLeaves />} />
          <Route path="/employee/salary" element={<EmployeePayroll />} />
          <Route path="/employee/notifications" element={<EmployeeNotifications />} />
          <Route path="/employee/settings" element={<EmployeeSettings />} />
          <Route path="/employee/tasks" element={<EmployeeTask />} />
          <Route path="/employee/tasks/:id" element={<EmployeeTask />} /> 
        </Route>
      </Routes>

      {/* ✅ Move Toaster here */}
      <Toaster position="top-right" reverseOrder={false} />
    </ConfirmProvider>
  );
}

export default App;
