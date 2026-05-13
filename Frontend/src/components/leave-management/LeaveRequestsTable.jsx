import React, { useEffect, useState } from "react";
import axios from "../../api/axios";
import { format, parseISO } from "date-fns";
import { toast } from "react-hot-toast";
import { CheckCircle, XCircle, Clock, User, Calendar, MessageSquare, X } from "lucide-react";
import ProfileAvatar from "../ProfileAvatar";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://finesse-ems.onrender.com/api';
const IMAGE_BASE_URL = API_BASE_URL.replace('/api', '');
const LeaveRequestsTable = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);

    const [modal, setModal] = useState({
        show: false,
        requestId: null,
        status: "",
        comment: "",
        employeeName: "",
        employee: null,
        leaveType: "",
        duration: "",
        attachment: null
    });

    // Helper to safely get full name
    const getEmployeeName = (emp) =>
        emp
            ? `${emp.firstName || ""} ${emp.lastName || ""}`.trim() || emp.firstName || "Unknown"
            : "Unknown";

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const res = await axios.get("/leaveapplication");
            setRequests(res.data.data || []);
        } catch (error) {
            console.error("Error fetching requests:", error);
            toast.error("Failed to fetch leave requests");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const openActionModal = (req, status) => {
        setModal({
            show: true,
            requestId: req._id,
            status: status,
            comment: "",
            employeeName: getEmployeeName(req.employeeId),
            employee: req.employeeId,
            leaveType: req.leaveType,
            duration: `${format(parseISO(req.startDate), "MMM d")} - ${format(parseISO(req.endDate), "MMM d, yyyy")}`,
            attachment: req.attachment
        });
    };

    const handleStatusUpdate = async () => {
        const { requestId, status, comment } = modal;

        try {
            setActionLoading(requestId);
            await axios.put(`/leaveapplication/${requestId}/status`, {
                status,
                adminComment: comment
            });
            toast.success(`Leave ${status} successfully!`);
            setModal({ ...modal, show: false });
            fetchRequests();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update status.");
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) return <div className="p-10 text-center text-gray-500 font-bold uppercase tracking-widest animate-pulse">Loading Requests...</div>;

    return (
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-100">
                            <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Employee</th>
                            <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Leave Type</th>
                            <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Duration</th>
                            <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Reason</th>
                            <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Attachment</th>
                            <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                            <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {requests.map((req) => (
                            <tr key={req._id} className="hover:bg-gray-50/50 transition-colors group">
                                <td className="p-6">
                                    <div className="flex items-center gap-3">
                                        <ProfileAvatar user={req.employeeId} className="w-10 h-10 shrink-0" />
                                        <div>
                                            <p className="font-bold text-gray-900 text-sm">
                                                {getEmployeeName(req.employeeId)}
                                            </p>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                                                {req.employeeId?.email || "No Email"}
                                            </p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-6">
                                    <div className="flex flex-col gap-1">
                                        <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider ${req.leaveType === 'SICK' ? 'bg-red-50 text-red-600' :
                                            req.leaveType === 'CASUAL' ? 'bg-blue-50 text-blue-600' :
                                                'bg-indigo-50 text-indigo-600'
                                            }`}>
                                            {req.leaveType}
                                        </span>
                                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg w-fit ${req.type === 'Half Day' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                                            {req.type || 'Full Day'}
                                        </span>
                                    </div>
                                </td>
                                <td className="p-6">
                                    <div className="flex items-center gap-2 text-gray-700">
                                        <Calendar size={14} className="text-gray-300" />
                                        <span className="text-sm font-bold">
                                            {format(parseISO(req.startDate), "MMM d")} - {format(parseISO(req.endDate), "MMM d, yyyy")}
                                        </span>
                                         <span className={`text-[10px] font-black px-2 py-1 rounded-xl ml-2 flex items-center gap-1 ${req.type === 'Half Day' ? 'bg-amber-50 text-amber-600 ring-1 ring-amber-100' : 'bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100'}`}>
                                              {req.totalDays} {req.totalDays <= 1 ? 'Day' : 'Days'} 
                                             {req.type === 'Half Day' && (
                                                 <span className="bg-amber-600 text-white px-1.5 py-0.5 rounded-md text-[8px] uppercase ring-1 ring-amber-200">
                                                     {req.half === 'First Half' ? '1st Half' : '2nd Half'}
                                                 </span>
                                             )}
                                         </span>
                                    </div>
                                </td>
                                <td className="p-6 max-w-xs text-center border-l border-gray-100">
                                    <div className="flex items-start gap-2">
                                        <MessageSquare size={14} className="text-gray-300 mt-1 shrink-0" />
                                        <p className="text-sm text-gray-600 line-clamp-2 italic">"{req.employeeComment || "No comment"}"</p>
                                    </div>
                                </td>
                                <td className="p-6 text-center">
                                    {req.attachment ? (
                                        <a
                                            href={`${IMAGE_BASE_URL}/uploads/${req.attachment}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-600 hover:text-white transition-all uppercase tracking-tighter inline-flex items-center gap-1"
                                        >
                                            <Calendar size={12} /> View
                                        </a>
                                    ) : (
                                        <span className="text-[9px] font-bold text-gray-300 uppercase italic">None</span>
                                    )}
                                </td>
                                <td className="p-6">
                                    <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${req.status === 'Approved' ? 'text-green-600' :
                                        req.status === 'Rejected' ? 'text-red-600' : 'text-amber-600'
                                        }`}>
                                        {req.status === 'Approved' ? <CheckCircle size={14} /> :
                                            req.status === 'Rejected' ? <XCircle size={14} /> : <Clock size={14} />}
                                        {req.status}
                                    </div>
                                </td>
                                <td className="p-6">
                                    <div className="flex items-center justify-center gap-2">
                                        {req.status === "Pending" ? (
                                            <>
                                                <button
                                                    onClick={() => openActionModal(req, "Approved")}
                                                    disabled={actionLoading === req._id}
                                                    className="p-2.5 bg-green-50 text-green-600 rounded-xl hover:bg-green-600 hover:text-white transition-all shadow-sm hover:shadow-lg hover:shadow-green-100"
                                                    title="Approve"
                                                >
                                                    <CheckCircle size={18} />
                                                </button>
                                                <button
                                                    onClick={() => openActionModal(req, "Rejected")}
                                                    disabled={actionLoading === req._id}
                                                    className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm hover:shadow-lg hover:shadow-red-100"
                                                    title="Reject"
                                                >
                                                    <XCircle size={18} />
                                                </button>
                                            </>
                                        ) : (
                                            <div className="text-[10px] font-bold text-gray-400 uppercase bg-gray-50 px-4 py-2 rounded-xl italic">
                                                Processed
                                            </div>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {requests.length === 0 && (
                            <tr>
                                <td colSpan="7" className="p-20 text-center text-gray-400 italic">No leave requests found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* CUSTOM ACTION MODAL */}
            {modal.show && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md flex items-center justify-center p-4 z-[60] animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-gray-50 flex justify-between items-start bg-gradient-to-br from-indigo-50/30 to-white">
                            <div className="flex items-center gap-4">
                                <ProfileAvatar user={modal.employee} className="w-14 h-14 shadow-lg ring-4 ring-white" />
                                <div>
                                    <span className={`font-black uppercase text-[10px] tracking-widest mb-1 block ${modal.status === 'Approved' ? 'text-green-600' : 'text-red-600'}`}>
                                        {modal.status} Leave Request
                                    </span>
                                    <h3 className="text-2xl font-black text-gray-900 leading-tight">{modal.employeeName}</h3>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-tight">{modal.employee?.email}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setModal({ ...modal, show: false })}
                                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                                disabled={actionLoading}
                            >
                                <X size={24} className="text-gray-400" />
                            </button>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-gray-50 rounded-2xl">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Leave Type</p>
                                    <p className="font-bold text-gray-900">{modal.leaveType}</p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-2xl">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Duration</p>
                                    <p className="font-bold text-gray-900">{modal.duration}</p>
                                </div>
                            </div>

                            <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Employee Attachment</p>
                                {modal.attachment ? (
                                    <div className="flex gap-3">
                                        <a
                                            href={`${IMAGE_BASE_URL}/uploads/${modal.attachment}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 px-4 py-2.5 bg-white border border-indigo-200 text-indigo-600 rounded-xl text-xs font-black uppercase text-center hover:bg-indigo-600 hover:text-white transition-all shadow-sm flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle size={14} /> View Document
                                        </a>
                                        <a
                                            href={`${IMAGE_BASE_URL}/uploads/${modal.attachment}`}
                                            download
                                            className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase text-center hover:bg-indigo-700 transition-all shadow-md flex items-center justify-center gap-2"
                                        >
                                            <Clock size={14} /> Download
                                        </a>
                                    </div>
                                ) : (
                                    <p className="text-sm font-bold text-indigo-300 italic">No document attached.</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-2">Admin Comment (Optional)</label>
                                <textarea
                                    className="w-full px-5 py-4 bg-gray-50 rounded-2xl border border-gray-100 outline-none focus:ring-2 focus:ring-indigo-100 font-bold text-sm text-gray-700 h-32 resize-none transition-all placeholder:text-gray-300"
                                    placeholder={`Reason for ${modal.status.toLowerCase()}...`}
                                    value={modal.comment}
                                    onChange={(e) => setModal({ ...modal, comment: e.target.value })}
                                    disabled={actionLoading}
                                />
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setModal({ ...modal, show: false })}
                                    className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-black text-sm hover:bg-gray-200 transition-all"
                                    disabled={actionLoading}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleStatusUpdate}
                                    disabled={actionLoading}
                                    className={`flex-1 py-4 text-white rounded-2xl font-black text-sm shadow-xl transition-all hover:-translate-y-1 ${modal.status === 'Approved' ? 'bg-green-600 shadow-green-100' : 'bg-red-600 shadow-red-100'
                                        }`}
                                >
                                    {actionLoading ? "Processing..." : `Confirm ${modal.status}`}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LeaveRequestsTable;
