import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import StarRating from './StarRating.jsx';

/**
 * Draggable Title Card Component
 *
 * Wraps a title card with drag-and-drop functionality using dnd-kit
 *
 * @param {Object} props
 * @param {Object} props.title - The title object
 * @param {string} props.listType - The current list type
 * @param {Function} props.onMove - Handler for moving title
 * @param {Function} props.onRemove - Handler for removing title
 * @param {Function} props.onRate - Handler for rating title
 * @param {boolean} props.isDragDisabled - Whether to disable dragging (for mobile)
 * @returns {JSX.Element}
 */
function DraggableTitleCard({ title, listType, onMove, onRemove, onRate, isDragDisabled = false }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: title.id,
    disabled: isDragDisabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 ${
        !isDragDisabled && !isDragging ? 'cursor-grab' : ''
      } ${isDragging ? 'cursor-grabbing' : ''}`}
      {...(!isDragDisabled ? attributes : {})}
      {...(!isDragDisabled ? listeners : {})}
    >
      {title.posterUrl && (
        <img
          src={title.posterUrl}
          alt={title.name}
          className="w-16 h-24 object-cover rounded flex-shrink-0"
        />
      )}
      <div className="flex-1 min-w-0">
        <a
          href={`https://www.themoviedb.org/${title.type === 'MOVIE' ? 'movie' : 'tv'}/${title.tmdbId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-gray-900 hover:text-blue-600 hover:underline mb-2 block"
        >
          {title.name}
        </a>
        {title.releaseYear && (
          <div className="text-sm text-gray-600 mb-2">{title.releaseYear}</div>
        )}
        {title.services && title.services.length > 0 && (
          <div className="mb-2">
            <span className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
              📺 {title.services[0].name}
            </span>
          </div>
        )}
        <div className="mb-3">
          <StarRating
            value={title.rating?.stars || 0}
            onChange={(stars) => onRate(title.id, stars)}
            size="sm"
          />
        </div>
        <div className="mb-2">
          <a
            href={`https://www.justwatch.com/us/search?q=${encodeURIComponent(title.name)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full px-2 py-1 text-xs bg-orange-500 text-white rounded hover:bg-orange-600 text-center font-medium"
          >
            🎬 Watch Now
          </a>
        </div>
        <div className="flex gap-2">
          {listType === 'WATCH_QUEUE' && (
            <>
              <button
                onClick={() => onMove(title, 'CURRENTLY_WATCHING')}
                className="flex-1 px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
              >
                Start Watching
              </button>
              <button
                onClick={() => onRemove(title.id)}
                className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded"
              >
                Remove
              </button>
            </>
          )}
          {listType === 'CURRENTLY_WATCHING' && (
            <>
              <button
                onClick={() => onMove(title, 'WATCH_QUEUE')}
                className="flex-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Back to Queue
              </button>
              <button
                onClick={() => onMove(title, 'ALREADY_WATCHED')}
                className="flex-1 px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                Mark Watched
              </button>
              <button
                onClick={() => onRemove(title.id)}
                className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded"
              >
                Remove
              </button>
            </>
          )}
          {listType === 'ALREADY_WATCHED' && (
            <>
              <button
                onClick={() => onMove(title, 'CURRENTLY_WATCHING')}
                className="flex-1 px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
              >
                Watch Again
              </button>
              <button
                onClick={() => onRemove(title.id)}
                className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded"
              >
                Remove
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default DraggableTitleCard;
