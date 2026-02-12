import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts";
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  Calendar,
  Download,
  Filter,
  FileText,
  PieChart as PieIcon,
  Activity
} from "lucide-react";

// Colors for Charts
const COLORS = ["#4F46E5", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

const Reports = () => {
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState([]);
  const [deptStats, setDeptStats] = useState([]);
  const [leaveStats, setLeaveStats] = useState({ typeDistribution: [], statusDistribution: [] });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("month"); // 'week' | 'month'

  useEffect(() => {
    fetchAllReports();
  }, [dateRange]);

  const fetchAllReports = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      // Parallel Fetching
      const [resSummary, resTrends, resDept, resLeave] = await Promise.all([
        axios.get("http://localhost:5000/api/reports/summary", { headers }),
        axios.get(`http://localhost:5000/api/reports/attendance-trend?range=${dateRange}`, { headers }),
        axios.get("http://localhost:5000/api/reports/department-stats", { headers }),
        axios.get("http://localhost:5000/api/reports/leave-summary", { headers })
      ]);

      setSummary(resSummary.data);
      setTrends(resTrends.data);
      setDeptStats(resDept.data);
      setLeaveStats(resLeave.data);
    } catch (error) {
      console.error("Failed to load reports", error);
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    // Mock Download Functionality
    alert("Downloading Excel Report...");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Helper for KPI Cards
  const StatCard = ({ title, value, icon: Icon, color, subtext }) => (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{title}</p>
          <h3 className="text-3xl font-black text-slate-800 mt-2">{value}</h3>
          {subtext && <p className={`text-xs font-bold mt-2 ${color.text}`}>{subtext}</p>}
        </div>
        <div className={`p-3 rounded-xl ${color.bg}`}>
          <Icon className={`w-6 h-6 ${color.icon}`} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Activity className="w-6 h-6 text-indigo-600" /> Analytics & Reports
          </h1>
          <p className="text-slate-500 font-medium">Real-time insights on attendance, leaves, and employee performance.</p>
        </div>

        <div className="flex items-center gap-3">
          <select
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
          >
            <option value="week">Past Week</option>
            <option value="month">This Month</option>
          </select>

          <button
            onClick={downloadReport}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all"
          >
            <Download className="w-4 h-4" /> Export Report
          </button>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Employees"
          value={summary?.totalEmployees || 0}
          icon={Users}
          color={{ bg: "bg-indigo-50", icon: "text-indigo-600", text: "text-indigo-600" }}
          subtext="Active Workforce"
        />
        <StatCard
          title="Present Today"
          value={summary?.presentToday || 0}
          icon={UserCheck}
          color={{ bg: "bg-emerald-50", icon: "text-emerald-600", text: "text-emerald-600" }}
          subtext={`${summary?.totalEmployees ? ((summary?.presentToday / summary?.totalEmployees) * 100).toFixed(1) : 0}% Attendance`}
        />
        <StatCard
          title="On Leave"
          value={summary?.onLeaveToday || 0}
          icon={Calendar}
          color={{ bg: "bg-amber-50", icon: "text-amber-600", text: "text-amber-600" }}
          subtext="Approved Leaves"
        />
        <StatCard
          title="Late Arrivals"
          value={summary?.lateArrivals || 0}
          icon={Clock}
          color={{ bg: "bg-rose-50", icon: "text-rose-600", text: "text-rose-600" }}
          subtext="Needs Attention"
        />
      </div>

      {/* Charts Row 1: Attendance Trends & Pie Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Line Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-500" /> Attendance Trends
          </h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="_id" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Line type="monotone" dataKey="present" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} name="Present" />
                <Line type="monotone" dataKey="late" stroke="#e11d48" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} name="Late" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart: Leave Distribution */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <PieIcon className="w-5 h-5 text-amber-500" /> Leave Types
          </h3>
          <div className="h-64 w-full flex justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={leaveStats.typeDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="_id"
                >
                  {leaveStats.typeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-3">
            {leaveStats.typeDistribution.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                  <span className="text-slate-600 font-medium">{item._id}</span>
                </div>
                <span className="font-bold text-slate-800">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Dept Statistics Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-500" /> Department Performance
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4">Total Staff</th>
                <th className="px-6 py-4">Present Today</th>
                <th className="px-6 py-4">Attendance Rate</th>
                <th className="px-6 py-4">Late Arrivals</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
              {deptStats.map((dept, index) => (
                <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-900">{dept.department}</td>
                  <td className="px-6 py-4">{dept.totalEmployees}</td>
                  <td className="px-6 py-4">{dept.presentCount}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${dept.presentPct >= 80 ? 'bg-emerald-500' : dept.presentPct >= 50 ? 'bg-amber-400' : 'bg-rose-500'}`} style={{ width: `${dept.presentPct}%` }}></div>
                      </div>
                      <span>{dept.presentPct}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-rose-600">{dept.lateCount}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${dept.presentPct >= 80 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                      {dept.presentPct >= 80 ? 'Excellent' : 'Average'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default Reports;