'use client';
import { useState, useEffect } from 'react';
import { COPILOT_COMMANDS } from '@/utils/copilotEngine';
import { PixelTerminal } from './PixelIcons';

export default function CopilotPalette({
  filterQuery = '',
  onSelectCommand,
  onClose
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const cleanQuery = (filterQuery || '').toLowerCase().trim();
  const matchingCommands = COPILOT_COMMANDS.filter(c => {
    if (!cleanQuery || cleanQuery === '/') return true;
    return c.cmd.toLowerCase().includes(cleanQuery) || c.name.toLowerCase().includes(cleanQuery);
  });

  useEffect(() => {
    setSelectedIndex(0);
  }, [cleanQuery]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (matchingCommands.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % matchingCommands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + matchingCommands.length) % matchingCommands.length);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        if (matchingCommands[selectedIndex]) {
          e.preventDefault();
          onSelectCommand(matchingCommands[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [matchingCommands, selectedIndex, onSelectCommand, onClose]);

  if (matchingCommands.length === 0) return null;

  return (
    <div className="copilot-palette-floating" onClick={(e) => e.stopPropagation()}>
      <div className="copilot-palette-header">
        <PixelTerminal size={14} color="var(--arcade-neon-green)" />
        <span className="font-arcade">ARCADE COPILOT COMMANDS</span>
        <span className="copilot-hint-esc">ESC TO CLOSE</span>
      </div>

      <div className="copilot-palette-list">
        {matchingCommands.map((cmd, idx) => (
          <div
            key={cmd.cmd}
            className={`copilot-palette-item ${idx === selectedIndex ? 'active' : ''}`}
            onClick={() => onSelectCommand(cmd)}
            onMouseEnter={() => setSelectedIndex(idx)}
          >
            <div className="copilot-item-icon">{cmd.icon}</div>
            <div className="copilot-item-info">
              <div className="copilot-item-syntax font-arcade">
                <span>{cmd.cmd}</span>
                <span className="syntax-detail">{cmd.syntax.replace(cmd.cmd, '')}</span>
              </div>
              <div className="copilot-item-desc">{cmd.desc}</div>
            </div>
            <div className="copilot-item-enter font-arcade">↵</div>
          </div>
        ))}
      </div>
    </div>
  );
}
