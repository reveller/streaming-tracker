import { useState } from 'react';

/**
 * Star Rating Component
 *
 * Interactive 5-star rating component.
 *
 * @param {Object} props
 * @param {number} props.value - Current rating (0-5)
 * @param {Function} props.onChange - Callback when rating changes
 * @param {boolean} props.readOnly - Whether the rating is read-only
 * @param {string} props.size - Size: 'sm', 'md', 'lg'
 * @returns {JSX.Element}
 */
function StarRating({ value = 0, onChange, readOnly = false, size = 'md' }) {
  const [hoverValue, setHoverValue] = useState(0);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const starSize = sizeClasses[size] || sizeClasses.md;

  const handleClick = (rating) => {
    if (!readOnly && onChange) {
      onChange(rating);
    }
  };

  const handleMouseEnter = (rating) => {
    if (!readOnly) {
      setHoverValue(rating);
    }
  };

  const handleMouseLeave = () => {
    if (!readOnly) {
      setHoverValue(0);
    }
  };

  const displayValue = hoverValue || value;

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => handleClick(star)}
          onMouseEnter={() => handleMouseEnter(star)}
          onMouseLeave={handleMouseLeave}
          disabled={readOnly}
          className={`${readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform`}
          aria-label={`Rate ${star} stars`}
        >
          <svg
            className={`${starSize} ${
              star <= displayValue
                ? 'text-yellow-400 fill-current'
                : 'text-gray-300 fill-current'
            }`}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </button>
      ))}
      {!readOnly && value > 0 && (
        <button
          type="button"
          onClick={() => handleClick(0)}
          className="ml-2 text-xs text-gray-500 hover:text-gray-700"
        >
          Clear
        </button>
      )}
    </div>
  );
}

export default StarRating;
