const { useState } = React;
const API_URL = 'http://localhost:3000/api';

const App = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [form, setForm] = useState({ username: '', email: '', password: '' });
    const [msg, setMsg] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMsg('Processing...');
        
        const endpoint = isLogin ? '/login' : '/register';
        const body = isLogin ? { email: form.email, password: form.password } : form;

        try {
            const res = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            
            if (res.ok) {
                setMsg(isLogin ? 'Success! Logged in.' : 'Account created! Please log in.');
                if (!isLogin) setIsLogin(true);
            } else {
                setMsg(`Error: ${data.message}`);
            }
        } catch (err) {
            setMsg('Network Error');
        }
    };

    return (
        <div className="w-96 bg-white p-8 rounded shadow-lg">
            <h1 className="text-2xl font-bold mb-6 text-center">DisciplineBuddy</h1>
            
            <div className="flex justify-center mb-4 border-b">
                <button onClick={() => setIsLogin(true)} className={`p-2 ${isLogin ? 'border-b-2 border-blue-500 font-bold' : ''}`}>Login</button>
                <button onClick={() => setIsLogin(false)} className={`p-2 ${!isLogin ? 'border-b-2 border-blue-500 font-bold' : ''}`}>Register</button>
            </div>

            {msg && <p className="text-center text-sm mb-4 text-red-500">{msg}</p>}

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                {!isLogin && <input className="p-2 border rounded" placeholder="Username" onChange={e => setForm({...form, username: e.target.value})} required />}
                <input className="p-2 border rounded" type="email" placeholder="Email" onChange={e => setForm({...form, email: e.target.value})} required />
                <input className="p-2 border rounded" type="password" placeholder="Password" onChange={e => setForm({...form, password: e.target.value})} required />
                
                <button className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
                    {isLogin ? 'Log In' : 'Sign Up'}
                </button>
            </form>
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);