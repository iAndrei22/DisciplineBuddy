const { useState, useEffect } = React;

const predefinedTasks = [
    { title: "Read a book chapter", description: "Finish reading 1 chapter from your current book", points: 15, icon: "📚" },
    { title: "Go for a 30-min run", description: "Complete a 30-minute running session", points: 20, icon: "🏃" },
    { title: "Meditate", description: "Meditate for 10-15 minutes", points: 10, icon: "🧘" },
    { title: "Drink 8 glasses of water", description: "Stay hydrated throughout the day", points: 10, icon: "💧" },
    { title: "Complete a workout", description: "Do 30 minutes of exercise at the gym", points: 25, icon: "💪" },
    { title: "Learn something new", description: "Spend 30 minutes learning a new skill", points: 20, icon: "🎓" },
    { title: "Write in journal", description: "Spend 10 minutes journaling your thoughts", points: 12, icon: "📝" },
    { title: "Meal prep", description: "Prepare healthy meals for tomorrow", points: 18, icon: "🍽️" },
    { title: "Do 50 push-ups", description: "Complete 50 push-ups", points: 15, icon: "💯" },
    { title: "Clean your space", description: "Tidy up your room or workspace", points: 12, icon: "🧹" },
    { title: "Sleep 8 hours", description: "Get a full 8 hours of sleep", points: 15, icon: "😴" },
    { title: "Walk 10,000 steps", description: "Achieve 10,000 steps for the day", points: 18, icon: "🚶" },
    { title: "Study for exam", description: "Study for 1 hour", points: 25, icon: "📖" },
    { title: "Call a friend", description: "Catch up with a friend or family member", points: 8, icon: "📞" },
    { title: "Eat healthy meal", description: "Prepare and eat a balanced meal", points: 10, icon: "🥗" }
];

const TasksPage = () => {
    const user = JSON.parse(localStorage.getItem("user"));
    const [tasks, setTasks] = useState([]);
    const [taskForm, setTaskForm] = useState({ title: "", description: "", points: 10 });
    const [editId, setEditId] = useState(null);
    const [editForm, setEditForm] = useState({ title: "", description: "", points: 10 });
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [showPredefined, setShowPredefined] = useState(false);

    if (!user) {
        window.location.hash = "#/login";
        return null;
    }

    const loadTasks = async () => {
        const res = await fetch(`${API_URL}/tasks/${user._id}`);
        const data = await res.json();
        setTasks(data);
    };

    useEffect(() => { loadTasks(); }, []);

    const createTask = async () => {
        if (!taskForm.title.trim() || !taskForm.description.trim()) return;
        await apiPost("/tasks", { userId: user._id, ...taskForm });
        setTaskForm({ title: "", description: "", points: 10 });
        loadTasks();
    };

    const addPredefinedTask = async (predefinedTask) => {
        await apiPost("/tasks", { userId: user._id, ...predefinedTask });
        loadTasks();
        setShowPredefined(false);
    };

    const toggleTask = async (task) => {
        await apiPatch(`/tasks/${task._id}`, { isCompleted: !task.isCompleted });
        loadTasks();
    };

        const startEdit = (task) => {
            setEditId(task._id);
            setEditForm({ title: task.title, description: task.description, points: task.points });
        };

        const saveEdit = async () => {
            await fetch(`${API_URL}/tasks/${editId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editForm)
            });
            setEditId(null);
            loadTasks();
        };

        const deleteTask = async (taskId) => {
            await fetch(`${API_URL}/tasks/${taskId}`, { method: "DELETE" });
            setConfirmDeleteId(null);
            loadTasks();
        };

    return (
        <div className="max-w-xl mx-auto p-6 fade-in">
            {/* Header with Back Button */}
            <div className="flex items-center gap-4 mb-8">
                <a href="#/home" className="p-2 bg-white rounded-full text-gray-500 hover:text-brand-600 shadow-sm border border-gray-100 transition-colors">
                    <i className="ph-bold ph-arrow-left text-xl"></i>
                </a>
                <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
            </div>

            {/* Toggle Predefined Tasks */}
            <div className="mb-6">
                <button
                    onClick={() => setShowPredefined(!showPredefined)}
                    className="w-full bg-gradient-to-r from-brand-500 to-indigo-600 text-white py-3 rounded-xl font-bold hover:from-brand-600 hover:to-indigo-700 transition-all shadow-md flex items-center justify-center gap-2"
                >
                    <i className="ph-bold ph-lightning-charge"></i>
                    {showPredefined ? "Hide Predefined Tasks" : "Choose from Predefined Tasks"}
                </button>
            </div>

            {/* Predefined Tasks Grid */}
            {showPredefined && (
                <div className="mb-8 p-4 bg-indigo-50 rounded-2xl border-2 border-indigo-200">
                    <h3 className="font-bold text-indigo-800 mb-4 text-lg">🎯 Quick Task Templates</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {predefinedTasks.map((task, idx) => (
                            <button
                                key={idx}
                                onClick={() => addPredefinedTask(task)}
                                className="p-3 bg-white rounded-lg border-2 border-indigo-200 hover:border-indigo-400 hover:shadow-md transition-all text-left"
                            >
                                <div className="text-2xl mb-1">{task.icon}</div>
                                <div className="font-semibold text-sm text-gray-800">{task.title}</div>
                                <div className="text-xs text-gray-500 mt-1">{task.points}⭐</div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Add Custom Task Card */}
            <div className="bg-white p-6 rounded-2xl shadow-soft border border-gray-100 mb-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-16 h-16 bg-brand-50 rounded-bl-full -mr-8 -mt-8 z-0 transition-transform group-hover:scale-110"></div>
                
                <h2 className="text-sm font-bold text-brand-600 uppercase tracking-wider mb-4 relative z-10">Create Your Own Task</h2>

                <input
                    className="w-full text-lg font-semibold placeholder-gray-300 border-b border-gray-100 py-2 focus:border-brand-500 outline-none transition-colors mb-4 bg-transparent relative z-10"
                    placeholder="What needs to be done?"
                    value={taskForm.title}
                    onChange={e => setTaskForm({ ...taskForm, title: e.target.value })}
                />

                <div className="flex gap-3 relative z-10">
                    <input
                        className="flex-1 text-sm bg-gray-50 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-brand-100 transition"
                        placeholder="Details..."
                        value={taskForm.description}
                        onChange={e => setTaskForm({ ...taskForm, description: e.target.value })}
                    />
                    <div className="flex items-center bg-gray-50 rounded-lg px-3 border border-gray-100">
                        <i className="ph-fill ph-star text-yellow-400 mr-1"></i>
                        <input
                            type="number"
                            className="w-10 bg-transparent text-sm font-bold text-gray-700 outline-none"
                            value={taskForm.points}
                            onChange={e => setTaskForm({ ...taskForm, points: Number(e.target.value) })}
                        />
                    </div>
                </div>

                <button 
                    onClick={createTask}
                    className="mt-4 w-full bg-gray-900 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-black transition-colors flex items-center justify-center gap-2 relative z-10"
                >
                    <i className="ph-bold ph-plus"></i> Add Task
                </button>
            </div>

            {/* Task List - Grouped by Challenge */}
            <div className="space-y-6">
                {/* Challenge Tasks - grupate */}
                {(() => {
                    const challengeTasks = tasks.filter(t => t.challengeId);
                    const personalTasks = tasks.filter(t => !t.challengeId);
                    
                    // Grupează task-urile pe challengeId (folosind _id-ul)
                    const challengeGroups = {};
                    challengeTasks.forEach(task => {
                        // challengeId poate fi obiect populat sau string
                        const chalId = typeof task.challengeId === 'object' ? task.challengeId._id : task.challengeId;
                        if (!challengeGroups[chalId]) {
                            challengeGroups[chalId] = {
                                challenge: typeof task.challengeId === 'object' ? task.challengeId : null,
                                tasks: []
                            };
                        }
                        challengeGroups[chalId].tasks.push(task);
                    });
                    
                    return (
                        <>
                            {/* Challenge-grouped tasks */}
                            {Object.keys(challengeGroups).length > 0 && (
                                <div className="space-y-4">
                                    <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wider flex items-center gap-2">
                                        <i className="ph-fill ph-flag-banner text-brand-500"></i>
                                        Challenge Tasks
                                    </h2>
                                    {Object.entries(challengeGroups).map(([challengeId, group]) => {
                                        const challengeTaskList = group.tasks;
                                        const challenge = group.challenge;
                                        const completedCount = challengeTaskList.filter(t => t.isCompleted).length;
                                        const totalCount = challengeTaskList.length;
                                        const progressPercent = (completedCount / totalCount) * 100;
                                        
                                        return (
                                            <div key={challengeId} className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl border border-purple-100 overflow-hidden">
                                                {/* Challenge header cu info despre challenge */}
                                                <div className="p-4 border-b border-purple-100">
                                                    {/* Challenge info */}
                                                    {challenge && (
                                                        <div className="mb-3">
                                                            <h3 className="font-bold text-purple-900 text-lg flex items-center gap-2">
                                                                <i className="ph-fill ph-flag-banner"></i>
                                                                {challenge.title}
                                                            </h3>
                                                            {challenge.description && (
                                                                <p className="text-sm text-purple-700 mt-1">{challenge.description}</p>
                                                            )}
                                                            {challenge.createdBy && (
                                                                <div className="flex items-center gap-1 mt-2 text-xs text-purple-600">
                                                                    <i className="ph-fill ph-chalkboard-teacher"></i>
                                                                    <span>Coach: <strong>{challenge.createdBy.username || 'Unknown'}</strong></span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                    
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="font-medium text-purple-800 text-sm">Tasks Progress</span>
                                                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                            completedCount === totalCount 
                                                                ? 'bg-green-100 text-green-700'
                                                                : completedCount > 0
                                                                ? 'bg-yellow-100 text-yellow-700'
                                                                : 'bg-gray-100 text-gray-600'
                                                        }`}>
                                                            {completedCount === totalCount ? '✓ Completed' : 
                                                             completedCount > 0 ? '⏳ In Progress' : '🆕 New'}
                                                        </span>
                                                    </div>
                                                    {/* Progress bar */}
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex-1 bg-purple-200 rounded-full h-2">
                                                            <div 
                                                                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                                                                style={{ width: `${progressPercent}%` }}
                                                            ></div>
                                                        </div>
                                                        <span className="text-xs font-medium text-purple-700">{completedCount}/{totalCount}</span>
                                                    </div>
                                                </div>
                                                
                                                {/* Tasks in this challenge */}
                                                <div className="p-3 space-y-2">
                                                    {challengeTaskList.map(task => (
                                                        <div 
                                                            key={task._id} 
                                                            className={`p-3 bg-white rounded-xl border transition-all duration-200 flex items-start gap-3 ${
                                                                task.isCompleted 
                                                                ? "border-green-200 bg-green-50" 
                                                                : "border-gray-100 hover:border-brand-200 hover:shadow-sm"
                                                            }`}
                                                        >
                                                            <button 
                                                                onClick={() => toggleTask(task)}
                                                                className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                                                                    task.isCompleted 
                                                                    ? "bg-green-500 border-green-500 text-white" 
                                                                    : "border-gray-300 text-transparent hover:border-brand-400"
                                                                }`}
                                                            >
                                                                <i className="ph-bold ph-check text-xs"></i>
                                                            </button>

                                                            <div className="flex-1">
                                                                <h3 className={`font-medium text-sm ${task.isCompleted ? "line-through text-gray-400" : "text-gray-800"}`}>
                                                                    {task.title}
                                                                </h3>
                                                                {task.description && (
                                                                    <p className="text-xs text-gray-500 mt-0.5">{task.description}</p>
                                                                )}
                                                            </div>

                                                            <div className="bg-brand-50 text-brand-700 text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1">
                                                                <i className="ph-fill ph-star text-brand-400"></i>
                                                                +{task.points}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                            
                            {/* Personal Tasks */}
                            {personalTasks.length > 0 && (
                                <div className="space-y-3">
                                    <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wider flex items-center gap-2">
                                        <i className="ph-fill ph-user text-gray-500"></i>
                                        Personal Tasks
                                    </h2>
                                    {personalTasks.map(task => (
                    <div 
                        key={task._id} 
                        className={`group p-4 bg-white rounded-xl border transition-all duration-200 flex items-start gap-4 ${
                            task.isCompleted 
                            ? "border-gray-100 opacity-60" 
                            : "border-gray-100 hover:border-brand-200 hover:shadow-md"
                        }`}
                    >
                        <button 
                            onClick={() => toggleTask(task)}
                            className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                                task.isCompleted 
                                ? "bg-green-500 border-green-500 text-white" 
                                : "border-gray-300 text-transparent hover:border-brand-400"
                            }`}
                        >
                            <i className="ph-bold ph-check text-xs"></i>
                        </button>

                        <div className="flex-1">
                                {editId === task._id ? (
                                    <>
                                        <input 
                                            className="font-semibold text-gray-800 mb-1 w-full border border-brand-300 bg-brand-50 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-brand-200 transition"
                                            value={editForm.title}
                                            onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                                        />
                                        <input 
                                            className="text-sm text-gray-700 mb-1 w-full border border-brand-200 bg-brand-50 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-brand-100 transition"
                                            value={editForm.description}
                                            onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                                        />
                                        <input 
                                            type="number"
                                            className="text-xs font-bold mb-1 w-16 border border-brand-200 bg-brand-50 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-brand-100 transition"
                                            value={editForm.points}
                                            onChange={e => setEditForm({ ...editForm, points: Number(e.target.value) })}
                                        />
                                        <button onClick={saveEdit} className="mr-2 text-xs text-green-600">Save</button>
                                        <button onClick={() => setEditId(null)} className="text-xs text-gray-400">Cancel</button>
                                    </>
                                ) : (
                                    <>
                                        <h3 className={`font-semibold text-gray-800 ${task.isCompleted ? "line-through text-gray-400" : ""}`}>{task.title}</h3>
                                        <p className="text-sm text-gray-500 mt-0.5">{task.description}</p>
                                    </>
                                )}
                        </div>

                        <div className="bg-brand-50 text-brand-700 text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1 h-fit">
                            <i className="ph-fill ph-star text-brand-400"></i>
                            +{task.points}
                        </div>
                            <div className="flex flex-col gap-1 ml-2 relative">
                                <button onClick={() => startEdit(task)} className="text-xs text-blue-500">Edit</button>
                                {confirmDeleteId === task._id ? (
                                    <div className="bg-white border border-gray-200 rounded shadow-sm p-2 flex flex-col items-center animate-fade-in text-xs z-30 absolute top-0 right-[-220px] min-w-[200px] shadow-lg">
                                        <span className="mb-2 text-gray-700">Are you sure you want to delete this task?</span>
                                        <div className="flex gap-2">
                                            <button onClick={() => deleteTask(task._id)} className="text-red-600 font-bold">Yes</button>
                                            <button onClick={() => setConfirmDeleteId(null)} className="text-gray-400">No</button>
                                        </div>
                                    </div>
                                ) : (
                                    <button onClick={() => setConfirmDeleteId(task._id)} className="text-xs text-red-500">Delete</button>
                                )}
                            </div>
                    </div>
                                    ))}
                                </div>
                            )}
                        </>
                    );
                })()}
            </div>
        </div>
    );
};

window.TasksPage = TasksPage;