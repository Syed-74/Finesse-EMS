import { useEffect, useState, useMemo } from "react";
import axios from "axios";
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
  Clock,
  ArrowRight,
  ArrowLeft
} from "lucide-react";

// Configure base API_URL
const API_URL = "http://localhost:5000/api/employees";

// Steps configuration
const STEPS = [
  { id: 1, title: "Personal", icon: User },
  { id: 2, title: "Professional", icon: Briefcase },
  { id: 3, title: "Work Config", icon: Clock },
  { id: 4, title: "Address", icon: MapPin },
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
  const [currentStep, setCurrentStep] = useState(1);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [confirmAction, setConfirmAction] = useState({ type: "", action: () => {} });

  // Fetch Employees
  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
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

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(e => 
        e.firstName?.toLowerCase().includes(lower) || 
        e.lastName?.toLowerCase().includes(lower) ||
        e.email?.toLowerCase().includes(lower)
      );
    }

    if (statusFilter !== "All") {
      result = result.filter(e => 
        statusFilter === "Active" ? e.isActive : !e.isActive
      );
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
  }, [employees, searchTerm, statusFilter, roleFilter, sortConfig]);

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
      if(!id) return;

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

  const openEdit = (emp) => {
    // Populate with defaults to avoid null issues
    setCurrentEmployee({
      ...emp,
      mobileNumber: emp.mobileNumber || "",
      designation: emp.designation || "",
      department: emp.department || "",
      employmentType: emp.employmentType || "FULL_TIME",
      workLocation: emp.workLocation || "OFFICE",
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
    }
    setIsConfirmOpen(true);
  };

  // --- Render Steps ---
  const renderStepContent = () => {
    if (!currentEmployee) return null;

    switch (currentStep) {
      case 1: // Personal
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="col-span-2 md:col-span-1">
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">First Name</label>
              <input 
                className="w-full border border-gray-300 rounded-lg p-2.5 bg-gray-50 text-gray-600 cursor-not-allowed"
                value={currentEmployee.firstName} 
                readOnly
              />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Last Name</label>
              <input 
                className="w-full border border-gray-300 rounded-lg p-2.5 bg-gray-50 text-gray-600 cursor-not-allowed"
                value={currentEmployee.lastName} 
                readOnly
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Email</label>
              <input 
                className="w-full border border-gray-300 rounded-lg p-2.5 bg-gray-50 text-gray-600 cursor-not-allowed"
                value={currentEmployee.email} 
                readOnly
              />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Mobile Number</label>
              <input 
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                value={currentEmployee.mobileNumber}
                onChange={e => setCurrentEmployee({...currentEmployee, mobileNumber: e.target.value})}
                placeholder="+1 234 567 890"
              />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Profile Status</label>
               <div className="flex gap-4 mt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" checked={currentEmployee.isActive} onChange={() => setCurrentEmployee({...currentEmployee, isActive: true})} className="accent-blue-600 w-4 h-4"/>
                    <span className="text-sm">Active</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" checked={!currentEmployee.isActive} onChange={() => setCurrentEmployee({...currentEmployee, isActive: false})} className="accent-red-600 w-4 h-4"/>
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
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Designation / Role</label>
              <input 
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                value={currentEmployee.designation}
                onChange={e => setCurrentEmployee({...currentEmployee, designation: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Department</label>
              <input 
                 className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                 value={currentEmployee.department}
                 onChange={e => setCurrentEmployee({...currentEmployee, department: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Employment Type</label>
              <select 
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                value={currentEmployee.employmentType}
                onChange={e => setCurrentEmployee({...currentEmployee, employmentType: e.target.value})}
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
                onChange={e => setCurrentEmployee({...currentEmployee, dateOfJoining: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Work Location</label>
              <select 
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                value={currentEmployee.workLocation}
                onChange={e => setCurrentEmployee({...currentEmployee, workLocation: e.target.value})}
              >
                <option value="OFFICE">Office</option>
                <option value="REMOTE">Remote</option>
                <option value="HYBRID">Hybrid</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Shift</label>
              <select 
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                value={currentEmployee.shift}
                onChange={e => setCurrentEmployee({...currentEmployee, shift: e.target.value})}
              >
                <option value="DAY">Day Shift</option>
                <option value="NIGHT">Night Shift</option>
                <option value="CUSTOM">Custom</option>
              </select>
            </div>
          </div>
        );
      case 3: // Work Config
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
             <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-between">
                <div>
                   <h4 className="font-semibold text-sm">Attendance Tracking</h4>
                   <p className="text-xs text-gray-500">Require daily check-in/out</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={currentEmployee.attendanceRequired} onChange={e => setCurrentEmployee({...currentEmployee, attendanceRequired: e.target.checked})} />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
             </div>

             <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Leave Balance (Days)</label>
                <input 
                  type="number"
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={currentEmployee.leaveBalance}
                  onChange={e => setCurrentEmployee({...currentEmployee, leaveBalance: Number(e.target.value)})}
                />
             </div>

             <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-2">Weekly Off Days</label>
                <div className="flex flex-wrap gap-2">
                   {["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"].map(day => (
                      <button 
                        key={day}
                        onClick={() => {
                          const offs = currentEmployee.weeklyOff.includes(day) 
                             ? currentEmployee.weeklyOff.filter(d => d !== day)
                             : [...currentEmployee.weeklyOff, day];
                          setCurrentEmployee({...currentEmployee, weeklyOff: offs});
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                          currentEmployee.weeklyOff.includes(day) 
                            ? 'bg-blue-600 text-white border-blue-600' 
                            : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                        }`}
                      >
                         {day.slice(0,3)}
                      </button>
                   ))}
                </div>
             </div>
          </div>
        );
      case 4: // Address
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
             <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Street Address</label>
                <textarea 
                   rows="2"
                   className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                   value={currentEmployee.address}
                   onChange={e => setCurrentEmployee({...currentEmployee, address: e.target.value})}
                   placeholder="123 Main St..."
                />
             </div>
             
             <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">City</label>
                   <input className="w-full border border-gray-300 rounded-lg p-2.5" value={currentEmployee.city} onChange={e => setCurrentEmployee({...currentEmployee, city: e.target.value})} />
                </div>
                <div>
                   <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">State</label>
                   <input className="w-full border border-gray-300 rounded-lg p-2.5" value={currentEmployee.state} onChange={e => setCurrentEmployee({...currentEmployee, state: e.target.value})} />
                </div>
                <div className="col-span-2">
                   <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Country</label>
                   <input className="w-full border border-gray-300 rounded-lg p-2.5" value={currentEmployee.country} onChange={e => setCurrentEmployee({...currentEmployee, country: e.target.value})} />
                </div>
             </div>

             {/* <div className="pt-2 border-t border-gray-100">
                <label className="block text-xs font-semibold text-red-600 uppercase mb-1">Emergency Contact</label>
                <input 
                   className="w-full border border-red-100 bg-red-50 rounded-lg p-2.5 focus:ring-2 focus:ring-red-200 outline-none"
                   value={currentEmployee.emergencyContact}
                   onChange={e => setCurrentEmployee({...currentEmployee, emergencyContact: e.target.value})}
                   placeholder="Name & Phone Number"
                />
             </div> */}
          </div>
        );
      default: return null;
    }
  };

  const StatusBadge = ({ active }) => (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
      active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
    }`}>
      {active ? 'Active' : 'Inactive'}
    </span>
  );

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employee Management</h1>
          <p className="text-gray-500 mt-1">Manage system access and employee details</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchEmployees} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg" title="Refresh">
            <Filter className="w-5 h-5" /> 
          </button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-sm transition-all">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

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
                <th className="px-6 py-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('firstName')}>
                  <div className="flex items-center gap-2">Name {sortConfig.key === 'firstName' && (sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>)}</div>
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
                  <tr key={emp._id || emp.employeeId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold shrink-0">
                          {emp.firstName?.charAt(0)}{emp.lastName?.charAt(0)}
                        </div>
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
                    <td className="px-6 py-4"><StatusBadge active={emp.isActive} /></td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(emp)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md"><Edit3 className="w-4 h-4" /></button>
                        <button onClick={() => confirmActionModal("status", emp)} className={`p-1.5 rounded-md ${emp.isActive ? 'text-orange-600 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'}`}>{emp.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}</button>
                        <button onClick={() => confirmActionModal("delete", emp)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-md"><Trash2 className="w-4 h-4" /></button>
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
            <div key={emp._id || emp.employeeId} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 space-y-3">
              <div className="flex items-start justify-between">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold shrink-0">{emp.firstName?.charAt(0)}{emp.lastName?.charAt(0)}</div>
                    <div>
                       <div className="font-semibold text-gray-900">{emp.firstName} {emp.lastName}</div>
                       <div className="text-xs text-gray-500">{emp.email}</div>
                    </div>
                 </div>
                 <StatusBadge active={emp.isActive} />
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                 <div><span className="text-gray-500 text-xs uppercase">Role</span><p className="font-medium text-gray-800">{emp.designation || '-'}</p></div>
                 <div><span className="text-gray-500 text-xs uppercase">Dept</span><p className="font-medium text-gray-800">{emp.department || '-'}</p></div>
              </div>
              <div className="flex gap-2 pt-2 border-t border-gray-100 mt-2">
                 <button onClick={() => openEdit(emp)} className="flex-1 py-1.5 text-blue-600 bg-blue-50 rounded text-sm font-medium">Edit</button>
                 <button onClick={() => confirmActionModal("status", emp)} className={`flex-1 py-1.5 text-sm font-medium rounded ${emp.isActive ? 'text-orange-600 bg-orange-50' : 'text-green-600 bg-green-50'}`}>{emp.isActive ? "Deactivate" : "Activate"}</button>
                 <button onClick={() => confirmActionModal("delete", emp)} className="flex-1 py-1.5 text-red-600 bg-red-50 rounded text-sm font-medium">Delete</button>
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
                          {isCompleted ? <CheckCircle2 className="w-5 h-5"/> : <Icon className="w-5 h-5" />}
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
                   <ArrowLeft className="w-4 h-4"/> Back
                 </button>
               ) : (
                 <div /> // Spacer
               )}

               {currentStep < STEPS.length ? (
                 <button 
                  onClick={() => setCurrentStep(currentStep + 1)}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-md transition-all"
                 >
                   Next <ArrowRight className="w-4 h-4"/>
                 </button>
               ) : (
                 <button 
                  onClick={handleSave}
                  className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium shadow-md transition-all"
                 >
                   Save Changes <CheckCircle2 className="w-4 h-4"/>
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
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto text-red-600">
              {confirmAction.type === 'delete' ? <Trash2 className="w-6 h-6"/> : <UserX className="w-6 h-6"/>}
            </div>
            
            <div className="text-center">
              <h3 className="text-lg font-bold text-gray-900">{confirmAction.title}</h3>
              <p className="text-sm text-gray-500 mt-2">{confirmAction.message}</p>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setIsConfirmOpen(false)} className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 font-medium">Cancel</button>
              <button onClick={confirmAction.action} className={`flex-1 px-4 py-2 text-white rounded-lg font-medium shadow-sm ${confirmAction.type === 'delete' ? 'bg-red-600' : 'bg-orange-600'}`}>Confirm</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}


