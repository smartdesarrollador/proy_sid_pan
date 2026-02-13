import { useState, useEffect } from 'react';
import { Download, RefreshCw, Check } from 'lucide-react';
import { generateQRCode, generateWhatsAppQR, generateWebsiteQR, downloadQRCode } from '../../utils/qrCodeGenerator';
import { exportDigitalCardVCard } from '../../utils/vCardExporter';
import { useFeatureGate } from '../../hooks/useFeatureGate';
import { UpgradePrompt } from '../shared/UpgradePrompt';

export const QRCodeSection = ({ cardData }) => {
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [qrAction, setQrAction] = useState(cardData.qr?.action || 'whatsapp');
  const [showUpgrade, setShowUpgrade] = useState(false);
  const { hasFeature, getUpgradeMessage } = useFeatureGate();

  useEffect(() => {
    generateQR();
  }, [qrAction, cardData]);

  const generateQR = async () => {
    try {
      let qrUrl = '';
      if (qrAction === 'whatsapp' && cardData.contact.whatsapp) {
        qrUrl = await generateWhatsAppQR(
          cardData.contact.whatsapp,
          `Hola ${cardData.profile.displayName}, te contacto desde tu tarjeta digital`
        );
      } else if (qrAction === 'website' && cardData.contact.website) {
        qrUrl = await generateWebsiteQR(cardData.contact.website);
      } else if (qrAction === 'vcard') {
        // For vCard, generate QR with URL that would trigger vCard download
        qrUrl = await generateQRCode(cardData.qr?.data || 'https://ejemplo.com/tarjeta');
      } else {
        qrUrl = await generateQRCode(cardData.qr?.data || 'https://ejemplo.com/tarjeta');
      }
      setQrCodeUrl(qrUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const handleDownloadQR = () => {
    if (qrCodeUrl) {
      downloadQRCode(qrCodeUrl, `${cardData.profile.displayName.replace(/\s+/g, '_')}_QR.png`);
    }
  };

  const handleSaveContact = () => {
    if (!hasFeature('digitalCardVCard')) {
      setShowUpgrade(true);
      return;
    }
    exportDigitalCardVCard(cardData);
  };

  const actionLabels = {
    whatsapp: 'WhatsApp',
    website: 'Sitio Web',
    vcard: 'Guardar Contacto',
  };

  const actionOptions = [
    { value: 'whatsapp', label: 'WhatsApp', available: !!cardData.contact.whatsapp },
    { value: 'website', label: 'Sitio Web', available: !!cardData.contact.website },
    { value: 'vcard', label: 'Contacto', available: hasFeature('digitalCardVCard') },
  ];

  return (
    <>
      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
        Conecta Conmigo
      </h2>

      <div className="mb-6">
        {qrCodeUrl && (
          <img
            src={qrCodeUrl}
            alt="QR Code"
            className="w-48 h-48 mx-auto rounded-lg shadow-md"
          />
        )}
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Escanea este código QR para {actionLabels[qrAction].toLowerCase()}
      </p>

      <div className="space-y-3">
        <button
          onClick={handleDownloadQR}
          className="btn-secondary w-full flex items-center justify-center gap-2"
        >
          <Download className="w-4 h-4" />
          Descargar QR
        </button>

        <button
          onClick={handleSaveContact}
          className="btn-outline w-full flex items-center justify-center gap-2"
        >
          <Check className="w-4 h-4" />
          Guardar Contacto
        </button>

        <div>
          <label className="label text-xs">Acción del QR</label>
          <select
            value={qrAction}
            onChange={(e) => setQrAction(e.target.value)}
            className="input text-sm"
          >
            {actionOptions.map(option => (
              <option
                key={option.value}
                value={option.value}
                disabled={!option.available}
              >
                {option.label} {!option.available && '(No disponible)'}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={generateQR}
          className="btn-sm btn-secondary w-full flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-3 h-3" />
          Regenerar QR
        </button>
      </div>

      {showUpgrade && (
        <UpgradePrompt
          isOpen={showUpgrade}
          onClose={() => setShowUpgrade(false)}
          featureInfo={getUpgradeMessage('digitalCardVCard')}
        />
      )}
    </>
  );
};
