import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Plus, Search, Filter, MoreVertical, Download,
  Trash2, Edit, CheckCircle, Clock, CreditCard,
  Users, DollarSign, FileText, ChevronRight, X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";

const API_BASE_URL = "http://localhost:5000/api";

const Payroll = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [filters, setFilters] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    search: "",
    department: "All"
  });

  // Stats
  const [stats, setStats] = useState({
    totalEmployees: 0,
    generated: 0,
    approved: 0,
    paid: 0,
    totalPayout: 0,
    pending: 0
  });

  useEffect(() => {
    fetchData();
  }, [filters.month, filters.year]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [payrollRes, employeeRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/payroll`, { withCredentials: true }),
        axios.get(`${API_BASE_URL}/employees`, { withCredentials: true })
      ]);

      const filteredPayrolls = payrollRes.data.filter(p =>
        p.month === parseInt(filters.month) && p.year === parseInt(filters.year)
      );

      setPayrolls(filteredPayrolls);
      setEmployees(employeeRes.data);
      calculateStats(filteredPayrolls, employeeRes.data.length);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch payroll data");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (payrollData, totalEmp) => {
    const approved = payrollData.filter(p => p.status === "APPROVED").length;
    const paid = payrollData.filter(p => p.status === "PAID").length;
    const totalPayout = payrollData.filter(p => p.status === "PAID").reduce((acc, p) => acc + p.netSalary, 0);

    setStats({
      totalEmployees: totalEmp,
      generated: payrollData.length,
      approved,
      paid,
      totalPayout,
      pending: payrollData.filter(p => p.status === "DRAFT").length
    });
  };

  const handleAction = async (id, action) => {
    try {
      let endpoint = "";
      if (action === "approve") endpoint = `/payroll/approve/${id}`;
      if (action === "pay") endpoint = `/payroll/pay/${id}`;
      if (action === "delete") {
        if (!window.confirm("Are you sure you want to delete this payroll?")) return;
        await axios.delete(`${API_BASE_URL}/payroll/${id}`, { withCredentials: true });
        toast.success("Payroll deleted successfully");
        fetchData();
        return;
      }

      await axios.put(`${API_BASE_URL}${endpoint}`, {}, { withCredentials: true });
      toast.success(`Payroll ${action}d successfully`);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${action} payroll`);
    }
  };

  const handleDownload = async (id, month, year) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/payroll/payslip/${id}`, {
        withCredentials: true,
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
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Payroll Management</h1>
          <p className="text-gray-500 text-sm">Manage and process employee salaries efficiently</p>
        </div>
        <button
          onClick={() => {
            setIsEditMode(false);
            setSelectedPayroll(null);
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95 transition-all"
        >
          <Plus size={18} />
          <span>Generate Payroll</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <StatCard title="Total Employees" value={stats.totalEmployees} icon={<Users className="text-blue-600" />} color="bg-blue-50" />
        <StatCard title="Generated" value={stats.generated} icon={<FileText className="text-indigo-600" />} color="bg-indigo-50" />
        <StatCard title="Approved" value={stats.approved} icon={<CheckCircle className="text-emerald-600" />} color="bg-emerald-50" />
        <StatCard title="Paid" value={stats.paid} icon={<CreditCard className="text-green-600" />} color="bg-green-50" />
        <StatCard title="Total Payout" value={`₹${stats.totalPayout.toLocaleString()}`} icon={<DollarSign className="text-violet-600" />} color="bg-violet-50" />
        <StatCard title="Pending" value={stats.pending} icon={<Clock className="text-amber-600" />} color="bg-amber-50" />
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by name or code..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>
        <select
          value={filters.month}
          onChange={(e) => setFilters({ ...filters, month: e.target.value })}
          className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
        >
          {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((m, i) => (
            <option key={i + 1} value={i + 1}>{m}</option>
          ))}
        </select>
        <select
          value={filters.year}
          onChange={(e) => setFilters({ ...filters, year: e.target.value })}
          className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
        >
          {[2024, 2025, 2026].map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Department</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Gross Salary</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Deductions</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Net Salary</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
              ) : payrolls.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <FileText size={48} className="text-gray-200 mb-2" />
                      <p>No payroll records found for this period.</p>
                    </div>
                  </td>
                </tr>
              ) : payrolls.filter(p =>
                p.employeeDetails.fullName.toLowerCase().includes(filters.search.toLowerCase()) ||
                p.employeeDetails.employeeCode.toLowerCase().includes(filters.search.toLowerCase())
              ).map((payroll) => (
                <tr key={payroll._id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs uppercase">
                        {payroll.employeeDetails.fullName.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{payroll.employeeDetails.fullName}</p>
                        <p className="text-xs text-gray-400">#{payroll.employeeDetails.employeeCode}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">{payroll.employeeDetails.department}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-800">₹{payroll.grossSalary.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4 text-red-500 text-sm">
                    -₹{payroll.totalDeductions.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-900 text-sm">
                    ₹{payroll.netSalary.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${getStatusColor(payroll.status)}`}>
                      {payroll.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {payroll.status === "DRAFT" && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedPayroll(payroll);
                              setIsEditMode(true);
                              setIsModalOpen(true);
                            }}
                            className="p-2 hover:bg-gray-100 rounded-lg text-indigo-600" title="Edit"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleAction(payroll._id, "approve")}
                            className="p-2 hover:bg-gray-100 rounded-lg text-emerald-600" title="Approve"
                          >
                            <CheckCircle size={16} />
                          </button>
                          <button
                            onClick={() => handleAction(payroll._id, "delete")}
                            className="p-2 hover:bg-gray-100 rounded-lg text-red-600" title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                      {payroll.status === "APPROVED" && (
                        <button
                          onClick={() => handleAction(payroll._id, "pay")}
                          className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 transition-colors shadow-sm"
                        >
                          <CreditCard size={14} />
                          Mark Paid
                        </button>
                      )}
                      {payroll.status === "PAID" && (
                        <button
                          onClick={() => handleDownload(payroll._id, payroll.month, payroll.year)}
                          className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-200 transition-colors"
                        >
                          <Download size={14} />
                          Payslip
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <PayrollModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            employees={employees}
            isEdit={isEditMode}
            data={selectedPayroll}
            refresh={fetchData}
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
    className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between"
  >
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs font-medium text-gray-500">{title}</span>
      <div className={`p-2 rounded-xl ${color}`}>
        {icon}
      </div>
    </div>
    <span className="text-lg font-bold text-gray-800">{value}</span>
  </motion.div>
);

const SkeletonRow = () => (
  <tr className="animate-pulse">
    <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-gray-200 rounded-full"></div><div><div className="h-3 w-24 bg-gray-200 rounded mb-1"></div><div className="h-2 w-16 bg-gray-100 rounded"></div></div></div></td>
    <td className="px-6 py-4"><div className="h-3 w-20 bg-gray-200 rounded"></div></td>
    <td className="px-6 py-4"><div className="h-3 w-16 bg-gray-200 rounded"></div></td>
    <td className="px-6 py-4"><div className="h-3 w-16 bg-gray-100 rounded"></div></td>
    <td className="px-6 py-4"><div className="h-3 w-16 bg-gray-200 rounded font-bold"></div></td>
    <td className="px-6 py-4"><div className="h-6 w-16 bg-gray-100 rounded-full"></div></td>
    <td className="px-6 py-4"><div className="h-8 w-24 bg-gray-100 rounded-lg"></div></td>
  </tr>
);

const PayrollModal = ({ isOpen, onClose, employees, isEdit, data, refresh }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: data?.employeeId?._id || data?.employeeId || "",
    month: data?.month || new Date().getMonth() + 1,
    year: data?.year || new Date().getFullYear(),
    salaryStructure: {
      basicSalary: data?.salaryStructure?.basicSalary || 0,
      hra: data?.salaryStructure?.hra || 0,
      allowance: data?.salaryStructure?.allowance || 0,
      specialAllowance: data?.salaryStructure?.specialAllowance || 0,
    },
    earnings: data?.earnings || [],
    deductions: data?.deductions || [],
    taxPercentage: data?.taxPercentage || 0,
    pfPercentage: data?.pfPercentage || 0,
    esiPercentage: data?.esiPercentage || 0,
    professionalTax: data?.professionalTax || 0,
    unpaidLeaves: data?.unpaidLeaves || 0,
    totalWorkingDays: data?.totalWorkingDays || 30,
  });

  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (formData.salaryStructure.basicSalary > 0) {
      calculatePreview();
    }
  }, [formData]);

  const calculatePreview = () => {
    const fixed =
      parseFloat(formData.salaryStructure.basicSalary) +
      parseFloat(formData.salaryStructure.hra || 0) +
      parseFloat(formData.salaryStructure.allowance || 0) +
      parseFloat(formData.salaryStructure.specialAllowance || 0);

    const extraEarnings = formData.earnings.reduce((acc, item) => acc + (parseFloat(item.amount) || 0), 0);
    const leaveDeduction = (fixed / formData.totalWorkingDays) * formData.unpaidLeaves;

    const tax = (fixed * formData.taxPercentage) / 100;
    const pf = (fixed * formData.pfPercentage) / 100;
    const esi = (fixed * formData.esiPercentage) / 100;

    const extraDeductions = formData.deductions.reduce((acc, item) => acc + (parseFloat(item.amount) || 0), 0);

    const totalEarnings = fixed + extraEarnings;
    const totalDeductions = tax + pf + esi + (parseFloat(formData.professionalTax) || 0) + leaveDeduction + extraDeductions;
    const netSalary = totalEarnings - totalDeductions;

    setPreview({
      gross: totalEarnings,
      deductions: totalDeductions,
      net: netSalary
    });
  };

  const addEarning = () => setFormData({ ...formData, earnings: [...formData.earnings, { componentName: "", amount: 0 }] });
  const addDeduction = () => setFormData({ ...formData, deductions: [...formData.deductions, { componentName: "", amount: 0 }] });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.employeeId) return toast.error("Please select an employee");

    setLoading(true);
    try {
      if (isEdit) {
        await axios.put(`${API_BASE_URL}/payroll/${data._id}`, formData, { withCredentials: true });
        toast.success("Payroll updated successfully");
      } else {
        await axios.post(`${API_BASE_URL}/payroll/generate`, formData, { withCredentials: true });
        toast.success("Payroll generated as Draft");
      }
      refresh();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-800">{isEdit ? "Edit Payroll" : "Generate Monthly Payroll"}</h2>
            <p className="text-sm text-gray-400">Enter salary details for the selected employee</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row h-full overflow-hidden">
          {/* Form Area */}
          <form id="payroll-form" onSubmit={handleSubmit} className="flex-1 p-6 overflow-y-auto space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500">Employee</label>
                <select
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all shadow-sm"
                  value={formData.employeeId}
                  disabled={isEdit}
                  onChange={(e) => {
                    const emp = employees.find(emp => emp._id === e.target.value);
                    if (emp && emp.salaryStructure) {
                      setFormData({
                        ...formData,
                        employeeId: e.target.value,
                        salaryStructure: {
                          basicSalary: emp.salaryStructure.basicSalary || 0,
                          hra: emp.salaryStructure.hra || 0,
                          allowance: emp.salaryStructure.allowance || 0,
                          specialAllowance: emp.salaryStructure.specialAllowance || 0,
                        }
                      });
                    } else {
                      setFormData({ ...formData, employeeId: e.target.value });
                    }
                  }}
                >
                  <option value="">Select Employee</option>
                  {employees.map(emp => (
                    <option key={emp._id} value={emp._id}>{emp.firstName} {emp.lastName} ({emp.employeeCode})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500">Month</label>
                  <select
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    value={formData.month}
                    onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                  >
                    {[...Array(12)].map((_, i) => <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('en', { month: 'long' })}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500">Year</label>
                  <select
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  >
                    {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Salary Structure */}
            <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
              <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                <FileText size={16} className="text-indigo-500" />
                Salary Structure (Monthly)
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {Object.keys(formData.salaryStructure).map(key => (
                  <div key={key} className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">{key.replace(/([A-Z])/g, ' $1')}</label>
                    <input
                      type="number"
                      value={formData.salaryStructure[key]}
                      onChange={(e) => setFormData({
                        ...formData,
                        salaryStructure: { ...formData.salaryStructure, [key]: e.target.value }
                      })}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Attendance & Deductions Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-700 flex items-center justify-between">
                  <span>Earnings (Extra)</span>
                  <button type="button" onClick={addEarning} className="text-indigo-600 text-[10px] font-bold uppercase hover:underline">+ Add Row</button>
                </h3>
                {formData.earnings.map((e, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      placeholder="Bonus/Incentive"
                      value={e.componentName}
                      onChange={(ev) => {
                        const newEarnings = [...formData.earnings];
                        newEarnings[i].componentName = ev.target.value;
                        setFormData({ ...formData, earnings: newEarnings });
                      }}
                      className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm shadow-sm"
                    />
                    <input
                      type="number"
                      placeholder="Amount"
                      value={e.amount}
                      onChange={(ev) => {
                        const newEarnings = [...formData.earnings];
                        newEarnings[i].amount = ev.target.value;
                        setFormData({ ...formData, earnings: newEarnings });
                      }}
                      className="w-24 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm shadow-sm"
                    />
                  </div>
                ))}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 text-red-500">Unpaid Leaves</label>
                    <input
                      type="number"
                      value={formData.unpaidLeaves}
                      onChange={(e) => setFormData({ ...formData, unpaidLeaves: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm shadow-sm border-red-100"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500">Working Days</label>
                    <input
                      type="number"
                      value={formData.totalWorkingDays}
                      onChange={(e) => setFormData({ ...formData, totalWorkingDays: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm shadow-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-700 flex items-center justify-between">
                  <span>Deductions (Other)</span>
                  <button type="button" onClick={addDeduction} className="text-indigo-600 text-[10px] font-bold uppercase hover:underline">+ Add Row</button>
                </h3>
                {formData.deductions.map((e, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      placeholder="Fine/Other"
                      value={e.componentName}
                      onChange={(ev) => {
                        const newDeductions = [...formData.deductions];
                        newDeductions[i].componentName = ev.target.value;
                        setFormData({ ...formData, deductions: newDeductions });
                      }}
                      className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm shadow-sm"
                    />
                    <input
                      type="number"
                      placeholder="Amount"
                      value={e.amount}
                      onChange={(ev) => {
                        const newDeductions = [...formData.deductions];
                        newDeductions[i].amount = ev.target.value;
                        setFormData({ ...formData, deductions: newDeductions });
                      }}
                      className="w-24 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm shadow-sm"
                    />
                  </div>
                ))}

                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Tax %", key: "taxPercentage" },
                    { label: "PF %", key: "pfPercentage" },
                    { label: "ESI %", key: "esiPercentage" },
                    { label: "P.Tax (₹)", key: "professionalTax" },
                  ].map(item => (
                    <div key={item.key} className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase">{item.label}</label>
                      <input
                        type="number"
                        value={formData[item.key]}
                        onChange={(e) => setFormData({ ...formData, [item.key]: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </form>

          {/* Preview Panel */}
          <div className="w-full lg:w-72 bg-gray-50 p-6 border-l border-gray-100 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-700 mb-6 flex items-center gap-2">
                <DollarSign size={16} className="text-green-500" />
                Live Preview
              </h3>

              <div className="space-y-4">
                <div className="flex flex-col">
                  <span className="text-xs text-gray-400 uppercase font-bold tracking-tight">Gross Payout</span>
                  <span className="text-xl font-bold text-gray-800">₹{preview?.gross.toLocaleString() || '--'}</span>
                </div>
                <div className="h-px bg-gray-200" />
                <div className="flex flex-col">
                  <span className="text-xs text-gray-400 uppercase font-bold tracking-tight">Total Deductions</span>
                  <span className="text-lg font-semibold text-red-500">-₹{preview?.deductions.toLocaleString() || '--'}</span>
                </div>
                <div className="mt-4 p-4 bg-indigo-600 rounded-2xl text-white shadow-xl shadow-indigo-100 ring-4 ring-indigo-50">
                  <span className="text-[10px] uppercase font-bold opacity-80 mt-2">Net Payable Salary</span>
                  <p className="text-2xl font-black mb-1">₹{preview?.net.toLocaleString() || '--'}</p>
                </div>
              </div>
            </div>

            <div className="mt-8 space-y-3">
              <button
                type="submit"
                form="payroll-form"
                disabled={loading}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all disabled:opacity-50"
              >
                {loading ? "Processing..." : isEdit ? "Update Payroll" : "Save as Draft"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 bg-white text-gray-500 rounded-xl font-bold text-sm border border-gray-200 hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
};

export default Payroll;