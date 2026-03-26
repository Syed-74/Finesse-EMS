import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import ProfileAvatar from "../../../components/ProfileAvatar";
import { useAuth } from "../../../AuthContext/AuthContext";
import {
  Search,
  Filter,
  Edit3,
  Trash2,
  UserCheck,
  UserX,
  ChevronDown,
  ChevronUp,
  Download,
  CheckCircle2,
  Briefcase,
  User,
  MapPin,
  ArrowRight,
  ArrowLeft,
  DollarSign
} from "lucide-react";

// Configure base API_URL
const API_URL = "http://localhost:5000/api/employees";

const STEPS = [
  { id: 1, title: "Personal", icon: User },
  { id: 2, title: "Professional", icon: Briefcase },
  { id: 3, title: "Address", icon: MapPin },
  { id: 4, title: "Salary Structure", icon: DollarSign },
];

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [roleFilter, setRoleFilter] = useState("All");
  const [sortConfig, setSortConfig] = useState({ key: "createdAt", direction: "desc" });

  // Modal State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Active"); // "Active" or "Pending"
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [confirmAction, setConfirmAction] = useState({ type: "", action: () => { } });

  const { admin: authAdmin, loading: authLoading } = useAuth();

  // Fetch Employees
  useEffect(() => {
    if (!authLoading && authAdmin) {
      fetchEmployees();
    }
  }, [authLoading, authAdmin]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      // Fetch all employees; we'll filter by activeTab in useMemo
      const res = await axios.get(API_URL);
      setEmployees(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch employees", err);
    } finally {
      setLoading(false);
    }
  };

  // Derived Filtered & Sorted Employees
  const filteredEmployees = useMemo(() => {
    let result = [...employees];

    // Filter by tab first
    if (activeTab === "Active") {
        result = result.filter(e => e.isActive && e.status === "APPROVED");
    } else if (activeTab === "Pending") {
        result = result.filter(e => e.status === "PENDING" || e.status === "REJECTED");
    }

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(e =>
        e.firstName?.toLowerCase().includes(lower) ||
        e.lastName?.toLowerCase().includes(lower) ||
        e.email?.toLowerCase().includes(lower)
      );
    }

    if (statusFilter !== "All") {
      result = result.filter(e => {
        if (statusFilter === "Active") return e.isActive;
        if (statusFilter === "Inactive") return !e.isActive;
        if (statusFilter === "Pending") return e.status === "PENDING";
        if (statusFilter === "Rejected") return e.status === "REJECTED";
        return true;
      });
    }

    if (roleFilter !== "All") {
      result = result.filter(e => e.department === roleFilter);
    }

    if (sortConfig.key) {
      result.sort((a, b) => {
        const aVal = sortConfig.key.split('.').reduce((o, i) => (o ? o[i] : ""), a) || "";
        const bVal = sortConfig.key.split('.').reduce((o, i) => (o ? o[i] : ""), b) || "";
        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [employees, searchTerm, statusFilter, roleFilter, sortConfig, activeTab]);

  const stats = useMemo(() => {
    const active = employees.filter(e => e.isActive && e.status === "APPROVED").length;
    const pending = employees.filter(e => e.status === "PENDING").length;
    const rejected = employees.filter(e => e.status === "REJECTED").length;
    return { active, pending, rejected };
  }, [employees]);

  // Validation
  const validateCurrentStep = () => {
    return true;
  };

  // Handlers
  const handleSort = (key) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === "asc" ? "desc" : "asc"
    }));
  };

  const handleSave = async () => {
    try {
      const id = currentEmployee._id || currentEmployee.employeeId;
      if (!id) return;

      // Construct full payload based on steps
      const payload = {
        firstName: currentEmployee.firstName,
        lastName: currentEmployee.lastName,
        mobileNumber: currentEmployee.mobileNumber,
        designation: currentEmployee.designation,
        department: currentEmployee.department,
        employmentType: currentEmployee.employmentType,
        dateOfJoining: currentEmployee.dateOfJoining,
        workLocation: currentEmployee.workLocation,
        officeDays: currentEmployee.officeDays || [],
        shift: currentEmployee.shift,
        attendanceRequired: currentEmployee.attendanceRequired,
        leaveBalance: currentEmployee.leaveBalance,
        weeklyOff: currentEmployee.weeklyOff,
        address: currentEmployee.address,
        city: currentEmployee.city,
        state: currentEmployee.state,
        country: currentEmployee.country,
        emergencyContact: currentEmployee.emergencyContact,
        isActive: currentEmployee.isActive,
        salaryStructure: currentEmployee.salaryStructure,
      };

      await axios.put(`${API_URL}/${id}`, payload);
      fetchEmployees();
      setIsEditOpen(false);
      setCurrentStep(1);
    } catch (error) {
      console.error("Error saving employee", error);
      alert("Failed to save changes.");
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/${id}`);
      fetchEmployees();
      setIsConfirmOpen(false);
    } catch (error) {
      console.error("Error deleting employee", error);
    }
  };

  const handleToggleStatus = async (emp) => {
    try {
      const id = emp._id || emp.employeeId;
      await axios.put(`${API_URL}/${id}`, { isActive: !emp.isActive });
      fetchEmployees();
      setIsConfirmOpen(false);
    } catch (error) {
      console.error("Error updating status", error);
    }
  };

  const handleApprove = async (id) => {
    try {
        await axios.put(`${API_URL}/${id}/approve`);
        fetchEmployees();
        setIsConfirmOpen(false);
    } catch (error) {
        console.error("Error approving employee", error);
        alert(error.response?.data?.message || "Failed to approve employee");
    }
  };

  const handleReject = async (id, reason) => {
    try {
        await axios.put(`${API_URL}/${id}/reject`, { reason });
        fetchEmployees();
        setIsConfirmOpen(false);
        setRejectionReason("");
    } catch (error) {
        console.error("Error rejecting employee", error);
        alert(error.response?.data?.message || "Failed to reject employee");
    }
  };

  const handleBulkApprove = async () => {
    try {
        await axios.post(`${API_URL}/bulk-approve`, { ids: selectedEmployees });
        fetchEmployees();
        setSelectedEmployees([]);
        setIsConfirmOpen(false);
    } catch (error) {
        console.error("Bulk approval error", error);
    }
  };

  const openEdit = (emp) => {
    // Populate with defaults to avoid null issues
    setCurrentEmployee({
      ...emp,
      mobileNumber: emp.mobileNumber || "",
      designation: emp.designation || "",
      department: emp.department || "",
      employmentType: emp.employmentType || "FULL_TIME",
      workLocation: emp.workLocation || "OFFICE",
      officeDays: emp.officeDays || [],
      shift: emp.shift || "DAY",
      attendanceRequired: emp.attendanceRequired ?? true,
      leaveBalance: emp.leaveBalance || 0,
      weeklyOff: emp.weeklyOff || ["SUNDAY"],
      address: emp.address || "",
      city: emp.city || "",
      state: emp.state || "",
      country: emp.country || "",
      emergencyContact: emp.emergencyContact || "",
      dateOfJoining: emp.dateOfJoining ? new Date(emp.dateOfJoining).toISOString().split('T')[0] : "",
      salaryStructure: emp.salaryStructure || {
        basicSalary: 0,
        annualSalary: 0
      },
    });
    setCurrentStep(1);
    setIsEditOpen(true);
  };

  const confirmActionModal = (type, emp) => {
    if (type === "delete") {
      setConfirmAction({
        type: "delete",
        title: "Delete Employee",
        message: `Are you sure you want to permanently delete ${emp.firstName} ${emp.lastName}?`,
        action: () => handleDelete(emp._id || emp.employeeId)
      });
    } else if (type === "status") {
      const newStatus = emp.isActive ? "Deactivate" : "Activate";
      setConfirmAction({
        type: "status",
        title: `${newStatus} Account`,
        message: `Are you sure you want to ${newStatus.toLowerCase()} access for ${emp.firstName}?`,
        action: () => handleToggleStatus(emp)
      });
    } else if (type === "approve") {
      setConfirmAction({
        type: "approve",
        title: "Approve Employee",
        message: `Allow ${emp.firstName} to access the system?`,
        action: () => handleApprove(emp._id || emp.employeeId)
      });
    } else if (type === "reject") {
      setConfirmAction({
        type: "reject",
        title: "Reject Registration",
        message: `Deny access for ${emp.firstName}? Please provide a reason.`,
        action: () => {
            if (!rejectionReason.trim()) {
                alert("Please provide a rejection reason.");
                return;
            }
            handleReject(emp._id || emp.employeeId, rejectionReason);
        }
      });
    } else if (type === "bulk-approve") {
      setConfirmAction({
        type: "approve",
        title: "Bulk Approval",
        message: `Are you sure you want to approve ${selectedEmployees.length} selected employees?`,
        action: handleBulkApprove
      });
    }
    setIsConfirmOpen(true);
  };

  // --- Render Steps ---
  const renderStepContent = () => {
    if (!currentEmployee) return null;

    const isMSUser = !!currentEmployee.microsoftId;

    switch (currentStep) {
      case 1: // Personal
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="col-span-2 md:col-span-1">
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                First Name {isMSUser && <span className="text-[10px] lowercase text-blue-500">(managed by Microsoft)</span>}
              </label>
              <input
                className={`w-full border border-gray-300 rounded-lg p-2.5 ${isMSUser ? 'bg-gray-50 text-gray-600 cursor-not-allowed' : 'focus:ring-2 focus:ring-blue-500 outline-none'}`}
                value={currentEmployee.firstName}
                onChange={e => !isMSUser && setCurrentEmployee({ ...currentEmployee, firstName: e.target.value })}
                readOnly={isMSUser}
              />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                Last Name {isMSUser && <span className="text-[10px] lowercase text-blue-500">(managed by Microsoft)</span>}
              </label>
              <input
                className={`w-full border border-gray-300 rounded-lg p-2.5 ${isMSUser ? 'bg-gray-50 text-gray-600 cursor-not-allowed' : 'focus:ring-2 focus:ring-blue-500 outline-none'}`}
                value={currentEmployee.lastName}
                onChange={e => !isMSUser && setCurrentEmployee({ ...currentEmployee, lastName: e.target.value })}
                readOnly={isMSUser}
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                Email {isMSUser && <span className="text-[10px] lowercase text-blue-500">(managed by Microsoft)</span>}
              </label>
              <input
                className={`w-full border border-gray-300 rounded-lg p-2.5 ${isMSUser ? 'bg-gray-50 text-gray-600 cursor-not-allowed' : 'focus:ring-2 focus:ring-blue-500 outline-none'}`}
                value={currentEmployee.email}
                onChange={e => !isMSUser && setCurrentEmployee({ ...currentEmployee, email: e.target.value })}
                readOnly={isMSUser}
              />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Mobile Number</label>
              <input
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                value={currentEmployee.mobileNumber}
                onChange={e => setCurrentEmployee({ ...currentEmployee, mobileNumber: e.target.value })}
                placeholder="+1 234 567 890"
              />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Profile Status</label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={currentEmployee.isActive} onChange={() => setCurrentEmployee({ ...currentEmployee, isActive: true })} className="accent-blue-600 w-4 h-4" />
                  <span className="text-sm">Active</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={!currentEmployee.isActive} onChange={() => setCurrentEmployee({ ...currentEmployee, isActive: false })} className="accent-red-600 w-4 h-4" />
                  <span className="text-sm">Inactive</span>
                </label>
              </div>
            </div>
          </div>
        );
      case 2: // Professional
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Designation / Role {isMSUser && <span className="text-[10px] lowercase text-blue-500">(managed by Microsoft)</span>}
              </label>
              <input
                className={`w-full border border-gray-300 rounded-lg p-2.5 ${isMSUser ? 'bg-gray-50 text-gray-600 cursor-not-allowed' : 'focus:ring-2 focus:ring-blue-500 outline-none'}`}
                value={currentEmployee.designation}
                onChange={e => !isMSUser && setCurrentEmployee({ ...currentEmployee, designation: e.target.value })}
                readOnly={isMSUser}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Department {isMSUser && <span className="text-[10px] lowercase text-blue-500">(managed by Microsoft)</span>}
              </label>
              <input
                className={`w-full border border-gray-300 rounded-lg p-2.5 ${isMSUser ? 'bg-gray-50 text-gray-600 cursor-not-allowed' : 'focus:ring-2 focus:ring-blue-500 outline-none'}`}
                value={currentEmployee.department}
                onChange={e => !isMSUser && setCurrentEmployee({ ...currentEmployee, department: e.target.value })}
                readOnly={isMSUser}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Employment Type</label>
              <select
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                value={currentEmployee.employmentType}
                onChange={e => setCurrentEmployee({ ...currentEmployee, employmentType: e.target.value })}
              >
                <option value="FULL_TIME">Full Time</option>
                <option value="PART_TIME">Part Time</option>
                <option value="CONTRACT">Contract</option>
                <option value="INTERN">Intern</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Date of Joining</label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                value={currentEmployee.dateOfJoining}
                onChange={e => setCurrentEmployee({ ...currentEmployee, dateOfJoining: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Work Location</label>
              <select
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                value={currentEmployee.workLocation}
                onChange={e => setCurrentEmployee({ ...currentEmployee, workLocation: e.target.value })}
              >
                <option value="OFFICE">Office</option>
                <option value="REMOTE">Remote</option>
                <option value="HYBRID">Hybrid</option>
              </select>
            </div>

            {currentEmployee.workLocation === "HYBRID" && (
              <div className="col-span-2 bg-gray-50 p-4 rounded-xl border border-gray-200 mt-2">
                <label className="block text-xs font-bold text-gray-700 uppercase mb-3 text-center">
                  Select Office Days (Hybrid)
                </label>
                <div className="flex flex-wrap justify-center gap-2">
                  {["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"].map(day => {
                    const isSelected = (currentEmployee.officeDays || []).includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => {
                          const newDays = isSelected
                            ? currentEmployee.officeDays.filter(d => d !== day)
                            : [...(currentEmployee.officeDays || []), day];
                          setCurrentEmployee({ ...currentEmployee, officeDays: newDays });
                        }}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest transition-all border-2 
                          ${isSelected 
                            ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-100" 
                            : "bg-white border-gray-200 text-gray-400 hover:border-gray-300"}`}
                      >
                        {day.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-gray-500 mt-2 italic text-center">Selected days will require Office WiFi for punch-in.</p>
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Shift</label>
              <select
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                value={currentEmployee.shift}
                onChange={e => setCurrentEmployee({ ...currentEmployee, shift: e.target.value })}
              >
                <option value="DAY">Day Shift</option>
                <option value="NIGHT">Night Shift</option>
                <option value="CUSTOM">Custom</option>
              </select>
            </div>
          </div>
        );
      case 3: // Address
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Street Address</label>
              <textarea
                rows="2"
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                value={currentEmployee.address}
                onChange={e => setCurrentEmployee({ ...currentEmployee, address: e.target.value })}
                placeholder="123 Main St..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">City</label>
                <input className="w-full border border-gray-300 rounded-lg p-2.5" value={currentEmployee.city} onChange={e => setCurrentEmployee({ ...currentEmployee, city: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">State</label>
                <input className="w-full border border-gray-300 rounded-lg p-2.5" value={currentEmployee.state} onChange={e => setCurrentEmployee({ ...currentEmployee, state: e.target.value })} />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Country</label>
                <input className="w-full border border-gray-300 rounded-lg p-2.5" value={currentEmployee.country} onChange={e => setCurrentEmployee({ ...currentEmployee, country: e.target.value })} />
              </div>
            </div>


          </div>
        );
      case 4: // Salary Structure
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                <DollarSign size={20} />
              </div>
              <div>
                <h4 className="font-bold text-indigo-900 text-sm">Employee Salary Configuration</h4>
                <p className="text-xs text-indigo-600">Define the fixed base salary. Other components can be added during payroll generation.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Annual Package (LPA)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none text-sm shadow-sm font-medium"
                    value={currentEmployee.salaryStructure.annualSalary || ""}
                    onChange={(e) => {
                      const lpa = parseFloat(e.target.value) || 0;
                      const monthly = (lpa * 100000) / 12;
                      setCurrentEmployee({
                        ...currentEmployee,
                        salaryStructure: {
                          ...currentEmployee.salaryStructure,
                          annualSalary: lpa,
                          basicSalary: Math.round(monthly * 100) / 100
                        }
                      });
                    }}
                    placeholder="e.g. 6.5"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">LPA</span>
                </div>
                <p className="text-[10px] text-gray-400 italic">Entering LPA will auto-calculate Monthly Basic</p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Monthly Basic Salary
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded-lg pl-7 pr-3 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all shadow-sm font-semibold"
                    value={currentEmployee.salaryStructure.basicSalary || ""}
                    onChange={(e) =>
                      setCurrentEmployee({
                        ...currentEmployee,
                        salaryStructure: {
                          ...currentEmployee.salaryStructure,
                          basicSalary: Number(e.target.value) || 0,
                          annualSalary: Math.round(((Number(e.target.value) * 12) / 100000) * 100) / 100
                        },
                      })
                    }
                    placeholder="0.00"
                  />
                </div>
                <p className="text-[10px] text-gray-400 italic">Fixed monthly base salary</p>
              </div>

              <div className="space-y-1.5 hidden lg:block">
                <div className="h-full flex items-center p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <p className="text-[10px] text-gray-500 text-center w-full leading-relaxed">
                    Fixed base salary is used for <span className="text-red-500 font-bold">unpaid leave deductions</span> and statutory calculations in Payroll.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 shadow-xl overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="text-gray-400 font-medium text-xs uppercase tracking-widest">Confirmed Base Payout</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-black text-white">
                      ₹{(Number(currentEmployee.salaryStructure.basicSalary) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-gray-400 text-sm font-medium">/ month</span>
                  </div>
                </div>
                <div className="flex flex-col md:text-right border-t md:border-t-0 md:border-l border-gray-800 pt-4 md:pt-0 md:pl-6">
                  <span className="text-gray-500 text-[10px] font-bold uppercase tracking-tight mb-1">Annual Take Home (Approx)</span>
                  <span className="text-lg font-bold text-indigo-400">
                    ₹{((Number(currentEmployee.salaryStructure.basicSalary) || 0) * 12).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      default: return null;
    }
  };

  const StatusBadge = ({ emp }) => {
    const isNew = new Date(emp.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    if (emp.status === "PENDING") {
        return (
            <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Pending
                </span>
                {isNew && <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 text-[10px] font-bold uppercase tracking-wider">New</span>}
            </div>
        );
    }
    if (emp.status === "REJECTED") {
        return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                Rejected
            </span>
        );
    }
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${emp.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
            {emp.isActive ? 'Active' : 'Inactive'}
        </span>
    );
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employee Management</h1>
          <p className="text-gray-500 mt-1">Manage system access and employee details</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 p-1 rounded-xl mr-4">
            <button 
                onClick={() => { setActiveTab("Active"); setSelectedEmployees([]); }} 
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === "Active" ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
                Active ({stats.active})
            </button>
            <button 
                onClick={() => { setActiveTab("Pending"); setSelectedEmployees([]); }} 
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === "Pending" ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
                New Registrations ({stats.pending})
                {stats.pending > 0 && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>}
            </button>
          </div>
          <button onClick={fetchEmployees} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg" title="Refresh">
            <Filter className="w-5 h-5" />
          </button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-sm transition-all">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {activeTab === "Pending" && stats.pending > 0 && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-xl flex items-center justify-between animate-in slide-in-from-top-4">
              <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-blue-900">{stats.pending} registrations waiting for approval</h4>
                    <p className="text-xs text-blue-700">New employees cannot log in until an administrator approves their access.</p>
                  </div>
              </div>
              {selectedEmployees.length > 0 && (
                  <button 
                    onClick={() => confirmActionModal("bulk-approve")}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 shadow-md transition-all flex items-center gap-2"
                  >
                    Approve Selected ({selectedEmployees.length})
                  </button>
              )}
          </div>
      )}

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto">
          <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="All">All Departments</option>
            <option value="Engineering">Engineering</option>
            <option value="HR">HR</option>
            <option value="Sales">Sales</option>
            <option value="Marketing">Marketing</option>
          </select>
        </div>
      </div>

      {/* Table Section (Desktop) */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {activeTab === "Pending" && (
                    <th className="px-6 py-4 w-10">
                        <input 
                            type="checkbox" 
                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" 
                            checked={selectedEmployees.length === filteredEmployees.length && filteredEmployees.length > 0}
                            onChange={(e) => {
                                if (e.target.checked) {
                                    setSelectedEmployees(filteredEmployees.map(emp => emp._id || emp.employeeId));
                                } else {
                                    setSelectedEmployees([]);
                                }
                            }}
                        />
                    </th>
                )}
                <th className="px-6 py-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('firstName')}>
                  <div className="flex items-center gap-2">Name {sortConfig.key === 'firstName' && (sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}</div>
                </th>
                <th className="px-6 py-4 font-semibold text-gray-700 hidden lg:table-cell">Contact</th>
                <th className="px-6 py-4 font-semibold text-gray-700">Role / Dept</th>
                <th className="px-6 py-4 font-semibold text-gray-700">Status</th>
                <th className="px-6 py-4 font-semibold text-gray-700 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">Loading...</td></tr>
              ) : filteredEmployees.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">No employees found.</td></tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={emp._id || emp.employeeId} className={`hover:bg-gray-50 transition-colors ${selectedEmployees.includes(emp._id || emp.employeeId) ? 'bg-blue-50/50' : ''}`}>
                    {activeTab === "Pending" && (
                        <td className="px-6 py-4">
                            <input 
                                type="checkbox" 
                                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" 
                                checked={selectedEmployees.includes(emp._id || emp.employeeId)}
                                onChange={(e) => {
                                    const id = emp._id || emp.employeeId;
                                    if (e.target.checked) {
                                        setSelectedEmployees([...selectedEmployees, id]);
                                    } else {
                                        setSelectedEmployees(selectedEmployees.filter(sid => sid !== id));
                                    }
                                }}
                            />
                        </td>
                    )}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <ProfileAvatar user={emp} className="w-10 h-10 shrink-0" />
                        <div>
                          <div className="font-semibold text-gray-900">{emp.firstName} {emp.lastName}</div>
                          <div className="text-xs text-gray-500 lg:hidden">{emp.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell"><div className="text-gray-600">{emp.email}</div></td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{emp.designation || 'N/A'}</div>
                      <div className="text-xs text-gray-500">{emp.department || 'General'}</div>
                    </td>
                    <td className="px-6 py-4"><StatusBadge emp={emp} /></td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {emp.status === "PENDING" ? (
                            <>
                                <button onClick={() => confirmActionModal("approve", emp)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-md" title="Approve"><UserCheck className="w-5 h-5" /></button>
                                <button onClick={() => confirmActionModal("reject", emp)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-md" title="Reject"><UserX className="w-5 h-5" /></button>
                            </>
                        ) : (
                            <>
                                <button onClick={() => openEdit(emp)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md"><Edit3 className="w-4 h-4" /></button>
                                <button onClick={() => confirmActionModal("status", emp)} className={`p-1.5 rounded-md ${emp.isActive ? 'text-orange-600 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'}`}>{emp.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}</button>
                                <button onClick={() => confirmActionModal("delete", emp)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-md"><Trash2 className="w-4 h-4" /></button>
                            </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 text-sm text-gray-500 flex justify-between">
            <span>Showing {filteredEmployees.length} of {employees.length} employees</span>
          </div>
        </div>
      </div>

      {/* Mobile Cards Section */}
      <div className="md:hidden space-y-4">
        {filteredEmployees.map((emp) => (
          <div key={emp._id || emp.employeeId} className={`bg-white p-4 rounded-xl shadow-sm border border-gray-200 space-y-3 ${selectedEmployees.includes(emp._id || emp.employeeId) ? 'border-blue-500 bg-blue-50/30' : ''}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                {activeTab === "Pending" && (
                    <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" 
                        checked={selectedEmployees.includes(emp._id || emp.employeeId)}
                        onChange={(e) => {
                            const id = emp._id || emp.employeeId;
                            if (e.target.checked) {
                                setSelectedEmployees([...selectedEmployees, id]);
                            } else {
                                setSelectedEmployees(selectedEmployees.filter(sid => sid !== id));
                            }
                        }}
                    />
                )}
                <ProfileAvatar user={emp} className="w-10 h-10 shrink-0" />
                <div>
                  <div className="font-semibold text-gray-900">{emp.firstName} {emp.lastName}</div>
                  <div className="text-xs text-gray-500">{emp.email}</div>
                </div>
              </div>
              <StatusBadge emp={emp} />
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-gray-500 text-xs uppercase">Role</span><p className="font-medium text-gray-800">{emp.designation || '-'}</p></div>
              <div><span className="text-gray-500 text-xs uppercase">Dept</span><p className="font-medium text-gray-800">{emp.department || '-'}</p></div>
            </div>
            <div className="flex gap-2 pt-2 border-t border-gray-100 mt-2">
              {emp.status === "PENDING" ? (
                  <>
                    <button onClick={() => confirmActionModal("approve", emp)} className="flex-1 py-1.5 text-green-600 bg-green-50 rounded text-sm font-bold">Approve</button>
                    <button onClick={() => confirmActionModal("reject", emp)} className="flex-1 py-1.5 text-red-600 bg-red-50 rounded text-sm font-bold">Reject</button>
                  </>
              ) : (
                  <>
                    <button onClick={() => openEdit(emp)} className="flex-1 py-1.5 text-blue-600 bg-blue-50 rounded text-sm font-medium">Edit</button>
                    <button onClick={() => confirmActionModal("status", emp)} className={`flex-1 py-1.5 text-sm font-medium rounded ${emp.isActive ? 'text-orange-600 bg-orange-50' : 'text-green-600 bg-green-50'}`}>{emp.isActive ? "Deactivate" : "Activate"}</button>
                    <button onClick={() => confirmActionModal("delete", emp)} className="flex-1 py-1.5 text-red-600 bg-red-50 rounded text-sm font-medium">Delete</button>
                  </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Stepper Edit Modal */}
      {isEditOpen && currentEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsEditOpen(false)}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">

            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Edit Employee</h2>
                <p className="text-sm text-gray-500">Update details for {currentEmployee.firstName}</p>
              </div>
              <button onClick={() => setIsEditOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors bg-gray-50 p-2 rounded-full hover:bg-gray-100">✕</button>
            </div>

            {/* Stepper Header */}
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 overflow-x-auto">
              <div className="flex items-center justify-between min-w-[300px]">
                {STEPS.map((step, idx) => {
                  const isActive = step.id === currentStep;
                  const isCompleted = step.id < currentStep;
                  const Icon = step.icon;

                  return (
                    <div key={step.id} className="flex flex-col items-center relative z-10 flex-1">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all duration-300 border-2 
                            ${isActive ? 'bg-blue-600 border-blue-600 text-white shadow-lg scale-110' :
                            isCompleted ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-gray-300 text-gray-400'}`}
                      >
                        {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                      </div>
                      <span className={`text-xs font-semibold ${isActive ? 'text-blue-700' : isCompleted ? 'text-green-600' : 'text-gray-400'}`}>
                        {step.title}
                      </span>
                      {/* Connecting Line (except last) */}
                      {idx !== STEPS.length - 1 && (
                        <div className={`hidden md:block absolute top-5 left-1/2 w-full h-[2px] -z-10 ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="flex-1 p-6 overflow-y-auto">
              {renderStepContent()}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-100 flex justify-between bg-gray-50">
              {currentStep > 1 ? (
                <button
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-all"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
              ) : (
                <div /> // Spacer
              )}

              {currentStep < STEPS.length ? (
                <button
                  onClick={() => validateCurrentStep() && setCurrentStep(currentStep + 1)}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-md transition-all"
                >
                  Next <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium shadow-md transition-all"
                >
                  Save Changes <CheckCircle2 className="w-4 h-4" />
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {isConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsConfirmOpen(false)}></div>
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto ${
                confirmAction.type === 'delete' || confirmAction.type === 'reject' ? 'bg-red-100 text-red-600' : 
                confirmAction.type === 'approve' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'
            }`}>
              {confirmAction.type === 'delete' ? <Trash2 className="w-6 h-6" /> : 
               confirmAction.type === 'approve' ? <UserCheck className="w-6 h-6" /> : <UserX className="w-6 h-6" />}
            </div>

            <div className="text-center">
              <h3 className="text-lg font-bold text-gray-900">{confirmAction.title}</h3>
              <p className="text-sm text-gray-500 mt-2">{confirmAction.message}</p>
            </div>

            {confirmAction.type === 'reject' && (
                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Rejection Reason</label>
                    <textarea 
                        className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-red-500 outline-none resize-none"
                        rows="3"
                        placeholder="e.g. Incomplete documentation, invalid email..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                    />
                </div>
            )}

            <div className="flex gap-3 pt-2">
              <button onClick={() => { setIsConfirmOpen(false); setRejectionReason(""); }} className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 font-medium">Cancel</button>
              <button onClick={confirmAction.action} className={`flex-1 px-4 py-2 text-white rounded-lg font-medium shadow-sm ${
                  confirmAction.type === 'delete' || confirmAction.type === 'reject' ? 'bg-red-600 hover:bg-red-700' : 
                  confirmAction.type === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-600 hover:bg-orange-700'
              }`}>Confirm</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}


