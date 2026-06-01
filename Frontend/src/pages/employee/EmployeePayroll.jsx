import React, { useState, useEffect } from "react";
import axios from "../../api/axios"; // Unified axios instance
import {
  DollarSign, Download, Eye, FileText,
  Calendar, CheckCircle, Clock, CreditCard,
  ChevronRight, X, AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";

const EmployeePayroll = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    currentStatus: "N/A",
    lastPaid: 0,
    yearlyTotal: 0,
    pending: 0
  });

  useEffect(() => {
    fetchMyPayrolls();
  }, []);

  const fetchMyPayrolls = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/payroll/my/list");
      setPayrolls(res.data);
      calculateStats(res.data);
    } catch (error) {
      console.error("Error fetching payrolls:", error);
      toast.error("Failed to load payroll history");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const current = data.find(p => p.month === currentMonth && p.year === currentYear);
    const paidList = data.filter(p => p.status === "PAID").sort((a, b) => {
      if (b.year !== a.year) return b.year - a.year;
      return b.month - a.month;
    });

    const lastPaid = paidList.length > 0 ? paidList[0].netSalary : 0;
    const yearlyTotal = paidList.filter(p => p.year === currentYear).reduce((acc, p) => acc + p.netSalary, 0);
    const pending = data.filter(p => p.status !== "PAID").length;

    setStats({
      currentStatus: current ? current.status : "Not Generated",
      lastPaid,
      yearlyTotal,
      pending
    });
  };

  const handleDownload = async (id, month, year) => {
    try {
      const response = await axios.get(`/payroll/payslip/${id}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payslip_${month}_${year}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Payslip downloaded successfully");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download payslip");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "DRAFT": return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "APPROVED": return "bg-blue-100 text-blue-700 border-blue-200";
      case "PAID": return "bg-green-100 text-green-700 border-green-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="p-6 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">My Payroll & Earnings</h1>
        <p className="text-gray-500 text-sm">View your salary history and download payslips</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Current Month Status"
          value={stats.currentStatus}
          icon={<Clock className="text-indigo-600" />}
          color="bg-indigo-50"
        />
        <StatCard
          title="Last Paid Salary"
          value={`₹${stats.lastPaid.toLocaleString()}`}
          icon={<DollarSign className="text-green-600" />}
          color="bg-green-50"
        />
        <StatCard
          title="Total Paid (This Year)"
          value={`₹${stats.yearlyTotal.toLocaleString()}`}
          icon={<CreditCard className="text-blue-600" />}
          color="bg-blue-50"
        />
        <StatCard
          title="Pending Payrolls"
          value={stats.pending}
          icon={<AlertCircle className="text-amber-600" />}
          color="bg-amber-50"
        />
      </div>

      {/* Salary History */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex items-center justify-between">
          <h2 className="font-bold text-gray-800 flex items-center gap-2">
            <Calendar size={18} className="text-indigo-500" />
            Salary History
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Period</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Gross Salary</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Total Deduction</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Net Salary</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                [...Array(3)].map((_, i) => <SkeletonRow key={i} />)
              ) : payrolls.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500 font-medium">
                    No payroll records found.
                  </td>
                </tr>
              ) : (
                payrolls.map((p) => (
                  <tr key={p._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-gray-800">
                        {new Date(0, p.month - 1).toLocaleString('en', { month: 'long' })} {p.year}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">₹{p.grossSalary.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-red-500">-₹{p.totalDeductions.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900">₹{p.netSalary.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${getStatusColor(p.status)}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => {
                            setSelectedPayroll(p);
                            setIsModalOpen(true);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-100"
                        >
                          <Eye size={14} />
                          Details
                        </button>
                        <button
                          disabled={p.status !== "PAID"}
                          onClick={() => handleDownload(p._id, p.month, p.year)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all border ${p.status === "PAID"
                            ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-100"
                            : "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-100"
                            }`}
                        >
                          <Download size={14} />
                          {p.status === "PAID" ? "Download" : "Pending"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Breakdown Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <BreakdownModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            data={selectedPayroll}
            handleDownload={handleDownload}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
  >
    <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center mb-4`}>
      {icon}
    </div>
    <p className="text-sm font-medium text-gray-400 mb-1">{title}</p>
    <p className="text-2xl font-bold text-gray-800">{value}</p>
  </motion.div>
);

const SkeletonRow = () => (
  <tr className="animate-pulse">
    <td className="px-6 py-4"><div className="h-4 w-24 bg-gray-200 rounded"></div></td>
    <td className="px-6 py-4"><div className="h-4 w-20 bg-gray-100 rounded"></div></td>
    <td className="px-6 py-4"><div className="h-4 w-20 bg-gray-100 rounded"></div></td>
    <td className="px-6 py-4"><div className="h-4 w-20 bg-gray-200 rounded font-bold"></div></td>
    <td className="px-6 py-4"><div className="h-6 w-16 bg-gray-100 rounded-full"></div></td>
    <td className="px-6 py-4"><div className="flex justify-end gap-3"><div className="h-8 w-16 bg-gray-100 rounded-lg"></div><div className="h-8 w-20 bg-gray-100 rounded-lg"></div></div></td>
  </tr>
);

const BreakdownModal = ({ isOpen, onClose, data, handleDownload }) => {
  if (!data) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100"
      >
        {/* Header Block */}
        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-gradient-to-br from-slate-50 to-white">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Salary Statement</span>
            </div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">
              {new Date(0, data.month - 1).toLocaleString('en', { month: 'long' })} {data.year}
            </h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-3 hover:bg-slate-100 rounded-2xl text-slate-400 transition-all active:scale-95"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-10 overflow-y-auto max-h-[70vh] custom-scrollbar">
          {/* Quick Info Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <QuickStat label="Working Days" value={data.totalWorkingDays || 0} icon={<Calendar size={14} />} />
            <QuickStat label="Days Present" value={data.presentDays || 0} icon={<CheckCircle size={14} />} />
            <QuickStat label="Paid Leaves" value={data.paidLeavesTaken || 0} icon={<CreditCard size={14} />} color="text-emerald-500" />
            <QuickStat label="Unpaid Leaves" value={data.unpaidLeaves || 0} icon={<AlertCircle size={14} />} color="text-rose-500" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Earnings Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500">
                  <DollarSign size={16} />
                </div>
                <h3 className="text-sm font-bold text-slate-700">Earnings</h3>
              </div>
              <div className="space-y-4">
                <BreakdownItem label="Basic Salary" value={data.salaryStructure.basicSalary} />
                {data.earnings.map((e, i) => (
                  <BreakdownItem key={i} label={e.componentName} value={e.amount} isExtra />
                ))}
              </div>
              <div className="pt-4 mt-4 border-t border-dashed border-slate-200 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400 uppercase">Gross Earnings</span>
                <span className="text-sm font-black text-indigo-600">₹{data.grossSalary.toLocaleString()}</span>
              </div>
            </div>

            {/* Deductions Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500">
                  <CreditCard size={16} />
                </div>
                <h3 className="text-sm font-bold text-slate-700">Deductions</h3>
              </div>
              <div className="space-y-4">
                {data.taxPercentage > 0 && <BreakdownItem label={`Income Tax (${data.taxPercentage}%)`} value={(data.salaryStructure.basicSalary * data.taxPercentage) / 100} isDeduction />}
                {data.pfPercentage > 0 && <BreakdownItem label={`Provident Fund (${data.pfPercentage}%)`} value={(data.salaryStructure.basicSalary * data.pfPercentage) / 100} isDeduction />}
                {data.esiPercentage > 0 && <BreakdownItem label={`ESI (${data.esiPercentage}%)`} value={(data.salaryStructure.basicSalary * data.esiPercentage) / 100} isDeduction />}
                {data.professionalTax > 0 && <BreakdownItem label="Professional Tax" value={data.professionalTax} isDeduction />}
                {data.leaveDeduction > 0 && <BreakdownItem label="Loss of Pay (Leaves)" value={data.leaveDeduction} isDeduction />}
                {data.deductions.map((d, i) => (
                  <BreakdownItem key={i} label={d.componentName} value={d.amount} isDeduction />
                ))}
              </div>
              <div className="pt-4 mt-4 border-t border-dashed border-slate-200 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400 uppercase">Total Deductions</span>
                <span className="text-sm font-black text-rose-500">-₹{data.totalDeductions.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Net Pay Hero Block */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-slate-800 to-indigo-900 rounded-[1.5rem] blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
            <div className="relative flex flex-col md:flex-row items-center justify-between p-8 bg-slate-900 rounded-[1.5rem] text-white shadow-xl">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mb-2">Net Payable Amount</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black tracking-tight">₹{data.netSalary.toLocaleString()}</span>
                  <span className="text-xs text-slate-400 font-medium">Valid for current month</span>
                </div>
              </div>
              <div className="mt-6 md:mt-0 flex flex-col md:items-end gap-2">
                <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border ${
                  data.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}>
                  {data.status === 'PAID' ? <><CheckCircle size={12} /> Confirmed & Paid</> : <><Clock size={12} /> Under Processing</>}
                </div>
                {data.paymentDate && (
                  <p className="text-[10px] text-slate-400 font-medium">Transferred on {new Date(data.paymentDate).toLocaleDateString()}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-[10px] text-slate-400 italic">Generated by Finesse Payroll System Engine v2.0</p>
          <div className="flex gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-8 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-100 hover:border-slate-300 transition-all"
            >
              Dismiss
            </button>
            {data.status === "PAID" && (
              <button
                onClick={() => handleDownload(data._id, data.month, data.year)}
                className="flex-1 sm:flex-none px-8 py-3 bg-slate-900 text-white rounded-2xl text-xs font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200 active:scale-95"
              >
                <Download size={16} /> Get PDF Payslip
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const QuickStat = ({ label, value, icon, color = "text-slate-600" }) => (
  <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50 flex flex-col gap-1">
    <div className="flex items-center gap-2 text-slate-400">
      {icon}
      <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
    </div>
    <span className={`text-sm font-black ${color}`}>{value}</span>
  </div>
);

const BreakdownItem = ({ label, value, isExtra, isDeduction }) => (
  <div className="flex items-center justify-between group">
    <div className="flex items-center gap-2">
      <div className={`w-1 h-1 rounded-full transition-all group-hover:scale-[2] ${isDeduction ? 'bg-rose-400' : isExtra ? 'bg-indigo-400' : 'bg-slate-300'}`} />
      <span className={`text-xs font-medium transition-colors ${isExtra ? 'text-indigo-600' : 'text-slate-500 group-hover:text-slate-800'}`}>{label}</span>
    </div>
    <span className={`text-xs font-bold tabular-nums ${isDeduction ? 'text-rose-500' : 'text-slate-800'}`}>
      {isDeduction ? '−' : ''}₹{value?.toLocaleString() || '0'}
    </span>
  </div>
);

export default EmployeePayroll;