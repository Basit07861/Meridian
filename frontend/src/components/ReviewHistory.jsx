import { deleteReview, shareReview } from '../services/api';

export default function ReviewHistory({ reviews, onSelect, onDelete }) {
  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Delete this review?')) return;
    try {
      await deleteReview(id);
      onDelete(id);
    } catch (err) {
      alert('Failed to delete review');
    }
  };

  const handleShare = async (e, id) => {
    e.stopPropagation();
    try {
      const { data } = await shareReview(id);
      const link = `${window.location.origin}/share/${data.shareableLink}`;
      navigator.clipboard.writeText(link);
      alert('Shareable link copied to clipboard!');
    } catch (err) {
      alert('Failed to share review');
    }
  };

  if (!reviews.length) {
    return (
      <div className="text-center text-gray-500 py-10">
        No reviews yet. Start by reviewing some code!
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {reviews.map((review) => (
        <div
          key={review._id}
          onClick={() => onSelect(review)}
          className="bg-gray-900 border border-gray-800 hover:border-blue-500 rounded-xl p-4 cursor-pointer transition"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-medium">
                {review.title || 'Untitled Review'}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-gray-500 text-xs">
                  {review.language}
                </span>
                <span className="text-gray-600 text-xs">·</span>
                <span className="text-gray-500 text-xs">
                  {new Date(review.createdAt).toLocaleDateString()}
                </span>
                <span className="text-gray-600 text-xs">·</span>
                <span className={`text-xs font-semibold ${
                  review.overallScore >= 70 ? 'text-green-400' :
                  review.overallScore >= 40 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  Score: {review.overallScore}/100
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={(e) => handleShare(e, review._id)}
                className="text-gray-500 hover:text-blue-400 text-xs px-2 py-1 rounded bg-gray-800"
              >
                🔗 Share
              </button>
              <button
                onClick={(e) => handleDelete(e, review._id)}
                className="text-gray-500 hover:text-red-400 text-xs px-2 py-1 rounded bg-gray-800"
              >
                🗑
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}