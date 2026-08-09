import React, { useState, useEffect } from 'react';
import { Check, CheckCheck, Copy, Check as CheckIcon, Reply as ReplyIcon, MoreHorizontal, Trash2, Edit3, Pin, Download, X } from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/cn';
import { API_URL } from '../config';

const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

// Helper to downsample Cloudinary images for lightweight thumbnails
const getOptimizedImage = (url, width = 400) => {
  if (!url) return null;
  if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
    return url.replace('/upload/', `/upload/c_scale,w_${width},q_auto,f_auto/`);
  }
  return url;
};

const extractUrl = (text) => {
  const match = text?.match(/https?:\/\/[^\s]+/);
  return match ? match[0] : null;
};

const LinkPreview = ({ url }) => {
  const [preview, setPreview] = useState(null);
  useEffect(() => {
    axios.get(`${API_URL}/linkpreview?url=${encodeURIComponent(url)}`)
      .then(r => setPreview(r.data))
      .catch(() => {});
  }, [url]);

  if (!preview || preview.error || !preview.title) return null;

  return (
    <motion.a 
      href={url} 
      target="_blank" 
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="block mt-3 no-underline group/link"
    >
      <div className="border border-white/10 rounded-xl overflow-hidden bg-slate-900/40 hover:bg-slate-900/60 transition-colors">
        {preview.image && (
          <img src={getOptimizedImage(preview.image, 400)} alt="" className="w-full h-32 object-cover group-hover/link:scale-105 transition-transform duration-500" />
        )}
        <div className="p-3">
          <p className="text-[10px] text-brand-400 font-bold uppercase tracking-wider mb-1 opacity-70">{preview.domain}</p>
          <p className="text-sm font-bold text-white line-clamp-1 group-hover/link:text-brand-300 transition-colors">{preview.title}</p>
          {preview.description && (
            <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed opacity-80">{preview.description}</p>
          )}
        </div>
      </div>
    </motion.a>
  );
};

const MessageBubble = ({ 
  msg, 
  username, 
  isHighlighted, 
  onReact, 
  onEdit, 
  onDelete, 
  onPin, 
  onReply, 
  onImageClick, 
  isPowerUser, 
  searchQuery, 
  roomUsers, 
  roomMembers 
}) => {
  const [showOptionsTrigger, setShowOptionsTrigger] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(msg.message);
  const [copied, setCopied] = useState(false);
  
  const isMe = msg.author === username;
  const isDeleted = !!msg.deletedAt;
  const linkUrl = !isDeleted && !msg.imageUrl ? extractUrl(msg.message) : null;

  // Find author avatar from roomMembers if not directly on msg
  const memberObj = roomMembers?.find(m => m.username === msg.author);
  const authorAvatar = msg.authorAvatar || memberObj?.avatar;

  const highlightText = (text) => {
    if (!searchQuery || !text) return text;
    const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'));
    return parts.map((p, i) =>
      p.toLowerCase() === searchQuery.toLowerCase()
        ? <mark key={i} className="bg-brand-500/50 text-white rounded px-0.5">{p}</mark>
        : p
    );
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.message || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setIsMenuOpen(false);
  };

  const renderReadReceipt = () => {
    if (!isMe) return null;
    const roomUsersCount = roomUsers?.length || 1;
    const readCount = msg.readBy?.filter(u => u !== username).length || 0;
    
    if (readCount >= (roomUsersCount - 1) && roomUsersCount > 1) {
      return <CheckCheck size={14} className="text-emerald-400" title="Read by everyone" />;
    } else if (readCount > 0) {
      return <CheckCheck size={14} className="text-brand-400" title="Read by some" />;
    }
    return <Check size={14} className="text-white/40" title="Sent" />;
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (editText.trim()) { 
      onEdit(msg._id, editText, msg.room); 
      setEditing(false); 
      setIsMenuOpen(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={cn("flex items-end gap-3 mb-5 group relative transition-all", isMe && "flex-row-reverse")}
      onMouseEnter={() => setShowOptionsTrigger(true)} 
      onMouseLeave={() => { setShowOptionsTrigger(false); setIsMenuOpen(false); }}
    >
      {/* Avatar Display */}
      <div className="shrink-0 mb-1">
        <div className={cn(
          "w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shadow-lg overflow-hidden border border-white/10",
          isMe ? "bg-gradient-to-br from-brand-500 to-indigo-600 text-white" : "bg-slate-800 text-slate-300"
        )}>
          {authorAvatar ? (
            <img 
              src={getOptimizedImage(authorAvatar, 100)} 
              alt={msg.author} 
              className="w-full h-full object-cover" 
            />
          ) : (
            msg.author[0].toUpperCase()
          )}
        </div>
      </div>

      <div className={cn("max-w-[85%] md:max-w-[70%] relative flex flex-col", isMe ? "items-end" : "items-start")}>
        {!isDeleted && (
          <div className={cn("flex items-baseline gap-2 mb-1.5", isMe ? "mr-1 flex-row-reverse" : "ml-1")}>
            <span className={cn(
              "text-xs font-black tracking-tight",
              isMe ? "text-brand-400" : "text-slate-200"
            )}>
              {msg.author}
            </span>
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest opacity-80">
              {msg.time}
            </span>
            {msg.edited && <span className="text-[9px] font-bold text-slate-600 lowercase opacity-60">(edited)</span>}
          </div>
        )}

        {/* Clean Menu Trigger Button on Hover (Stops automatic clutter popups) */}
        <AnimatePresence>
          {showOptionsTrigger && !isDeleted && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className={cn(
                "absolute top-1/2 -translate-y-1/2 z-20 flex items-center gap-1",
                isMe ? "-left-10" : "-right-10"
              )}
            >
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-1.5 rounded-xl bg-slate-900/90 border border-white/10 text-slate-400 hover:text-white hover:bg-slate-800 transition-all shadow-xl"
                title="Options"
              >
                <MoreHorizontal size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Options Dropdown Menu (Opened only when user clicks More Options) */}
        <AnimatePresence>
          {isMenuOpen && !isDeleted && (
            <motion.div 
              initial={{ opacity: 0, y: -5, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -5, scale: 0.95 }}
              className={cn(
                "absolute -top-14 bg-slate-900/95 backdrop-blur-2xl border border-white/15 p-2 rounded-2xl shadow-2xl z-30 flex flex-col gap-2 min-w-[200px]",
                isMe ? "right-0" : "left-0"
              )}
            >
              {/* Quick Reactions */}
              <div className="flex justify-between items-center bg-white/5 p-1 rounded-xl">
                {REACTION_EMOJIS.map(emoji => (
                  <button 
                    key={emoji} 
                    onClick={() => { onReact(msg._id, emoji); setIsMenuOpen(false); }} 
                    className="p-1 hover:bg-white/10 rounded-lg text-base hover:scale-125 transition-transform"
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {/* Action List */}
              <div className="flex flex-col gap-0.5 text-xs font-semibold text-slate-300">
                <button 
                  onClick={() => { onReply(msg); setIsMenuOpen(false); }}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors"
                >
                  <ReplyIcon size={14} className="text-brand-400" /> Reply
                </button>
                <button 
                  onClick={handleCopy}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors"
                >
                  <Copy size={14} className="text-slate-400" /> {copied ? 'Copied!' : 'Copy Text'}
                </button>
                {isMe && (
                  <button 
                    onClick={() => { setEditing(true); setIsMenuOpen(false); }}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors"
                  >
                    <Edit3 size={14} className="text-amber-400" /> Edit Message
                  </button>
                )}
                {isPowerUser && (
                  <button 
                    onClick={() => { onPin(msg._id, msg.room); setIsMenuOpen(false); }}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors"
                  >
                    <Pin size={14} className="text-yellow-400" /> {msg.pinned ? 'Unpin Message' : 'Pin Message'}
                  </button>
                )}
                {(isMe || isPowerUser) && (
                  <button 
                    onClick={() => { onDelete(msg._id, msg.room); setIsMenuOpen(false); }}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-red-500/20 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={14} className="text-red-400" /> Delete Message
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Message Bubble Container */}
        <div className={cn(
          "relative px-4 py-3 rounded-2xl transition-all duration-300 shadow-lg text-sm",
          isDeleted ? "bg-white/5 border border-white/5 italic text-slate-500" :
          isHighlighted ? "bg-brand-600/30 border border-brand-500/50 shadow-brand-500/20" :
          isMe ? "bg-gradient-to-br from-brand-600 to-indigo-600 text-white rounded-br-sm shadow-brand-500/10" : 
          "bg-slate-800/80 border border-white/5 text-white rounded-bl-sm hover:bg-slate-700/80 backdrop-blur-sm"
        )}>
          {isDeleted ? (
            <div className="flex items-center gap-2 opacity-60">
              <span className="text-lg">🚫</span> This message was deleted
            </div>
          ) : editing ? (
            <form onSubmit={handleEditSubmit} className="flex gap-2 min-w-[200px]">
              <input 
                value={editText} 
                onChange={e => setEditText(e.target.value)} 
                className="bg-slate-900/50 border border-white/20 rounded-lg px-3 py-1.5 text-sm text-white w-full outline-none focus:border-brand-400 transition-colors"
                autoFocus 
              />
              <button type="submit" className="text-emerald-400 hover:bg-emerald-400/10 p-2 rounded-lg">✓</button>
              <button type="button" onClick={() => setEditing(false)} className="text-red-400 hover:bg-red-400/10 p-2 rounded-lg">✕</button>
            </form>
          ) : (
            <>
              {msg.replyMessage && (
                <div className="mb-2 bg-black/20 border-l-2 border-brand-300/50 p-2 rounded-r-lg text-xs">
                  <p className="font-bold text-brand-200 mb-0.5 flex items-center gap-1">
                    <ReplyIcon size={10} /> {msg.replyMessage.author}
                  </p>
                  <p className="text-slate-300 line-clamp-2 italic opacity-80">
                    {msg.replyMessage.message || (msg.replyMessage.image ? '📷 Image' : 'Message')}
                  </p>
                </div>
              )}

              {/* Low-Quality Thumbnail Image with In-App Lightbox trigger */}
              {msg.imageUrl && (
                <div 
                  onClick={() => onImageClick && onImageClick(msg.imageUrl)}
                  className="block mb-2 overflow-hidden rounded-2xl shadow-lg border border-white/10 cursor-pointer group/img relative"
                >
                  <img 
                    src={getOptimizedImage(msg.imageUrl, 400)} 
                    alt="attachment" 
                    className="max-w-[260px] max-h-[200px] w-full object-cover rounded-2xl group-hover/img:scale-105 transition-transform duration-300" 
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold gap-1">
                    🔍 Expand Image
                  </div>
                </div>
              )}

              {msg.message && (
                <div className={cn(
                  "leading-relaxed break-words font-medium",
                  isMe ? "text-white" : "text-white/90"
                )}>
                  {highlightText(msg.message)}
                </div>
              )}
              {linkUrl && <LinkPreview url={linkUrl} />}
            </>
          )}

          {isMe && !isDeleted && (
            <div className="absolute -bottom-5 right-1 flex justify-end mt-1.5">
              {renderReadReceipt()}
            </div>
          )}
        </div>

        {/* Message Reactions List */}
        {!isDeleted && msg.reactions?.length > 0 && (
          <div className={cn(
            "flex flex-wrap gap-1 mt-2",
            isMe ? "justify-end mr-1" : "justify-start ml-1"
          )}>
            {msg.reactions.map((r, i) => (
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                key={i} 
                onClick={() => onReact(msg._id, r.emoji)} 
                className={cn(
                  "flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-black border transition-all shadow-sm",
                  r.users.includes(username) 
                    ? "bg-brand-500/20 border-brand-500/50 text-brand-300" 
                    : "bg-slate-800 border-white/10 text-white/80 hover:bg-slate-700"
                )}
              >
                <span>{r.emoji}</span>
                <span className="opacity-70">{r.users.length}</span>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default MessageBubble;
