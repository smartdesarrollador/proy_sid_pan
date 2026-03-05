import * as Icons from 'lucide-react';

function PaymentBadge({ method }) {
  const IconComponent = Icons[method.icon];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 text-center hover:shadow-md transition-shadow">
      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
        {IconComponent && <IconComponent className="w-6 h-6 text-gray-700" />}
      </div>
      <h4 className="font-semibold text-gray-900 mb-1">{method.name}</h4>
      <p className="text-sm text-gray-600">{method.description}</p>
    </div>
  );
}

export default PaymentBadge;
