import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import {
    Save,
    ShieldCheck,
    Clock,
    Calendar,
    AlertCircle,
    Umbrella,
    Stethoscope,
    Wallet,
    PlaneLanding,
    ChevronRight,
    Info
} from "lucide-react";

// Fixed Leave Categories Configuration
const FIXED_LEAVE_TYPES = [
    {
        name: "Casual Leave",
        code: "CASUAL",
        icon: <Umbrella size={24} />,
        color: "indigo",
        description: "Reasonable absence for personal matters."
    },
    {
        name: "Sick Leave",
        code: "SICK",
        icon: <Stethoscope size={24} />,
        color: "rose",
        description: "Reserved for medical recovery and health."
    },
    {
        name: "Paid Leave",
        code: "PAID",
        icon: <Wallet size={24} />,
        color: "emerald",
        description: "Earned time off with full compensation."
    },
    {
        name: "Unpaid Leave",
        code: "UNPAID",
        icon: <PlaneLanding size={24} />,
        color: "amber",
        description: "Absence without pay for extended needs."
    }
];

const LeavePolicyForm = () => {
    const [settings, setSettings] = useState({
        leaveTypes: [],
        isActive: true
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
            const res = await axios.get("http://localhost:5000/api/leavemanagement/settings");

            let data = res.data.data;

            // Ensure we have all 4 fixed leave types initialized
            const initializedLeaveTypes = FIXED_LEAVE_TYPES.map(fixedType => {
                const existing = data?.leaveTypes?.find(t => t.leaveType === fixedType.code);
                return existing || {
                    leaveType: fixedType.code,
                    totalPerYear: 0,
                    allocationType: "YEARLY",
                    monthlyAccrual: 0
                };
            });

            setSettings(prev => ({
                ...prev,
                ...(data || {}),
                leaveTypes: initializedLeaveTypes
            }));
        } catch (error) {
            console.error("Error fetching settings:", error);
            // Fallback to defaults on error
            setSettings({
                isActive: true,
                leaveTypes: FIXED_LEAVE_TYPES.map(f => ({
                    leaveType: f.name,
                    totalPerYear: 0,
                    allocationType: "YEARLY",
                    monthlyAccrual: 0
                }))
            });
        } finally {
            setLoading(false);
        }
    };

    const handleTypeChange = (index, field, value) => {
        const newTypes = [...settings.leaveTypes];
        newTypes[index][field] = value;

        // Auto-calculate logic
        if (field === "allocationType") {
            if (value === "YEARLY") {
                newTypes[index].monthlyAccrual = 0;
            } else {
                newTypes[index].monthlyAccrual = parseFloat((newTypes[index].totalPerYear / 12).toFixed(2));
            }
        }

        if (field === "totalPerYear") {
            const numValue = Math.max(0, parseInt(value) || 0);
            newTypes[index].totalPerYear = numValue;
            if (newTypes[index].allocationType === "MONTHLY") {
                newTypes[index].monthlyAccrual = parseFloat((numValue / 12).toFixed(2));
            }
        }

        setSettings({ ...settings, leaveTypes: newTypes });

        // Clear inline error on change
        if (errors[index]?.[field]) {
            const newErrors = { ...errors };
            delete newErrors[index][field];
            setErrors(newErrors);
        }
    };

    const validate = () => {
        const newErrors = {};
        let isValid = true;

        settings.leaveTypes.forEach((type, index) => {
            const typeErrors = {};
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
            const cleanedSettings = {
                ...settings,
                leaveTypes: settings.leaveTypes.map(t => ({
                    leaveType: t.leaveType,
                    totalPerYear: Number(t.totalPerYear),
                    allocationType: t.allocationType,
                    monthlyAccrual: t.allocationType === "MONTHLY" ? Number(t.monthlyAccrual) : 0
                }))
            };

            await axios.post("http://localhost:5000/api/leavemanagement/settings", cleanedSettings);
            toast.success("Leave policy updated successfully");
            fetchSettings();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to save settings.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                <p className="text-indigo-500 font-black uppercase tracking-widest text-xs animate-pulse">Loading Policy...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <form onSubmit={handleSave} className="space-y-10">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-[2.5rem] shadow-xl shadow-gray-100/50 border border-gray-50">
                    <div className="flex items-center gap-5">
                        <div className="p-4 bg-gradient-to-br from-indigo-500 to-indigo-700 text-white rounded-3xl shadow-lg shadow-indigo-200 ring-4 ring-indigo-50">
                            <ShieldCheck size={28} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-gray-900 tracking-tight">Global Leave Policy</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                                <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest leading-none">Configuration Engine</p>
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={saving}
                        className="group flex items-center gap-3 px-8 py-4 bg-gray-900 text-white rounded-2xl font-black text-sm hover:shadow-2xl hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-50 disabled:translate-y-0"
                    >
                        {saving ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <Save size={20} className="group-hover:rotate-12 transition-transform" />
                        )}
                        <span>{saving ? "SYNCING..." : "SAVE POLICY"}</span>
                    </button>
                </div>

                {/* Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {FIXED_LEAVE_TYPES.map((fixedType, index) => {
                        const typeSettings = settings.leaveTypes[index] || {
                            leaveType: fixedType.name,
                            totalPerYear: 0,
                            allocationType: "YEARLY",
                            monthlyAccrual: 0
                        };

                        const colorClasses = {
                            indigo: "from-indigo-50 to-indigo-100/30 text-indigo-600 border-indigo-100 ring-indigo-50",
                            rose: "from-rose-50 to-rose-100/30 text-rose-600 border-rose-100 ring-rose-50",
                            emerald: "from-emerald-50 to-emerald-100/30 text-emerald-600 border-emerald-100 ring-emerald-50",
                            amber: "from-amber-50 to-amber-100/30 text-amber-600 border-amber-100 ring-amber-50"
                        }[fixedType.color];

                        const focusClasses = {
                            indigo: "focus:ring-indigo-100",
                            rose: "focus:ring-rose-100",
                            emerald: "focus:ring-emerald-100",
                            amber: "focus:ring-amber-100"
                        }[fixedType.color];

                        return (
                            <div
                                key={fixedType.name}
                                className="group bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-100/40 p-8 flex flex-col justify-between hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 relative overflow-hidden"
                            >
                                {/* Background Accent */}
                                <div className={`absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br ${colorClasses} opacity-20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700`}></div>

                                <div className="space-y-6 relative">
                                    <div className="flex justify-between items-start">
                                        <div className={`p-4 bg-gradient-to-br ${colorClasses} rounded-2xl shadow-sm border border-white/50 ring-4`}>
                                            {fixedType.icon}
                                        </div>
                                        <div className="px-3 py-1 bg-gray-50 rounded-full border border-gray-100">
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">FIXED</span>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-xl font-black text-gray-900 tracking-tight">{fixedType.name}</h4>
                                        <p className="text-xs text-gray-400 font-medium leading-relaxed mt-1 uppercase tracking-tighter">
                                            {fixedType.description}
                                        </p>
                                    </div>

                                    <div className="space-y-5">
                                        <div className="space-y-2">
                                            <div className="flex justify-between ml-1">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Yearly Quota</label>
                                                {errors[index]?.totalPerYear && <span className="text-[10px] text-rose-500 font-bold uppercase italic">Missing</span>}
                                            </div>
                                            <div className="relative">
                                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                                                <input
                                                    type="number"
                                                    required
                                                    min="0"
                                                    placeholder="0"
                                                    className={`w-full pl-12 pr-5 py-3.5 bg-gray-50/50 rounded-2xl border border-transparent outline-none focus:bg-white focus:border-indigo-400 focus:ring-4 ${focusClasses} font-bold text-gray-700 shadow-inner transition-all ${errors[index]?.totalPerYear ? "border-rose-400" : ""}`}
                                                    value={typeSettings.totalPerYear}
                                                    onChange={(e) => handleTypeChange(index, "totalPerYear", e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Allocation Strategy</label>
                                            <div className="relative">
                                                <select
                                                    className={`w-full px-5 py-3.5 bg-gray-50/50 rounded-2xl border border-transparent outline-none focus:bg-white focus:border-indigo-400 focus:ring-4 ${focusClasses} font-bold text-gray-700 shadow-inner appearance-none transition-all cursor-pointer`}
                                                    value={typeSettings.allocationType}
                                                    onChange={(e) => handleTypeChange(index, "allocationType", e.target.value)}
                                                >
                                                    <option value="YEARLY">Full Yearly Grant</option>
                                                    <option value="MONTHLY">Monthly Accrual</option>
                                                </select>
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                                    <ChevronRight size={16} className="rotate-90" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className={`mt-8 pt-6 border-t border-gray-100 flex items-center justify-between relative`}>
                                    <div>
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Impact per month</p>
                                        <div className="flex items-center gap-2">
                                            <Clock size={14} className={typeSettings.allocationType === "MONTHLY" ? "text-indigo-500" : "text-gray-300"} />
                                            <span className={`text-sm font-black tracking-tight ${typeSettings.allocationType === "MONTHLY" ? "text-gray-900" : "text-gray-300"}`}>
                                                {typeSettings.monthlyAccrual} <span className="text-[10px] font-bold text-gray-400">DAYS</span>
                                            </span>
                                        </div>
                                    </div>
                                    <div className="group/info relative">
                                        <Info size={16} className="text-gray-300 cursor-help" />
                                        <div className="absolute bottom-full right-0 mb-2 w-32 p-2 bg-gray-900 text-white text-[8px] font-black uppercase rounded-lg opacity-0 invisible group-hover/info:opacity-100 group-hover/info:visible transition-all">
                                            {typeSettings.allocationType === "MONTHLY" ? "Accrued dynamically" : "Lump sum credit"}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer Notice */}
                <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100 flex items-center gap-4">
                    <div className="p-2 bg-white rounded-xl shadow-sm">
                        <AlertCircle size={20} className="text-indigo-500" />
                    </div>
                    <p className="text-xs text-indigo-900 font-bold uppercase tracking-tight">
                        Note: Leave policy changes take effect immediately for all active employees. Manual entry is restricted to ensure data integrity.
                    </p>
                </div>
            </form>
        </div>
    );
};

export default LeavePolicyForm;
