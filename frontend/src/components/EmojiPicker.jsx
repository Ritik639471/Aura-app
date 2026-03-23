import React from 'react';

const PICKER_EMOJIS = [
  '😀','😂','😍','🥰','😎','🤔','😢','😡','🔥','❤️',
  '👍','👎','🙌','🎉','✨','💯','🚀','😮','🤩','😴',
  '🫡','💀','👀','😏','🥹','😤','🙄','😬','🤯','💪'
];

const EmojiPicker = ({ onSelect, onClose }) => (
  <div className="glass-panel" style={{ position: 'absolute', bottom: '65px', left: '0', padding: '12px', borderRadius: '16px', display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: '4px', zIndex: 20, width: '320px' }}
    onClick={e => e.stopPropagation()}
  >
    {PICKER_EMOJIS.map(emoji => (
      <button key={emoji} onClick={() => onSelect(emoji)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.3rem', padding: '5px', borderRadius: '6px', textAlign: 'center' }}
        onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
        onMouseOut={e => e.currentTarget.style.background = 'none'}
      >{emoji}</button>
    ))}
  </div>
);

export default EmojiPicker;
