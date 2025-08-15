module.exports = (sequelize, DataTypes) => {
  const Document = sequelize.define('Document', {
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: {
          args: [[
            'convention à signer',
            'convention signée',
            'attestation stage',
            'justificatif d\'absence',
            'rapport'
          ]],
          msg: 'Type de document invalide'
        }
      }
    },
    lien: {
      type: DataTypes.STRING,
      allowNull: false
    },
    date_depot: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    statut: {
      type: DataTypes.STRING,
      allowNull: false
    },
    absence_id: {  // Nouveau champ pour référencer l'absence
      type: DataTypes.INTEGER,
      allowNull: true
    },
    candidature_id: {
  type: DataTypes.INTEGER,
  allowNull: true // nullable, car une convention signée sera liée au stage
}
  }, {
    tableName: 'Document',
    timestamps: false
  });

  Document.associate = (models) => {
    Document.belongsTo(models.Stage, { foreignKey: 'stage_id' });
    Document.belongsTo(models.Candidature, { foreignKey: 'candidature_id' }); // ✅ ajout
    Document.hasMany(models.TraitementDocument, { foreignKey: 'document_id' });
    Document.belongsTo(models.Absence, {  // Changement ici
      foreignKey: 'absence_id',
      as: 'absence'
    });
  };

  return Document;
};