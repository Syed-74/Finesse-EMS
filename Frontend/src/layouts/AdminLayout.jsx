// import { Outlet } from "react-router-dom";
// import { useState } from "react";
// import Sidebar from "../components/Sidebar";
// import { Menu, ChevronLeft, User } from "lucide-react";

// export default function AdminLayout() {
//   const [collapsed, setCollapsed] = useState(false);
//   const [mobileOpen, setMobileOpen] = useState(false);

//   return (
//     <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white">
//       {/* Desktop Sidebar */}
//       <aside className="hidden md:block transition-all duration-300">
//         <Sidebar collapsed={collapsed} />
//       </aside>

//       {/* Mobile Sidebar */}
//       <div
//         className={`fixed inset-0 z-40 md:hidden transition ${
//           mobileOpen ? "visible" : "invisible"
//         }`}
//       >
//         <div
//           className={`absolute inset-0 bg-black/40 transition-opacity ${
//             mobileOpen ? "opacity-100" : "opacity-0"
//           }`}
//           onClick={() => setMobileOpen(false)}
//         />
//         <div
//           className={`absolute left-0 top-0 h-full w-64 bg-white dark:bg-gray-800 shadow-xl
//           transform transition-transform duration-300 ${
//             mobileOpen ? "translate-x-0" : "-translate-x-full"
//           }`}
//         >
//           <Sidebar collapsed={false} />
//         </div>
//       </div>

//       {/* Content */}
//       <div className="flex-1 flex flex-col">
//         {/* Header */}
//         <header className="sticky top-0 z-30 bg-white dark:bg-gray-800 shadow-sm px-4 sm:px-6 py-3 flex justify-between items-center">
//           <div className="flex items-center gap-3">
//             {/* Mobile menu */}
//             <button
//               className="md:hidden p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
//               onClick={() => setMobileOpen(true)}
//             >
//               <Menu size={20} />
//             </button>

//             {/* Collapse toggle */}
//             <button
//               className="hidden md:flex p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
//               onClick={() => setCollapsed(!collapsed)}
//             >
//               <ChevronLeft
//                 className={`transition-transform ${collapsed ? "rotate-180" : ""}`}
//               />
//             </button>

//             <h1 className="text-lg sm:text-xl font-semibold">
//               Admin Dashboard
//             </h1>
//           </div>

//           {/* User */}
//           <div className="flex items-center gap-3">
//             <span className="hidden sm:block text-sm text-gray-400">
//               Welcome, Admin
//             </span>
//             <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center">
//               <User size={18} />
//             </div>
//           </div>
//         </header>

//         {/* Page Area */}
//         <main className="flex-1 p-4 sm:p-6 max-w-[1600px] mx-auto w-full">
//           <Outlet />
//         </main>
//       </div>
//     </div>
//   );
// }


import React from 'react'

const AdminLayout = () => {
  return (
    <div>AdminLayout</div>
  )
}

export default AdminLayout