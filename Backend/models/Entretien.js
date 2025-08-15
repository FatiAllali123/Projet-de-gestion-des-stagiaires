module.exports = (sequelize, DataTypes) => {
  const Entretien = sequelize.define('Entretien', {
    date_entretien: {
      type: DataTypes.DATEONLY, // 
      allowNull: false
    },
    heure_entretien: {
      type: DataTypes.TIME, // 
      allowNull: false
    },
    date_creation: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    statut: {
      type: DataTypes.STRING,
      allowNull: false
    },
    resultat: {
      type: DataTypes.STRING
    }
  }, {
    tableName: 'Entretien',
    timestamps: false
  });

  Entretien.associate = (models) => {
    Entretien.belongsTo(models.Candidature, { foreignKey: 'candidature_id' });
    Entretien.hasMany(models.Notification, { foreignKey: 'entretien_id' });
  };

  return Entretien;
};
