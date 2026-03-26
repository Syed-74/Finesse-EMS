import React, { useState, useRef, useEffect } from "react";
import Webcam from "react-webcam";
import axios from "axios";
import {
  Camera,
  MapPin,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Clock,
  Wifi,
  WifiOff,
  Building2,
  Globe,
  Shield,
  ChevronDown,
  LogIn,
  LogOut,
  Timer,
  Activity,
  Coffee,
  History,
  Send,
  Loader2,
  CalendarDays
} from "lucide-react";
import { useAuth } from "../../AuthContext/AuthContext";

const EmployeeAttendance = () => {
  const { admin } = useAuth();
  const webcamRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState("");
  const [capturedImage, setCapturedImage] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | punching | success | error
  const [records, setRecords] = useState([]);
  const [message, setMessage] = useState("");
  const [selectedWorkLocation, setSelectedWorkLocation] = useState("Office");
  const [initialLoading, setInitialLoading] = useState(true);
  const [shift, setShift] = useState(null);
  const [todayLeave, setTodayLeave] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [profile, setProfile] = useState(null);

  // 🕒 Break & Regularize state
  const [breakLoading, setBreakLoading] = useState(false);
  const [showRegularizeModal, setShowRegularizeModal] = useState(false);
  const [selectedRecordForRegularize, setSelectedRecordForRegularize] = useState(null);
  const [regularizeReason, setRegularizeReason] = useState("");
  const [requestedInTime, setRequestedInTime] = useState("");
  const [requestedOutTime, setRequestedOutTime] = useState("");

  const token = localStorage.getItem("token");

  // Determine Effective Mode based on LIVE profile data
  const employeeWorkLocation = profile?.workLocation?.toUpperCase?.() || "OFFICE";
  const isHybrid = employeeWorkLocation === "HYBRID";
  const todayDayName = new Date().toLocaleString("en-US", { weekday: "long" }).toUpperCase();
  const isTodayOfficeDay = (profile?.officeDays || []).some(d => d.toUpperCase() === todayDayName);
  const effectiveMode = isHybrid ? (isTodayOfficeDay ? "OFFICE" : "REMOTE") : employeeWorkLocation;

  // Fetch Location on mount
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setLocationError("");
        },
        (error) => {
          if (error.code === 1) setLocationError("Permission denied. Please enable GPS.");
          else setLocationError("Unable to retrieve location.");
        }
      );
    } else {
      setLocationError("Geolocation is not supported by your browser.");
    }
    fetchAttendance();
    fetchShift();
    fetchTodayLeave();
    fetchProfile();

    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/employees/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile(res.data);
    } catch (err) {
      console.error("Failed to fetch profile", err);
    }
  };

  const fetchTodayLeave = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/leaveapplication/today", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTodayLeave(res.data.data);
    } catch (err) {
      console.error("Failed to fetch today's leave", err);
    }
  };

  const fetchShift = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/shifts/my-shift", {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Shift Data:", res.data);
      setShift(res.data);
    } catch (err) {
      console.error("Failed to fetch shift", err);
    }
  };

  const fetchAttendance = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/attendance/my-attendance", {
        withCredentials: true,
        headers: { Authorization: `Bearer ${token}` },
      });
      setRecords(res.data);
    } catch (err) {
      console.error("Failed to fetch records", err);
    } finally {
      setInitialLoading(false);
    }
  };

  const capture = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    setCapturedImage(imageSrc);
  };

  const handlePunchIn = async () => {
    if (!shift) return alert("No shift assigned. Please contact Admin.");
    if (!capturedImage) return alert("Please capture a selfie first.");
    if (!location) return alert("Waiting for GPS location — please enable GPS.");

    // --- 🛠️ Robust Shift Discovery Logic ---
    const parseStartTime = (timeStr) => {
      if (!timeStr) return { h: 9, m: 0 };
      const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
      if (!match) return { h: 9, m: 0 };
      let h = parseInt(match[1]);
      const m = parseInt(match[2]);
      const ampm = match[3]?.toUpperCase();
      if (ampm === "PM" && h < 12) h += 12;
      if (ampm === "AM" && h === 12) h = 0;
      return { h, m };
    };

    const getShiftInstance = (baseDate, startTimeStr) => {
      const { h, m } = parseStartTime(startTimeStr);
      const d = new Date(baseDate);
      d.setHours(h, m, 0, 0);
      return d;
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const candidates = [
      getShiftInstance(yesterday, shift.startTime),
      getShiftInstance(today, shift.startTime)
    ];

    let bestShiftStart = null;
    const EARLY_WINDOW_MS = 30 * 60 * 1000;
    const LATE_WINDOW_MS = 12 * 60 * 60 * 1000;

    for (const start of candidates) {
      const diff = currentTime - start;
      console.log(`Client Check - Candidate: ${start.toLocaleString()} | Diff: ${Math.floor(diff/60000)} mins`);
      if (diff >= -EARLY_WINDOW_MS && diff <= LATE_WINDOW_MS) {
        bestShiftStart = start;
        console.log(`Client Match: ${start.toLocaleString()}`);
        break;
      }
    }

    if (!bestShiftStart) {
      console.log("Client - No matching shift instance found.");
      const nextShift = getShiftInstance(today, shift.startTime);
      const allowedFrom = new Date(nextShift.getTime() - EARLY_WINDOW_MS);
      if (currentTime < allowedFrom) {
        return alert(`Too early. Punch-in starts at ${allowedFrom.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
      }
      return alert(`Outside valid shift window. Shift starts at ${shift.startTime}.`);
    }

    const effectiveShiftStart = bestShiftStart;

    // Half Day Leave Check
    if (todayLeave && todayLeave.type === "Half Day") {
      const shiftDurationMinutes = shift.duration ? (shift.duration * 60) : 540;
      const midTime = new Date(effectiveShiftStart.getTime() + (shiftDurationMinutes / 2) * 60 * 1000);
      
      if (todayLeave.half === "First Half" && currentTime < midTime) {
        return alert(`First Half Leave Approved. Refresh and punch in after ${midTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
      }
    }


    setLoading(true);
    setStatus("punching");
    setMessage("");

    try {
      const res = await fetch(capturedImage);
      const blob = await res.blob();
      const file = new File([blob], "selfie.jpg", { type: "image/jpeg" });

      const formData = new FormData();
      formData.append("selfie", file);
      formData.append("location", JSON.stringify(location));
      formData.append("workLocation", effectiveMode === "OFFICE" ? "Office" : "Remote");

      await axios.post("http://localhost:5000/api/attendance/punch-in", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setStatus("success");
      setMessage("Punch In Successful");
      fetchAttendance();
    } catch (err) {
      console.error("Punch-In API Error:", err);
      setStatus("error");
      const errData = err.response?.data;
      if (err.response?.status === 403 && errData?.code === "OFFICE_IP_REQUIRED") {
        setMessage(errData.message);
      } else if (errData?.message) {
        setMessage(errData.message);
      } else {
        setMessage("Punch In Failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePunchOut = async () => {
    setLoading(true);
    try {
      await axios.post(
        "http://localhost:5000/api/attendance/punch-out",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStatus("success");
      setMessage("Punch Out Successful");
      fetchAttendance();
    } catch (err) {
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  const handleStartBreak = async (type = "Lunch") => {
    setBreakLoading(true);
    try {
      await axios.post(
        "http://localhost:5000/api/attendance/start-break",
        { type },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(`${type} started`);
      fetchAttendance();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to start break");
    } finally {
      setBreakLoading(false);
    }
  };

  const handleEndBreak = async () => {
    setBreakLoading(true);
    try {
      await axios.post(
        "http://localhost:5000/api/attendance/end-break",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage("Break ended");
      fetchAttendance();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to end break");
    } finally {
      setBreakLoading(false);
    }
  };

  const handleRequestRegularization = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(
        "http://localhost:5000/api/attendance/regularize",
        {
          attendanceId: selectedRecordForRegularize._id,
          requestedInTime,
          requestedOutTime,
          reason: regularizeReason
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Regularization request submitted");
      setShowRegularizeModal(false);
      fetchAttendance();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to submit request");
    } finally {
      setLoading(false);
    }
  };

  const todayRecord = records.find(
    (r) => new Date(r.date).toDateString() === new Date().toDateString()
  );

  const alreadyPunchedIn = !!todayRecord?.inTime;
  const alreadyPunchedOut = !!todayRecord?.outTime;
  const activeBreak = todayRecord?.breaks?.find(b => !b.endTime);
  const isOnBreak = !!activeBreak;

  const getNetworkBadge = (rec) => {
    const nt = rec?.deviceInfo?.networkType;
    if (nt === "Office") return { icon: "🟢", label: "Office Network", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    if (nt === "Unauthorized") return { icon: "🔴", label: "Unauthorized", cls: "bg-red-50 text-red-700 border-red-200" };
    return { icon: "🔵", label: "Remote Network", cls: "bg-blue-50 text-blue-700 border-blue-200" };
  };

  const formatDuration = (mins) => {
    if (!mins) return "—";
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  if (admin?.role !== "employee") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-4 text-slate-400 p-8 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500" />
        <h2 className="text-xl font-black text-slate-900">Access Restricted</h2>
        <p className="max-w-md text-sm font-medium">This terminal is for employees only. Admins can manage shifts and view records from the Admin Panel.</p>
      </div>
    );
  }

  if (initialLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-4 text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
        <p className="text-xs font-black uppercase tracking-widest text-slate-500">Loading Attendance Portal...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ─── Page Header ─── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Attendance Terminal</h1>
            <p className="text-sm text-slate-500 mt-0.5 font-medium">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            </p>
          </div>

          {/* Work Mode Badge */}
          <div className="flex flex-col items-end gap-1">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border 
              ${effectiveMode === "OFFICE" ? "bg-indigo-50 text-indigo-700 border-indigo-200" :
                "bg-blue-50 text-blue-700 border-blue-200"}`}>
              {effectiveMode === "OFFICE" ? <Building2 className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
              {effectiveMode} Mode
            </div>
            {isHybrid && (
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-2 rounded-full border border-amber-100">
                Hybrid Schedule
              </span>
            )}
          </div>

          {/* Shift Badge */}
          {shift && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border bg-indigo-600 text-white border-indigo-700 shadow-lg shadow-indigo-100">
              <Clock className="w-4 h-4" />
              {shift.shiftType} ({shift.startTime} - {shift.endTime})
            </div>
          )}
        </div>

        {/* ─── Status Alert Banner ─── */}
        {status !== "idle" && status !== "punching" && message && (
          <div className={`flex items-start gap-3 p-4 rounded-xl border text-sm font-semibold
            ${status === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-red-50 text-red-800 border-red-200"}`}>
            {status === "success"
              ? <CheckCircle className="w-5 h-5 mt-0.5 shrink-0" />
              : <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />}
            <span>{message}</span>
          </div>
        )}

        {/* ─── Today's Leave / Rule Warning ─── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {todayLeave && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-800 text-sm font-bold">
              <CalendarDays className="w-5 h-5 shrink-0" />
              Today: {todayLeave.type} ({todayLeave.half || "Approved"})
            </div>
          )}
          <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 text-sm font-bold shadow-lg">
            <Shield className="w-5 h-5 shrink-0 text-indigo-400" />
            Requirement: Please punch in within 4 hours of shift start to avoid Auto-Absent.
          </div>
        </div>

        {/* ─── GPS Error Banner ─── */}
        {locationError && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm font-medium">
            <WifiOff className="w-5 h-5 shrink-0" />
            {locationError}
          </div>
        )}

        {/* ─── Main Grid ─── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* ── LEFT: Punch Card ── */}
          <div className="xl:col-span-2">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

              {/* Card Header */}
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-slate-900 rounded-xl text-white">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="font-black text-slate-900 text-sm uppercase tracking-wide">
                      Secure Punch Terminal
                    </h2>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">Selfie + GPS + IP Verified</p>
                  </div>
                </div>

                {/* GPS Indicator */}
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border
                  ${location ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                  <MapPin className="w-3.5 h-3.5" />
                  {location ? "GPS Active" : "Detecting..."}
                </div>
              </div>

              <div className="p-6 lg:p-8">
                {alreadyPunchedIn && alreadyPunchedOut ? (
                  /* ── Day Completed State ── */
                  <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                    <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
                      <CheckCircle className="w-10 h-10 text-emerald-600" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900">Day Completed</h3>
                    <p className="text-slate-500 text-sm">
                      You worked <span className="font-black text-slate-800">{formatDuration(todayRecord.totalWorkingMinutes)}</span> today
                    </p>
                    <div className="flex items-center gap-6 mt-4 bg-slate-50 border border-slate-200 rounded-xl px-8 py-4">
                      <div className="text-center">
                        <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-1">In</p>
                        <p className="text-lg font-black text-emerald-600 font-mono">{todayRecord.inTime}</p>
                      </div>
                      <div className="text-slate-300 text-2xl font-thin">→</div>
                      <div className="text-center">
                        <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-1">Out</p>
                        <p className="text-lg font-black text-rose-600 font-mono">{todayRecord.outTime}</p>
                      </div>
                    </div>
                  </div>

                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

                    {/* ── Camera Panel ── */}
                    <div className="space-y-4">
                      <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Identity Verification</h3>

                      {!alreadyPunchedIn ? (
                        <div className="relative rounded-xl overflow-hidden bg-slate-900 aspect-video border border-slate-700">
                          {!capturedImage ? (
                            <>
                              <Webcam
                                audio={false}
                                ref={webcamRef}
                                screenshotFormat="image/jpeg"
                                className="w-full h-full object-cover"
                                videoConstraints={{ facingMode: "user" }}
                              />
                              {/* Snap Button */}
                              <button
                                onClick={capture}
                                className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white text-slate-900 p-3.5 rounded-full shadow-lg hover:scale-110 transition-transform flex items-center gap-2 text-xs font-black uppercase tracking-wide px-5"
                              >
                                <Camera className="w-5 h-5" /> Capture
                              </button>
                              {/* Guide overlay */}
                              <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-white/20 m-8 rounded-xl" />
                            </>
                          ) : (
                            <>
                              <img src={capturedImage} alt="Captured selfie" className="w-full h-full object-cover" />
                              <button
                                onClick={() => setCapturedImage(null)}
                                className="absolute top-3 right-3 bg-black/60 text-white p-2 rounded-full hover:bg-black/80 transition-colors backdrop-blur-sm"
                              >
                                <RefreshCw className="w-4 h-4" />
                              </button>
                              <div className="absolute bottom-3 left-3 bg-emerald-500 text-white text-xs font-black px-3 py-1.5 rounded-full flex items-center gap-1.5">
                                <CheckCircle className="w-3.5 h-3.5" /> Captured
                              </div>
                            </>
                          )}
                        </div>
                      ) : (
                        <div className="aspect-video rounded-xl bg-emerald-50 border-2 border-emerald-200 flex flex-col items-center justify-center gap-3">
                          <CheckCircle className="w-12 h-12 text-emerald-500" />
                          <p className="text-sm font-black text-emerald-700">Checked In Since {todayRecord.inTime}</p>
                          <div className="text-xs bg-emerald-200 text-emerald-800 px-3 py-1 rounded-full animate-pulse font-bold">On Duty</div>
                        </div>
                      )}
                    </div>

                    {/* ── Action Panel ── */}
                    <div className="space-y-5 flex flex-col justify-between h-full">

                      {/* System Checks */}
                      <div>
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Pre-Punch Checklist</h3>
                        <div className="space-y-2">
                          {[
                            { label: "GPS Signal", ok: !!location, note: location ? `${location.latitude?.toFixed(3)}, ${location.longitude?.toFixed(3)}` : "Waiting..." },
                            { label: "Camera Selfie", ok: !!capturedImage || alreadyPunchedIn, note: capturedImage || alreadyPunchedIn ? "Verified" : "Not captured" },
                            { label: "Network", ok: true, note: "Connected" },
                          ].map((check, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                              <div className="flex items-center gap-2.5">
                                <div className={`w-2 h-2 rounded-full ${check.ok ? "bg-emerald-500" : "bg-amber-400"}`} />
                                <span className="text-sm font-semibold text-slate-700">{check.label}</span>
                              </div>
                              <span className={`text-xs font-bold ${check.ok ? "text-emerald-600" : "text-amber-600"}`}>{check.note}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Automatic Work Mode Status */}
                      <div className={`p-4 rounded-xl border-2 transition-all ${effectiveMode === "OFFICE" ? "bg-indigo-50 border-indigo-100" : "bg-blue-50 border-blue-100"}`}>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Current Work Mode</h3>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${effectiveMode === "OFFICE" ? "bg-indigo-600 text-white" : "bg-blue-600 text-white"}`}>
                            {effectiveMode === "OFFICE" ? "ONSITE" : "REMOTE"}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${effectiveMode === "OFFICE" ? "bg-white text-indigo-600 shadow-sm" : "bg-white text-blue-600 shadow-sm"}`}>
                            {effectiveMode === "OFFICE" ? <Building2 className="w-5 h-5" /> : <Globe className="w-5 h-5" />}
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-800">
                              {effectiveMode === "OFFICE" ? "Office Network Required" : "Working from Anywhere"}
                            </p>
                            <p className="text-[10px] font-medium text-slate-500">
                              {isHybrid ? `Based on your Hybrid schedule for ${todayDayName}` : `Standard ${employeeWorkLocation} policy enforced`}
                            </p>
                          </div>
                        </div>
                      </div>


                      {/* Action Buttons */}
                      <div className="flex flex-col gap-3">
                        {!alreadyPunchedIn ? (
                          <button
                            onClick={handlePunchIn}
                            disabled={loading || !location || !capturedImage || (todayLeave && todayLeave.type === "Full Day")}
                            className={`w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2.5 shadow-lg
                              ${loading || !location || !capturedImage || (todayLeave && todayLeave.type === "Full Day")
                                ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                                : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 active:scale-95"}`}
                          >
                            {loading
                              ? <><Loader2 className="w-5 h-5 animate-spin" /> Verifying...</>
                              : todayLeave && todayLeave.type === "Full Day"
                                ? "On Approved Leave"
                                : <><LogIn className="w-5 h-5" /> Punch In</>}
                          </button>
                        ) : alreadyPunchedIn && !alreadyPunchedOut ? (
                          <div className="space-y-3">
                            {/* Break Controls */}
                            {!isOnBreak ? (
                              <button
                                onClick={() => handleStartBreak("Lunch")}
                                disabled={breakLoading}
                                className="w-full py-3.5 rounded-xl font-black text-sm uppercase tracking-widest bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-100 transition-all flex items-center justify-center gap-2.5"
                              >
                                {breakLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Coffee className="w-5 h-5" /> Start Break</>}
                              </button>
                            ) : (
                              <button
                                onClick={handleEndBreak}
                                disabled={breakLoading}
                                className="w-full py-3.5 rounded-xl font-black text-sm uppercase tracking-widest bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2.5"
                              >
                                {breakLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Timer className="w-5 h-5 animate-pulse" /> End Break ({activeBreak.startTime})</>}
                              </button>
                            )}

                            <button
                              onClick={handlePunchOut}
                              disabled={loading || isOnBreak}
                              className={`w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2.5
                                ${loading || isOnBreak
                                  ? "bg-slate-100 text-slate-300 cursor-not-allowed"
                                  : "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200 active:scale-95"}`}
                            >
                              {loading
                                ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
                                : <><LogOut className="w-5 h-5" /> Punch Out</>}
                            </button>
                          </div>
                        ) : (
                          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center">
                            <p className="text-emerald-700 font-black uppercase text-xs tracking-widest">Attendance Recorded</p>
                            <p className="text-xs text-emerald-600 mt-1">Great job! See you tomorrow.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── RIGHT: Today's Summary ── */}
          <div className="space-y-4">

            {/* Today Card */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="font-black text-slate-900 text-xs uppercase tracking-widest flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-indigo-500" /> Today's Summary
                </h3>
              </div>
              <div className="p-5 space-y-4">
                {todayRecord ? (
                  <>
                    <div className="flex items-center justify-between py-3 border-b border-slate-50">
                      <div className="flex items-center gap-2 text-sm text-slate-600 font-semibold">
                        <LogIn className="w-4 h-4 text-emerald-500" /> Punch In
                      </div>
                      <span className="font-black text-slate-900 font-mono">{todayRecord.inTime}</span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-slate-50">
                      <div className="flex items-center gap-2 text-sm text-slate-600 font-semibold">
                        <LogOut className="w-4 h-4 text-rose-500" /> Punch Out
                      </div>
                      <span className={`font-black font-mono ${todayRecord.outTime ? "text-slate-900" : "text-slate-300"}`}>
                        {todayRecord.outTime || "On Duty"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-slate-50">
                      <div className="flex items-center gap-2 text-sm text-slate-600 font-semibold">
                        <Timer className="w-4 h-4 text-blue-500" /> Duration
                      </div>
                      <span className="font-black text-slate-900">{formatDuration(todayRecord.totalWorkingMinutes)}</span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-slate-50">
                      <div className="flex items-center gap-2 text-sm text-slate-600 font-semibold">
                        <Coffee className="w-4 h-4 text-amber-500" /> Break Total
                      </div>
                      <span className="font-black text-slate-900">{todayRecord.totalBreakMinutes || 0} min</span>
                    </div>
                    <div className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-2 text-sm text-slate-600 font-semibold">
                        <Wifi className="w-4 h-4 text-purple-500" /> Network
                      </div>
                      {(() => {
                        const badge = getNetworkBadge(todayRecord);
                        return (
                          <span className={`text-xs font-black px-2.5 py-1 rounded-lg border ${badge.cls}`}>
                            {badge.icon} {badge.label}
                          </span>
                        );
                      })()}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Clock className="w-10 h-10 mx-auto text-slate-200 mb-3" />
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No punch record yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Monthly Stats */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="font-black text-slate-900 text-xs uppercase tracking-widest flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-500" /> This Month
                </h3>
              </div>
              <div className="p-5 grid grid-cols-2 gap-3">
                {[
                  { label: "Present", value: records.filter(r => r.status === "Present").length, color: "text-emerald-600", bg: "bg-emerald-50" },
                  { label: "Late", value: records.filter(r => r.status === "Late").length, color: "text-amber-600", bg: "bg-amber-50" },
                  { label: "Half Day", value: records.filter(r => r.status === "Half Day").length, color: "text-indigo-600", bg: "bg-indigo-50" },
                  { label: "Absent", value: records.filter(r => r.status === "Absent").length, color: "text-rose-600", bg: "bg-rose-50" },
                ].map((stat, i) => (
                  <div key={i} className={`${stat.bg} rounded-xl p-3 text-center`}>
                    <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ─── Attendance History Table ─── */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h2 className="font-black text-slate-900 text-sm uppercase tracking-widest flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-500" /> Attendance History
            </h2>
            <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
              {records.length} Records
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {["Date", "In Time", "Out Time", "Duration", "Work Location", "Network", "Status", "Actions"].map((h) => (
                    <th key={h} className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {records.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-16 text-center">
                      <Activity className="w-10 h-10 mx-auto text-slate-200 mb-3" />
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No attendance records found</p>
                    </td>
                  </tr>
                ) : (
                  records.map((rec) => {
                    const badge = getNetworkBadge(rec);
                    return (
                      <tr key={rec._id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="px-6 py-4 font-bold text-slate-900">
                          {new Date(rec.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-lg font-mono font-bold text-xs">
                            {rec.inTime || "—"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {rec.outTime
                            ? <span className="text-rose-700 bg-rose-50 border border-rose-100 px-2 py-1 rounded-lg font-mono font-bold text-xs">{rec.outTime}</span>
                            : <span className="text-slate-300 font-mono text-xs font-medium italic">On Duty</span>}
                        </td>
                        <td className="px-6 py-4 font-black text-slate-700">
                          {formatDuration(rec.totalWorkingMinutes)}
                          {rec.lateByMinutes > 0 && (
                            <span className="ml-2 text-[10px] text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-md font-bold">+{rec.lateByMinutes}m Late</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-bold text-slate-600">{rec.workLocation || "Office"}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${badge.cls}`}>
                            {badge.icon} {badge.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border-2
                            ${rec.status === "Present"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : rec.status === "Late"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : rec.status === "Absent"
                                  ? "bg-red-50 text-red-700 border-red-200"
                                  : rec.status === "Leave"
                                    ? "bg-blue-50 text-blue-700 border-blue-200"
                                    : rec.status === "Half Day"
                                      ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                                      : "bg-slate-100 text-slate-600 border-slate-200"
                            }`}>
                            {rec.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => {
                              setSelectedRecordForRegularize(rec);
                              setShowRegularizeModal(true);
                              setRequestedInTime(rec.inTime || "");
                              setRequestedOutTime(rec.outTime || "");
                            }}
                            className="text-indigo-600 hover:text-indigo-800 font-black text-[10px] uppercase tracking-widest flex items-center gap-1.5 p-2 bg-indigo-50 rounded-lg transition-colors border border-indigo-100 shadow-sm"
                          >
                            <History className="w-3.5 h-3.5" /> Correct
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* ── Regularization Modal ── */}
      {showRegularizeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-500" /> Request Correction
              </h3>
              <button onClick={() => setShowRegularizeModal(false)} className="text-slate-400 hover:text-slate-600 font-black italic">X</button>
            </div>
            <form onSubmit={handleRequestRegularization} className="p-6 space-y-4">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                Updating Record: <span className="text-indigo-600">{new Date(selectedRecordForRegularize.date).toLocaleDateString()}</span>
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5">New In Time</label>
                  <input
                    type="time"
                    className="w-full border border-slate-200 rounded-xl p-3 text-sm font-mono font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={requestedInTime}
                    onChange={(e) => setRequestedInTime(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5">New Out Time</label>
                  <input
                    type="time"
                    className="w-full border border-slate-200 rounded-xl p-3 text-sm font-mono font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={requestedOutTime}
                    onChange={(e) => setRequestedOutTime(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5">Reason for Request</label>
                <textarea
                  required
                  rows="3"
                  className="w-full border border-slate-200 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                  placeholder="e.g., Forgot to punch out, Device battery died..."
                  value={regularizeReason}
                  onChange={(e) => setRegularizeReason(e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRegularizeModal(false)}
                  className="flex-1 py-3 text-slate-500 font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 bg-indigo-600 text-white font-black uppercase text-[10px] tracking-widest rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-3.5 h-3.5" /> Submit</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeAttendance;
