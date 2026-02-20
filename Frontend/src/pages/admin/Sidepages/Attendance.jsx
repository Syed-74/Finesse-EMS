import React, { useState, useEffect } from "react";
import axios from "axios";
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
  AlertTriangle
} from "lucide-react";

/* =========================
   NETWORK BADGE HELPER
========================= */
const getNetworkBadge = (rec) => {
  const nt = rec?.deviceInfo?.networkType;
  if (nt === "Office") return { icon: "🟢", label: "Office Network", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  if (nt === "Unauthorized") return { icon: "🔴", label: "Unauthorized", cls: "bg-red-50 text-red-700 border-red-200" };
  return { icon: "🔵", label: "Remote Network", cls: "bg-blue-50 text-blue-700 border-blue-200" };
};

const Attendance = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [statusFilter, setStatusFilter] = useState("All");
  const [networkFilter, setNetworkFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [editingRecord, setEditingRecord] = useState(null);
  const [viewingProof, setViewingProof] = useState(null);
  const token = localStorage.getItem("token");

  // Stats
  const [stats, setStats] = useState({ present: 0, absent: 0, late: 0, leave: 0, unauthorized: 0 });

  useEffect(() => {
    fetchAttendance();
  }, [selectedDate, statusFilter]);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`http://localhost:5000/api/attendance/all`, {
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
    const s = { present: 0, absent: 0, late: 0, leave: 0, unauthorized: 0 };
    data.forEach((r) => {
      if (r.status === "PRESENT" && r.lateByMinutes > 0) s.late++;
      else if (r.status === "PRESENT") s.present++;
      else if (r.status === "ABSENT") s.absent++;
      else if (r.status === "LEAVE") s.leave++;

      if (r.deviceInfo?.networkType === "Unauthorized") s.unauthorized++;
    });
    setStats(s);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put(
        `http://localhost:5000/api/attendance/${editingRecord._id}`,
        editingRecord,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEditingRecord(null);
      fetchAttendance();
    } catch (err) {
      alert("Failed to update record");
    }
  };

  const getStatusBadge = (status, late) => {
    if (status === "PRESENT" && late > 0) return "bg-amber-50 text-amber-700 border-amber-200";
    if (status === "PRESENT") return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (status === "ABSENT") return "bg-red-50 text-red-700 border-red-200";
    if (status === "LEAVE") return "bg-blue-50 text-blue-700 border-blue-200";
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

    const networkMatch =
      networkFilter === "All" ||
      (networkFilter === "Office" && r.deviceInfo?.networkType === "Office") ||
      (networkFilter === "Remote" && (r.deviceInfo?.networkType === "Remote" || !r.deviceInfo?.networkType)) ||
      (networkFilter === "Unauthorized" && r.deviceInfo?.networkType === "Unauthorized");

    return nameMatch && networkMatch;
  });

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-8 space-y-6">

      {/* ─── Page Title ─── */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Attendance Management</h1>
        <p className="text-sm text-slate-500 mt-0.5 font-medium">
          {new Date(selectedDate).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
        </p>
      </div>

      {/* ─── Stats Overview ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { title: "Present", count: stats.present, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
          { title: "Late Arrivals", count: stats.late, icon: Clock, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
          { title: "Absent", count: stats.absent, icon: XCircle, color: "text-red-600", bg: "bg-red-50", border: "border-red-100" },
          { title: "On Leave", count: stats.leave, icon: Calendar, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
          {
            title: "Unauthorized IPs",
            count: stats.unauthorized,
            icon: AlertTriangle,
            color: "text-rose-700",
            bg: stats.unauthorized > 0 ? "bg-rose-50" : "bg-slate-50",
            border: stats.unauthorized > 0 ? "border-rose-200" : "border-slate-100",
            pulse: stats.unauthorized > 0
          },
        ].map((card, i) => (
          <div
            key={i}
            className={`p-5 rounded-2xl border ${card.bg} ${card.border} flex items-center justify-between shadow-sm ${card.pulse ? "ring-1 ring-rose-300/60" : ""}`}
          >
            <div>
              <p className="text-xs uppercase font-black text-slate-400 tracking-widest mb-1">{card.title}</p>
              <h3 className={`text-3xl font-black ${card.color}`}>{card.count}</h3>
            </div>
            <div className={`p-3 rounded-xl bg-white/70 ${card.color}`}>
              <card.icon className="w-5 h-5" />
            </div>
          </div>
        ))}
      </div>

      {/* ─── Filter & Tools Bar ─── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">

          {/* Search + Date */}
          <div className="flex flex-wrap gap-3 items-center">
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

            <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 text-slate-600">
              <Calendar className="w-4 h-4 text-slate-400" />
              <input
                type="date"
                className="bg-transparent text-sm outline-none font-medium"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
          </div>

          {/* Filters + Export */}
          <div className="flex flex-wrap gap-3 items-center">

            {/* Status Filter */}
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

            {/* Network Filter */}
            <div className="relative">
              <select
                className="appearance-none pl-3 pr-8 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium bg-white"
                value={networkFilter}
                onChange={(e) => setNetworkFilter(e.target.value)}
              >
                <option value="All">All Networks</option>
                <option value="Office">🟢 Office Network</option>
                <option value="Remote">🔵 Remote Network</option>
                <option value="Unauthorized">🔴 Unauthorized</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>

            <button className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200">
              <Download className="w-4 h-4" /> Export
            </button>
          </div>
        </div>
      </div>

      {/* ─── Attendance Table ─── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {["Employee", "In Time", "Out Time", "Duration", "Network Status", "Proof", "Status", "Actions"].map((h) => (
                  <th key={h} className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-16 text-center">
                    <Loader2 className="w-8 h-8 mx-auto text-indigo-400 animate-spin mb-3" />
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">Loading Records...</p>
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-16 text-center">
                    <Activity className="w-10 h-10 mx-auto text-slate-200 mb-3" />
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">No records found for this date</p>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec) => {
                  const badge = getNetworkBadge(rec);
                  return (
                    <tr key={rec._id} className="hover:bg-slate-50/80 transition-colors group">
                      {/* Employee */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {rec.employee?.profileImage ? (
                            <img
                              src={`http://localhost:5000${rec.employee.profileImage}`}
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

                      {/* In Time */}
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

                      {/* Out Time */}
                      <td className="px-6 py-4">
                        {rec.outTime
                          ? <span className="text-rose-700 bg-rose-50 border border-rose-100 px-2 py-1 rounded-lg font-mono font-bold text-xs">{rec.outTime}</span>
                          : <span className="text-slate-300 font-mono text-xs font-medium italic">On Duty</span>
                        }
                      </td>

                      {/* Duration */}
                      <td className="px-6 py-4 font-black text-slate-700">
                        {formatDuration(rec.totalWorkingMinutes)}
                      </td>

                      {/* Network Status */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-black px-2.5 py-1.5 rounded-xl border ${badge.cls}`}>
                          {badge.icon} {badge.label}
                        </span>
                      </td>

                      {/* Proof */}
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

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border-2 ${getStatusBadge(rec.status, rec.lateByMinutes)}`}>
                          {rec.status === "PRESENT" && rec.lateByMinutes > 0 ? "LATE" : rec.status}
                        </span>
                      </td>

                      {/* Actions */}
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

        {/* Table Footer */}
        {!loading && filteredRecords.length > 0 && (
          <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
            <p className="text-xs font-bold text-slate-400">
              Showing {filteredRecords.length} of {records.length} records
            </p>
            <div className="flex items-center gap-4 text-xs font-black text-slate-400 uppercase tracking-widest">
              <span className="flex items-center gap-1.5">🟢 Office: {stats.unauthorized >= 0 ? filteredRecords.filter(r => r.deviceInfo?.networkType === "Office").length : 0}</span>
              <span className="flex items-center gap-1.5">🔵 Remote: {filteredRecords.filter(r => !r.deviceInfo?.networkType || r.deviceInfo?.networkType === "Remote").length}</span>
              {stats.unauthorized > 0 && (
                <span className="flex items-center gap-1.5 text-rose-500">🔴 Unauthorized: {filteredRecords.filter(r => r.deviceInfo?.networkType === "Unauthorized").length}</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ─── Proof Modal ─── */}
      {viewingProof && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setViewingProof(null)}
        >
          <div
            className="bg-white rounded-2xl overflow-hidden max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="font-black text-slate-900 text-sm uppercase tracking-wide">Attendance Proof</h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  {viewingProof.employee?.firstName} {viewingProof.employee?.lastName}
                </p>
              </div>
              <button
                onClick={() => setViewingProof(null)}
                className="p-2 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {/* Selfie */}
              <img
                src={`http://localhost:5000${viewingProof.selfieUrl}`}
                className="w-full rounded-xl border border-slate-200 shadow-sm"
                alt="Selfie proof"
              />

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl">
                  <span className="block text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1.5">Network Status</span>
                  {(() => {
                    const badge = getNetworkBadge(viewingProof);
                    return (
                      <span className={`text-xs font-black px-2 py-1 rounded-lg border ${badge.cls}`}>
                        {badge.icon} {badge.label}
                      </span>
                    );
                  })()}
                </div>
                <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl">
                  <span className="block text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1.5">Device IP</span>
                  <div className="text-sm font-black text-slate-800 font-mono truncate">
                    {viewingProof.deviceInfo?.ip || "Unknown"}
                  </div>
                </div>
                <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl">
                  <span className="block text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1.5">Geo-fence</span>
                  <div className="text-sm font-bold flex items-center gap-1.5">
                    {viewingProof.location?.isInsideOffice
                      ? <span className="text-emerald-600 flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Inside</span>
                      : <span className="text-rose-600 flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> Outside</span>}
                  </div>
                </div>
                <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl">
                  <span className="block text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1.5">Work Location</span>
                  <div className="text-sm font-bold text-slate-800">{viewingProof.workLocation || "Office"}</div>
                </div>
              </div>

              {/* Unauthorized Warning */}
              {viewingProof.deviceInfo?.networkType === "Unauthorized" && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-black text-red-700">Unauthorized Access Attempt</p>
                    <p className="text-xs text-red-600 font-medium mt-0.5">
                      This record was flagged due to IP mismatch. IP: <span className="font-mono">{viewingProof.deviceInfo?.ip}</span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Edit Modal ─── */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-base font-black text-slate-900 uppercase tracking-wide">Update Attendance</h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Manual override for {editingRecord.employee?.firstName} {editingRecord.employee?.lastName}
                </p>
              </div>
              <button
                onClick={() => setEditingRecord(null)}
                className="p-2 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Status</label>
                <select
                  className="w-full border border-slate-200 rounded-xl p-3 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
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
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">In Time</label>
                  <input
                    type="time"
                    className="w-full border border-slate-200 rounded-xl p-3 text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={editingRecord.inTime || ""}
                    onChange={(e) => setEditingRecord({ ...editingRecord, inTime: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Out Time</label>
                  <input
                    type="time"
                    className="w-full border border-slate-200 rounded-xl p-3 text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={editingRecord.outTime || ""}
                    onChange={(e) => setEditingRecord({ ...editingRecord, outTime: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Reason / Remarks</label>
                <textarea
                  required
                  className="w-full border border-slate-200 rounded-xl p-3 text-sm min-h-[80px] resize-none focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                  placeholder="Reason for this manual override..."
                  value={editingRecord.remarks || ""}
                  onChange={(e) => setEditingRecord({ ...editingRecord, remarks: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-bold text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-colors shadow-sm shadow-indigo-200"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Attendance;