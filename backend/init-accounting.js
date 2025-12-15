// backend/init-accounting.js
const db = require('./models');

async function initAccounting() {
  try {
    console.log('Initializing Chart of Accounts based on real business data...');
    
    // Clear existing accounts to start fresh
    await db.ChartOfAccounts.destroy({ where: {} });
    console.log('Cleared existing Chart of Accounts');
    
    // Get real business data to create relevant accounts
    const products = await db.Product.findAll();
    const customers = await db.Customer.findAll();
    const sales = await db.Sale.findAll();
    
    console.log(`Found ${products.length} products, ${customers.length} customers, ${sales.length} sales`);
    
    // Create essential accounts based on your business structure
    const essentialAccounts = [
      // Assets (1000-1999)
      { accountNumber: '1000', accountName: 'Cash', accountType: 'asset', normalBalance: 'debit', description: 'Cash on hand and in bank' },
      { accountNumber: '1100', accountName: 'Accounts Receivable', accountType: 'asset', normalBalance: 'debit', description: 'Amounts owed by customers' },
      
      // Inventory accounts based on your actual product categories
      { accountNumber: '1200', accountName: 'Inventory - Harvester Parts', accountType: 'asset', normalBalance: 'debit', description: 'Harvester spare parts inventory' },
      { accountNumber: '1300', accountName: 'Inventory - Tractor Parts', accountType: 'asset', normalBalance: 'debit', description: 'Tractor spare parts inventory' },
      
      // Liabilities (2000-2999)
      { accountNumber: '2000', accountName: 'Accounts Payable', accountType: 'liability', normalBalance: 'credit', description: 'Amounts owed to suppliers' },
      
      // Equity (3000-3999)
      { accountNumber: '3000', accountName: 'Owner\'s Capital', accountType: 'equity', normalBalance: 'credit', description: 'Owner\'s investment in business' },
      { accountNumber: '3100', accountName: 'Retained Earnings', accountType: 'equity', normalBalance: 'credit', description: 'Accumulated profits/losses' },
      
      // Revenue (4000-4999)
      { accountNumber: '4000', accountName: 'Sales Revenue', accountType: 'revenue', normalBalance: 'credit', description: 'Revenue from sales of parts' },
      { accountNumber: '4100', accountName: 'Service Revenue', accountType: 'revenue', normalBalance: 'credit', description: 'Revenue from repair services' },
      
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

    // Create essential accounts
    for (const account of essentialAccounts) {
      await db.ChartOfAccounts.create({
        ...account,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    console.log(`Created ${essentialAccounts.length} essential Chart of Accounts entries`);
    
    // Create dynamic accounts based on your actual product categories
    const productCategories = [...new Set(products.map(p => p.category).filter(Boolean))];
    let dynamicAccountNumber = 6000;
    
    for (const category of productCategories) {
      if (category && category.trim()) {
        await db.ChartOfAccounts.create({
          accountNumber: dynamicAccountNumber.toString(),
          accountName: `Inventory - ${category}`,
          accountType: 'asset',
          normalBalance: 'debit',
          description: `Inventory for ${category} products`,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        dynamicAccountNumber++;
      }
    }
    
    // Create customer-specific receivable accounts if you have many customers
    if (customers.length > 10) {
      await db.ChartOfAccounts.create({
        accountNumber: '1110',
        accountName: 'Accounts Receivable - Current',
        accountType: 'asset',
        normalBalance: 'debit',
        description: 'Current customer receivables (0-30 days)',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      await db.ChartOfAccounts.create({
        accountNumber: '1120',
        accountName: 'Accounts Receivable - Overdue',
        accountType: 'asset',
        normalBalance: 'debit',
        description: 'Overdue customer receivables (30+ days)',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    // Test the accounts endpoint
    const accounts = await db.ChartOfAccounts.findAll();
    console.log(`Total Chart of Accounts created: ${accounts.length}`);
    
    // Show some sample accounts
    console.log('\nSample accounts created:');
    accounts.slice(0, 5).forEach(acc => {
      console.log(`  ${acc.accountNumber}: ${acc.accountName} (${acc.accountType})`);
    });
    
  } catch (error) {
    console.error('Error initializing accounting:', error);
  } finally {
    process.exit(0);
  }
}

// Run the initialization
initAccounting();
