import React, { useState, useEffect, useMemo } from "react";
import api from "../../../api/axios";
import { 
    Search, 
    Filter, 
    Plus, 
    MoreVertical, 
    Clock, 
    AlertCircle, 
    CheckCircle2, 
    Eye,
    Trash2,
    Calendar,
    Users,
    ArrowUpRight,
    Loader2,
    ClipboardList
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { showSuccess, showError } from "../../../utils/toast";
import { useConfirm } from "../../../context/ConfirmContext";

const TaskList = () => {
    const navigate = useNavigate();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [priorityFilter, setPriorityFilter] = useState("All");
    const [statusFilter, setStatusFilter] = useState("All");
    const { confirmAction } = useConfirm();

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            setLoading(true);
            const res = await api.get("/tasks/all");
            setTasks(res.data.tasks || []);
        } catch (err) {
            console.error("Failed to fetch tasks", err);
            showError("Could not load organization tasks");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        confirmAction({
            title: "Archiving Task",
            message: "This will move the task to archives. Are you sure?",
            type: "danger",
            onConfirm: async () => {
                try {
                    await api.delete(`/tasks/delete/${id}`);
                    showSuccess("Task archived successfully");
                    fetchTasks();
                } catch (err) {
                    showError("Failed to archive task");
                }
            }
        });
    };

    const filteredTasks = useMemo(() => {
        return tasks.filter(task => {
            const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                 task.description.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesPriority = priorityFilter === "All" || task.priority === priorityFilter;
            
            // For status, it's complex because each employee has a status.
            // Admin list status usually means "Overall Progress" or similar.
            // For now, let's filter by if ANY employee is in that status for simplicity in the list view.
            const matchesStatus = statusFilter === "All" || 
                                 task.assignedTo.some(emp => emp.status === statusFilter);

            return matchesSearch && matchesPriority && matchesStatus;
        });
    }, [tasks, searchTerm, priorityFilter, statusFilter]);

    const getPriorityColor = (priority) => {
        switch (priority) {
            case "High": return "text-rose-600 bg-rose-50 border-rose-100";
            case "Medium": return "text-amber-600 bg-amber-50 border-amber-100";
            case "Low": return "text-emerald-600 bg-emerald-50 border-emerald-100";
            default: return "text-slate-600 bg-slate-50 border-slate-100";
        }
    };

    const getDeadlineStatus = (deadline) => {
        const today = new Date();
        const dl = new Date(deadline);
        const diff = dl - today;
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

        if (days < 0) return { label: "Overdue", color: "text-rose-600" };
        if (days === 0) return { label: "Due Today", color: "text-amber-600" };
        if (days <= 3) return { label: `Due in ${days}d`, color: "text-amber-500" };
        return { label: `Due in ${days}d`, color: "text-slate-400" };
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[500px] text-slate-400 gap-4">
                <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
                <p className="text-sm font-bold uppercase tracking-widest text-slate-600">Retrieving Task Matrix...</p>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-[1600px] mx-auto animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-slate-100 pb-8">
                <div>
                    <div className="flex items-center gap-2 text-indigo-600 font-black tracking-widest uppercase text-[10px] mb-1">
                        Operations Console • Task Overview
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Task Management</h1>
                    <p className="text-sm text-slate-500 font-medium">Monitoring <span className="text-slate-900 font-bold">{tasks.length} active initiatives</span> across the organization.</p>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => navigate("/admin/tasks/create")}
                        className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-slate-900 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2 active:scale-95"
                    >
                        <Plus className="w-4 h-4" /> Initialize New Task
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 mb-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="relative flex-1 max-w-xl">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    <input 
                        type="text"
                        placeholder="Search initiatives, descriptions, or objectives..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-300"
                    />
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                        <select 
                            value={priorityFilter}
                            onChange={(e) => setPriorityFilter(e.target.value)}
                            className="bg-transparent text-[10px] font-black uppercase tracking-widest text-slate-500 px-3 py-1 outline-none cursor-pointer"
                        >
                            <option value="All">All Priority</option>
                            <option value="High">High</option>
                            <option value="Medium">Medium</option>
                            <option value="Low">Low</option>
                        </select>
                        <div className="w-[1px] h-4 bg-slate-200"></div>
                        <select 
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-transparent text-[10px] font-black uppercase tracking-widest text-slate-500 px-3 py-1 outline-none cursor-pointer"
                        >
                            <option value="All">All Status</option>
                            <option value="Pending">Pending</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                        </select>
                    </div>
                    <button onClick={fetchTasks} className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                        <Filter className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Task Grid */}
            {filteredTasks.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTasks.map((task) => {
                        const dlStatus = getDeadlineStatus(task.deadline);
                        const progress = Math.round((task.assignedTo.filter(e => e.status === "Completed").length / task.assignedTo.length) * 100);
                        
                        return (
                            <div 
                                key={task._id} 
                                className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm hover:shadow-xl hover:shadow-indigo-50/50 hover:border-indigo-100 transition-all duration-500 group relative overflow-hidden flex flex-col"
                            >
                                <div className="absolute -right-8 -top-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-700">
                                    <ClipboardList className="w-32 h-32" />
                                </div>

                                {/* Top Section */}
                                <div className="flex items-start justify-between mb-4 relative z-10">
                                    <div className={`px-3 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest ${getPriorityColor(task.priority)}`}>
                                        {task.priority} Priority
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button 
                                            onClick={() => navigate(`/admin/tasks/${task._id}`)}
                                            className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(task._id)}
                                            className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex-1 relative z-10">
                                    <h3 className="text-lg font-black text-slate-900 tracking-tight leading-tight mb-2 group-hover:text-indigo-600 transition-colors uppercase">
                                        {task.title}
                                    </h3>
                                    <p className="text-xs text-slate-500 font-medium line-clamp-2 leading-relaxed mb-6">
                                        {task.description || "No specific instructions provided."}
                                    </p>
                                </div>

                                {/* Progress Section */}
                                <div className="space-y-4 pt-6 mt-auto border-t border-slate-50 relative z-10">
                                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest mb-1">
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <Users className="w-3 h-3" />
                                            {task.assignedTo.length} ASSIGNED
                                        </div>
                                        <span className={progress === 100 ? "text-emerald-600" : "text-indigo-600"}>{progress}% COMPLETE</span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full transition-all duration-1000 ${progress === 100 ? 'bg-emerald-500' : 'bg-indigo-600'}`}
                                            style={{ width: `${progress}%` }}
                                        ></div>
                                    </div>
                                    
                                    <div className="flex items-center justify-between pt-2">
                                        <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest ${dlStatus.color}`}>
                                            <Calendar className="w-3 h-3" />
                                            {dlStatus.label}
                                        </div>
                                        <button 
                                            onClick={() => navigate(`/admin/tasks/${task._id}`)}
                                            className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1 group/link"
                                        >
                                            Full Analysis <ArrowUpRight className="w-3 h-3 group-hover/link:-translate-y-0.5 group-hover/link:translate-x-0.5 transition-transform" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="bg-white border border-slate-100 rounded-[3rem] p-20 text-center space-y-6 shadow-sm">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
                        <AlertCircle className="w-10 h-10" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-black text-slate-900 uppercase">Registry Empty</h3>
                        <p className="text-sm text-slate-400 font-medium max-w-xs mx-auto">None of your current filters matched any organization initiatives.</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TaskList;
