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
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Salary Breakdown</h2>
            <p className="text-sm text-gray-500">
              For {new Date(0, data.month - 1).toLocaleString('en', { month: 'long' })} {data.year}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-8 overflow-y-auto max-h-[70vh]">
          {/* Summary Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-indigo-50 rounded-2xl">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Gross Salary</span>
              <p className="text-xl font-bold text-indigo-900">₹{data.grossSalary.toLocaleString()}</p>
            </div>
            <div className="p-4 bg-red-50 rounded-2xl">
              <span className="text-[10px] font-bold text-red-300 uppercase tracking-wider">Total Deductions</span>
              <p className="text-xl font-bold text-red-900">-₹{data.totalDeductions.toLocaleString()}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Earnings */}
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <div className="w-1.5 h-4 bg-indigo-500 rounded-full" />
                Earnings
              </h3>
              <div className="space-y-3">
                <BreakdownItem label="Basic Salary" value={data.salaryStructure.basicSalary} />
                {data.earnings.map((e, i) => (
                  <BreakdownItem key={i} label={e.componentName} value={e.amount} isExtra />
                ))}
              </div>
            </div>

            {/* Deductions */}
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <div className="w-1.5 h-4 bg-red-500 rounded-full" />
                Deductions
              </h3>
              <div className="space-y-3">
                <BreakdownItem label={`Tax (${data.taxPercentage}%)`} value={(data.salaryStructure.basicSalary * data.taxPercentage) / 100} isDeduction />
                <BreakdownItem label={`PF (${data.pfPercentage}%)`} value={(data.salaryStructure.basicSalary * data.pfPercentage) / 100} isDeduction />
                <BreakdownItem label={`ESI (${data.esiPercentage}%)`} value={(data.salaryStructure.basicSalary * data.esiPercentage) / 100} isDeduction />
                <BreakdownItem label="Professional Tax" value={data.professionalTax} isDeduction />
                <BreakdownItem label="Leave Deduction" value={data.leaveDeduction} isDeduction />
                {data.deductions.map((d, i) => (
                  <BreakdownItem key={i} label={d.componentName} value={d.amount} isDeduction />
                ))}
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100">
            <div className="flex items-center justify-between p-6 bg-gray-900 rounded-2xl text-white">
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase">Net Payable Amount</p>
                <p className="text-2xl font-black">₹{data.netSalary.toLocaleString()}</p>
              </div>
              {data.status === "PAID" && (
                <div className="text-right">
                  <p className="text-[10px] text-gray-500 uppercase">Status</p>
                  <p className="text-sm font-bold text-emerald-400 flex items-center gap-1"><CheckCircle size={14} /> Paid</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          {data.status === "PAID" && (
            <button
              onClick={() => handleDownload(data._id, data.month, data.year)}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all flex items-center gap-2"
            >
              <Download size={16} /> Download Payslip
            </button>
          )}
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-all"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const BreakdownItem = ({ label, value, isExtra, isDeduction }) => (
  <div className="flex items-center justify-between">
    <span className={`text-sm ${isExtra ? 'text-indigo-600 font-medium' : 'text-gray-500'}`}>{label}</span>
    <span className={`text-sm font-semibold ${isDeduction ? 'text-red-500' : 'text-gray-800'}`}>
      {isDeduction ? '-' : ''}₹{value?.toLocaleString() || '0'}
    </span>
  </div>
);

export default EmployeePayroll;