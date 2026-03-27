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
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className={`p-3 rounded-2xl ${type === 'danger' ? 'bg-rose-50 text-rose-600' : 'bg-indigo-50 text-indigo-600'}`}>
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-5">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">{title}</h3>
                <p className="mt-2 text-slate-500 font-medium leading-relaxed">
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
                  className="flex-1 px-6 py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold rounded-2xl transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  className={`flex-1 px-6 py-3 text-white font-bold rounded-2xl shadow-lg transition-all active:scale-95 ${
                    type === "danger"
                      ? "bg-rose-600 shadow-rose-200 hover:bg-rose-700"
                      : "bg-indigo-600 shadow-indigo-200 hover:bg-indigo-700"
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
