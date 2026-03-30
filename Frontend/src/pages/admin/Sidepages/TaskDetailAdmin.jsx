import React, { useState, useEffect } from "react";
import api from "../../../api/axios";
import { 
    ArrowLeft, 
    Calendar, 
    Clock, 
    MessageSquare, 
    Send, 
    User, 
    CheckCircle2, 
    AlertCircle, 
    MoreVertical,
    Users,
    ChevronRight,
    Loader2,
    Activity
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { showSuccess, showError } from "../../../utils/toast";

const TaskDetailAdmin = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [task, setTask] = useState(null);
    const [loading, setLoading] = useState(true);
    const [comment, setComment] = useState("");
    const [sending, setSending] = useState(false);

    useEffect(() => {
        fetchTask();
    }, [id]);

    const fetchTask = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/tasks/${id}`);
            setTask(res.data.task);
        } catch (err) {
            console.error("Failed to fetch task", err);
            showError("Could not load task details");
        } finally {
            setLoading(false);
        }
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!comment.trim()) return;

        try {
            setSending(true);
            await api.post(`/tasks/add-comment/${id}`, { text: comment });
            setComment("");
            fetchTask(); // Refresh to show new comment
            showSuccess("Comment dispatched");
        } catch (err) {
            showError("Failed to add comment");
        } finally {
            setSending(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[500px] text-slate-400 gap-4">
                <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
                <p className="text-sm font-bold uppercase tracking-widest text-slate-600">Analyzing Objective Data...</p>
            </div>
        );
    }

    if (!task) return null;

    const progress = Math.round((task.assignedTo.filter(e => e.status === "Completed").length / task.assignedTo.length) * 100);

    return (
        <div className="p-6 max-w-[1400px] mx-auto animate-in fade-in duration-700">
            {/* Header */}
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-6">
                    <button 
                        onClick={() => navigate("/admin/tasks")}
                        className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm active:scale-95"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 text-indigo-600 font-black tracking-widest uppercase text-[10px] mb-1">
                            Mission Control • Critical Detail
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">{task.title}</h1>
                        <p className="text-sm text-slate-500 font-medium italic">Initiated by {task.assignedBy ? `${task.assignedBy.firstName} ${task.assignedBy.lastName}` : "Administrator"} on {new Date(task.createdAt).toLocaleDateString()}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className={`px-4 py-2 rounded-xl border text-xs font-black uppercase tracking-widest 
                        ${task.priority === 'High' ? 'text-rose-600 bg-rose-50 border-rose-100' : 
                          task.priority === 'Medium' ? 'text-amber-600 bg-amber-50 border-amber-100' : 
                          'text-emerald-600 bg-emerald-50 border-emerald-100'}`}>
                        {task.priority} Priority
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Task Info & Progress */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Objectives Card */}
                    <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-slate-50 rounded-full -mr-24 -mt-24 opacity-60"></div>
                        <h2 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em] mb-6 relative z-10 flex items-center gap-2">
                             Summary Overview
                        </h2>
                        <div className="relative z-10">
                            <p className="text-lg text-slate-600 font-medium leading-relaxed mb-10">
                                {task.description || "The administrator has not provided specific documentation for this objective."}
                            </p>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-slate-50">
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Global Status</p>
                                    <p className={`text-sm font-black uppercase tracking-tight ${progress === 100 ? 'text-emerald-600' : 'text-indigo-600'}`}>
                                        {progress}% Deployed
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Target Deadline</p>
                                    <div className="flex items-center gap-2 text-sm font-black text-slate-900 uppercase tracking-tight">
                                        <Calendar className="w-4 h-4 text-indigo-400" />
                                        {new Date(task.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Collaborators</p>
                                    <p className="text-sm font-black text-slate-900 uppercase tracking-tight">
                                        {task.assignedTo?.length || 0} Professional Staff
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Assigned Personnel Tracking */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-4">
                            <h2 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] flex items-center gap-2">
                                <Users className="w-4 h-4" /> Personnel Deployment
                            </h2>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live Updates</span>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            {task.assignedTo.map((assignment, index) => (
                                <div 
                                    key={index}
                                    className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all duration-500 group"
                                >
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div className="flex items-center gap-5">
                                            <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-slate-200 group-hover:bg-indigo-600 transition-colors">
                                                {assignment.employee?.firstName?.charAt(0)}
                                            </div>
                                            <div>
                                                <h4 className="font-black text-slate-900 uppercase tracking-tight text-base group-hover:text-indigo-600 transition-colors">
                                                    {assignment.employee ? `${assignment.employee.firstName} ${assignment.employee.lastName}` : "Unknown Employee"}
                                                </h4>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                                                    {assignment.employee?.email}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-8">
                                            <div className="text-right">
                                                <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1.5">Resource Status</p>
                                                <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest
                                                    ${assignment.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                      assignment.status === 'In Progress' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                                      'bg-slate-50 text-slate-400 border-slate-100'}`}>
                                                    {assignment.status === 'Completed' && <CheckCircle2 className="w-3 h-3" />}
                                                    {assignment.status === 'In Progress' && <Activity className="w-3 h-3 animate-pulse" />}
                                                    {assignment.status}
                                                </div>
                                            </div>
                                            <div className="hidden md:block w-[1px] h-10 bg-slate-50"></div>
                                            <div className="text-right hidden md:block">
                                                <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1.5">Last Transmission</p>
                                                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                                                    {assignment.updatedAt ? new Date(assignment.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "No Activity"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Communication Hub */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="bg-slate-900 rounded-[3rem] shadow-2xl flex flex-col h-[700px] relative overflow-hidden text-white border border-slate-800">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-indigo-500"></div>
                        <div className="p-8 border-b border-white/5 bg-white/5">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg">
                                    <MessageSquare className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="font-black text-white uppercase tracking-tight text-sm">Communication Hub</h2>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Broadcast Log & Insights</p>
                                </div>
                            </div>
                        </div>

                        {/* Comments List */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide">
                            {task.comments?.length > 0 ? (
                                task.comments.map((cmt, idx) => (
                                    <div key={idx} className={`animate-in slide-in-from-bottom-2 duration-500`}>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                                                {cmt.createdBy ? `${cmt.createdBy.firstName} ${cmt.createdBy.lastName}` : "System"}
                                            </span>
                                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest border border-slate-800 px-2 py-0.5 rounded-md">
                                                {new Date(cmt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                                            <p className="text-xs text-slate-300 font-medium leading-relaxed italic">"{cmt.text}"</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center opacity-20 space-y-4">
                                    <Activity className="w-12 h-12" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">No communications recorded</p>
                                </div>
                            )}
                        </div>

                        {/* Add Comment */}
                        <div className="p-8 bg-white/5 border-t border-white/10">
                            <form onSubmit={handleAddComment} className="relative">
                                <input 
                                    type="text"
                                    placeholder="Enter your transmission..."
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    className="w-full bg-slate-800 border-none rounded-2xl pl-6 pr-14 py-4 text-xs font-bold text-white placeholder:text-slate-600 focus:ring-2 focus:ring-indigo-500 transition-all shadow-inner"
                                />
                                <button 
                                    type="submit"
                                    disabled={sending || !comment.trim()}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-500 transition-all active:scale-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/20"
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
};

export default TaskDetailAdmin;
