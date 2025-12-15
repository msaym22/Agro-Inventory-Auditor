module.exports = (sequelize, DataTypes) => {
  const TrainingImage = sequelize.define('TrainingImage', {
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Products',
        key: 'id'
      }
    },
    imagePath: {
      type: DataTypes.STRING,
      allowNull: false
    },
    features: {
      type: DataTypes.TEXT,
      allowNull: true,
      // Store extracted features as JSON string
      get() {
        const value = this.getDataValue('features');
        return value ? JSON.parse(value) : null;
      },
      set(value) {
        this.setDataValue('features', value ? JSON.stringify(value) : null);
      }
    },
    metadata: {
      type: DataTypes.TEXT,
      allowNull: true,
      // Store metadata as JSON string
      get() {
        const value = this.getDataValue('metadata');
        return value ? JSON.parse(value) : null;
      },
      set(value) {
        this.setDataValue('metadata', value ? JSON.stringify(value) : null);
      }
    },
    uploadedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    timestamps: true
  });

  TrainingImage.associate = models => {
    TrainingImage.belongsTo(models.Product, {
      foreignKey: 'productId',
      as: 'product'
    });
  };

  return TrainingImage;
};

