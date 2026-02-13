/**
 * Generate vCard (VCF) content from profile data
 * @param {object} profile - Profile data
 * @param {object} contact - Contact data
 * @param {object} social - Social links data
 * @returns {string} vCard content
 */
export const generateVCard = (profile, contact, social) => {
  const vcard = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${profile.displayName}`,
    `TITLE:${profile.title}`,
  ];

  // Email
  if (contact.email) {
    vcard.push(`EMAIL;TYPE=INTERNET:${contact.email}`);
  }

  // Phone
  if (contact.phone) {
    vcard.push(`TEL;TYPE=CELL:${contact.phone}`);
  }

  // WhatsApp
  if (contact.whatsapp) {
    vcard.push(`TEL;TYPE=WHATSAPP:${contact.whatsapp}`);
  }

  // Website
  if (contact.website) {
    vcard.push(`URL:${contact.website}`);
  }

  // Location
  if (profile.location) {
    vcard.push(`ADR;TYPE=HOME:;;${profile.location};;;;`);
  }

  // LinkedIn
  if (social.linkedin) {
    vcard.push(`URL;TYPE=LinkedIn:${social.linkedin}`);
  }

  // Note with about
  if (profile.about) {
    vcard.push(`NOTE:${profile.about}`);
  }

  vcard.push('END:VCARD');

  return vcard.join('\n');
};

/**
 * Download vCard file
 * @param {string} vCardContent - vCard content string
 * @param {string} filename - Download filename
 */
export const downloadVCard = (vCardContent, filename = 'contact.vcf') => {
  const blob = new Blob([vCardContent], { type: 'text/vcard;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Export vCard from digital card data
 * @param {object} cardData - Digital card data
 */
export const exportDigitalCardVCard = (cardData) => {
  const vCardContent = generateVCard(
    cardData.profile,
    cardData.contact,
    cardData.social
  );
  const filename = `${cardData.profile.displayName.replace(/\s+/g, '_')}.vcf`;
  downloadVCard(vCardContent, filename);
};
