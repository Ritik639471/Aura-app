import React, { useState, useEffect } from 'react';
import { Check, CheckCheck, Copy, Check as CheckIcon, Reply as ReplyIcon } from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/cn';
import { API_URL } from '../config';

const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

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
          <img src={preview.image} alt="" className="w-full h-32 object-cover group-hover/link:scale-105 transition-transform duration-500" />
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

const MessageBubble = ({ msg, username, isHighlighted, onReact, onEdit, onDelete, onPin, onReply, isPowerUser, searchQuery, roomUsers }) => {
  const [showActions, setShowActions] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(msg.message);
  const [copied, setCopied] = useState(false);
  const isMe = msg.author === username;
  const isDeleted = !!msg.deletedAt;
  const linkUrl = !isDeleted && !msg.imageUrl ? extractUrl(msg.message) : null;

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
    if (editText.trim()) { onEdit(msg._id, editText, msg.room); setEditing(false); }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={cn("flex items-end gap-3 mb-6 group transition-all", isMe && "flex-row-reverse")}
      onMouseEnter={() => setShowActions(true)} 
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="shrink-0 mb-1">
        <div className={cn(
          "w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shadow-lg",
          isMe ? "bg-gradient-to-br from-brand-500 to-indigo-600 text-white shadow-brand-500/20" : "bg-slate-800 text-slate-300 border border-white/10"
        )}>
          {msg.author[0].toUpperCase()}
        </div>
      </div>

      <div className={cn("max-w-[85%] md:max-w-[75%] relative flex flex-col", isMe ? "items-end" : "items-start")}>
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

        <AnimatePresence>
          {showActions && !isDeleted && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className={cn(
                "absolute -top-12 flex gap-1 bg-slate-900/90 backdrop-blur-xl border border-white/10 p-1 rounded-xl shadow-2xl z-20",
                isMe ? "right-0" : "left-0"
              )}
            >
              <button 
                onClick={() => onReply(msg)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-brand-500/20 rounded-lg transition-colors" 
                title="Reply"
              >
                <ReplyIcon size={14} />
              </button>
              <button 
                onClick={handleCopy} 
                className={cn("p-1.5 rounded-lg transition-colors", copied ? "text-emerald-400 bg-emerald-400/10" : "text-slate-400 hover:text-white hover:bg-white/10")} 
                title="Copy"
              >
                {copied ? <CheckIcon size={14} /> : <Copy size={14} />}
              </button>
              {isMe && (
                <button onClick={() => setEditing(true)} className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="Edit">
                  ✏️
                </button>
              )}
              {(isMe || isPowerUser) && (
                <button onClick={() => onDelete(msg._id, msg.room)} className="p-1.5 text-slate-400 hover:text-white hover:bg-red-500/20 rounded-lg transition-colors" title="Delete">
                  🗑️
                </button>
              )}
              {isPowerUser && (
                <button onClick={() => onPin(msg._id, msg.room)} className={cn("p-1.5 rounded-lg transition-colors", msg.pinned ? "text-yellow-400 bg-yellow-400/10" : "text-slate-400 hover:text-white hover:bg-white/10")} title={msg.pinned ? 'Unpin' : 'Pin'}>
                  📌
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

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
              {msg.imageUrl && (
                <motion.a 
                  href={msg.imageUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.02 }}
                  className="block mb-2 overflow-hidden rounded-xl shadow-inner border border-white/10"
                >
                  <img src={msg.imageUrl} alt="attachment" className="max-w-full max-h-72 object-contain rounded-xl" />
                </motion.a>
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

        <AnimatePresence>
          {showActions && !isDeleted && msg._id && (
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 5, scale: 0.9 }}
              className={cn(
                "absolute bg-slate-900/95 border border-white/10 rounded-2xl p-1.5 flex gap-1 shadow-2xl z-30",
                isMe ? "right-0" : "left-0",
                msg.reactions?.length > 0 ? "top-[calc(100%+8px)]" : "top-[calc(100%+4px)]"
              )}
            >
              {REACTION_EMOJIS.map(emoji => (
                <button 
                  key={emoji} 
                  onClick={() => onReact(msg._id, emoji)} 
                  className="p-1.5 rounded-xl text-xl hover:bg-white/10 hover:scale-125 transition-all"
                >
                  {emoji}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default MessageBubble;
