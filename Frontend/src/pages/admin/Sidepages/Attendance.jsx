import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import axios from "../../../api/axios";
import {
  Calendar,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter,
  Download,
  Edit3,
  Search,
  Camera,
  Shield,
  Wifi,
  WifiOff,
  Building2,
  Globe,
  Activity,
  ChevronDown,
  X,
  Loader2,
  AlertTriangle,
  History,
  Users,
  UserCheck,
  Target,
  Coffee
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { showSuccess, showError, showWarning } from "../../../utils/toast";
import { useConfirm } from "../../../context/ConfirmContext";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://finesse-ems.onrender.com/api';
const IMAGE_BASE_URL = API_BASE_URL.replace('/api', '');

const Attendance = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("attendance"); // attendance | regularization | audit
  const [regularizationRequests, setRegularizationRequests] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const checkMobile = () => {
      if (window.innerWidth <= 768) {
        navigate("/admin");
      }
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [navigate]);

  // Modals
  const [editingRecord, setEditingRecord] = useState(null);
  const [viewingProof, setViewingProof] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const { confirmAction } = useConfirm();
  const token = localStorage.getItem("token");

  // Stats
  const [stats, setStats] = useState({ present: 0, absent: 0, late: 0, leave: 0 });

  useEffect(() => {
    if (activeTab === "attendance") {
      fetchAttendance();
    } else if (activeTab === "regularization") {
      fetchRegularizationRequests();
    } else {
      fetchAuditLogs();
    }
  }, [selectedDate, statusFilter, activeTab]);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/attendance/audit-logs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAuditLogs(res.data);
    } catch (err) {
      console.error("Failed to fetch audit logs", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRegularizationRequests = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/attendance/regularization-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRegularizationRequests(res.data);
    } catch (err) {
      console.error("Failed to fetch regularization requests", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/attendance/all`, {
        params: { date: selectedDate, status: statusFilter },
        withCredentials: true,
        headers: { Authorization: `Bearer ${token}` },
      });
      setRecords(res.data);
      calculateStats(res.data);
    } catch (err) {
      console.error("Failed to fetch attendance", err);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    const s = { present: 0, absent: 0, late: 0, leave: 0, total: data.length };
    data.forEach((r) => {
      const status = r.status?.toUpperCase();
      if ((status === "PRESENT" || status === "LATE") && r.lateByMinutes > 0) s.late++;
      else if (status === "PRESENT") s.present++;
      else if (status === "ABSENT") s.absent++;
      else if (status === "LEAVE") s.leave++;
    });
    setStats(s);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put(
        `/attendance/${editingRecord._id}`,
        editingRecord,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEditingRecord(null);
      fetchAttendance();
      showSuccess("Attendance record sync completed.");
    } catch (err) {
      showError("Synchronization failed. Check connectivity.");
    }
  };

  const handleApproveRegularization = async (requestId) => {
    confirmAction({
      title: "Confirm Approval",
      message: "Are you sure you want to approve this regularization request? The attendance record will be updated immediately.",
      onConfirm: async () => {
        try {
          await axios.post(
            `/attendance/approve-regularize`,
            { requestId },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          showSuccess("Request verified and approved.");
          fetchRegularizationRequests();
        } catch (err) {
          showError(err.response?.data?.message || "Internal approval error.");
        }
      }
    });
  };

  const handleRejectRegularization = async (requestId) => {
    confirmAction({
      title: "Deny Correction Request",
      message: "Please provide a specific reason for denying this attendance correction.",
      type: "danger",
      children: (
        <div className="mt-4">
          <textarea 
            className="w-full border border-slate-200 rounded-2xl p-4 text-sm focus:ring-4 focus:ring-rose-100 outline-none resize-none bg-slate-50 transition-all font-medium"
            rows="3"
            placeholder="e.g. Times do not match system logs..."
            onChange={(e) => setRejectionReason(e.target.value)}
          />
        </div>
      ),
      onConfirm: async () => {
        if (!rejectionReason.trim()) {
          showWarning("A reason is mandatory for rejection.");
          return;
        }
        try {
          await axios.post(
            `/attendance/reject-regularize`,
            { requestId, adminRemarks: rejectionReason },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          showSuccess("Correction request denied.");
          setRejectionReason("");
          fetchRegularizationRequests();
        } catch (err) {
          showError(err.response?.data?.message || "Rejection attempt failed.");
        }
      }
    });
  };

  const getStatusBadge = (status, late) => {
    const s = status?.toUpperCase();
    if ((s === "PRESENT" || s === "LATE") && late > 0) return "bg-amber-50 text-amber-700 border-amber-200";
    if (s === "PRESENT") return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (s === "ABSENT") return "bg-red-50 text-red-700 border-red-200";
    if (s === "LEAVE") return "bg-blue-50 text-blue-700 border-blue-200";
    if (s === "HALF DAY") return "bg-indigo-50 text-indigo-700 border-indigo-200";
    return "bg-slate-100 text-slate-600 border-slate-200";
  };

  const formatDuration = (mins) => {
    if (!mins) return "—";
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  // Filtered Display
  const filteredRecords = records.filter((r) => {
    const nameMatch =
      r.employee?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.employee?.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.employee?.email?.toLowerCase().includes(searchQuery.toLowerCase());

    return nameMatch;
  });

  const handleExportCSV = () => {
    if (records.length === 0) return showWarning("No data patterns available for export.");
    const headers = ["Employee ID", "Employee Name", "Date", "In Time", "Out Time", "Work Location", "Status", "Late (min)"];
    const rows = filteredRecords.map(r => [
      r.employee?.employeeId,
      `${r.employee?.firstName} ${r.employee?.lastName}`,
      new Date(r.date).toLocaleDateString(),
      r.inTime || "-",
      r.outTime || "-",
      r.workLocation || "Onsite",
      r.status,
      r.lateByMinutes || 0
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Attendance_${selectedDate}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const chartData = [
    { name: 'Present', value: records.filter(r => r.status?.toUpperCase() === 'PRESENT' || r.status?.toUpperCase() === 'LATE').length, color: '#10b981' },
    { name: 'Late', value: records.filter(r => r.status?.toUpperCase() === 'LATE' || (r.status?.toUpperCase() === 'PRESENT' && r.lateByMinutes > 0)).length, color: '#f59e0b' },
    { name: 'Half Day', value: records.filter(r => r.status?.toUpperCase() === 'HALF DAY').length, color: '#3b82f6' },
    { name: 'Absent', value: records.filter(r => r.status?.toUpperCase() === 'ABSENT').length, color: '#ef4444' },
  ].filter(d => d.value > 0);

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-8 space-y-6">

      {/* ─── Page Title ─── */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Attendance Management</h1>
        <div className="flex items-center gap-6 mt-4 border-b border-slate-200">
          <button
            onClick={() => setActiveTab("attendance")}
            className={`pb-3 text-sm font-black uppercase tracking-widest transition-all px-2 ${activeTab === "attendance" ? "text-indigo-600 border-b-2 border-indigo-600" : "text-slate-400 hover:text-slate-600"}`}
          >
            Daily Attendance
          </button>
          <button
            onClick={() => setActiveTab("regularization")}
            className={`pb-3 text-sm font-black uppercase tracking-widest transition-all px-2 flex items-center gap-2 ${activeTab === "regularization" ? "text-indigo-600 border-b-2 border-indigo-600" : "text-slate-400 hover:text-slate-600"}`}
          >
            Regularization Requests
            {regularizationRequests.filter(r => r.status === "Pending").length > 0 && (
              <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                {regularizationRequests.filter(r => r.status === "Pending").length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("audit")}
            className={`pb-3 text-sm font-black uppercase tracking-widest transition-all px-2 flex items-center gap-2 ${activeTab === "audit" ? "text-indigo-600 border-b-2 border-indigo-600" : "text-slate-400 hover:text-slate-600"}`}
          >
            Audit Logs
          </button>
        </div>
      </div>

      {/* ─── Stats Overview ─── */}
      {activeTab === "attendance" && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Quick Stats Column */}
          <div className="lg:col-span-1 grid grid-cols-1 gap-4">
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Staff</p>
                <h3 className="text-3xl font-black text-slate-900">{stats.total}</h3>
              </div>
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                <Users className="w-6 h-6" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Present Today</p>
                <h3 className="text-3xl font-black text-slate-900">{stats.present}</h3>
              </div>
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                <UserCheck className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Visual Analytics Column */}
          <div className="lg:col-span-3 bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 flex flex-col md:flex-row items-center gap-10">
            <div className="h-44 w-full md:w-44 shrink-0 relative flex items-center justify-center">
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                  <Pie
                    data={chartData}
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }}
                  />
                 </PieChart>
               </ResponsiveContainer>
               <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-black text-slate-900">{records.length}</span>
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Logs</span>
               </div>
            </div>
            
            <div className="flex-1 space-y-6 w-full">
               <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <Target className="w-4 h-4 text-indigo-500" /> Attendance Distribution
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 text-[8px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg uppercase">
                      <Activity className="w-3 h-3" /> Live Analysis
                    </span>
                  </div>
               </div>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {chartData.map((d) => (
                    <div key={d.name} className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{d.name}</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <p className="text-xl font-black text-slate-900">{d.value}</p>
                        <p className="text-[10px] text-slate-400 font-bold">{records.length > 0 ? ((d.value/records.length)*100).toFixed(0) : 0}%</p>
                      </div>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Main Content ─── */}
      {activeTab === "attendance" ? (
        <>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="flex flex-wrap gap-3 items-center">
                <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 text-slate-600">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <input
                    type="date"
                    className="bg-transparent text-sm outline-none font-medium"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search employee..."
                    className="pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-56 font-medium"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-3 items-center">
                <div className="relative">
                  <select
                    className="appearance-none pl-3 pr-8 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium bg-white"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="All">All Status</option>
                    <option value="PRESENT">Present</option>
                    <option value="ABSENT">Absent</option>
                    <option value="LEAVE">Leave</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>

                <button 
                  onClick={handleExportCSV}
                  className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200"
                >
                  <Download className="w-4 h-4" /> Export
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    {["Employee", "In Time", "Out Time", "Duration", "Proof", "Status", "Actions"].map((h) => (
                      <th key={h} className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-16 text-center">
                        <Loader2 className="w-8 h-8 mx-auto text-indigo-400 animate-spin mb-3" />
                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Loading Records...</p>
                      </td>
                    </tr>
                  ) : filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-16 text-center">
                        <Activity className="w-10 h-10 mx-auto text-slate-200 mb-3" />
                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">No records found for this date</p>
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((rec) => {
                      return (
                        <tr key={rec._id} className="hover:bg-slate-50/80 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {rec.employee?.profileImage ? (
                                <img
                                  src={`${IMAGE_BASE_URL}${rec.employee.profileImage}`}
                                  className="w-9 h-9 rounded-xl object-cover border border-slate-100"
                                  alt=""
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-xs">
                                  {rec.employee?.firstName?.[0]}{rec.employee?.lastName?.[0]}
                                </div>
                              )}
                              <div>
                                <div className="font-bold text-slate-900">{rec.employee?.firstName} {rec.employee?.lastName}</div>
                                <div className="text-xs text-slate-400 font-medium">{rec.employee?.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-lg font-mono font-bold text-xs">
                              {rec.inTime || "—"}
                            </span>
                            {rec.lateByMinutes > 0 && (
                              <span className="ml-2 text-[10px] text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded font-bold">
                                +{rec.lateByMinutes}m
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {rec.outTime
                              ? <span className="text-rose-700 bg-rose-50 border border-rose-100 px-2 py-1 rounded-lg font-mono font-bold text-xs">{rec.outTime}</span>
                              : <span className="text-slate-300 font-mono text-xs font-medium italic">On Duty</span>}
                          </td>
                          <td className="px-6 py-4 font-black text-slate-700">
                            {formatDuration(rec.totalWorkingMinutes)}
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {rec.selfieUrl && (
                                <button
                                  onClick={() => setViewingProof(rec)}
                                  className="p-1.5 bg-slate-100 rounded-lg hover:bg-indigo-100 hover:text-indigo-700 text-slate-500 transition-colors"
                                  title="View Selfie & Details"
                                >
                                  <Camera className="w-4 h-4" />
                                </button>
                              )}
                              {rec.location?.isInsideOffice ? (
                                <span title="Inside Geofence" className="text-emerald-600 p-1.5 bg-emerald-50 rounded-lg">
                                  <CheckCircle className="w-4 h-4" />
                                </span>
                              ) : rec.location?.latitude ? (
                                <span title="Outside Geofence" className="text-amber-500 p-1.5 bg-amber-50 rounded-lg">
                                  <AlertCircle className="w-4 h-4" />
                                </span>
                              ) : null}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border-2 ${getStatusBadge(rec.status, rec.lateByMinutes)}`}>
                              {rec.status === "PRESENT" && rec.lateByMinutes > 0 ? "LATE" : rec.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => setEditingRecord(rec)}
                              className="text-indigo-600 hover:text-indigo-800 font-bold text-xs border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {!loading && filteredRecords.length > 0 && (
              <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
                <p className="text-xs font-bold text-slate-400">
                  Showing {filteredRecords.length} of {records.length} records
                </p>
                <div className="flex items-center gap-4 text-xs font-black text-slate-400 uppercase tracking-widest">
                  <span className="flex items-center gap-1.5">Work Mode: Enforced by Policy</span>
                </div>
              </div>
            )}
          </div>
        </>
      ) : activeTab === "regularization" ? (
        /* ─── Regularization Requests Content ─── */
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
             <h2 className="font-black text-slate-900 text-sm uppercase tracking-widest flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-500" /> Pending Corrections
             </h2>
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {regularizationRequests.length} Requests Total
             </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {["Employee", "Date", "Original Times", "Requested Times", "Reason", "Status", "Actions"].map((h) => (
                    <th key={h} className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-16 text-center">
                      <Loader2 className="w-8 h-8 mx-auto text-indigo-400 animate-spin mb-3" />
                      <p className="text-xs font-black uppercase tracking-widest text-slate-400" >Loading Requests...</p>
                    </td>
                  </tr>
                ) : regularizationRequests.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-16 text-center">
                      <Shield className="w-10 h-10 mx-auto text-slate-200 mb-3" />
                      <p className="text-xs font-black uppercase tracking-widest text-slate-400">No requests found</p>
                    </td>
                  </tr>
                ) : (
                  regularizationRequests.map((req) => (
                    <tr key={req._id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{req.employeeId?.firstName} {req.employeeId?.lastName}</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase">{req.employeeId?.employeeId}</div>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-600">
                        {new Date(req.attendanceId?.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-[10px] font-bold text-slate-400 uppercase">IN: <span className="text-slate-600">{req.attendanceId?.inTime || "—"}</span></div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase">OUT: <span className="text-slate-600">{req.attendanceId?.outTime || "—"}</span></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-[10px] font-bold text-indigo-400 uppercase">IN: <span className="text-indigo-700">{req.requestedInTime || "—"}</span></div>
                        <div className="text-[10px] font-bold text-indigo-400 uppercase">OUT: <span className="text-indigo-700">{req.requestedOutTime || "—"}</span></div>
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        <p className="text-xs text-slate-600 font-medium line-clamp-2 italic">"{req.reason}"</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border-2 
                          ${req.status === "Pending" ? "bg-amber-50 text-amber-700 border-amber-200" :
                            req.status === "Approved" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                              "bg-rose-50 text-rose-700 border-rose-200"}`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {req.status === "Pending" ? (
                          <div className="flex gap-2">
                             <button
                               onClick={() => handleApproveRegularization(req._id)}
                               className="p-1.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg hover:bg-emerald-100 transition-colors"
                               title="Approve"
                             >
                               <CheckCircle className="w-4 h-4" />
                             </button>
                             <button
                               onClick={() => handleRejectRegularization(req._id)}
                               className="p-1.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-lg hover:bg-rose-100 transition-colors"
                               title="Reject"
                             >
                               <XCircle className="w-4 h-4" />
                             </button>
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-300 uppercase italic">Processed</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ─── Audit Logs Content ─── */
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
           <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="font-black text-slate-900 text-sm uppercase tracking-widest flex items-center gap-2">
                 <History className="w-4 h-4 text-indigo-500" /> Administrative Audit Trail
              </h2>
           </div>
           <div className="overflow-x-auto">
             <table className="w-full text-sm text-left">
               <thead className="bg-slate-50 border-b border-slate-100">
                 <tr>
                   {["Action", "Performed By", "Target", "Details", "Date"].map((h) => (
                     <th key={h} className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                       {h}
                     </th>
                   ))}
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                 {loading ? (
                   <tr>
                     <td colSpan="5" className="px-6 py-16 text-center">
                       <Loader2 className="w-8 h-8 mx-auto text-indigo-400 animate-spin mb-3" />
                       <p className="text-xs font-black uppercase tracking-widest text-slate-400">Loading Logs...</p>
                     </td>
                   </tr>
                 ) : auditLogs.length === 0 ? (
                   <tr>
                     <td colSpan="5" className="px-6 py-16 text-center">
                       <History className="w-10 h-10 mx-auto text-slate-200 mb-3" />
                       <p className="text-xs font-black uppercase tracking-widest text-slate-400">No logs found</p>
                     </td>
                   </tr>
                 ) : (
                   auditLogs.map((log) => (
                     <tr key={log._id} className="hover:bg-slate-50/80 transition-colors">
                       <td className="px-6 py-4">
                         <span className={`text-[10px] font-black px-2 py-1 rounded-lg border-2 
                           ${log.action.includes("APPROVED") ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                             log.action.includes("REJECTED") ? "bg-rose-50 text-rose-700 border-rose-200" :
                               "bg-slate-50 text-slate-700 border-slate-200"}`}>
                           {log.action}
                         </span>
                       </td>
                       <td className="px-6 py-4">
                         <div className="font-bold text-slate-900">{log.performedBy?.firstName} {log.performedBy?.lastName}</div>
                       </td>
                       <td className="px-6 py-4">
                         <div className="text-xs font-bold text-slate-400 uppercase">{log.targetType}</div>
                         <div className="text-[10px] font-mono font-bold text-slate-500">{log.targetId}</div>
                       </td>
                       <td className="px-6 py-4 max-w-xs">
                          <p className="text-xs text-slate-600 font-medium">{log.remarks || "—"}</p>
                       </td>
                       <td className="px-6 py-4 flex flex-col">
                          <span className="font-bold text-slate-900">{new Date(log.createdAt).toLocaleDateString()}</span>
                          <span className="text-[10px] font-mono text-slate-400">{new Date(log.createdAt).toLocaleTimeString()}</span>
                       </td>
                     </tr>
                   ))
                 )}
               </tbody>
             </table>
           </div>
        </div>
      )}

      {/* ─── Proof Modal ─── */}
      <AnimatePresence>
        {viewingProof && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingProof(null)}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[2rem] shadow-[0_30px_70px_-10px_rgba(0,0,0,0.2)] border border-slate-100 z-50 p-8"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setViewingProof(null)}
                className="p-2 hover:bg-slate-50 text-slate-400 rounded-xl transition-all active:scale-95 absolute top-6 right-6"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Modal Header */}
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100/50">
                  <Camera className="w-6 h-6" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest block mb-1 text-indigo-600">
                    Attendance Verification
                  </span>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none">
                    {viewingProof.employee?.firstName} {viewingProof.employee?.lastName}
                  </h3>
                </div>
              </div>

              <div className="space-y-4">
                {/* Selfie */}
                <div className="aspect-video rounded-xl overflow-hidden bg-slate-900 border border-slate-200 shadow-sm relative group">
                  <img
                    src={`${IMAGE_BASE_URL}${viewingProof.selfieUrl}`}
                    className="w-full h-full object-cover"
                    alt="Selfie proof"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                     <p className="text-[10px] text-white font-black uppercase tracking-widest flex items-center gap-1">
                        <Camera className="w-3 h-3" /> Verification Photo
                     </p>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl">
                    <span className="block text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Working Time</span>
                    <div className="text-sm font-black text-slate-800">{formatDuration(viewingProof.totalWorkingMinutes)}</div>
                  </div>
                  <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl">
                    <span className="block text-[10px] text-amber-500 uppercase font-black tracking-widest mb-1">Break Time</span>
                    <div className="text-sm font-black text-amber-700">{viewingProof.totalBreakMinutes || 0} min</div>
                  </div>
                </div>

                {/* Break History */}
                {viewingProof.breaks?.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                      <Coffee className="w-3.5 h-3.5" /> Break History
                    </h4>
                    <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
                      {viewingProof.breaks.map((b, i) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg text-xs border border-slate-100">
                          <span className="font-bold text-slate-600">{b.type}</span>
                          <span className="font-mono font-bold text-indigo-600 italic">
                            {b.startTime} - {b.endTime || "Active"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-700 font-medium">
                  <MapPin className="w-4 h-4" />
                  <span>Loc: {viewingProof.location?.latitude?.toFixed(4)}, {viewingProof.location?.longitude?.toFixed(4)} ({viewingProof.workLocation || "Onsite"})</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Edit Modal ─── */}
      <AnimatePresence>
        {editingRecord && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingRecord(null)}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[2rem] shadow-[0_30px_70px_-10px_rgba(0,0,0,0.2)] border border-slate-100 z-50 p-8"
            >
              {/* Close Button */}
              <button
                onClick={() => setEditingRecord(null)}
                className="p-2 hover:bg-slate-50 text-slate-400 rounded-xl transition-all active:scale-95 absolute top-6 right-6"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Modal Header */}
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100/50">
                  <Clock className="w-6 h-6" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest block mb-1 text-indigo-600">
                    Manual Override
                  </span>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none">
                    Update Attendance
                  </h3>
                  <p className="text-xs text-slate-400 font-medium mt-1">
                    Manual override for {editingRecord.employee?.firstName} {editingRecord.employee?.lastName}
                  </p>
                </div>
              </div>

              <form onSubmit={handleUpdate} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Status</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-sm font-semibold focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
                    value={editingRecord.status}
                    onChange={(e) => setEditingRecord({ ...editingRecord, status: e.target.value })}
                  >
                    <option value="PRESENT">Present</option>
                    <option value="ABSENT">Absent</option>
                    <option value="LEAVE">Leave</option>
                    <option value="HALF_DAY">Half Day</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">In Time</label>
                    <input
                      type="time"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-sm font-mono focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
                      value={editingRecord.inTime || ""}
                      onChange={(e) => setEditingRecord({ ...editingRecord, inTime: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Out Time</label>
                    <input
                      type="time"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-sm font-mono focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
                      value={editingRecord.outTime || ""}
                      onChange={(e) => setEditingRecord({ ...editingRecord, outTime: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Reason / Remarks</label>
                  <textarea
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-sm min-h-[80px] resize-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all font-medium"
                    placeholder="Reason for this manual override..."
                    value={editingRecord.remarks || ""}
                    onChange={(e) => setEditingRecord({ ...editingRecord, remarks: e.target.value })}
                  />
                </div>

                <div className="flex gap-4 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingRecord(null)}
                    className="flex-1 px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl transition-all active:scale-95 text-xs uppercase tracking-wider"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3.5 bg-[#0f172a] shadow-slate-900/10 hover:bg-[#1e293b] text-white font-bold rounded-2xl transition-all active:scale-95 text-xs uppercase tracking-wider"
                  >
                    Save
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Attendance;