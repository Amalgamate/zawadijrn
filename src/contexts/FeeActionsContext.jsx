/**
 * FeeActionsContext
 *
 * Allows FeeCollectionPage to register its toolbar actions (Create Invoice,
 * Import Fees, Reset Invoices) so HorizontalSubmenu can render them as slim
 * icon links on the right side of the bar — without prop-drilling through
 * the entire CBCGradingSystem tree.
 *
 * Usage:
 *   FeeCollectionPage  → calls registerFeeActions({ onCreate, onImport, onDownloadTemplate, onReset, userRole })
 *   HorizontalSubmenu  → reads feeActions and renders the links
 */

import React, { createContext, useContext, useState, useCallback } from 'react';

const FeeActionsContext = createContext(null);

export const FeeActionsProvider = ({ children }) => {
  const [feeActions, setFeeActions] = useState(null);

  const registerFeeActions = useCallback((actions) => {
    setFeeActions(actions);
  }, []);

  const clearFeeActions = useCallback(() => {
    setFeeActions(null);
  }, []);

  return (
    <FeeActionsContext.Provider value={{ feeActions, registerFeeActions, clearFeeActions }}>
      {children}
    </FeeActionsContext.Provider>
  );
};

export const useFeeActions = () => {
  const ctx = useContext(FeeActionsContext);
  if (!ctx) throw new Error('useFeeActions must be used inside FeeActionsProvider');
  return ctx;
};
