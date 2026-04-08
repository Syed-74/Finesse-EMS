import React, { useEffect, useState } from "react";
// import axios from "axios";
import axios from "../../api/axios";
import { toast } from "react-hot-toast";
import {
    Save,
    ShieldCheck,
    Clock,
    Calendar,
    AlertCircle,
    Plus,
    Trash2,
    Briefcase,
    ChevronRight,
    Info
} from "lucide-react";

const getIconForCategory = (name) => {
    const n = name.toLowerCase();
    if (n.includes("sick")) return "🌡️";
    if (n.includes("casual")) return "🏖️";
    if (n.includes("paid") || n.includes("earned")) return "💰";
    if (n.includes("emergency")) return "🚨";
    return "📄";
};

const getColorForCategory = (name) => {
    const n = name.toLowerCase();
    if (n.includes("sick")) return "rose";
    if (n.includes("casual")) return "indigo";
    if (n.includes("paid") || n.includes("earned")) return "emerald";
    if (n.includes("emergency")) return "amber";
    return "slate";
};

const LeavePolicyForm = () => {
    const [settings, setSettings] = useState({
        leaveTypes: [],
        isActive: true,
        year: new Date().getFullYear()
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const res = await axios.get("/leavepolicy/current");
            if (res.data.data) {
                setSettings(res.data.data);
            }
        } catch (error) {
            console.error("Error fetching settings:", error);
        } finally {
            setLoading(false);
        }
    };

    const addLeaveType = () => {
        setSettings(prev => ({
            ...prev,
            leaveTypes: [
                ...prev.leaveTypes,
                {
                    leaveType: "",
                    category: "PAID",
                    totalPerYear: 10,
                    allocationType: "YEARLY",
                    monthlyAccrual: 0
                }
            ]
        }));
    };

    const removeLeaveType = (index) => {
        const newTypes = [...settings.leaveTypes];
        newTypes.splice(index, 1);
        setSettings({ ...settings, leaveTypes: newTypes });
    };

    const handleTypeChange = (index, field, value) => {
        const newTypes = [...settings.leaveTypes];
        newTypes[index][field] = value;

        if (field === "leaveType") {
            // No longer auto-generating category from leaveType name
            // setSettings(prev => ...)
        }

        if (field === "allocationType") {
            if (value === "YEARLY") {
                newTypes[index].monthlyAccrual = 0;
            } else {
                newTypes[index].monthlyAccrual = parseFloat((newTypes[index].totalPerYear / 12).toFixed(2));
            }
        }

        if (field === "totalPerYear") {
            const numValue = Math.max(0, parseFloat(value) || 0);
            newTypes[index].totalPerYear = numValue;
            if (newTypes[index].allocationType === "MONTHLY") {
                newTypes[index].monthlyAccrual = parseFloat((numValue / 12).toFixed(2));
            }
        }

        setSettings({ ...settings, leaveTypes: newTypes });

        if (errors[index]?.[field]) {
            const newErrors = { ...errors };
            delete newErrors[index][field];
            setErrors(newErrors);
        }
    };

    const validate = () => {
        const newErrors = {};
        let isValid = true;

        if (settings.leaveTypes.length === 0) {
            toast.error("Please add at least one leave category.");
            return false;
        }

        settings.leaveTypes.forEach((type, index) => {
            const typeErrors = {};
            if (!type.leaveType) {
                typeErrors.leaveType = "Required";
                isValid = false;
            }
            if (type.totalPerYear < 0 || isNaN(type.totalPerYear)) {
                typeErrors.totalPerYear = "Invalid";
                isValid = false;
            }
            if (Object.keys(typeErrors).length > 0) {
                newErrors[index] = typeErrors;
            }
        });

        setErrors(newErrors);
        return isValid;
    };

    const handleSave = async (e) => {
        e.preventDefault();

        if (!validate()) {
            toast.error("Please fix validation errors.");
            return;
        }

        try {
            setSaving(true);
            const payload = {
                ...settings,
                leaveCycle: settings.leaveCycle || { cycleType: "YEARLY", cycleStartMonth: 0 },
                leaveTypes: settings.leaveTypes.map(t => ({
                    ...t,
                    category: t.category || "PAID"
                }))
            };

            if (settings._id) {
                await axios.put(`/leavepolicy/${settings._id}`, payload);
            } else {
                await axios.post("/leavepolicy", payload);
            }

            toast.success("Leave policy synchronized successfully");
            fetchSettings();
        } catch (error) {
            toast.error(error.response?.data?.message || "Communication failure with server.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                <p className="text-indigo-500 font-black uppercase tracking-widest text-[10px] animate-pulse italic">Connecting to HR Engine...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <form onSubmit={handleSave} className="space-y-10">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[3rem] shadow-2xl shadow-gray-100/50 border border-gray-50 ring-1 ring-gray-100/50">
                    <div className="flex items-center gap-6">
                        <div className="p-5 bg-gradient-to-br from-indigo-500 to-indigo-800 text-white rounded-[2rem] shadow-xl shadow-indigo-100 ring-8 ring-indigo-50">
                            <ShieldCheck size={32} />
                        </div>
                        <div>
                            <h3 className="text-3xl font-black text-gray-900 tracking-tight">Active Policy <span className="text-indigo-600 px-3 py-1 bg-indigo-50 rounded-xl ml-2">{settings.year}</span></h3>
                            <div className="flex items-center gap-3 mt-2">
                                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-lg shadow-emerald-200"></span>
                                <p className="text-gray-400 text-[11px] font-black uppercase tracking-[0.3em] leading-none">Global Configurator</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            type="button"
                            onClick={addLeaveType}
                            className="flex items-center gap-2 px-6 py-4 bg-indigo-50 text-indigo-700 rounded-2xl font-black text-xs hover:bg-indigo-100 transition-all border border-indigo-100 shadow-sm"
                        >
                            <Plus size={18} />
                            <span>ADD CATEGORY</span>
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="group flex items-center gap-3 px-10 py-4 bg-gray-900 text-white rounded-[1.5rem] font-black text-sm hover:shadow-2xl hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {saving ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <Save size={22} className="group-hover:rotate-12 transition-transform" />
                            )}
                            <span className="tracking-widest">{saving ? "SYNCING..." : "COMMIT POLICY"}</span>
                        </button>
                    </div>
                </div>

                {/* Dynamic List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {settings.leaveTypes.map((type, index) => {
                        const color = getColorForCategory(type.leaveType);
                        const icon = getIconForCategory(type.leaveType);

                        const colorClasses = {
                            indigo: "from-indigo-50 to-indigo-100/20 text-indigo-600 border-indigo-100 ring-indigo-50",
                            rose: "from-rose-50 to-rose-100/20 text-rose-600 border-rose-100 ring-rose-50",
                            emerald: "from-emerald-50 to-emerald-100/20 text-emerald-600 border-emerald-100 ring-emerald-50",
                            amber: "from-amber-50 to-amber-100/20 text-amber-600 border-amber-100 ring-amber-50",
                            slate: "from-slate-50 to-slate-100/20 text-slate-600 border-slate-100 ring-slate-50"
                        }[color];

                        const inputClasses = `w-full pl-5 pr-5 py-3.5 bg-gray-50/50 rounded-2xl border border-transparent outline-none focus:bg-white focus:ring-4 ring-${color}-100 focus:border-${color}-400 font-bold text-gray-700 shadow-inner transition-all`;

                        return (
                            <div
                                key={index}
                                className="group bg-white rounded-[3rem] border border-gray-100 shadow-xl shadow-gray-100/30 p-8 flex flex-col justify-between hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 relative overflow-hidden"
                            >
                                <div className="space-y-6 relative">
                                    <div className="flex justify-between items-start">
                                        <div className={`w-14 h-14 bg-gradient-to-br ${colorClasses} rounded-2xl shadow-sm border border-white/50 ring-8 flex items-center justify-center text-2xl`}>
                                            {icon}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeLeaveType(index)}
                                            className="p-3 bg-rose-50 text-rose-400 rounded-xl hover:bg-rose-100 hover:text-rose-600 transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Category Label</label>
                                            <input
                                                className={`${inputClasses} ${errors[index]?.leaveType ? "border-rose-400" : ""}`}
                                                placeholder="e.g. Vacation Leave"
                                                value={type.leaveType}
                                                onChange={(e) => handleTypeChange(index, "leaveType", e.target.value)}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Leave Category</label>
                                            <select
                                                className={inputClasses}
                                                value={type.category}
                                                onChange={(e) => handleTypeChange(index, "category", e.target.value)}
                                            >
                                                <option value="PAID">PAID (Standard)</option>
                                                <option value="UNPAID">UNPAID (Deductible)</option>
                                            </select>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Days / Year</label>
                                                <input
                                                    type="number"
                                                    className={`${inputClasses} text-center`}
                                                    value={type.totalPerYear}
                                                    onChange={(e) => handleTypeChange(index, "totalPerYear", e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Strategy</label>
                                                <select
                                                    className={`${inputClasses} appearance-none cursor-pointer`}
                                                    value={type.allocationType}
                                                    onChange={(e) => handleTypeChange(index, "allocationType", e.target.value)}
                                                >
                                                    <option value="YEARLY">Annual</option>
                                                    <option value="MONTHLY">Accrued</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className={`mt-8 pt-6 border-t border-gray-100 flex items-center justify-between`}>
                                        <div>
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Impact per month</p>
                                            <div className="flex items-center gap-2">
                                                <Clock size={14} className={type.allocationType === "MONTHLY" ? "text-indigo-500" : "text-gray-300"} />
                                                <span className={`text-sm font-black tracking-tight ${type.allocationType === "MONTHLY" ? "text-gray-900" : "text-gray-300"}`}>
                                                    {type.monthlyAccrual} <span className="text-[10px] font-bold text-gray-400">DAYS</span>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {settings.leaveTypes.length === 0 && (
                        <div className="col-span-full py-20 bg-gray-50/50 rounded-[2.5rem] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-center">
                            <Plus size={48} className="text-gray-300 mb-4" />
                            <h4 className="text-xl font-black text-gray-400">Policy is empty</h4>
                            <p className="text-sm text-gray-400 mt-1 uppercase font-bold tracking-widest">Start by adding your first leave category</p>
                        </div>
                    )}
                </div>

                {/* Footer Notice */}
                <div className="bg-indigo-50/50 p-8 rounded-[2rem] border border-indigo-100 flex items-center gap-6">
                    <div className="p-4 bg-white rounded-2xl shadow-sm ring-1 ring-indigo-100">
                        <AlertCircle size={24} className="text-indigo-600" />
                    </div>
                    <div className="flex-1">
                        <p className="text-xs text-indigo-900 font-bold uppercase tracking-tight leading-loose">
                            Critical: System-wide updates will propagate to all employee balance records upon syncing.
                            Ensure Yearly Quota values are validated against existing usage to avoid negative balances.
                        </p>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default LeavePolicyForm;
