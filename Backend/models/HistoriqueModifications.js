module.exports = (sequelize, DataTypes) => {
  const HistoriqueModification = sequelize.define('HistoriqueModification', {
    table_modifiee: {
      type: DataTypes.ENUM('utilisateur', 'Stage', 'Offre', 'Candidature', 'Entretien'), 
      allowNull: false
    },
    date_action: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    ancienne_valeur: {
      type: DataTypes.STRING,
      allowNull: false
    },
    nouvelle_valeur: {
      type: DataTypes.STRING,
      allowNull: false
    },
    champ_modifie: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    tableName: 'HistoriqueModifications',
    timestamps: false
  });

  HistoriqueModification.associate = (models) => {
    HistoriqueModification.belongsTo(models.Utilisateur, { foreignKey: 'id_acteur' });
    HistoriqueModification.belongsTo(models.Utilisateur, { foreignKey: 'id_compte' });
    HistoriqueModification.belongsTo(models.Offre, { foreignKey: 'id_offre' });
    HistoriqueModification.belongsTo(models.Candidature, { foreignKey: 'id_candidature' });
    HistoriqueModification.belongsTo(models.Entretien, { foreignKey: 'id_entretien' });
    HistoriqueModification.belongsTo(models.Stage, { foreignKey: 'id_stage' });
  };

  return HistoriqueModification;
};
