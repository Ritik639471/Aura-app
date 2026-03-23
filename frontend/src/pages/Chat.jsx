import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { Send, Menu, Paperclip, Smile, Search, X, Pin } from 'lucide-react';
import axios from 'axios';

import MessageBubble from '../components/MessageBubble';
import ChatSidebar from '../components/ChatSidebar';
import GroupInfoModal from '../components/GroupInfoModal';
import EmojiPicker from '../components/EmojiPicker';

const SOCKET_URL = 'https://aura-app-keg8.onrender.com';
const API_URL = 'https://aura-app-keg8.onrender.com/api';

const Chat = () => {
  const { state } = useLocation();
  const navigate = useNavigate();

  // Auth / room context
  const username = localStorage.getItem('username');
  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('userId');
  const room = state?.room;
  const isDM = state?.isDM;
  const dmPartner = state?.dmPartner;

  // Socket & messages
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [typingUsers, setTypingUsers] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  // Room presence
  const [roomUsers, setRoomUsers] = useState([]);
  const [roomMembers, setRoomMembers] = useState([]);
  const [roomId, setRoomId] = useState(null);
  const [roomAdmins, setRoomAdmins] = useState([]);
  const [roomCreatorId, setRoomCreatorId] = useState(null);

  // UI state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showPinned, setShowPinned] = useState(false);

  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const msgInputRef = useRef(null);

  // Derived permissions
  const isPowerUser = roomAdmins.includes(userId) || roomCreatorId === userId;

  // ------ Effects ------
  useEffect(() => {
    if (!token || !username || !room) { navigate('/login'); return; }
    fetchHistory();
    fetchRoomDetails();
    fetchPinned();

    const s = io(SOCKET_URL);
    setSocket(s);
    s.emit('join_room', { room, username });
    s.emit('mark_read', { room, username });

    s.on('room_users', users => setRoomUsers(users));
    s.on('receive_message', data => { setMessages(prev => [...prev, data]); s.emit('mark_read', { room, username }); });
    s.on('reaction_updated', ({ messageId, reactions }) => setMessages(prev => prev.map(m => m._id === messageId ? { ...m, reactions } : m)));
    s.on('messages_read', ({ username: reader }) => setMessages(prev => prev.map(m => ({ ...m, readBy: m.readBy?.includes(reader) ? m.readBy : [...(m.readBy || []), reader] }))));
    s.on('display_typing', data => setTypingUsers(prev => prev.includes(data.username) ? prev : [...prev, data.username]));
    s.on('hide_typing', data => setTypingUsers(prev => prev.filter(u => u !== data.username)));
    s.on('message_edited', ({ messageId, message }) => setMessages(prev => prev.map(m => m._id === messageId ? { ...m, message, edited: true } : m)));
    s.on('message_deleted', ({ messageId }) => setMessages(prev => prev.map(m => m._id === messageId ? { ...m, deletedAt: new Date() } : m)));
    s.on('message_pinned', ({ messageId, pinned }) => { setMessages(prev => prev.map(m => m._id === messageId ? { ...m, pinned } : m)); fetchPinned(); });
    s.on('room_cleared', () => setMessages([]));

    return () => { s.emit('leave_room', { room, username }); s.disconnect(); };
  }, [username, room, token]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, typingUsers]);

  // ------ API ------
  const fetchHistory = async () => {
    try { const r = await axios.get(`${API_URL}/messages/${room}`, { headers: { Authorization: `Bearer ${token}` } }); setMessages(r.data); }
    catch (e) { console.error(e); }
  };

  const fetchPinned = async () => {
    try { const r = await axios.get(`${API_URL}/messages/${room}/pinned`, { headers: { Authorization: `Bearer ${token}` } }); setPinnedMessages(r.data); }
    catch (e) { /* silent */ }
  };

  const fetchRoomDetails = async () => {
    try {
      const r = await axios.get(`${API_URL}/rooms`, { headers: { Authorization: `Bearer ${token}` } });
      const cur = r.data.find(rm => rm.name === room);
      if (!cur) return;
      setRoomId(cur._id);
      setRoomCreatorId(cur.creator?._id || cur.creator);
      const adminIds = (cur.admins || []).map(a => a._id || a);
      setRoomAdmins(adminIds);
      const creatorId = cur.creator?._id || cur.creator;
      const members = (cur.members || []).map(m => ({
        ...m,
        _isCreator: (m._id || m) === creatorId,
        _isAdmin: adminIds.includes(m._id || m),
        _canManage: (userId === creatorId)
      }));
      setRoomMembers(members);
    } catch (e) { /* silent */ }
  };

  // ------ Handlers ------
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
    if (!currentMessage.trim() || !socket) return;
    const msgData = { room, author: username, message: currentMessage, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), readBy: [username], reactions: [] };
    socket.emit('send_message', msgData);
    setMessages(prev => [...prev, msgData]);
    setCurrentMessage('');
    socket.emit('stop_typing', { room, username });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  };

  const handleImageUpload = async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImagePreview(URL.createObjectURL(file));
    setUploadingImage(true);
    try {
      const fd = new FormData();
      fd.append('image', file); fd.append('room', room);
      const res = await axios.post(`${API_URL}/upload`, fd, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } });
      const msg = res.data.data;
      socket?.emit('broadcast_image', msg);
      setMessages(prev => [...prev, msg]);
    } catch (err) { console.error(err); }
    setUploadingImage(false); setImagePreview(null); e.target.value = '';
  };

  const handleReact = (messageId, emoji) => socket?.emit('toggle_reaction', { messageId, emoji, username });

  const handleEdit = async (messageId, newText, msgRoom) => {
    try {
      await axios.put(`${API_URL}/messages/${messageId}`, { message: newText }, { headers: { Authorization: `Bearer ${token}` } });
      setMessages(prev => prev.map(m => m._id === messageId ? { ...m, message: newText, edited: true } : m));
      socket?.emit('message_edited', { messageId, message: newText, room: msgRoom });
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (messageId, msgRoom) => {
    try {
      await axios.delete(`${API_URL}/messages/${messageId}`, { headers: { Authorization: `Bearer ${token}` } });
      setMessages(prev => prev.map(m => m._id === messageId ? { ...m, deletedAt: new Date() } : m));
      socket?.emit('message_deleted', { messageId, room: msgRoom });
    } catch (err) { console.error(err); }
  };

  const handlePin = async (messageId) => {
    try {
      const res = await axios.post(`${API_URL}/messages/${messageId}/pin`, {}, { headers: { Authorization: `Bearer ${token}` } });
      const updated = res.data;
      setMessages(prev => prev.map(m => m._id === messageId ? { ...m, pinned: updated.pinned } : m));
      socket?.emit('message_pinned', { messageId, pinned: updated.pinned, room });
      fetchPinned();
    } catch (err) { console.error(err); }
  };

  const handleClearChat = async () => {
    try {
      await axios.delete(`${API_URL}/messages/room/${room}/clear`, { headers: { Authorization: `Bearer ${token}` } });
      setMessages([]);
      socket?.emit('room_cleared', { room });
    } catch (err) { console.error(err); }
  };

  const handleMakeAdmin = async (targetUserId, isCurrentlyAdmin) => {
    if (!roomId) return;
    try {
      if (isCurrentlyAdmin) {
        await axios.delete(`${API_URL}/rooms/${roomId}/remove-admin`, { data: { userId: targetUserId }, headers: { Authorization: `Bearer ${token}` } });
      } else {
        await axios.post(`${API_URL}/rooms/${roomId}/make-admin`, { userId: targetUserId }, { headers: { Authorization: `Bearer ${token}` } });
      }
      fetchRoomDetails();
    } catch (err) { console.error(err); }
  };

  // Filtered messages for search
  const displayedMessages = searchQuery
    ? messages.filter(m => m.message?.toLowerCase().includes(searchQuery.toLowerCase()) || m.author?.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  return (
    <div className="chat-wrapper" onClick={() => { setShowEmojiPicker(false); }}>

      {showGroupInfo && (
        <GroupInfoModal room={room} roomMembers={roomMembers} roomUsers={roomUsers} username={username} userId={userId} token={token} isDM={isDM} dmPartner={dmPartner} onClose={() => setShowGroupInfo(false)} onMakeAdmin={handleMakeAdmin} />
      )}

      <ChatSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} username={username} room={room} isDM={isDM} dmPartner={dmPartner} roomUsers={roomUsers} roomMembers={roomMembers} onGroupInfo={() => setShowGroupInfo(true)} />

      {/* Main */}
      <div className="chat-main glass-panel" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: '14px 20px', borderBottom: 'var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <button className="mobile-nav-toggle" onClick={() => setIsSidebarOpen(true)}><Menu size={22} /></button>
            <div style={{ cursor: 'pointer', minWidth: 0 }} onClick={() => setShowGroupInfo(true)}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{isDM ? dmPartner : `#${room}`}</h2>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                <span style={{ color: 'var(--success)' }}>●</span> {roomUsers.length} online · {roomMembers.length} members
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
            {pinnedMessages.length > 0 && (
              <button onClick={() => setShowPinned(!showPinned)} style={{ background: showPinned ? 'rgba(255,215,0,0.2)' : 'rgba(255,255,255,0.05)', border: 'var(--glass-border)', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', color: '#FFD700', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                📌 {pinnedMessages.length}
              </button>
            )}
            <button onClick={e => { e.stopPropagation(); setIsSearchOpen(!isSearchOpen); setSearchQuery(''); }} style={{ background: isSearchOpen ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)', border: 'var(--glass-border)', borderRadius: '8px', padding: '7px', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex' }}>
              <Search size={16} />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        {isSearchOpen && (
          <div style={{ padding: '10px 20px', borderBottom: 'var(--glass-border)', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Search size={15} color="var(--text-secondary)" />
            <input autoFocus value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search messages..." style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', fontSize: '0.9rem' }} />
            {searchQuery && <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{displayedMessages.length} result(s)</span>}
            <button onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={16} /></button>
          </div>
        )}

        {/* Pinned Messages Panel */}
        {showPinned && pinnedMessages.length > 0 && (
          <div style={{ background: 'rgba(255,215,0,0.05)', borderBottom: '1px solid rgba(255,215,0,0.2)', padding: '10px 20px' }}>
            <p style={{ fontSize: '0.72rem', color: '#FFD700', marginBottom: '8px', fontWeight: '600' }}>📌 PINNED MESSAGES</p>
            {pinnedMessages.map((pm, i) => (
              <div key={i} style={{ fontSize: '0.85rem', color: 'var(--text-primary)', padding: '4px 0', borderBottom: i < pinnedMessages.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.72rem' }}>{pm.author}: </span>{pm.message || '[image]'}
              </div>
            ))}
          </div>
        )}

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {displayedMessages.length === 0 && searchQuery && (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '40px' }}>No messages match "{searchQuery}"</p>
          )}
          {displayedMessages.map((msg, index) => (
            <MessageBubble key={msg._id || index} msg={msg} username={username} isHighlighted={!!searchQuery} onReact={handleReact} onEdit={handleEdit} onDelete={handleDelete} onPin={handlePin} isPowerUser={isPowerUser} searchQuery={searchQuery} />
          ))}
          {uploadingImage && imagePreview && (
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <div style={{ maxWidth: '160px', opacity: 0.6, background: 'rgba(99,102,241,0.2)', borderRadius: '12px', padding: '8px', textAlign: 'center' }}>
                <img src={imagePreview} alt="uploading" style={{ maxWidth: '100%', borderRadius: '8px' }} />
                <p style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Uploading…</p>
              </div>
            </div>
          )}
          {typingUsers.length > 0 && (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
              {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
            </p>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Admin clear bar */}
        {isPowerUser && (
          <div style={{ padding: '6px 20px', borderTop: '1px solid rgba(255,215,0,0.1)', background: 'rgba(255,215,0,0.03)', display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={handleClearChat} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--danger)', borderRadius: '8px', padding: '4px 12px', cursor: 'pointer', fontSize: '0.75rem' }}>🗑️ Clear Chat (Admin)</button>
          </div>
        )}

        {/* Input */}
        <div style={{ padding: '14px 20px', borderTop: 'var(--glass-border)', position: 'relative' }}>
          {showEmojiPicker && (
            <EmojiPicker onSelect={emoji => { setCurrentMessage(p => p + emoji); setShowEmojiPicker(false); msgInputRef.current?.focus(); }} onClose={() => setShowEmojiPicker(false)} />
          )}
          <form onSubmit={sendMessage} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImageUpload} />
            <button type="button" onClick={e => { e.stopPropagation(); setShowEmojiPicker(!showEmojiPicker); }} style={{ background: showEmojiPicker ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)', border: 'var(--glass-border)', borderRadius: '11px', width: '42px', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: showEmojiPicker ? 'var(--primary-accent)' : 'var(--text-secondary)', flexShrink: 0 }}>
              <Smile size={17} />
            </button>
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingImage} style={{ background: 'rgba(255,255,255,0.05)', border: 'var(--glass-border)', borderRadius: '11px', width: '42px', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: uploadingImage ? 'var(--primary-accent)' : 'var(--text-secondary)', flexShrink: 0 }}>
              <Paperclip size={17} />
            </button>
            <input ref={msgInputRef} type="text" className="input-base" placeholder={`Message ${isDM ? dmPartner : '#' + room}`} value={currentMessage} onChange={handleTyping} style={{ padding: '12px 16px', borderRadius: '20px', background: 'rgba(0,0,0,0.2)' }} />
            <button type="submit" className="btn-primary" style={{ width: '46px', height: '46px', borderRadius: '50%', padding: 0, flexShrink: 0 }}>
              <Send size={17} style={{ marginLeft: '2px' }} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Chat;
