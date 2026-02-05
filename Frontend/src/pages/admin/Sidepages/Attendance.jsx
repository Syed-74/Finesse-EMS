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
  Eye,
  Camera
} from "lucide-react";

const Attendance = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [editingRecord, setEditingRecord] = useState(null);
  const [viewingProof, setViewingProof] = useState(null);
  const token = localStorage.getItem("token");


  // Stats
  const [stats, setStats] = useState({ present: 0, absent: 0, late: 0, leave: 0 });

  useEffect(() => {
    fetchAttendance();
  }, [selectedDate, statusFilter]);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`http://localhost:5000/api/attendance/all`, {
        params: { date: selectedDate, status: statusFilter },
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${token}`,
        },
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
    const s = { present: 0, absent: 0, late: 0, leave: 0 };
    data.forEach(r => {
      if (r.status === 'PRESENT' && r.lateByMinutes > 0) s.late++;
      else if (r.status === 'PRESENT') s.present++;
      else if (r.status === 'ABSENT') s.absent++;
      else if (r.status === 'LEAVE') s.leave++;
    });
    setStats(s);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put(
        `http://localhost:5000/api/attendance/${editingRecord._id}`,
        editingRecord,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setEditingRecord(null);
      fetchAttendance();
    } catch (err) {
      alert("Failed to update record");
    }
  };

  const getStatusColor = (status, late) => {
    if (status === 'PRESENT' && late > 0) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (status === 'PRESENT') return 'bg-green-100 text-green-800 border-green-200';
    if (status === 'ABSENT') return 'bg-red-100 text-red-800 border-red-200';
    if (status === 'LEAVE') return 'bg-blue-100 text-blue-800 border-blue-200';
    return 'bg-gray-100 text-gray-800';
  };

  // Filtered Display Data
  const filteredRecords = records.filter(r =>
    r.employee?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.employee?.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.employee?.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">

      {/* 📊 Stats Overview */}
      <h1 className="text-2xl font-bold text-gray-800">Attendance Overview</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard title="Present" count={stats.present} icon={CheckCircle} color="text-green-600" bg="bg-green-50" />
        <StatsCard title="Late Arrivals" count={stats.late} icon={Clock} color="text-yellow-600" bg="bg-yellow-50" />
        <StatsCard title="Absent" count={stats.absent} icon={XCircle} color="text-red-600" bg="bg-red-50" />
        <StatsCard title="On Leave" count={stats.leave} icon={Calendar} color="text-blue-600" bg="bg-blue-50" />
      </div>

      {/* 🔍 Filter & Tools Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 flex flex-col md:flex-row gap-4 justify-between items-center shadow-sm">
        <div className="flex gap-4 w-full md:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search employee..."
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2 bg-gray-50">
            <Calendar className="w-4 h-4 text-gray-500" />
            <input
              type="date"
              className="bg-transparent text-sm outline-none text-gray-700"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="All">All Status</option>
            <option value="PRESENT">Present</option>
            <option value="ABSENT">Absent</option>
            <option value="LEAVE">Leave</option>
          </select>

          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {/* 📋 Attendance Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">In Time</th>
                <th className="px-6 py-4">Out Time</th>
                <th className="px-6 py-4">Total Hrs</th>
                <th className="px-6 py-4">Proof</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan="7" className="px-6 py-8 text-center text-gray-400">Loading records...</td></tr>
              ) : filteredRecords.length === 0 ? (
                <tr><td colSpan="7" className="px-6 py-8 text-center text-gray-400">No records found for this date.</td></tr>
              ) : filteredRecords.map((rec) => (
                <tr key={rec._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                        {rec.employee?.firstName?.[0]}{rec.employee?.lastName?.[0]}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{rec.employee?.firstName} {rec.employee?.lastName}</div>
                        <div className="text-xs text-gray-500">{rec.employee?.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-gray-700">
                    {rec.inTime}
                    {rec.lateByMinutes > 0 && <span className="ml-2 text-xs text-red-500 font-medium">+{rec.lateByMinutes}m Late</span>}
                  </td>
                  <td className="px-6 py-4 font-mono text-gray-500">{rec.outTime || '--:--'}</td>
                  <td className="px-6 py-4 text-gray-600">
                    {rec.totalWorkingMinutes
                      ? `${Math.floor(rec.totalWorkingMinutes / 60)}h ${rec.totalWorkingMinutes % 60}m`
                      : '-'
                    }
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {rec.selfieUrl && (
                        <button onClick={() => setViewingProof(rec)} className="p-1.5 bg-gray-100 rounded-md hover:bg-gray-200 text-gray-600">
                          <Camera className="w-4 h-4" />
                        </button>
                      )}
                      {rec.location?.isInsideOffice ? (
                        <span title="Inside Office" className="text-green-600"><CheckCircle className="w-4 h-4" /></span>
                      ) : rec.location?.latitude ? (
                        <span title="Outside Office" className="text-orange-500"><AlertCircle className="w-4 h-4" /></span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(rec.status, rec.lateByMinutes)}`}>
                      {rec.lateByMinutes > 0 ? "LATE" : rec.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setEditingRecord(rec)}
                      className="text-blue-600 hover:text-blue-800 font-medium text-xs border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 🖼️ Proof Modal */}
      {viewingProof && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setViewingProof(null)}>
          <div className="bg-white rounded-xl overflow-hidden max-w-lg w-full shadow-2xl animate-in zoom-in-95 cursor-default" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-bold">Attendance Proof</h3>
              <button onClick={() => setViewingProof(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-4">
              <img src={`http://localhost:5000${viewingProof.selfieUrl}`} className="w-full rounded-lg border border-gray-200" alt="Selfie" />

              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <span className="block text-gray-500 text-xs uppercase mb-1">Status</span>
                  <div className="font-semibold flex items-center gap-2">
                    {viewingProof.location?.isInsideOffice
                      ? <span className="text-green-600 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Inside Office</span>
                      : <span className="text-red-600 flex items-center gap-1"><XCircle className="w-3 h-3" /> Outside Boundary</span>}
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <span className="block text-gray-500 text-xs uppercase mb-1">Device</span>
                  <div className="truncate text-gray-700" title={viewingProof.deviceInfo?.userAgent}>
                    {viewingProof.deviceInfo?.ip || "Unknown IP"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✏️ Edit Modal */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl w-full max-w-md shadow-2xl animate-in zoom-in-95">
            <div className="p-5 border-b">
              <h3 className="text-lg font-bold">Update Attendance</h3>
              <p className="text-sm text-gray-500">Manual override for {editingRecord.employee?.firstName}</p>
            </div>
            <form onSubmit={handleUpdate} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  className="w-full border border-gray-300 rounded-lg p-2.5"
                  value={editingRecord.status}
                  onChange={e => setEditingRecord({ ...editingRecord, status: e.target.value })}
                >
                  <option value="PRESENT">Present</option>
                  <option value="ABSENT">Absent</option>
                  <option value="LEAVE">Leave</option>
                  <option value="HALF_DAY">Half Day</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">In Time</label>
                  <input
                    type="time"
                    className="w-full border border-gray-300 rounded-lg p-2.5"
                    value={editingRecord.inTime || ""}
                    onChange={e => setEditingRecord({ ...editingRecord, inTime: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Out Time</label>
                  <input
                    type="time"
                    className="w-full border border-gray-300 rounded-lg p-2.5"
                    value={editingRecord.outTime || ""}
                    onChange={e => setEditingRecord({ ...editingRecord, outTime: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Remarks (Reason)</label>
                <textarea
                  required
                  className="w-full border border-gray-300 rounded-lg p-2.5 min-h-[80px]"
                  placeholder="Why are you changing this record?"
                  value={editingRecord.remarks || ""}
                  onChange={e => setEditingRecord({ ...editingRecord, remarks: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setEditingRecord(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

const StatsCard = ({ title, count, icon: Icon, color, bg }) => (
  <div className={`p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between ${bg}`}>
    <div>
      <p className="text-gray-500 text-xs uppercase font-semibold mb-1">{title}</p>
      <h3 className={`text-2xl font-bold ${color}`}>{count}</h3>
    </div>
    <div className={`p-3 rounded-full bg-white/60 ${color}`}>
      <Icon className="w-5 h-5" />
    </div>
  </div>
);

export default Attendance;