module.exports = (sequelize, DataTypes) => {
  const JournalEntryLine = sequelize.define('JournalEntryLine', {
    accountNumber: {
      type: DataTypes.STRING,
      allowNull: false
    },
    debitAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0
    },
    creditAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  });

  JournalEntryLine.associate = models => {
    JournalEntryLine.belongsTo(models.JournalEntry, {
      foreignKey: 'journalEntryId',
      as: 'journalEntry'
    });
    JournalEntryLine.belongsTo(models.ChartOfAccounts, {
      foreignKey: 'accountNumber',
      targetKey: 'accountNumber',
      as: 'account'
    });
  };

  return JournalEntryLine;
};
