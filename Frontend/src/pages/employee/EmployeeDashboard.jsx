import React, { useState, useEffect } from "react";
import axios from "../../api/axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../AuthContext/AuthContext";
import {
  Clock,
  Calendar,
  Wallet,
  User as UserIcon,
  Users,
  FileText,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Bell,
  ArrowUpRight,
  Zap,
  Briefcase,
  MapPin,
  TrendingUp,
  Loader2,
  Hand,
  Activity
} from "lucide-react";

/**
 * EmployeeDashboard Component
 * Real-world production-level UI for professional office environments.
 * DATA INTEGRATION: Fetches actual employee attendance and leave metrics.
 */
const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const { admin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    attendance: [],
    leaveBalance: { remainingLeaves: 0, usedLeaves: 0 },
    pendingRequests: [],
    todayStatus: { status: "Not Checked In", time: "--:--" }
  });

  const fetchEmployeeData = async () => {
    if (!admin?._id) return;
    try {
      setLoading(true);
      const todayDate = new Date().toISOString().split("T")[0];

      const [attRes, leaveRes, balanceRes] = await Promise.all([
        axios.get("/attendance/my-attendance"),
        axios.get("/leaveapplication/my"),
        axios.get("/leavebalance/my")
      ]);

      // Determine today's check-in status
      const todayRecord = attRes.data.find(r => r.date.startsWith(todayDate));
      const todayStatus = todayRecord
        ? { status: todayRecord.status === 'PRESENT' ? 'Present' : todayRecord.status, time: todayRecord.inTime }
        : { status: "Not Checked In", time: "--:--" };

      // Process leave balance (find total remains across all types or just the first one)
      const balances = balanceRes.data || [];
      const totalBalance = balances.reduce((acc, b) => acc + b.remainingLeaves, 0);
      const totalUsed = balances.reduce((acc, b) => acc + b.usedLeaves, 0);

      setData({
        attendance: attRes.data.slice(0, 5), // Last 5 logs
        leaveBalance: { remainingLeaves: totalBalance, usedLeaves: totalUsed },
        pendingRequests: leaveRes.data.data?.filter(l => l.status === 'Pending') || [],
        todayStatus
      });
    } catch (error) {
      console.error("Error fetching employee dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployeeData();
  }, [admin?._id]);

  const stats = [
    {
      label: "Attendance Status",
      value: data.todayStatus.status,
      sub: data.todayStatus.time !== "--:--" ? `In at ${data.todayStatus.time}` : "Action required",
      icon: CheckCircle2,
      color: data.todayStatus.status === 'Present' ? "text-emerald-600" : "text-slate-400",
      bg: "bg-emerald-50",
      border: "border-emerald-100"
    },
    {
      label: "Leave Balance",
      value: `${data.leaveBalance.remainingLeaves} Days`,
      sub: `${data.leaveBalance.usedLeaves} leaves used this year`,
      icon: Calendar,
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-100"
    },
    {
      label: "Profile Access",
      value: "View ID",
      sub: "Manage your professional info",
      icon: UserIcon,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      border: "border-indigo-100"
    },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-slate-400 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
        <p className="font-bold text-slate-600 uppercase tracking-widest text-[10px]">Initializing Workforce Portal...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-700 font-sans">

      {/* 1. HEADER & GREETING */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-indigo-600 font-bold tracking-wider uppercase text-[10px]">
            <Zap className="w-3 h-3 fill-current" /> Workforce Portal
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Morning, {admin?.firstName || 'Employee'}! </h1>
          <p className="text-sm text-slate-500 font-medium italic">Empowering your professional journey with precision logs.</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-bold text-slate-900">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">{new Date().toLocaleDateString('en-US', { weekday: 'long' })}</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 relative cursor-pointer hover:bg-slate-50 transition-all shadow-sm">
            <Bell className="w-5 h-5" />
            <span className="absolute top-3 right-3 w-2 h-2 bg-indigo-600 rounded-full border-2 border-white ring-2 ring-indigo-50"></span>
          </div>
          <div className="h-10 w-[1px] bg-slate-200 mx-1 hidden md:block"></div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-lg shadow-indigo-100 text-sm">
              {admin?.firstName?.charAt(0)}{admin?.lastName?.charAt(0)}
            </div>
          </div>
        </div>
      </div>

      {/* 2. SUMMARY CARDS - Production Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all duration-500 relative group overflow-hidden cursor-default">
            <div className={`absolute -right-6 -bottom-6 opacity-5 group-hover:scale-110 group-hover:opacity-10 transition-all duration-700`}>
              <stat.icon className={`w-36 h-36 ${stat.color}`} />
            </div>
            <div className="flex items-start justify-between mb-5 relative z-10">
              <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color} border ${stat.border} transition-transform group-hover:-rotate-6`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{stat.label}</span>
                <span className={`text-[10px] font-black ${stat.color} flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-full`}>
                  SYNCED
                </span>
              </div>
            </div>
            <div className="space-y-1 relative z-10">
              <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{stat.value}</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed">{stat.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* LEFT COLUMN: 8 Units */}
        <div className="lg:col-span-8 space-y-8">

          {/* RECENT ATTENDANCE - Visually aligned with Employees.jsx Table */}
          <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/20">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-slate-900 text-white rounded-xl shadow-lg shadow-slate-200">
                  <Clock className="w-4 h-4" />
                </div>
                <h2 className="font-black text-slate-900 uppercase tracking-tight text-sm">Personal Activity Log</h2>
              </div>
              <button
                onClick={() => navigate('/employee/attendance')}
                className="text-xs font-black text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-xl transition-all flex items-center gap-2 uppercase tracking-[0.15em] border border-transparent hover:border-indigo-100"
              >
                Full Access <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-separate border-spacing-0">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-8 py-5 font-black text-slate-400 border-b border-slate-100 uppercase text-[9px] tracking-[0.2em]">Timestamp</th>
                    <th className="px-8 py-5 font-black text-slate-400 border-b border-slate-100 uppercase text-[9px] tracking-[0.2em]">Punch In/Out</th>
                    <th className="px-8 py-5 font-black text-slate-400 border-b border-slate-100 uppercase text-[9px] tracking-[0.2em]">Duration</th>
                    <th className="px-8 py-5 font-black text-slate-400 border-b border-slate-100 uppercase text-[9px] tracking-[0.2em] text-center">Outcome</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {data.attendance.length > 0 ? (
                    data.attendance.map((log, idx) => (
                      <tr key={idx} className="group hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-5 font-black text-slate-700">{new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3 text-slate-500 font-bold">
                            <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100/50">{log.inTime}</span>
                            <span className="text-slate-200">→</span>
                            <span className={!log.outTime ? 'text-slate-300 italic font-medium' : 'text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-100/50'}>
                              {log.outTime || 'On Duty'}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-slate-800 font-black tracking-tight">{log.totalWorkingMinutes ? `${Math.floor(log.totalWorkingMinutes / 60)}h ${log.totalWorkingMinutes % 60}m` : '--:--'}</td>
                        <td className="px-8 py-5 text-center">
                          <span className={`inline-flex px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest border-2 ${log.status === 'PRESENT' ? 'bg-emerald-50 text-emerald-700 border-emerald-100/50' :
                              log.status === 'ABSENT' ? 'bg-rose-50 text-rose-700 border-rose-100/50' :
                                'bg-amber-50 text-amber-700 border-amber-100/50'
                            }`}>
                            {log.status === 'PRESENT' && log.lateByMinutes > 0 ? 'Late' : log.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-8 py-16 text-center">
                        <Activity className="w-12 h-12 mx-auto mb-4 text-slate-200" />
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No activity data synchronized yet.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* LEAVE & DOCUMENTS SECTION */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-7 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
              <h3 className="font-black text-slate-900 flex items-center gap-3 uppercase tracking-tight text-xs">
                <AlertCircle className="w-4 h-4 text-amber-500" /> Management Inbox
              </h3>
              <div className="space-y-4">
                {data.pendingRequests.length > 0 ? (
                  data.pendingRequests.map((req, i) => (
                    <div key={i} className="p-5 bg-slate-50/50 border border-slate-100 rounded-2xl relative group hover:border-indigo-200 transition-all hover:bg-white hover:shadow-lg">
                      <div className="absolute top-5 right-5">
                        <span className="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-lg text-[8px] font-black uppercase tracking-[0.2em] border border-amber-200/50 shadow-sm">Reviewing</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-amber-500 shadow-sm group-hover:scale-110 transition-transform">
                          <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-slate-800 tracking-tight">{req.leaveType} Leave</h4>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 italic">Requested {req.totalDays} Days</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-10 text-center border-2 border-dashed border-slate-100 rounded-[2rem] group hover:border-indigo-100 transition-colors">
                    <FileText className="w-8 h-8 mx-auto mb-3 text-slate-100 group-hover:text-indigo-200 transition-colors" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No pending applications</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white p-7 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
              <h3 className="font-black text-slate-900 flex items-center gap-3 uppercase tracking-tight text-xs">
                <Briefcase className="w-4 h-4 text-indigo-500" /> Professional Vault
              </h3>
              <div className="space-y-4 text-center py-10 border-2 border-dashed border-slate-100 rounded-[2rem] hover:bg-slate-50 transition-colors group cursor-pointer">
                <MapPin className="w-8 h-8 mx-auto mb-4 text-slate-100 group-hover:text-rose-400 transition-all rotate-12" />
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest px-8 leading-loose tracking-[0.2em]">Digital assets & corporate credentials locked.</p>
                <button
                  onClick={() => navigate('/employee/profile')}
                  className="mt-4 text-[9px] font-black text-indigo-600 uppercase tracking-widest hover:bg-indigo-600 hover:text-white px-4 py-2 rounded-lg border border-indigo-100 transition-all"
                >
                  Authorized Entry
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: 4 Units */}
        <div className="lg:col-span-4 space-y-8">

          {/* QUICK ACTIONS - Production UI */}
          <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
            <h2 className="font-black text-slate-900 uppercase tracking-tight text-sm mb-8">Navigation Hub</h2>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => navigate('/employee/attendance')}
                className="flex flex-col items-center justify-center p-6 bg-slate-50 hover:bg-white border border-transparent hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-50 rounded-[2rem] transition-all duration-300 group"
              >
                <div className="p-3 bg-white rounded-xl shadow-sm mb-3 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  <Hand className="w-5 h-5 text-indigo-600 group-hover:text-white" />
                </div>
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 group-hover:text-indigo-600">Attendance</span>
              </button>
              <button
                onClick={() => navigate('/employee/leaves')}
                className="flex flex-col items-center justify-center p-6 bg-slate-50 hover:bg-white border border-transparent hover:border-emerald-100 hover:shadow-xl hover:shadow-emerald-50 rounded-[2rem] transition-all duration-300 group"
              >
                <div className="p-3 bg-white rounded-xl shadow-sm mb-3 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                  <FileText className="w-5 h-5 text-emerald-600 group-hover:text-white" />
                </div>
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 group-hover:text-emerald-600">Leaves</span>
              </button>
              <button
                onClick={() => navigate('/employee/profile')}
                className="flex flex-col items-center justify-center p-6 bg-slate-50 hover:bg-white border border-transparent hover:border-blue-100 hover:shadow-xl hover:shadow-blue-50 rounded-[2rem] transition-all duration-300 group"
              >
                <div className="p-3 bg-white rounded-xl shadow-sm mb-3 group-hover:bg-blue-600 group-hover:text-white transition-all">
                  <UserIcon className="w-5 h-5 text-blue-600 group-hover:text-white" />
                </div>
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 group-hover:text-blue-600">Identity</span>
              </button>
              <button
                onClick={() => navigate('/employee/salary')}
                className="flex flex-col items-center justify-center p-6 bg-slate-50 hover:bg-white border border-transparent hover:border-amber-100 hover:shadow-xl hover:shadow-amber-50 rounded-[2rem] transition-all duration-300 group"
              >
                <div className="p-3 bg-white rounded-xl shadow-sm mb-3 group-hover:bg-amber-600 group-hover:text-white transition-all">
                  <Wallet className="w-5 h-5 text-amber-600 group-hover:text-white" />
                </div>
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 group-hover:text-amber-600">Payroll</span>
              </button>
            </div>
          </div>

          {/* ANNOUNCEMENTS - Premium Design */}
          <div className="bg-[#0f172a] rounded-[2rem] shadow-2xl overflow-hidden border border-slate-800 relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            <div className="px-8 py-7 border-b border-slate-800/50 flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_10px_rgba(99,102,241,0.8)]"></div>
                <h2 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Notice Board</h2>
              </div>
              <Bell className="w-5 h-5 text-slate-600" />
            </div>

            <div className="p-2 space-y-1 relative z-10">
              {[
                { title: "Quarterly Performance Review", date: "Feb 15", type: "Official", priority: "High" },
                { title: "New Health Insurance Policy Update", date: "Feb 12", type: "HR", priority: "Medium" }
              ].map((item, idx) => (
                <div key={idx} className="p-6 hover:bg-slate-800/50 transition-all cursor-pointer group rounded-[1.5rem] m-1">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-2.5 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border border-white/10 ${item.priority === 'High' ? 'bg-rose-500/10 text-rose-400' :
                        item.priority === 'Medium' ? 'bg-indigo-500/10 text-indigo-400' :
                          'bg-slate-500/10 text-slate-400'
                      }`}>
                      {item.type}
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">{item.date}</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-100 group-hover:text-white leading-snug tracking-tight">
                    {item.title}
                  </h4>
                  <div className="mt-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all translate-y-1 group-hover:translate-y-0 text-indigo-400 text-[10px] font-black uppercase tracking-widest">
                    Authorized Access Required <ArrowUpRight className="w-3 h-3" />
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => navigate('/employee/notifications')}
              className="w-full py-5 bg-slate-800/30 text-slate-500 hover:text-indigo-400 text-[9px] font-black uppercase tracking-[0.3em] transition-all border-t border-slate-800/50 uppercase"
            >
              Archived Communications
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};

export default EmployeeDashboard;