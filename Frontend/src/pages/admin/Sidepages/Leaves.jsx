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
   COMPONENT: ADMIN CALENDAR VIEW
========================================= */
const AdminCalendar = ({ holidays, leaves }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDay = getDay(monthStart);
  const empties = Array(startDay).fill(null);

  const getDayEvents = (date) => {
    const dayHolidays = holidays.filter(h => isSameDay(new Date(h.holidayDate), date));
    // Filter only approved leaves for calendar
    const dayLeaves = leaves.filter(l =>
      l.status === 'Approved' &&
      isWithinInterval(date, { start: parseISO(l.startDate), end: parseISO(l.endDate) })
    );
    return { dayHolidays, dayLeaves };
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
          <CalendarIcon className="text-blue-600" /> {format(currentDate, "MMMM yyyy")}
        </h3>
        <div className="flex gap-2">
          <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronLeft size={18} /></button>
          <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronRight size={18} /></button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden border border-gray-200">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
          <div key={d} className="bg-gray-50 p-2 text-center text-xs font-semibold text-gray-500 uppercase">
            {d}
          </div>
        ))}
        {empties.map((_, i) => <div key={`empty-${i}`} className="bg-white h-32" />)}

        {daysInMonth.map(day => {
          const { dayHolidays, dayLeaves } = getDayEvents(day);
          const isToday = isSameDay(day, new Date());
          const weekend = isWeekend(day);

          return (
            <div key={day.toString()} className={`bg-white h-32 p-2 hover:bg-gray-50 transition relative group ${weekend ? "bg-gray-50/50" : ""
              }`}>
              <span className={`text-sm font-medium ${isToday ? "bg-blue-600 text-white w-6 h-6 flex items-center justify-center rounded-full" : "text-gray-700"}`}>
                {format(day, "d")}
              </span>

              <div className="mt-1 space-y-1 overflow-y-auto max-h-[80px] custom-scrollbar">
                {dayHolidays.map(h => (
                  <div key={h._id || h.holidayId} className="text-[10px] font-medium text-red-600 bg-red-50 px-1 py-0.5 rounded truncate border border-red-100">
                    {h.holidayName}
                  </div>
                ))}
                {dayLeaves.map(l => (
                  <div key={l._id || l.leaveId} className="text-[10px] font-medium text-blue-700 bg-blue-50 px-1 py-0.5 rounded truncate border border-blue-100" title={`${l.employeeName} (${l.leaveType})`}>
                    {l.employeeName}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
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

  // Settings Form
  const [newHoliday, setNewHoliday] = useState({ name: "", date: "", type: "National" });

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
      // Ensure structure exists
      if (!loadedSettings.leavePolicy || Array.isArray(loadedSettings.leavePolicy)) {
        // Fallback if DB returns array or empty (older schema)
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
      setPolicyForm(JSON.parse(JSON.stringify(loadedSettings))); // Deep copy for form
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
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let filtered = requests;
    if (filterStatus !== "All") filtered = filtered.filter(r => r.status === filterStatus);
    if (searchQuery) filtered = filtered.filter(r => r.employeeName?.toLowerCase().includes(searchQuery.toLowerCase()));
    setFilteredRequests(filtered);
  }, [filterStatus, searchQuery, requests]);

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
            <div className="flex gap-2">
              {["All", "Pending", "Approved", "Rejected"].map(s => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${filterStatus === s ? "bg-gray-100 border-gray-300 text-gray-900" : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
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
        <AdminCalendar holidays={settings.holidays} leaves={requests} />
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

      {/* MODAL */}
      {selectedLeave && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {actionType} Request?
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Action for <span className="font-semibold text-gray-900">{selectedLeave.employeeName}</span>'s request.
            </p>
            <textarea
              className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-gray-200 outline-none resize-none"
              rows={3}
              placeholder="Add admin comment (Mandatory for rejection)..."
              value={adminComment}
              onChange={(e) => setAdminComment(e.target.value)}
            />
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setSelectedLeave(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium">Cancel</button>
              <button
                onClick={handleAction}
                disabled={processing || (actionType === 'Reject' && !adminComment.trim())}
                className={`px-6 py-2 rounded-lg text-white text-sm font-medium shadow-md transition ${actionType === 'Approve' ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700 disabled:bg-red-400"
                  }`}
              >
                {processing ? "Processing..." : `Confirm ${actionType}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaves;