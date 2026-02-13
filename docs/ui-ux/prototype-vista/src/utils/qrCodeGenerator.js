import QRCode from 'qrcode';

/**
 * Generate QR code as Data URL
 * @param {string} data - Data to encode in QR
 * @param {object} options - QR code options
 * @returns {Promise<string>} Data URL of QR code image
 */
export const generateQRCode = async (data, options = {}) => {
  const defaultOptions = {
    errorCorrectionLevel: 'M',
    type: 'image/png',
    quality: 0.92,
    margin: 1,
    width: 300,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
    ...options,
  };

  try {
    const dataUrl = await QRCode.toDataURL(data, defaultOptions);
    return dataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
};

/**
 * Download QR code as PNG file
 * @param {string} dataUrl - QR code data URL
 * @param {string} filename - Download filename
 */
export const downloadQRCode = (dataUrl, filename = 'qr-code.png') => {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Generate QR code for WhatsApp
 * @param {string} phoneNumber - Phone number with country code
 * @param {string} message - Optional pre-filled message
 * @returns {Promise<string>} QR code data URL
 */
export const generateWhatsAppQR = async (phoneNumber, message = '') => {
  const cleanPhone = phoneNumber.replace(/\D/g, '');
  const url = message
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
    : `https://wa.me/${cleanPhone}`;
  return generateQRCode(url);
};

/**
 * Generate QR code for website URL
 * @param {string} url - Website URL
 * @returns {Promise<string>} QR code data URL
 */
export const generateWebsiteQR = async (url) => {
  return generateQRCode(url);
};
