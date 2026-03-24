import React, { useEffect, useState } from "react";
import axios from "../../api/axios";
import { toast } from "react-hot-toast";
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
  ChevronLeft,
  ChevronRight,
  Users,
  AlertCircle,
  Briefcase
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

  const getCalendarColor = (status, type) => {
    if (status === 'Holiday') return 'bg-red-500';
    if (status === 'Approved') return 'bg-blue-500';
    if (status === 'Pending') return 'bg-amber-500';
    return 'bg-indigo-500';
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
                </div>

                <div className="space-y-1 overflow-y-auto max-h-[65%] custom-scrollbar">
                  {holiday && (
                    <div className="text-[9px] font-black uppercase tracking-tight text-red-600 bg-red-50 px-2 py-1 rounded-lg border border-red-100 truncate flex items-center gap-1">
                      <div className="w-1 h-1 rounded-full bg-red-500" /> {holiday.holidayName}
                    </div>
                  )}
                  {personal && (
                    <div className={`text-[9px] font-black uppercase tracking-tight px-2 py-1 rounded-lg border truncate flex items-center gap-1 ${personal.status === 'Approved' ? "bg-blue-50 text-blue-700 border-blue-100" : "bg-amber-50 text-amber-700 border-amber-100"
                      }`}>
                      <div className={`w-1 h-1 rounded-full ${personal.status === 'Approved' ? "bg-blue-500" : "bg-amber-500"}`} /> {personal.leaveType}
                    </div>
                  )}
                  {teams.length > 0 && !personal && (
                    <div className="text-[9px] font-bold text-indigo-600 bg-indigo-50/50 px-2 py-1 rounded-lg border border-indigo-100 truncate flex items-center gap-1">
                      <Users size={8} /> {teams.length} on leave
                    </div>
                  )}
                </div>
              </div>
            )
          })}
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
    leaveType: "",
    startDate: "",
    endDate: "",
    reason: "",
    attachment: null,
    type: "Full Day",
    half: "First Half"
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

      const [leaveRes, policyRes, allLeavesRes, balanceRes] = await Promise.all([
        axios.get("/leaveapplication/my"),
        axios.get("/leavepolicy/current"),
        axios.get("/leaveapplication"),
        axios.get("/leavebalance/my")
      ]);

      const myLeaves = leaveRes.data.data || [];
      const policy = policyRes.data.data;
      const allLeaves = allLeavesRes.data.data || [];
      const balances = balanceRes.data || [];

      setHistory(myLeaves);
      setHolidays(policy?.holidays || []);

      // Team Leaves = All approved leaves except mine
      const team = allLeaves.filter(
        l => (l.employeeId?._id || l.employeeId) !== userId && l.status === "Approved"
      );
      setTeamLeaves(team.map(l => ({
        ...l,
        start: l.startDate,
        end: l.endDate,
        employeeName: (l.employeeId?.firstName && l.employeeId?.lastName)
          ? `${l.employeeId.firstName} ${l.employeeId.lastName}`
          : (l.employeeId?.name || "Employee")
      })));

      // Map balance data from backend
      const balanceData = {};

      // 1. Initialize from Policy (Ensures all admin-defined categories exist)
      if (policy?.leaveTypes) {
        policy.leaveTypes.forEach(pt => {
          balanceData[pt.leaveType] = {
            total: pt.totalPerYear,
            used: 0,
            remaining: pt.totalPerYear,
            max: pt.totalPerYear
          };
        });
      }

      // 2. Overwrite/Augment with actual employee balances
      if (Array.isArray(balances)) {
        balances.forEach(b => {
          balanceData[b.leaveType] = {
            total: b.totalAllocated,
            used: b.usedLeaves,
            remaining: b.remainingLeaves,
            max: b.totalAllocated
          };
        });
      }

      setBalance(balanceData);

      // Set default leave type if not set
      if (Object.keys(balanceData).length > 0 && !formData.leaveType) {
        setFormData(prev => ({ ...prev, leaveType: Object.keys(balanceData)[0] }));
      }

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
    if (formData.type === 'Half Day') return 0.5;
    
    const startDate = parseISO(start);
    const endDate = parseISO(end);
    
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
    // If it's a half day, force endDate = startDate
    if (formData.type === 'Half Day' && formData.startDate && formData.endDate !== formData.startDate) {
      setFormData(prev => ({ ...prev, endDate: prev.startDate }));
    }
    const days = calculateDuration(formData.startDate, formData.endDate);
    setCalculatedDays(days);
  }, [formData.startDate, formData.endDate, holidays, formData.type]);

  const handleApply = async (e) => {
    e.preventDefault();
    if (calculatedDays <= 0) return toast.error("Please select valid working days (Weekends & Holidays are excluded).");

    const userId = admin?._id || admin?.id;
    if (!userId) return toast.error("Session lost. Please log in again.");

    const available = balance[formData.leaveType]?.remaining || 0;
    if (calculatedDays > available) {
      toast.error("Insufficient leave balance.");
      return;
    }

    // Feature Requirement: Sick Leave → Attachment is required.
    if (formData.leaveType === "Sick Leave" && !formData.attachment) {
      toast.error("Attachment is required for Sick Leave.");
      return;
    }

    setSubmitLoading(true);
    try {
      const submitData = new FormData();
      submitData.append("employeeId", userId);
      submitData.append("leaveType", formData.leaveType);
      submitData.append("startDate", formData.startDate);
      submitData.append("endDate", formData.endDate);
      submitData.append("employeeComment", formData.reason);
      submitData.append("isHalfDay", formData.type === 'Half Day');
      if (formData.type === 'Half Day') {
         submitData.append("half", formData.half);
      }
      if (formData.attachment) {
        submitData.append("attachment", formData.attachment);
      }

      await axios.post("/leaveapplication", submitData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      toast.success("Leave request submitted successfully.");
      setFormData({ leaveType: Object.keys(balance)[0] || "", startDate: "", endDate: "", reason: "", attachment: null, type: "Full Day", half: "First Half" });
      setActiveTab("history");
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit request.");
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
          {Object.entries(balance).map(([key, data]) => {
            const getColor = (name) => {
              const n = name.toLowerCase();
              if (n.includes("sick")) return "rose";
              if (n.includes("casual")) return "indigo";
              if (n.includes("paid") || n.includes("earned")) return "emerald";
              if (n.includes("emergency")) return "amber";
              return "slate";
            };
            const color = getColor(key);
            const colorClasses = {
              rose: "bg-rose-50 text-rose-600",
              indigo: "bg-indigo-50 text-indigo-600",
              emerald: "bg-emerald-50 text-emerald-600",
              amber: "bg-amber-50 text-amber-600",
              slate: "bg-slate-50 text-slate-600"
            }[color];
            const bgClasses = {
              rose: "bg-rose-500",
              indigo: "bg-indigo-500",
              emerald: "bg-emerald-500",
              amber: "bg-amber-500",
              slate: "bg-slate-500"
            }[color];

            return (
              <div key={key} className="bg-white p-6 rounded-[2rem] shadow-xl shadow-gray-100/50 border border-gray-100 relative overflow-hidden group hover:shadow-2xl hover:-translate-y-1 transition-all duration-500">
                {/* Decorative BG */}
                <div className={`absolute top-0 right-0 w-24 h-24 transform translate-x-8 -translate-y-8 rounded-full opacity-10 transition-transform duration-700 group-hover:scale-150 ${bgClasses}`} />

                <div className="flex justify-between items-start mb-6">
                  <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest ${colorClasses}`}>
                    {key.replace(/_/g, ' ')}
                  </span>
                  <div className="p-2 bg-gray-50 rounded-lg text-gray-400">
                    <Briefcase size={16} />
                  </div>
                </div>

                <div className="flex items-baseline gap-2 mb-6">
                  <h2 className={`text-5xl font-black tracking-tighter ${data.remaining <= 0 ? 'text-rose-500' : 'text-gray-900'}`}>
                    {data.remaining}
                  </h2>
                  <span className="text-xs text-gray-400 font-black uppercase tracking-widest italic">days left</span>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-gray-50 pt-5 mt-auto">
                  <div>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-2">Yearly Grant</p>
                    <p className="text-sm font-black text-gray-900">{data.total} <span className="text-gray-300 text-[10px]">FIXED</span></p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-2">Consumed</p>
                    <p className="text-sm font-black text-gray-900">{data.used}</p>
                  </div>
                </div>
              </div>
            );
          })}
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
                      onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 font-bold uppercase text-[10px] tracking-wider">End Date</label>
                    <input
                      type="date"
                      required
                      className={`w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-100 ${formData.endDate && formData.startDate && new Date(formData.endDate) < new Date(formData.startDate) ? "border-red-500 bg-red-50" : ""
                        }`}
                      value={formData.endDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    />
                    {formData.endDate && formData.startDate && new Date(formData.endDate) < new Date(formData.startDate) && (
                      <p className="text-[10px] text-red-500 font-bold uppercase mt-1">End date cannot be before start date</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 font-bold uppercase text-[10px] tracking-wider">Application Type</label>
                    <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100">
                      {["Full Day", "Half Day"].map(t => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => {
                            const newType = t;
                            setFormData(prev => ({ 
                              ...prev, 
                              type: newType, 
                              endDate: newType === 'Half Day' ? prev.startDate : prev.endDate 
                            }));
                          }}
                          className={`flex-1 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${formData.type === t ? "bg-white text-indigo-600 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  {formData.type === "Half Day" && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 font-bold uppercase text-[10px] tracking-wider">Select Half</label>
                      <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100">
                        {["First Half", "Second Half"].map(h => (
                          <button
                            key={h}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, half: h }))}
                            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-tight rounded-lg transition-all ${formData.half === h ? "bg-white text-amber-600 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
                          >
                            {h}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Smart Duration Display */}
                <div className={`p-4 rounded-xl flex items-center justify-between transition-all duration-300 ${calculatedDays > 0
                  ? (formData.leaveType && calculatedDays > (balance[formData.leaveType]?.remaining || 0) ? "bg-red-50 text-red-800" : "bg-blue-50 text-blue-800")
                  : "bg-gray-50 text-gray-400"
                  }`}>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/50 rounded-lg"><Clock size={18} /></div>
                    <div>
                      <p className="text-[10px] font-bold uppercase opacity-60">Calculated Duration</p>
                      <p className="font-bold text-lg">{calculatedDays > 0 ? `${calculatedDays} Working Days` : "Select valid dates"}</p>
                    </div>
                  </div>
                  {formData.leaveType && calculatedDays > 0 && calculatedDays > (balance[formData.leaveType]?.remaining || 0) && (
                    <div className="text-xs font-bold text-red-500 uppercase flex flex-col items-end">
                      <span>Insufficient Balance</span>
                      <span className="opacity-70">Available: {balance[formData.leaveType]?.remaining}</span>
                    </div>
                  )}
                  {calculatedDays > 0 && !formData.leaveType && (
                    <div className="text-[10px] font-black uppercase text-blue-500 tracking-tighter animate-pulse">
                      Select Leave Category
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
                    onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 font-bold uppercase text-[10px] tracking-wider">
                    Attachment {formData.leaveType === "Sick Leave" ? <span className="text-red-500">*</span> : "(Optional)"}
                  </label>
                  <div className="relative group">
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => setFormData(prev => ({ ...prev, attachment: e.target.files[0] }))}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-100 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition duration-300"
                    />
                    {formData.leaveType === "Sick Leave" && !formData.attachment && (
                      <p className="text-[10px] text-amber-600 font-bold uppercase mt-1 flex items-center gap-1">
                        <AlertCircle size={10} /> Attachment is required for Sick Leave
                      </p>
                    )}
                  </div>
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
                <div key={item._id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center">
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
                    {item.attachment && (
                      <div className="mt-2">
                        <a
                          href={`http://localhost:5000/uploads/${item.attachment}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-bold text-blue-600 hover:text-blue-800 transition flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-lg w-fit"
                        >
                          <Briefcase size={12} /> View Attachment
                        </a>
                      </div>
                    )}
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
              onDateClick={(date, holiday, personal, teams) => {
                setFormData(prev => ({ ...prev, type: 'Full Day', half: 'First Half' }));
                setDateDetail({ show: true, date, holiday, personal, teams });
              }}
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
                  <div className="pt-4 border-t border-gray-100 space-y-4">
                    <div className="bg-indigo-50/50 p-6 rounded-3xl space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <PlusCircle size={18} className="text-indigo-600" />
                        <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight">Quick Apply</h4>
                      </div>

                      <div className="space-y-3">
                        <select
                          className="w-full px-4 py-3 bg-white rounded-xl border border-indigo-100 font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-100"
                          value={formData.leaveType}
                          onChange={(e) => setFormData(prev => ({ ...prev, leaveType: e.target.value }))}
                        >
                          <option value="">Select Leave Type</option>
                          {Object.keys(balance).map(type => (
                            <option key={type} value={type}>{type} ({balance[type]?.remaining || 0} left)</option>
                          ))}
                        </select>

                        <textarea
                          className="w-full px-4 py-3 bg-white rounded-xl border border-indigo-100 font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-100 h-20 resize-none"
                          placeholder="Why are you taking leave?"
                          value={formData.reason}
                          onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                        />

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                            Attachment {formData.leaveType === "Sick Leave" ? <span className="text-red-500">*</span> : "(Optional)"}
                          </label>
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            onChange={(e) => setFormData(prev => ({ ...prev, attachment: e.target.files[0] }))}
                            className="w-full px-4 py-2 bg-white rounded-xl border border-indigo-100 font-bold text-xs outline-none focus:ring-2 focus:ring-indigo-100 file:mr-3 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-[10px] file:font-black file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100 transition duration-300"
                          />
                          {formData.leaveType === "Sick Leave" && !formData.attachment && (
                            <p className="text-[9px] text-amber-600 font-bold uppercase mt-1 flex items-center gap-1">
                              <AlertCircle size={10} /> Attachment is required for Sick Leave
                            </p>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Type</label>
                            <div className="flex bg-white p-1 rounded-xl border border-indigo-100">
                              {["Full Day", "Half Day"].map(t => (
                                <button
                                  key={t}
                                  type="button"
                                  onClick={() => setFormData(prev => ({ ...prev, type: t }))}
                                  className={`flex-1 py-1.5 text-[9px] font-black uppercase tracking-tight rounded-lg transition-all ${formData.type === t ? "bg-indigo-600 text-white shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
                                >
                                  {t}
                                </button>
                              ))}
                            </div>
                          </div>
                          {formData.type === "Half Day" && (
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Half</label>
                              <div className="flex bg-white p-1 rounded-xl border border-indigo-100">
                                {["First Half", "Second Half"].map(h => (
                                  <button
                                    key={h}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, half: h })}
                                    className={`flex-1 py-1.5 text-[9px] font-black uppercase tracking-tight rounded-lg transition-all ${formData.half === h ? "bg-indigo-600 text-white shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
                                  >
                                    {h[0]}st
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {(!formData.leaveType || (balance[formData.leaveType]?.remaining < (formData.type === 'Half Day' ? 0.5 : 1))) && (
                          <div className="p-3 bg-amber-50 text-amber-700 rounded-xl text-[10px] font-bold flex items-center gap-2">
                            <AlertCircle size={14} />
                            {!formData.leaveType ? "Select a leave type to continue" : "Insufficient balance"}
                          </div>
                        )}

                        <button
                          disabled={!formData.leaveType || balance[formData.leaveType]?.remaining < 1 || submitLoading}
                          onClick={async () => {
                            if (formData.leaveType === "Sick Leave" && !formData.attachment) {
                              return toast.error("Attachment is required for Sick Leave.");
                            }
                            try {
                              setSubmitLoading(true);
                              const uId = admin?._id || admin?.id;
                              const submitData = new FormData();
                              submitData.append("employeeId", uId);
                              submitData.append("leaveType", formData.leaveType);
                              submitData.append("startDate", format(dateDetail.date, "yyyy-MM-dd"));
                              submitData.append("endDate", format(dateDetail.date, "yyyy-MM-dd"));
                              submitData.append("employeeComment", formData.reason);
                              submitData.append("isHalfDay", formData.type === 'Half Day');
                              if (formData.type === 'Half Day') {
                                submitData.append("half", formData.half);
                              }
                              if (formData.attachment) {
                                submitData.append("attachment", formData.attachment);
                              }
                              
                              await axios.post("/leaveapplication", submitData, {
                                headers: { "Content-Type": "multipart/form-data" }
                              });
                              toast.success("Leave applied successfully!");
                              setDateDetail({ ...dateDetail, show: false });
                              fetchData();
                              setActiveTab("history");
                            } catch (e) {
                              toast.error(e.response?.data?.message || "Failed to apply");
                            } finally {
                              setSubmitLoading(false);
                            }
                          }}
                          className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-100 hover:shadow-2xl hover:-translate-y-1 transition-all disabled:opacity-50 disabled:grayscale disabled:hover:translate-y-0"
                        >
                          {submitLoading ? "Processing..." : "Submit Application"}
                        </button>
                      </div>
                    </div>
                  </div>
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