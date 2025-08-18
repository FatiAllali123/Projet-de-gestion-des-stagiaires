module.exports = (sequelize, DataTypes) => {
  const Utilisateur = sequelize.define('Utilisateur', {
      nom: {
      type: DataTypes.STRING,
      allowNull: false
    },
    prenom: {
      type: DataTypes.STRING,
      allowNull: false
    },
    mot_de_pass: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
     role: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [['admin', 'rh', 'encadrant', 'candidat']]
      }
    },
    created_at: {
  type: DataTypes.DATE,
  allowNull: false,
  defaultValue: DataTypes.NOW  // met automatiquement la date+heure actuelle à la création
   } ,
      specialite_encadrant: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isRequiredIfEncadrant(value) {
          if (this.role === 'encadrant' && !value) {
            throw new Error('La spécialité est requise pour les encadrants');
          }
        }
      }
    } ,
     role: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [['admin', 'rh', 'encadrant', 'candidat']]
      }
    },
     statut_compte: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'actif',
      validate: {
        isIn: [['actif', 'inactif']]
      }
    },
    telephone: {
      type: DataTypes.STRING(20), // Format international possible
      allowNull: true,
      
    },
    niveau_etudes: {
      type: DataTypes.STRING,
      allowNull: true,
      
    },
    etablissement: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }
  , {
    tableName: 'utilisateur',
    timestamps: false
  });

  Utilisateur.associate = (models) => {
    Utilisateur.hasMany(models.Notification, { foreignKey: 'utilisateur_id' , onDelete: 'CASCADE'} );
    Utilisateur.hasMany(models.Candidature, { foreignKey: 'candidat_id',  onDelete: 'CASCADE' });
    Utilisateur.hasMany(models.Offre, { foreignKey: 'rh_id' ,  onDelete: 'CASCADE'});
    Utilisateur.hasMany(models.Evaluation, { foreignKey: 'encadrant_id', onDelete: 'CASCADE' });
    Utilisateur.hasMany(models.Stage, { as: 'Encadrant', foreignKey: 'encadrant_id' , onDelete: 'CASCADE'});
    Utilisateur.hasMany(models.Stage, { as: 'Stagiaire', foreignKey: 'Stagiaire_id' , onDelete: 'CASCADE'});
    Utilisateur.hasMany(models.TraitementDocument, { foreignKey: 'acteur_id' , onDelete: 'CASCADE'});
    Utilisateur.hasMany(models.ResetPasswordRequest, {foreignKey: 'utilisateur_id',as: 'resetRequests' ,  onDelete: 'CASCADE'});
  };

  return Utilisateur;
};