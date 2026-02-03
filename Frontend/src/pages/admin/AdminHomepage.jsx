// import React, { useState } from "react";
// import {
//   Home,
//   Users,
//   CalendarCheck,
//   ClipboardList,
//   Wallet,
//   Sliders,
//   BarChart3,
//   Settings,
//   LogOut,
//   Menu,
//   X,
//   Moon,
//   Sun,
// } from "lucide-react";
// import { LineChart, Line, PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

// const stats = [
//   { title: "Total Employees", value: 128, icon: Users },
//   { title: "Present Today", value: 112, icon: CalendarCheck },
//   { title: "Pending Leaves", value: 6, icon: ClipboardList },
//   { title: "Payroll Status", value: "Processed", icon: Wallet },
// ];

// const attendanceData = [
//   { month: "Jan", value: 90 },
//   { month: "Feb", value: 95 },
//   { month: "Mar", value: 92 },
//   { month: "Apr", value: 96 },
//   { month: "May", value: 98 },
// ];

// const statusData = [
//   { name: "Active", value: 110 },
//   { name: "On Leave", value: 12 },
//   { name: "Inactive", value: 6 },
// ];

// const menu = [
//   { name: "Dashboard", icon: Home },
//   { name: "Employees", icon: Users },
//   { name: "Attendance", icon: CalendarCheck },
//   { name: "Leave Management", icon: ClipboardList },
//   { name: "Payroll", icon: Wallet },
//   { name: "Admin Settings", icon: Sliders },
//   { name: "Reports", icon: BarChart3 },
//   { name: "Settings", icon: Settings },
// ];

// export default function AdminHomepage() {
//   const [active, setActive] = useState("Dashboard");
//   const [collapsed, setCollapsed] = useState(false);
//   const [mobileOpen, setMobileOpen] = useState(false);
//   const [dark, setDark] = useState(false);

//   const SidebarContent = () => (
//     <div className="flex flex-col h-full">
//       <div className="p-6 text-2xl font-bold tracking-wide">EMS Admin</div>
//       <nav className="flex-1 space-y-1 px-3">
//         {menu.map((item) => (
//           <button
//             key={item.name}
//             onClick={() => {
//               setActive(item.name);
//               setMobileOpen(false);
//             }}
//             className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all duration-200
//               ${active === item.name ? "bg-indigo-600 text-white shadow-lg" : "hover:bg-indigo-100 dark:hover:bg-gray-700"}`}
//           >
//             <item.icon className="w-5 h-5 shrink-0" />
//             <span className={`truncate ${collapsed ? "hidden" : "block"}`}>{item.name}</span>
//           </button>
//         ))}
//       </nav>
//       <button className="m-4 flex items-center gap-2 text-red-400 hover:text-red-500 transition">
//         <LogOut size={18} /> {!collapsed && "Logout"}
//       </button>
//     </div>
//   );

//   return (
//     <div className={dark ? "dark" : ""}>
//       <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white">

//         {/* Desktop Sidebar */}
//         <aside className={`${collapsed ? "w-20" : "w-64"} hidden md:flex bg-white dark:bg-gray-800 shadow-xl transition-all duration-300`}>
//           <SidebarContent />
//         </aside>

//         {/* Mobile Sidebar */}
//         <div className={`fixed inset-0 z-40 md:hidden transition ${mobileOpen ? "visible" : "invisible"}`}>
//           <div
//             className={`absolute inset-0 bg-black/40 transition-opacity ${mobileOpen ? "opacity-100" : "opacity-0"}`}
//             onClick={() => setMobileOpen(false)}
//           />
//           <aside className={`absolute left-0 top-0 h-full w-64 bg-white dark:bg-gray-800 shadow-xl transform transition-transform ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
//             <SidebarContent />
//           </aside>
//         </div>

//         {/* Main */}
//         <main className="flex-1 p-4 sm:p-6">

//           {/* Header */}
//           <div className="flex justify-between items-center mb-8">
//             <div className="flex items-center gap-3">
//               <button className="md:hidden p-2 rounded-lg bg-gray-200 dark:bg-gray-700" onClick={() => setMobileOpen(true)}>
//                 <Menu size={20} />
//               </button>
//               <h1 className="text-2xl sm:text-3xl font-bold">Admin Dashboard</h1>
//             </div>

//             <div className="flex gap-3">
//               <button onClick={() => setCollapsed(!collapsed)} className="hidden md:block px-4 py-2 bg-indigo-600 text-white rounded-lg">Collapse</button>
//               <button onClick={() => setDark(!dark)} className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700">
//                 {dark ? <Sun size={18} /> : <Moon size={18} />}
//               </button>
//             </div>
//           </div>

//           {/* Stats */}
//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
//             {stats.map((s) => (
//               <div key={s.title} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow hover:shadow-xl transition">
//                 <div className="flex items-center justify-between">
//                   <p className="text-gray-400 text-sm">{s.title}</p>
//                   <s.icon className="text-indigo-500" size={22} />
//                 </div>
//                 <h2 className="text-2xl font-bold mt-3">{s.value}</h2>
//               </div>
//             ))}
//           </div>

//           {/* Charts */}
//           <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">

//             <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow h-72">
//               <h3 className="mb-4 font-semibold">Monthly Attendance Trend</h3>
//               <ResponsiveContainer width="100%" height="100%">
//                 <LineChart data={attendanceData}>
//                   <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={3} />
//                   <Tooltip />
//                 </LineChart>
//               </ResponsiveContainer>
//             </div>

//             <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow h-72">
//               <h3 className="mb-4 font-semibold">Employee Status Distribution</h3>
//               <ResponsiveContainer width="100%" height="100%">
//                 <PieChart>
//                   <Pie data={statusData} dataKey="value" outerRadius={90}>
//                     {statusData.map((_, i) => (
//                       <Cell key={i} fill={["#6366f1", "#22c55e", "#f87171"][i]} />
//                     ))}
//                   </Pie>
//                   <Tooltip />
//                 </PieChart>
//               </ResponsiveContainer>
//             </div>

//           </div>

//           {/* Recent Activity */}
//           <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow overflow-x-auto">
//             <h3 className="font-semibold mb-4">Recent Activities</h3>
//             <table className="min-w-full text-left">
//               <thead>
//                 <tr className="text-gray-400 text-sm border-b dark:border-gray-700">
//                   <th className="py-2">Employee</th>
//                   <th>Status</th>
//                   <th>Date</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 <tr className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
//                   <td className="py-3">John Doe</td>
//                   <td className="text-yellow-400">Leave Requested</td>
//                   <td>Today</td>
//                 </tr>
//                 <tr className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
//                   <td className="py-3">Sara Khan</td>
//                   <td className="text-green-400">Employee Added</td>
//                   <td>Yesterday</td>
//                 </tr>
//               </tbody>
//             </table>
//           </div>

//         </main>
//       </div>
//     </div>
//   );
// }
