import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        try {
            const response = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await response.json();
            
            if (response.ok) {
                login(data);
                navigate('/chat');
            } else {
                setError(data.message || 'Login failed');
            }
        } catch (err) {
            setError('Server error. Please try again.');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="glass-panel w-full max-w-md p-8 fade-in">
                <h2 className="text-3xl font-bold mb-6 text-center text-primary-color" style={{color: 'var(--primary-color)'}}>Welcome Back</h2>
                {error && <div className="bg-red-500/20 text-red-200 p-3 rounded mb-4 border border-red-500/50">{error}</div>}
                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm text-gray-400 ml-1">Email Address</label>
                        <input 
                            type="email" 
                            className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all outline-none"
                            placeholder="Enter your email" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            required 
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-sm text-gray-400 ml-1">Password</label>
                        <input 
                            type="password" 
                            className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all outline-none"
                            placeholder="Enter your password" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            required 
                        />
                    </div>
                    <button type="submit" className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold rounded-lg shadow-lg hover:shadow-cyan-500/50 transform hover:-translate-y-1 transition-all"
                            style={{background: 'linear-gradient(90deg, var(--primary-color), var(--secondary-color))'}}>
                        Sign In
                    </button>
                </form>
                <div className="mt-6 text-center text-sm text-gray-300">
                    Don't have an account? <Link to="/register" className="text-cyan-400 hover:text-cyan-300 font-semibold" style={{color: 'var(--primary-color)'}}>Create one</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
