// backend/init-db.js
const db = require('./models');
const bcrypt = require('bcryptjs');

async function initDb() {
  try {
    // !!! IMPORTANT CHANGE FOR PERSISTENCE !!!
    // Use { alter: true } to update schema without dropping data.
    // For production, you'd typically use migrations.
    await db.sequelize.sync({ alter: true });
    console.log('Database synced successfully (alter: true).');

    // Create a default admin user (this uses findOrCreate, so it won't duplicate)
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await db.User.findOrCreate({
      where: { username: 'admin' },
      defaults: {
        username: 'admin',
        password: hashedPassword,
        role: 'admin'
      }
    });
    console.log('Default admin user created or already exists.');

    // KEEP THESE BLOCKS COMMENTED OUT TO AVOID DUMMY DATA RE-INSERTION
    /*
    const customerCount = await db.Customer.count();
    if (customerCount === 0) {
      await db.Customer.bulkCreate([
        // ... dummy customer data ...
      ]);
      console.log('Dummy customers seeded.');
    } else {
      console.log('Customers already exist, skipping seeding.');
    }

    const productCount = await db.Product.count();
    if (productCount === 0) {
      await db.Product.bulkCreate([
        // ... dummy product data ...
      ]);
      console.log('Dummy products seeded.');
    } else {
      console.log('Products already exist, skipping seeding.');
    }
    */

  } catch (error) {
    console.error('Error syncing database or seeding data:', error);
    process.exit(1);
  }
}

initDb();