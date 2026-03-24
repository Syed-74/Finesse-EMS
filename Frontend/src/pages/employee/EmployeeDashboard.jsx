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
 */
const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const { admin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    attendance: [],
    leaveBalance: { remainingLeaves: 0, usedLeaves: 0 },
    pendingRequests: [],
    todayStatus: { status: "Not Checked In", time: "--:--" },
    shift: null
  });

  const fetchEmployeeData = async () => {
    if (!admin?._id) return;
    try {
      setLoading(true);
      const todayDate = new Date().toISOString().split("T")[0];

      const [attRes, leaveRes, balanceRes, shiftRes] = await Promise.all([
        axios.get("/attendance/my-attendance"),
        axios.get("/leaveapplication/my"),
        axios.get("/leavebalance/my"),
        axios.get("/shifts/my-shift")
      ]);

      // Determine today's check-in status
      const todayRecord = attRes.data.find(r => r.date.startsWith(todayDate));
      const todayStatus = todayRecord
        ? { status: todayRecord.status === 'PRESENT' ? 'Present' : todayRecord.status, time: todayRecord.inTime }
        : { status: "Not Checked In", time: "--:--" };

      // Process leave balance
      const balances = balanceRes.data || [];
      const totalBalance = balances.reduce((acc, b) => acc + b.remainingLeaves, 0);
      const totalUsed = balances.reduce((acc, b) => acc + b.usedLeaves, 0);

      setData({
        attendance: Array.isArray(attRes.data) ? attRes.data.slice(0, 5) : [],
        leaveBalance: { remainingLeaves: totalBalance, usedLeaves: totalUsed },
        pendingRequests: Array.isArray(leaveRes.data?.data) ? leaveRes.data.data.filter(l => l.status === 'Pending') : [],
        todayStatus,
        shift: shiftRes.data
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
            <p className="text-sm font-bold text-slate-900 font-sans">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">{new Date().toLocaleDateString('en-US', { weekday: 'long' })}</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 relative cursor-pointer hover:bg-slate-50 transition-all shadow-sm">
            <Bell className="w-5 h-5" />
            <span className="absolute top-3 right-3 w-2 h-2 bg-indigo-600 rounded-full border-2 border-white ring-2 ring-indigo-50"></span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-lg shadow-indigo-100 text-sm">
              {admin?.firstName?.charAt(0)}{admin?.lastName?.charAt(0)}
            </div>
          </div>
        </div>
      </div>

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

      {data.shift && (
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-900 p-8 rounded-[2.5rem] shadow-2xl shadow-indigo-200 text-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:scale-125 transition-transform duration-1000"></div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                  <Clock className="w-5 h-5 text-indigo-100" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-200">Current Assigned Roster</span>
              </div>
              <div>
                <h2 className="text-4xl font-black tracking-tight">{data.shift.shiftType} Shift</h2>
                <p className="text-indigo-200 font-medium mt-1">Your production hours are synchronized with this schedule.</p>
              </div>
            </div>
            <div className="flex items-center gap-6 bg-white/10 p-6 rounded-[2rem] backdrop-blur-md border border-white/10 mr-4">
              <div className="text-center w-24">
                <span className="block text-[8px] font-black text-indigo-300 uppercase tracking-widest mb-1.5">Punch In By</span>
                <span className="text-2xl font-black font-mono tracking-tighter">{data.shift.startTime}</span>
              </div>
              <div className="w-[1px] h-10 bg-white/20"></div>
              <div className="text-center w-24">
                <span className="block text-[8px] font-black text-indigo-300 uppercase tracking-widest mb-1.5">Punch Out At</span>
                <span className="text-2xl font-black font-mono tracking-tighter">{data.shift.endTime}</span>
              </div>
               <div className="w-[1px] h-10 bg-white/20"></div>
               <div className="text-center w-24 px-2">
                <span className="block text-[8px] font-black text-indigo-300 uppercase tracking-widest mb-1.5">Duration</span>
                <span className="text-2xl font-black tracking-tighter">{data.shift.duration}h</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-8">
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
        </div>

        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
            <h2 className="font-black text-slate-900 uppercase tracking-tight text-sm mb-8">Navigation Hub</h2>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => navigate('/employee/attendance')} className="flex flex-col items-center justify-center p-6 bg-slate-50 hover:bg-white border border-transparent hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-50 rounded-[2rem] transition-all duration-300 group">
                <div className="p-3 bg-white rounded-xl shadow-sm mb-3 group-hover:bg-indigo-600 group-hover:text-white transition-all"><Hand className="w-5 h-5 text-indigo-600 group-hover:text-white" /></div>
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 group-hover:text-indigo-600">Attendance</span>
              </button>
              <button onClick={() => navigate('/employee/leaves')} className="flex flex-col items-center justify-center p-6 bg-slate-50 hover:bg-white border border-transparent hover:border-emerald-100 hover:shadow-xl hover:shadow-emerald-50 rounded-[2rem] transition-all duration-300 group">
                <div className="p-3 bg-white rounded-xl shadow-sm mb-3 group-hover:bg-emerald-600 group-hover:text-white transition-all"><FileText className="w-5 h-5 text-emerald-600 group-hover:text-white" /></div>
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 group-hover:text-emerald-600">Leaves</span>
              </button>
              <button onClick={() => navigate('/employee/profile')} className="flex flex-col items-center justify-center p-6 bg-slate-50 hover:bg-white border border-transparent hover:border-blue-100 hover:shadow-xl hover:shadow-blue-50 rounded-[2rem] transition-all duration-300 group">
                <div className="p-3 bg-white rounded-xl shadow-sm mb-3 group-hover:bg-blue-600 group-hover:text-white transition-all"><UserIcon className="w-5 h-5 text-blue-600 group-hover:text-white" /></div>
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 group-hover:text-blue-600">Identity</span>
              </button>
              <button onClick={() => navigate('/employee/salary')} className="flex flex-col items-center justify-center p-6 bg-slate-50 hover:bg-white border border-transparent hover:border-amber-100 hover:shadow-xl hover:shadow-amber-50 rounded-[2rem] transition-all duration-300 group">
                <div className="p-3 bg-white rounded-xl shadow-sm mb-3 group-hover:bg-amber-600 group-hover:text-white transition-all"><Wallet className="w-5 h-5 text-amber-600 group-hover:text-white" /></div>
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 group-hover:text-amber-600">Payroll</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;