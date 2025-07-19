// 

const db = require('./models');
const bcrypt = require('bcryptjs');

async function initDb() {
  try {
    // Sync all models (create tables if they don't exist)
    // { force: true } will drop existing tables and recreate them.
    // Use with caution in production. For development, it's often useful.
    await db.sequelize.sync({ force: true });
    console.log('Database synced successfully.');

    // Create a default admin user
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

    // Seed some dummy customers if none exist
    const customerCount = await db.Customer.count();
    if (customerCount === 0) {
      await db.Customer.bulkCreate([
        { name: 'Ali Khan', contact: '03001234567', address: 'Lahore, Pakistan', creditLimit: 5000, outstandingBalance: 1500 },
        { name: 'Fatima Ahmed', contact: '03017654321', address: 'Multan, Pakistan', creditLimit: 10000, outstandingBalance: 0 },
        { name: 'Usman Tariq', contact: '03029876543', address: 'Vehari, Pakistan', creditLimit: 7500, outstandingBalance: 200 },
        { name: 'Sana Batool', contact: '03031122334', address: 'Faisalabad, Pakistan', creditLimit: 2000, outstandingBalance: 0 },
      ]);
      console.log('Dummy customers seeded.');
    } else {
      console.log('Customers already exist, skipping seeding.');
    }

    // Seed some dummy products if none exist
    const productCount = await db.Product.count();
    if (productCount === 0) {
      await db.Product.bulkCreate([
        {
          name: 'Wheat Seeds (Super)',
          sellingPrice: 1200,
          purchasePrice: 1000,
          minimumPrice: 1100,
          description: 'High-yield wheat seeds for optimal harvest.',
          applications: 'Wheat cultivation',
          category: 'seeds',
          stock: 500,
          supplier: 'AgriSeed Co.',
          storageLocation: 'Warehouse A, Rack 1',
          comments: 'Best seller for Rabi season.'
        },
        {
          name: 'Urea Fertilizer (50kg)',
          sellingPrice: 3500,
          purchasePrice: 3000,
          minimumPrice: 3200,
          description: 'Nitrogen-rich fertilizer for all crops.',
          applications: 'General crop fertilization',
          category: 'fertilizers',
          stock: 200,
          supplier: 'Fertilizer Corp.',
          storageLocation: 'Warehouse B, Section 2',
          comments: 'Always in high demand.'
        },
        {
          name: 'Pesticide X (1L)',
          sellingPrice: 800,
          purchasePrice: 650,
          minimumPrice: 700,
          description: 'Broad-spectrum pesticide for common pests.',
          applications: 'Pest control for cotton, rice',
          category: 'pesticides',
          stock: 150,
          supplier: 'PestGuard Ltd.',
          storageLocation: 'Chemical Storage, Zone C',
          comments: 'Effective against aphids.'
        },
        {
          name: 'Tractor Plough',
          sellingPrice: 150000,
          purchasePrice: 120000,
          minimumPrice: 130000,
          description: 'Heavy-duty plough for deep tilling.',
          applications: 'Land preparation',
          category: 'equipment',
          stock: 5,
          supplier: 'FarmMachinery Inc.',
          storageLocation: 'Yard 1, Bay 3',
          comments: 'Requires regular maintenance.'
        }
      ]);
      console.log('Dummy products seeded.');
    } else {
      console.log('Products already exist, skipping seeding.');
    }

  } catch (error) {
    console.error('Error syncing database or seeding data:', error);
    process.exit(1); // Exit with an error code
  }
}

initDb();
