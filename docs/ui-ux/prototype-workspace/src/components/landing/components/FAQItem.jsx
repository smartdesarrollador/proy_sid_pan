import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

function FAQItem({ faq, isLast }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`${!isLast ? 'border-b border-gray-200' : ''}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-4 flex items-center justify-between text-left hover:text-primary-600 transition-colors"
      >
        <span className="font-semibold text-gray-900 pr-4">{faq.question}</span>
        <ChevronDown
          className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ${
          isOpen ? 'max-h-96 opacity-100 pb-4' : 'max-h-0 opacity-0'
        }`}
      >
        <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
      </div>
    </div>
  );
}

export default FAQItem;
