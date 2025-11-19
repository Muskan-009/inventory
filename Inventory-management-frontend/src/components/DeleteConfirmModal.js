import React, { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useDeleteModal } from '../context/DeleteModalContext';

const GlobalDeleteConfirmModal = () => {
  const {
    isOpen,
    title,
    message,
    itemName,
    confirmText,
    cancelText,
    type,
    handleConfirm,
    handleCancel,
    hideDeleteModal
  } = useDeleteModal();

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        handleCancel();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleCancel]);

  if (!isOpen) return null;

  // Color schemes based on type
  const getColorScheme = () => {
    switch (type) {
      case 'warning':
        return {
          borderTop: 'border-orange-500',
          bgGradient: 'from-orange-50 to-yellow-50',
          iconBg: 'bg-orange-100',
          iconColor: 'text-orange-600',
          confirmBtn: 'bg-orange-600 hover:bg-orange-700',
          warningBg: 'bg-orange-50',
          warningBorder: 'border-orange-200',
          warningText: 'text-orange-700'
        };
      case 'info':
        return {
          borderTop: 'border-blue-500',
          bgGradient: 'from-blue-50 to-indigo-50',
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600',
          confirmBtn: 'bg-blue-600 hover:bg-blue-700',
          warningBg: 'bg-blue-50',
          warningBorder: 'border-blue-200',
          warningText: 'text-blue-700'
        };
      default: // delete
        return {
          borderTop: 'border-red-500',
          bgGradient: 'from-red-50 to-pink-50',
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          confirmBtn: 'bg-red-600 hover:bg-red-700',
          warningBg: 'bg-red-50',
          warningBorder: 'border-red-200',
          warningText: 'text-red-700'
        };
    }
  };

  const colors = getColorScheme();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity"
          onClick={handleCancel}
        />
        <div className="relative w-full max-w-md transform overflow-hidden rounded-xl bg-white shadow-2xl transition-all">
          {/* Top border with color indicator */}
          <div className={`h-1 w-full ${colors.borderTop}`} />
          
          {/* Header */}
          <div className={`px-6 py-4 bg-gradient-to-r ${colors.bgGradient}`}>
            <h3 className="text-lg font-semibold text-gray-900 text-center">
              {title}
            </h3>
          </div>
          
          {/* Content */}
          <div className="px-6 py-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="flex-shrink-0">
                <div className={`w-12 h-12 ${colors.iconBg} rounded-full flex items-center justify-center`}>
                  <AlertTriangle className={`h-6 w-6 ${colors.iconColor}`} />
                </div>
              </div>
              <div className="flex-1">
                <p className="text-gray-700 text-sm leading-relaxed text-center">
                  {message || (itemName ? `Confirm to delete ${itemName}!` : 'Are you sure you want to proceed?')}
                </p>
              </div>
            </div>
            
            {/* Warning message */}
            <div className={`p-3 ${colors.warningBg} rounded-lg border ${colors.warningBorder} mb-6`}>
              <p className={`${colors.warningText} text-xs font-medium text-center`}>
                ⚠️ This action is permanent and cannot be reversed.
              </p>
            </div>
            
            {/* Action buttons */}
            <div className="flex justify-center gap-3">
              <button
                onClick={handleCancel}
                className="px-6 py-2 bg-gray-400 hover:bg-gray-500 text-white font-bold text-sm rounded-md transition-colors duration-200 uppercase"
              >
                {cancelText}
              </button>
              <button
                onClick={handleConfirm}
                className={`px-6 py-2 ${colors.confirmBtn} text-white font-bold text-sm rounded-md transition-colors duration-200 uppercase`}
              >
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Backward compatibility - keep the old component for existing usage
const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, title, message, itemName }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />
        <div className="relative w-full max-w-md transform overflow-hidden rounded-xl bg-white shadow-2xl transition-all">
          <div className="h-1 w-full bg-red-500" />
          <div className="px-6 py-4 bg-gradient-to-r from-red-50 to-pink-50">
            <h3 className="text-lg font-semibold text-gray-900 text-center">
              {title || 'Are you sure?'}
            </h3>
          </div>
          
          <div className="px-6 py-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
              </div>
              <div className="flex-1">
                <p className="text-gray-700 text-sm leading-relaxed text-center">
                  {message || (itemName ? `Confirm to delete ${itemName}!` : 'Are you sure you want to proceed?')}
                </p>
              </div>
            </div>
            
            <div className="p-3 bg-red-50 rounded-lg border border-red-200 mb-6">
              <p className="text-red-700 text-xs font-medium text-center">
                ⚠️ This action is permanent and cannot be reversed.
              </p>
            </div>
            
            <div className="flex justify-center gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gray-400 hover:bg-gray-500 text-white font-bold text-sm rounded-md transition-colors duration-200 uppercase"
              >
                NO
              </button>
              <button
                onClick={onConfirm}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-md transition-colors duration-200 uppercase"
              >
                YES
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export { GlobalDeleteConfirmModal };
export default DeleteConfirmModal;
