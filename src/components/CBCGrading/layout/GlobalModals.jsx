import React from 'react';
import ConfirmDialog from '../shared/ConfirmDialog';
import AddEditParentModal from '../shared/AddEditParentModal';
import Toast from '../shared/Toast';

/**
 * Manager for global modals and notifications
 * Extracted from CBCGradingSystem.jsx
 */
const GlobalModals = ({
  showConfirmDialog,
  setShowConfirmDialog,
  confirmAction,
  showParentModal,
  setShowParentModal,
  editingParent,
  handleSaveParent,
  showToast,
  toastMessage,
  toastType,
  hideNotification
}) => {
  return (
    <>
      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={confirmAction}
        title="Confirm Action"
        message="Are you sure you want to proceed? This action may be permanent."
      />

      {/* Parent Modal */}
      <AddEditParentModal
        isOpen={showParentModal}
        onClose={() => setShowParentModal(false)}
        onSave={handleSaveParent}
        parent={editingParent}
      />

      {/* Global Notifications */}
      <Toast
        show={showToast}
        message={toastMessage}
        type={toastType}
        onClose={hideNotification}
      />
    </>
  );
};

export default GlobalModals;
