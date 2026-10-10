'use client';
import { useState, useRef, useEffect } from 'react';

export default function EmojiPicker({ onSelectEmoji, onClose }) {
  const [activeCategory, setActiveCategory] = useState('popular');
  const popoverRef = useRef(null);

  const categories = {
    popular: {
      name: 'Popular',
      emojis: ['😊', '❤️', '👍', '🔥', '🎉', '🚀', '💎', '⚡', '👏', '🙌', '💯', '✨']
    },
    web3: {
      name: 'Web3',
      emojis: ['💎', '🚀', '⚡', '🔥', '🪙', '⛓️', '🦊', '🌐', '🔒', '🦄', '🪐', '🛡️']
    },
    reactions: {
      name: 'Faces',
      emojis: ['😂', '🤣', '😍', '🤔', '😎', '🥳', '🤩', '😇', '🤖', '👻', '👀', '🤯']
    },
    gestures: {
      name: 'Hands',
      emojis: ['👍', '👎', '✌️', '🤝', '🤙', '👊', '🙏', '🫡', '👋', '🤞', '💪', '👌']
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div className="composer-emoji-popover" ref={popoverRef}>
      <div className="emoji-categories-nav">
        {Object.entries(categories).map(([key, cat]) => (
          <button
            key={key}
            type="button"
            className={`emoji-cat-btn ${activeCategory === key ? 'active' : ''}`}
            onClick={() => setActiveCategory(key)}
          >
            {cat.name}
          </button>
        ))}
      </div>
      <div className="emoji-grid-body">
        {categories[activeCategory].emojis.map((emoji, index) => (
          <button
            key={index}
            type="button"
            className="emoji-item-btn"
            onClick={() => {
              onSelectEmoji(emoji);
              onClose();
            }}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
