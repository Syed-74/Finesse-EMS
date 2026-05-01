import React, { useState, useEffect } from "react";
import axios from "../../../api/axios";
import {
  Shield,
  Plus,
  Trash2,
  Edit,
  Wifi,
  Loader2,
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Settings,
  MoreVertical,
  Activity,
  Server,
  Globe,
  MapPin,
  X,
  Check
} from "lucide-react";
import toast from "react-hot-toast";
import { useConfirm } from "../../../context/ConfirmContext";

const OfficeIPConfig = () => {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    allowedIPs: [],
    isActive: true
  });
  const [newIP, setNewIP] = useState("");
  const [saving, setSaving] = useState(false);
  
  const { confirmAction } = useConfirm();
  const token = localStorage.getItem("token");
  const config = { headers: { Authorization: `Bearer ${token}` } };

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/admin/office-config", config);
      setConfigs(response.data);
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Failed to load configurations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const openModal = (configToEdit = null) => {
    if (configToEdit) {
      setEditingConfig(configToEdit);
      setFormData({
        name: configToEdit.name,
        allowedIPs: [...configToEdit.allowedIPs],
        isActive: configToEdit.isActive
      });
    } else {
      setEditingConfig(null);
      setFormData({
        name: "",
        allowedIPs: [],
        isActive: true
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingConfig(null);
    setNewIP("");
  };

  const handleAddIP = () => {
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
    
    if (!newIP.trim()) {
      toast.error("IP address cannot be empty");
      return;
    }
    
    if (!ipRegex.test(newIP.trim())) {
      toast.error("Invalid IP address format");
      return;
    }
    
    if (formData.allowedIPs.includes(newIP.trim())) {
      toast.error("This IP is already in the list");
      return;
    }
    
    setFormData({
      ...formData,
      allowedIPs: [...formData.allowedIPs, newIP.trim()]
    });
    setNewIP("");
  };

  const handleRemoveIP = (ipToRemove) => {
    setFormData({
      ...formData,
      allowedIPs: formData.allowedIPs.filter(ip => ip !== ipToRemove)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Sanitize Data
    const cleanedData = {
      name: formData.name.trim(),
      allowedIPs: [...new Set(formData.allowedIPs.map(ip => ip.trim()).filter(ip => ip !== ""))],
      isActive: formData.isActive
    };

    // 2. Client-side Validation
    if (!cleanedData.name) {
      toast.error("Office name is required");
      return;
    }

    if (cleanedData.allowedIPs.length === 0) {
      toast.error("Please add at least one authorized IP address.");
      return;
    }

    // 3. Debug Logging
    console.log("Sending Data:", cleanedData);
    
    try {
      setSaving(true);
      
      const requestConfig = {
        headers: {
          ...config.headers,
          "Content-Type": "application/json"
        }
      };

      if (editingConfig) {
        await axios.put(`/admin/office-config/${editingConfig._id}`, cleanedData, requestConfig);
        toast.success("Configuration updated successfully");
      } else {
        await axios.post("/admin/office-config", cleanedData, requestConfig);
        toast.success("Configuration created successfully");
      }
      
      fetchConfigs();
      closeModal();
    } catch (error) {
      console.error("Save error:", error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || "Failed to save configuration";
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id) => {
    confirmAction({
      title: "Delete Configuration",
      message: "Are you sure you want to delete this office configuration? This action cannot be undone.",
      onConfirm: async () => {
        try {
          await axios.delete(`/admin/office-config/${id}`, config);
          toast.success("Configuration deleted successfully");
          fetchConfigs();
        } catch (error) {
          toast.error("Failed to delete configuration");
        }
      }
    });
  };

  const handleToggleActive = async (id, currentStatus) => {
    try {
      await axios.put(`/admin/office-config/${id}`, { isActive: !currentStatus }, config);
      toast.success(`Configuration ${!currentStatus ? 'activated' : 'deactivated'}`);
      fetchConfigs();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const filteredConfigs = configs.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.allowedIPs.some(ip => ip.includes(searchQuery))
  );

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
      
      {/* ─── Header Section ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-indigo-600 font-black tracking-widest uppercase text-[10px]">
            Security Portal • Network Access Control
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Office Network Config</h1>
          <p className="text-sm text-slate-500 font-medium">Manage authorized office network IPs for onsite attendance validation.</p>
        </div>

        <button 
          onClick={() => openModal()}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-95"
        >
          <Plus className="w-5 h-5" /> New Configuration
        </button>
      </div>

      {/* ─── Search & Analytics ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by office name or IP address..."
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <div className="bg-slate-900 p-4 rounded-2xl shadow-xl border border-slate-800 flex items-center justify-between group overflow-hidden relative">
          <div className="relative z-10">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Active Configs</p>
            <h3 className="text-2xl font-black text-white">{configs.filter(c => c.isActive).length} / {configs.length}</h3>
          </div>
          <div className="p-3 bg-white/10 rounded-xl text-indigo-400 group-hover:scale-110 transition-transform relative z-10">
            <Shield className="w-6 h-6" />
          </div>
          <Activity className="absolute -right-4 -bottom-4 w-24 h-24 text-white/5 rotate-12" />
        </div>
      </div>

      {/* ─── Config List ─── */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                {["Office Detail", "Authorized IPs", "Status", "Last Updated", "Actions"].map((h) => (
                  <th key={h} className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-8 py-20 text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mx-auto mb-4" />
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">Fetching Security Policies...</p>
                  </td>
                </tr>
              ) : filteredConfigs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-8 py-20 text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Server className="w-10 h-10 text-slate-200" />
                    </div>
                    <p className="text-sm font-black text-slate-800">No Configurations Found</p>
                    <p className="text-xs text-slate-400 mt-1 font-medium">Try adjusting your search or create a new policy.</p>
                  </td>
                </tr>
              ) : (
                filteredConfigs.map((config) => (
                  <tr key={config._id} className="hover:bg-slate-50/50 transition-all group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl ${config.isActive ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                          <Server className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-black text-slate-900 text-sm tracking-tight">{config.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Physical Hub</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-wrap gap-2 max-w-md">
                        {config.allowedIPs.length > 0 ? (
                          config.allowedIPs.slice(0, 3).map((ip, i) => (
                            <span key={i} className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black font-mono border border-slate-200">
                              {ip}
                            </span>
                          ))
                        ) : (
                          <span className="text-rose-400 text-xs font-bold italic">No IPs authorized</span>
                        )}
                        {config.allowedIPs.length > 3 && (
                          <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                            +{config.allowedIPs.length - 3} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <button 
                        onClick={() => handleToggleActive(config._id, config.isActive)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2
                          ${config.isActive 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100' 
                            : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100'}`}
                      >
                        {config.isActive ? (
                          <><CheckCircle className="w-3 h-3" /> Active</>
                        ) : (
                          <><XCircle className="w-3 h-3" /> Inactive</>
                        )}
                      </button>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-[11px] font-black text-slate-500 uppercase tracking-tight">
                        {new Date(config.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                      <p className="text-[10px] text-slate-300 font-medium">{new Date(config.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => openModal(config)}
                          className="p-2.5 bg-white border border-slate-200 text-slate-500 rounded-xl hover:text-indigo-600 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-50 transition-all active:scale-95"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(config._id)}
                          className="p-2.5 bg-white border border-slate-200 text-slate-500 rounded-xl hover:text-rose-600 hover:border-rose-200 hover:shadow-lg hover:shadow-rose-50 transition-all active:scale-95"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
           <p className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
             <Globe className="w-4 h-4" /> Global Policy Control Panel
           </p>
           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
             Showing {filteredConfigs.length} of {configs.length} records
           </p>
        </div>
      </div>

      {/* ─── Configuration Modal ─── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            
            {/* Modal Header */}
            <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-indigo-600 rounded-[1.2rem] flex items-center justify-center text-white shadow-xl shadow-indigo-100">
                  <Server className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                    {editingConfig ? "Edit Configuration" : "New Office Policy"}
                  </h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Office Network Protocol</p>
                </div>
              </div>
              <button 
                onClick={closeModal}
                className="p-3 rounded-2xl hover:bg-slate-100 text-slate-400 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-10 space-y-8">
                {/* Office Name */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    <MapPin className="w-3.5 h-3.5" /> Office / Location Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Headquarters - Main Office"
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-300"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                {/* IP List Management */}
                <div className="space-y-4">
                  <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    <Globe className="w-3.5 h-3.5" /> Authorized IP Addresses
                  </label>
                  
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <Server className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                      <input
                        type="text"
                        placeholder="Enter IPv4 or IPv6 (e.g. 192.168.1.1)"
                        className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold font-mono text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                        value={newIP}
                        onChange={(e) => setNewIP(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddIP())}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddIP}
                      className="px-8 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-200"
                    >
                      Authorize
                    </button>
                  </div>

                  {/* Render Added IPs */}
                  <div className="flex flex-wrap gap-2 p-6 bg-slate-50 border border-dashed border-slate-200 rounded-3xl min-h-[100px] items-start">
                    {formData.allowedIPs.length === 0 ? (
                      <div className="w-full h-full flex flex-col items-center justify-center py-4 opacity-30">
                        <Activity className="w-8 h-8 mb-2" />
                        <p className="text-[10px] font-black uppercase tracking-widest">No Authorized Nodes</p>
                      </div>
                    ) : (
                      formData.allowedIPs.map((ip, index) => (
                        <div 
                          key={index} 
                          className="flex items-center gap-3 pl-4 pr-2 py-2.5 bg-white border border-slate-200 rounded-xl group hover:border-indigo-400 transition-all shadow-sm"
                        >
                          <span className="text-xs font-black font-mono text-slate-600">{ip}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveIP(ip)}
                            className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Status Toggle */}
                <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl ${formData.isActive ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                      <Check className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-900 uppercase tracking-tight">Policy Status</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Toggle deployment status</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all focus:outline-none
                      ${formData.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}
                  >
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white transition-all shadow-md
                        ${formData.isActive ? 'translate-x-7' : 'translate-x-1'}`}
                    />
                  </button>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-10 py-8 bg-slate-50/50 border-t border-slate-100 flex justify-end gap-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-all"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-10 py-4 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center gap-2"
                >
                  {saving ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                  ) : (
                    <><CheckCircle className="w-4 h-4" /> Deploy Configuration</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfficeIPConfig;
