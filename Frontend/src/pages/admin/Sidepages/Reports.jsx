import React, { useEffect, useState, useMemo } from "react";
import axios from "../../../api/axios";
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
  Cell,
  AreaChart,
  Area
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
  Activity,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  RefreshCw,
  MoreVertical
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { showError } from "../../../utils/toast";

// Colors for Charts
const COLORS = ["#4F46E5", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

/* ========================================================================
   REUSABLE SUB-COMPONENTS
   ======================================================================== */

// 1. Skeleton Loader
const Skeleton = ({ className }) => (
  <div className={`animate-pulse bg-slate-200 rounded-lg ${className}`} />
);

const ReportsSkeleton = () => (
  <div className="space-y-8 p-6 md:p-8">
    <div className="flex justify-between items-center">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="flex gap-4">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32 w-full" />)}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <Skeleton className="lg:col-span-2 h-96 w-full" />
      <Skeleton className="h-96 w-full" />
    </div>
    <Skeleton className="h-[400px] w-full" />
  </div>
);

// 2. StatCard Component
const StatCard = ({ title, value, icon: Icon, color, trend, subtext, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    whileHover={{ y: -5, transition: { duration: 0.2 } }}
    className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-100 transition-all flex flex-col justify-between"
  >
    <div className="flex items-start justify-between mb-4">
      <div className={`p-3 rounded-xl ${color.bg} ${color.icon}`}>
        <Icon className="w-5 h-5 font-bold" />
      </div>
      {trend && (
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${trend.isUp ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
          {trend.isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {trend.value}%
        </div>
      )}
    </div>
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] mb-1">{title}</p>
      <h3 className="text-3xl font-black text-slate-900 tracking-tight">{value}</h3>
      <p className="text-xs text-slate-500 font-medium mt-2 flex items-center gap-1.5">
        <span className={`w-1.5 h-1.5 rounded-full ${color.dot || 'bg-slate-300'}`} />
        {subtext}
      </p>
    </div>
  </motion.div>
);

// 3. ChartCard Component
const ChartCard = ({ title, icon: Icon, children, className = "" }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.98 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5 }}
    className={`bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm ${className}`}
  >
    <div className="flex items-center justify-between mb-6">
      <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2.5">
        <div className="p-2 bg-slate-50 rounded-lg">
          <Icon className="w-4 h-4 text-indigo-600" />
        </div>
        {title}
      </h3>
      <button className="p-2 hover:bg-slate-50 rounded-lg transition-colors text-slate-400">
        <MoreVertical className="w-4 h-4" />
      </button>
    </div>
    {children}
  </motion.div>
);

/* ========================================================================
   MAIN COMPONENT
   ======================================================================== */

const Reports = () => {
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState([]);
  const [deptStats, setDeptStats] = useState([]);
  const [leaveStats, setLeaveStats] = useState({ typeDistribution: [], statusDistribution: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState("month");
  
  // Table States
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: 'presentPct', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(5);
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    fetchAllReports();
  }, [dateRange]);

  const fetchAllReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const [resSummary, resTrends, resDept, resLeave] = await Promise.all([
        axios.get("/reports/summary", { headers }),
        axios.get(`/reports/attendance-trend?range=${dateRange}`, { headers }),
        axios.get("/reports/department-stats", { headers }),
        axios.get("/reports/leave-summary", { headers })
      ]);

      setSummary(resSummary.data);
      setTrends(resTrends.data);
      setDeptStats(resDept.data);
      setLeaveStats(resLeave.data);
    } catch (err) {
      console.error("Failed to load reports", err);
      setError("Unable to sync analytics data. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  // CSV Export Logic
  const handleExportCSV = () => {
    setExportLoading(true);
    setTimeout(() => {
      try {
        const headers = ["Department", "Total Staff", "Present Today", "Attendance Rate", "Late Arrivals"];
        const rows = deptStats.map(d => [
          d.department,
          d.totalEmployees,
          d.presentCount,
          `${d.presentPct}%`,
          d.lateCount
        ]);

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Analytics_Report_${new Date().toLocaleDateString()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (e) {
        showError("Export failed. Please try again.");
      } finally {
        setExportLoading(false);
      }
    }, 800);
  };

  // Table Logic: Search, Filter, Sort, Pagination
  const filteredAndSortedData = useMemo(() => {
    let data = [...deptStats];

    // Search
    if (searchTerm) {
      data = data.filter(d => 
        d.department.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort
    if (sortConfig.key) {
      data.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return data;
  }, [deptStats, searchTerm, sortConfig]);

  const totalPages = Math.ceil(filteredAndSortedData.length / rowsPerPage);
  const currentTableData = filteredAndSortedData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const requestSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  if (loading) return <ReportsSkeleton />;

  if (error) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 text-center space-y-6">
        <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 animate-bounce">
          <AlertCircle className="w-10 h-10" />
        </div>
        <div className="max-w-md">
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Analytics Sync Failed</h2>
          <p className="text-slate-500 font-medium mt-2">{error}</p>
        </div>
        <button 
          onClick={fetchAllReports}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
        >
          <RefreshCw className="w-4 h-4" /> Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 lg:p-10 max-w-[1600px] mx-auto space-y-10">

      {/* ─── Header Section ─── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Business Intelligence</h1>
            <div className="px-2.5 py-1 bg-indigo-100 text-indigo-700 text-[10px] font-black rounded-lg uppercase tracking-wider">v2.0 Beta</div>
          </div>
          <p className="text-slate-500 font-medium text-sm flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-500" /> 
            Live workforce analytics active for <span className="text-slate-900 underline decoration-indigo-200 decoration-2 underline-offset-4 font-bold">{dateRange === 'week' ? 'Past 7 Days' : 'Current Month'}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex bg-slate-100 p-1.5 rounded-2xl">
            {['week', 'month'].map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  dateRange === range ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportCSV}
            disabled={exportLoading}
            className={`flex items-center gap-2.5 px-6 py-3.5 bg-slate-900 text-white text-sm font-black rounded-2xl shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all ${exportLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {exportLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {exportLoading ? 'Processing...' : 'Export Intelligence'}
          </button>
        </div>
      </div>

      {/* ─── Stats Grid ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Workforce"
          value={summary?.totalEmployees || 0}
          icon={Users}
          color={{ bg: "bg-indigo-50", icon: "text-indigo-600", dot: "bg-indigo-400" }}
          trend={{ value: 4.2, isUp: true }}
          subtext="Active Registered Staff"
          delay={0.1}
        />
        <StatCard
          title="Operational Now"
          value={summary?.presentToday || 0}
          icon={UserCheck}
          color={{ bg: "bg-emerald-50", icon: "text-emerald-600", dot: "bg-emerald-400" }}
          trend={{ value: 2.1, isUp: true }}
          subtext={`${summary?.totalEmployees ? ((summary?.presentToday / summary?.totalEmployees) * 100).toFixed(1) : 0}% Present Rate`}
          delay={0.2}
        />
        <StatCard
          title="Off-Duty Cycle"
          value={summary?.onLeaveToday || 0}
          icon={Calendar}
          color={{ bg: "bg-amber-50", icon: "text-amber-600", dot: "bg-amber-400" }}
          trend={{ value: 1.5, isUp: false }}
          subtext="Approved Absences"
          delay={0.3}
        />
        <StatCard
          title="Compliance Alert"
          value={summary?.lateArrivals || 0}
          icon={Clock}
          color={{ bg: "bg-rose-50", icon: "text-rose-600", dot: "bg-rose-400" }}
          trend={{ value: 5.8, isUp: true }}
          subtext="Unresolved Late Entries"
          delay={0.4}
        />
      </div>

      {/* ─── Analysis Section ─── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

        {/* Attendance Activity Chart */}
        <ChartCard title="Workforce Trend Timeline" icon={Activity} className="xl:col-span-2">
          <div className="h-[380px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends}>
                <defs>
                  <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorLate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis 
                  dataKey="_id" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }} 
                  dy={15}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }} 
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '20px', 
                    border: 'none', 
                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                    padding: '12px 18px'
                  }} 
                  itemStyle={{ fontWeight: 800, fontSize: '12px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '30px' }} />
                <Area 
                  type="monotone" 
                  dataKey="present" 
                  stroke="#4f46e5" 
                  strokeWidth={4} 
                  fillOpacity={1} 
                  fill="url(#colorPresent)" 
                  name="Present Units"
                  animationDuration={1500}
                />
                <Area 
                  type="monotone" 
                  dataKey="late" 
                  stroke="#f43f5e" 
                  strokeWidth={4} 
                  fillOpacity={1} 
                  fill="url(#colorLate)" 
                  name="Alerts (Late)"
                  animationDuration={1500}
                  animationDelay={300}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Absence Allocation Chart */}
        <ChartCard title="Leave Allocation Breakdown" icon={PieIcon}>
          <div className="h-64 mt-4 w-full flex justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={leaveStats.typeDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={75}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="count"
                  nameKey="_id"
                  stroke="none"
                  animationBegin={200}
                  animationDuration={1200}
                >
                  {leaveStats.typeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} cornerRadius={10} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-3">
            {leaveStats.typeDistribution.length > 0 ? (
              leaveStats.typeDistribution.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-2xl group hover:bg-white hover:shadow-lg hover:shadow-slate-100 transition-all cursor-default border border-transparent hover:border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{item._id}</span>
                  </div>
                  <span className="font-black text-slate-900">{item.count}</span>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-slate-400 text-xs font-bold uppercase tracking-widest">No Leave Data Tracked</div>
            )}
          </div>
        </ChartCard>

      </div>

      {/* ─── Intelligence Table ─── */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden overflow-x-auto">
        <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <div className="p-2 bg-emerald-50 rounded-xl">
                <FileText className="w-5 h-5 text-emerald-600" />
              </div>
              Division Performance Benchmarks
            </h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Real-time departmental metrics and ROI indicators</p>
          </div>

          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input 
              type="text"
              placeholder="Query division..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="pl-11 pr-6 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold w-full md:w-80 focus:ring-4 focus:ring-indigo-100 transition-all outline-none"
            />
          </div>
        </div>

        <div className="min-w-[900px]">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-50">
                {[
                  { label: "Organization Division", key: "department" },
                  { label: "Human Capacity", key: "totalEmployees" },
                  { label: "Operational (Today)", key: "presentCount" },
                  { label: "Efficiency Score", key: "presentPct" },
                  { label: "Compliance Alerts", key: "lateCount" },
                  { label: "Status Tier", key: null }
                ].map((th, i) => (
                  <th 
                    key={i} 
                    onClick={() => th.key && requestSort(th.key)}
                    className={`px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 ${th.key ? 'cursor-pointer hover:text-indigo-600 transition-colors' : ''}`}
                  >
                    <div className="flex items-center gap-2">
                       {th.label}
                       {sortConfig.key === th.key && (
                         sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                       )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 font-medium text-slate-700">
              <AnimatePresence mode="popLayout">
                {currentTableData.length > 0 ? (
                  currentTableData.map((dept, index) => (
                    <motion.tr 
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      key={dept.department} 
                      className="group hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-8 py-6 font-black text-slate-900 text-sm tracking-tight">{dept.department}</td>
                      <td className="px-8 py-6 text-sm">{dept.totalEmployees} <span className="text-[10px] text-slate-400 ml-1 italic font-bold">Units</span></td>
                      <td className="px-8 py-6 text-sm font-bold text-slate-600">{dept.presentCount}</td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${dept.presentPct}%` }}
                              transition={{ duration: 1, delay: index * 0.1 }}
                              className={`h-full rounded-full ${dept.presentPct >= 80 ? 'bg-emerald-500' : dept.presentPct >= 50 ? 'bg-amber-400' : 'bg-rose-500'}`}
                            ></motion.div>
                          </div>
                          <span className={`text-[10px] font-black ${dept.presentPct >= 80 ? 'text-emerald-600' : 'text-amber-600'}`}>{dept.presentPct}%</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className={`inline-flex items-center px-2 py-1 rounded-lg text-[10px] font-black ${dept.lateCount > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-400'}`}>
                          {dept.lateCount} Alerts
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`inline-flex items-center px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${dept.presentPct >= 80 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'}`}>
                          {dept.presentPct >= 80 ? 'Elite' : 'Stable'}
                        </span>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-8 py-20 text-center">
                       <div className="flex flex-col items-center gap-3 opacity-40">
                         <Filter className="w-10 h-10" />
                         <p className="text-sm font-black uppercase tracking-[0.2em]">No departmental matches found</p>
                       </div>
                    </td>
                  </tr>
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Multi-step Pagination */}
        <div className="p-8 border-t border-slate-50 bg-slate-50/30 flex items-center justify-between">
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
            Showing <span className="text-slate-900">{currentTableData.length}</span> of <span className="text-slate-900">{filteredAndSortedData.length}</span> Divisions
          </p>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1 mx-2">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-9 h-9 rounded-xl text-xs font-black transition-all ${currentPage === i + 1 ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'hover:bg-slate-100 text-slate-500'}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button 
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Reports;