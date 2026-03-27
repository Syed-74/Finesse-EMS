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
import { Toaster } from "react-hot-toast";
import { ConfirmProvider } from "./context/ConfirmContext";


function App() {
  return (
    <ConfirmProvider>
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
          <Route path="/admin/shifts" element={<ShiftManagement />} />
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

      {/* ✅ Move Toaster here */}
      <Toaster position="top-right" reverseOrder={false} />
    </ConfirmProvider>
  );
}

export default App;
