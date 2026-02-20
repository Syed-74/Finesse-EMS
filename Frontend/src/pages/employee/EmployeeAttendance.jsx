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
  Loader2,
  CalendarDays,
  Timer,
  Activity
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

  const token = localStorage.getItem("token");
  const employeeWorkLocation = admin?.workLocation?.toUpperCase?.() || "OFFICE";
  const isHybrid = employeeWorkLocation === "HYBRID";

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
  }, []);

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
    if (!capturedImage) return alert("Please capture a selfie first.");
    if (!location) return alert("Waiting for GPS location — please enable GPS.");

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
      formData.append("workLocation", isHybrid ? selectedWorkLocation : "Office");

      await axios.post("http://localhost:5000/api/attendance/punch-in", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setStatus("success");
      setMessage("Punch In Successful");
      fetchAttendance();
    } catch (err) {
      console.error(err);
      setStatus("error");
      const errData = err.response?.data;
      // Friendly message for IP restriction
      if (err.response?.status === 403 && errData?.code === "OFFICE_IP_REQUIRED") {
        setMessage(errData.message);
      } else {
        setMessage(errData?.message || "Punch In Failed. Please try again.");
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
      setMessage(err.response?.data?.message || "Punch Out Failed.");
    } finally {
      setLoading(false);
    }
  };

  const todayRecord = records.find(
    (r) => new Date(r.date).toDateString() === new Date().toDateString()
  );

  const alreadyPunchedIn = !!todayRecord?.inTime;
  const alreadyPunchedOut = !!todayRecord?.outTime;

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
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border 
            ${employeeWorkLocation === "OFFICE" ? "bg-indigo-50 text-indigo-700 border-indigo-200" :
              employeeWorkLocation === "REMOTE" ? "bg-blue-50 text-blue-700 border-blue-200" :
                "bg-amber-50 text-amber-700 border-amber-200"}`}>
            {employeeWorkLocation === "OFFICE" ? <Building2 className="w-4 h-4" /> :
              employeeWorkLocation === "REMOTE" ? <Globe className="w-4 h-4" /> :
                <Activity className="w-4 h-4" />}
            {employeeWorkLocation} Mode
          </div>
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

                      {/* Hybrid: Work Location Selector */}
                      {isHybrid && !alreadyPunchedIn && (
                        <div>
                          <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">
                            Where are you working from today?
                          </label>
                          <div className="relative">
                            <select
                              value={selectedWorkLocation}
                              onChange={(e) => setSelectedWorkLocation(e.target.value)}
                              className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-4 py-3 pr-10 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                            >
                              <option value="Office">🏢 Office</option>
                              <option value="Remote">🏠 Remote / WFH</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                          </div>
                          {selectedWorkLocation === "Office" && (
                            <p className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 font-medium flex items-center gap-2">
                              <Shield className="w-3.5 h-3.5 shrink-0" />
                              IP validation required for office attendance
                            </p>
                          )}
                        </div>
                      )}

                      {/* Action Buttons */}
                      {!alreadyPunchedIn ? (
                        <button
                          onClick={handlePunchIn}
                          disabled={loading || !location || !capturedImage}
                          className={`w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2.5 shadow-lg
                            ${loading || !location || !capturedImage
                              ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                              : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 active:scale-95"}`}
                        >
                          {loading
                            ? <><Loader2 className="w-5 h-5 animate-spin" /> Verifying...</>
                            : <><LogIn className="w-5 h-5" /> Punch In</>}
                        </button>
                      ) : (
                        <button
                          onClick={handlePunchOut}
                          disabled={loading}
                          className="w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-200 transition-all active:scale-95 flex items-center justify-center gap-2.5"
                        >
                          {loading
                            ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
                            : <><LogOut className="w-5 h-5" /> Punch Out</>}
                        </button>
                      )}
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
                  { label: "Present", value: records.filter(r => r.status === "PRESENT").length, color: "text-emerald-600", bg: "bg-emerald-50" },
                  { label: "Late", value: records.filter(r => r.lateByMinutes > 0).length, color: "text-amber-600", bg: "bg-amber-50" },
                  { label: "Leave", value: records.filter(r => r.status === "LEAVE").length, color: "text-blue-600", bg: "bg-blue-50" },
                  { label: "Absent", value: records.filter(r => r.status === "ABSENT").length, color: "text-rose-600", bg: "bg-rose-50" },
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
                  {["Date", "In Time", "Out Time", "Duration", "Work Location", "Network", "Status"].map((h) => (
                    <th key={h} className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {records.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-16 text-center">
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
                            {rec.inTime}
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
                            ${rec.status === "PRESENT" && rec.lateByMinutes > 0
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : rec.status === "PRESENT"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : rec.status === "ABSENT"
                                  ? "bg-red-50 text-red-700 border-red-200"
                                  : rec.status === "LEAVE"
                                    ? "bg-blue-50 text-blue-700 border-blue-200"
                                    : "bg-slate-100 text-slate-600 border-slate-200"
                            }`}>
                            {rec.status === "PRESENT" && rec.lateByMinutes > 0 ? "LATE" : rec.status}
                          </span>
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
    </div>
  );
};

export default EmployeeAttendance;