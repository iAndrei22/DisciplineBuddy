const { useState, useEffect } = React;

const CATEGORIES = [
    'All Categories',
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

const BrowseChallenges = () => {
    const user = JSON.parse(localStorage.getItem("user"));
    const [challenges, setChallenges] = useState([]);
    const [showEnrolled, setShowEnrolled] = useState(() => {
        const flag = localStorage.getItem("showEnrolled");
        localStorage.removeItem("showEnrolled");
        return flag === "true";
    });
    const [selectedCategory, setSelectedCategory] = useState("All Categories");
    const [searchQuery, setSearchQuery] = useState("");

    if (!user) {
        window.location.hash = "#/login";
        return null;
    }

    const loadChallenges = async () => {
        try {
            const res = await fetch(`${API_URL}/challenges`);
            const data = await res.json();
            setChallenges(data);
        } catch (err) {
            console.error("Failed to load challenges", err);
        }
    };

    useEffect(() => { loadChallenges(); }, []);

    // Check if current user is enrolled in a challenge by checking participants array
    const isUserEnrolled = (challenge) => {
        if (!challenge.participants) return false;
        return challenge.participants.some(p => {
            const oderId = p.user ? (p.user._id || p.user) : (p._id || p);
            return oderId.toString() === user._id;
        });
    };

    // Get user's participation info for a challenge
    const getUserParticipation = (challenge) => {
        if (!challenge.participants) return null;
        return challenge.participants.find(p => {
            const oderId = p.user ? (p.user._id || p.user) : (p._id || p);
            return oderId.toString() === user._id;
        });
    };

    // Calculate time remaining or overdue
    const getTimeInfo = (challenge, participation) => {
        if (!participation || !participation.enrolledAt) return null;
        
        const enrolledDate = new Date(participation.enrolledAt);
        const deadline = new Date(enrolledDate.getTime() + challenge.durationDays * 24 * 60 * 60 * 1000);
        const now = new Date();
        const diffMs = deadline - now;
        const diffDays = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
        
        if (participation.status === 'completed') {
            const completedDate = new Date(participation.completedAt);
            const wasLate = completedDate > deadline;
            if (wasLate) {
                const lateDays = Math.ceil((completedDate - deadline) / (24 * 60 * 60 * 1000));
                return { type: 'completed-late', days: lateDays };
            }
            return { type: 'completed-ontime', days: 0 };
        }
        
        if (diffDays > 0) {
            return { type: 'remaining', days: diffDays };
        } else {
            return { type: 'overdue', days: Math.abs(diffDays) };
        }
    };

    const enrollChallenge = async (challengeId) => {
        try {
            const res = await fetch(`${API_URL}/challenges/${challengeId}/enroll`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: user._id })
            });
            
            const data = await res.json();
            
            if (!res.ok) {
                return alert("Error: " + data.message);
            }
            
            // Update challenges list with the updated challenge
            setChallenges(prev => prev.map(c => c._id === challengeId ? data : c));
            
            alert("Successfully enrolled in challenge!");
        } catch (err) {
            console.error("Enrollment error:", err);
            alert("Failed to enroll");
        }
    };

    // Update status (mark as completed or in-progress)
    const updateStatus = async (challengeId, newStatus) => {
        try {
            console.log("Updating status:", { challengeId, userId: user._id, status: newStatus });
            console.log("URL:", `${API_URL}/challenges/${challengeId}/status`);
            
            const res = await fetch(`${API_URL}/challenges/${challengeId}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: user._id, status: newStatus })
            });
            
            console.log("Response status:", res.status);
            const data = await res.json();
            console.log("Response data:", data);
            
            if (!res.ok) {
                return alert("Error: " + data.message);
            }
            
            // Update challenges list
            setChallenges(prev => prev.map(c => c._id === challengeId ? data : c));
        } catch (err) {
            console.error("Status update error:", err);
            alert("Failed to update status");
        }
    };

    // Filter challenges - My Challenges shows where user is in participants
    // Also apply category and search filters
    const displayedChallenges = challenges.filter(c => {
        // Filter by enrolled status
        if (showEnrolled && !isUserEnrolled(c)) return false;
        
        // Filter by category
        if (selectedCategory !== "All Categories" && c.category !== selectedCategory) return false;
        
        // Filter by search query (title or description)
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            const matchesTitle = c.title?.toLowerCase().includes(query);
            const matchesDesc = c.description?.toLowerCase().includes(query);
            const matchesCoach = c.coachUsername?.toLowerCase().includes(query);
            if (!matchesTitle && !matchesDesc && !matchesCoach) return false;
        }
        
        return true;
    });

    // Count enrolled challenges
    const enrolledCount = challenges.filter(c => isUserEnrolled(c)).length;

    return (
        <div className="max-w-4xl mx-auto p-6 fade-in">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <a href="#/home" className="p-2 bg-white rounded-full text-gray-500 hover:text-brand-600 shadow-sm border border-gray-100 transition-colors">
                    <i className="ph-bold ph-arrow-left text-xl"></i>
                </a>
                <h1 className="text-2xl font-bold text-gray-900">{showEnrolled ? "My Challenges" : "Explore Challenges"}</h1>
            </div>

            {/* Tabs */}
            <div className="flex bg-gray-100 p-1 rounded-xl mb-4">
                <button 
                    onClick={() => setShowEnrolled(false)}
                    className={`flex-1 py-2 px-4 text-sm font-semibold rounded-lg transition-all ${!showEnrolled ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                >
                    All Challenges
                </button>
                <button 
                    onClick={() => setShowEnrolled(true)}
                    className={`flex-1 py-2 px-4 text-sm font-semibold rounded-lg transition-all ${showEnrolled ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                >
                    My Challenges ({enrolledCount})
                </button>
            </div>

            {/* Search and Category Filter */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="relative flex-1">
                    <i className="ph-bold ph-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                    <input
                        type="text"
                        placeholder="Search challenges..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-100 focus:border-brand-500 outline-none transition"
                    />
                </div>
                <select
                    value={selectedCategory}
                    onChange={e => setSelectedCategory(e.target.value)}
                    className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-100 focus:border-brand-500 outline-none transition"
                >
                    {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
            </div>

            {/* Challenges List */}
            {displayedChallenges.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl text-center shadow-soft border border-gray-100">
                    <i className="ph-fill ph-article text-4xl text-gray-300 mb-4"></i>
                    <p className="text-gray-500">{showEnrolled ? "You haven't enrolled in any challenges yet" : "No challenges available yet"}</p>
                </div>
            ) : (
                <div className="grid gap-4">
                {displayedChallenges.map(challenge => {
                        const isEnrolled = isUserEnrolled(challenge);
                        const participation = getUserParticipation(challenge);
                        const timeInfo = participation ? getTimeInfo(challenge, participation) : null;
                        
                        return (
                            <div key={challenge._id} className="bg-white p-5 rounded-2xl border border-gray-100 hover:shadow-soft transition-shadow">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-lg">{challenge.title}</h3>
                                        <p className="text-sm text-gray-600 mt-1">{challenge.description}</p>
                                        <span className="inline-block mt-2 bg-purple-50 text-purple-700 text-xs font-semibold px-2 py-1 rounded-md">
                                            {challenge.category || "Habits & Routines"}
                                        </span>
                                    </div>
                                    <span className="bg-brand-50 text-brand-700 text-xs font-bold px-2 py-1 rounded-md">
                                        {challenge.durationDays} days
                                    </span>
                                </div>

                                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                                    <div className="flex items-center gap-2">
                                        <i className="ph-fill ph-chalkboard-teacher text-brand-500"></i>
                                        <span className="font-medium text-brand-600">{challenge.coachUsername || "Coach"}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <i className="ph-fill ph-users text-gray-400"></i>
                                        <span>{challenge.participants?.length || 0} participants</span>
                                    </div>
                                </div>

                                {/* Time info and status for enrolled users */}
                                {isEnrolled && timeInfo && (
                                    <div className="mb-4 p-3 rounded-lg bg-gray-50 border border-gray-100">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                                                    participation.status === 'completed' 
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                    {participation.status === 'completed' ? 'Completed' : 'In Progress'}
                                                </span>
                                            </div>
                                            <div className={`text-sm font-medium ${
                                                timeInfo.type === 'remaining' ? 'text-blue-600' :
                                                timeInfo.type === 'overdue' ? 'text-red-600' :
                                                timeInfo.type === 'completed-late' ? 'text-orange-600' :
                                                'text-green-600'
                                            }`}>
                                                {timeInfo.type === 'remaining' && (
                                                    <><i className="ph-bold ph-clock mr-1"></i>{timeInfo.days} days remaining</>
                                                )}
                                                {timeInfo.type === 'overdue' && (
                                                    <><i className="ph-bold ph-warning mr-1"></i>{timeInfo.days} days overdue!</>
                                                )}
                                                {timeInfo.type === 'completed-late' && (
                                                    <><i className="ph-bold ph-check-circle mr-1"></i>Completed {timeInfo.days} days late</>
                                                )}
                                                {timeInfo.type === 'completed-ontime' && (
                                                    <><i className="ph-bold ph-check-circle mr-1"></i>Completed on time!</>
                                                )}
                                            </div>
                                        </div>

                                        {/* Status toggle buttons */}
                                        {participation.status !== 'completed' && (
                                            <button
                                                onClick={() => updateStatus(challenge._id, 'completed')}
                                                className="mt-3 w-full py-2 rounded-lg text-sm font-bold bg-green-600 text-white hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                                            >
                                                <i className="ph-bold ph-check"></i> Mark as Completed
                                            </button>
                                        )}
                                        {participation.status === 'completed' && (
                                            <button
                                                onClick={() => updateStatus(challenge._id, 'in-progress')}
                                                className="mt-3 w-full py-2 rounded-lg text-sm font-bold bg-yellow-500 text-white hover:bg-yellow-600 transition-colors flex items-center justify-center gap-2"
                                            >
                                                <i className="ph-bold ph-arrow-counter-clockwise"></i> Mark as In Progress
                                            </button>
                                        )}
                                    </div>
                                )}

                                {/* Enroll button for non-enrolled users */}
                                {!isEnrolled && (
                                    <button
                                        onClick={() => enrollChallenge(challenge._id)}
                                        className="w-full py-2 rounded-lg text-sm font-bold bg-brand-600 text-white hover:bg-brand-700 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <i className="ph-bold ph-plus"></i> Enroll Now
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

window.BrowseChallenges = BrowseChallenges;
