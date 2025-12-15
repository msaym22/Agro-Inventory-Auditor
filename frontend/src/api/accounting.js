import api from './api';

// Chart of Accounts
export const listAccounts = (params) => api.get('/accounting/accounts', { params });
export const createAccount = (payload) => api.post('/accounting/accounts', payload);

// Journal Entries (Double-Entry System)
export const listJournalEntries = (params) => api.get('/accounting/journal-entries', { params });
export const createJournalEntry = (payload) => api.post('/accounting/journal-entries', payload);

// Financial Reports
export const getBalanceSheet = (params) => api.get('/accounting/balance-sheet', { params });
export const getCashFlow = (params) => api.get('/accounting/cash-flow', { params });
export const getFinancialDashboard = (params) => api.get('/accounting/financial-dashboard', { params });

// Budget Management
export const createBudget = (payload) => api.post('/accounting/budgets', payload);
export const getBudgetVsActual = (params) => api.get('/accounting/budget-vs-actual', { params });

// Enhanced Suggestions
export const getEnhancedSuggestions = (params) => api.get('/accounting/enhanced-suggestions', { params });

// Business Summary
export const getBusinessSummary = (params) => api.get('/accounting/business-summary', { params });

// Legacy/Simple methods (for backward compatibility)
export const listEntries = (params) => api.get('/accounting/entries', { params });
export const createEntry = (payload) => api.post('/accounting/entries', payload);
export const updateEntry = (id, payload) => api.put(`/accounting/entries/${id}`, payload);
export const deleteEntry = (id) => api.delete(`/accounting/entries/${id}`);
export const getSummary = (params) => api.get('/accounting/summary', { params });
export const getIncomeStatement = (params) => api.get('/accounting/income-statement', { params });
export const getSuggestions = (params) => api.get('/accounting/suggestions', { params });

export default {
  // Chart of Accounts
  listAccounts,
  createAccount,
  
  // Journal Entries
  listJournalEntries,
  createJournalEntry,
  
  // Financial Reports
  getBalanceSheet,
  getCashFlow,
  getFinancialDashboard,
  
  // Budget Management
  createBudget,
  getBudgetVsActual,
  
  // Enhanced Suggestions
  getEnhancedSuggestions,
  
  // Business Summary
  getBusinessSummary,
  
  // Legacy methods
  listEntries,
  createEntry,
  updateEntry,
  deleteEntry,
  getSummary,
  getIncomeStatement,
  getSuggestions,
};


