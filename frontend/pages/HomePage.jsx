const { useEffect, useState } = React;

// Animation styles
const animationStyles = `
    @keyframes slideInDown {
        from {
            opacity: 0;
            transform: translateY(-20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    @keyframes slideInUp {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    @keyframes levelGlow {
        0%, 100% {
            box-shadow: 0 0 20px rgba(79, 70, 229, 0.3), 0 0 40px rgba(129, 140, 248, 0.2);
        }
        50% {
            box-shadow: 0 0 30px rgba(79, 70, 229, 0.5), 0 0 50px rgba(129, 140, 248, 0.3);
        }
    }
    
    .animate-slide-down {
        animation: slideInDown 0.6s ease-out;
    }
    
    .animate-slide-up {
        animation: slideInUp 0.6s ease-out;
    }
    
    .level-glow {
        animation: levelGlow 3s ease-in-out infinite;
    }
    
    .card-hover {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .card-hover:hover {
        transform: translateY(-2px);
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    }
    
    .stat-card {
        transition: all 0.3s ease;
    }
    
    .stat-card:hover {
        background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
        transform: translateY(-4px);
    }
`;

// Inject animation styles
if (document) {
    const styleElement = document.createElement('style');
    styleElement.innerHTML = animationStyles;
    if (!document.head.querySelector('[data-home-animations]')) {
        styleElement.setAttribute('data-home-animations', 'true');
        document.head.appendChild(styleElement);
    }
}

const HomePage = () => {
    const user = JSON.parse(localStorage.getItem("user"));
    const [score, setScore] = useState(0);
    const [progress, setProgress] = useState({ percent: 0, completed: 0, total: 0 });
    const [streak, setStreak] = useState(0);
    const [level, setLevel] = useState(1);
    const [xp, setXp] = useState(0);
    const [levelData, setLevelData] = useState(null);
    const [loginStreak, setLoginStreak] = useState(0);
    const [leaderboard, setLeaderboard] = useState(null);

    const loadStats = async () => {
        try {
            const sres = await fetch(`${API_URL}/tasks/score/${user._id}`);
            const sval = await sres.json();
            if (sres.ok) setScore(sval.score || 0);

            const pres = await fetch(`${API_URL}/tasks/progress/${user._id}`);
            const pval = await pres.json();
            if (pres.ok) setProgress({ percent: pval.percent, completed: pval.completed, total: pval.total });

            const stres = await fetch(`${API_URL}/tasks/streak/${user._id}`);
            const stval = await stres.json();
            if (stres.ok) setStreak(stval.currentStreak || 0);

            // Load level data
            const lres = await fetch(`${API_URL}/users/level/${user._id}`);
            const lval = await lres.json();
            if (lres.ok) {
                setLevel(lval.level || 1);
                setXp(lval.xp || 0);
                setLevelData(lval);
            }

            // Load user stats for login streak
            const uRes = await fetch(`${API_URL}/users/stats/${user._id}`);
            const uVal = await uRes.json();
            if (uRes.ok) {
                setLoginStreak(uVal.loginStreak || 0);
            }

            // Load leaderboard
            const lbRes = await fetch(`${API_URL}/users/leaderboard/top5`);
            const lbVal = await lbRes.json();
            if (lbRes.ok) {
                setLeaderboard(lbVal);
            }
        } catch {}
    };

    useEffect(() => { if (user) loadStats(); }, []);


    if (!user) {
        window.location.hash = "#/login";
        return null;
    }

    // Redirect coaches to their dashboard
    if (user.role === "coach") {
        window.location.hash = "#/coach";
        return null;
    }

    return (
        <div className="max-w-2xl mx-auto p-6 fade-in">
            {/* Header */}
            <header className="flex justify-between items-center mb-8 animate-slide-down">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                        {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Hi, {user.username}! 👋</h1>
                        <p className="text-sm text-gray-500">Level {level} • {xp.toLocaleString()} XP</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <a href="#/profile" className="px-4 py-2 bg-gradient-to-r from-brand-100 to-indigo-100 text-brand-600 rounded-xl font-semibold hover:shadow-md card-hover transition-all">
                        <i className="ph-bold ph-user text-lg mr-1"></i> My Profile
                    </a>
                    <button 
                        onClick={() => { localStorage.removeItem("user"); window.location.hash = "#/login"; }}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all card-hover"
                    >
                        <i className="ph-bold ph-sign-out text-xl"></i>
                    </button>
                </div>
            </header>

            {/* Hero Card */}
            <div className="bg-gradient-to-r from-brand-600 to-indigo-600 rounded-3xl p-8 text-white shadow-glow mb-8 relative overflow-hidden animate-slide-up">
                <div className="absolute top-0 right-0 opacity-10 transform translate-x-4 -translate-y-4">
                    <i className="ph-fill ph-trophy text-[120px]"></i>
                </div>
                
                <h2 className="text-3xl font-bold mb-2">Focus Mode</h2>
                <p className="text-brand-100 mb-6 max-w-xs">Stay consistent and track your daily progress to earn points.</p>
                
                <div className="flex gap-3">
                    <a href="#/tasks" className="inline-flex items-center gap-2 bg-white text-brand-600 px-6 py-3 rounded-xl font-bold hover:bg-brand-50 transition-colors shadow-lg">
                        Go to My Tasks
                        <i className="ph-bold ph-arrow-right"></i>
                    </a>
                    <a href="#/challenges" onClick={(e) => { localStorage.setItem("showEnrolled", "true"); }} className="inline-flex items-center gap-2 bg-white text-brand-600 px-6 py-3 rounded-xl font-bold hover:bg-brand-50 transition-colors shadow-lg">
                        My Challenges
                        <i className="ph-bold ph-target"></i>
                    </a>
                </div>

                {/* Progress Bar */}
                <div className="mt-6">
                    <div className="flex justify-between text-sm text-brand-100 mb-1">
                        <span>Today Progress</span>
                        <span>{progress.total === 0 ? 'No tasks' : `${progress.percent}% (${progress.completed}/${progress.total})`}</span>
                    </div>
                    <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
                        <div className="h-3 bg-white rounded-full" style={{ width: `${progress.percent}%` }}></div>
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 stat-card">
                    <div className="flex items-center gap-2 text-gray-500 mb-1 text-sm font-medium">
                        <i className="ph-fill ph-fire text-orange-500 text-lg"></i> Task Streak
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{streak > 0 ? `${streak} days` : '0'}</div>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 stat-card">
                    <div className="flex items-center gap-2 text-gray-500 mb-1 text-sm font-medium">
                        <i className="ph-fill ph-calendar-check text-green-500 text-lg"></i> Login Streak
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{loginStreak > 0 ? `${loginStreak} days` : '0'}</div>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 stat-card">
                    <div className="flex items-center gap-2 text-gray-500 mb-1 text-sm font-medium">
                        <i className="ph-fill ph-star text-yellow-500 text-lg"></i> Points
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{score.toLocaleString()}</div>
                </div>
            </div>

            {/* Explore Challenges Button */}
            <a href="#/challenges" className="block w-full bg-gradient-to-r from-indigo-500 to-brand-600 text-white p-4 rounded-2xl text-center font-bold hover:shadow-lg transition-all card-hover mb-6 group">
                <i className="ph-bold ph-rocket mr-2 group-hover:animate-bounce"></i> Explore Challenges
            </a>

            {/* Level Progress + Leaderboard */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Level Progress Card */}
            {levelData && (
                <div className="bg-gradient-to-br from-white to-indigo-50 p-8 rounded-3xl shadow-lg border border-indigo-100 card-hover level-glow relative overflow-hidden animate-slide-up">
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <span className="text-5xl font-bold bg-gradient-to-r from-brand-600 to-indigo-600 bg-clip-text text-transparent">{levelData.level}</span>
                                <h3 className="text-lg font-bold text-gray-900 mt-1">Level Progress</h3>
                                <p className="text-sm text-gray-600 mt-1">{levelData.progress}</p>
                            </div>
                            <div className="text-right">
                                <div className="text-4xl font-bold text-brand-600">{levelData.progressPercent}%</div>
                                <div className="text-xs text-gray-500">to Level {levelData.level + 1}</div>
                            </div>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="w-full h-4 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full overflow-hidden mb-6 shadow-inner">
                            <div 
                                className="h-4 bg-gradient-to-r from-brand-400 via-brand-500 to-indigo-600 rounded-full transition-all duration-500 shadow-lg" 
                                style={{ width: `${levelData.progressPercent}%` }}
                            ></div>
                        </div>

                        {/* XP Breakdown */}
                        <div className="grid grid-cols-2 gap-4 text-center">
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-2xl border border-blue-200 card-hover">
                                <div className="text-xs text-blue-700 font-bold mb-2 flex items-center justify-center gap-1">
                                    <i className="ph-fill ph-check text-lg"></i> Tasks
                                </div>
                                <div className="text-2xl font-bold text-blue-900">{levelData.breakdown.taskXP}</div>
                                <div className="text-xs text-blue-600 font-medium">XP</div>
                            </div>
                            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-2xl border border-orange-200 card-hover">
                                <div className="text-xs text-orange-700 font-bold mb-2 flex items-center justify-center gap-1">
                                    <i className="ph-fill ph-flame text-lg"></i> Streak
                                </div>
                                <div className="text-2xl font-bold text-orange-900">{levelData.breakdown.streakXP}</div>
                                <div className="text-xs text-orange-600 font-medium">XP</div>
                            </div>
                            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-2xl border border-green-200 card-hover">
                                <div className="text-xs text-green-700 font-bold mb-2 flex items-center justify-center gap-1">
                                    <i className="ph-fill ph-login text-lg"></i> Logins
                                </div>
                                <div className="text-2xl font-bold text-green-900">{levelData.breakdown.loginXP}</div>
                                <div className="text-xs text-green-600 font-medium">XP</div>
                            </div>
                             <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-2xl border border-indigo-200 card-hover">
                                <div className="text-xs text-indigo-700 font-bold mb-2 flex items-center justify-center gap-1">
                                    <i className="ph-fill ph-target text-lg"></i> Challenges
                                </div>
                                <div className="text-2xl font-bold text-indigo-900">{levelData.breakdown.challengeXP || 0}</div>
                                <div className="text-xs text-indigo-600 font-medium">XP</div>
                            </div>
                        </div>

                        {/* Decay Warning */}
                        {levelData.breakdown.decayXP > 0 && (
                            <div className="mt-6 bg-gradient-to-r from-red-50 to-red-100 border border-red-300 rounded-2xl p-4 flex items-start gap-3 animate-pulse">
                                <i className="ph-fill ph-warning text-red-500 text-xl mt-1"></i>
                                <div className="text-sm text-red-800">
                                    <span className="font-bold">-{levelData.breakdown.decayXP} XP</span> lost due to inactivity. Keep playing to maintain your level!
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Leaderboard */}
            {leaderboard && leaderboard.length > 0 && (
                <div className="animate-slide-up">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <i className="ph-fill ph-trophy text-yellow-500 text-2xl"></i> Leaderboard
                    </h3>
                    <div className="space-y-2 max-h-52 overflow-y-auto pr-2">
                        {leaderboard.map((entry, idx) => (
                            <div 
                                key={idx}
                                className={`p-4 rounded-2xl flex items-center justify-between transition-all text-sm card-hover border-2 ${
                                    idx === 0 ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-300 shadow-md' :
                                    idx === 1 ? 'bg-gradient-to-r from-gray-100 to-gray-50 border-gray-300' :
                                    idx === 2 ? 'bg-gradient-to-r from-orange-50 to-orange-100 border-orange-300' :
                                    'bg-white border-gray-100'
                                }`}
                            >
                                <div className="flex items-center gap-3 flex-1">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-base ${
                                        idx === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-lg' :
                                        idx === 1 ? 'bg-gradient-to-br from-gray-400 to-gray-600 shadow-lg' :
                                        idx === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg' :
                                        'bg-gradient-to-br from-gray-300 to-gray-500'
                                    }`}>
                                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : entry.rank}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold text-gray-900 truncate">{entry.username}</div>
                                        <div className="text-xs text-gray-600 font-medium">Lvl {entry.level}</div>
                                    </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <div className="font-bold text-gray-900">{(entry.xp / 1000).toFixed(1)}k XP</div>
                                    <div className="text-xs text-gray-500">{entry.score} pts</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            </div>
        </div>
    );
};

window.HomePage = HomePage;