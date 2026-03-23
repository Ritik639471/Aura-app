import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { Send, LogOut, Hash, Menu, X, Paperclip, Check, CheckCheck, Smile, Users, Info } from 'lucide-react';
import axios from 'axios';

const SOCKET_URL = 'https://aura-app-keg8.onrender.com';
const API_URL = 'https://aura-app-keg8.onrender.com/api';

const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];
const PICKER_EMOJIS = [
  '😀','😂','😍','🥰','😎','🤔','😢','😡','🔥','❤️',
  '👍','👎','🙌','🎉','✨','💯','🚀','😮','🤩','😴',
  '🫡','💀','👀','😏','🥹','😤','🙄','😬','🤯','💪'
];

const Chat = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [typingUsers, setTypingUsers] = useState([]);
  const [roomUsers, setRoomUsers] = useState([]);
  const [roomMembers, setRoomMembers] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [hoveredMsg, setHoveredMsg] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const msgInputRef = useRef(null);

  const username = localStorage.getItem('username');
  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('userId');
  const room = state?.room;
  const isDM = state?.isDM;
  const dmPartner = state?.dmPartner;

  // Fetch room member details
  useEffect(() => {
    if (!room || !token) return;
    const fetchRoomDetails = async () => {
      try {
        const res = await axios.get(`${API_URL}/rooms`, { headers: { Authorization: `Bearer ${token}` } });
        const currentRoom = res.data.find(r => r.name === room);
        if (currentRoom?.members) setRoomMembers(currentRoom.members);
      } catch (err) { /* silent */ }
    };
    fetchRoomDetails();
  }, [room, token]);

  useEffect(() => {
    if (!token || !username || !room) { navigate('/login'); return; }

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
    newSocket.on('display_typing', data => setTypingUsers(prev => prev.includes(data.username) ? prev : [...prev, data.username]));
    newSocket.on('hide_typing', data => setTypingUsers(prev => prev.filter(u => u !== data.username)));

    return () => {
      newSocket.emit('leave_room', { room, username });
      newSocket.disconnect();
    };
  }, [username, room, navigate, token]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, typingUsers]);

  const handleTyping = e => {
    setCurrentMessage(e.target.value);
    if (socket) {
      socket.emit('typing', { room, username });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => socket.emit('stop_typing', { room, username }), 1000);
    }
  };

  const insertEmoji = emoji => {
    setCurrentMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
    msgInputRef.current?.focus();
  };

  const sendMessage = e => {
    e.preventDefault();
    if (currentMessage.trim() !== '' && socket) {
      const msgData = {
        room, author: username,
        message: currentMessage,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        readBy: [username], reactions: []
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
    // Show local preview immediately
    const localUrl = URL.createObjectURL(file);
    setImagePreview(localUrl);
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('room', room);
      const res = await axios.post(`${API_URL}/upload`, formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      const newMsg = res.data.data;
      // Use broadcast_image to notify others WITHOUT double-saving
      socket?.emit('broadcast_image', newMsg);
      setMessages(prev => [...prev.filter(m => m._localPreview !== localUrl), newMsg]);
    } catch (err) {
      console.error('Image upload failed', err);
      setMessages(prev => prev.filter(m => m._localPreview !== localUrl));
    }
    setUploadingImage(false);
    setImagePreview(null);
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
      ? <CheckCheck size={13} style={{ color: 'var(--primary-accent)' }} title={`Read by ${readCount}`} />
      : <Check size={13} style={{ color: 'rgba(255,255,255,0.5)' }} title="Sent" />;
  };

  const visibleUsers = roomUsers.slice(0, 3);
  const extraCount = roomUsers.length - 3;

  return (
    <div className="chat-wrapper" onClick={() => { setShowSettings(false); setShowEmojiPicker(false); }}>

      {/* Group Info Modal */}
      {showGroupInfo && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setShowGroupInfo(false)}>
          <div className="glass-panel" style={{ padding: '32px', maxWidth: '420px', width: '100%', maxHeight: '80vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontWeight: '700', fontSize: '1.4rem' }}>#{room}</h2>
              <button onClick={() => setShowGroupInfo(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                {isDM ? 'Private Direct Message between 2 users.' : `A public channel. ${roomMembers.length} registered member(s).`}
              </p>
            </div>
            <h3 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)', marginBottom: '12px' }}>Members ({roomMembers.length})</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {roomMembers.map((m, i) => {
                const name = m.username || m;
                const isOnline = roomUsers.includes(name);
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg,var(--primary-accent),var(--secondary-accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700' }}>{name[0]?.toUpperCase()}</div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: '600', fontSize: '0.9rem' }}>{name} {name === username ? '(You)' : ''}</p>
                      <p style={{ fontSize: '0.72rem', color: isOnline ? 'var(--success)' : 'var(--text-secondary)' }}>{isOnline ? '● Online' : '○ Offline'}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div className={`chat-sidebar glass-panel ${isSidebarOpen ? 'open' : ''}`}>
        <div style={{ padding: '24px', borderBottom: 'var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, var(--primary-accent), var(--secondary-accent))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Hash color="white" size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '600' }}>Aura</h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>@{username}</p>
            </div>
          </div>
          <button className="mobile-nav-toggle" onClick={() => setIsSidebarOpen(false)}><X size={20} /></button>
        </div>

        {/* Room Info – clickable for group info */}
        <div style={{ padding: '16px 20px', borderBottom: 'var(--glass-border)' }}>
          <button onClick={() => setShowGroupInfo(true)} style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid var(--primary-accent)', borderRadius: '12px', padding: '12px 14px', width: '100%', textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.95rem' }}>#{isDM ? dmPartner : room}</p>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{roomMembers.length} members · {roomUsers.length} online</p>
            </div>
            <Info size={16} color="var(--primary-accent)" />
          </button>
        </div>

        {/* Online Users — show first 3 + count */}
        <div style={{ flex: 1, padding: '16px 20px', overflowY: 'auto' }}>
          <h3 style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)', marginBottom: '10px' }}>Online Now</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
            {visibleUsers.map((user, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '10px', background: user === username ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.03)', border: user === username ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg,var(--primary-accent),var(--secondary-accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '700', flexShrink: 0 }}>{user[0]?.toUpperCase()}</div>
                <span style={{ fontSize: '0.85rem', fontWeight: '500', color: user === username ? 'var(--primary-accent)' : 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user}{user === username ? ' (You)' : ''}</span>
              </div>
            ))}
            {extraCount > 0 && (
              <button onClick={() => setShowGroupInfo(true)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.8rem', textAlign: 'left', cursor: 'pointer', padding: '4px 10px' }}>
                +{extraCount} more online
              </button>
            )}
            {roomUsers.length === 0 && <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>No users online</p>}
          </div>
        </div>

        <div style={{ padding: '16px 20px', borderTop: 'var(--glass-border)' }}>
          <button onClick={() => navigate('/rooms')} style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.2)', width: '100%', padding: '11px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', fontWeight: '500' }}>
            <LogOut size={16} /> Leave Room
          </button>
        </div>
      </div>

      {/* Main Chat */}
      <div className="chat-main glass-panel" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: '16px 24px', borderBottom: 'var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="mobile-nav-toggle" onClick={() => setIsSidebarOpen(true)}><Menu size={22} /></button>
            <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} onClick={() => setShowGroupInfo(true)}>
              <Hash size={20} color="var(--primary-accent)" />
            </div>
            <div style={{ cursor: 'pointer' }} onClick={() => setShowGroupInfo(true)}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: '600' }}>{isDM ? dmPartner : room}</h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: 'var(--success)' }}>●</span>
                {roomUsers.length} online · {roomMembers.length} members — <span style={{ color: 'var(--primary-accent)', textDecoration: 'underline' }}>View details</span>
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button onClick={() => setShowGroupInfo(true)} style={{ background: 'rgba(255,255,255,0.05)', border: 'var(--glass-border)', borderRadius: '10px', padding: '8px', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Users size={16} /> <span style={{ fontSize: '0.8rem' }}>{roomUsers.length}</span>
            </button>
            <div style={{ position: 'relative' }}>
              <button onClick={e => { e.stopPropagation(); setShowSettings(!showSettings); }} style={{ background: 'none', border: 'none', color: 'var(--primary-accent)', cursor: 'pointer', padding: '6px', fontSize: '1.2rem' }}>•••</button>
              {showSettings && (
                <div className="glass-panel" style={{ position: 'absolute', top: '40px', right: 0, width: '180px', padding: '8px', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '4px' }} onClick={e => e.stopPropagation()}>
                  <button onClick={() => { setMessages([]); setShowSettings(false); }} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', padding: '9px 12px', textAlign: 'left', borderRadius: '8px', cursor: 'pointer', fontSize: '0.875rem' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>Clear Chat</button>
                  <button onClick={() => { setShowGroupInfo(true); setShowSettings(false); }} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', padding: '9px 12px', textAlign: 'left', borderRadius: '8px', cursor: 'pointer', fontSize: '0.875rem' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>Group Info</button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {messages.map((msg, index) => {
            const isMe = msg.author === username;
            const msgKey = msg._id || index;
            return (
              <div key={msgKey} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}
                onMouseEnter={() => setHoveredMsg(msgKey)}
                onMouseLeave={() => setHoveredMsg(null)}
              >
                <div style={{ maxWidth: '70%', position: 'relative' }}>
                  <div style={{
                    background: isMe ? 'linear-gradient(135deg, var(--primary-accent), var(--secondary-accent))' : 'rgba(255,255,255,0.05)',
                    border: isMe ? 'none' : 'var(--glass-border)',
                    padding: '10px 14px', borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    boxShadow: isMe ? '0 4px 14px var(--primary-glow)' : 'none'
                  }}>
                    {!isMe && <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: '600' }}>{msg.author}</div>}
                    {msg.imageUrl && (
                      <a href={msg.imageUrl} target="_blank" rel="noopener noreferrer">
                        <img src={msg.imageUrl} alt="attachment" style={{ maxWidth: '240px', maxHeight: '200px', objectFit: 'cover', borderRadius: '8px', display: 'block', marginBottom: msg.message ? '8px' : 0, cursor: 'pointer' }} />
                      </a>
                    )}
                    {msg._localPreview && !msg.imageUrl && (
                      <div style={{ position: 'relative', display: 'inline-block' }}>
                        <img src={msg._localPreview} alt="uploading..." style={{ maxWidth: '200px', borderRadius: '8px', opacity: 0.5 }} />
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', color: '#fff' }}>Uploading…</div>
                      </div>
                    )}
                    {msg.message && <div style={{ lineHeight: '1.5', color: isMe ? '#fff' : 'var(--text-primary)', wordBreak: 'break-word' }}>{msg.message}</div>}
                    <div style={{ fontSize: '0.62rem', color: isMe ? 'rgba(255,255,255,0.6)' : 'var(--text-secondary)', marginTop: '4px', textAlign: 'right', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '4px' }}>
                      {msg.time} {renderReadReceipt(msg)}
                    </div>
                  </div>

                  {msg.reactions?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                      {msg.reactions.map((r, i) => (
                        <button key={i} onClick={() => handleReaction(msg._id, r.emoji)} style={{ background: r.users.includes(username) ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '3px 8px', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                          {r.emoji} {r.users.length}
                        </button>
                      ))}
                    </div>
                  )}

                  {hoveredMsg === msgKey && msg._id && (
                    <div style={{ position: 'absolute', [isMe ? 'right' : 'left']: 0, bottom: msg.reactions?.length > 0 ? '32px' : '-4px', background: 'var(--glass-bg)', backdropFilter: 'blur(12px)', border: 'var(--glass-border)', borderRadius: '16px', padding: '6px', display: 'flex', gap: '4px', zIndex: 10 }}>
                      {REACTION_EMOJIS.map(emoji => (
                        <button key={emoji} onClick={() => handleReaction(msg._id, emoji)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', padding: '4px', borderRadius: '6px' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseOut={e => e.currentTarget.style.background = 'none'}>{emoji}</button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Uploading preview */}
          {uploadingImage && imagePreview && (
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <div style={{ maxWidth: '200px', opacity: 0.6, background: 'rgba(99,102,241,0.2)', borderRadius: '12px', padding: '8px' }}>
                <img src={imagePreview} alt="uploading" style={{ maxWidth: '100%', borderRadius: '8px' }} />
                <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '4px' }}>Uploading…</p>
              </div>
            </div>
          )}

          {typingUsers.length > 0 && (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
              {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div style={{ padding: '16px 24px', borderTop: 'var(--glass-border)', position: 'relative' }}>

          {/* Emoji Picker */}
          {showEmojiPicker && (
            <div className="glass-panel" style={{ position: 'absolute', bottom: '80px', left: '24px', padding: '12px', borderRadius: '16px', display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: '4px', zIndex: 20, width: '320px' }} onClick={e => e.stopPropagation()}>
              {PICKER_EMOJIS.map(emoji => (
                <button key={emoji} onClick={() => insertEmoji(emoji)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.3rem', padding: '5px', borderRadius: '6px', textAlign: 'center' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseOut={e => e.currentTarget.style.background = 'none'}>{emoji}</button>
              ))}
            </div>
          )}

          <form onSubmit={sendMessage} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImageUpload} />

            <button type="button" onClick={e => { e.stopPropagation(); setShowEmojiPicker(!showEmojiPicker); }} style={{ background: 'rgba(255,255,255,0.05)', border: 'var(--glass-border)', borderRadius: '12px', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: showEmojiPicker ? 'var(--primary-accent)' : 'var(--text-secondary)', flexShrink: 0 }} title="Emoji">
              <Smile size={18} />
            </button>
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingImage} style={{ background: 'rgba(255,255,255,0.05)', border: 'var(--glass-border)', borderRadius: '12px', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: uploadingImage ? 'var(--primary-accent)' : 'var(--text-secondary)', flexShrink: 0 }} title="Upload image">
              <Paperclip size={18} />
            </button>
            <input ref={msgInputRef} type="text" className="input-base" placeholder={`Message ${isDM ? dmPartner : '#' + room}`} value={currentMessage} onChange={handleTyping} style={{ padding: '13px 18px', borderRadius: '22px', background: 'rgba(0,0,0,0.2)' }} />
            <button type="submit" className="btn-primary" style={{ width: '48px', height: '48px', borderRadius: '50%', padding: 0, flexShrink: 0 }}>
              <Send size={18} style={{ marginLeft: '3px' }} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Chat;
