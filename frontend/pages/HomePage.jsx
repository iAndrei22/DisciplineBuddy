const HomePage = () => {
    const user = JSON.parse(localStorage.getItem("user"));

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
                <div>
                    <button 
                        onClick={() => { localStorage.removeItem("user"); window.location.hash = "#/login"; }}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                        <i className="ph-bold ph-sign-out text-xl"></i>
                    </button>
                </div>
            </header>

            {/* Profile Button */}
            <a href="#/profile" className="ml-4 px-4 py-2 bg-brand-100 text-brand-600 rounded-xl font-semibold hover:bg-brand-200 transition-colors shadow-soft">
                <i className="ph-bold ph-user text-lg mr-1"></i> My Profile
            </a>

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
            </div>

            {/* Quick Stats (Static Visuals) */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 text-gray-500 mb-1 text-sm font-medium">
                        <i className="ph-fill ph-fire text-orange-500"></i> Streak
                    </div>
                    <div className="text-2xl font-bold text-gray-900">Some Days</div>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 text-gray-500 mb-1 text-sm font-medium">
                        <i className="ph-fill ph-star text-yellow-500"></i> Points
                    </div>
                    <div className="text-2xl font-bold text-gray-900">Some</div>
                </div>
            </div>
        </div>
    );
};

window.HomePage = HomePage;