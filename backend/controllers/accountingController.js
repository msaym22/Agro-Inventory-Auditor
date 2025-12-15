const db = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../models');
const PDFDocument = require('pdfkit');

// Chart of Accounts Management
exports.createAccount = async (req, res) => {
  try {
    const { accountNumber, accountName, accountType, normalBalance, parentAccount, description } = req.body;
    
    if (!accountNumber || !accountName || !accountType || !normalBalance) {
      return res.status(400).json({ error: 'accountNumber, accountName, accountType, and normalBalance are required' });
    }

    const existing = await db.ChartOfAccounts.findOne({ where: { accountNumber } });
    if (existing) {
      return res.status(400).json({ error: 'Account number already exists' });
    }

    const account = await db.ChartOfAccounts.create({
      accountNumber,
      accountName,
      accountType,
      normalBalance,
      parentAccount,
      description
    });

    res.status(201).json(account);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create account', details: err.message });
  }
};

exports.listAccounts = async (req, res) => {
  try {
    const { type, active } = req.query;
    const where = {};
    
    if (type) where.accountType = type;
    if (active !== undefined) where.isActive = active === 'true';
    
    const accounts = await db.ChartOfAccounts.findAll({ 
      where, 
      order: [['accountNumber', 'ASC']] 
    });
    res.json(accounts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to list accounts', details: err.message });
  }
};

// Journal Entry Management (Double-Entry System)
exports.createJournalEntry = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { entryDate, reference, description, source, lines, saleId } = req.body;
    
    if (!description || !lines || lines.length < 2) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Description and at least 2 lines (debit/credit) are required' });
    }

    // Validate double-entry: total debits = total credits
    const totalDebits = lines.reduce((sum, line) => sum + (parseFloat(line.debitAmount) || 0), 0);
    const totalCredits = lines.reduce((sum, line) => sum + (parseFloat(line.creditAmount) || 0), 0);
    
    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Total debits must equal total credits' });
    }

    // Generate entry number
    const entryNumber = `JE-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const entry = await db.JournalEntry.create({
      entryNumber,
      entryDate: entryDate || new Date(),
      reference,
      description,
      source,
      saleId
    }, { transaction });

    // Create journal entry lines
    for (const line of lines) {
      await db.JournalEntryLine.create({
        journalEntryId: entry.id,
        accountNumber: line.accountNumber,
        debitAmount: line.debitAmount || 0,
        creditAmount: line.creditAmount || 0,
        description: line.description
      }, { transaction });
    }

    await transaction.commit();
    
    const createdEntry = await db.JournalEntry.findByPk(entry.id, {
      include: [{ model: db.JournalEntryLine, as: 'lines' }]
    });
    
    res.status(201).json(createdEntry);
  } catch (err) {
    await transaction.rollback();
    res.status(500).json({ error: 'Failed to create journal entry', details: err.message });
  }
};

exports.listJournalEntries = async (req, res) => {
  try {
    const { startDate, endDate, source, isPosted } = req.query;
    const where = {};
    
    if (startDate && endDate) {
      where.entryDate = { [Op.between]: [new Date(startDate), new Date(endDate)] };
    }
    if (source) where.source = source;
    if (isPosted !== undefined) where.isPosted = isPosted === 'true';
    
    const entries = await db.JournalEntry.findAll({
      where,
      include: [{ model: db.JournalEntryLine, as: 'lines' }],
      order: [['entryDate', 'DESC']]
    });
    
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: 'Failed to list journal entries', details: err.message });
  }
};

// Financial Reports
exports.balanceSheet = async (req, res) => {
  try {
    const { asOfDate, format } = req.query;
    const date = asOfDate ? new Date(asOfDate) : new Date();
    
    // Get account balances as of the specified date
    const accounts = await db.ChartOfAccounts.findAll({
      where: { isActive: true },
      order: [['accountNumber', 'ASC']]
    });

    const balances = {};
    
    for (const account of accounts) {
      let balance = 0;
      
      // Calculate balance from journal entries up to the specified date
      const lines = await db.JournalEntryLine.findAll({
        include: [{
          model: db.JournalEntry,
          as: 'journalEntry',
          where: { 
            entryDate: { [Op.lte]: date },
            isPosted: true 
          }
        }],
        where: { accountNumber: account.accountNumber }
      });
      
      for (const line of lines) {
        if (account.normalBalance === 'debit') {
          balance += parseFloat(line.debitAmount || 0) - parseFloat(line.creditAmount || 0);
        } else {
          balance += parseFloat(line.creditAmount || 0) - parseFloat(line.debitAmount || 0);
        }
      }
      
      balances[account.accountNumber] = {
        accountName: account.accountName,
        accountType: account.accountType,
        balance: Math.abs(balance),
        normalBalance: account.normalBalance
      };
    }

    // Group by account type
    const balanceSheet = {
      assets: [],
      liabilities: [],
      equity: []
    };

    Object.entries(balances).forEach(([accountNumber, data]) => {
      const item = { accountNumber, ...data };
      
      if (data.accountType === 'asset') {
        balanceSheet.assets.push(item);
      } else if (data.accountType === 'liability') {
        balanceSheet.liabilities.push(item);
      } else if (data.accountType === 'equity') {
        balanceSheet.equity.push(item);
      }
    });

    // Calculate totals
    const totalAssets = balanceSheet.assets.reduce((sum, item) => sum + item.balance, 0);
    const totalLiabilities = balanceSheet.liabilities.reduce((sum, item) => sum + item.balance, 0);
    const totalEquity = balanceSheet.equity.reduce((sum, item) => sum + item.balance, 0);

    const data = {
      asOfDate: date,
      balanceSheet,
      totals: { totalAssets, totalLiabilities, totalEquity },
      equation: `${totalAssets} = ${totalLiabilities} + ${totalEquity}`
    };

    if (format === 'pdf') {
      return generateBalanceSheetPDF(res, data);
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate balance sheet', details: err.message });
  }
};

exports.cashFlowStatement = async (req, res) => {
  try {
    const { startDate, endDate, format } = req.query;
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate) : new Date();
    
    // Operating activities (from sales and expenses)
    const salesRevenue = await db.Sale.sum('totalAmount', {
      where: { saleDate: { [Op.between]: [start, end] } }
    }) || 0;
    
    const expenses = await db.JournalEntryLine.sum('debitAmount', {
      include: [{
        model: db.JournalEntry,
        as: 'journalEntry',
        where: { 
          entryDate: { [Op.between]: [start, end] },
          isPosted: true 
        }
      }],
      where: {
        accountNumber: { [Op.like]: '%expense%' }
      }
    }) || 0;
    
    // Investing activities (asset purchases)
    const assetPurchases = await db.JournalEntryLine.sum('debitAmount', {
      include: [{
        model: db.JournalEntry,
        as: 'journalEntry',
        where: { 
          entryDate: { [Op.between]: [start, end] },
          isPosted: true 
        }
      }],
      where: {
        accountNumber: { [Op.like]: '%asset%' }
      }
    }) || 0;
    
    // Financing activities (loans, owner investments)
    const financing = await db.JournalEntryLine.sum('creditAmount', {
      include: [{
        model: db.JournalEntry,
        as: 'journalEntry',
        where: { 
          entryDate: { [Op.between]: [start, end] },
          isPosted: true 
        }
      }],
      where: {
        accountNumber: { [Op.like]: '%loan%' }
      }
    }) || 0;
    
    const netOperatingCash = salesRevenue - expenses;
    const netInvestingCash = -assetPurchases;
    const netFinancingCash = financing;
    const netChange = netOperatingCash + netInvestingCash + netFinancingCash;
    
    const data = {
      period: { startDate: start, endDate: end },
      operating: { salesRevenue, expenses, netOperatingCash },
      investing: { assetPurchases, netInvestingCash },
      financing: { financing, netFinancingCash },
      netChange,
      summary: {
        operating: netOperatingCash,
        investing: netInvestingCash,
        financing: netFinancingCash,
        total: netChange
      }
    };

    if (format === 'pdf') {
      return generateCashFlowPDF(res, data);
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate cash flow statement', details: err.message });
  }
};

// Financial KPIs and Dashboard
exports.financialDashboard = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate) : new Date();
    
    // Revenue and COGS from real sales data
    const salesRevenue = await db.Sale.sum('totalAmount', {
      where: { saleDate: { [Op.between]: [start, end] } }
    }) || 0;
    
    // Calculate COGS from actual sales
    const sales = await db.Sale.findAll({
      where: { saleDate: { [Op.between]: [start, end] } },
      include: [{ model: db.SaleItem, as: 'items' }]
    });
    
    let totalCOGS = 0;
    for (const sale of sales) {
      for (const item of sale.items || []) {
        // Get product cost from Product model
        const product = await db.Product.findByPk(item.productId);
        if (product && product.purchasePrice) {
          totalCOGS += parseFloat(product.purchasePrice) * item.quantity;
        }
      }
    }
    
    // Real expenses from journal entries (if any exist)
    const totalExpenses = await db.JournalEntryLine.sum('debitAmount', {
      include: [{
        model: db.JournalEntry,
        as: 'journalEntry',
        where: { 
          entryDate: { [Op.between]: [start, end] },
          isPosted: true 
        }
      }],
      where: {
        accountNumber: { [Op.like]: '%expense%' }
      }
    }) || 0;
    
    // Real Accounts Receivable from customer outstanding balances
    const totalAR = await db.Customer.sum('outstandingBalance') || 0;
    
    // Real Accounts Payable (if any exist)
    const totalAP = await db.AccountsPayable.sum('amount', {
      where: { status: { [Op.in]: ['pending', 'partial'] } }
    }) || 0;
    
    // Real Inventory Value from actual products
    const products = await db.Product.findAll();
    const inventoryValue = products.reduce((sum, product) => {
      return sum + (parseFloat(product.purchasePrice || 0) * (product.stock || 0));
    }, 0);
    
    // Calculate KPIs based on real data
    const grossProfit = salesRevenue - totalCOGS;
    const netProfit = grossProfit - totalExpenses;
    
    const grossProfitMargin = salesRevenue > 0 ? (grossProfit / salesRevenue) * 100 : 0;
    const netProfitMargin = salesRevenue > 0 ? (netProfit / salesRevenue) * 100 : 0;
    
    const inventoryTurnover = totalCOGS > 0 ? totalCOGS / (inventoryValue / 2) : 0;
    
    // DSO calculation
    const averageAR = totalAR / 2;
    const dso = salesRevenue > 0 ? (averageAR / salesRevenue) * 365 : 0;
    
    // Current ratio (simplified)
    const currentAssets = inventoryValue + totalAR;
    const currentLiabilities = totalAP;
    const currentRatio = currentLiabilities > 0 ? currentAssets / currentLiabilities : 0;
    
    // Get real business metrics
    const totalProducts = products.length;
    const totalCustomers = await db.Customer.count();
    const totalSales = sales.length;
    
    res.json({
      period: { startDate: start, endDate: end },
      summary: {
        revenue: salesRevenue,
        cogs: totalCOGS,
        grossProfit,
        expenses: totalExpenses,
        netProfit
      },
      balances: {
        accountsReceivable: totalAR,
        accountsPayable: totalAP,
        inventory: inventoryValue
      },
      kpis: {
        grossProfitMargin: grossProfitMargin.toFixed(2),
        netProfitMargin: netProfitMargin.toFixed(2),
        inventoryTurnover: inventoryTurnover.toFixed(2),
        daysSalesOutstanding: dso.toFixed(1),
        currentRatio: currentRatio.toFixed(2)
      },
      businessMetrics: {
        totalProducts,
        totalCustomers,
        totalSales,
        averageOrderValue: totalSales > 0 ? salesRevenue / totalSales : 0
      }
    });
  } catch (err) {
    console.error('Financial dashboard error:', err);
    res.status(500).json({ error: 'Failed to generate financial dashboard', details: err.message });
  }
};

// Enhanced suggestions based on KPIs
exports.enhancedSuggestions = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate) : new Date();
    
    const dashboard = await exports.financialDashboard({ query: { startDate, endDate } }, { json: (d) => d });
    const kpis = dashboard.kpis;
    
    const suggestions = [];
    
    // Gross Profit Margin suggestions
    if (parseFloat(kpis.grossProfitMargin) < 30) {
      suggestions.push({
        type: 'warning',
        category: 'Profitability',
        message: `Gross profit margin is ${kpis.grossProfitMargin}%, below recommended 30%. Consider reviewing pricing strategy or negotiating with suppliers.`
      });
    }
    
    // Inventory Turnover suggestions
    if (parseFloat(kpis.inventoryTurnover) < 4) {
      suggestions.push({
        type: 'warning',
        category: 'Inventory',
        message: `Inventory turnover is ${kpis.inventoryTurnover}, indicating slow-moving stock. Consider promotions or bundle deals to clear inventory.`
      });
    }
    
    // DSO suggestions
    if (parseFloat(kpis.daysSalesOutstanding) > 45) {
      suggestions.push({
        type: 'warning',
        category: 'Cash Flow',
        message: `Days Sales Outstanding is ${kpis.daysSalesOutstanding} days. Implement stricter credit policies or follow up on overdue invoices.`
      });
    }
    
    // Current Ratio suggestions
    if (parseFloat(kpis.currentRatio) < 1.5) {
      suggestions.push({
        type: 'warning',
        category: 'Liquidity',
        message: `Current ratio is ${kpis.currentRatio}, below recommended 1.5. Monitor cash flow and consider short-term financing.`
      });
    }
    
    // Product-specific suggestions
    const products = await db.Product.findAll({
      include: [{ model: db.SaleItem, as: 'saleItems' }]
    });
    
    for (const product of products) {
      if (product.stock > 0 && product.purchasePrice > 0) {
        const sellingPrice = product.sellingPrice || 0;
        const margin = sellingPrice > 0 ? ((sellingPrice - product.purchasePrice) / sellingPrice) * 100 : 0;
        
        if (margin < 25) {
          suggestions.push({
            type: 'info',
            category: 'Product Margin',
            message: `${product.name} has a margin of ${margin.toFixed(1)}%. Consider price increase or supplier negotiation.`
          });
        }
      }
    }
    
    res.json({ suggestions });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate suggestions', details: err.message });
  }
};

// Budget Management
exports.createBudget = async (req, res) => {
  try {
    const { year, month, accountNumber, budgetedAmount, notes } = req.body;
    
    if (!year || !accountNumber || budgetedAmount === undefined) {
      return res.status(400).json({ error: 'year, accountNumber, and budgetedAmount are required' });
    }
    
    const budget = await db.Budget.create({
      year,
      month,
      accountNumber,
      budgetedAmount,
      notes
    });
    
    res.status(201).json(budget);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create budget', details: err.message });
  }
};

exports.budgetVsActual = async (req, res) => {
  try {
    const { year, month } = req.query;
    const where = { year: parseInt(year) || new Date().getFullYear() };
    if (month) where.month = parseInt(month);
    
    const budgets = await db.Budget.findAll({
      where,
      include: [{ model: db.ChartOfAccounts, as: 'account' }]
    });
    
    // Calculate actual amounts for each budgeted account
    for (const budget of budgets) {
      const actualAmount = await db.JournalEntryLine.sum('debitAmount', {
        include: [{
          model: db.JournalEntry,
          as: 'journalEntry',
          where: { 
            entryDate: { 
              [Op.between]: [
                new Date(budget.year, budget.month - 1 || 0, 1),
                new Date(budget.year, budget.month || 11, 31)
              ]
            },
            isPosted: true 
          }
        }],
        where: { accountNumber: budget.accountNumber }
      }) || 0;
      
      budget.actualAmount = actualAmount;
      budget.variance = budget.budgetedAmount - actualAmount;
    }
    
    res.json(budgets);
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate budget vs actual report', details: err.message });
  }
};

// Keep existing simple methods for backward compatibility
exports.createEntry = async (req, res) => {
  try {
    const { type, category, amount, entryDate, notes } = req.body;
    if (!type || !category || amount == null) {
      return res.status(400).json({ error: 'type, category, amount are required' });
    }
    
    // Create a simple journal entry for manual entries
    const entryNumber = `JE-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    const entry = await db.JournalEntry.create({
      entryNumber,
      entryDate: entryDate || new Date(),
      description: `${type}: ${category} - ${notes || ''}`,
      source: 'manual'
    });
    
    // Create debit/credit lines based on type
    if (type === 'expense') {
      await db.JournalEntryLine.create({
        journalEntryId: entry.id,
        accountNumber: '6000', // Expense account
        debitAmount: amount,
        creditAmount: 0,
        description: category
      });
      
      await db.JournalEntryLine.create({
        journalEntryId: entry.id,
        accountNumber: '1000', // Cash account
        debitAmount: 0,
        creditAmount: amount,
        description: 'Cash payment'
      });
    } else if (type === 'revenue') {
      await db.JournalEntryLine.create({
        journalEntryId: entry.id,
        accountNumber: '4000', // Revenue account
        debitAmount: 0,
        creditAmount: amount,
        description: category
      });
      
      await db.JournalEntryLine.create({
        journalEntryId: entry.id,
        accountNumber: '1000', // Cash account
        debitAmount: amount,
        creditAmount: 0,
        description: 'Cash receipt'
      });
    }
    
    res.status(201).json(entry);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create entry', details: err.message });
  }
};

exports.listEntries = async (req, res) => {
  try {
    const { startDate, endDate, type } = req.query;
    const where = {};
    if (type) where.source = type;
    if (startDate && endDate) {
      where.entryDate = { [Op.between]: [new Date(startDate), new Date(endDate)] };
    }
    
    const entries = await db.JournalEntry.findAll({
      where,
      include: [{ model: db.JournalEntryLine, as: 'lines' }],
      order: [['entryDate', 'DESC']]
    });
    
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: 'Failed to list entries', details: err.message });
  }
};

exports.summary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate) : new Date();
    
    // Get manual entries
    const manualEntries = await db.JournalEntry.findAll({
      where: { 
        source: 'manual',
        entryDate: { [Op.between]: [start, end] }
      },
      include: [{ model: db.JournalEntryLine, as: 'lines' }]
    });
    
    let manualRevenue = 0;
    let manualExpenses = 0;
    
    for (const entry of manualEntries) {
      for (const line of entry.lines || []) {
        if (line.accountNumber === '4000') { // Revenue account
          manualRevenue += parseFloat(line.creditAmount || 0);
        } else if (line.accountNumber === '6000') { // Expense account
          manualExpenses += parseFloat(line.debitAmount || 0);
        }
      }
    }
    
    // Get auto revenue from sales
    const sales = await db.Sale.findAll({
      where: { saleDate: { [Op.between]: [start, end] } }
    });
    const autoRevenue = sales.reduce((sum, sale) => sum + (parseFloat(sale.totalAmount) || 0), 0);
    
    const totalRevenue = manualRevenue + autoRevenue;
    const grossProfit = totalRevenue - manualExpenses;
    
    res.json({
      revenue: totalRevenue,
      manualRevenue,
      autoRevenue,
      expenses: manualExpenses,
      grossProfit
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to compute summary', details: err.message });
  }
};

exports.incomeStatement = async (req, res) => {
  try {
    const { startDate, endDate, format } = req.query;
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate) : new Date();
    
    // Get revenue and expenses from journal entries
    const entries = await db.JournalEntry.findAll({
      where: { entryDate: { [Op.between]: [start, end] } },
      include: [{ model: db.JournalEntryLine, as: 'lines' }]
    });
    
    let revenue = 0;
    let expenses = 0;
    
    for (const entry of entries) {
      for (const line of entry.lines || []) {
        if (line.accountNumber === '4000') { // Revenue
          revenue += parseFloat(line.creditAmount || 0);
        } else if (line.accountNumber === '6000') { // Expenses
          expenses += parseFloat(line.debitAmount || 0);
        }
      }
    }
    
    // Add sales revenue
    const sales = await db.Sale.findAll({
      where: { saleDate: { [Op.between]: [start, end] } }
    });
    const salesRevenue = sales.reduce((sum, sale) => sum + (parseFloat(sale.totalAmount) || 0), 0);
    
    const totalRevenue = revenue + salesRevenue;
    const netIncome = totalRevenue - expenses;
    
    const data = {
      period: { startDate: start, endDate: end },
      revenue: { manual: revenue, sales: salesRevenue, total: totalRevenue },
      expenses: { total: expenses },
      netIncome
    };

    if (format === 'pdf') {
      return generateIncomeStatementPDF(res, data);
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate income statement', details: err.message });
  }
};

exports.suggestions = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const suggestions = [];
    
    // Basic suggestions based on summary
    const summary = await exports.summary({ query: { startDate, endDate } }, { json: (d) => d });
    
    if (summary.expenses > summary.revenue * 0.7) {
      suggestions.push('Expenses exceed 70% of revenue. Review major expense categories.');
    }
    
    if (summary.revenue < 1) {
      suggestions.push('Low revenue detected. Consider promotions or customer outreach.');
    }
    
    // Enhanced suggestions from KPI dashboard
    const enhancedSuggestions = await exports.enhancedSuggestions({ query: { startDate, endDate } }, { json: (d) => d });
    suggestions.push(...enhancedSuggestions.suggestions.map(s => s.message));
    
    res.json({ suggestions });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate suggestions', details: err.message });
  }
};

// PDF Generation Functions
function generateIncomeStatementPDF(res, data) {
  const doc = new PDFDocument();
  
  // Set response headers for PDF download
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=income-statement.pdf');
  
  doc.pipe(res);
  
  // Add content to PDF
  doc.fontSize(20).text('Income Statement', { align: 'center' });
  doc.moveDown();
  
  doc.fontSize(12).text(`Period: ${new Date(data.period.startDate).toLocaleDateString()} - ${new Date(data.period.endDate).toLocaleDateString()}`);
  doc.moveDown();
  
  doc.fontSize(14).text('Revenue', { underline: true });
  doc.fontSize(12).text(`Manual Revenue: $${data.revenue.manual.toFixed(2)}`);
  doc.fontSize(12).text(`Sales Revenue: $${data.revenue.sales.toFixed(2)}`);
  doc.fontSize(12).text(`Total Revenue: $${data.revenue.total.toFixed(2)}`);
  doc.moveDown();
  
  doc.fontSize(14).text('Expenses', { underline: true });
  doc.fontSize(12).text(`Total Expenses: $${data.expenses.total.toFixed(2)}`);
  doc.moveDown();
  
  doc.fontSize(16).text(`Net Income: $${data.netIncome.toFixed(2)}`, { underline: true });
  
  doc.end();
}

function generateBalanceSheetPDF(res, data) {
  const doc = new PDFDocument();
  
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=balance-sheet.pdf');
  
  doc.pipe(res);
  
  doc.fontSize(20).text('Balance Sheet', { align: 'center' });
  doc.moveDown();
  
  doc.fontSize(12).text(`As of: ${new Date(data.asOfDate).toLocaleDateString()}`);
  doc.moveDown();
  
  doc.fontSize(14).text('Assets', { underline: true });
  data.balanceSheet.assets.forEach(asset => {
    doc.fontSize(12).text(`${asset.accountName}: $${asset.balance.toFixed(2)}`);
  });
  doc.fontSize(12).text(`Total Assets: $${data.totals.totalAssets.toFixed(2)}`);
  doc.moveDown();
  
  doc.fontSize(14).text('Liabilities', { underline: true });
  data.balanceSheet.liabilities.forEach(liability => {
    doc.fontSize(12).text(`${liability.accountName}: $${liability.balance.toFixed(2)}`);
  });
  doc.fontSize(12).text(`Total Liabilities: $${data.totals.totalLiabilities.toFixed(2)}`);
  doc.moveDown();
  
  doc.fontSize(14).text('Equity', { underline: true });
  data.balanceSheet.equity.forEach(equity => {
    doc.fontSize(12).text(`${equity.accountName}: $${equity.balance.toFixed(2)}`);
  });
  doc.fontSize(12).text(`Total Equity: $${data.totals.totalEquity.toFixed(2)}`);
  doc.moveDown();
  
  doc.fontSize(12).text(`Equation: ${data.equation}`);
  
  doc.end();
}

function generateCashFlowPDF(res, data) {
  const doc = new PDFDocument();
  
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=cash-flow-statement.pdf');
  
  doc.pipe(res);
  
  doc.fontSize(20).text('Cash Flow Statement', { align: 'center' });
  doc.moveDown();
  
  doc.fontSize(12).text(`Period: ${new Date(data.period.startDate).toLocaleDateString()} - ${new Date(data.period.endDate).toLocaleDateString()}`);
  doc.moveDown();
  
  doc.fontSize(14).text('Operating Activities', { underline: true });
  doc.fontSize(12).text(`Sales Revenue: $${data.operating.salesRevenue.toFixed(2)}`);
  doc.fontSize(12).text(`Expenses: $${data.operating.expenses.toFixed(2)}`);
  doc.fontSize(12).text(`Net Operating Cash: $${data.operating.netOperatingCash.toFixed(2)}`);
  doc.moveDown();
  
  doc.fontSize(14).text('Investing Activities', { underline: true });
  doc.fontSize(12).text(`Asset Purchases: $${data.investing.assetPurchases.toFixed(2)}`);
  doc.fontSize(12).text(`Net Investing Cash: $${data.investing.netInvestingCash.toFixed(2)}`);
  doc.moveDown();
  
  doc.fontSize(14).text('Financing Activities', { underline: true });
  doc.fontSize(12).text(`Financing: $${data.financing.financing.toFixed(2)}`);
  doc.fontSize(12).text(`Net Financing Cash: $${data.financing.netFinancingCash.toFixed(2)}`);
  doc.moveDown();
  
  doc.fontSize(16).text(`Net Change in Cash: $${data.netChange.toFixed(2)}`, { underline: true });
  
  doc.end();
}

// Auto-create journal entries for sales (integrate with real business data)
exports.createSalesJournalEntry = async (saleId) => {
  try {
    const sale = await db.Sale.findByPk(saleId, {
      include: [
        { model: db.SaleItem, as: 'items' },
        { model: db.Customer, as: 'customer' }
      ]
    });

    if (!sale) {
      throw new Error('Sale not found');
    }

    // Generate entry number
    const entryNumber = `JE-SALE-${sale.id}-${Date.now()}`;
    
    // Create the journal entry
    const journalEntry = await db.JournalEntry.create({
      entryNumber,
      entryDate: sale.saleDate,
      reference: `Sale #${sale.id}`,
      description: `Sale to ${sale.customer?.name || 'Customer'} - ${sale.items?.length || 0} items`,
      source: 'sale',
      saleId: sale.id,
      isPosted: true,
      postedDate: new Date()
    });

    // Calculate total COGS
    let totalCOGS = 0;
    for (const item of sale.items || []) {
      const product = await db.Product.findByPk(item.productId);
      if (product && product.purchasePrice) {
        totalCOGS += parseFloat(product.purchasePrice) * item.quantity;
      }
    }

    // Create journal entry lines for the sale
    const journalLines = [];

    // 1. Debit Accounts Receivable (or Cash if paid)
    journalLines.push({
      journalEntryId: journalEntry.id,
      accountNumber: sale.paymentStatus === 'paid' ? '1000' : '1100', // Cash if paid, AR if not
      debitAmount: sale.totalAmount,
      creditAmount: 0,
      description: `Sale amount for ${sale.items?.length || 0} items`
    });

    // 2. Credit Sales Revenue
    journalLines.push({
      journalEntryId: journalEntry.id,
      accountNumber: '4000', // Sales Revenue
      debitAmount: 0,
      creditAmount: sale.totalAmount,
      description: 'Revenue from sale'
    });

    // 3. Debit Cost of Goods Sold
    if (totalCOGS > 0) {
      journalLines.push({
        journalEntryId: journalEntry.id,
        accountNumber: '5000', // COGS
        debitAmount: totalCOGS,
        creditAmount: 0,
        description: 'Cost of goods sold'
      });

      // 4. Credit Inventory
      journalLines.push({
        journalEntryId: journalEntry.id,
        accountNumber: '1200', // Inventory
        debitAmount: 0,
        creditAmount: totalCOGS,
        description: 'Reduce inventory for items sold'
      });
    }

    // Create all journal lines
    for (const line of journalLines) {
      await db.JournalEntryLine.create(line);
    }

    console.log(`Created journal entry ${entryNumber} for sale ${sale.id}`);
    return journalEntry;

  } catch (error) {
    console.error('Error creating sales journal entry:', error);
    throw error;
  }
};

// Auto-create journal entries for payments
exports.createPaymentJournalEntry = async (paymentId) => {
  try {
    const payment = await db.Payment.findByPk(paymentId, {
      include: [
        { model: db.Sale, as: 'sale' },
        { model: db.Customer, as: 'customer' }
      ]
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    // Generate entry number
    const entryNumber = `JE-PAYMENT-${payment.id}-${Date.now()}`;
    
    // Create the journal entry
    const journalEntry = await db.JournalEntry.create({
      entryNumber,
      entryDate: payment.paymentDate,
      reference: `Payment #${payment.id}`,
      description: `Payment from ${payment.customer?.name || 'Customer'} for sale #${payment.sale?.id || 'N/A'}`,
      source: 'payment',
      isPosted: true,
      postedDate: new Date()
    });

    // Create journal entry lines for the payment
    const journalLines = [];

    // 1. Debit Cash
    journalLines.push({
      journalEntryId: journalEntry.id,
      accountNumber: '1000', // Cash
      debitAmount: payment.amount,
      creditAmount: 0,
      description: 'Cash received from customer'
    });

    // 2. Credit Accounts Receivable
    journalLines.push({
      journalEntryId: journalEntry.id,
      accountNumber: '1100', // Accounts Receivable
      debitAmount: 0,
      creditAmount: payment.amount,
      description: 'Reduce customer receivable balance'
    });

    // Create all journal lines
    for (const line of journalLines) {
      await db.JournalEntryLine.create(line);
    }

    console.log(`Created journal entry ${entryNumber} for payment ${payment.id}`);
    return journalEntry;

  } catch (error) {
    console.error('Error creating payment journal entry:', error);
    throw error;
  }
};

// Get real-time business summary
exports.getBusinessSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate) : new Date();
    
    // Get real business metrics
    const totalProducts = await db.Product.count();
    const totalCustomers = await db.Customer.count();
    const totalSales = await db.Sale.count({
      where: { saleDate: { [Op.between]: [start, end] } }
    });
    
    const totalRevenue = await db.Sale.sum('totalAmount', {
      where: { saleDate: { [Op.between]: [start, end] } }
    }) || 0;
    
    const totalPayments = await db.Payment.sum('amount', {
      where: { paymentDate: { [Op.between]: [start, end] } }
    }) || 0;
    
    const outstandingReceivables = await db.Customer.sum('outstandingBalance') || 0;
    
    // Get top selling products
    const topProducts = await db.SaleItem.findAll({
      include: [{ model: db.Product, as: 'product' }],
      attributes: [
        'productId',
        [sequelize.fn('SUM', sequelize.col('quantity')), 'totalQuantity'],
        [sequelize.fn('SUM', sequelize.literal('quantity * price')), 'totalRevenue']
      ],
      where: {
        '$sale.saleDate$': { [Op.between]: [start, end] }
      },
      include: [{
        model: db.Sale,
        as: 'sale',
        attributes: []
      }],
      group: ['productId'],
      order: [[sequelize.fn('SUM', sequelize.col('quantity')), 'DESC']],
      limit: 5
    });
    
    res.json({
      period: { startDate: start, endDate: end },
      overview: {
        totalProducts,
        totalCustomers,
        totalSales,
        totalRevenue,
        totalPayments,
        outstandingReceivables
      },
      topProducts: topProducts.map(item => ({
        productName: item.product?.name || 'Unknown',
        totalQuantity: parseInt(item.dataValues.totalQuantity),
        totalRevenue: parseFloat(item.dataValues.totalRevenue || 0)
      }))
    });
    
  } catch (err) {
    console.error('Business summary error:', err);
    res.status(500).json({ error: 'Failed to generate business summary', details: err.message });
  }
};


