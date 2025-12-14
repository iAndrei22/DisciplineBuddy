const { useEffect, useState } = React;

const HomePage = () => {
    const user = JSON.parse(localStorage.getItem("user"));
    const [score, setScore] = useState(0);
    const [progress, setProgress] = useState({ percent: 0, completed: 0, total: 0 });
    const [streak, setStreak] = useState(0);

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
        } catch {}
    };

    useEffect(() => { if (user) loadStats(); }, []);

    if (!user) {
        window.location.hash = "#/login";
        return null;
    }

    return (
        <div className="max-w-2xl mx-auto p-6 fade-in">
            {/* Header */}
            <header className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center text-brand-600">
                        <span className="font-bold text-lg">{user.username.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Hi, {user.username}! 👋</h1>
                        <p className="text-sm text-gray-500">Ready for today?</p>
                    </div>
                </div>
                <button 
                    onClick={() => { localStorage.removeItem("user"); window.location.hash = "#/login"; }}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                    <i className="ph-bold ph-sign-out text-xl"></i>
                </button>
            </header>

            {/* Hero Card */}
            <div className="bg-gradient-to-r from-brand-600 to-indigo-600 rounded-3xl p-8 text-white shadow-glow mb-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 opacity-10 transform translate-x-4 -translate-y-4">
                    <i className="ph-fill ph-trophy text-[120px]"></i>
                </div>
                
                <h2 className="text-3xl font-bold mb-2">Focus Mode</h2>
                <p className="text-brand-100 mb-6 max-w-xs">Stay consistent and track your daily progress to earn points.</p>
                
                <a href="#/tasks" className="inline-flex items-center gap-2 bg-white text-brand-600 px-6 py-3 rounded-xl font-bold hover:bg-brand-50 transition-colors shadow-lg">
                    Go to My Tasks
                    <i className="ph-bold ph-arrow-right"></i>
                </a>

                {/* Progress Bar */}
                <div className="mt-6">
                    <div className="flex justify-between text-sm text-brand-100 mb-1">
                        <span>Today Progress</span>
                        <span>{progress.percent}% ({progress.completed}/{progress.total})</span>
                    </div>
                    <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
                        <div className="h-3 bg-white rounded-full" style={{ width: `${progress.percent}%` }}></div>
                    </div>
                </div>
            </div>

            {/* Quick Stats (Static Visuals) */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 text-gray-500 mb-1 text-sm font-medium">
                        <i className="ph-fill ph-fire text-orange-500"></i> Streak
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{streak > 0 ? `Day ${streak}` : '0 Days'}</div>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 text-gray-500 mb-1 text-sm font-medium">
                        <i className="ph-fill ph-star text-yellow-500"></i> Points
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{score}</div>
                </div>
            </div>
        </div>
    );
};

window.HomePage = HomePage;