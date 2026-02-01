function Leaderboard({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Top 5 Leaderboard</h2>
        <p className="text-gray-500 text-sm">No activity in the last 24 hours</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-4">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Top 5 Leaderboard</h2>
      <p className="text-xs text-gray-500 mb-4">Last 24 hours</p>
      <div className="space-y-3">
        {data.map((entry) => (
          <div
            key={entry.user.id}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-8 h-8 bg-yellow-500 rounded-full text-white font-bold text-sm">
                {entry.rank}
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">
                  {entry.user.username}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="font-bold text-gray-900">{entry.total_karma}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Leaderboard
