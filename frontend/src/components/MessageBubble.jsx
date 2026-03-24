import React, { useState, useEffect } from 'react';
import { Check, CheckCheck, Copy, Check as CheckIcon } from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/cn';

const API_URL = 'https://aura-app-keg8.onrender.com/api';
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
      <div className="border border-white/10 rounded-xl overflow-hidden bg-black/40 hover:bg-black/60 transition-colors">
        {preview.image && (
          <img src={preview.image} alt="" className="w-full h-32 object-cover group-hover/link:scale-105 transition-transform duration-500" />
        )}
        <div className="p-3">
          <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider mb-1 opacity-70">{preview.domain}</p>
          <p className="text-sm font-bold text-white line-clamp-1 group-hover/link:text-indigo-300 transition-colors">{preview.title}</p>
          {preview.description && (
            <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed opacity-80">{preview.description}</p>
          )}
        </div>
      </div>
    </motion.a>
  );
};

const MessageBubble = ({ msg, username, isHighlighted, onReact, onEdit, onDelete, onPin, isPowerUser, searchQuery }) => {
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
        ? <mark key={i} className="bg-indigo-500/50 text-white rounded px-0.5">{p}</mark>
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
    const readCount = msg.readBy?.filter(u => u !== username).length || 0;
    return readCount > 0
      ? <CheckCheck size={14} className="text-indigo-400" />
      : <Check size={14} className="text-white/40" />;
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (editText.trim()) { onEdit(msg._id, editText, msg.room); setEditing(false); }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="flex items-start gap-3 mb-6 group transition-all"
      onMouseEnter={() => setShowActions(true)} 
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar */}
      <div className="shrink-0 mt-1">
        <div className={cn(
          "w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shadow-lg shadow-black/20",
          isMe ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-400"
        )}>
          {msg.author[0].toUpperCase()}
        </div>
      </div>

      <div className="max-w-[85%] md:max-w-[75%] relative flex flex-col">
        {/* Author & Time */}
        {!isDeleted && (
          <div className="flex items-baseline gap-2 mb-1.5 ml-1">
            <span className={cn(
              "text-sm font-black tracking-tight",
              isMe ? "text-indigo-400" : "text-slate-200"
            )}>
              {msg.author}
            </span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter opacity-80">
              {msg.time}
            </span>
            {msg.edited && <span className="text-[9px] font-bold text-slate-600 lowercase opacity-60">(edited)</span>}
          </div>
        )}

        {/* Action bar on hover */}
        <AnimatePresence>
          {showActions && !isDeleted && (
            <motion.div 
              initial={{ opacity: 0, [isMe ? 'x' : 'x']: isMe ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, [isMe ? 'x' : 'x']: isMe ? -10 : 10 }}
              className={cn(
                "absolute -top-10 flex gap-1.5 bg-slate-900/90 backdrop-blur-md border border-white/10 p-1.5 rounded-xl shadow-2xl z-20",
                isMe ? "right-0" : "left-0"
              )}
            >
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

        {/* Bubble */}
        <div className={cn(
          "relative px-4 py-3 rounded-2xl transition-all duration-300 shadow-lg",
          isDeleted ? "bg-white/5 border border-white/5 italic text-slate-500 text-sm" :
          isHighlighted ? "bg-indigo-600/30 border border-indigo-500/50 shadow-indigo-500/20" :
          isMe ? "bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-tr-none shadow-indigo-500/20" : 
          "bg-white/5 border border-white/10 text-white rounded-tl-none hover:bg-white/10"
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
                className="bg-black/40 border border-white/20 rounded-lg px-2 py-1 text-sm text-white w-full outline-none focus:border-indigo-400 transition-colors"
                autoFocus 
              />
              <button type="submit" className="text-emerald-400 hover:bg-emerald-400/10 p-1.5 rounded-lg">✓</button>
              <button type="button" onClick={() => setEditing(false)} className="text-red-400 hover:bg-red-400/10 p-1.5 rounded-lg">✕</button>
            </form>
          ) : (
            <>
              {msg.imageUrl && (
                <motion.a 
                  href={msg.imageUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.02 }}
                  className="block mb-2 overflow-hidden rounded-xl border border-white/10 shadow-inner"
                >
                  <img src={msg.imageUrl} alt="attachment" className="max-w-full max-h-72 object-contain" />
                </motion.a>
              )}
              {msg.message && (
                <div className={cn(
                  "text-[0.95rem] leading-relaxed break-words font-medium",
                  isMe ? "text-white" : "text-white/95"
                )}>
                  {highlightText(msg.message)}
                </div>
              )}
              {linkUrl && <LinkPreview url={linkUrl} />}
            </>
          )}

          {/* Inline Read Receipt (For Personal reference) */}
          {isMe && !isDeleted && (
            <div className="flex justify-end mt-1.5 opacity-60">
              {renderReadReceipt()}
            </div>
          )}
        </div>

        {/* Reactions */}
        {!isDeleted && msg.reactions?.length > 0 && (
          <div className={cn(
            "flex flex-wrap gap-1 mt-1.5",
            isMe ? "justify-end" : "justify-start"
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
                    ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-300" 
                    : "bg-white/5 border-white/10 text-white/80 hover:bg-white/10"
                )}
              >
                <span>{r.emoji}</span>
                <span className="opacity-70">{r.users.length}</span>
              </motion.button>
            ))}
          </div>
        )}

        {/* Quick Reaction Modal on hover */}
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
