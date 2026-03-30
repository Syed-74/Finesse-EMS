import React, { useState, useEffect } from "react";
import api from "../../../api/axios";
import { 
    Plus, 
    Users, 
    Calendar, 
    AlertCircle, 
    CheckCircle2, 
    Clock, 
    ChevronRight,
    Search,
    X,
    ClipboardList,
    AlertTriangle
} from "lucide-react";
import { showSuccess, showError } from "../../../utils/toast";
import { useNavigate } from "react-router-dom";

const CreateTask = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [employees, setEmployees] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedEmployees, setSelectedEmployees] = useState([]);

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        priority: "Medium",
        deadline: "",
    });

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        try {
            const res = await api.get("/employees");
            // Filter only active and approved employees
            const activeEmps = Array.isArray(res.data) 
                ? res.data.filter(emp => emp.isActive && emp.status === "APPROVED")
                : [];
            setEmployees(activeEmps);
        } catch (err) {
            console.error("Failed to fetch employees", err);
            showError("Could not load employee list");
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const toggleEmployee = (empId) => {
        setSelectedEmployees(prev => 
            prev.includes(empId) 
                ? prev.filter(id => id !== empId) 
                : [...prev, empId]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (selectedEmployees.length === 0) {
            showError("Please assign at least one employee");
            return;
        }

        try {
            setLoading(true);
            const payload = {
                ...formData,
                assignedTo: selectedEmployees.map(id => ({ employee: id }))
            };

            await api.post("/tasks/create", payload);
            showSuccess("Task assigned successfully");
            navigate("/admin/tasks"); // Navigate to task list
        } catch (err) {
            console.error("Task creation failed", err);
            showError(err.response?.data?.message || "Failed to create task");
        } finally {
            setLoading(false);
        }
    };

    const filteredEmployees = employees.filter(emp => 
        `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 max-w-[1200px] mx-auto animate-in fade-in duration-500">
            {/* Header */}
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-indigo-600 font-black tracking-widest uppercase text-[10px] mb-1">
                        Management Terminal • Assignment Mode
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase flex items-center gap-3">
                        <Plus className="w-8 h-8 text-indigo-600" />
                        Initialize New Task
                    </h1>
                    <p className="text-sm text-slate-500 font-medium">Define objectives and delegate to the workforce</p>
                </div>
                <button 
                    onClick={() => navigate("/admin/tasks")}
                    className="px-4 py-2 text-slate-400 hover:text-slate-600 text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all"
                >
                    <X className="w-4 h-4" /> Cancel Operation
                </button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Task Details */}
                <div className="lg:col-span-7 space-y-6">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 opacity-40 group-hover:scale-110 transition-transform duration-700"></div>
                        
                        <div className="relative z-10 space-y-5">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Task Title</label>
                                <input 
                                    type="text"
                                    name="title"
                                    required
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    placeholder="Enter a descriptive title..."
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all placeholder:text-slate-300"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Objective Description</label>
                                <textarea 
                                    name="description"
                                    rows="5"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    placeholder="Outline the steps and expectations..."
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-medium text-slate-600 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all placeholder:text-slate-300 resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                        <AlertCircle className="w-3 h-3 text-indigo-500" /> Key Priority
                                    </label>
                                    <select 
                                        name="priority"
                                        value={formData.priority}
                                        onChange={handleInputChange}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="Low">Standard (Low)</option>
                                        <option value="Medium">Elevated (Medium)</option>
                                        <option value="High">Critical (High)</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                        <Clock className="w-3 h-3 text-indigo-500" /> Target Deadline
                                    </label>
                                    <input 
                                        type="date"
                                        name="deadline"
                                        required
                                        value={formData.deadline}
                                        onChange={handleInputChange}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all cursor-pointer"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-indigo-900 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-700">
                            <ClipboardList className="w-32 h-32 text-white" />
                        </div>
                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <h3 className="text-white font-black uppercase tracking-widest text-lg">Finalize Deployment</h3>
                                <p className="text-indigo-300 text-xs font-medium uppercase tracking-[0.05em] mt-1">
                                    This task will be visible to {selectedEmployees.length} assigned employees.
                                </p>
                            </div>
                            <button 
                                type="submit"
                                disabled={loading}
                                className="bg-white text-indigo-900 px-8 py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-indigo-50 transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
                            >
                                {loading ? "Processing..." : (
                                    <>
                                        Broadcast Task <ChevronRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Column: Employee Selection */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm flex flex-col h-full overflow-hidden min-h-[500px]">
                        <div className="p-8 border-b border-slate-100 bg-slate-50/10">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-slate-900 text-white rounded-xl shadow-lg">
                                        <Users className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h2 className="font-black text-slate-900 uppercase tracking-tight text-sm">Assign Workforce</h2>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Select target collaborators</p>
                                    </div>
                                </div>
                                <span className={`text-[10px] font-black px-3 py-1 rounded-full ${selectedEmployees.length > 0 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                    {selectedEmployees.length} SELECTED
                                </span>
                            </div>

                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                <input 
                                    type="text"
                                    placeholder="Search by name, email, or role..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-11 pr-4 py-3 text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full transition-all placeholder:text-slate-300"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-[400px]">
                            {filteredEmployees.length > 0 ? (
                                filteredEmployees.map(emp => (
                                    <div 
                                        key={emp._id}
                                        onClick={() => toggleEmployee(emp._id)}
                                        className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer border transition-all duration-300 group
                                            ${selectedEmployees.includes(emp._id) 
                                                ? 'bg-indigo-50 border-indigo-200 shadow-sm' 
                                                : 'bg-white border-transparent hover:border-slate-100 hover:bg-slate-50'
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black transition-all
                                                ${selectedEmployees.includes(emp._id)
                                                    ? 'bg-indigo-600 text-white animate-in zoom-in-75 duration-300'
                                                    : 'bg-slate-100 text-slate-400 group-hover:bg-white group-hover:text-indigo-600'
                                                }`}
                                            >
                                                {emp.firstName?.charAt(0)}
                                            </div>
                                            <div>
                                                <p className={`text-xs font-black tracking-tight ${selectedEmployees.includes(emp._id) ? 'text-indigo-900' : 'text-slate-700'}`}>
                                                    {emp.firstName} {emp.lastName}
                                                </p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-1">
                                                    {emp.designation || "Staff Member"}
                                                </p>
                                            </div>
                                        </div>
                                        {selectedEmployees.includes(emp._id) && (
                                            <CheckCircle2 className="w-5 h-5 text-indigo-600 animate-in bounce-in duration-500" />
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="p-12 text-center text-slate-300 space-y-4">
                                    <AlertTriangle className="w-12 h-12 mx-auto opacity-20" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">No available employees found</p>
                                </div>
                            )}
                        </div>

                        {selectedEmployees.length > 0 && (
                            <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-wrap gap-2">
                                {selectedEmployees.map(id => {
                                    const emp = employees.find(e => e._id === id);
                                    if (!emp) return null;
                                    return (
                                        <div key={id} className="bg-white px-3 py-1.5 rounded-lg border border-indigo-100 text-[9px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                                            {emp.firstName}
                                            <button 
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleEmployee(id);
                                                }}
                                                className="hover:text-rose-500 transition-colors"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </form>
        </div>
    );
};

export default CreateTask;