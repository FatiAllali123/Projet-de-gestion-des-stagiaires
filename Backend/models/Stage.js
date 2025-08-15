module.exports = (sequelize, DataTypes) => {
  const Stage = sequelize.define('Stage', {
    sujet_stage: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    date_debut: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    date_fin: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    statut_stage: {
      type: DataTypes.STRING,
      allowNull: false
    },
    encadrant_id: {
      type: DataTypes.INTEGER
    },
    Stagiaire_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    candidature_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    tableName: 'Stage',
    timestamps: false
  });

  Stage.associate = (models) => {
    Stage.belongsTo(models.Utilisateur, { as: 'Encadrant', foreignKey: 'encadrant_id' });
    Stage.belongsTo(models.Utilisateur, { as: 'Stagiaire', foreignKey: 'Stagiaire_id' });
    Stage.belongsTo(models.Candidature, { foreignKey: 'candidature_id' });
    Stage.hasMany(models.Evaluation, { foreignKey: 'stage_id' });
    Stage.hasMany(models.Absence, { foreignKey: 'stage_id' });
    Stage.hasMany(models.Document, { foreignKey: 'stage_id' });
  };

  return Stage;
};
