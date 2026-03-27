import React, { createContext, useContext, useState } from "react";
import ConfirmationModal from "../components/common/ConfirmationModal";

const ConfirmContext = createContext();

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used within a ConfirmProvider");
  }
  return context;
};

export const ConfirmProvider = ({ children }) => {
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    type: "primary", // 'primary' | 'danger'
    children: null,
  });

  const confirmAction = ({ title, message, onConfirm, type = "primary", children = null }) => {
    setModalState({
      isOpen: true,
      title,
      message,
      onConfirm: async () => {
        await onConfirm();
        setModalState((prev) => ({ ...prev, isOpen: false, children: null }));
      },
      type,
      children,
    });
  };

  const closeModal = () => {
    setModalState((prev) => ({ ...prev, isOpen: false, children: null }));
  };

  return (
    <ConfirmContext.Provider value={{ confirmAction }}>
      {children}
      <ConfirmationModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        onConfirm={modalState.onConfirm}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
      >
        {modalState.children}
      </ConfirmationModal>
    </ConfirmContext.Provider>
  );
};
