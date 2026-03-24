import { useCallback } from 'react';
import { feeAPI, configAPI } from '../../../services/api';

/**
 * Custom hook to handle complex learner actions
 * Extracted from CBCGradingSystem.jsx
 */
export const useLearnerActions = ({
  updateLearner,
  createLearner,
  deleteLearner,
  bulkDeleteLearners,
  promoteLearners,
  transferOutLearner,
  showSuccess,
  showError,
  setEditingLearner,
  setCurrentPage,
  setShowConfirmDialog,
  setConfirmAction,
  learners
}) => {

  const handleSaveLearner = useCallback(async (learnerData) => {
    // Extract custom flags
    const { generateInvoice, ...dataToSave } = learnerData;

    // Use learnerData.id as the source of truth for edit vs create.
    const learnerId = learnerData.id;

    if (learnerId) {
      const result = await updateLearner(learnerId, dataToSave);
      if (result?.success) {
        showSuccess('Student updated successfully!');
        setEditingLearner(null);
      } else {
        showError('Error updating student: ' + (result?.error || 'Unknown error'));
      }
      return result;
    } else {
      const result = await createLearner(dataToSave);

      if (result.success) {
        showSuccess('Student added successfully!');

        // Handle Automatic Invoice Generation
        if (generateInvoice) {
          try {
            console.log('🔄 Starting automatic invoice generation for new learner...');
            const newLearner = result.data;

            let term = 'TERM_1';
            let academicYear = new Date().getFullYear();

            try {
              const termResp = await configAPI.getTermConfigs();
              const activeConfig = termResp.data?.find(t => t.isCurrent) || termResp.data?.[0];
              if (activeConfig) {
                term = activeConfig.term;
                academicYear = activeConfig.year;
              }
            } catch (err) {
              console.warn('Failed to fetch term config, using defaults', err);
            }

            const grade = newLearner.grade;
            const feeStructsResp = await feeAPI.getAllFeeStructures({
              grade,
              term,
              academicYear
            });

            let targetFeeStructureId = null;

            if (feeStructsResp.success && feeStructsResp.data && feeStructsResp.data.length > 0) {
              targetFeeStructureId = feeStructsResp.data[0].id;
            } else {
              console.log('🌱 No fee structure found. Seeding defaults...');
              showSuccess(`Seeding default fee structures for ${grade}...`);

              await feeAPI.seedDefaultFeeStructures();

              const retryResp = await feeAPI.getAllFeeStructures({ grade, term, academicYear });
              if (retryResp.success && retryResp.data?.length > 0) {
                targetFeeStructureId = retryResp.data[0].id;
              }
            }

            if (targetFeeStructureId) {
              const dueDate = new Date();
              dueDate.setDate(dueDate.getDate() + 30);

              await feeAPI.createInvoice({
                learnerId: newLearner.id,
                feeStructureId: targetFeeStructureId,
                term,
                academicYear,
                dueDate: dueDate.toISOString()
              });

              showSuccess('✅ Invoice generated automatically!');
            }
          } catch (invoiceError) {
            console.error('Failed to auto-generate invoice:', invoiceError);
          }
        }
      } else {
        const errorMsg = typeof result?.error === 'object' ? JSON.stringify(result?.error) : result?.error;
        showError('Error creating student: ' + errorMsg);
      }
      return result;
    }
  }, [updateLearner, createLearner, showSuccess, showError, setEditingLearner]);

  const handleDeleteLearner = useCallback(async (learnerId) => {
    setConfirmAction(() => async () => {
      const result = await deleteLearner(learnerId);
      if (result.success) {
        showSuccess('Student deleted successfully');
      } else {
        showSuccess('Error deleting student: ' + result.error);
      }
      setShowConfirmDialog(false);
    });
    setShowConfirmDialog(true);
  }, [deleteLearner, showSuccess, setConfirmAction, setShowConfirmDialog]);

  const handleBulkDeleteLearners = useCallback(async (learnerIds) => {
    const result = await bulkDeleteLearners(learnerIds);
    if (result.success) {
      const count = learnerIds.length;
      showSuccess(`${count} student${count !== 1 ? 's' : ''} deleted successfully`);
    } else {
      showSuccess(result.error || 'Error deleting students');
    }
  }, [bulkDeleteLearners, showSuccess]);

  const handlePromoteLearners = useCallback(async (learnerIds, nextGrade) => {
    const result = await promoteLearners(learnerIds, nextGrade);
    if (!result.success && result.error) {
      showSuccess('Error promoting students: ' + result.error);
    }
    return result;
  }, [promoteLearners, showSuccess]);

  const handleMarkAsExited = useCallback((learnerId) => {
    setConfirmAction(() => async () => {
      const learner = learners.find(l => l.id === learnerId);
      if (learner) {
        await updateLearner(learnerId, { ...learner, status: 'Exited' });
        showSuccess('Learner marked as exited successfully');
      }
      setShowConfirmDialog(false);
    });
    setShowConfirmDialog(true);
  }, [learners, updateLearner, showSuccess, setConfirmAction, setShowConfirmDialog]);

  const handleTransferOut = useCallback(async (transferData) => {
    const result = await transferOutLearner(transferData);
    if (result.success) {
      showSuccess('Student transfer processed successfully');
      setCurrentPage('learners-exited');
    } else {
      showSuccess('Error processing transfer: ' + result.error);
    }
    return result;
  }, [transferOutLearner, showSuccess, setCurrentPage]);

  return {
    handleSaveLearner,
    handleDeleteLearner,
    handleBulkDeleteLearners,
    handlePromoteLearners,
    handleMarkAsExited,
    handleTransferOut
  };
};
