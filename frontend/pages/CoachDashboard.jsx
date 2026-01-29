const { useState, useEffect } = React;

const CATEGORIES = [
    'Fitness & Health',
    'Mindfulness & Meditation',
    'Productivity',
    'Learning & Education',
    'Finance & Savings',
    'Social & Relationships',
    'Creativity',
    'Career & Professional',
    'Habits & Routines',
    'Wellness & Self-Care'
];

const CoachDashboard = () => {
    const user = JSON.parse(localStorage.getItem("user"));
    const [challenges, setChallenges] = useState([]);
    const [form, setForm] = useState({ title: "", description: "", durationDays: 7, category: "Habits & Routines" });
    const [selectedChallenge, setSelectedChallenge] = useState(null);
    const [participants, setParticipants] = useState([]);

    const handleLogout = () => {
        localStorage.removeItem("user");
        window.location.hash = "#/login";
    };

    // Role check - only coaches can see this
    if (!user) {
        window.location.hash = "#/login";
        return null;
    }

    if (user.role !== "coach") {
        window.location.hash = "#/home";
        return null;
    }

    const loadChallenges = async () => {
        try {
            const res = await fetch(`${API_URL}/challenges`);
            const data = await res.json();
            // Filter only challenges created by this coach
            const coachChallenges = data.filter(c => c.createdBy === user._id);
            setChallenges(coachChallenges);
        } catch (err) {
            console.error("Failed to load challenges", err);
        }
    };

    useEffect(() => { loadChallenges(); }, []);

    const createChallenge = async (e) => {
        e.preventDefault();
        if (!form.title.trim()) return alert("Title required");

        try {
            const res = await fetch(`${API_URL}/challenges`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...form, createdBy: user._id })
            });
            const created = await res.json();
            setChallenges(prev => [created, ...prev]);
            setForm({ title: "", description: "", durationDays: 7, category: "Habits & Routines" });
        } catch (err) {
            alert("Failed to create challenge");
        }
    };

    const loadParticipants = async (challengeId) => {
        try {
            const res = await fetch(`${API_URL}/challenges/${challengeId}/participants`);
            const data = await res.json();
            setParticipants(data);
            setSelectedChallenge(challengeId);
        } catch (err) {
            alert("Failed to load participants");
        }
    };

    const deleteChallenge = async (challengeId) => {
        if (!confirm("Are you sure you want to delete this challenge? This action cannot be undone.")) {
            return;
        }

        try {
            const res = await fetch(`${API_URL}/challenges/${challengeId}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: user._id })
            });

            const data = await res.json();

            if (!res.ok) {
                return alert("Error: " + data.message);
            }

            // Remove from local state
            setChallenges(prev => prev.filter(c => c._id !== challengeId));
            alert("Challenge deleted successfully");
        } catch (err) {
            console.error("Delete error:", err);
            alert("Failed to delete challenge");
        }
    };

    // Calculate challenge status based on creation date and duration
    const getChallengeStatus = (challenge) => {
        if (!challenge.createdAt) return "Pending";
        
        const createdDate = new Date(challenge.createdAt);
        const endDate = new Date(createdDate.getTime() + challenge.durationDays * 24 * 60 * 60 * 1000);
        const now = new Date();

        if (now < createdDate) return "Upcoming";
        if (now >= createdDate && now < endDate) return "Active";
        return "Completed";
    };

    const getStatusColor = (status) => {
        switch(status) {
            case "Upcoming": return "bg-blue-50 text-blue-700";
            case "Active": return "bg-green-50 text-green-700";
            case "Completed": return "bg-gray-50 text-gray-700";
            default: return "bg-gray-50 text-gray-700";
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 fade-in">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <a href="#/home" className="p-2 bg-white rounded-full text-gray-500 hover:text-brand-600 shadow-sm border border-gray-100 transition-colors">
                        <i className="ph-bold ph-arrow-left text-xl"></i>
                    </a>
                    <h1 className="text-2xl font-bold text-gray-900">Coach Dashboard</h1>
                </div>
                <button 
                    onClick={handleLogout}
                    className="p-2 bg-red-50 rounded-full text-red-600 hover:bg-red-100 shadow-sm border border-red-200 transition-colors flex items-center gap-2"
                >
                    <i className="ph-bold ph-sign-out text-xl"></i>
                    <span className="text-sm font-semibold">Logout</span>
                </button>
            </div>

            {/* Create Challenge Section */}
            <div className="bg-white p-6 rounded-2xl shadow-soft border border-gray-100 mb-8">
                <h2 className="text-sm font-bold text-brand-600 uppercase tracking-wider mb-4">Create General Challenge</h2>

                <form onSubmit={createChallenge} className="space-y-4">
                    <input
                        className="w-full text-lg font-semibold placeholder-gray-300 border-b border-gray-100 py-2 focus:border-brand-500 outline-none transition-colors bg-transparent"
                        placeholder="Challenge title"
                        value={form.title}
                        onChange={e => setForm({ ...form, title: e.target.value })}
                        required
                    />

                    <textarea
                        className="w-full text-sm bg-gray-50 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-brand-100 transition border border-gray-100"
                        placeholder="Description"
                        rows="3"
                        value={form.description}
                        onChange={e => setForm({ ...form, description: e.target.value })}
                    />

                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700">Duration (days):</label>
                        <input
                            type="number"
                            min="1"
                            className="w-20 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100 focus:ring-2 focus:ring-brand-100 outline-none"
                            value={form.durationDays}
                            onChange={e => setForm({ ...form, durationDays: Number(e.target.value) })}
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700">Category:</label>
                        <select
                            className="flex-1 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100 focus:ring-2 focus:ring-brand-100 outline-none text-sm"
                            value={form.category}
                            onChange={e => setForm({ ...form, category: e.target.value })}
                        >
                            {CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    <button 
                        type="submit"
                        className="w-full bg-gray-900 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-black transition-colors flex items-center justify-center gap-2"
                    >
                        <i className="ph-bold ph-plus"></i> Create Challenge
                    </button>
                </form>
            </div>

            {/* Challenges List */}
            <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4">My Challenges</h2>
                {challenges.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No challenges created yet</p>
                ) : (
                    <div className="grid gap-4">
                        {challenges.map(challenge => (
                            <div key={challenge._id} className="bg-white p-5 rounded-2xl border border-gray-100 hover:shadow-soft transition-shadow">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-lg">{challenge.title}</h3>
                                        <p className="text-sm text-gray-600 mt-1">{challenge.description}</p>
                                        <span className="inline-block mt-2 bg-purple-50 text-purple-700 text-xs font-semibold px-2 py-1 rounded-md">
                                            {challenge.category || "Habits & Routines"}
                                        </span>
                                    </div>
                                    <div className="flex flex-col gap-2 items-end">
                                        <span className="bg-brand-50 text-brand-700 text-xs font-bold px-2 py-1 rounded-md">
                                            {challenge.durationDays} days
                                        </span>
                                        <span className={`text-xs font-bold px-2 py-1 rounded-md ${getStatusColor(getChallengeStatus(challenge))}`}>
                                            {getChallengeStatus(challenge)}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                                    <i className="ph-fill ph-users text-gray-400"></i>
                                    <span>{challenge.participants?.length || 0} participants</span>
                                </div>

                                <div className="flex items-center gap-2 mb-3">
                                    <button
                                        onClick={() => loadParticipants(challenge._id)}
                                        className={`text-sm font-semibold px-3 py-1 rounded-lg transition-colors ${
                                            selectedChallenge === challenge._id
                                                ? "bg-brand-100 text-brand-700"
                                                : "text-brand-600 hover:bg-brand-50"
                                        }`}
                                    >
                                        {selectedChallenge === challenge._id ? "Hide participants" : "View participants"}
                                    </button>
                                    <button
                                        onClick={() => deleteChallenge(challenge._id)}
                                        className="text-sm font-semibold px-3 py-1 rounded-lg text-red-600 hover:bg-red-50 transition-colors flex items-center gap-1"
                                    >
                                        <i className="ph-bold ph-trash"></i> Delete
                                    </button>
                                </div>

                                {/* Participants List */}
                                {selectedChallenge === challenge._id && (
                                    <div className="mt-4 pt-4 border-t border-gray-100">
                                        <h4 className="font-semibold text-gray-700 mb-2">Enrolled Users:</h4>
                                        {participants.length === 0 ? (
                                            <p className="text-sm text-gray-500">No participants yet</p>
                                        ) : (
                                            <ul className="space-y-2">
                                                {participants.map((p, idx) => (
                                                    <li key={p.user?._id || idx} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                                                        <div className="flex items-center gap-2">
                                                            <i className="ph ph-user text-brand-600"></i>
                                                            <span className="font-medium">{p.user?.username || "Unknown"}</span>
                                                            <span className="text-gray-400 text-xs">({p.user?.email || ""})</span>
                                                        </div>
                                                        <span className={`text-xs font-bold px-2 py-1 rounded-md ${
                                                            p.status === 'completed' 
                                                                ? 'bg-green-100 text-green-700' 
                                                                : 'bg-yellow-100 text-yellow-700'
                                                        }`}>
                                                            {p.status === 'completed' ? 'Completed' : 'In Progress'}
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

window.CoachDashboard = CoachDashboard;
