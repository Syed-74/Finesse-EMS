import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Clock,
  Plus,
  Users,
  CheckCircle,
  AlertCircle,
  Loader2,
  Trash2,
  UserPlus,
  ShieldCheck,
  Calendar,
  ArrowRight,
  Edit3
} from "lucide-react";
import toast from "react-hot-toast";

const ShiftManagement = () => {
  const [shifts, setShifts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  
  const [newShift, setNewShift] = useState({
    shiftType: "Morning",
    startTime: "09:00",
    endTime: "18:00",
    duration: 9
  });

  const [editingShiftId, setEditingShiftId] = useState(null);

  const [assignment, setAssignment] = useState({
    employeeId: "",
    shiftId: ""
  });

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (newShift.startTime && newShift.endTime) {
      const [startH, startM] = newShift.startTime.split(":").map(Number);
      const [endH, endM] = newShift.endTime.split(":").map(Number);
      let diff = (endH * 60 + endM) - (startH * 60 + startM);
      if (diff < 0) diff += 24 * 60; // Handle overnight shifts
      setNewShift(prev => ({ ...prev, duration: (diff / 60).toFixed(1) }));
    }
  }, [newShift.startTime, newShift.endTime]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [shiftsRes, employeesRes] = await Promise.all([
        axios.get("http://localhost:5000/api/shifts/all", {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get("http://localhost:5000/api/employees", {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setShifts(shiftsRes.data);
      setEmployees(employeesRes.data);
    } catch (err) {
      console.error("Failed to fetch data", err);
      toast.error("Failed to load shift data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateShift = async (e) => {
    e.preventDefault();
    try {
      if (editingShiftId) {
        await axios.put(`http://localhost:5000/api/shifts/${editingShiftId}`, newShift, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success("Shift updated successfully");
      } else {
        await axios.post("http://localhost:5000/api/shifts", newShift, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success("Shift created successfully");
      }
      setShowShiftModal(false);
      setEditingShiftId(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to process shift");
    }
  };

  const handleDeleteShift = async (id) => {
    if (!window.confirm("Are you sure you want to delete this shift? This may affect attendance records.")) return;
    try {
      await axios.delete(`http://localhost:5000/api/shifts/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Shift deleted");
      fetchData();
    } catch (err) {
      toast.error("Failed to delete shift");
    }
  };

  const handleAssignShift = async (e) => {
    e.preventDefault();
    try {
      if (!assignment.employeeId || !assignment.shiftId) {
        return toast.error("Please select both employee and shift");
      }
      await axios.post("http://localhost:5000/api/shifts/assign", assignment, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Shift assigned successfully");
      setShowAssignModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to assign shift");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Syncing Shift Data...</p>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 space-y-10 max-w-7xl mx-auto">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Shift Management</h1>
          <p className="text-slate-500 font-medium mt-1">Configure workspace hours and assign employee rosters.</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => setShowAssignModal(true)}
            className="flex items-center gap-2.5 px-6 py-3.5 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
          >
            <UserPlus className="w-4 h-4" /> Assign Shift
          </button>
          <button 
            onClick={() => {
                setEditingShiftId(null);
                setNewShift({ shiftType: "Morning", startTime: "09:00", endTime: "18:00", duration: 9 });
                setShowShiftModal(true);
            }}
            className="flex items-center gap-2.5 px-6 py-3.5 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
          >
            <Plus className="w-4 h-4" /> Create Shift
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-10">
        
        {/* Shifts List */}
        <div className="lg:col-span-5 space-y-6">
          <div className="flex items-center gap-3 px-2">
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
              <Clock className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Active Shifts</h2>
          </div>

          <div className="grid gap-4">
            {shifts.map((shift) => (
              <div key={shift._id} className="group bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all hover:border-indigo-100">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      shift.shiftType === 'Morning' ? 'bg-amber-400' : 
                      shift.shiftType === 'Afternoon' ? 'bg-blue-400' : 'bg-slate-800'
                    }`} />
                    <span className="font-black text-slate-900 uppercase tracking-widest text-xs">{shift.shiftType} Shift</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                        onClick={() => {
                            setEditingShiftId(shift._id);
                            setNewShift({ shiftType: shift.shiftType, startTime: shift.startTime, endTime: shift.endTime, duration: shift.duration });
                            setShowShiftModal(true);
                        }}
                        className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                        title="Edit Shift"
                    >
                        <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button 
                        onClick={() => handleDeleteShift(shift._id)}
                        className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                        title="Delete Shift"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-3 py-1 bg-slate-50 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-100 italic">
                        {shift.duration} Hours
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="text-center flex-1">
                    <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Starts</span>
                    <span className="text-lg font-black text-slate-900 font-mono italic">{shift.startTime}</span>
                  </div>
                  <div className="w-8 h-px bg-slate-200" />
                  <div className="text-center flex-1">
                    <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ends</span>
                    <span className="text-lg font-black text-slate-900 font-mono italic">{shift.endTime}</span>
                  </div>
                </div>
              </div>
            ))}

            {shifts.length === 0 && (
              <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] p-12 text-center">
                <p className="text-slate-400 font-bold text-sm">No shifts configured yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Employee Roster */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center gap-3 px-2">
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <Users className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Employee Roster</h2>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Department</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Assigned Shift</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {employees.map((emp) => (
                    <tr key={emp._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-indigo-50 text-indigo-700 rounded-xl flex items-center justify-center font-black text-xs uppercase shadow-sm">
                            {emp.firstName?.[0]}{emp.lastName?.[0]}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{emp.firstName} {emp.lastName}</p>
                            <p className="text-xs text-slate-400 font-medium">{emp.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-sm font-bold text-slate-600">{emp.department}</td>
                      <td className="px-8 py-5 text-right">
                        <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border-2 ${
                          emp.shift === 'Morning' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                          emp.shift === 'Afternoon' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                          emp.shift === 'Night' ? 'bg-slate-900 text-white border-slate-800' :
                          'bg-slate-50 text-slate-400 border-slate-100'
                        }`}>
                          {emp.shift || 'Not Assigned'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

      {/* Create Shift Modal */}
      {showShiftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white rounded-[3rem] p-10 w-full max-w-md shadow-2xl relative border border-white/20">
            <h3 className="text-2xl font-black text-slate-900 mb-8 tracking-tight">{editingShiftId ? 'Update Shift' : 'Create New Shift'}</h3>
            <form onSubmit={handleCreateShift} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Shift Type</label>
                <select 
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold focus:border-indigo-400 outline-none transition-all appearance-none"
                  value={newShift.shiftType}
                  onChange={(e) => setNewShift({ ...newShift, shiftType: e.target.value })}
                >
                  <option value="Morning">Morning Shift</option>
                  <option value="Afternoon">Afternoon Shift</option>
                  <option value="Night">Night Shift</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Start Time</label>
                  <input 
                    type="time" 
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold focus:border-indigo-400 outline-none transition-all font-mono"
                    value={newShift.startTime}
                    onChange={(e) => setNewShift({ ...newShift, startTime: e.target.value })}
                    required 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">End Time</label>
                  <input 
                    type="time" 
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold focus:border-indigo-400 outline-none transition-all font-mono"
                    value={newShift.endTime}
                    onChange={(e) => setNewShift({ ...newShift, endTime: e.target.value })}
                    required 
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Total Duration (Hours)</label>
                <input 
                  type="number" 
                  step="0.1"
                  className="w-full bg-slate-100 border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold outline-none transition-all mr-4 cursor-not-allowed"
                  value={newShift.duration}
                  readOnly
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowShiftModal(false)}
                  className="flex-1 px-8 py-4 text-slate-500 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 rounded-2xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-8 py-4 bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
                >
                  {editingShiftId ? 'Update Shift' : 'Create Shift'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Shift Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white rounded-[3rem] p-10 w-full max-w-md shadow-2xl relative border border-white/20">
            <h3 className="text-2xl font-black text-slate-900 mb-8 tracking-tight">Assign Roster</h3>
            <form onSubmit={handleAssignShift} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Select Employee</label>
                <select 
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold focus:border-indigo-400 outline-none transition-all appearance-none"
                  value={assignment.employeeId}
                  onChange={(e) => setAssignment({ ...assignment, employeeId: e.target.value })}
                  required
                >
                  <option value="">Choose Employee...</option>
                  {employees.map(emp => (
                    <option key={emp._id} value={emp._id}>{emp.firstName} {emp.lastName} ({emp.department})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Assign Shift</label>
                <select 
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold focus:border-indigo-400 outline-none transition-all appearance-none"
                  value={assignment.shiftId}
                  onChange={(e) => setAssignment({ ...assignment, shiftId: e.target.value })}
                  required
                >
                  <option value="">Choose Shift...</option>
                  {shifts.map(shift => (
                    <option key={shift._id} value={shift._id}>{shift.shiftType} ({shift.startTime} - {shift.endTime})</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowAssignModal(false)}
                  className="flex-1 px-8 py-4 text-slate-500 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 rounded-2xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-8 py-4 bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all"
                >
                  Assign Shift
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ShiftManagement;
