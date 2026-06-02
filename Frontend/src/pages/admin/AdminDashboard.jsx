import React, { useState, useEffect } from "react";
// import axios from "axios";
import { useNavigate } from "react-router-dom";
import axios from "../../api/axios";
import {
  Users,
  CreditCard,
  Calendar,
  Clock,
  UserCheck,
  UserPlus,
  FileText,
  TrendingUp,
  ArrowUpRight,
  ChevronRight,
  Bell,
  Search,
  Filter,
  Loader2,
  AlertTriangle,
  Activity
} from "lucide-react";

/**
 * AdminDashboard Component
 * Live production-ready control panel for administrators.
 * Integrates real-time data from organization-wide APIs.
 */
const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    totalEmployees: 0,
    leaveStats: { totalRequests: 0, pending: 0, onLeaveToday: 0 },
    attendanceToday: { present: 0, late: 0, absent: 0 },
    recentActivity: []
  });

  // Fetch all dashboard data concurrently
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split("T")[0];
      const token = localStorage.getItem("token");

      // Configure individual requests with token
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [empRes, leaveStatRes, attendanceStatsRes, activityRes] = await Promise.all([
        axios.get("/employees", config),
        axios.get("/leaveapplication/stats", config),
        axios.get("/attendance/stats?date=" + today, config),
        axios.get("/leaveapplication", config)
      ]);

      const rawActivity = Array.isArray(activityRes.data?.data) ? activityRes.data.data.slice(0, 6) : [];
      const mappedActivity = rawActivity.map(act => ({
        leaveId: act._id,
        employeeName: act.employeeId
          ? `${act.employeeId.firstName} ${act.employeeId.lastName}`
          : "Unknown Employee",
        leaveType: act.leaveType,
        totalDays: act.totalDays,
        reason: act.employeeComment || "No comment",
        appliedAt: act.createdAt,
        status: act.status
      }));

      setData({
        totalEmployees: Array.isArray(empRes.data) ? empRes.data.length : 0,
        leaveStats: leaveStatRes.data || { totalRequests: 0, pending: 0, onLeaveToday: 0 },
        attendanceToday: attendanceStatsRes.data || { present: 0, late: 0, absent: 0 },
        recentActivity: mappedActivity
      });
    } catch (error) {
      console.error("Dashboard Sync Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Auto-refresh data every 5 minutes
    const interval = setInterval(fetchDashboardData, 300000);
    return () => clearInterval(interval);
  }, []);

  const overviewStats = [
    {
      label: "Total Employees",
      value: data.totalEmployees,
      color: "text-blue-600",
      bg: "bg-blue-50",
      icon: Users,
      sub: "Workforce headcount",
      path: "/admin/employees"
    },
    {
      label: "On Leave Today",
      value: data.leaveStats.onLeaveToday,
      color: "text-purple-600",
      bg: "bg-purple-50",
      icon: Calendar,
      sub: "Approved absentees",
      path: "/admin/leaves"
    },
    {
      label: "Pending Review",
      value: data.leaveStats.pending,
      color: "text-amber-600",
      bg: "bg-amber-50",
      icon: Clock,
      sub: "Leaves requiring action",
      path: "/admin/leaves"
    },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-slate-400 gap-4">
        <div className="relative">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Activity className="w-4 h-4 text-indigo-400" />
          </div>
        </div>
        <div className="text-center">
          <p className="font-bold text-slate-600 text-lg">Synchronizing Portal...</p>
          <p className="text-xs font-medium uppercase tracking-[0.2em]">Acquiring latest HR metrics</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-8 max-w-[1800px] mx-auto animate-in fade-in slide-in-from-bottom-2 duration-700 font-sans">

      {/* 1. ADMIN HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-indigo-600 font-black tracking-widest uppercase text-[10px]">
            Authorized Console • {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Dashboard Overview</h1>
          <p className="text-sm text-slate-500 font-medium">Monitoring <span className="text-slate-900 font-bold">{data.totalEmployees} employees</span> across all departments.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative hidden xl:block">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search across modules..."
              className="pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-72 transition-all placeholder:text-slate-300"
            />
          </div>
          <button
            onClick={fetchDashboardData}
            title="Refresh Data"
            className="p-3 bg-white border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-indigo-600 transition-all shadow-sm active:scale-95"
          >
            <Bell className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 2. HIGH-FIDELITY OVERVIEW CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {overviewStats.map((stat, i) => (
          <div
            key={i}
            onClick={() => navigate(stat.path)}
            className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-indigo-50/50 hover:border-indigo-200 transition-all duration-500 group cursor-pointer overflow-hidden relative"
          >
            <div className={`absolute -right-10 -bottom-10 opacity-5 group-hover:scale-110 group-hover:opacity-10 transition-all duration-700`}>
              <stat.icon className={`w-48 h-48 ${stat.color}`} />
            </div>
            <div className="flex items-center justify-between mb-6 relative z-10">
              <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color} transition-transform group-hover:rotate-12`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-black text-slate-400 group-hover:text-slate-600 uppercase tracking-[0.2em] transition-colors">{stat.label}</span>
            </div>
            <div className="relative z-10">
              <div className="flex items-baseline gap-2">
                <h2 className={`text-5xl font-black tracking-tighter ${stat.color}`}>{stat.value}</h2>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <div className="w-4 h-[1px] bg-slate-200 group-hover:w-8 transition-all"></div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.sub}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* LEFT COMPONENT: ANALYTICS & ACTIVITY */}
        <div className="lg:col-span-8 space-y-8">

          {/* REAL-TIME ATTENDANCE VISUALIZER */}
          <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden group">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-slate-900 text-white rounded-xl shadow-lg shadow-slate-200">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-black text-slate-900 uppercase tracking-tight text-sm">Attendance Snapshot</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Live System Analytics</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/admin/attendance')}
                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
              >
                <Filter className="w-4 h-4" />
              </button>
            </div>
            <div className="p-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="p-6 border border-slate-100 rounded-3xl bg-slate-50/30 hover:bg-white hover:shadow-lg hover:border-emerald-100 transition-all duration-500">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">On Duty</p>
                <div className="flex items-center justify-between">
                  <span className="text-4xl font-black text-emerald-600 tracking-tighter">{data.attendanceToday.present}</span>
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                </div>
              </div>
              <div className="p-6 border border-slate-100 rounded-3xl bg-slate-50/30 hover:bg-white hover:shadow-lg hover:border-amber-100 transition-all duration-500">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Late Check-in</p>
                <div className="flex items-center justify-between">
                  <span className="text-4xl font-black text-amber-600 tracking-tighter">{data.attendanceToday.late}</span>
                  {data.attendanceToday.late > 5 && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                </div>
              </div>
              <div className="p-6 border border-slate-100 rounded-3xl bg-slate-50/30 hover:bg-white hover:shadow-lg hover:border-rose-100 transition-all duration-500">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Absences</p>
                <div className="flex items-center justify-between">
                  <span className="text-4xl font-black text-rose-600 tracking-tighter">{data.attendanceToday.absent}</span>
                  <span className="text-[10px] font-black text-slate-300">Today</span>
                </div>
              </div>
            </div>
            <div className="px-8 py-4 bg-slate-50/50 border-t border-slate-100 flex justify-between items-center group-hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Biometric sync stable</p>
              </div>
              <button
                onClick={() => navigate('/admin/attendance')}
                className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline flex items-center gap-1 group/btn"
              >
                Detailed Reports <ArrowUpRight className="w-3 h-3 group-hover/btn:-translate-y-0.5 group-hover/btn:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>

          {/* RECENT ORGANIZATION ACTIVITY LOG */}
          <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-black text-slate-900 uppercase tracking-tight text-sm">Staff Request Inbox</h2>
              <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">{data.leaveStats.pending} PENDING</span>
            </div>
            <div className="divide-y divide-slate-50">
              {data.recentActivity.length > 0 ? (
                data.recentActivity.map((act) => (
                  <div key={act.leaveId} className="px-8 py-5 flex items-center justify-between hover:bg-slate-50/50 transition-all group">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-slate-400 border border-slate-200 group-hover:bg-white group-hover:border-indigo-100 group-hover:text-indigo-600 transition-all shadow-sm">
                        {act.employeeName?.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-800 tracking-tight group-hover:text-indigo-600 transition-colors">{act.employeeName}</p>
                        <p className="text-xs text-slate-500 font-bold leading-tight uppercase tracking-wider text-[9px]">Requested {act.leaveType} • {act.totalDays} Workdays</p>
                        <p className="text-[10px] text-slate-400 font-medium italic truncate max-w-[200px] mt-1">"{act.reason}"</p>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-2">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em]">{new Date(act.appliedAt).toLocaleDateString()}</p>
                      <span className={`text-[9px] font-black px-3 py-1 rounded-lg border-2 uppercase tracking-widest ${act.status === 'Pending' ? 'bg-amber-50 text-amber-600 border-amber-100/50' :
                          act.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100/50' :
                            'bg-indigo-50 text-indigo-600 border-indigo-100/50'
                        }`}>
                        {act.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-8 py-16 text-center text-slate-300">
                  <Activity className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p className="text-xs font-black uppercase tracking-widest">No recent transactions detected</p>
                </div>
              )}
            </div>
            <button
              onClick={() => navigate('/admin/leaves')}
              className="w-full py-5 bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] hover:bg-slate-100 hover:text-indigo-600 transition-all border-t border-slate-100"
            >
              Access Complete Management Terminal
            </button>
          </div>

        </div>

        {/* RIGHT COMPONENT: NAVIGATION HUB & ALERTS */}
        <div className="lg:col-span-4 space-y-8">

          {/* MANAGEMENT NAVIGATION CLUSTER */}
          <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 opacity-40"></div>
            <h2 className="font-black text-slate-900 uppercase tracking-tight text-sm mb-8 relative z-10">Administrative Hub</h2>
            <div className="grid grid-cols-1 gap-4 relative z-10">
              <button
                onClick={() => navigate('/admin/employees')}
                className="flex items-center gap-5 p-5 bg-slate-50 hover:bg-white border border-transparent hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-50 rounded-2xl transition-all duration-300 group"
              >
                <div className="p-3 bg-white rounded-xl shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  <UserPlus className="w-5 h-5 text-indigo-600 group-hover:text-white" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-black text-slate-800 uppercase tracking-tight">Onboard Staff</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Employee Directory</p>
                </div>
                <ChevronRight className="w-4 h-4 ml-auto text-slate-300 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => navigate('/admin/payroll')}
                className="flex items-center gap-5 p-5 bg-slate-50 hover:bg-white border border-transparent hover:border-emerald-100 hover:shadow-xl hover:shadow-emerald-50 rounded-2xl transition-all duration-300 group"
              >
                <div className="p-3 bg-white rounded-xl shadow-sm group-hover:bg-emerald-600 group-hover:text-white transition-all">
                  <CreditCard className="w-5 h-5 text-emerald-600 group-hover:text-white" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-black text-slate-800 uppercase tracking-tight">Financial Desk</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Payroll & Salaries</p>
                </div>
                <ChevronRight className="w-4 h-4 ml-auto text-slate-300 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => navigate('/admin/communication')}
                className="flex items-center gap-5 p-5 bg-slate-50 hover:bg-white border border-transparent hover:border-amber-100 hover:shadow-xl hover:shadow-amber-50 rounded-2xl transition-all duration-300 group"
              >
                <div className="p-3 bg-white rounded-xl shadow-sm group-hover:bg-amber-600 group-hover:text-white transition-all">
                  <Clock className="w-5 h-5 text-amber-600 group-hover:text-white" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-black text-slate-800 uppercase tracking-tight">Communication</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Broadcast Notices</p>
                </div>
                <ChevronRight className="w-4 h-4 ml-auto text-slate-300 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => navigate('/admin/reports')}
                className="flex items-center gap-5 p-5 bg-slate-50 hover:bg-white border border-transparent hover:border-rose-100 hover:shadow-xl hover:shadow-rose-50 rounded-2xl transition-all duration-300 group"
              >
                <div className="p-3 bg-white rounded-xl shadow-sm group-hover:bg-rose-600 group-hover:text-white transition-all">
                  <FileText className="w-5 h-5 text-rose-600 group-hover:text-white" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-black text-slate-800 uppercase tracking-tight">Audit Center</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Generate MIS Reports</p>
                </div>
                <ChevronRight className="w-4 h-4 ml-auto text-slate-300 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* CRITICAL ALERTS / NOTICES SECTION */}
          <div className="bg-[#0f172a] p-8 rounded-[2rem] shadow-2xl text-white relative overflow-hidden border border-slate-800">
            <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500"></div>
            <div className="absolute top-0 right-0 p-6 opacity-5 rotate-12">
              <Activity className="w-32 h-32" />
            </div>
            <h2 className="text-xs font-black mb-8 flex items-center gap-2 relative z-10 uppercase tracking-[0.3em] text-slate-400">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div> System Status
            </h2>
            <div className="space-y-5 relative z-10">
              <div className="p-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all cursor-pointer group">
                <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">Infrastructure</p>
                <h4 className="text-xs font-bold text-slate-100 group-hover:text-white leading-relaxed">Automated cloud backup completed successfully at 04:00 AM.</h4>
              </div>
              <div className="p-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all cursor-pointer group">
                <p className="text-[8px] font-black text-amber-400 uppercase tracking-widest mb-1">Compliance</p>
                <h4 className="text-xs font-bold text-slate-100 group-hover:text-white leading-relaxed">Biometric firmware update is required for the main entrance gate.</h4>
              </div>
            </div>
            <button
              onClick={() => navigate('/admin/settings')}
              className="w-full mt-8 py-4 bg-white/5 hover:bg-indigo-600 hover:text-white rounded-xl border border-white/10 text-[9px] font-black uppercase tracking-[0.2em] transition-all"
            >
              Control Settings
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;