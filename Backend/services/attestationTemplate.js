const PDFDocument = require('pdfkit');
const moment = require('moment');
moment.locale('fr');

function drawAttestation(doc, { stagiaire, encadrant, stage, rh }) {
  const margin = 50;
  const pageWidth = doc.page.width - 2 * margin;

  const primaryColor = '#2c3e50';
  const secondaryColor = '#7f8c8d';

  // === EN-TÊTE AVEC LOGO/ENTREPRISE ===
  doc.fillColor(primaryColor)
     .fontSize(16)
     .font('Helvetica-Bold')
     .text('VALA BLEU', margin, margin, { align: 'left' })
     .fontSize(10)
     .font('Helvetica')
     .moveDown(1);

  // === TITRE PRINCIPAL ===
  doc.fillColor(primaryColor)
     .fontSize(24)
     .font('Helvetica-Bold')
     .text('ATTESTATION DE STAGE', margin, doc.y, { align: 'center', width: pageWidth })
     .moveDown(2);

  // === INFORMATIONS ADMINISTRATIVES ===
  const currentDate = moment().format('LL');
  const attestationNumber = `${stage.id}-${moment().format('YYYYMMDD')}`;
  
  doc.fontSize(10)
     .font('Helvetica')
     .fillColor(secondaryColor)
     .text(`Délivrée le: ${currentDate}`, margin, doc.y + 5, { align: 'right', width: pageWidth })
     .moveDown(2);

  // === CORPS DE L'ATTESTATION ===
  doc.fontSize(12)
     .font('Helvetica')
     .fillColor(primaryColor)
     .text(`Je soussignée,  ${rh.prenom} ${rh.nom.toUpperCase()}, agissant en qualité de responsable des ressources humaines au sein de l'entreprise VALA BLEU,`, margin, doc.y + 5, { align: 'justify', width: pageWidth })
     .moveDown(1)
     .text('certifie par la présente que :', margin, doc.y, { align: 'justify', width: pageWidth })
     .moveDown(2);

  // === ENCADRÉ STAGIAIRE ===
  const boxY = doc.y;
  const boxHeight = 120;
  
  // Fond de l'encadré
  doc.rect(margin, boxY, pageWidth, boxHeight)
     .fillAndStroke('#f8f9fa', primaryColor)
     .fillColor(primaryColor);

  // Contenu de l'encadré
  doc.fontSize(14)
     .font('Helvetica-Bold')
     .text(`${stagiaire.prenom} ${stagiaire.nom.toUpperCase()}`, margin + 20, boxY + 20, { align: 'center', width: pageWidth - 40 })
     .fontSize(12)
     .font('Helvetica')
     .moveDown(1)
     .text('a effectué un stage au sein de notre entreprise', margin + 20, doc.y, { align: 'center', width: pageWidth - 40 })
     .moveDown(0.5)
     .font('Helvetica-Bold')
     .text(`du ${moment(stage.date_debut).format('LL')} au ${moment(stage.date_fin).format('LL')}`, margin + 20, doc.y, { align: 'center', width: pageWidth - 40 })
     .font('Helvetica')
     .moveDown(0.5)
     .text(`en qualité de ${stage.sujet_stage}`, margin + 20, doc.y, { align: 'center', width: pageWidth - 40 });

  doc.y = boxY + boxHeight + 20;

  // === VALIDATION ===
  doc.fontSize(12)
     .font('Helvetica')
     .text('Cette attestation est délivrée à l\'intéressé(e) pour servir et valoir ce que de droit.', margin, doc.y, { align: 'justify', width: pageWidth })
     .moveDown(2);

  // === SIGNATURES ===
  const signatureY = doc.y;
  const leftColWidth = pageWidth / 2 - 20;
  const rightColX = margin + pageWidth / 2 + 20;

  // Colonne gauche - RH
  doc.font('Helvetica-Bold')
     .text('Responsable RH', margin, signatureY)
     .font('Helvetica')
     .moveDown(0.5)
     .text(`${rh.prenom} ${rh.nom.toUpperCase()}`, margin, doc.y)
     .moveDown(2)
     .text('Signature :', margin, doc.y)
     .moveTo(margin, doc.y + 15)
     .lineTo(margin + leftColWidth, doc.y + 15)
     .stroke(secondaryColor);

  // Colonne droite - Encadrant
  doc.font('Helvetica-Bold')
     .text('Encadrant pédagogique', rightColX, signatureY)
     .font('Helvetica')
     .moveDown(0.5)
     .text(`${encadrant.prenom} ${encadrant.nom.toUpperCase()}`, rightColX, signatureY + 25)
     .moveDown(2)
     .text('Signature :', rightColX, signatureY + 70)
     .moveTo(rightColX, signatureY + 85)
     .lineTo(rightColX + leftColWidth, signatureY + 85)
     .stroke(secondaryColor);

  // === PIED DE PAGE ===
  const footerY = doc.page.height - 40;
  
  doc.fontSize(8)
     .fillColor(secondaryColor)
     .text('Document officiel - Ne pas modifier', margin, footerY, { align: 'center', width: pageWidth });
}

module.exports = { drawAttestation };
