'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create Chart of Accounts table
    await queryInterface.createTable('ChartOfAccounts', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      accountNumber: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      accountName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      accountType: {
        type: Sequelize.ENUM('asset', 'liability', 'equity', 'revenue', 'expense'),
        allowNull: false
      },
      normalBalance: {
        type: Sequelize.ENUM('debit', 'credit'),
        allowNull: false
      },
      parentAccount: {
        type: Sequelize.STRING,
        allowNull: true
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Create Journal Entries table
    await queryInterface.createTable('JournalEntries', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      entryNumber: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      entryDate: {
        type: Sequelize.DATE,
        allowNull: false
      },
      reference: {
        type: Sequelize.STRING,
        allowNull: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      source: {
        type: Sequelize.ENUM('manual', 'sale', 'purchase', 'payment', 'adjustment'),
        allowNull: false,
        defaultValue: 'manual'
      },
      isPosted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      postedDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      saleId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Sales',
          key: 'id'
        }
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Create Journal Entry Lines table
    await queryInterface.createTable('JournalEntryLines', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      journalEntryId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'JournalEntries',
          key: 'id'
        }
      },
      accountNumber: {
        type: Sequelize.STRING,
        allowNull: false
      },
      debitAmount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0
      },
      creditAmount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Create Accounts Payable table
    await queryInterface.createTable('AccountsPayables', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      billNumber: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      supplierName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      billDate: {
        type: Sequelize.DATE,
        allowNull: false
      },
      dueDate: {
        type: Sequelize.DATE,
        allowNull: false
      },
      amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false
      },
      paidAmount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0
      },
      status: {
        type: Sequelize.ENUM('pending', 'partial', 'paid', 'overdue'),
        allowNull: false,
        defaultValue: 'pending'
      },
      category: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Create Budgets table
    await queryInterface.createTable('Budgets', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      year: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      month: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      accountNumber: {
        type: Sequelize.STRING,
        allowNull: false
      },
      budgetedAmount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false
      },
      actualAmount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0
      },
      variance: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Create Audit Trail table
    await queryInterface.createTable('AuditTrails', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      tableName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      recordId: {
        type: Sequelize.STRING,
        allowNull: false
      },
      action: {
        type: Sequelize.ENUM('create', 'update', 'delete'),
        allowNull: false
      },
      oldValues: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      newValues: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      timestamp: {
        type: Sequelize.DATE,
        allowNull: false
      },
      ipAddress: {
        type: Sequelize.STRING,
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Insert initial Chart of Accounts
    const initialAccounts = [
      // Assets (1000-1999)
      { accountNumber: '1000', accountName: 'Cash', accountType: 'asset', normalBalance: 'debit', description: 'Cash on hand and in bank' },
      { accountNumber: '1100', accountName: 'Accounts Receivable', accountType: 'asset', normalBalance: 'debit', description: 'Amounts owed by customers' },
      { accountNumber: '1200', accountName: 'Inventory - Harvester Parts', accountType: 'asset', normalBalance: 'debit', description: 'Harvester spare parts inventory' },
      { accountNumber: '1300', accountName: 'Inventory - Tractor Parts', accountType: 'asset', normalBalance: 'debit', description: 'Tractor spare parts inventory' },
      { accountNumber: '1400', accountName: 'Prepaid Expenses', accountType: 'asset', normalBalance: 'debit', description: 'Prepaid rent, insurance, etc.' },
      { accountNumber: '1500', accountName: 'Equipment', accountType: 'asset', normalBalance: 'debit', description: 'Office equipment and tools' },
      
      // Liabilities (2000-2999)
      { accountNumber: '2000', accountName: 'Accounts Payable', accountType: 'liability', normalBalance: 'credit', description: 'Amounts owed to suppliers' },
      { accountNumber: '2100', accountName: 'Accrued Expenses', accountType: 'liability', normalBalance: 'credit', description: 'Accrued wages, utilities, etc.' },
      { accountNumber: '2200', accountName: 'Short-term Loans', accountType: 'liability', normalBalance: 'credit', description: 'Short-term bank loans' },
      
      // Equity (3000-3999)
      { accountNumber: '3000', accountName: 'Owner\'s Capital', accountType: 'equity', normalBalance: 'credit', description: 'Owner\'s investment in business' },
      { accountNumber: '3100', accountName: 'Retained Earnings', accountType: 'equity', normalBalance: 'credit', description: 'Accumulated profits/losses' },
      { accountNumber: '3200', accountName: 'Owner\'s Draw', accountType: 'equity', normalBalance: 'debit', description: 'Owner\'s withdrawals' },
      
      // Revenue (4000-4999)
      { accountNumber: '4000', accountName: 'Sales Revenue', accountType: 'revenue', normalBalance: 'credit', description: 'Revenue from sales of parts' },
      { accountNumber: '4100', accountName: 'Service Revenue', accountType: 'revenue', normalBalance: 'credit', description: 'Revenue from repair services' },
      { accountNumber: '4200', accountName: 'Other Income', accountType: 'revenue', normalBalance: 'credit', description: 'Miscellaneous income' },
      
      // Expenses (5000-5999)
      { accountNumber: '5000', accountName: 'Cost of Goods Sold', accountType: 'expense', normalBalance: 'debit', description: 'Cost of parts sold' },
      { accountNumber: '5100', accountName: 'Rent Expense', accountType: 'expense', normalBalance: 'debit', description: 'Office and warehouse rent' },
      { accountNumber: '5200', accountName: 'Utilities Expense', accountType: 'expense', normalBalance: 'debit', description: 'Electricity, water, internet' },
      { accountNumber: '5300', accountName: 'Salaries & Wages', accountType: 'expense', normalBalance: 'debit', description: 'Employee compensation' },
      { accountNumber: '5400', accountName: 'Office Supplies', accountType: 'expense', normalBalance: 'debit', description: 'Office materials and supplies' },
      { accountNumber: '5500', accountName: 'Transportation', accountType: 'expense', normalBalance: 'debit', description: 'Fuel, vehicle maintenance' },
      { accountNumber: '5600', accountName: 'Insurance', accountType: 'expense', normalBalance: 'debit', description: 'Business insurance premiums' },
      { accountNumber: '5700', accountName: 'Depreciation', accountType: 'expense', normalBalance: 'debit', description: 'Equipment depreciation' },
      { accountNumber: '5800', accountName: 'Interest Expense', accountType: 'expense', normalBalance: 'debit', description: 'Interest on loans' },
      { accountNumber: '5900', accountName: 'Miscellaneous Expense', accountType: 'expense', normalBalance: 'debit', description: 'Other business expenses' }
    ];

    for (const account of initialAccounts) {
      await queryInterface.bulkInsert('ChartOfAccounts', [{
        ...account,
        createdAt: new Date(),
        updatedAt: new Date()
      }]);
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('AuditTrails');
    await queryInterface.dropTable('Budgets');
    await queryInterface.dropTable('AccountsPayables');
    await queryInterface.dropTable('JournalEntryLines');
    await queryInterface.dropTable('JournalEntries');
    await queryInterface.dropTable('ChartOfAccounts');
  }
};
