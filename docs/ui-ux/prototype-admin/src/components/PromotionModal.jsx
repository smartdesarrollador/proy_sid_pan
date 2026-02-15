import { useState, useEffect } from 'react';
import { X, Sparkles, Info } from 'lucide-react';
import { subscriptionPlans, generatePromoCode, isPromoCodeUnique, calculateDiscount } from '../data/mockData';

function PromotionModal({ promotion, allPromotions = [], onSave, onClose }) {
  const isEditing = !!promotion;

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    type: 'percentage',
    value: 10,
    maxDiscount: null,
    applicablePlans: [],
    applicableNewCustomersOnly: true,
    startsAt: new Date().toISOString().split('T')[0],
    expiresAt: '',
    maxUses: null,
    maxUsesPerCustomer: 1,
  });

  const [errors, setErrors] = useState({});
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);

  // Load existing promotion data
  useEffect(() => {
    if (promotion) {
      setFormData({
        code: promotion.code,
        name: promotion.name,
        description: promotion.description,
        type: promotion.type,
        value: promotion.value,
        maxDiscount: promotion.maxDiscount,
        applicablePlans: promotion.applicablePlans,
        applicableNewCustomersOnly: promotion.applicableNewCustomersOnly,
        startsAt: promotion.startsAt,
        expiresAt: promotion.expiresAt,
        maxUses: promotion.maxUses,
        maxUsesPerCustomer: promotion.maxUsesPerCustomer,
      });
    }
  }, [promotion]);

  // Generate random code
  const handleGenerateCode = () => {
    setIsGeneratingCode(true);
    setTimeout(() => {
      const newCode = generatePromoCode();
      setFormData({ ...formData, code: newCode });
      setIsGeneratingCode(false);
      // Clear code error if any
      setErrors({ ...errors, code: null });
    }, 300);
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    // Código
    if (!formData.code || formData.code.length < 4) {
      newErrors.code = 'El código debe tener al menos 4 caracteres';
    } else if (formData.code.length > 20) {
      newErrors.code = 'El código no puede exceder 20 caracteres';
    } else if (!/^[A-Z0-9]+$/.test(formData.code)) {
      newErrors.code = 'El código debe ser alfanumérico y en mayúsculas';
    } else if (!isPromoCodeUnique(formData.code, allPromotions, promotion?.id)) {
      newErrors.code = 'Este código ya existe';
    }

    // Nombre
    if (!formData.name || formData.name.trim().length < 3) {
      newErrors.name = 'El nombre debe tener al menos 3 caracteres';
    }

    // Valor
    if (formData.type === 'percentage') {
      if (formData.value < 1 || formData.value > 100) {
        newErrors.value = 'El porcentaje debe estar entre 1 y 100';
      }
    } else if (formData.type === 'fixed_amount') {
      if (formData.value <= 0) {
        newErrors.value = 'El monto debe ser mayor a 0';
      }
    } else if (formData.type === 'trial_extension') {
      if (formData.value < 1 || formData.value > 90) {
        newErrors.value = 'Los días deben estar entre 1 y 90';
      }
    }

    // Fechas
    if (!formData.startsAt) {
      newErrors.startsAt = 'Fecha de inicio requerida';
    }
    if (!formData.expiresAt) {
      newErrors.expiresAt = 'Fecha de fin requerida';
    }
    if (formData.startsAt && formData.expiresAt && formData.startsAt >= formData.expiresAt) {
      newErrors.expiresAt = 'La fecha de fin debe ser posterior a la de inicio';
    }

    // No permitir fechas pasadas para nuevas promociones
    if (!isEditing) {
      const today = new Date().toISOString().split('T')[0];
      if (formData.startsAt < today) {
        newErrors.startsAt = 'La fecha de inicio no puede ser pasada';
      }
    }

    // Max uses
    if (isEditing && formData.maxUses && formData.maxUses < promotion.currentUses) {
      newErrors.maxUses = `Debe ser mayor o igual a los usos actuales (${promotion.currentUses})`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Save promotion
    onSave({
      ...formData,
      code: formData.code.toUpperCase(),
    });
  };

  // Handle change
  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    // Clear error for this field
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  // Calculate preview discount
  const getPreviewDiscount = () => {
    if (!formData.value || formData.value <= 0) return null;

    const examplePlan = subscriptionPlans.find(p => p.id === 'plan-professional');
    const planPrice = examplePlan.priceMonthly;

    const discount = calculateDiscount(
      { type: formData.type, value: formData.value, maxDiscount: formData.maxDiscount },
      planPrice
    );

    const finalPrice = planPrice - discount;

    return {
      planName: examplePlan.displayName,
      originalPrice: planPrice,
      discount: discount,
      finalPrice: finalPrice,
    };
  };

  const preview = getPreviewDiscount();

  // Toggle plan in applicablePlans
  const togglePlan = (planId) => {
    const newPlans = formData.applicablePlans.includes(planId)
      ? formData.applicablePlans.filter(id => id !== planId)
      : [...formData.applicablePlans, planId];
    handleChange('applicablePlans', newPlans);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {isEditing ? 'Editar Promoción' : 'Nueva Promoción'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {isEditing ? 'Actualiza los detalles de la promoción' : 'Crea un nuevo código de descuento'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Código */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Código de Promoción *
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.code}
                onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
                className={`flex-1 px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white ${
                  errors.code
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="SUMMER2026"
                maxLength={20}
              />
              <button
                type="button"
                onClick={handleGenerateCode}
                disabled={isGeneratingCode}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors whitespace-nowrap"
              >
                {isGeneratingCode ? 'Generando...' : 'Generar'}
              </button>
            </div>
            {errors.code && <p className="text-sm text-red-500 mt-1">{errors.code}</p>}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              4-20 caracteres alfanuméricos en mayúsculas
            </p>
          </div>

          {/* Nombre y Descripción */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nombre *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white ${
                  errors.name
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="Promoción de Verano 2026"
              />
              {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Descripción
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                placeholder="Describe el objetivo de esta promoción"
                rows={2}
              />
            </div>
          </div>

          {/* Tipo de Descuento y Valor */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tipo de Descuento *
              </label>
              <select
                value={formData.type}
                onChange={(e) => handleChange('type', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              >
                <option value="percentage">Porcentaje (%)</option>
                <option value="fixed_amount">Monto Fijo ($)</option>
                <option value="trial_extension">Trial Extension (días)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Valor *
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={formData.value}
                  onChange={(e) => handleChange('value', parseFloat(e.target.value) || 0)}
                  className={`w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white ${
                    errors.value
                      ? 'border-red-500 dark:border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  min={formData.type === 'percentage' ? 1 : 0}
                  max={formData.type === 'percentage' ? 100 : undefined}
                  step={formData.type === 'percentage' ? 1 : 0.01}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                  {formData.type === 'percentage' ? '%' : formData.type === 'fixed_amount' ? '$' : 'días'}
                </span>
              </div>
              {errors.value && <p className="text-sm text-red-500 mt-1">{errors.value}</p>}
            </div>

            {formData.type === 'percentage' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Descuento Máximo ($)
                </label>
                <input
                  type="number"
                  value={formData.maxDiscount || ''}
                  onChange={(e) => handleChange('maxDiscount', e.target.value ? parseFloat(e.target.value) : null)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  placeholder="Sin límite"
                  min={0}
                  step={0.01}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Opcional</p>
              </div>
            )}
          </div>

          {/* Vista Previa */}
          {preview && formData.type !== 'trial_extension' && (
            <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <Info className="w-5 h-5 text-primary-600 dark:text-primary-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-primary-900 dark:text-primary-100">
                    Vista Previa - {preview.planName}
                  </p>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-primary-700 dark:text-primary-300">
                      ${preview.finalPrice.toFixed(2)}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400 line-through">
                      ${preview.originalPrice.toFixed(2)}
                    </span>
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">
                      Ahorro: ${preview.discount.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Planes Aplicables */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Planes Aplicables
            </label>
            <div className="flex flex-wrap gap-2">
              {subscriptionPlans.map(plan => (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => togglePlan(plan.id)}
                  className={`px-4 py-2 rounded-lg border-2 transition-all ${
                    formData.applicablePlans.includes(plan.id)
                      ? 'bg-primary-500 border-primary-500 text-white'
                      : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-primary-300'
                  }`}
                >
                  {plan.displayName}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {formData.applicablePlans.length === 0 ? 'Aplicable a todos los planes' : `Aplicable a ${formData.applicablePlans.length} plan(es)`}
            </p>
          </div>

          {/* Solo Nuevos Clientes */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="newCustomersOnly"
              checked={formData.applicableNewCustomersOnly}
              onChange={(e) => handleChange('applicableNewCustomersOnly', e.target.checked)}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <label htmlFor="newCustomersOnly" className="text-sm text-gray-700 dark:text-gray-300">
              Solo para nuevos clientes
            </label>
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fecha de Inicio *
              </label>
              <input
                type="date"
                value={formData.startsAt}
                onChange={(e) => handleChange('startsAt', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white ${
                  errors.startsAt
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              {errors.startsAt && <p className="text-sm text-red-500 mt-1">{errors.startsAt}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fecha de Fin *
              </label>
              <input
                type="date"
                value={formData.expiresAt}
                onChange={(e) => handleChange('expiresAt', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white ${
                  errors.expiresAt
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              {errors.expiresAt && <p className="text-sm text-red-500 mt-1">{errors.expiresAt}</p>}
            </div>
          </div>

          {/* Límites */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Límite de Usos Total
              </label>
              <input
                type="number"
                value={formData.maxUses || ''}
                onChange={(e) => handleChange('maxUses', e.target.value ? parseInt(e.target.value) : null)}
                className={`w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white ${
                  errors.maxUses
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="Ilimitado"
                min={isEditing ? promotion.currentUses : 1}
              />
              {errors.maxUses && <p className="text-sm text-red-500 mt-1">{errors.maxUses}</p>}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Dejar vacío para ilimitado</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Límite por Cliente
              </label>
              <input
                type="number"
                value={formData.maxUsesPerCustomer}
                onChange={(e) => handleChange('maxUsesPerCustomer', parseInt(e.target.value) || 1)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                min={1}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Usos permitidos por cliente</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
            >
              {isEditing ? 'Actualizar Promoción' : 'Crear Promoción'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PromotionModal;
