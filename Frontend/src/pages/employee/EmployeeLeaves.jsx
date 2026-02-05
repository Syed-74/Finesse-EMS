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
const SmartCalendar = ({ holidays, myLeaves, teamLeaves }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Grid padding
  const startDay = getDay(monthStart); // 0 = Sun
  const empties = Array(startDay).fill(null);

  const isHoliday = (date) => holidays.find(h => isSameDay(new Date(h.holidayDate), date));
  const isMyLeave = (date) => myLeaves.find(l => isWithinInterval(date, { start: parseISO(l.startDate), end: parseISO(l.endDate) }));
  const isTeamLeave = (date) => teamLeaves.find(l => isWithinInterval(date, { start: parseISO(l.start), end: parseISO(l.end) }));

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
       <div className="flex justify-between items-center mb-6">
         <h3 className="font-bold text-lg text-gray-800">{format(currentDate, "MMMM yyyy")}</h3>
         <div className="flex gap-2">
           <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronLeft size={18}/></button>
           <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronRight size={18}/></button>
         </div>
       </div>

       <div className="grid grid-cols-7 gap-1 mb-2 text-center text-xs font-semibold text-gray-400 uppercase">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => <div key={d}>{d}</div>)}
       </div>

       <div className="grid grid-cols-7 gap-1">
          {empties.map((_, i) => <div key={`empty-${i}`} className="h-24 bg-gray-50/30 rounded-lg" />)}
          {daysInMonth.map(day => {
             const holiday = isHoliday(day);
             const myLeave = isMyLeave(day);
             const teamLeave = isTeamLeave(day);
             const weekend = isWeekend(day);
             
             return (
               <div key={day.toString()} className={`h-24 p-2 rounded-lg border text-sm relative group overflow-hidden transition ${
                 weekend ? "bg-gray-100 text-gray-400 border-gray-100" : "bg-white border-gray-100 hover:border-blue-200"
               } ${holiday ? "bg-red-50 border-red-100" : ""}`}>
                 
                 <span className={`font-medium ${isSameDay(day, new Date()) ? "bg-blue-600 text-white w-6 h-6 flex items-center justify-center rounded-full" : ""}`}>
                    {format(day, "d")}
                 </span>

                 {/* Indicators */}
                 <div className="mt-1 space-y-1">
                    {holiday && (
                      <div className="text-[10px] leading-tight font-medium text-red-600 bg-red-100 px-1 py-0.5 rounded truncate">
                        {holiday.holidayName}
                      </div>
                    )}
                    {myLeave && (
                       <div className={`text-[10px] leading-tight font-medium px-1 py-0.5 rounded truncate ${
                         myLeave.status === 'Approved' ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                       }`}>
                         {myLeave.leaveType}
                       </div>
                    )}
                    {teamLeave && !myLeave && (
                        <div className="text-[10px] leading-tight font-medium text-blue-600 bg-blue-50 px-1 py-0.5 rounded truncate" title={teamLeave.title}>
                          {teamLeave.title.split(' (')[0]}
                        </div>
                    )}
                 </div>
               </div>
             )
          })}
       </div>
       
       <div className="mt-4 flex gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1"><div className="w-3 h-3 bg-red-100 rounded"></div> Holiday</div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-100 rounded"></div> My Approved Leave</div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-50 rounded"></div> Team Leave</div>
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

  const fetchData = async () => {
    if (!admin?._id) return;
    try {
      setLoading(true);
      const [userRes, calendarRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/leavemanagement/employee/${admin._id}`),
        axios.get(`http://localhost:5000/api/leavemanagement/calendar`)
      ]);
      
      setBalance(userRes.data.balance);
      setHistory(userRes.data.leaves);
      setHolidays(userRes.data.holidays);
      setTeamLeaves(calendarRes.data.filter(e => e.employeeId !== admin._id)); // Remove self
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
    
    setSubmitLoading(true);
    try {
      await axios.post(`http://localhost:5000/api/leavemanagement/apply/${admin._id}`, {
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
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${
                    activeTab === tab.id ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  <tab.icon size={16} /> {tab.label}
                </button>
              ))}
           </div>
        </div>

        {/* Balance Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
           {Object.entries(balance.leaveTypeWiseBalance).map(([key, val]) => (
             <div key={key} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group">
                {/* Decorative BG */}
                <div className={`absolute top-0 right-0 w-24 h-24 transform translate-x-8 -translate-y-8 rounded-full opacity-10 transition group-hover:scale-110 ${
                   key === 'Casual' ? 'bg-blue-500' : key === 'Sick' ? 'bg-red-500' : 'bg-green-500'
                }`} />
                
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">{key} Leave</p>
                <div className="flex items-baseline gap-1">
                   <h2 className="text-4xl font-bold text-gray-800">{val}</h2>
                   <span className="text-sm text-gray-400">days left</span>
                </div>
             </div>
           ))}
        </div>

        {/* Content Area */}
        <div className="transition-all duration-300">
           {activeTab === "apply" && (
             <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-2xl mx-auto">
                <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                   <PlusCircle className="text-blue-500"/> New Leave Request
                </h3>
                <form onSubmit={handleApply} className="space-y-6">
                   <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Leave Type</label>
                      <div className="grid grid-cols-3 gap-3">
                         {["Casual", "Sick", "Paid"].map(type => (
                           <button
                             key={type}
                             type="button"
                             onClick={() => setFormData({...formData, leaveType: type})}
                             className={`py-3 rounded-xl border text-sm font-medium transition ${
                               formData.leaveType === type 
                               ? "border-blue-500 bg-blue-50 text-blue-700" 
                               : "border-gray-200 hover:bg-gray-50 text-gray-600"
                             }`}
                           >
                             {type}
                           </button>
                         ))}
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Start Date</label>
                        <input 
                           type="date" 
                           required
                           className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-100"
                           value={formData.startDate}
                           onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">End Date</label>
                        <input 
                           type="date" 
                           required 
                           className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-100"
                           value={formData.endDate}
                           onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                        />
                      </div>
                   </div>

                   {/* Smart Duration Display */}
                   <div className={`p-4 rounded-xl flex items-center justify-between ${calculatedDays > 0 ? "bg-blue-50 text-blue-800" : "bg-gray-50 text-gray-500"}`}>
                      <div className="flex items-center gap-3">
                         <div className="p-2 bg-white/50 rounded-lg"><Clock size={18}/></div>
                         <div>
                            <p className="text-xs font-bold uppercase opacity-60">Duration</p>
                            <p className="font-semibold">{calculatedDays > 0 ? `${calculatedDays} Days` : "Select valid dates"}</p>
                         </div>
                      </div>
                      <div className="text-xs text-right opacity-70 max-w-[150px]">
                         Weekends & Holidays are automatically excluded.
                      </div>
                   </div>

                   <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Reason</label>
                      <textarea
                        required
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-100 h-32 resize-none"
                        placeholder="Why do you need leave?"
                        value={formData.reason}
                        onChange={(e) => setFormData({...formData, reason: e.target.value})}
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
                           <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              item.status === 'Approved' ? "bg-green-100 text-green-700" :
                              item.status === 'Rejected' ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
                           }`}>
                             {item.status}
                           </span>
                           <span className="font-semibold text-gray-900">{item.leaveType} Leave</span>
                        </div> 
                        <div className="text-sm text-gray-500 flex items-center gap-2">
                           <CalendarIcon size={14}/> 
                           {format(parseISO(item.startDate), "MMM d")} - {format(parseISO(item.endDate), "MMM d, yyyy")}
                           <span className="w-1 h-1 bg-gray-300 rounded-full"/>
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
             <SmartCalendar holidays={holidays} myLeaves={history} teamLeaves={teamLeaves} />
           )}
        </div>

      </div>
    </div>
  );
};

export default EmployeeLeaves;