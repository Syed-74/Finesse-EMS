import React, { useState } from "react";
import { Settings, Calendar as CalendarIcon, FileText, LayoutDashboard } from "lucide-react";
import LeavePolicyForm from "../../../components/leave-management/LeavePolicyForm";
import HolidayManagement from "../../../components/leave-management/HolidayManagement";
import LeaveRequestsTable from "../../../components/leave-management/LeaveRequestsTable";

const Leaves = () => {
  const [activeTab, setActiveTab] = useState("requests");

  const tabs = [
    { id: "requests", label: "Leave Requests", icon: FileText, color: "blue" },
    { id: "policy", label: "Leave Policy", icon: Settings, color: "indigo" },
    { id: "holidays", label: "Holiday Management", icon: CalendarIcon, color: "orange" },
  ];

  return (
    <div className="p-6 md:p-10 space-y-8 bg-gray-50/50 min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <div className="p-2 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-200">
              <LayoutDashboard size={24} />
            </div>
            Leave Management
          </h1>
          <p className="text-gray-500 font-medium text-sm">Configure policies, holidays and manage employee requests.</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 w-full md:w-auto overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 whitespace-nowrap ${activeTab === tab.id
                  ? "bg-gray-900 text-white shadow-xl shadow-gray-200"
                  : "text-gray-400 hover:text-gray-900 hover:bg-gray-50"
                }`}
            >
              <tab.icon size={18} className={activeTab === tab.id ? "text-blue-400" : ""} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {activeTab === "requests" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-gray-900 uppercase text-xs tracking-[0.2em] border-l-4 border-blue-600 pl-4">
                Employee Requests
              </h2>
            </div>
            <LeaveRequestsTable />
          </div>
        )}

        {activeTab === "policy" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-gray-900 uppercase text-xs tracking-[0.2em] border-l-4 border-indigo-600 pl-4">
                Global Policy Settings
              </h2>
            </div>
            <LeavePolicyForm />
          </div>
        )}

        {activeTab === "holidays" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-gray-900 uppercase text-xs tracking-[0.2em] border-l-4 border-orange-500 pl-4">
                Central Holiday Calendar
              </h2>
            </div>
            <HolidayManagement />
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaves;