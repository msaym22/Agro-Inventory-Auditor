const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.json')[env];
const db = {};

let sequelize;

// Ensure SQLite storage path is absolute so it points to backend/database.sqlite
// regardless of where the server process is started from (project root vs backend).
if (config && config.dialect === 'sqlite' && config.storage) {
  // Mutate a shallow copy to avoid side effects if config is reused elsewhere
  const sqliteConfig = { ...config, storage: path.resolve(__dirname, '..', config.storage) };
  if (sqliteConfig.use_env_variable) {
    sequelize = new Sequelize(process.env[sqliteConfig.use_env_variable], sqliteConfig);
  } else {
    sequelize = new Sequelize(sqliteConfig);
  }
} else {
  if (config.use_env_variable) {
    sequelize = new Sequelize(process.env[config.use_env_variable], config);
  } else {
    sequelize = new Sequelize(config);
  }
}

fs.readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js'
    );
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

// Hot-reload the Sequelize connection and all models.
// Closes the current connection, re-initializes Sequelize, re-defines models
// and re-applies associations, updating the exported `db` object in-place.
db.reloadSequelize = async () => {
  try {
    if (db.sequelize) {
      try { await db.sequelize.close(); } catch (_) {}
    }

    // Recreate sequelize instance (mirror initial absolute SQLite storage resolution)
    if (config && config.dialect === 'sqlite' && config.storage) {
      const sqliteConfig = { ...config, storage: path.resolve(__dirname, '..', config.storage) };
      if (sqliteConfig.use_env_variable) {
        sequelize = new Sequelize(process.env[sqliteConfig.use_env_variable], sqliteConfig);
      } else {
        sequelize = new Sequelize(sqliteConfig);
      }
    } else if (config.use_env_variable) {
      sequelize = new Sequelize(process.env[config.use_env_variable], config);
    } else {
      sequelize = new Sequelize(config);
    }

    // Build a fresh model map
    const fresh = {};
    fs.readdirSync(__dirname)
      .filter(file => file.indexOf('.') !== 0 && file !== basename && file.slice(-3) === '.js')
      .forEach(file => {
        const modelFactory = require(path.join(__dirname, file));
        const model = modelFactory(sequelize, Sequelize.DataTypes);
        fresh[model.name] = model;
      });

    // Apply associations
    Object.keys(fresh).forEach(modelName => {
      if (fresh[modelName].associate) {
        fresh[modelName].associate(fresh);
      }
    });

    // Replace exported references atomically
    Object.keys(db).forEach(k => {
      if (['sequelize', 'Sequelize', 'reloadSequelize'].includes(k)) return;
      delete db[k];
    });
    Object.assign(db, fresh);
    db.sequelize = sequelize;
    db.Sequelize = Sequelize;

    return true;
  } catch (err) {
    // Best effort: keep existing connection if reload fails
    return false;
  }
};

module.exports = db;
