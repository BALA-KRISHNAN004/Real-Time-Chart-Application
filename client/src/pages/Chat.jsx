import { useState, useEffect, useContext, useRef } from 'react';
import io from 'socket.io-client';
import AuthContext from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Chat = () => {
    const { user, logout } = useContext(AuthContext);
    const [socket, setSocket] = useState(null);
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [room, setRoom] = useState('General');
    const [users, setUsers] = useState([]); 
    const [typingUsers, setTypingUsers] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const messagesEndRef = useRef(null);
    const navigate = useNavigate();
    const typingTimeoutRef = useRef(null);

    // Request Notification Permission
    useEffect(() => {
        if (Notification.permission !== "granted") {
            Notification.requestPermission();
        }
    }, []);

    // Initialize Socket and Load History
    useEffect(() => {
        // Fetch History
        const fetchHistory = async () => {
            try {
                const res = await fetch(`http://localhost:5000/api/chat/${room}`);
                const data = await res.json();
                setMessages(data);
            } catch (err) {
                console.error("Failed to fetch history:", err);
            }
        };
        fetchHistory();

        const newSocket = io('http://localhost:5000');
        setSocket(newSocket);

        newSocket.emit('join_room', room);
        newSocket.emit('user_online', user.username);

        newSocket.on('get_users', (users) => setUsers(users));
        
        newSocket.on('receive_message', (data) => {
            setMessages((prev) => [...prev, data]);
            if (document.hidden && Notification.permission === "granted" && data.author !== user.username) {
                new Notification(`New message from ${data.author}`, { body: data.message || "Sent a file" });
            }
        });

        newSocket.on('display_typing', (data) => {
            if (data.user !== user.username) {
                setTypingUsers((prev) => [...new Set([...prev, data.user])]);
            }
        });

        newSocket.on('hide_typing', (data) => {
            setTypingUsers((prev) => prev.filter(u => u !== data.user));
        });

        return () => newSocket.close();
    }, [room, user.username]);

    // Cleanup scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, typingUsers]);

    const handleInput = (e) => {
        setMessage(e.target.value);
        if (socket) {
            socket.emit('typing', { room, user: user.username });
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
                socket.emit('stop_typing', { room, user: user.username });
            }, 2000);
        }
    };

    const handleFileSelect = (e) => {
        setSelectedFile(e.target.files[0]);
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if ((!message.trim() && !selectedFile) || !socket) return;

        let fileUrl = null;
        let fileType = null;

        if (selectedFile) {
            const formData = new FormData();
            formData.append('file', selectedFile);
            try {
                const res = await fetch('http://localhost:5000/api/chat/upload', {
                    method: 'POST',
                    body: formData
                });
                const data = await res.json();
                fileUrl = data.url; // Relative path
                fileType = data.type;
            } catch (err) {
                console.error("Upload failed", err);
                return; // Stop if upload fails
            }
        }

        const msgData = {
            room,
            author: user.username,
            message: message,
            fileUrl: fileUrl ? `http://localhost:5000${fileUrl}` : null,
            fileType,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        
        socket.emit('send_message', msgData);
        setMessages((prev) => [...prev, msgData]); 
        
        setMessage('');
        setSelectedFile(null);
        socket.emit('stop_typing', { room, user: user.username });
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="flex h-screen overflow-hidden">
            {/* Sidebar */}
            <div className="w-1/4 glass border-r border-white/10 hidden md:flex flex-col">
                <div className="p-6 border-b border-white/10">
                    <h1 className="text-2xl font-bold tracking-wider" style={{color: 'var(--primary-color)'}}>NEO CHAT</h1>
                    <div className="mt-2 text-sm text-gray-400">Logged in as <span className="text-white">{user?.username}</span></div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4">
                    <div className="mb-6">
                        <h3 className="text-xs uppercase text-gray-500 font-semibold mb-3">Online Users ({users.length})</h3>
                        {users.map((u, idx) => (
                            <div key={idx} className="flex items-center gap-2 mb-2 text-gray-300">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                <span>{u}</span>
                            </div>
                        ))}
                    </div>

                    <div className="mb-6">
                        <h3 className="text-xs uppercase text-gray-500 font-semibold mb-3">Rooms</h3>
                        {['General', 'Tech', 'Random'].map((r) => (
                            <div 
                                key={r}
                                onClick={() => setRoom(r)}
                                className={`p-3 rounded-lg cursor-pointer mb-2 transition-all ${room === r ? 'bg-white/10 text-cyan-400' : 'hover:bg-white/5 text-gray-300'}`}
                            >
                                # {r}
                            </div>
                        ))}
                    </div>
                </div>
                
                <div className="p-4 border-t border-white/10">
                     <button onClick={handleLogout} className="w-full py-2 px-4 rounded bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors">
                        Logout
                    </button>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col relative">
                {/* Header */}
                <div className="h-16 glass border-b border-white/10 flex items-center justify-between px-6">
                    <div className="font-bold text-lg"># {room}</div>
                    <div className="md:hidden">
                        <button onClick={handleLogout} className="text-sm text-red-400">Logout</button>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex flex-col ${msg.author === user?.username ? 'items-end' : 'items-start'}`}>
                            <div className={`max-w-[70%] rounded-2xl p-4 ${
                                msg.author === user?.username 
                                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-tr-none' 
                                : 'bg-white/10 text-gray-200 rounded-tl-none'
                            }`}>
                                {msg.fileUrl && (
                                    <div className="mb-2">
                                        {msg.fileType === 'image' ? (
                                            <img src={msg.fileUrl} alt="shared" className="rounded-lg max-h-60 max-w-full" />
                                        ) : (
                                            <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-200 underline">
                                                Download File
                                            </a>
                                        )}
                                    </div>
                                )}
                                <div className="text-sm">{msg.message}</div>
                            </div>
                            <div className="text-xs text-gray-500 mt-1 flex gap-2">
                                <span>{msg.author}</span>
                                <span>{msg.time}</span>
                            </div>
                        </div>
                    ))}
                    {typingUsers.length > 0 && (
                        <div className="text-xs text-cyan-400 italic animate-pulse">
                            {typingUsers.join(', ')} is typing...
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 glass border-t border-white/10">
                    {selectedFile && (
                        <div className="text-xs text-gray-400 mb-2">
                            Selected: {selectedFile.name} 
                            <button onClick={() => setSelectedFile(null)} className="ml-2 text-red-400">x</button>
                        </div>
                    )}
                    <form onSubmit={sendMessage} className="flex gap-4 items-center">
                        <label className="cursor-pointer text-gray-400 hover:text-cyan-400 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                            <input type="file" onChange={handleFileSelect} className="hidden" />
                        </label>
                        <input 
                            className="flex-1 bg-black/20 border-none focus:ring-1 focus:ring-cyan-500 rounded px-4 py-2 text-white"
                            placeholder="Type a message..."
                            value={message}
                            onChange={handleInput}
                        />
                        <button type="submit" className="px-6 py-2 bg-cyan-600 rounded-lg hover:bg-cyan-500 transition-colors text-white font-bold">
                            Send
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Chat;
