const { sequelize } = require('./models');
const { QueryTypes } = require('sequelize');

async function fixCustomersTable() {
  try {
    console.log('Starting Customers table fix...');
    
    // Check for customers with null IDs
    const nullIdCustomers = await sequelize.query(
      'SELECT * FROM Customers WHERE id IS NULL',
      { type: QueryTypes.SELECT }
    );
    
    if (nullIdCustomers.length > 0) {
      console.log(`Found ${nullIdCustomers.length} customers with null IDs`);
      
      // Delete customers with null IDs
      await sequelize.query(
        'DELETE FROM Customers WHERE id IS NULL',
        { type: QueryTypes.DELETE }
      );
      console.log('Deleted customers with null IDs');
    }
    
    // Check for duplicate IDs
    const duplicateIds = await sequelize.query(
      'SELECT id, COUNT(*) as count FROM Customers GROUP BY id HAVING COUNT(*) > 1',
      { type: QueryTypes.SELECT }
    );
    
    if (duplicateIds.length > 0) {
      console.log(`Found ${duplicateIds.length} duplicate IDs`);
      
      for (const dup of duplicateIds) {
        // Keep the first record, delete duplicates
        const duplicates = await sequelize.query(
          'SELECT * FROM Customers WHERE id = ? ORDER BY createdAt ASC',
          { 
            type: QueryTypes.SELECT,
            replacements: [dup.id]
          }
        );
        
        if (duplicates.length > 1) {
          // Delete all but the first record
          const idsToDelete = duplicates.slice(1).map(c => c.id);
          await sequelize.query(
            'DELETE FROM Customers WHERE id IN (?)',
            { 
              type: QueryTypes.DELETE,
              replacements: [idsToDelete]
            }
          );
          console.log(`Fixed duplicate ID ${dup.id}`);
        }
      }
    }
    
    // Verify the table structure
    const tableInfo = await sequelize.query(
      'PRAGMA TABLE_INFO(Customers)',
      { type: QueryTypes.SELECT }
    );
    
    console.log('Customers table structure:');
    tableInfo.forEach(col => {
      console.log(`  ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
    });
    
    console.log('Customers table fix completed successfully!');
    
  } catch (error) {
    console.error('Error fixing Customers table:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the fix if this script is executed directly
if (require.main === module) {
  fixCustomersTable();
}

module.exports = { fixCustomersTable }; 