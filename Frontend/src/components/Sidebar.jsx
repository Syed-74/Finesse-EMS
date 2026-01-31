import { NavLink } from "react-router-dom";
import {
  Home,
  Users,
  CalendarCheck,
  ClipboardList,
  BarChart3,
  Settings,
  LogOut,
} from "lucide-react";

const menu = [
  { name: "Dashboard", path: "/Admindashboard/dashboard", icon: Home },
  { name: "Employees", path: "/Admindashboard/employees", icon: Users },
  { name: "Attendance", path: "/Admindashboard/attendance", icon: CalendarCheck },
  { name: "Leaves", path: "/Admindashboard/leaves", icon: ClipboardList },
  { name: "Reports", path: "/Admindashboard/reports", icon: BarChart3 },
  { name: "Settings", path: "/Admindashboard/settings", icon: Settings },
];

export default function Sidebar({ collapsed }) {
  return (
    <aside
      className={`h-screen ${collapsed ? "w-20" : "w-64"}
      bg-gradient-to-b from-indigo-950 via-indigo-900 to-indigo-800
      text-white transition-all duration-300 flex flex-col shadow-xl`}
    >
      {/* Brand */}
      <div className="px-6 py-5 text-xl font-bold border-b border-white/10">
        {collapsed ? "EMS" : "EMS Admin"}
      </div>

      {/* Menu */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {menu.map(item => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-3 rounded-xl transition-all
               ${
                 isActive
                   ? "bg-white/20 shadow-lg"
                   : "hover:bg-white/10"
               }`
            }
          >
            <item.icon size={20} />
            {!collapsed && item.name}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-white/10">
        <button className="flex items-center gap-3 text-red-300 hover:text-red-400">
          <LogOut size={18} />
          {!collapsed && "Logout"}
        </button>
      </div>
    </aside>
  );
}
