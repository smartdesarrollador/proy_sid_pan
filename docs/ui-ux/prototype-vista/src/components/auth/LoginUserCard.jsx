import { Check } from 'lucide-react';

export const LoginUserCard = ({ user, isSelected, onClick, onDoubleClick }) => {
  // Get initials from name
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Get plan display name
  const getPlanDisplayName = (plan) => {
    const planNames = {
      free: 'Free',
      starter: 'Starter',
      professional: 'Professional',
      enterprise: 'Enterprise',
    };
    return planNames[plan] || plan;
  };

  // Get plan badge color
  const getPlanBadgeColor = (plan) => {
    const colors = {
      free: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
      starter: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      professional: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
      enterprise: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
    };
    return colors[plan] || colors.free;
  };

  return (
    <div
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      className={`border-2 rounded-lg p-6 cursor-pointer transition-all duration-200 ${
        isSelected
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg'
          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:shadow-md'
      }`}
    >
      {/* Avatar */}
      <div
        className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold mb-4 transition-all ${
          isSelected
            ? 'bg-blue-600 text-white scale-110'
            : 'bg-gradient-to-br from-blue-500 to-purple-600 text-white'
        }`}
      >
        {getInitials(user.name)}
      </div>

      {/* User Info */}
      <div className="mb-3">
        <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">
          {user.name}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {user.email}
        </p>
      </div>

      {/* Plan Badge */}
      <div className="mb-3">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPlanBadgeColor(
            user.plan
          )}`}
        >
          {getPlanDisplayName(user.plan)}
        </span>
      </div>

      {/* Selected Indicator */}
      {isSelected && (
        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mt-4 pt-4 border-t border-blue-200 dark:border-blue-800">
          <Check className="w-5 h-5" />
          <span className="text-sm font-medium">Seleccionado</span>
        </div>
      )}
    </div>
  );
};
