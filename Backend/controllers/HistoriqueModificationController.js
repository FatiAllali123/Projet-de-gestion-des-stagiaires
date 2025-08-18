
const { HistoriqueModification } = require('../models');

const TABLES_EXISTANTES = ['utilisateur', 'Stage', 'Offre', 'Candidature', 'Entretien'];

async function creerHistoriqueModification({
  table_modifiee,
  champ_modifie,
  ancienne_valeur,
  nouvelle_valeur,
  id_acteur,
  id_candidature = null,
  id_offre = null,
  id_stage = null,
  id_entretien = null,
  id_compte = null
}) {
  if (!TABLES_EXISTANTES.includes(table_modifiee)) {
    throw new Error(`Table non reconnue : ${table_modifiee}`);
  }

  return await HistoriqueModification.create({
    table_modifiee,
    champ_modifie,
    ancienne_valeur,
    nouvelle_valeur,
    id_acteur,
    id_candidature,
    id_offre,
    id_stage,
    id_entretien,
    id_compte,
    date_action: new Date()
  });
}

module.exports = {
  creerHistoriqueModification
};
