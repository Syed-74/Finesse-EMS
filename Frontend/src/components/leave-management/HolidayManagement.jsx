import React, { useEffect, useState } from "react";
import axios from "axios";
import { format, parseISO } from "date-fns";
import { toast } from "react-hot-toast";
import { Calendar, Plus, Trash2, Save, Gift, Info, X, AlertTriangle } from "lucide-react";

const HolidayManagement = () => {
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Confirmation Modal State
    const [confirmModal, setConfirmModal] = useState({
        show: false,
        index: null,
        holidayName: ""
    });

    const [newHoliday, setNewHoliday] = useState({
        holidayName: "",
        holidayDate: "",
        holidayType: "Public",
        isOptional: false
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const res = await axios.get("http://localhost:5000/api/leavemanagement/settings");
            setSettings(res.data.data);
        } catch (error) {
            console.error("Error fetching settings:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddHoliday = async (e) => {
        e.preventDefault();
        if (!settings) return;

        const updatedHolidays = [...(settings.holidays || []), newHoliday];
        const updatedSettings = { ...settings, holidays: updatedHolidays };

        try {
            setSaving(true);
            await axios.post("http://localhost:5000/api/leavemanagement/settings", updatedSettings);
            setSettings(updatedSettings);
            setNewHoliday({ holidayName: "", holidayDate: "", holidayType: "Public", isOptional: false });
            toast.success("Holiday added successfully!");
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to add holiday.");
        } finally {
            setSaving(false);
        }
    };

    const requestDelete = (h, index) => {
        setConfirmModal({
            show: true,
            index,
            holidayName: h.holidayName
        });
    };

    const handleDeleteHoliday = async () => {
        const { index } = confirmModal;
        const updatedHolidays = settings.holidays.filter((_, i) => i !== index);
        const updatedSettings = { ...settings, holidays: updatedHolidays };

        try {
            setSaving(true);
            await axios.post("http://localhost:5000/api/leavemanagement/settings", updatedSettings);
            setSettings(updatedSettings);
            setConfirmModal({ ...confirmModal, show: false });
            toast.success("Holiday deleted successfully!");
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to delete holiday.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-10 text-center text-orange-500 font-bold uppercase tracking-widest animate-pulse">Loading Holidays...</div>;

    return (
        <div className="max-w-5xl mx-auto space-y-10">
            {/* Add New Holiday Card */}
            <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
                <div className="p-8 border-b border-gray-50 bg-gradient-to-br from-orange-50/30 to-white flex items-center gap-4">
                    <div className="p-3 bg-orange-500 text-white rounded-2xl shadow-lg shadow-orange-100">
                        <Plus size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-gray-900 tracking-tight">Add New Holiday</h3>
                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mt-1">Register a special date in the calendar</p>
                    </div>
                </div>

                <form onSubmit={handleAddHoliday} className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-2">Holiday Name</label>
                            <input
                                type="text"
                                required
                                placeholder="e.g. New Year"
                                className="w-full px-5 py-4 bg-gray-50 rounded-2xl border border-gray-100 outline-none focus:ring-2 focus:ring-orange-100 font-bold text-sm text-gray-700 transition-all"
                                value={newHoliday.holidayName}
                                onChange={(e) => setNewHoliday({ ...newHoliday, holidayName: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-2">Date</label>
                            <div className="relative">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                                <input
                                    type="date"
                                    required
                                    className="w-full pl-12 pr-5 py-4 bg-gray-50 rounded-2xl border border-gray-100 outline-none focus:ring-2 focus:ring-orange-100 font-bold text-sm text-gray-700 transition-all"
                                    value={newHoliday.holidayDate}
                                    onChange={(e) => setNewHoliday({ ...newHoliday, holidayDate: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-2">Type</label>
                            <select
                                className="w-full px-5 py-4 bg-gray-50 rounded-2xl border border-gray-100 outline-none focus:ring-2 focus:ring-orange-100 font-bold text-sm text-gray-700 appearance-none transition-all"
                                value={newHoliday.holidayType}
                                onChange={(e) => setNewHoliday({ ...newHoliday, holidayType: e.target.value })}
                            >
                                <option value="Public">Public Holiday</option>
                                <option value="Optional">Optional / Floating</option>
                                <option value="Restricted">Restricted Holiday</option>
                            </select>
                        </div>
                        <button
                            type="submit"
                            disabled={saving}
                            className="py-4 bg-gray-900 text-white rounded-2xl font-black text-sm shadow-xl shadow-gray-200 hover:shadow-2xl hover:-translate-y-1 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            <Plus size={20} /> Add Holiday
                        </button>
                    </div>
                </form>
            </div>

            {/* Holidays List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {settings?.holidays?.map((h, index) => (
                    <div key={index} className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-xl hover:shadow-gray-100 transition-all duration-300 group relative overflow-hidden">
                        {/* Background Icon */}
                        <Gift className="absolute -bottom-4 -right-4 text-gray-50 w-24 h-24 group-hover:scale-110 transition-transform" />

                        <div className="flex justify-between items-start mb-6 relative z-10">
                            <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl">
                                <Calendar size={20} />
                            </div>
                            <button
                                onClick={() => requestDelete(h, index)}
                                className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>

                        <div className="relative z-10">
                            <h4 className="text-lg font-black text-gray-900 truncate mb-1">{h.holidayName}</h4>
                            <p className="text-orange-600 font-black text-xs uppercase tracking-widest flex items-center gap-1.5 mb-4">
                                <Calendar size={12} /> {format(parseISO(h.holidayDate), "EEEE, d MMM yyyy")}
                            </p>

                            <div className="flex items-center justify-between pt-4 border-t border-gray-50 mt-4">
                                <span className="px-3 py-1 bg-gray-50 text-gray-500 text-[10px] font-black uppercase tracking-wider rounded-lg">
                                    {h.holidayType}
                                </span>
                                {h.isOptional && (
                                    <div className="flex items-center gap-1 text-blue-600 text-[10px] font-black uppercase">
                                        <Info size={12} /> Optional
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {(!settings?.holidays || settings.holidays.length === 0) && (
                    <div className="col-span-full py-20 bg-gray-50/50 border-2 border-dashed border-gray-100 rounded-[2.5rem] flex flex-col items-center justify-center text-gray-400 gap-3">
                        <Gift size={48} className="opacity-20" />
                        <p className="font-bold uppercase text-xs tracking-widest italic">No holidays scheduled for this cycle.</p>
                    </div>
                )}
            </div>

            {/* DELETE CONFIRMATION MODAL */}
            {confirmModal.show && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md flex items-center justify-center p-4 z-[60] animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 text-center space-y-6">
                            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-[2rem] flex items-center justify-center mx-auto shadow-sm">
                                <AlertTriangle size={40} />
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-gray-900">Delete Holiday?</h3>
                                <p className="text-gray-500 text-sm">
                                    Are you sure you want to remove <span className="font-bold text-gray-900 text-indigo-600">"{confirmModal.holidayName}"</span> from the calendar?
                                </p>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    onClick={() => setConfirmModal({ ...confirmModal, show: false })}
                                    className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-black text-sm hover:bg-gray-200 transition-all"
                                    disabled={saving}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteHoliday}
                                    disabled={saving}
                                    className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-red-100 hover:bg-red-700 hover:-translate-y-1 transition-all"
                                >
                                    {saving ? "Deleting..." : "Confirm Delete"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HolidayManagement;
