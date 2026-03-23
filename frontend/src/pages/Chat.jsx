import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { Send, LogOut, Users, Settings, Hash, MoreVertical, Menu, X } from 'lucide-react';
import axios from 'axios';

const SOCKET_URL = 'http://localhost:5000';
const API_URL = 'http://localhost:5000/api';

const Chat = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [typingUsers, setTypingUsers] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);

  const username = localStorage.getItem('username');
  const token = localStorage.getItem('token');
  const room = state?.room;

  useEffect(() => {
    if (!token || !username || !room) {
      navigate('/login');
      return;
    }

    // Fetch message history
    const fetchHistory = async () => {
      try {
        const res = await axios.get(`${API_URL}/messages/${room}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessages(res.data);
      } catch (err) {
        console.error('Failed to load history', err);
      }
    };
    fetchHistory();

    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    newSocket.emit('join_room', room);

    newSocket.on('receive_message', (data) => {
      setMessages((prev) => [...prev, data]);
    });

    newSocket.on('display_typing', (data) => {
      setTypingUsers((prev) => {
        if (!prev.includes(data.username)) return [...prev, data.username];
        return prev;
      });
    });

    newSocket.on('hide_typing', (data) => {
      setTypingUsers((prev) => prev.filter(u => u !== data.username));
    });

    return () => {
      newSocket.disconnect();
    };
  }, [username, room, navigate, token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  const handleTyping = (e) => {
    setCurrentMessage(e.target.value);
    
    if (socket) {
      socket.emit('typing', { room, username });
      
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('stop_typing', { room, username });
      }, 1000);
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (currentMessage.trim() !== '' && socket) {
      const messageData = {
        room: room,
        author: username,
        message: currentMessage,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      socket.emit('send_message', messageData);
      setMessages((prev) => [...prev, messageData]);
      setCurrentMessage('');
      socket.emit('stop_typing', { room, username });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    }
  };

  return (
    <div className="chat-wrapper">
      
      {/* Sidebar */}
      <div className={`chat-sidebar glass-panel ${isSidebarOpen ? 'open' : ''}`}>
        <div style={{ padding: '24px', borderBottom: 'var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, var(--primary-accent), var(--secondary-accent))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Hash color="white" size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Aura</h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Logged as {username}</p>
            </div>
          </div>
          <button className="mobile-nav-toggle" onClick={() => setIsSidebarOpen(false)}>
            <X size={24} />
          </button>
        </div>

        <div style={{ flex: 1, padding: '20px' }}>
          <h3 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)', marginBottom: '16px' }}>Current Room</h3>
          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '12px', border: '1px solid var(--primary-accent)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 10px var(--success)' }} />
              <span style={{ fontWeight: '500' }}>{room}</span>
            </div>
          </div>
        </div>

        <div style={{ padding: '24px', borderTop: 'var(--glass-border)' }}>
          <button 
            onClick={() => navigate('/rooms')}
            style={{ 
              background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', 
              border: '1px solid rgba(239, 68, 68, 0.2)', width: '100%',
              padding: '12px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              cursor: 'pointer', fontWeight: '500', transition: 'var(--transition-fast)'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
          >
            <LogOut size={18} /> Leave Room
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="chat-main glass-panel">
        
        {/* Chat Header */}
        <div style={{ padding: '20px 24px', borderBottom: 'var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="mobile-nav-toggle" onClick={() => setIsSidebarOpen(true)}>
              <Menu size={24} />
            </button>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Hash size={24} color="var(--primary-accent)" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600' }}>{room}</h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Welcome to #{room}</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <button style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><Users size={20} /></button>
            <button style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><Settings size={20} /></button>
            <button style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><MoreVertical size={20} /></button>
          </div>
        </div>

        {/* Messages Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {messages.map((msg, index) => {
            const isMe = msg.author === username;
            return (
              <div key={index} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                <div style={{ 
                  maxWidth: '70%', 
                  background: isMe ? 'linear-gradient(135deg, var(--primary-accent), var(--secondary-accent))' : 'rgba(255, 255, 255, 0.05)',
                  border: isMe ? 'none' : 'var(--glass-border)',
                  padding: '12px 16px',
                  borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  boxShadow: isMe ? '0 4px 14px 0 var(--primary-glow)' : 'none'
                }}>
                  {!isMe && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: '600' }}>{msg.author}</div>}
                  <div style={{ lineHeight: '1.5', color: isMe ? '#fff' : 'var(--text-primary)', wordBreak: 'break-word' }}>{msg.message}</div>
                  <div style={{ fontSize: '0.65rem', color: isMe ? 'rgba(255,255,255,0.7)' : 'var(--text-secondary)', marginTop: '6px', textAlign: 'right' }}>
                    {msg.time}
                  </div>
                </div>
              </div>
            );
          })}
          
          {typingUsers.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div style={{ padding: '24px', borderTop: 'var(--glass-border)' }}>
          <form onSubmit={sendMessage} style={{ display: 'flex', gap: '12px' }}>
            <input 
              type="text" 
              className="input-base" 
              placeholder={`Message #${room}`}
              value={currentMessage}
              onChange={handleTyping}
              style={{ padding: '16px 20px', borderRadius: '24px', background: 'rgba(0,0,0,0.2)' }}
            />
            <button 
              type="submit" 
              className="btn-primary" 
              style={{ width: '54px', height: '54px', borderRadius: '50%', padding: '0', flexShrink: 0 }}
            >
              <Send size={20} style={{ marginLeft: '4px' }} />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default Chat;
