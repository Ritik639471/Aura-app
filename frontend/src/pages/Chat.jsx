import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { Send, Paperclip, Smile, Search, X, Pin, ChevronDown, Trash2, User, Reply as ReplyIcon } from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

import MessageBubble from '../components/MessageBubble';
import MemberPanel from '../components/MemberPanel';
import GroupInfoModal from '../components/GroupInfoModal';
import EmojiPicker from '../components/EmojiPicker';
import { cn } from '../utils/cn';
import { API_URL, SOCKET_URL } from '../config';

const Chat = () => {
  const { state } = useLocation();
  const { roomName } = useParams();
  const navigate = useNavigate();

  const username = localStorage.getItem('username');
  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('userId');
  const room = roomName || state?.room;
  
  const [isDM, setIsDM] = useState(state?.isDM || false);
  const [dmPartner, setDmPartner] = useState(state?.dmPartner || null);

  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [typingUsers, setTypingUsers] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [replyToMessage, setReplyToMessage] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showPinned, setShowPinned] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [isMemberPanelOpen, setIsMemberPanelOpen] = useState(true);

  const [roomUsers, setRoomUsers] = useState([]);
  const [roomMembers, setRoomMembers] = useState([]);
  const [roomId, setRoomId] = useState(null);
  const [roomAdmins, setRoomAdmins] = useState([]);
  const [roomCreatorId, setRoomCreatorId] = useState(null);

  const [unreadCount, setUnreadCount] = useState(0);
  const notificationSound = useRef(new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3'));

  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const msgInputRef = useRef(null);

  const isPowerUser = roomAdmins.includes(userId) || roomCreatorId === userId;

  useEffect(() => {
    if (!token || !username || !room) { 
      if (!token || !username) navigate('/login');
      else navigate('/rooms');
      return; 
    }
    
    setMessages([]);
    setRoomUsers([]);
    setRoomMembers([]);
    setRoomId(null);
    setReplyToMessage(null);

    fetchHistory();
    fetchRoomDetails();
    fetchPinned();

    const s = io(SOCKET_URL);
    setSocket(s);
    s.emit('join_room', { room, username });

    s.on('room_users', users => setRoomUsers(users));
    s.on('receive_message', data => { 
      setMessages(prev => [...prev, data]); 
      s.emit('mark_read', { room, username }); 
      
      if (data.author !== username) {
        if (showScrollBottom) {
          setUnreadCount(prev => prev + 1);
        }
        notificationSound.current.play().catch(() => {});
      }
    });
    
    s.on('messages_read', ({ username: reader, room: readRoom }) => {
      if (readRoom === room) {
        setMessages(prev => prev.map(m => {
          if (!m.readBy?.includes(reader)) {
            return { ...m, readBy: [...(m.readBy || []), reader] };
          }
          return m;
        }));
      }
    });

    s.on('reaction_updated', ({ messageId, reactions }) => setMessages(prev => prev.map(m => m._id === messageId ? { ...m, reactions } : m)));
    s.on('message_edited', ({ messageId, message }) => setMessages(prev => prev.map(m => m._id === messageId ? { ...m, message, edited: true } : m)));
    s.on('message_deleted', ({ messageId }) => setMessages(prev => prev.map(m => m._id === messageId ? { ...m, deletedAt: new Date() } : m)));
    s.on('message_pinned', ({ messageId, pinned }) => { setMessages(prev => prev.map(m => m._id === messageId ? { ...m, pinned } : m)); fetchPinned(); });
    s.on('display_typing', data => setTypingUsers(prev => prev.includes(data.username) ? prev : [...prev, data.username]));
    s.on('hide_typing', data => setTypingUsers(prev => prev.filter(u => u !== data.username)));
    s.on('room_cleared', () => setMessages([]));

    return () => { s.emit('leave_room', { room, username }); s.disconnect(); };
  }, [username, room, token, navigate]);

  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
    setUnreadCount(0);
  };

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 80;
    setShowScrollBottom(!isAtBottom);
  };

  const fetchHistory = async () => {
    try { 
      const r = await axios.get(`${API_URL}/messages/${room}`, { headers: { Authorization: `Bearer ${token}` } }); 
      setMessages(r.data); 
      setTimeout(() => scrollToBottom('auto'), 50);
    } catch (e) {}
  };

  const fetchPinned = async () => {
    try { 
      const r = await axios.get(`${API_URL}/messages/${room}/pinned`, { headers: { Authorization: `Bearer ${token}` } }); 
      setPinnedMessages(r.data); 
    } catch (e) {}
  };

  const fetchRoomDetails = async () => {
    try {
      const r = await axios.get(`${API_URL}/rooms`, { headers: { Authorization: `Bearer ${token}` } });
      const cur = r.data.find(rm => rm.name === room);
      if (!cur) return;
      
      if (cur.isDirectMessage || room?.startsWith('dm-')) {
        setIsDM(true);
        const partner = cur.members?.find(m => (m._id || m) !== userId && m.username !== username);
        if (partner) setDmPartner(partner.username);
      } else {
        setIsDM(false);
      }

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
    } catch (e) {}
  };

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
    
    const myMember = roomMembers.find(m => m.username === username);
    const myAvatar = myMember?.avatar || null;

    const msgData = { 
      room, 
      author: username, 
      authorAvatar: myAvatar,
      message: currentMessage, 
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), 
      readBy: [username], 
      reactions: [],
      replyTo: replyToMessage ? replyToMessage._id : null,
      replyMessage: replyToMessage ? { author: replyToMessage.author, message: replyToMessage.message, image: replyToMessage.image } : null
    };
    
    socket.emit('send_message', msgData);
    setMessages(prev => [...prev, msgData]);
    setCurrentMessage('');
    setReplyToMessage(null);
    scrollToBottom();
  };

  const handleImageUpload = async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImagePreview(URL.createObjectURL(file));
    setUploadingImage(true);
    try {
      const fd = new FormData();
      fd.append('image', file); 
      fd.append('room', room);
      if (replyToMessage) {
        fd.append('replyTo', replyToMessage._id);
        fd.append('replyMessage', JSON.stringify({ author: replyToMessage.author, message: replyToMessage.message, image: replyToMessage.imageUrl }));
      }
      
      const res = await axios.post(`${API_URL}/upload`, fd, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } });
      const imgData = {
        ...res.data.data,
        replyTo: replyToMessage ? replyToMessage._id : null,
        replyMessage: replyToMessage ? { author: replyToMessage.author, message: replyToMessage.message, image: replyToMessage.image } : null
      };
      
      socket?.emit('broadcast_image', imgData);
      setMessages(prev => [...prev, imgData]);
      setReplyToMessage(null);
    } catch (err) {}
    setUploadingImage(false); 
    setImagePreview(null);
  };

  const handleReact = (messageId, emoji) => socket?.emit('toggle_reaction', { messageId, emoji, username });

  const handleEdit = async (messageId, newText, msgRoom) => {
    try {
      await axios.put(`${API_URL}/messages/${messageId}`, { message: newText }, { headers: { Authorization: `Bearer ${token}` } });
      setMessages(prev => prev.map(m => m._id === messageId ? { ...m, message: newText, edited: true } : m));
      socket?.emit('message_edited', { messageId, message: newText, room: msgRoom });
    } catch (err) {}
  };

  const handleDelete = async (messageId, msgRoom) => {
    try {
      await axios.delete(`${API_URL}/messages/${messageId}`, { headers: { Authorization: `Bearer ${token}` } });
      setMessages(prev => prev.map(m => m._id === messageId ? { ...m, deletedAt: new Date() } : m));
      socket?.emit('message_deleted', { messageId, room: msgRoom });
    } catch (err) {}
  };

  const handlePin = async (messageId) => {
    try {
      const res = await axios.post(`${API_URL}/messages/${messageId}/pin`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setMessages(prev => prev.map(m => m._id === messageId ? { ...m, pinned: res.data.pinned } : m));
      socket?.emit('message_pinned', { messageId, pinned: res.data.pinned, room });
      fetchPinned();
    } catch (err) {}
  };

  const handleClearChat = async () => {
    if (window.confirm('Are you sure you want to clear all messages?')) {
      try {
        await axios.delete(`${API_URL}/messages/room/${room}/clear`, { headers: { Authorization: `Bearer ${token}` } });
        setMessages([]);
        socket?.emit('room_cleared', { room });
      } catch (err) {}
    }
  };

  const handleReply = (msg) => {
    setReplyToMessage(msg);
    msgInputRef.current?.focus();
  };

  const filteredMessages = searchQuery
    ? messages.filter(m => m.message?.toLowerCase().includes(searchQuery.toLowerCase()) || m.author?.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden bg-slate-950" onClick={() => setShowEmojiPicker(false)}>
      <AnimatePresence>
        {showGroupInfo && (
          <GroupInfoModal 
            room={room} roomMembers={roomMembers} roomUsers={roomUsers} 
            username={username} userId={userId} token={token} isDM={isDM} 
            dmPartner={dmPartner} onClose={() => setShowGroupInfo(false)} 
            onMakeAdmin={() => fetchRoomDetails()} 
          />
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0 bg-transparent relative">
        <div className="h-16 border-b border-white/5 flex justify-between items-center px-6 bg-slate-900/60 backdrop-blur-xl z-30 shrink-0 shadow-lg">
          <div className="flex items-center gap-3 min-w-0">
            <div className="cursor-pointer min-w-0 group" onClick={() => setShowGroupInfo(true)}>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight text-white group-hover:text-brand-400 transition-colors truncate">
                  {isDM ? dmPartner : `#${room}`}
                </h2>
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5 leading-none mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> 
                {roomUsers.length} online
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <button 
                onClick={() => { setIsSearchOpen(!isSearchOpen); setSearchQuery(''); }}
                className={cn(
                  "p-2 rounded-xl transition-all",
                  isSearchOpen ? "bg-brand-500/20 text-brand-400" : "text-slate-500 hover:text-white hover:bg-white/5"
                )}
              >
                <Search size={20} />
              </button>
              {pinnedMessages.length > 0 && (
                <button 
                  onClick={() => setShowPinned(!showPinned)} 
                  className={cn(
                    "p-2 rounded-xl transition-all",
                    showPinned ? "bg-yellow-400/20 text-yellow-500" : "text-slate-500 hover:text-white hover:bg-white/5"
                  )}
                >
                  <Pin size={20} />
                </button>
              )}
              {isPowerUser && (
                <button onClick={handleClearChat} className="p-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all" title="Clear Chat">
                  <Trash2 size={20} />
                </button>
              )}
            </div>

            <div className="w-[1px] h-6 bg-white/5 mx-1" />

            <button 
              onClick={() => setIsMemberPanelOpen(!isMemberPanelOpen)}
              className={cn(
                "p-2 rounded-xl transition-all",
                isMemberPanelOpen ? "bg-brand-500/20 text-brand-400" : "text-slate-500 hover:text-white hover:bg-white/5"
              )}
            >
              <User size={22} />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isSearchOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-5 py-3 border-b border-white/10 bg-brand-500/5 flex items-center gap-3"
            >
              <Search size={16} className="text-brand-400" />
              <input 
                autoFocus 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)} 
                placeholder="Search history..." 
                className="bg-transparent border-none outline-none text-sm text-white flex-1"
              />
              <span className="text-[10px] font-bold text-slate-500 uppercase">{filteredMessages.length} results</span>
              <button onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }} className="text-slate-500 hover:text-white"><X size={16} /></button>
            </motion.div>
          )}

          {showPinned && pinnedMessages.length > 0 && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-5 py-3 border-b border-yellow-500/20 bg-yellow-500/5 flex flex-col gap-2 max-h-32 overflow-y-auto"
            >
              <p className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">Pinned Messages</p>
              {pinnedMessages.map((pm, i) => (
                <div key={i} className="text-xs text-slate-300 flex gap-2">
                  <span className="font-bold text-yellow-500/70">{pm.author}:</span>
                  <span className="line-clamp-1 italic">{pm.message || '[Image]'}</span>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div 
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 min-h-0 overflow-y-auto px-5 py-6 flex flex-col gap-2 custom-scrollbar scroll-smooth bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed"
        >
          <div className="flex-1" /> 
          
          {filteredMessages.length === 0 && searchQuery && (
            <div className="py-20 text-center text-slate-500 italic">No search results for "{searchQuery}"</div>
          )}
          
          <AnimatePresence initial={false}>
            {filteredMessages.map((msg, idx) => (
              <MessageBubble 
                key={msg._id || idx} 
                msg={msg} 
                username={username} 
                isHighlighted={!!searchQuery} 
                onReact={handleReact} 
                onEdit={handleEdit} 
                onDelete={handleDelete} 
                onPin={handlePin} 
                onReply={handleReply}
                onImageClick={(imgUrl) => setSelectedImage(imgUrl)}
                isPowerUser={isPowerUser} 
                searchQuery={searchQuery}
                roomUsers={roomUsers}
                roomMembers={roomMembers}
              />
            ))}
          </AnimatePresence>

          {uploadingImage && imagePreview && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end mb-4">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-2 opacity-50 relative overflow-hidden">
                <img src={imagePreview} className="max-w-[150px] rounded-xl" alt="uploading" />
                <div className="absolute inset-x-0 bottom-0 h-1 bg-brand-500 animate-[loading_2s_infinite]" />
              </div>
            </motion.div>
          )}

          {typingUsers.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 mb-4 ml-2">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce" />
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic font-sans">
                {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
              </span>
            </motion.div>
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>

        <AnimatePresence>
          {showScrollBottom && (
            <motion.button
              initial={{ opacity: 0, scale: 0.5, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.5, y: 10 }}
              onClick={() => scrollToBottom()}
              className="absolute bottom-24 right-8 bg-brand-600 text-white p-3 rounded-full shadow-2xl z-40 hover:bg-brand-500 active:scale-95 transition-all border border-white/20 flex flex-col items-center"
            >
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-900 shadow-lg">
                  {unreadCount}
                </span>
              )}
              <ChevronDown size={24} />
            </motion.button>
          )}
        </AnimatePresence>

        <div className="p-4 bg-slate-900/80 backdrop-blur-xl border-t border-white/10 relative z-30 shrink-0">
          <AnimatePresence>
            {showEmojiPicker && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-full left-4 mb-4 z-50 shadow-2xl"
              >
                <EmojiPicker onSelect={emoji => { setCurrentMessage(p => p + emoji); setShowEmojiPicker(false); msgInputRef.current?.focus(); }} onClose={() => setShowEmojiPicker(false)} />
              </motion.div>
            )}
          </AnimatePresence>

          {replyToMessage && (
            <motion.div 
              initial={{ opacity: 0, y: 10, height: 0 }} 
              animate={{ opacity: 1, y: 0, height: 'auto' }} 
              exit={{ opacity: 0, y: 10, height: 0 }}
              className="flex items-center justify-between bg-brand-500/10 border-l-2 border-brand-500 p-2 px-4 rounded-t-xl mb-1 -mt-2"
            >
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-brand-400 flex items-center gap-1">
                  <ReplyIcon size={12} /> Replying to {replyToMessage.author}
                </span>
                <span className="text-sm text-slate-300 truncate">
                  {replyToMessage.message || (replyToMessage.image ? '📷 Image' : 'Message')}
                </span>
              </div>
              <button onClick={() => setReplyToMessage(null)} className="p-1 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors">
                <X size={16} />
              </button>
            </motion.div>
          )}

          <form onSubmit={sendMessage} className={cn("flex gap-2 items-center bg-slate-950 p-2 rounded-2xl border transition-colors", replyToMessage ? "rounded-t-none border-brand-500/30" : "border-white/10 focus-within:border-brand-500/50")}>
            <button 
              type="button" 
              onClick={e => { e.stopPropagation(); setShowEmojiPicker(!showEmojiPicker); }}
              className={cn(
                "p-3 rounded-xl transition-colors",
                showEmojiPicker ? "bg-brand-500/20 text-brand-400" : "text-slate-400 hover:text-white hover:bg-white/5"
              )}
            >
              <Smile size={20} />
            </button>
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()}
              className="p-3 text-slate-400 hover:text-white rounded-xl transition-colors hover:bg-white/5"
            >
              <Paperclip size={20} />
              <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleImageUpload} />
            </button>
            
            <input 
              ref={msgInputRef}
              className="flex-1 bg-transparent border-none outline-none text-white text-sm px-2 placeholder:text-slate-500"
              placeholder={`Message ${isDM ? dmPartner : '#' + room}`}
              value={currentMessage}
              onChange={handleTyping}
            />
            
            <button 
              type="submit" 
              disabled={!currentMessage.trim()}
              className="bg-gradient-to-r from-brand-600 to-indigo-500 text-white p-3 rounded-xl hover:from-brand-500 hover:to-indigo-400 disabled:opacity-30 disabled:hover:from-brand-600 disabled:hover:to-indigo-500 transition-all shadow-lg shadow-brand-600/20"
            >
              <Send size={20} />
            </button>
          </form>
        </div>
      </div>

      <MemberPanel 
        members={roomMembers} 
        onlineUsers={roomUsers} 
        isOpen={isMemberPanelOpen} 
        onClose={() => setIsMemberPanelOpen(false)} 
      />

      {/* In-App Image Lightbox Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
          >
            <div className="relative max-w-[90vw] max-h-[90vh] flex flex-col items-center" onClick={e => e.stopPropagation()}>
              <button 
                onClick={() => setSelectedImage(null)}
                className="absolute -top-12 right-0 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
                title="Close"
              >
                <X size={20} />
              </button>
              <img 
                src={selectedImage} 
                alt="Enlarged preview" 
                className="max-w-full max-h-[85vh] object-contain rounded-2xl border border-white/10 shadow-2xl" 
              />
              <div className="mt-4 flex gap-3">
                <a 
                  href={selectedImage} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg flex items-center gap-1.5"
                >
                  Original File
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Chat;
