import React, { useState, useEffect } from "react";
import api from "../../api/axios";
import { 
    ClipboardList, 
    Clock, 
    CheckCircle2, 
    MessageSquare, 
    Send, 
    ArrowLeft,
    AlertCircle,
    Calendar,
    ChevronRight,
    Loader2,
    Activity,
    ExternalLink
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { showSuccess, showError } from "../../utils/toast";
import { useAuth } from "../../AuthContext/AuthContext";

const EmployeeTask = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { admin: user } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [selectedTask, setSelectedTask] = useState(null);
    const [loading, setLoading] = useState(true);
    const [detailLoading, setDetailLoading] = useState(false);
    const [comment, setComment] = useState("");
    const [sending, setSending] = useState(false);

    useEffect(() => {
        fetchTasks();
    }, []);

    useEffect(() => {
        if (id) {
            fetchTaskDetail(id);
        } else {
            setSelectedTask(null);
        }
    }, [id]);

    const fetchTasks = async () => {
        try {
            setLoading(true);
            const res = await api.get("/tasks/my-tasks");
            console.log("--- Employee Task List Fetch ---");
            console.log("Current User (Auth):", user);
            console.log("Fetched Tasks Data:", res.data);
            setTasks(res.data.tasks || []);
        } catch (err) {
            console.error("Failed to fetch tasks", err);
            showError("Could not load your assignments");
        } finally {
            setLoading(false);
        }
    };

    const fetchTaskDetail = async (taskId) => {
        try {
            setDetailLoading(true);
            const res = await api.get(`/tasks/${taskId}`);
            console.log(`--- Detail Fetch for Task ${taskId} ---`);
            console.log("Task Data:", res.data.task);
            setSelectedTask(res.data.task);
        } catch (err) {
            console.error("Failed to fetch task detail", err);
            showError("Could not load task details");
        } finally {
            setDetailLoading(false);
        }
    };

    const handleUpdateStatus = async (newStatus) => {
        if (!selectedTask) return;
        try {
            await api.put(`/tasks/update-status/${selectedTask._id}`, { status: newStatus });
            showSuccess(`Status updated to ${newStatus}`);
            fetchTaskDetail(selectedTask._id);
            fetchTasks(); // Refresh list to show updated status
        } catch (err) {
            showError("Failed to update status");
        }
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!comment.trim()) return;

        try {
            setSending(true);
            await api.post(`/tasks/add-comment/${selectedTask._id}`, { text: comment });
            setComment("");
            fetchTaskDetail(selectedTask._id);
            showSuccess("Comment added");
        } catch (err) {
            showError("Failed to add comment");
        } finally {
            setSending(false);
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case "High": return "text-rose-600 bg-rose-50 border-rose-100";
            case "Medium": return "text-amber-600 bg-amber-50 border-amber-100";
            case "Low": return "text-emerald-600 bg-emerald-50 border-emerald-100";
            default: return "text-slate-600 bg-slate-50 border-slate-100";
        }
    };

    // Helper to find current employee's status in the task
    const getMyStatus = (task) => {
        // This is a bit tricky on front-end without knowing current user ID 
        // but the backend returns task where assignedTo is filtered or populated.
        // Usually req.user._id is stored in auth context.
        // For now, look for any status that isn't null if we can't find specific.
        // Actually, assignedTo should contain the status for the logged-in user 
        // in a specific way if we optimize backend. 
        // Currently, it returns all assignedTo.
        return task.myStatus || "Pending"; // We might need to adjust backend or auth context
    };

    if (loading && !id) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[500px] text-slate-400 gap-4">
                <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
                <p className="text-sm font-bold uppercase tracking-widest text-slate-600">Syncing Assignments...</p>
            </div>
        );
    }

    // Detail View
    if (id && selectedTask) {
        if (detailLoading) {
            return (
                <div className="flex flex-col items-center justify-center min-h-[500px] text-slate-400 gap-4">
                    <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
                    <p className="text-sm font-bold uppercase tracking-widest text-slate-600">Opening Mission Brief...</p>
                </div>
            );
        }

        // Find current user's status in persistent array
        const myAssignment = selectedTask.assignedTo.find(a => a.employee._id === user?._id || a.employee === user?._id);
        const myStatus = myAssignment?.status || "Pending";

        return (
            <div className="p-6 max-w-[1200px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => navigate("/employee/tasks")}
                            className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-indigo-600 transition-all shadow-sm active:scale-95"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <div className="flex items-center gap-2 text-indigo-600 font-black tracking-widest uppercase text-[10px] mb-1">
                                Assignment Detail • {selectedTask.priority} Priority
                            </div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">{selectedTask.title}</h1>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left: Content & Status */}
                    <div className="lg:col-span-8 space-y-8">
                        <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 opacity-40 group-hover:scale-110 transition-transform duration-700"></div>
                            
                            <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                                Briefing Description
                            </h3>
                            <p className="text-lg text-slate-600 font-medium leading-relaxed mb-10 relative z-10">
                                {selectedTask.description}
                            </p>

                            <div className="grid grid-cols-2 gap-6 pt-6 border-t border-slate-50">
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Target Deadline</p>
                                    <div className="flex items-center gap-2 text-sm font-black text-slate-900 uppercase">
                                        <Calendar className="w-4 h-4 text-indigo-500" />
                                        {new Date(selectedTask.deadline).toLocaleDateString()}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Assigned By</p>
                                    <div className="flex items-center gap-2 text-sm font-black text-slate-900 uppercase">
                                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px]">
                                            {selectedTask.assignedBy?.firstName?.charAt(0)}
                                        </div>
                                        {selectedTask.assignedBy ? `${selectedTask.assignedBy.firstName} ${selectedTask.assignedBy.lastName}` : "Administrator"}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Status Update Controls */}
                        <div className="bg-slate-900 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden text-white border border-slate-800">
                             <div className="absolute top-0 right-0 p-6 opacity-10">
                                <Activity className="w-32 h-32 text-indigo-400" />
                            </div>
                            <div className="relative z-10">
                                <h3 className="text-white font-black uppercase tracking-widest text-lg mb-2">Update Deployment Progress</h3>
                                <p className="text-slate-400 text-xs font-medium uppercase tracking-[0.05em] mb-8">
                                    Current Status: <span className="text-indigo-400 font-black">{myStatus}</span>
                                </p>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <button 
                                        onClick={() => handleUpdateStatus("Pending")}
                                        className={`flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all
                                            ${myStatus === 'Pending' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                                    >
                                        <Clock className="w-4 h-4" /> Pending
                                    </button>
                                    <button 
                                        onClick={() => handleUpdateStatus("In Progress")}
                                        className={`flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all
                                            ${myStatus === 'In Progress' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                                    >
                                        <Activity className="w-4 h-4" /> In Progress
                                    </button>
                                    <button 
                                        onClick={() => handleUpdateStatus("Completed")}
                                        className={`flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all
                                            ${myStatus === 'Completed' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                                    >
                                        <CheckCircle2 className="w-4 h-4" /> Completed
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Comments */}
                    <div className="lg:col-span-4">
                        <div className="bg-white border border-slate-200 rounded-[3rem] shadow-sm h-[600px] flex flex-col overflow-hidden">
                            <div className="p-8 border-b border-slate-100 flex items-center gap-3 bg-slate-50/10">
                                <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100">
                                    <MessageSquare className="w-4 h-4" />
                                </div>
                                <div>
                                    <h2 className="font-black text-slate-900 uppercase tracking-tight text-sm">Communication Log</h2>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Collaborative Discussion</p>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 space-y-6">
                                {selectedTask.comments?.length > 0 ? (
                                    selectedTask.comments.map((cmt, idx) => (
                                        <div key={idx} className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">
                                                    {cmt.createdBy ? `${cmt.createdBy.firstName} ${cmt.createdBy.lastName}` : "System"}
                                                </span>
                                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{new Date(cmt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                                <p className="text-xs text-slate-600 font-medium leading-relaxed italic">"{cmt.text}"</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center opacity-20 space-y-4">
                                        <MessageSquare className="w-12 h-12" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-center">No transmissions yet</p>
                                    </div>
                                )}
                            </div>

                            <div className="p-6 bg-slate-50 border-t border-slate-100">
                                <form onSubmit={handleAddComment} className="relative">
                                    <input 
                                        type="text"
                                        placeholder="Add to the log..."
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-2xl pl-6 pr-14 py-4 text-xs font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all placeholder:text-slate-300"
                                    />
                                    <button 
                                        type="submit"
                                        disabled={sending || !comment.trim()}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-slate-900 transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // List View
    return (
        <div className="p-6 max-w-[1200px] mx-auto animate-in fade-in duration-700">
            <div className="mb-10">
                <div className="flex items-center gap-2 text-indigo-600 font-black tracking-widest uppercase text-[10px] mb-1">
                    Personnel Terminal • My Assignments
                </div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Assigned Objectives</h1>
                <div className="flex items-center gap-2 mt-2">
                    <div className="h-1 w-12 bg-indigo-600 rounded-full"></div>
                    <p className="text-sm text-slate-500 font-medium uppercase tracking-widest">Monitoring {tasks.length} active missions</p>
                </div>
            </div>

            {tasks.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tasks.map(task => {
                        const dl = new Date(task.deadline);
                        // Debug log for each task mapping
                        console.log(`Mapping Task: ${task.title}`);
                        console.log("Task assignedTo:", task.assignedTo);
                        console.log("Match Criteria - User ID:", user?._id, "or Employee ID:", user?.employeeId);

                        const myAssignment = task.assignedTo?.find(a => 
                            a.employee === user?._id || 
                            a.employee?._id === user?._id || 
                            a.employee === user?.employeeId ||
                            a.employee?._id === user?.employeeId
                        );
                        const myStatus = myAssignment?.status || "Pending";
                        const isOverdue = dl < new Date() && myStatus !== "Completed";

                        return (
                            <div 
                                key={task._id}
                                onClick={() => navigate(`/employee/tasks/${task._id}`)}
                                className={`group bg-white rounded-[2.5rem] border p-8 shadow-sm hover:shadow-2xl transition-all duration-500 cursor-pointer relative overflow-hidden flex flex-col
                                    ${isOverdue ? 'border-rose-100 hover:border-rose-200 shadow-rose-50' : 'border-slate-100 hover:border-indigo-100 shadow-indigo-50'}`}
                            >
                                <div className="absolute -right-8 -top-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-700">
                                    <ClipboardList className="w-32 h-32" />
                                </div>

                                <div className="flex items-center justify-between mb-6 relative z-10">
                                    <div className={`px-4 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-widest ${getPriorityColor(task.priority)}`}>
                                        {task.priority} Priority
                                    </div>
                                    <div className="text-[10px] font-black text-slate-300 group-hover:text-indigo-600 transition-colors">
                                        REF: #{task._id.slice(-4).toUpperCase()}
                                    </div>
                                </div>

                                <div className="flex-1 relative z-10">
                                    <h3 className="text-xl font-black text-slate-900 tracking-tight leading-tight mb-4 group-hover:text-indigo-600 transition-colors uppercase">
                                        {task.title}
                                    </h3>
                                    
                                    <div className="space-y-4 pt-4 border-t border-slate-50 mt-auto">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                <Calendar className="w-3 h-3" />
                                                Due {new Date(task.deadline).toLocaleDateString()}
                                            </div>
                                            {isOverdue && (
                                                <span className="flex items-center gap-1 text-[9px] font-black text-rose-600 uppercase animate-pulse">
                                                    <AlertCircle className="w-3 h-3" /> Overdue
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between pt-2">
                                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-widest transition-all
                                                ${myStatus === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                  myStatus === 'In Progress' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                                  'bg-slate-50 text-slate-400 border-slate-100'}`}>
                                                {myStatus}
                                            </div>
                                            <div className="p-2 bg-slate-50 rounded-xl group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-all">
                                                <ChevronRight className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="bg-white border border-slate-100 rounded-[4rem] p-24 text-center space-y-8 shadow-sm relative overflow-hidden">
                    <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
                        <Activity className="w-full h-full" />
                    </div>
                    <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto text-slate-200">
                        <CheckCircle2 className="w-12 h-12" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Mission Clear</h3>
                        <p className="text-sm text-slate-400 font-medium max-w-sm mx-auto mt-2">All assigned objectives have been neutralized or no transmissions found.</p>
                    </div>
                    <button onClick={fetchTasks} className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-slate-900 transition-all shadow-xl shadow-indigo-100 active:scale-95">
                        Refresh Matrix
                    </button>
                </div>
            )}
        </div>
    );
};

export default EmployeeTask;