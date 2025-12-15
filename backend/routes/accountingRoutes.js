const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/accountingController');

// Chart of Accounts
router.get('/accounts', ctrl.listAccounts);
router.post('/accounts', ctrl.createAccount);

// Journal Entries (Double-Entry System)
router.get('/journal-entries', ctrl.listJournalEntries);
router.post('/journal-entries', ctrl.createJournalEntry);

// Financial Reports
router.get('/balance-sheet', ctrl.balanceSheet);
router.get('/cash-flow', ctrl.cashFlowStatement);
router.get('/financial-dashboard', ctrl.financialDashboard);

// Budget Management
router.post('/budgets', ctrl.createBudget);
router.get('/budget-vs-actual', ctrl.budgetVsActual);

// Enhanced Suggestions
router.get('/enhanced-suggestions', ctrl.enhancedSuggestions);

// Business Summary
router.get('/business-summary', ctrl.getBusinessSummary);

// Legacy/Simple methods (for backward compatibility)
router.get('/entries', ctrl.listEntries);
router.post('/entries', ctrl.createEntry);
router.get('/summary', ctrl.summary);
router.get('/income-statement', ctrl.incomeStatement);
router.get('/suggestions', ctrl.suggestions);

module.exports = router;


