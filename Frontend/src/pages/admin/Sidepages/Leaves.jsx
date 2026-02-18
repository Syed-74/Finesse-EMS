import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../../AuthContext/AuthContext";
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isSameDay,
  isWeekend,
  addMonths,
  subMonths,
  isWithinInterval
} from "date-fns";
import {
  CheckCircle,
  XCircle,
  Clock,
  Calendar as CalendarIcon,
  FileText,
  Settings as LucideSettings,
  Trash2,
  Search,
  Filter,
  BarChart2,
  Users,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Save,
  Briefcase
} from "lucide-react";

/* =========================================
   COMPONENT: ADVANCED ADMIN CALENDAR VIEW
========================================= */
const AdvancedAdminCalendar = ({ holidays, leaves, onDateClick, refreshData }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDay = getDay(monthStart);
  const empties = Array(startDay).fill(null);

  const getDayEvents = (date) => {
    const dayHolidays = holidays.filter(h => isSameDay(new Date(h.holidayDate), date));
    const dayLeaves = leaves.filter(l =>
      l.status === 'Approved' &&
      isWithinInterval(date, { start: parseISO(l.startDate), end: parseISO(l.endDate) })
    );
    return { dayHolidays, dayLeaves };
  };

  const getDensityClass = (count) => {
    if (count === 0) return "bg-white";
    if (count <= 2) return "bg-blue-50/50";
    if (count <= 4) return "bg-blue-100/60";
    return "bg-red-50/80 border-red-100";
  };

  const getDensityDot = (count) => {
    if (count === 0) return null;
    if (count <= 2) return <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />;
    if (count <= 4) return <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />;
    return <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />;
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
      {/* Calendar Header */}
      <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row justify-between items-center gap-6 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-200">
            <CalendarIcon size={24} />
          </div>
          <div>
            <h3 className="font-black text-2xl text-gray-900 tracking-tight">
              {format(currentDate, "MMMM yyyy")}
            </h3>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">{leaves.filter(l => l.status === 'Approved').length} Approved Leaves for Current Cycle</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm">
          <button
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            className="p-2.5 hover:bg-gray-100 rounded-xl transition-all active:scale-95 text-gray-600"
          >
            <ChevronLeft size={20} strokeWidth={2.5} />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-4 py-2 text-sm font-bold text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
          >
            Today
          </button>
          <button
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            className="p-2.5 hover:bg-gray-100 rounded-xl transition-all active:scale-95 text-gray-600"
          >
            <ChevronRight size={20} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-7 gap-px rounded-3xl overflow-hidden border border-gray-100 shadow-inner bg-gray-100">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
            <div key={d} className="bg-gray-50/80 backdrop-blur-sm p-4 text-center text-xs font-black text-gray-400 uppercase tracking-widest">
              {d}
            </div>
          ))}

          {empties.map((_, i) => (
            <div key={`empty-${i}`} className="bg-gray-50/30 h-32 md:h-40" />
          ))}

          {daysInMonth.map(day => {
            const { dayHolidays, dayLeaves } = getDayEvents(day);
            const isToday = isSameDay(day, new Date());
            const weekend = isWeekend(day);
            const densityClass = getDensityClass(dayLeaves.length);

            return (
              <div
                key={day.toString()}
                onClick={() => onDateClick(day, dayHolidays, dayLeaves)}
                className={`h-32 md:h-40 p-3 transition-all cursor-pointer relative group border-b border-r border-gray-100 last:border-r-0 ${densityClass} hover:bg-blue-50/30`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-sm font-black transition-all ${isToday
                    ? "bg-blue-600 text-white w-8 h-8 flex items-center justify-center rounded-xl shadow-lg shadow-blue-200 scale-110"
                    : weekend ? "text-gray-300" : "text-gray-900"
                    }`}>
                    {format(day, "d")}
                  </span>
                  {dayLeaves.length > 0 && (
                    <div className="flex items-center gap-1 bg-white/80 backdrop-blur-sm px-1.5 py-0.5 rounded-lg border border-gray-100 shadow-sm">
                      {getDensityDot(dayLeaves.length)}
                      <span className="text-[10px] font-black text-gray-600">{dayLeaves.length}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1 overflow-y-auto max-h-[70%] custom-scrollbar pr-1">
                  {dayHolidays.map(h => (
                    <div
                      key={h._id || h.holidayId}
                      className="group/holiday relative text-[9px] font-black uppercase tracking-tight text-red-600 bg-red-50/50 px-2 py-1 rounded-lg border border-red-100 truncate flex items-center gap-1"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      {h.holidayName}
                      <div className="absolute bottom-full left-0 mb-2 hidden group-hover/holiday:block z-20 bg-gray-900 text-white text-[10px] p-2 rounded-xl shadow-xl whitespace-nowrap">
                        {h.holidayName} ({h.holidayType})
                      </div>
                    </div>
                  ))}
                  {dayLeaves.map(l => (
                    <div
                      key={l._id || l.leaveId}
                      className="group/leave relative text-[9px] font-bold text-blue-700 bg-white px-2 py-1 rounded-lg shadow-sm border border-blue-50 truncate flex items-center gap-1 hover:border-blue-200 transition-colors"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      {l.employeeName}
                      <div className="absolute bottom-full left-0 mb-2 hidden group-hover/leave:block z-20 bg-gray-900 text-white text-[10px] p-2 rounded-xl shadow-xl whitespace-nowrap border border-gray-800">
                        {l.employeeName} - {l.leaveType} Leave
                      </div>
                    </div>
                  ))}
                </div>

                <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="p-1.5 bg-gray-900 text-white rounded-lg shadow-lg">
                    <PlusCircle size={12} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="mt-8 flex flex-wrap gap-6 text-xs font-bold text-gray-500 p-4 bg-gray-50 rounded-2xl border border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-white border border-gray-200 rounded-lg"></div>
            <span>No Leaves</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-50 border border-blue-100 rounded-lg"></div>
            <span>1-2 Employees (Low)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-100 border border-blue-200 rounded-lg"></div>
            <span>3-4 Employees (Medium)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-50 border border-red-200 rounded-lg"></div>
            <span>5+ Employees (High Density)</span>
          </div>
          <div className="flex items-center gap-1.5 ml-auto">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <span>Holiday</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <span>Approved Leave</span>
          </div>
        </div>
      </div>
    </div>
  )
};

/* =========================================
   MAIN ADMIN COMPONENT
========================================= */
const Leaves = () => {
  const { admin } = useAuth();
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [stats, setStats] = useState(null);
  const [settings, setSettings] = useState({
    leavePolicy: {
      Casual: { totalPerYear: 12, accrualType: "YEARLY", monthlyAccrual: 1, carryForward: false, maxCarryForward: 0 },
      Sick: { totalPerYear: 10, accrualType: "YEARLY", monthlyAccrual: 0.8, carryForward: false, maxCarryForward: 0 },
      Paid: { totalPerYear: 15, accrualType: "YEARLY", monthlyAccrual: 1.25, carryForward: true, maxCarryForward: 5 },
      Unpaid: { totalPerYear: 0, accrualType: "YEARLY", monthlyAccrual: 0, carryForward: false, maxCarryForward: 0 },
    },
    leaveCycle: { cycleType: "YEARLY", cycleStartMonth: 0 },
    holidays: []
  });

  // Need a separate state for editing policy to support inputs
  const [policyForm, setPolicyForm] = useState(null);

  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("dashboard"); // 'dashboard', 'requests', 'calendar', 'settings', 'allocation'

  // Modal & Actions
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [actionType, setActionType] = useState("");
  const [adminComment, setAdminComment] = useState("");
  const [processing, setProcessing] = useState(false);

  // Advanced Calendar States
  const [dateModal, setDateModal] = useState({ show: false, date: null, holidays: [], leaves: [] });
  const [holidayForm, setHolidayForm] = useState({ show: false, holiday: null, date: "" });

  const fetchData = async () => {
    try {
      const [reqRes, statRes, setRes] = await Promise.all([
        axios.get("http://localhost:5000/api/leavemanagement/all-requests"),
        axios.get("http://localhost:5000/api/leavemanagement/stats"),
        axios.get("http://localhost:5000/api/leavemanagement/settings")
      ]);
      setRequests(reqRes.data);
      setFilteredRequests(reqRes.data);
      setStats(statRes.data);

      const loadedSettings = setRes.data;
      if (!loadedSettings.leavePolicy || Array.isArray(loadedSettings.leavePolicy)) {
        loadedSettings.leavePolicy = {
          Casual: { totalPerYear: 12, accrualType: "YEARLY", monthlyAccrual: 1, carryForward: false, maxCarryForward: 0 },
          Sick: { totalPerYear: 10, accrualType: "YEARLY", monthlyAccrual: 0.8, carryForward: false, maxCarryForward: 0 },
          Paid: { totalPerYear: 15, accrualType: "YEARLY", monthlyAccrual: 1.25, carryForward: true, maxCarryForward: 5 },
          Unpaid: { totalPerYear: 0, accrualType: "YEARLY", monthlyAccrual: 0, carryForward: false, maxCarryForward: 0 },
        }
      }
      if (!loadedSettings.leaveCycle) {
        loadedSettings.leaveCycle = { cycleType: "YEARLY", cycleStartMonth: 0 };
      }

      setSettings(loadedSettings);
      setPolicyForm(JSON.parse(JSON.stringify(loadedSettings)));
    } catch (error) {
      console.error("Error fetching data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter Logic
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterType, setFilterType] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let filtered = requests;
    if (filterStatus !== "All") filtered = filtered.filter(r => r.status === filterStatus);
    if (filterType !== "All") filtered = filtered.filter(r => r.leaveType === filterType);
    if (searchQuery) filtered = filtered.filter(r => r.employeeName?.toLowerCase().includes(searchQuery.toLowerCase()));
    setFilteredRequests(filtered);
  }, [filterStatus, filterType, searchQuery, requests]);

  // Holiday CRUD
  const handleHolidaySubmit = async (values) => {
    try {
      setProcessing(true);
      if (holidayForm.holiday) {
        await axios.put(`http://localhost:5000/api/leavemanagement/holiday/${holidayForm.holiday.holidayId}`, values);
      } else {
        await axios.post("http://localhost:5000/api/leavemanagement/holiday", values);
      }
      fetchData();
      setHolidayForm({ show: false, holiday: null, date: "" });
      setDateModal({ ...dateModal, show: false });
    } catch (error) {
      alert(error.response?.data?.message || "Failed to save holiday");
    } finally {
      setProcessing(false);
    }
  };

  const deleteHoliday = async (id) => {
    if (!window.confirm("Delete this holiday?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/leavemanagement/holiday/${id}`);
      fetchData();
      setDateModal({ ...dateModal, show: false });
    } catch (error) { alert("Delete failed"); }
  };

  // Action Handler
  const handleAction = async () => {
    if (!selectedLeave) return;
    setProcessing(true);
    try {
      const status = actionType === "Approve" ? "Approved" : "Rejected";
      await axios.put(`http://localhost:5000/api/leavemanagement/status/${selectedLeave.employeeId}/${selectedLeave.leaveId}`, {
        status,
        adminComment,
        adminId: admin._id
      });
      fetchData(); // Refresh all
      setSelectedLeave(null);
      setAdminComment("");
    } catch (error) {
      console.error(error.response?.data || error.message);
      alert(error.response?.data?.message || "Failed to update leave status");
    } finally {
      setProcessing(false);
    }
  };

  const addHoliday = async () => {
    try {
      if (!newHoliday.name || !newHoliday.date) return alert("Fill fields");
      await axios.post("http://localhost:5000/api/leavemanagement/holiday", {
        holidayName: newHoliday.name,
        holidayDate: newHoliday.date,
        holidayType: newHoliday.type,
        isOptional: false
      });
      fetchData();
      setNewHoliday({ name: "", date: "", type: "National" });
    } catch (error) { alert("Error adding holiday"); }
  };

  const savePolicy = async () => {
    if (!window.confirm("Are you sure you want to update the Global Leave Policy? This will recalculate leave balances for all employees.")) return;

    try {
      await axios.put("http://localhost:5000/api/leavemanagement/policy", {
        leavePolicy: policyForm.leavePolicy,
        leaveCycle: policyForm.leaveCycle
      });
      alert("Policy updated successfully!");
      fetchData();
    } catch (error) {
      alert("Failed to update policy: " + error.message);
    }
  }

  // Helper to update nested policy state
  const updatePolicyField = (type, field, value) => {
    setPolicyForm(prev => ({
      ...prev,
      leavePolicy: {
        ...prev.leavePolicy,
        [type]: {
          ...prev.leavePolicy[type],
          [field]: value
        }
      }
    }));
  }

  const updateCycleField = (field, value) => {
    setPolicyForm(prev => ({
      ...prev,
      leaveCycle: {
        ...prev.leaveCycle,
        [field]: value
      }
    }));
  }

  if (loading) return <div className="p-10 text-center text-gray-500">Loading Admin Dashboard...</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-sans space-y-8">

      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leave Management</h1>
          <p className="text-gray-500 text-sm">Overview, Approvals & Settings</p>
        </div>
        <div className="flex bg-white p-1 rounded-lg border border-gray-200 mt-4 md:mt-0 shadow-sm">
          {[
            { id: 'dashboard', label: 'Overview', icon: BarChart2 },
            { id: 'requests', label: 'Inbox', icon: FileText },
            { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
            { id: 'allocation', label: 'Allocation', icon: Briefcase },
            { id: 'settings', label: 'Settings', icon: LucideSettings },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setView(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${view === tab.id ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-50"
                }`}
            >
              <tab.icon size={16} /> {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* DASHBOARD VIEW */}
      {view === 'dashboard' && stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 text-xs font-bold uppercase">Total Requests</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">{stats.totalRequests}</h3>
              </div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><FileText size={20} /></div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 text-xs font-bold uppercase">Pending Review</p>
                <h3 className="text-3xl font-bold text-yellow-600 mt-2">{stats.pending}</h3>
              </div>
              <div className="p-3 bg-yellow-50 text-yellow-600 rounded-lg"><Clock size={20} /></div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 text-xs font-bold uppercase">On Leave Today</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">{stats.onLeaveToday}</h3>
              </div>
              <div className="p-3 bg-purple-50 text-purple-600 rounded-lg"><Users size={20} /></div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 text-xs font-bold uppercase">Rejection Rate</p>
                <h3 className="text-3xl font-bold text-red-600 mt-2">
                  {stats.totalRequests ? Math.round((stats.rejected / stats.totalRequests) * 100) : 0}%
                </h3>
              </div>
              <div className="p-3 bg-red-50 text-red-600 rounded-lg"><AlertCircle size={20} /></div>
            </div>
          </div>
        </div>
      )}

      {/* REQUESTS VIEW */}
      {view === 'requests' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Toolbar */}
          <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-4 justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search employee..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-100"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="px-4 py-2 rounded-lg text-sm font-medium border bg-white border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-100"
              >
                <option value="All">All Types</option>
                {["Casual", "Sick", "Paid", "Unpaid"].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              {["All", "Pending", "Approved", "Rejected"].map(s => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${filterStatus === s ? "bg-gray-900 border-gray-900 text-white shadow-lg shadow-gray-200" : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                    }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Date Range</th>
                  <th className="px-6 py-4">Duration</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredRequests.map(req => (
                  <tr key={req.leaveId} className="hover:bg-gray-50/50 transition bg-white">
                    <td className="px-6 py-4 font-medium text-gray-900">{req.employeeName}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded-md bg-gray-100 text-gray-600 text-xs font-medium border border-gray-200">{req.leaveType}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {format(parseISO(req.startDate), "MMM d")} - {format(parseISO(req.endDate), "MMM d, yyyy")}
                    </td>
                    <td className="px-6 py-4 text-gray-900 font-medium">{req.totalDays} Days</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${req.status === 'Approved' ? "bg-green-100 text-green-700" :
                        req.status === 'Rejected' ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
                        }`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {req.status === 'Pending' && (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => { setSelectedLeave(req); setActionType("Approve"); }}
                            className="p-2 text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition"
                          ><CheckCircle size={18} /></button>
                          <button
                            onClick={() => { setSelectedLeave(req); setActionType("Reject"); }}
                            className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition"
                          ><XCircle size={18} /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredRequests.length === 0 && (
                  <tr><td colSpan="6" className="text-center py-12 text-gray-400">No requests found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CALENDAR VIEW */}
      {view === 'calendar' && (
        <AdvancedAdminCalendar
          holidays={settings.holidays}
          leaves={requests}
          onDateClick={(date, dayHolidays, dayLeaves) => setDateModal({ show: true, date, holidays: dayHolidays, leaves: dayLeaves })}
          refreshData={fetchData}
        />
      )}

      {/* ALLOCATION VIEW */}
      {view === 'allocation' && policyForm && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-blue-100 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Global Leave Policy</h2>
              <p className="text-xs text-gray-500">Configure how leaves are accrued and allocated for all employees.</p>
            </div>
            <button onClick={savePolicy} className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm transition">
              <Save size={18} /> Save Policy
            </button>
          </div>

          {/* Cycle Settings */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide">Leave Cycle Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Cycle Type</label>
                <select
                  value={policyForm.leaveCycle.cycleType}
                  onChange={(e) => updateCycleField('cycleType', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2 text-sm"
                >
                  <option value="YEARLY">Yearly (Jan - Dec)</option>
                  <option value="FINANCIAL_YEAR">Financial Year (Apr - Mar)</option>
                  <option value="MONTHLY">Monthly Rolling</option>
                </select>
              </div>
              {policyForm.leaveCycle.cycleType === 'FINANCIAL_YEAR' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Cycle Start Month</label>
                  <select
                    value={policyForm.leaveCycle.cycleStartMonth}
                    onChange={(e) => updateCycleField('cycleStartMonth', parseInt(e.target.value))}
                    className="w-full border border-gray-200 rounded-lg p-2 text-sm"
                  >
                    <option value={0}>January</option>
                    <option value={3}>April</option>
                    <option value={6}>July</option>
                    <option value={9}>October</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {["Casual", "Sick", "Paid", "Unpaid"].map(type => {
              const p = policyForm.leavePolicy[type] || {};
              return (
                <div key={type} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition">
                  <div className="flex justify-between items-center mb-4 border-b border-gray-50 pb-3">
                    <h3 className="font-bold text-gray-800">{type} Leave</h3>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600 font-medium">{p.accrualType}</span>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Total / Year</label>
                        <input
                          type="number"
                          value={p.totalPerYear}
                          onChange={(e) => updatePolicyField(type, 'totalPerYear', parseFloat(e.target.value))}
                          className="w-full border border-gray-200 rounded-lg p-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Accrual Type</label>
                        <select
                          value={p.accrualType}
                          onChange={(e) => updatePolicyField(type, 'accrualType', e.target.value)}
                          className="w-full border border-gray-200 rounded-lg p-2 text-sm bg-white"
                        >
                          <option value="YEARLY">Yearly Flat</option>
                          <option value="MONTHLY">Monthly Accrual</option>
                        </select>
                      </div>
                    </div>

                    {p.accrualType === 'MONTHLY' && (
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Monthly Credit</label>
                        <input
                          type="number"
                          step="0.1"
                          value={p.monthlyAccrual}
                          onChange={(e) => updatePolicyField(type, 'monthlyAccrual', parseFloat(e.target.value))}
                          className="w-full border border-gray-200 rounded-lg p-2 text-sm"
                        />
                      </div>
                    )}

                    <div className="pt-2 border-t border-gray-50 mt-2">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm text-gray-700 font-medium">Carry Forward</label>
                        <input
                          type="checkbox"
                          checked={p.carryForward}
                          onChange={(e) => updatePolicyField(type, 'carryForward', e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                      </div>
                      {p.carryForward && (
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Max Carry Forward</label>
                          <input
                            type="number"
                            value={p.maxCarryForward}
                            onChange={(e) => updatePolicyField(type, 'maxCarryForward', parseFloat(e.target.value))}
                            className="w-full border border-gray-200 rounded-lg p-2 text-sm"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* SETTINGS VIEW */}
      {view === 'settings' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CalendarIcon className="text-blue-600" /> Holiday Management
            </h3>
            <div className="flex gap-2 mb-4">
              <input
                className="flex-1 px-3 py-2 border rounded-lg text-sm"
                placeholder="Holiday Name"
                value={newHoliday.name}
                onChange={e => setNewHoliday({ ...newHoliday, name: e.target.value })}
              />
              <input
                type="date"
                className="px-3 py-2 border rounded-lg text-sm"
                value={newHoliday.date}
                onChange={e => setNewHoliday({ ...newHoliday, date: e.target.value })}
              />
              <button onClick={addHoliday} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">Add</button>
            </div>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {settings.holidays.map(h => (
                <div key={h._id} className="flex justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{h.holidayName}</p>
                    <p className="text-xs text-gray-500">{format(parseISO(h.holidayDate), "PPP")}</p>
                  </div>
                  <div className="text-xs bg-white px-2 py-1 rounded border border-gray-200 h-fit">
                    {h.holidayType}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* DATE DETAILS MODAL */}
      {dateModal.show && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md flex items-center justify-center p-4 z-[60] animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-gray-50 flex justify-between items-start bg-gradient-to-br from-gray-50 to-white">
              <div>
                <span className="text-blue-600 font-black uppercase text-[10px] tracking-widest mb-1 block">Date Details</span>
                <h3 className="text-2xl font-black text-gray-900">{format(dateModal.date, "EEEE, MMMM do")}</h3>
              </div>
              <button
                onClick={() => setDateModal({ ...dateModal, show: false })}
                className="p-2 hover:bg-gray-100 rounded-xl transition-all"
              ><XCircle size={24} className="text-gray-400" /></button>
            </div>

            <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {/* Holiday Section */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" /> Holiday
                  </h4>
                  {!dateModal.holidays.length && (
                    <button
                      onClick={() => setHolidayForm({ show: true, holiday: null, date: format(dateModal.date, "yyyy-MM-dd") })}
                      className="text-[10px] font-black text-blue-600 uppercase hover:underline"
                    >+ Add Holiday</button>
                  )}
                </div>
                {dateModal.holidays.length > 0 ? (
                  dateModal.holidays.map(h => (
                    <div key={h.holidayId} className="bg-red-50/50 border border-red-100 p-4 rounded-2xl flex justify-between items-center">
                      <div>
                        <p className="font-bold text-gray-900">{h.holidayName}</p>
                        <p className="text-[10px] font-bold text-red-600 uppercase mt-0.5">{h.holidayType} {h.isOptional ? ' (Optional)' : ''}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setHolidayForm({ show: true, holiday: h, date: format(dateModal.date, "yyyy-MM-dd") })}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                        ><LucideSettings size={18} /></button>
                        <button
                          onClick={() => deleteHoliday(h.holidayId)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        ><Trash2 size={18} /></button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-400 italic">No holiday on this date.</p>
                )}
              </div>

              {/* Employees on Leave */}
              <div>
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Employees on Leave ({dateModal.leaves.length})
                </h4>
                {dateModal.leaves.length > 0 ? (
                  <div className="space-y-3">
                    {dateModal.leaves.map(l => (
                      <div key={l.id} className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-black text-xs">
                          {l.employeeName?.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{l.employeeName}</p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{l.leaveType} Leave</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">No employees on leave today.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HOLIDAY FORM MODAL */}
      {holidayForm.show && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md flex items-center justify-center p-4 z-[70]">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden p-8 animate-in slide-in-from-bottom-8 duration-300">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-black text-gray-900">{holidayForm.holiday ? 'Edit' : 'Add'} Holiday</h3>
                <p className="text-gray-500 text-xs font-bold uppercase mt-1">{format(parseISO(holidayForm.date), "MMMM do, yyyy")}</p>
              </div>
              <button onClick={() => setHolidayForm({ show: false, holiday: null, date: "" })}><XCircle className="text-gray-300" /></button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              const form = e.target;
              handleHolidaySubmit({
                holidayName: form.name.value,
                holidayDate: holidayForm.date,
                holidayType: form.type.value,
                isOptional: form.isOptional.checked
              });
            }} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Holiday Name</label>
                <input
                  name="name"
                  defaultValue={holidayForm.holiday?.holidayName || ""}
                  required
                  placeholder="e.g. Independence Day"
                  className="w-full px-5 py-3 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all outline-none font-bold text-gray-900"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Type</label>
                <select
                  name="type"
                  defaultValue={holidayForm.holiday?.holidayType || "National"}
                  className="w-full px-5 py-3 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all outline-none font-bold text-gray-900 appearance-none"
                >
                  <option value="National">National</option>
                  <option value="Optional">Optional</option>
                  <option value="Restricted">Restricted</option>
                </select>
              </div>
              <div className="flex items-center gap-3 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                <input
                  type="checkbox"
                  name="isOptional"
                  defaultChecked={holidayForm.holiday?.isOptional || false}
                  className="w-5 h-5 rounded-lg border-gray-200 text-blue-600 focus:ring-blue-200"
                  id="isOptional"
                />
                <label htmlFor="isOptional" className="text-xs font-bold text-blue-900">Mark as Optional Holiday</label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setHolidayForm({ show: false, holiday: null, date: "" })}
                  className="flex-1 py-4 text-gray-500 font-bold hover:bg-gray-50 rounded-2xl transition-all"
                >Cancel</button>
                <button
                  type="submit"
                  disabled={processing}
                  className="flex-1 py-4 bg-gray-900 text-white rounded-2xl font-black shadow-xl shadow-gray-200 hover:shadow-2xl hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  {processing ? "Saving..." : <><Save size={18} /> Save Holiday</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL */}
      {selectedLeave && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md flex items-center justify-center p-4 z-[80]">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md p-8 animate-in zoom-in-95 duration-300">
            <h3 className="text-xl font-black text-gray-900 mb-2">
              {actionType} Request?
            </h3>
            <p className="text-sm text-gray-500 font-medium mb-6">
              Reviewing application for <span className="text-blue-600 font-black">{selectedLeave.employeeName}</span>.
            </p>
            <textarea
              className="w-full border border-gray-100 bg-gray-50 rounded-2xl p-4 text-sm font-medium focus:ring-4 focus:ring-blue-50 focus:bg-white outline-none resize-none transition-all"
              rows={4}
              placeholder="Add admin comment (Mandatory for rejection)..."
              value={adminComment}
              onChange={(e) => setAdminComment(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-4 mt-8">
              <button
                onClick={() => setSelectedLeave(null)}
                className="py-4 text-gray-500 font-bold hover:bg-gray-50 rounded-2xl transition-all"
              >Cancel</button>
              <button
                onClick={handleAction}
                disabled={processing || (actionType === 'Reject' && !adminComment.trim())}
                className={`py-4 rounded-2xl text-white font-black shadow-xl transition-all hover:-translate-y-1 active:scale-95 ${actionType === 'Approve'
                  ? "bg-green-600 shadow-green-100 hover:bg-green-700"
                  : "bg-red-600 shadow-red-100 hover:bg-red-700 disabled:opacity-50"
                  }`}
              >
                {processing ? "Wait..." : `Confirm ${actionType}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaves;