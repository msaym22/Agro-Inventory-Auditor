module.exports = (sequelize, DataTypes) => {
  const AIModel = sequelize.define('AIModel', {
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Products',
        key: 'id'
      }
    },
    modelVersion: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    trainingStatus: {
      type: DataTypes.ENUM('pending', 'training', 'completed', 'failed'),
      defaultValue: 'pending'
    },
    trainingProgress: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 100
      }
    },
    trainingImagesCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    modelData: {
      type: DataTypes.TEXT,
      allowNull: true,
      // Store model data as JSON string
      get() {
        const value = this.getDataValue('modelData');
        return value ? JSON.parse(value) : null;
      },
      set(value) {
        this.setDataValue('modelData', value ? JSON.stringify(value) : null);
      }
    },
    accuracy: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    lastTrainedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    timestamps: true
  });

  AIModel.associate = models => {
    AIModel.belongsTo(models.Product, {
      foreignKey: 'productId',
      as: 'product'
    });
  };

  return AIModel;
};

