import React, { useEffect, useState } from 'react';
import accountingAPI from '../../api/accounting';

const Input = (props) => (
  <input {...props} className={`border rounded px-3 py-2 w-full ${props.className || ''}`} />
);

const Select = ({ children, ...rest }) => (
  <select {...rest} className="border rounded px-3 py-2 w-full">
    {children}
  </select>
);

const AccountantPage = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Dashboard data
  const [financialDashboard, setFinancialDashboard] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  
  // Chart of Accounts
  const [accounts, setAccounts] = useState([]);
  const [newAccount, setNewAccount] = useState({
    accountNumber: '',
    accountName: '',
    accountType: 'asset',
    normalBalance: 'debit',
    parentAccount: '',
    description: ''
  });
  
  // Journal Entries
  const [journalEntries, setJournalEntries] = useState([]);
  const [newEntry, setNewEntry] = useState({
    entryDate: '',
    reference: '',
    description: '',
    source: 'manual',
    lines: [{ accountNumber: '', debitAmount: '', creditAmount: '', description: '' }]
  });
  
  // Budget
  const [budgets, setBudgets] = useState([]);
  const [newBudget, setNewBudget] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    accountNumber: '',
    budgetedAmount: '',
    notes: ''
  });

  const params = () => ({ startDate: from || undefined, endDate: to || undefined });

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [dashboardRes, suggestionsRes] = await Promise.all([
        accountingAPI.getFinancialDashboard(params()),
        accountingAPI.getEnhancedSuggestions(params()),
      ]);
      setFinancialDashboard(dashboardRes.data || dashboardRes);
      setSuggestions((suggestionsRes.data || suggestionsRes).suggestions || []);
    } catch (e) {
      console.error('Failed to load dashboard:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadAccounts = async () => {
    try {
      const response = await accountingAPI.listAccounts();
      setAccounts(response.data || response);
    } catch (e) {
      console.error('Failed to load accounts:', e);
    }
  };

  const loadJournalEntries = async () => {
    try {
      const response = await accountingAPI.listJournalEntries(params());
      setJournalEntries(response.data || response);
    } catch (e) {
      console.error('Failed to load journal entries:', e);
    }
  };

  const loadBudgets = async () => {
    try {
      const response = await accountingAPI.getBudgetVsActual(params());
      setBudgets(response.data || response);
    } catch (e) {
      console.error('Failed to load budgets:', e);
    }
  };

  useEffect(() => {
    loadDashboard();
    loadAccounts();
    loadJournalEntries();
    loadBudgets();
  }, []);

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    if (!newAccount.accountNumber || !newAccount.accountName) return;
    
    setLoading(true);
    try {
      await accountingAPI.createAccount(newAccount);
      setNewAccount({
        accountNumber: '',
        accountName: '',
        accountType: 'asset',
        normalBalance: 'debit',
        parentAccount: '',
        description: ''
      });
      await loadAccounts();
    } finally {
      setLoading(false);
    }
  };

  const handleCreateJournalEntry = async (e) => {
    e.preventDefault();
    if (!newEntry.description || newEntry.lines.length < 2) return;
    
    // Validate double-entry
    const totalDebits = newEntry.lines.reduce((sum, line) => sum + (parseFloat(line.debitAmount) || 0), 0);
    const totalCredits = newEntry.lines.reduce((sum, line) => sum + (parseFloat(line.creditAmount) || 0), 0);
    
    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      alert('Total debits must equal total credits');
      return;
    }
    
    setLoading(true);
    try {
      await accountingAPI.createJournalEntry(newEntry);
      setNewEntry({
        entryDate: '',
        reference: '',
        description: '',
        source: 'manual',
        lines: [{ accountNumber: '', debitAmount: '', creditAmount: '', description: '' }]
      });
      await loadJournalEntries();
    } finally {
      setLoading(false);
    }
  };

  const addJournalLine = () => {
    setNewEntry({
      ...newEntry,
      lines: [...newEntry.lines, { accountNumber: '', debitAmount: '', creditAmount: '', description: '' }]
    });
  };

  const removeJournalLine = (index) => {
    const newLines = newEntry.lines.filter((_, i) => i !== index);
    setNewEntry({ ...newEntry, lines: newLines });
  };

  const updateJournalLine = (index, field, value) => {
    const newLines = [...newEntry.lines];
    newLines[index][field] = value;
    setNewEntry({ ...newEntry, lines: newLines });
  };

  const handleCreateBudget = async (e) => {
    e.preventDefault();
    if (!newBudget.accountNumber || !newBudget.budgetedAmount) return;
    
    setLoading(true);
    try {
      await accountingAPI.createBudget(newBudget);
      setNewBudget({
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        accountNumber: '',
        budgetedAmount: '',
        notes: ''
      });
      await loadBudgets();
    } finally {
      setLoading(false);
    }
  };

  const onFilter = async () => {
    await Promise.all([loadDashboard(), loadJournalEntries(), loadBudgets()]);
  };

  const onIncomeStatement = async () => {
    setLoading(true);
    try {
      const resp = await accountingAPI.getIncomeStatement({ ...params(), format: 'pdf' });
      // For PDF, the response will be a blob, so we don't need to process it
      // The browser will automatically download the PDF
    } catch (err) {
      console.error('Failed to generate income statement PDF:', err);
      // Fallback to JSON if PDF fails
      try {
        const jsonResp = await accountingAPI.getIncomeStatement(params());
        const data = jsonResp.data || jsonResp;
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'income-statement.json';
        a.click();
        URL.revokeObjectURL(url);
      } catch (jsonErr) {
        console.error('Failed to generate income statement:', jsonErr);
      }
    } finally {
      setLoading(false);
    }
  };

  const onBalanceSheet = async () => {
    setLoading(true);
    try {
      const resp = await accountingAPI.getBalanceSheet({ ...params(), format: 'pdf' });
      // For PDF, the response will be a blob, so we don't need to process it
      // The browser will automatically download the PDF
    } catch (err) {
      console.error('Failed to generate balance sheet PDF:', err);
      // Fallback to JSON if PDF fails
      try {
        const jsonResp = await accountingAPI.getBalanceSheet(params());
        const data = jsonResp.data || jsonResp;
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'balance-sheet.json';
        a.click();
        URL.revokeObjectURL(url);
      } catch (jsonErr) {
        console.error('Failed to generate balance sheet:', jsonErr);
      }
    } finally {
      setLoading(false);
    }
  };

  const onCashFlow = async () => {
    setLoading(true);
    try {
      const resp = await accountingAPI.getCashFlow({ ...params(), format: 'pdf' });
      // For PDF, the response will be a blob, so we don't need to process it
      // The browser will automatically download the PDF
    } catch (err) {
      console.error('Failed to generate cash flow PDF:', err);
      // Fallback to JSON if PDF fails
      try {
        const jsonResp = await accountingAPI.getCashFlow(params());
        const data = jsonResp.data || jsonResp;
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'cash-flow.json';
        a.click();
        URL.revokeObjectURL(url);
      } catch (jsonErr) {
        console.error('Failed to generate cash flow:', jsonErr);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Date Filter and Report Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div>
          <label className="block text-sm font-medium mb-1">From</label>
          <Input type="date" value={from} onChange={e => setFrom(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">To</label>
          <Input type="date" value={to} onChange={e => setTo(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <button onClick={onFilter} className="px-4 py-2 bg-blue-600 text-white rounded">Apply</button>
        </div>
        <div className="flex gap-2">
          <button onClick={onIncomeStatement} className="px-3 py-2 bg-gray-700 text-white rounded text-sm">Income Statement (PDF)</button>
          <button onClick={onBalanceSheet} className="px-3 py-2 bg-gray-700 text-white rounded text-sm">Balance Sheet (PDF)</button>
          <button onClick={onCashFlow} className="px-3 py-2 bg-gray-700 text-white rounded text-sm">Cash Flow (PDF)</button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {['dashboard', 'chart-of-accounts', 'journal-entries', 'budgets'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
            </button>
          ))}
        </nav>
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {financialDashboard ? (
            <>
              {/* Business Overview */}
              <div className="bg-white p-6 rounded shadow">
                <h3 className="font-semibold mb-4">Business Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">Total Products</div>
                    <div className="text-lg font-semibold">{financialDashboard.businessMetrics?.totalProducts || 0}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Total Customers</div>
                    <div className="text-lg font-semibold">{financialDashboard.businessMetrics?.totalCustomers || 0}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Total Sales</div>
                    <div className="text-lg font-semibold">{financialDashboard.businessMetrics?.totalSales || 0}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Average Order Value</div>
                    <div className="text-lg font-semibold">${Number(financialDashboard.businessMetrics?.averageOrderValue || 0).toFixed(2)}</div>
                  </div>
                </div>
              </div>

              {/* Financial Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-4 rounded shadow">
                  <div className="text-gray-500 text-sm">Revenue</div>
                  <div className="text-2xl font-bold">${Number(financialDashboard.summary?.revenue || 0).toFixed(2)}</div>
                </div>
                <div className="bg-white p-4 rounded shadow">
                  <div className="text-gray-500 text-sm">Net Profit</div>
                  <div className="text-2xl font-bold">${Number(financialDashboard.summary?.netProfit || 0).toFixed(2)}</div>
                </div>
                <div className="bg-white p-4 rounded shadow">
                  <div className="text-gray-500 text-sm">Gross Profit</div>
                  <div className="text-2xl font-bold">${Number(financialDashboard.summary?.grossProfit || 0).toFixed(2)}</div>
                </div>
              </div>

              {/* KPIs */}
              <div className="bg-white p-6 rounded shadow">
                <h3 className="font-semibold mb-4">Key Performance Indicators</h3>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">Gross Profit Margin</div>
                    <div className="text-lg font-semibold">{financialDashboard.kpis?.grossProfitMargin || 0}%</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Net Profit Margin</div>
                    <div className="text-lg font-semibold">{financialDashboard.kpis?.netProfitMargin || 0}%</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Inventory Turnover</div>
                    <div className="text-lg font-semibold">{financialDashboard.kpis?.inventoryTurnover || 0}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Days Sales Outstanding</div>
                    <div className="text-lg font-semibold">{financialDashboard.kpis?.daysSalesOutstanding || 0}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Current Ratio</div>
                    <div className="text-lg font-semibold">{financialDashboard.kpis?.currentRatio || 0}</div>
                  </div>
                </div>
              </div>

              {/* Balances */}
              <div className="bg-white p-6 rounded shadow">
                <h3 className="font-semibold mb-4">Current Balances</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">Accounts Receivable</div>
                    <div className="text-lg font-semibold">${Number(financialDashboard.balances?.accountsReceivable || 0).toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Accounts Payable</div>
                    <div className="text-lg font-semibold">${Number(financialDashboard.balances?.accountsPayable || 0).toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Inventory Value</div>
                    <div className="text-lg font-semibold">${Number(financialDashboard.balances?.inventory || 0).toFixed(2)}</div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white p-6 rounded shadow text-center">
              <div className="text-gray-500 text-lg">No financial data available for the selected period</div>
              <div className="text-sm text-gray-400 mt-2">Try adjusting the date range or add some sales data</div>
            </div>
          )}

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="bg-white p-6 rounded shadow">
              <h3 className="font-semibold mb-4">Business Intelligence Suggestions</h3>
              <ul className="list-disc pl-6 space-y-2">
                {suggestions.map((suggestion, i) => (
                  <li key={i} className="text-gray-700">{suggestion}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Chart of Accounts Tab */}
      {activeTab === 'chart-of-accounts' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded shadow">
            <h3 className="font-semibold mb-4">Add New Account</h3>
            <form onSubmit={handleCreateAccount} className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input placeholder="Account Number" value={newAccount.accountNumber} onChange={e => setNewAccount({...newAccount, accountNumber: e.target.value})} />
              <Input placeholder="Account Name" value={newAccount.accountName} onChange={e => setNewAccount({...newAccount, accountName: e.target.value})} />
              <Select value={newAccount.accountType} onChange={e => setNewAccount({...newAccount, accountType: e.target.value})}>
                <option value="asset">Asset</option>
                <option value="liability">Liability</option>
                <option value="equity">Equity</option>
                <option value="revenue">Revenue</option>
                <option value="expense">Expense</option>
              </Select>
              <Select value={newAccount.normalBalance} onChange={e => setNewAccount({...newAccount, normalBalance: e.target.value})}>
                <option value="debit">Debit</option>
                <option value="credit">Credit</option>
              </Select>
              <Input placeholder="Parent Account (optional)" value={newAccount.parentAccount} onChange={e => setNewAccount({...newAccount, parentAccount: e.target.value})} />
              <button disabled={loading} className="px-4 py-2 bg-green-600 text-white rounded">Add Account</button>
            </form>
          </div>

          <div className="bg-white p-6 rounded shadow">
            <h3 className="font-semibold mb-4">Chart of Accounts</h3>
            <div className="overflow-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-2">Account #</th>
                    <th className="py-2">Name</th>
                    <th className="py-2">Type</th>
                    <th className="py-2">Normal Balance</th>
                    <th className="py-2">Parent</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map(account => (
                    <tr key={account.id} className="border-b">
                      <td className="py-2">{account.accountNumber}</td>
                      <td className="py-2">{account.accountName}</td>
                      <td className="py-2">{account.accountType}</td>
                      <td className="py-2">{account.normalBalance}</td>
                      <td className="py-2">{account.parentAccount || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Journal Entries Tab */}
      {activeTab === 'journal-entries' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded shadow">
            <h3 className="font-semibold mb-4">Create Journal Entry</h3>
            <form onSubmit={handleCreateJournalEntry} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input type="date" value={newEntry.entryDate} onChange={e => setNewEntry({...newEntry, entryDate: e.target.value})} />
                <Input placeholder="Reference" value={newEntry.reference} onChange={e => setNewEntry({...newEntry, reference: e.target.value})} />
                <Select value={newEntry.source} onChange={e => setNewEntry({...newEntry, source: e.target.value})}>
                  <option value="manual">Manual</option>
                  <option value="sale">Sale</option>
                  <option value="purchase">Purchase</option>
                  <option value="payment">Payment</option>
                  <option value="adjustment">Adjustment</option>
                </Select>
              </div>
              <Input placeholder="Description" value={newEntry.description} onChange={e => setNewEntry({...newEntry, description: e.target.value})} />
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Journal Lines</h4>
                  <button type="button" onClick={addJournalLine} className="px-3 py-1 bg-blue-600 text-white rounded text-sm">Add Line</button>
                </div>
                {newEntry.lines.map((line, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-2 items-center">
                    <Select value={line.accountNumber} onChange={e => updateJournalLine(index, 'accountNumber', e.target.value)}>
                      <option value="">Select Account</option>
                      {accounts.map(acc => (
                        <option key={acc.id} value={acc.accountNumber}>{acc.accountNumber} - {acc.accountName}</option>
                      ))}
                    </Select>
                    <Input placeholder="Debit Amount" type="number" step="0.01" value={line.debitAmount} onChange={e => updateJournalLine(index, 'debitAmount', e.target.value)} />
                    <Input placeholder="Credit Amount" type="number" step="0.01" value={line.creditAmount} onChange={e => updateJournalLine(index, 'creditAmount', e.target.value)} />
                    <Input placeholder="Description" value={line.description} onChange={e => updateJournalLine(index, 'description', e.target.value)} />
                    {newEntry.lines.length > 1 && (
                      <button type="button" onClick={() => removeJournalLine(index)} className="px-3 py-1 bg-red-600 text-white rounded text-sm">Remove</button>
                    )}
                  </div>
                ))}
              </div>
              
              <button disabled={loading} className="px-4 py-2 bg-green-600 text-white rounded">Create Entry</button>
            </form>
          </div>

          <div className="bg-white p-6 rounded shadow">
            <h3 className="font-semibold mb-4">Journal Entries</h3>
            <div className="overflow-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-2">Date</th>
                    <th className="py-2">Entry #</th>
                    <th className="py-2">Description</th>
                    <th className="py-2">Source</th>
                    <th className="py-2">Posted</th>
                  </tr>
                </thead>
                <tbody>
                  {journalEntries.map(entry => (
                    <tr key={entry.id} className="border-b">
                      <td className="py-2">{new Date(entry.entryDate).toLocaleDateString()}</td>
                      <td className="py-2">{entry.entryNumber}</td>
                      <td className="py-2">{entry.description}</td>
                      <td className="py-2">{entry.source}</td>
                      <td className="py-2">{entry.isPosted ? 'Yes' : 'No'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Budgets Tab */}
      {activeTab === 'budgets' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded shadow">
            <h3 className="font-semibold mb-4">Create Budget</h3>
            <form onSubmit={handleCreateBudget} className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Input type="number" placeholder="Year" value={newBudget.year} onChange={e => setNewBudget({...newBudget, year: e.target.value})} />
              <Select value={newBudget.month} onChange={e => setNewBudget({...newBudget, month: e.target.value})}>
                <option value="">All Year</option>
                {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                  <option key={m} value={m}>{new Date(2000, m-1).toLocaleString('default', { month: 'long' })}</option>
                ))}
              </Select>
              <Select value={newBudget.accountNumber} onChange={e => setNewBudget({...newBudget, accountNumber: e.target.value})}>
                <option value="">Select Account</option>
                {accounts.filter(acc => acc.accountType === 'expense').map(acc => (
                  <option key={acc.id} value={acc.accountNumber}>{acc.accountNumber} - {acc.accountName}</option>
                ))}
              </Select>
              <button disabled={loading} className="px-4 py-2 bg-green-600 text-white rounded">Create Budget</button>
            </form>
          </div>

          <div className="bg-white p-6 rounded shadow">
            <h3 className="font-semibold mb-4">Budget vs Actual</h3>
            <div className="overflow-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-2">Account</th>
                    <th className="py-2">Budgeted</th>
                    <th className="py-2">Actual</th>
                    <th className="py-2">Variance</th>
                    <th className="py-2">% Variance</th>
                  </tr>
                </thead>
                <tbody>
                  {budgets.map(budget => (
                    <tr key={budget.id} className="border-b">
                      <td className="py-2">{budget.account?.accountName || budget.accountNumber}</td>
                      <td className="py-2">{Number(budget.budgetedAmount).toFixed(2)}</td>
                      <td className="py-2">{Number(budget.actualAmount || 0).toFixed(2)}</td>
                      <td className="py-2">{Number(budget.variance || 0).toFixed(2)}</td>
                      <td className="py-2">
                        {budget.budgetedAmount > 0 ? 
                          ((budget.variance || 0) / budget.budgetedAmount * 100).toFixed(1) + '%' : 
                          '-'
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountantPage;


