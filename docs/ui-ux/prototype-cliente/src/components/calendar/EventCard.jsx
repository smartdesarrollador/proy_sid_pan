import { MapPin, Users, Edit2, Trash2, Repeat } from 'lucide-react';
import { users } from '../../data/mockData';

export const EventCard = ({ event, onEdit, onDelete, compact = false }) => {
  const participantUsers = event.participants
    ? event.participants.map(userId => users.find(u => u.id === userId)).filter(Boolean)
    : [];

  return (
    <div
      className="card p-3 card-hover"
      style={{ borderLeft: `4px solid ${event.categoryColor}` }}
      onClick={() => onEdit(event)}
    >
      <div className="flex items-start justify-between mb-1">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 text-sm mb-1">
            {event.title}
            {event.isRecurring && (
              <Repeat className="w-3 h-3 inline-block ml-1 text-gray-500" />
            )}
          </h4>
          <div className="text-xs text-gray-600">
            {event.startTime} - {event.endTime}
          </div>
        </div>

        {!compact && (
          <div className="flex items-center gap-2 ml-2">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(event); }}
              className="text-gray-400 hover:text-gray-600"
            >
              <Edit2 className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(event.id); }}
              className="text-gray-400 hover:text-red-600"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {!compact && (
        <>
          {event.location && (
            <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
              <MapPin className="w-3 h-3" />
              {event.location}
            </div>
          )}

          {participantUsers.length > 0 && (
            <div className="flex items-center gap-1 mt-2">
              <Users className="w-3 h-3 text-gray-500" />
              <div className="flex -space-x-1">
                {participantUsers.slice(0, 3).map(user => (
                  <div
                    key={user.id}
                    className="avatar w-5 h-5 text-xs border-2 border-white"
                    title={`${user.firstName} ${user.lastName}`}
                  >
                    {user.firstName[0]}{user.lastName[0]}
                  </div>
                ))}
                {participantUsers.length > 3 && (
                  <div className="avatar w-5 h-5 text-xs border-2 border-white bg-gray-400">
                    +{participantUsers.length - 3}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mt-2">
            <span
              className="badge text-xs"
              style={{ backgroundColor: event.categoryColor + '20', color: event.categoryColor }}
            >
              {event.category}
            </span>
          </div>
        </>
      )}
    </div>
  );
};
