// components/ProfileBadges.js
export default function ProfileBadges({ badges, isOwner, onManage }) {
  const displayedBadges = badges?.filter(b => b.is_displayed) || [];

  if (displayedBadges.length === 0 && !isOwner) return null;

  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-red-500/20">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-white">Badges</h3>
        {isOwner && (
          <button
            onClick={onManage}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition"
          >
            Manage
          </button>
        )}
      </div>

      {displayedBadges.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          {isOwner ? 'No badges displayed. Unlock achievements to earn badges!' : 'No badges to display'}
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {displayedBadges.map((badge) => (
            <div
              key={badge.id}
              className="bg-gray-900/50 rounded-xl p-4 text-center border border-gray-700 hover:border-gray-600 transition group"
            >
              <div className="text-4xl mb-2">{badge.icon}</div>
              <h4 className="text-white font-semibold text-sm mb-1">{badge.name}</h4>
              <p className="text-gray-500 text-xs">{badge.category}</p>

              {/* Tooltip on hover */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity mt-2 text-gray-400 text-xs">
                {badge.description}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}