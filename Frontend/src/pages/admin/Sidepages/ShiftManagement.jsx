import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "../../../api/axios";
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
  Edit3,
  X
} from "lucide-react";
import { showSuccess, showError, showWarning } from "../../../utils/toast";
import { useConfirm } from "../../../context/ConfirmContext";

const ShiftManagement = () => {
  const [shifts, setShifts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const { confirmAction } = useConfirm();

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
        axios.get("/shifts/all", {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get("/employees", {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setShifts(shiftsRes.data);
      setEmployees(employeesRes.data);
    } catch (err) {
      console.error("Failed to fetch data", err);
      showError("Critical: Failed to synchronize shift rosters.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateShift = async (e) => {
    e.preventDefault();

    // 🚀 Prevent duplicate shift
    const existingShift = shifts.find(
      (s) => s.shiftType === newShift.shiftType
    );

    if (!editingShiftId && existingShift) {
      return showWarning(`${newShift.shiftType} shift configuration already exists.`);
    }

    try {
      if (editingShiftId) {
        await axios.put(
          `/shifts/${editingShiftId}`,
          newShift,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        showSuccess("Shift configuration updated.");
      } else {
        await axios.post(
          "/shifts",
          newShift,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        showSuccess("New shift successfully registered.");
      }

      setShowShiftModal(false);
      setEditingShiftId(null);
      fetchData();

    } catch (err) {
      showError(err.response?.data?.message || "Shift operation failed.");
    }
  };

  const handleDeleteShift = async (id) => {
    confirmAction({
      title: "Remove Shift Configuration",
      message: "Are you sure you want to delete this shift? This will impact attendance logs and employee rosters linked to this shift.",
      type: "danger",
      onConfirm: async () => {
        try {
          await axios.delete(`/shifts/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          showSuccess("Shift removed from system.");
          fetchData();
        } catch (err) {
          showError("Failed to decommission shift.");
        }
      }
    });
  };

  const handleAssignShift = async (e) => {
    e.preventDefault();
    try {
      if (!assignment.employeeId || !assignment.shiftId) {
        return showWarning("Selection incomplete: Employee and Shift required.");
      }
      await axios.post("/shifts/assign", assignment, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showSuccess("Employee successfully assigned to shift.");
      setShowAssignModal(false);
      fetchData();
    } catch (err) {
      showError(err.response?.data?.message || "Shift assignment failed.");
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
    <div className="p-6 lg:p-10 space-y-10 max-w-[1800px] mx-auto">

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
                    <div className={`w-3 h-3 rounded-full ${shift.shiftType === 'Morning' ? 'bg-amber-400' :
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
                        <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border-2 ${emp.shift === 'Morning' ? 'bg-amber-50 text-amber-600 border-amber-100' :
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
      <AnimatePresence>
        {showShiftModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowShiftModal(false)}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[2rem] shadow-[0_30px_70px_-10px_rgba(0,0,0,0.2)] border border-slate-100 z-50 p-8"
            >
              {/* Close Button */}
              <button
                onClick={() => setShowShiftModal(false)}
                className="p-2 hover:bg-slate-50 text-slate-400 rounded-xl transition-all active:scale-95 absolute top-6 right-6"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Modal Header */}
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100/50">
                  <Clock className="w-6 h-6" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest block mb-1 text-indigo-600">
                    Shift Scheduler
                  </span>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none">
                    {editingShiftId ? 'Update Shift' : 'Create New Shift'}
                  </h3>
                </div>
              </div>

              <form onSubmit={handleCreateShift} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Shift Type</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
                    value={newShift.shiftType}
                    onChange={(e) => setNewShift({ ...newShift, shiftType: e.target.value })}
                  >
                    {["Morning", "Afternoon", "Night"].map(type => {
                      const exists = shifts.some(s => s.shiftType === type);
                      return (
                        <option key={type} value={type} disabled={exists && !editingShiftId}>
                          {type} Shift {exists ? "(Already Created)" : ""}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Start Time</label>
                    <input
                      type="time"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all font-mono"
                      value={newShift.startTime}
                      onChange={(e) => setNewShift({ ...newShift, startTime: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">End Time</label>
                    <input
                      type="time"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all font-mono"
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
                    className="w-full bg-slate-100 border border-slate-200 rounded-2xl p-4 text-sm font-bold outline-none transition-all cursor-not-allowed text-slate-500"
                    value={newShift.duration}
                    readOnly
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowShiftModal(false)}
                    className="flex-1 px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl transition-all active:scale-95 text-xs uppercase tracking-wider"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3.5 bg-[#0f172a] shadow-slate-900/10 hover:bg-[#1e293b] text-white font-bold rounded-2xl transition-all active:scale-95 text-xs uppercase tracking-wider"
                  >
                    Confirm
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Assign Shift Modal */}
      <AnimatePresence>
        {showAssignModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAssignModal(false)}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[2rem] shadow-[0_30px_70px_-10px_rgba(0,0,0,0.2)] border border-slate-100 z-50 p-8"
            >
              {/* Close Button */}
              <button
                onClick={() => setShowAssignModal(false)}
                className="p-2 hover:bg-slate-50 text-slate-400 rounded-xl transition-all active:scale-95 absolute top-6 right-6"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Modal Header */}
              <div className="flex items-center gap-4 mb-6 ">
                <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100/50">
                  <UserPlus className="w-6 h-6" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest block mb-1 text-indigo-600">
                    Roster Assignment
                  </span>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none">
                    Assign Roster
                  </h3>
                </div>
              </div>

              <form onSubmit={handleAssignShift} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Select Employee</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
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
                    className="flex-1 px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl transition-all active:scale-95 text-xs uppercase tracking-wider"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3.5 bg-[#0f172a] shadow-slate-900/10 hover:bg-[#1e293b] text-white font-bold rounded-2xl transition-all active:scale-95 text-xs uppercase tracking-wider"
                  >
                    Assign Shift
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default ShiftManagement;
