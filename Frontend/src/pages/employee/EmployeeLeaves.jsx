import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../AuthContext/AuthContext";
import {
  format,
  parseISO,
  eachDayOfInterval,
  isWeekend,
  isSameDay,
  startOfMonth,
  endOfMonth,
  getDay,
  addMonths,
  subMonths,
  isWithinInterval
} from "date-fns";
import {
  Calendar as CalendarIcon,
  Clock,
  CheckCircle,
  XCircle,
  PlusCircle,
  History,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Users
} from "lucide-react";

/* =========================================
   COMPONENT: SMART CALENDAR VIEW
========================================= */
/* =========================================
   COMPONENT: ADVANCED SMART CALENDAR VIEW
========================================= */
const AdvancedSmartCalendar = ({ holidays, myLeaves, teamLeaves, onDateClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date()); 

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDay = getDay(monthStart);
  const empties = Array(startDay).fill(null);

  const getDayStatus = (date) => {
    const holiday = holidays.find(h => isSameDay(new Date(h.holidayDate), date));
    const personal = myLeaves.find(l => isWithinInterval(date, { start: parseISO(l.startDate), end: parseISO(l.endDate) }));
    const teams = teamLeaves.filter(l => isWithinInterval(date, { start: parseISO(l.start), end: parseISO(l.end) }));
    return { holiday, personal, teams };
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
      <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row justify-between items-center gap-6 bg-gradient-to-br from-indigo-50/30 to-white">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100">
            <CalendarIcon size={24} />
          </div>
          <div>
            <h3 className="font-black text-2xl text-gray-900 tracking-tight">{format(currentDate, "MMMM yyyy")}</h3>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Team Availability Dashboard</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm">
          <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-2.5 hover:bg-gray-50 rounded-xl transition-all text-gray-600"><ChevronLeft size={20} strokeWidth={2.5} /></button>
          <button onClick={() => setCurrentDate(new Date())} className="px-4 py-2 text-sm font-bold text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all font-black">THIS MONTH</button>
          <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-2.5 hover:bg-gray-50 rounded-xl transition-all text-gray-600"><ChevronRight size={20} strokeWidth={2.5} /></button>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-7 gap-px rounded-3xl overflow-hidden bg-gray-100 border border-gray-100 shadow-inner">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
            <div key={d} className="bg-gray-50/80 backdrop-blur-sm p-4 text-center text-xs font-black text-gray-400 uppercase tracking-widest">{d}</div>
          ))}
          {empties.map((_, i) => <div key={`empty-${i}`} className="bg-gray-50/30 h-32 md:h-40" />)}
          {daysInMonth.map(day => {
            const { holiday, personal, teams } = getDayStatus(day);
            const isToday = isSameDay(day, new Date());
            const weekend = isWeekend(day);

            return (
              <div
                key={day.toString()}
                onClick={() => onDateClick(day, holiday, personal, teams)}
                className={`h-32 md:h-40 p-3 transition-all cursor-pointer relative group border-b border-r border-gray-100 last:border-r-0 hover:bg-indigo-50/30 ${weekend ? "bg-gray-50/50" : "bg-white"
                  } ${holiday ? "bg-red-50/30" : ""}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-sm font-black transition-all ${isToday
                      ? "bg-indigo-600 text-white w-8 h-8 flex items-center justify-center rounded-xl shadow-lg shadow-indigo-200 scale-110"
                      : weekend ? "text-gray-300" : "text-gray-900"
                    }`}>
                    {format(day, "d")}
                  </span>
                  {teams.length > 0 && !personal && (
                    <div className="flex -space-x-2">
                      {teams.slice(0, 3).map((t, idx) => (
                        <div key={idx} className="w-5 h-5 rounded-full border-2 border-white bg-indigo-100 flex items-center justify-center text-[8px] font-black text-indigo-600" title={t.employeeName}>
                          {t.employeeName[0]}
                        </div>
                      ))}
                      {teams.length > 3 && <div className="w-5 h-5 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[8px] font-black text-gray-600">+{teams.length - 3}</div>}
                    </div>
                  )}
                </div>

                <div className="space-y-1 overflow-y-auto max-h-[65%] custom-scrollbar">
                  {holiday && (
                    <div className="text-[9px] font-black uppercase tracking-tight text-red-600 bg-red-50 px-2 py-1 rounded-lg border border-red-100 truncate flex items-center gap-1">
                      <div className="w-1 h-1 rounded-full bg-red-500" /> {holiday.holidayName}
                    </div>
                  )}
                  {personal && (
                    <div className={`text-[9px] font-black uppercase tracking-tight px-2 py-1 rounded-lg border truncate flex items-center gap-1 ${personal.status === 'Approved' ? "bg-green-50 text-green-700 border-green-100" : "bg-amber-50 text-amber-700 border-amber-100"
                      }`}>
                      <div className={`w-1 h-1 rounded-full ${personal.status === 'Approved' ? "bg-green-500" : "bg-amber-500"}`} /> {personal.leaveType}
                    </div>
                  )}
                  {teams.length > 0 && !personal && (
                    <div className="text-[9px] font-bold text-indigo-600 bg-indigo-50/50 px-2 py-1 rounded-lg border border-indigo-100 truncate flex items-center gap-1">
                      <Users size={8} /> {teams.length} on leave
                    </div>
                  )}
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

        <div className="mt-8 flex flex-wrap gap-6 text-xs font-bold text-gray-500 p-6 bg-gray-50 rounded-3xl border border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-50 border border-red-100 rounded-lg"></div>
            <span>Holiday</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-50 border border-green-100 rounded-lg"></div>
            <span>Approved</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-amber-50 border border-amber-100 rounded-lg"></div>
            <span>Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-indigo-50 border border-indigo-100 rounded-lg"></div>
            <span>Team Away</span>
          </div>
        </div>
      </div>
    </div>
  )
};

/* =========================================
   MAIN COMPONENT
========================================= */
const EmployeeLeaves = () => {
  const { admin, loading: authLoading } = useAuth(); // Assume 'admin' is user
  const [activeTab, setActiveTab] = useState("apply");
  const [balance, setBalance] = useState(null);
  const [history, setHistory] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [teamLeaves, setTeamLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form
  const [formData, setFormData] = useState({
    leaveType: "Casual",
    startDate: "",
    endDate: "",
    reason: "",
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [calculatedDays, setCalculatedDays] = useState(0);

  // New States
  const [quickApplyDate, setQuickApplyDate] = useState(null);
  const [dateDetail, setDateDetail] = useState({ show: false, date: null, holiday: null, personal: null, teams: [] });

  const fetchData = async () => {
    const userId = admin?._id || admin?.id;
    if (!userId) return;

    try {
      setLoading(true);
      const [userRes, calendarRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/leavemanagement/employee/${userId}`),
        axios.get(`http://localhost:5000/api/leavemanagement/calendar`)
      ]);

      // ✅ Normalize Balance Data
      const rawBalance = userRes.data.balance || {};
      const categories = ["Casual", "Sick", "Paid", "Unpaid"];
      const normalized = {};

      categories.forEach(type => {
        const detail = rawBalance.detailedBalance?.[type];
        const legacy = rawBalance.leaveTypeWiseBalance?.[type];

        normalized[type] = {
          total: detail?.total ?? (legacy || 0),
          used: detail?.used ?? 0,
          remaining: detail?.remaining ?? (detail ? (detail.total - detail.used) : (legacy || 0)),
          max: detail?.maxLeaves || (detail?.total || legacy || 0)
        };
      });

      setBalance(normalized);
      setHistory(userRes.data.leaves);
      setHolidays(userRes.data.holidays);
      setTeamLeaves(calendarRes.data.filter(e => e.employeeId !== userId)); // Remove self
    } catch (error) {
      console.error("Fetch error", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [admin]);

  // SMART CALCULATION
  const calculateDuration = (start, end) => {
    if (!start || !end) return 0;
    const startDate = parseISO(start);
    const endDate = parseISO(end);
    if (endDate < startDate) return 0;

    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const workingDays = days.filter(day => {
      if (isWeekend(day)) return false;
      if (holidays.some(h => isSameDay(new Date(h.holidayDate), day))) return false;
      return true;
    });

    return workingDays.length;
  };

  // Recalculate when dates change
  useEffect(() => {
    const days = calculateDuration(formData.startDate, formData.endDate);
    setCalculatedDays(days);
  }, [formData.startDate, formData.endDate, holidays]);

  const handleApply = async (e) => {
    e.preventDefault();
    if (calculatedDays <= 0) return alert("Please select valid working days (Weekends & Holidays are excluded).");

    // Check Balance Before Submit
    const userId = admin?._id || admin?.id;
    if (!userId) return alert("Session lost. Please log in again.");

    const available = balance[formData.leaveType]?.remaining || 0;
    if (calculatedDays > available) {
      return alert(`Insufficient ${formData.leaveType} balance. Requested: ${calculatedDays}, Available: ${available}`);
    }

    setSubmitLoading(true);
    try {
      await axios.post(`http://localhost:5000/api/leavemanagement/apply/${userId}`, {
        ...formData,
        // Backend recalculates anyway, but good to send what user saw
        totalDays: calculatedDays,
      });
      alert("Leave Request Submitted!");
      setFormData({ leaveType: "Casual", startDate: "", endDate: "", reason: "" });
      setActiveTab("history");
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || "Failed.");
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading || authLoading) return <div className="p-10 text-center text-gray-500">Loading Portal...</div>;
  if (!admin) return <div className="p-10 text-center text-red-500">Session Expired. Log in.</div>;
  if (!balance) return <div className="p-10 text-center text-gray-500">Account Initializing...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row justify-between md:items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">My Leave Portal</h1>
            <p className="text-gray-500">Manage leaves and check team availability.</p>
          </div>

          <div className="mt-4 md:mt-0 flex bg-white rounded-lg p-1 shadow-sm border border-gray-200">
            {[
              { id: "apply", icon: PlusCircle, label: "Apply" },
              { id: "history", icon: History, label: "History" },
              { id: "calendar", icon: CalendarIcon, label: "Calendar" },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === tab.id ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-50"
                  }`}
              >
                <tab.icon size={16} /> {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Balance Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {Object.entries(balance).map(([key, data]) => (
            <div key={key} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-all duration-300">
              {/* Decorative BG */}
              <div className={`absolute top-0 right-0 w-24 h-24 transform translate-x-8 -translate-y-8 rounded-full opacity-10 transition group-hover:scale-110 ${key === 'Casual' ? 'bg-blue-500' : key === 'Sick' ? 'bg-red-500' : key === 'Paid' ? 'bg-green-500' : 'bg-amber-500'
                }`} />

              <div className="flex justify-between items-start mb-4">
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${key === 'Casual' ? 'bg-blue-50 text-blue-600' :
                  key === 'Sick' ? 'bg-red-50 text-red-600' :
                    key === 'Paid' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
                  }`}>
                  {key}
                </span>
                <Briefcase size={14} className="text-gray-300" />
              </div>

              <div className="flex items-baseline gap-1 mb-4">
                <h2 className={`text-4xl font-bold ${data.remaining <= 0 ? 'text-red-500' : 'text-gray-800'}`}>
                  {data.remaining}
                </h2>
                <span className="text-xs text-gray-400 font-medium">days left</span>
              </div>

              <div className="grid grid-cols-2 gap-2 border-t border-gray-50 pt-3 mt-auto">
                <div>
                  <p className="text-[9px] font-bold text-gray-400 uppercase leading-none mb-1">Accrued / Year</p>
                  <p className="text-sm font-bold text-gray-700">{data.total} <span className="text-gray-400 text-xs">/ {data.max}</span></p>
                  {data.total !== data.max && (
                    <div className="mt-1 h-1 bg-gray-100 rounded-full overflow-hidden w-full">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(data.total / (data.max || 1)) * 100}%` }} />
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-bold text-gray-400 uppercase leading-none mb-1">Used</p>
                  <p className="text-sm font-bold text-gray-700">{data.used}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Content Area */}
        <div className="transition-all duration-300">
          {activeTab === "apply" && (
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-2xl mx-auto">
              <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                <PlusCircle className="text-blue-500" /> New Leave Request
              </h3>
              <form onSubmit={handleApply} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 font-bold uppercase text-[10px] tracking-wider">Leave Type</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(balance).map(([type, data]) => (
                      <button
                        key={type}
                        type="button"
                        disabled={data.remaining <= 0}
                        onClick={() => setFormData({ ...formData, leaveType: type })}
                        className={`py-3 rounded-xl border text-sm font-bold transition flex flex-col items-center gap-1 ${formData.leaveType === type
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-100 hover:bg-gray-50 text-gray-500"
                          } ${data.remaining <= 0 ? "opacity-50 cursor-not-allowed bg-gray-50" : ""}`}
                      >
                        {type}
                        <span className={`text-[9px] ${data.remaining <= 0 ? 'text-red-400' : 'text-gray-400'}`}>
                          ({data.remaining} left)
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 font-bold uppercase text-[10px] tracking-wider">Start Date</label>
                    <input
                      type="date"
                      required
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-100"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 font-bold uppercase text-[10px] tracking-wider">End Date</label>
                    <input
                      type="date"
                      required
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-100"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    />
                  </div>
                </div>

                {/* Smart Duration Display */}
                <div className={`p-4 rounded-xl flex items-center justify-between transition-all duration-300 ${calculatedDays > 0
                  ? (calculatedDays > (balance[formData.leaveType]?.remaining || 0) ? "bg-red-50 text-red-800" : "bg-blue-50 text-blue-800")
                  : "bg-gray-50 text-gray-400"
                  }`}>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/50 rounded-lg"><Clock size={18} /></div>
                    <div>
                      <p className="text-[10px] font-bold uppercase opacity-60">Calculated Duration</p>
                      <p className="font-bold text-lg">{calculatedDays > 0 ? `${calculatedDays} Working Days` : "Select valid dates"}</p>
                    </div>
                  </div>
                  {calculatedDays > (balance[formData.leaveType]?.remaining || 0) && (
                    <div className="text-xs font-bold text-red-500 uppercase flex flex-col items-end">
                      <span>Insufficient Balance</span>
                      <span className="opacity-70">Available: {balance[formData.leaveType]?.remaining}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Reason</label>
                  <textarea
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-100 h-32 resize-none"
                    placeholder="Why do you need leave?"
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  />
                </div>

                <button
                  disabled={submitLoading || calculatedDays <= 0}
                  className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold shadow-lg shadow-gray-200 hover:shadow-xl hover:-translate-y-0.5 transition disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  {submitLoading ? "Submitting..." : "Submit Application"}
                </button>
              </form>
            </div>
          )}

          {activeTab === "history" && (
            <div className="space-y-4">
              {history.map(item => (
                <div key={item.leaveId} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${item.status === 'Approved' ? "bg-green-100 text-green-700" :
                        item.status === 'Rejected' ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
                        }`}>
                        {item.status}
                      </span>
                      <span className="font-semibold text-gray-900">{item.leaveType} Leave</span>
                    </div>
                    <div className="text-sm text-gray-500 flex items-center gap-2">
                      <CalendarIcon size={14} />
                      {format(parseISO(item.startDate), "MMM d")} - {format(parseISO(item.endDate), "MMM d, yyyy")}
                      <span className="w-1 h-1 bg-gray-300 rounded-full" />
                      {item.totalDays} Days
                    </div>
                  </div>
                  {item.adminComment && (
                    <div className="mt-3 md:mt-0 md:text-right bg-gray-50 p-3 rounded-lg max-w-sm">
                      <div className="text-xs font-bold text-gray-400 uppercase mb-1">Admin Comment</div>
                      <p className="text-sm text-gray-700 italic">"{item.adminComment}"</p>
                    </div>
                  )}
                </div>
              ))}
              {history.length === 0 && <div className="text-center py-12 text-gray-400">No history yet.</div>}
            </div>
          )}

          {activeTab === "calendar" && (
            <AdvancedSmartCalendar
              holidays={holidays}
              myLeaves={history}
              teamLeaves={teamLeaves}
              onDateClick={(date, holiday, personal, teams) => setDateDetail({ show: true, date, holiday, personal, teams })}
            />
          )}
        </div>

        {/* DATE DETAIL MODAL (EMPLOYEE) */}
        {dateDetail.show && (
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="p-8 border-b border-gray-50 flex justify-between items-start bg-gradient-to-br from-indigo-50/30 to-white">
                <div>
                  <span className="text-indigo-600 font-black uppercase text-[10px] tracking-widest mb-1 block">Day Navigator</span>
                  <h3 className="text-2xl font-black text-gray-900">{format(dateDetail.date, "EEEE, MMMM do")}</h3>
                </div>
                <button onClick={() => setDateDetail({ ...dateDetail, show: false })}><XCircle size={24} className="text-gray-400" /></button>
              </div>

              <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
                {/* Status List */}
                <div className="space-y-4">
                  {dateDetail.holiday && (
                    <div className="p-5 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-4">
                      <div className="w-10 h-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center font-black">🎉</div>
                      <div>
                        <p className="font-bold text-gray-900">{dateDetail.holiday.holidayName}</p>
                        <p className="text-[10px] font-bold text-red-600 uppercase italic">{dateDetail.holiday.holidayType} Holiday</p>
                      </div>
                    </div>
                  )}

                  {dateDetail.personal && (
                    <div className="p-5 bg-green-50 border border-green-100 rounded-2xl flex items-center gap-4">
                      <div className="w-10 h-10 bg-green-100 text-green-600 rounded-xl flex items-center justify-center font-black">🗓️</div>
                      <div>
                        <p className="font-bold text-gray-900">Your {dateDetail.personal.leaveType} Leave</p>
                        <p className="text-[10px] font-bold text-green-600 uppercase font-black">{dateDetail.personal.status}</p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Team Availability</h4>
                    {dateDetail.teams.length > 0 ? (
                      <div className="grid grid-cols-1 gap-3">
                        {dateDetail.teams.map((t, idx) => (
                          <div key={idx} className="bg-gray-50 p-4 rounded-2xl flex items-center gap-4 border border-gray-100">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-xs">
                              {t.employeeName[0]}
                            </div>
                            <div>
                              <p className="font-bold text-gray-800 text-sm">{t.employeeName}</p>
                              <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-tight">{t.leaveType} Leave</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 italic">Everyone is available today.</p>
                    )}
                  </div>
                </div>

                {/* Quick Apply Action */}
                {!dateDetail.personal && !isWeekend(dateDetail.date) && (!dateDetail.holiday || dateDetail.holiday.isOptional) && (
                  <button
                    onClick={() => {
                      setFormData({
                        ...formData,
                        startDate: format(dateDetail.date, "yyyy-MM-dd"),
                        endDate: format(dateDetail.date, "yyyy-MM-dd"),
                      });
                      setActiveTab("apply");
                      setDateDetail({ ...dateDetail, show: false });
                    }}
                    className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black shadow-xl shadow-gray-200 hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center justify-center gap-2 group"
                  >
                    Quick Apply for this Day <PlusCircle size={18} className="group-hover:rotate-90 transition-transform" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeLeaves;