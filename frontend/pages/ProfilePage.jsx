

const { useEffect, useState } = React;

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [badges, setBadges] = useState([]);
  const [points, setPoints] = useState(0);
  const [completedTasks, setCompletedTasks] = useState(0);

  useEffect(() => {
    // Get user id from localStorage (only for id, not for display)
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (!storedUser) return;

    // Fetch fresh user data from backend (includes updated badges)
    fetch(`http://localhost:3000/api/users/${storedUser._id}`)
      .then((res) => res.json())
      .then((freshUser) => {
        setUser(freshUser);
        // Update localStorage with fresh user data
        localStorage.setItem("user", JSON.stringify(freshUser));

        // Fetch tasks for user
        fetch(`http://localhost:3000/api/tasks/${freshUser._id}`)
          .then((res) => res.json())
          .then((tasks) => {
            const completed = tasks.filter((t) => t.isCompleted);
            setCompletedTasks(completed.length);
            setPoints(completed.reduce((sum, t) => sum + (t.points || 0), 0));
          });

        // Fetch badges.json (static)
        fetch("http://localhost:3000/api/badges")
          .then((res) => res.json())
          .then((allBadges) => {
            setBadges(
              allBadges.filter((b) => freshUser.badges && freshUser.badges.includes(b.id))
            );
          });
      });
  }, []);

  if (!user) return <div>You are not authenticated.</div>;

  return (
    <div className="max-w-2xl mx-auto p-6 fade-in">
      {/* Header */}
      <header className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center text-brand-600">
            <span className="font-bold text-lg">{user.username.charAt(0).toUpperCase()}</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{user.username}'s Profile</h1>
            <p className="text-sm text-gray-500">Your progress and badges</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { window.location.hash = "#/home"; }}
            className="p-2 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
            title="Back to Home"
          >
            <i className="ph-bold ph-house text-xl"></i>
          </button>
          <button
            onClick={() => { localStorage.removeItem("user"); window.location.hash = "#/login"; }}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Logout"
          >
            <i className="ph-bold ph-sign-out text-xl"></i>
          </button>
        </div>
      </header>

      {/* Profile Card */}
      <div className="bg-gradient-to-r from-brand-600 to-indigo-600 rounded-3xl p-8 text-white shadow-glow mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-10 transform translate-x-4 -translate-y-4">
          <i className="ph-fill ph-user text-[120px]"></i>
        </div>
        <h2 className="text-3xl font-bold mb-2">Welcome, {user.username}!</h2>
        <p className="text-brand-100 mb-6 max-w-xs">Here you can see your progress and all badges you have earned so far.</p>
        <div className="flex flex-col gap-2">
          <span className="inline-flex items-center gap-2 text-lg">
            <i className="ph-fill ph-star text-yellow-300"></i>
            <b>Total points:</b> {points}
          </span>
          <span className="inline-flex items-center gap-2 text-lg">
            <i className="ph-fill ph-check-circle text-green-200"></i>
            <b>Completed tasks:</b> {completedTasks}
          </span>
          <span className="inline-flex items-center gap-2 text-lg">
            <i className="ph-fill ph-envelope text-brand-100"></i>
            <b>Email:</b> {user.email}
          </span>
        </div>
      </div>

      {/* Badges Section */}
      <div className="mb-4">
        <div className="font-bold text-gray-700 mb-4 text-lg flex items-center gap-2">
          <i className="ph-fill ph-medal text-brand-600"></i> Badges Earned
        </div>
        
        {badges.length === 0 ? (
          <span className="text-gray-400">No badges yet.</span>
        ) : (
          <div className="space-y-6">
            {/* Points Badges */}
            {badges.some(b => b.type === 'points') && (
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-4 border border-yellow-200">
                <h3 className="font-bold text-yellow-800 mb-3 flex items-center gap-2">
                  <i className="ph-fill ph-star text-xl"></i> Points
                </h3>
                <div className="flex flex-wrap gap-2">
                  {badges.filter(b => b.type === 'points').map((badge) => (
                    <span key={badge.id} title={badge.description} className="flex items-center gap-2 bg-white text-yellow-900 rounded-lg px-3 py-2 text-sm font-semibold shadow-sm border border-yellow-100 hover:shadow-md transition-all">
                      <span style={{ fontSize: 18 }}>{badge.label}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Tasks Badges */}
            {badges.some(b => b.type === 'tasks_completed' || b.type === 'early_task') && (
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-4 border border-blue-200">
                <h3 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
                  <i className="ph-fill ph-check-circle text-xl"></i> Tasks
                </h3>
                <div className="flex flex-wrap gap-2">
                  {badges.filter(b => b.type === 'tasks_completed' || b.type === 'early_task').map((badge) => (
                    <span key={badge.id} title={badge.description} className="flex items-center gap-2 bg-white text-blue-900 rounded-lg px-3 py-2 text-sm font-semibold shadow-sm border border-blue-100 hover:shadow-md transition-all">
                      <span style={{ fontSize: 18 }}>{badge.label}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Level Badges */}
            {badges.some(b => b.type === 'level') && (
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-4 border border-purple-200">
                <h3 className="font-bold text-purple-800 mb-3 flex items-center gap-2">
                  <i className="ph-fill ph-lightning text-xl"></i> Levels
                </h3>
                <div className="flex flex-wrap gap-2">
                  {badges.filter(b => b.type === 'level').map((badge) => (
                    <span key={badge.id} title={badge.description} className="flex items-center gap-2 bg-white text-purple-900 rounded-lg px-3 py-2 text-sm font-semibold shadow-sm border border-purple-100 hover:shadow-md transition-all">
                      <span style={{ fontSize: 18 }}>{badge.label}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Challenges Badges */}
            {badges.some(b => b.type === 'challenges_completed') && (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-200">
                <h3 className="font-bold text-green-800 mb-3 flex items-center gap-2">
                  <i className="ph-fill ph-target text-xl"></i> Challenges
                </h3>
                <div className="flex flex-wrap gap-2">
                  {badges.filter(b => b.type === 'challenges_completed').map((badge) => (
                    <span key={badge.id} title={badge.description} className="flex items-center gap-2 bg-white text-green-900 rounded-lg px-3 py-2 text-sm font-semibold shadow-sm border border-green-100 hover:shadow-md transition-all">
                      <span style={{ fontSize: 18 }}>{badge.label}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

window.ProfilePage = ProfilePage;
