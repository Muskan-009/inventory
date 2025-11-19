import React, { createContext, useContext, useState } from 'react';

const DeleteModalContext = createContext();

export const useDeleteModal = () => {
  const context = useContext(DeleteModalContext);
  if (!context) {
    throw new Error('useDeleteModal must be used within a DeleteModalProvider');
  }
  return context;
};

export const DeleteModalProvider = ({ children }) => {
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: 'Are you sure?',
    message: '',
    itemName: '',
    onConfirm: null,
    onCancel: null,
    confirmText: 'YES',
    cancelText: 'NO',
    type: 'delete' // 'delete', 'warning', 'info'
  });

  const showDeleteModal = ({
    title = 'Are you sure?',
    message,
    itemName,
    onConfirm,
    onCancel,
    confirmText = 'YES',
    cancelText = 'NO',
    type = 'delete'
  }) => {
    setModalState({
      isOpen: true,
      title,
      message,
      itemName,
      onConfirm,
      onCancel,
      confirmText,
      cancelText,
      type
    });
  };

  const hideDeleteModal = () => {
    setModalState(prev => ({
      ...prev,
      isOpen: false
    }));
  };

  const handleConfirm = () => {
    if (modalState.onConfirm) {
      modalState.onConfirm();
    }
    hideDeleteModal();
  };

  const handleCancel = () => {
    if (modalState.onCancel) {
      modalState.onCancel();
    }
    hideDeleteModal();
  };

  return (
    <DeleteModalContext.Provider
      value={{
        ...modalState,
        showDeleteModal,
        hideDeleteModal,
        handleConfirm,
        handleCancel
      }}
    >
      {children}
    </DeleteModalContext.Provider>
  );
};
