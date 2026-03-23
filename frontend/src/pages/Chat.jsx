import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { Send, LogOut, Hash, Menu, X, Paperclip, Check, CheckCheck } from 'lucide-react';
import axios from 'axios';

const SOCKET_URL = 'https://aura-app-keg8.onrender.com';
const API_URL = 'https://aura-app-keg8.onrender.com/api';

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

const Chat = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [typingUsers, setTypingUsers] = useState([]);
  const [roomUsers, setRoomUsers] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [hoveredMsg, setHoveredMsg] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const username = localStorage.getItem('username');
  const token = localStorage.getItem('token');
  const room = state?.room;
  const isDM = state?.isDM;
  const dmPartner = state?.dmPartner;

  useEffect(() => {
    if (!token || !username || !room) { navigate('/login'); return; }

    // Fetch message history
    const fetchHistory = async () => {
      try {
        const res = await axios.get(`${API_URL}/messages/${room}`, { headers: { Authorization: `Bearer ${token}` } });
        setMessages(res.data);
      } catch (err) { console.error('Failed to load history', err); }
    };
    fetchHistory();

    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);
    newSocket.emit('join_room', { room, username });
    newSocket.emit('mark_read', { room, username });

    newSocket.on('room_users', users => setRoomUsers(users));

    newSocket.on('receive_message', data => {
      setMessages(prev => [...prev, data]);
      newSocket.emit('mark_read', { room, username });
    });

    newSocket.on('reaction_updated', ({ messageId, reactions }) => {
      setMessages(prev => prev.map(m => m._id === messageId ? { ...m, reactions } : m));
    });

    newSocket.on('messages_read', ({ username: reader }) => {
      setMessages(prev => prev.map(m => ({
        ...m,
        readBy: m.readBy ? (m.readBy.includes(reader) ? m.readBy : [...m.readBy, reader]) : [reader]
      })));
    });

    newSocket.on('display_typing', data => {
      setTypingUsers(prev => prev.includes(data.username) ? prev : [...prev, data.username]);
    });
    newSocket.on('hide_typing', data => {
      setTypingUsers(prev => prev.filter(u => u !== data.username));
    });

    return () => {
      newSocket.emit('leave_room', { room, username });
      newSocket.disconnect();
    };
  }, [username, room, navigate, token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  const handleTyping = e => {
    setCurrentMessage(e.target.value);
    if (socket) {
      socket.emit('typing', { room, username });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => socket.emit('stop_typing', { room, username }), 1000);
    }
  };

  const sendMessage = e => {
    e.preventDefault();
    if (currentMessage.trim() !== '' && socket) {
      const msgData = {
        room,
        author: username,
        message: currentMessage,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        readBy: [username],
        reactions: []
      };
      socket.emit('send_message', msgData);
      setMessages(prev => [...prev, msgData]);
      setCurrentMessage('');
      socket.emit('stop_typing', { room, username });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleImageUpload = async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('room', room);
      const res = await axios.post(`${API_URL}/upload`, formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      const newMsg = res.data.data;
      socket?.emit('send_message', newMsg);
      setMessages(prev => [...prev, newMsg]);
    } catch (err) {
      console.error('Image upload failed', err);
    }
    setUploadingImage(false);
    e.target.value = '';
  };

  const handleReaction = (messageId, emoji) => {
    if (!socket || !messageId) return;
    socket.emit('toggle_reaction', { messageId, emoji, username });
  };

  const renderReadReceipt = msg => {
    if (msg.author !== username) return null;
    const readCount = msg.readBy?.filter(u => u !== username).length || 0;
    return readCount > 0
      ? <CheckCheck size={14} style={{ color: 'var(--primary-accent)' }} title={`Read by ${readCount}`} />
      : <Check size={14} style={{ color: 'rgba(255,255,255,0.5)' }} title="Sent" />;
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
              <h2 style={{ fontSize: '1.1rem', fontWeight: '600' }}>Aura</h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>@{username}</p>
            </div>
          </div>
          <button className="mobile-nav-toggle" onClick={() => setIsSidebarOpen(false)}><X size={20} /></button>
        </div>

        <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
          <h3 style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)', marginBottom: '12px', display: 'flex', justifyContent: 'space-between' }}>
            <span>{isDM ? 'Chat' : 'Online'}</span>
            {!isDM && <span style={{ color: 'var(--success)' }}>{roomUsers.length}</span>}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {(isDM ? [{ username: dmPartner }, { username }] : roomUsers.map(u => ({ username: u }))).map((user, idx) => (
              <div key={idx} style={{ background: 'rgba(255,255,255,0.04)', padding: '10px 12px', borderRadius: '10px', border: user.username === username ? '1px solid var(--primary-accent)' : '1px solid transparent', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)', flexShrink: 0 }} />
                <span style={{ fontWeight: '500', fontSize: '0.9rem', color: user.username === username ? 'var(--primary-accent)' : 'var(--text-primary)' }}>
                  {user.username} {user.username === username ? '(You)' : ''}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: '20px', borderTop: 'var(--glass-border)' }}>
          <button onClick={() => navigate('/rooms')} style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.2)', width: '100%', padding: '11px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', fontWeight: '500' }}>
            <LogOut size={16} /> Leave Room
          </button>
        </div>
      </div>

      {/* Main Chat */}
      <div className="chat-main glass-panel">
        {/* Header */}
        <div style={{ padding: '18px 24px', borderBottom: 'var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="mobile-nav-toggle" onClick={() => setIsSidebarOpen(true)}><Menu size={22} /></button>
            <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Hash size={22} color="var(--primary-accent)" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>{isDM ? dmPartner : room}</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{isDM ? 'Direct Message' : `#${room}`}</p>
            </div>
          </div>
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowSettings(!showSettings)} style={{ background: 'none', border: 'none', color: 'var(--primary-accent)', cursor: 'pointer', padding: '6px' }}>•••</button>
            {showSettings && (
              <div className="glass-panel" style={{ position: 'absolute', top: '40px', right: 0, width: '180px', padding: '8px', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <button onClick={() => { setMessages([]); setShowSettings(false); }} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', padding: '9px 12px', textAlign: 'left', borderRadius: '8px', cursor: 'pointer', fontSize: '0.875rem' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>Clear Chat</button>
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {messages.map((msg, index) => {
            const isMe = msg.author === username;
            return (
              <div key={msg._id || index} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}
                onMouseEnter={() => setHoveredMsg(msg._id || index)}
                onMouseLeave={() => setHoveredMsg(null)}
              >
                <div style={{ maxWidth: '70%', position: 'relative' }}>
                  {/* Message Bubble */}
                  <div style={{
                    background: isMe ? 'linear-gradient(135deg, var(--primary-accent), var(--secondary-accent))' : 'rgba(255,255,255,0.05)',
                    border: isMe ? 'none' : 'var(--glass-border)',
                    padding: '10px 14px',
                    borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    boxShadow: isMe ? '0 4px 14px var(--primary-glow)' : 'none'
                  }}>
                    {!isMe && <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: '600' }}>{msg.author}</div>}
                    {msg.imageUrl && <img src={msg.imageUrl} alt="attachment" style={{ maxWidth: '240px', borderRadius: '8px', display: 'block', marginBottom: msg.message ? '8px' : 0 }} />}
                    {msg.message && <div style={{ lineHeight: '1.5', color: isMe ? '#fff' : 'var(--text-primary)', wordBreak: 'break-word' }}>{msg.message}</div>}
                    <div style={{ fontSize: '0.62rem', color: isMe ? 'rgba(255,255,255,0.6)' : 'var(--text-secondary)', marginTop: '4px', textAlign: 'right', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '4px' }}>
                      {msg.time} {renderReadReceipt(msg)}
                    </div>
                  </div>

                  {/* Reactions display */}
                  {msg.reactions?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                      {msg.reactions.map((r, i) => (
                        <button key={i} onClick={() => handleReaction(msg._id, r.emoji)} title={r.users.join(', ')} style={{ background: r.users.includes(username) ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '3px 8px', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                          {r.emoji} {r.users.length}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Emoji Picker on hover */}
                  {hoveredMsg === (msg._id || index) && msg._id && (
                    <div style={{ position: 'absolute', [isMe ? 'right' : 'left']: 0, bottom: msg.reactions?.length > 0 ? '32px' : '-4px', background: 'var(--glass-bg)', backdropFilter: 'blur(12px)', border: 'var(--glass-border)', borderRadius: '16px', padding: '6px', display: 'flex', gap: '4px', zIndex: 10 }}>
                      {EMOJIS.map(emoji => (
                        <button key={emoji} onClick={() => handleReaction(msg._id, emoji)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', padding: '4px', borderRadius: '6px', transition: '0.15s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseOut={e => e.currentTarget.style.background = 'none'}>{emoji}</button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {typingUsers.length > 0 && (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
              {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div style={{ padding: '20px 24px', borderTop: 'var(--glass-border)' }}>
          <form onSubmit={sendMessage} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImageUpload} />
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingImage} style={{ background: 'rgba(255,255,255,0.05)', border: 'var(--glass-border)', borderRadius: '12px', width: '46px', height: '46px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: uploadingImage ? 'var(--primary-accent)' : 'var(--text-secondary)', flexShrink: 0 }} title="Upload image">
              <Paperclip size={18} />
            </button>
            <input type="text" className="input-base" placeholder={`Message ${isDM ? dmPartner : '#' + room}`} value={currentMessage} onChange={handleTyping} style={{ padding: '14px 18px', borderRadius: '22px', background: 'rgba(0,0,0,0.2)' }} />
            <button type="submit" className="btn-primary" style={{ width: '50px', height: '50px', borderRadius: '50%', padding: 0, flexShrink: 0 }}>
              <Send size={18} style={{ marginLeft: '3px' }} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Chat;
