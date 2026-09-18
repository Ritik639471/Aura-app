import React, { useState } from 'react';
import { Smile, Heart, ThumbsUp, Sparkles, X } from 'lucide-react';

const EMOJI_CATEGORIES = [
  {
    id: 'smileys',
    name: 'Smileys',
    icon: Smile,
    emojis: [
      '😀','😃','😄','😁','😆','😅','😂','🤣','🥲','🥹',
      '😊','😇','🙂','🙃','😉','😌','😍','🥰','😘','😗',
      '😙','😚','😋','😛','😝','😜','🤪','🤨','🧐','🤓',
      '😎','🥸','🤩','🥳','😏','😒','😞','😔','😟','😕',
      '🙁','☹️','😣','😖','😫','😩','🥺','😢','😭','😮‍💨',
      '😤','😠','😡','🤬','🤯','😳','🥵','🥶','😱','😨',
      '😰','😥','😓','🫣','🤗','🫡','🤔','🤫','🫠','🤥'
    ]
  },
  {
    id: 'hands',
    name: 'Hands & Gestures',
    icon: ThumbsUp,
    emojis: [
      '👍','👎','👏','🙌','👐','🤲','🤝','👊','✊','🤛',
      '🤜','🤞','✌️','🫰','🤟','🤘','👌','🤌','🤏','👈',
      '👉','👆','👇','☝️','✋','🤚','🖐️','🖖','👋','🤙',
      '💪','🦾','🖕','✍️','🙏','💅'
    ]
  },
  {
    id: 'hearts',
    name: 'Hearts & Emotions',
    icon: Heart,
    emojis: [
      '❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔',
      '❣️','💕','💞','💓','💗','💖','💘','💝','❤️‍🔥','❤️‍🩹',
      '🔥','✨','⭐','🌟','💫','💥','⚡','💯','💢','💤'
    ]
  },
  {
    id: 'objects',
    name: 'Objects & Symbols',
    icon: Sparkles,
    emojis: [
      '🎉','🎊','🎈','🎂','🎁','🏆','🏅','🎯','🚀','🛸',
      '🎮','🎲','🎨','🎬','🎤','🎧','📱','💻','📷','📸',
      '🔍','💡','🔑','📌','📍','📢','🔔','🎵','🎶','💬'
    ]
  }
];

const EmojiPicker = ({ onSelect, onClose }) => {
  const [activeCategory, setActiveCategory] = useState('smileys');

  const currentCategoryObj = EMOJI_CATEGORIES.find(cat => cat.id === activeCategory) || EMOJI_CATEGORIES[0];

  return (
    <div 
      className="glass-panel bg-slate-900/95 border border-white/10 rounded-2xl p-3 shadow-2xl w-[290px] sm:w-[330px] max-w-[calc(100vw-2rem)] flex flex-col gap-2.5 z-50 backdrop-blur-2xl"
      onClick={e => e.stopPropagation()}
    >
      {/* Header & Category Switcher */}
      <div className="flex items-center justify-between pb-2 border-b border-white/10">
        <div className="flex items-center gap-1">
          {EMOJI_CATEGORIES.map(cat => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center ${
                  isActive 
                    ? 'bg-brand-500/20 text-brand-400 border border-brand-500/40 shadow-sm' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
                title={cat.name}
              >
                <Icon size={16} />
              </button>
            );
          })}
        </div>
        {onClose && (
          <button 
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Category Name Banner */}
      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
        {currentCategoryObj.name}
      </div>

      {/* Scrollable Emoji Grid Container */}
      <div className="max-h-48 sm:max-h-56 overflow-y-auto custom-scrollbar pr-1">
        <div className="grid grid-cols-7 sm:grid-cols-8 gap-1">
          {currentCategoryObj.emojis.map((emoji, idx) => (
            <button
              key={`${activeCategory}-${idx}`}
              type="button"
              onClick={() => onSelect(emoji)}
              className="w-8 h-8 flex items-center justify-center text-xl rounded-lg hover:bg-white/10 hover:scale-125 active:scale-95 transition-all cursor-pointer"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EmojiPicker;
