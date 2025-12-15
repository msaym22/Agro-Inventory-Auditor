module.exports = (sequelize, DataTypes) => {
  const JournalEntry = sequelize.define('JournalEntry', {
    entryNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    entryDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    reference: {
      type: DataTypes.STRING,
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    source: {
      type: DataTypes.ENUM('manual', 'sale', 'purchase', 'payment', 'adjustment'),
      allowNull: false,
      defaultValue: 'manual'
    },
    isPosted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    postedDate: {
      type: DataTypes.DATE,
      allowNull: true
    }
  });

  JournalEntry.associate = models => {
    JournalEntry.hasMany(models.JournalEntryLine, {
      foreignKey: 'journalEntryId',
      as: 'lines'
    });
    JournalEntry.belongsTo(models.Sale, {
      foreignKey: 'saleId',
      as: 'sale'
    });
  };

  return JournalEntry;
};
