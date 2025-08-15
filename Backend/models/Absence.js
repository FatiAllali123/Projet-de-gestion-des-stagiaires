module.exports = (sequelize, DataTypes) => {
  const Absence = sequelize.define('Absence', {
    date_absence: DataTypes.DATEONLY,
    is_justified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
    // On retire justificatif_id car la référence sera dans Document maintenant
  }, {
    tableName: 'Absence',
    timestamps: false
  });

  Absence.associate = (models) => {
    Absence.belongsTo(models.Stage, { foreignKey: 'stage_id' });
    // On retire la relation avec Document
  };

  return Absence;
};