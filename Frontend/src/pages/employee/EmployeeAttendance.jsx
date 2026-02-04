import React, { useState, useRef, useEffect } from "react";
import Webcam from "react-webcam";
import axios from "axios";
import { Camera, MapPin, CheckCircle, AlertCircle, RefreshCw, Smartphone } from "lucide-react";
import { useAuth } from "../../AuthContext/AuthContext";

const EmployeeAttendance = () => {
  const { admin } = useAuth();
  const webcamRef = useRef(null);

  // States
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState("");
  const [capturedImage, setCapturedImage] = useState(null);
  const [status, setStatus] = useState("idle"); // idle, punching, success, error
  const [records, setRecords] = useState([]);
  const [message, setMessage] = useState("");

  // 📍 Fetch Location
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
          console.error("Location error", error);
          if (error.code === 1) setLocationError("Permission denied. Please enable GPS.");
          else setLocationError("Unable to retrieve location.");
        }
      );
    } else {
      setLocationError("Geolocation is not supported by your browser.");
    }

    fetchAttendance();
  }, []);

  // 📝 Fetch Attendance History
  const fetchAttendance = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/attendance/my-attendance", {
        withCredentials: true
      });
      setRecords(res.data);
    } catch (err) {
      console.error("Failed to fetch records", err);
    }
  };

  // 📸 Capture Selfie
  const capture = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    setCapturedImage(imageSrc);
  };

  // 🚀 Handle Punch In
  const handlePunchIn = async () => {
    if (!capturedImage) return alert("Please capture a selfie first!");
    if (!location) return alert("Waiting for location... please enable GPS");

    setLoading(true);
    setStatus("punching");

    try {
      // Convert Base64 to Blob
      const res = await fetch(capturedImage);
      const blob = await res.blob();
      const file = new File([blob], "selfie.jpg", { type: "image/jpeg" });

      const formData = new FormData();
      formData.append("selfie", file);
      formData.append("location", JSON.stringify(location));
      formData.append("workLocation", "Office"); // Could be dynamic

      await axios.post("http://localhost:5000/api/attendance/punch-in", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });

      setStatus("success");
      setMessage("✅ Punch In Successful!");
      fetchAttendance();
    } catch (err) {
      console.error(err);
      setStatus("error");
      setMessage(err.response?.data?.message || "Punch In Failed");
    } finally {
      setLoading(false);
    }
  };

  // 🚪 Handle Punch Out
  const handlePunchOut = async () => {
    setLoading(true);
    try {
      await axios.post("http://localhost:5000/api/attendance/punch-out", {}, { withCredentials: true });
      setStatus("success");
      setMessage("👋 Punch Out Successful!");
      fetchAttendance();
    } catch (err) {
      console.error(err);
      setStatus("error");
      setMessage(err.response?.data?.message || "Punch Out Failed");
    } finally {
      setLoading(false);
    }
  };

  const todayRecord = records.find(r => new Date(r.date).toDateString() === new Date().toDateString());

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h1 className="text-2xl font-bold text-gray-800">Attendance</h1>
           <p className="text-gray-500 text-sm">Mark your daily presence securely</p>
        </div>
        <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium">
          <MapPin className="w-4 h-4" />
          {location ? "Location Detected" : "Detecting Location..."}
        </div>
      </div>

      {locationError && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3 border border-red-100">
           <AlertCircle className="w-5 h-5"/>
           <span>{locationError}</span>
        </div>
      )}

      {/* Main ACTION Card */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        <div className="p-6 md:p-8 grid md:grid-cols-2 gap-8">
            
            {/* Left: Camera / Status */}
            <div className="space-y-4">
               {!todayRecord?.inTime ? (
                  /* PUNCH IN FLOW */
                  <div className="relative rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center group">
                      {!capturedImage ? (
                        <Webcam
                          audio={false}
                          ref={webcamRef}
                          screenshotFormat="image/jpeg"
                          className="w-full h-full object-cover"
                          videoConstraints={{ facingMode: "user" }} // Mobile Front Camera
                        />
                      ) : (
                        <img src={capturedImage} alt="Selfie" className="w-full h-full object-cover" />
                      )}

                      {/* Snap Button */}
                      {!capturedImage && (
                        <button 
                          onClick={capture}
                          className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 p-3 rounded-full shadow-lg hover:scale-110 transition-transform text-gray-800"
                        >
                          <Camera className="w-6 h-6"/>
                        </button>
                      )}

                      {/* Retake Button */}
                      {capturedImage && (
                        <button 
                          onClick={() => setCapturedImage(null)}
                          className="absolute top-4 right-4 bg-white/80 p-2 rounded-full shadow hover:bg-white transition-colors"
                        >
                          <RefreshCw className="w-4 h-4"/>
                        </button>
                      )}
                  </div>
               ) : (
                  /* ALREADY PUNCHED IN STATE */
                  <div className="h-full min-h-[200px] flex flex-col items-center justify-center bg-green-50 rounded-xl border border-green-100 text-green-700 space-y-2">
                     <CheckCircle className="w-12 h-12 mb-2"/>
                     <h3 className="text-xl font-bold">You are Checked In</h3>
                     <p className="text-sm opacity-80">Since {todayRecord.inTime}</p>
                     {!todayRecord.outTime && (
                       <div className="text-xs bg-green-200 px-3 py-1 rounded-full animate-pulse">
                         On Duty
                       </div>
                     )}
                  </div>
               )}
            </div>

            {/* Right: Actions */}
            <div className="flex flex-col justify-center space-y-6">
                
                {status !== 'idle' && status !== 'punching' && (
                  <div className={`p-4 rounded-xl text-center font-medium ${status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                     {message}
                  </div>
                )}

                {!todayRecord ? (
                   /* PUNCH IN BUTTON */
                   <div className="space-y-4">
                      <div className="p-4 bg-gray-50 rounded-xl space-y-2">
                         <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                            <Smartphone className="w-4 h-4"/> Device Check
                         </h4>
                         <div className="text-xs text-gray-500 grid gap-1">
                            <span className="flex justify-between"><span>GPS:</span> <span className={location ? "text-green-600" : "text-red-500"}>{location ? "Active" : "Waiting..."}</span></span>
                            <span className="flex justify-between"><span>Camera:</span> <span className={capturedImage ? "text-green-600" : "text-orange-500"}>{capturedImage ? "Captured" : "Ready"}</span></span>
                         </div>
                      </div>

                      <button
                        onClick={handlePunchIn}
                        disabled={loading || !location || !capturedImage}
                        className={`w-full py-3.5 rounded-xl font-bold text-lg shadow-lg shadow-blue-200 transition-all active:scale-95 ${
                           loading || !location || !capturedImage ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                         {loading ? "Verifying..." : "PUNCH IN"}
                      </button>
                   </div>
                ) : !todayRecord.outTime ? (
                   /* PUNCH OUT BUTTON */
                   <div className="space-y-4">
                      <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl">
                          <p className="text-sm text-orange-800 text-center">Don't forget to punch out before leaving.</p>
                      </div>
                      <button
                        onClick={handlePunchOut}
                        disabled={loading}
                        className="w-full py-3.5 rounded-xl font-bold text-lg bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-200 transition-all active:scale-95"
                      >
                         {loading ? "Processing..." : "PUNCH OUT"}
                      </button>
                   </div>
                ) : (
                   /* COMPLETED STATE */
                   <div className="text-center space-y-2 p-6 bg-gray-50 rounded-xl">
                       <h3 className="text-lg font-bold text-gray-800">Day Completed ✅</h3>
                       <p className="text-sm text-gray-500">
                         Total Work: <span className="font-mono text-gray-900">{Math.floor(todayRecord.totalWorkingMinutes / 60)}h {todayRecord.totalWorkingMinutes % 60}m</span>
                       </p>
                   </div>
                )}
            </div>
        </div>
      </div>

      {/* Recent History Table (Mobile Responsive) */}
      <h3 className="text-lg font-bold text-gray-800 mt-8">Recent History</h3>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
         <div className="overflow-x-auto">
           <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                 <tr>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">In Time</th>
                    <th className="px-6 py-4">Out Time</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Work Hours</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                 {records.map((rec) => (
                    <tr key={rec._id} className="hover:bg-gray-50 transition-colors">
                       <td className="px-6 py-4 font-medium text-gray-900">{new Date(rec.date).toLocaleDateString()}</td>
                       <td className="px-6 py-4 text-green-600 font-semibold">{rec.inTime}</td>
                       <td className="px-6 py-4 text-red-500">{rec.outTime || '--:--'}</td>
                       <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${rec.status === 'PRESENT' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                             {rec.status}
                          </span>
                       </td>
                       <td className="px-6 py-4 text-gray-500">
                          {rec.totalWorkingMinutes ? `${Math.floor(rec.totalWorkingMinutes/60)}h ${rec.totalWorkingMinutes%60}m` : '-'}
                       </td>
                    </tr>
                 ))}
                 {records.length === 0 && (
                    <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-400">No attendance records found.</td></tr>
                 )}
              </tbody>
           </table>
         </div>
      </div>

    </div>
  );
};

export default EmployeeAttendance;