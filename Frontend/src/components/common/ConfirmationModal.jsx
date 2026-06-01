import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, type = "primary", children }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-[2rem] shadow-[0_30px_70px_-10px_rgba(0,0,0,0.2)] border border-slate-100 overflow-hidden z-50 p-8"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-50 text-slate-400 rounded-xl transition-all active:scale-95 absolute top-6 right-6"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${type === 'danger' ? 'bg-rose-50 text-rose-600 border border-rose-100/50' : 'bg-indigo-50 text-indigo-600 border border-indigo-100/50'}`}>
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div className="flex flex-col">
                  <span className={`text-[10px] font-black uppercase tracking-widest block mb-1 ${type === 'danger' ? 'text-rose-600' : 'text-indigo-600'}`}>
                    Verification Request
                  </span>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none">{title}</h3>
                </div>
              </div>

              <div className="mt-6">
                <p className="text-slate-500 font-medium text-sm leading-relaxed">
                  {message}
                </p>
              </div>

              {children && (
                <div className="mt-4">
                  {children}
                </div>
              )}

              <div className="mt-8 flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl transition-all active:scale-95 text-xs uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  className={`flex-1 px-6 py-3.5 text-white font-bold rounded-2xl shadow-xl transition-all active:scale-95 text-xs uppercase tracking-wider ${
                    type === "danger"
                      ? "bg-rose-600 shadow-rose-200 hover:bg-rose-700 hover:shadow-rose-300"
                      : "bg-[#0f172a] shadow-slate-900/10 hover:bg-[#1e293b]"
                  }`}
                >
                  Confirm Action
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmationModal;
