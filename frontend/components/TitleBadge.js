// components/TitleBadge.js
export default function TitleBadge({ title, size = 'md' }) {
  if (!title) return null;

  const sizeClasses = {
    sm: 'px-3 py-1 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  const colorClasses = {
    gray: 'from-gray-500 to-gray-600',
    orange: 'from-orange-500 to-orange-600',
    yellow: 'from-yellow-500 to-yellow-600',
    cyan: 'from-cyan-500 to-cyan-600',
    purple: 'from-purple-500 to-purple-600',
    red: 'from-red-500 to-red-600'
  };

  return (
    <div className={`inline-flex items-center gap-2 bg-gradient-to-r ${colorClasses[title.color] || colorClasses.gray} ${sizeClasses[size]} rounded-full text-white font-bold shadow-lg`}>
      <span>{title.icon}</span>
      <span>{title.name}</span>
    </div>
  );
}