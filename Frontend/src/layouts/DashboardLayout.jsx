import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { useState } from "react";

const DashboardLayout = ({ role }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar - Desktop & Mobile */}
      <Sidebar role={role} open={open} setOpen={setOpen} />

      <div className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden">
        <Topbar toggleSidebar={() => setOpen(!open)} />

        <main className="p-4 md:p-6 lg:p-8 mt-16 lg:mt-0 flex-1 w-full max-w-[1800px] mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;