// backend/create-historical-entries.js
const db = require('./models');
const { createSalesJournalEntry, createPaymentJournalEntry } = require('./controllers/accountingController');

async function createHistoricalEntries() {
  try {
    console.log('Creating historical journal entries for existing sales...');
    
    // Get all existing sales
    const sales = await db.Sale.findAll({
      include: [
        { model: db.SaleItem, as: 'items' },
        { model: db.Customer, as: 'customer' }
      ],
      order: [['saleDate', 'ASC']]
    });
    
    console.log(`Found ${sales.length} existing sales`);
    
    // Create journal entries for each sale
    for (const sale of sales) {
      try {
        // Check if journal entry already exists for this sale
        const existingEntry = await db.JournalEntry.findOne({
          where: { saleId: sale.id }
        });
        
        if (!existingEntry) {
          await createSalesJournalEntry(sale.id);
          console.log(`✓ Created journal entry for sale #${sale.id}`);
        } else {
          console.log(`- Journal entry already exists for sale #${sale.id}`);
        }
      } catch (error) {
        console.error(`✗ Failed to create journal entry for sale #${sale.id}:`, error.message);
      }
    }
    
    // Get all existing payments
    const payments = await db.Payment.findAll({
      include: [
        { model: db.Sale, as: 'sale' },
        { model: db.Customer, as: 'customer' }
      ],
      order: [['paymentDate', 'ASC']]
    });
    
    console.log(`Found ${payments.length} existing payments`);
    
    // Create journal entries for each payment
    for (const payment of payments) {
      try {
        // Check if journal entry already exists for this payment
        const existingEntry = await db.JournalEntry.findOne({
          where: { 
            source: 'payment',
            reference: `Payment #${payment.id}`
          }
        });
        
        if (!existingEntry) {
          await createPaymentJournalEntry(payment.id);
          console.log(`✓ Created journal entry for payment #${payment.id}`);
        } else {
          console.log(`- Journal entry already exists for payment #${payment.id}`);
        }
      } catch (error) {
        console.error(`✗ Failed to create journal entry for payment #${payment.id}:`, error.message);
      }
    }
    
    console.log('\nHistorical journal entries creation completed!');
    
    // Show summary
    const totalJournalEntries = await db.JournalEntry.count();
    const totalJournalLines = await db.JournalEntryLine.count();
    
    console.log(`\nSummary:`);
    console.log(`- Total Journal Entries: ${totalJournalEntries}`);
    console.log(`- Total Journal Lines: ${totalJournalLines}`);
    
  } catch (error) {
    console.error('Error creating historical entries:', error);
  } finally {
    process.exit(0);
  }
}

// Run the script
createHistoricalEntries();
