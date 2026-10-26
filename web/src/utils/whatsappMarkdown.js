'use client';
import { renderPixelText } from '@/components/PixelIcons';

/**
 * Parses and renders WhatsApp-style markdown formatted text in React:
 * - ```code block```
 * - `inline code`
 * - *bold*
 * - _italic_
 * - ~strikethrough~
 * - URLs -> clickable links
 */

export function renderWhatsAppMarkdown(rawText) {
  if (!rawText || typeof rawText !== 'string') return rawText;

  // 1. First check for multiline code blocks: ```code```
  const codeBlockRegex = /```([\s\S]*?)```/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(rawText)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: rawText.substring(lastIndex, match.index) });
    }
    parts.push({ type: 'codeblock', content: match[1] });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < rawText.length) {
    parts.push({ type: 'text', content: rawText.substring(lastIndex) });
  }

  return parts.map((part, partIdx) => {
    if (part.type === 'codeblock') {
      return (
        <pre key={partIdx} className="wa-code-block">
          <code>{part.content}</code>
        </pre>
      );
    }

    // Split text part by lines
    const lines = part.content.split('\n');
    return (
      <span key={partIdx}>
        {lines.map((line, lineIdx) => (
          <span key={lineIdx}>
            {parseInlineStyles(line)}
            {lineIdx < lines.length - 1 && <br />}
          </span>
        ))}
      </span>
    );
  });
}

function parseInlineStyles(line) {
  if (!line) return '';

  // Tokenize line by URLs, inline code, bold, italic, strikethrough
  // Regex matches URLs, `code`, *bold*, _italic_, ~strike~
  const tokenRegex = /(https?:\/\/[^\s]+|`[^`]+`|\*[^*\n]+\*|_[^_\n]+_|~[^~\n]+~)/g;
  const tokens = [];
  let lastIdx = 0;
  let m;

  while ((m = tokenRegex.exec(line)) !== null) {
    if (m.index > lastIdx) {
      tokens.push(renderPixelText(line.substring(lastIdx, m.index)));
    }

    const val = m[0];
    if (val.startsWith('http://') || val.startsWith('https://')) {
      tokens.push(
        <a 
          key={m.index} 
          href={val} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="wa-link"
          onClick={(e) => e.stopPropagation()}
        >
          {val}
        </a>
      );
    } else if (val.startsWith('`') && val.endsWith('`') && val.length > 2) {
      tokens.push(
        <code key={m.index} className="wa-inline-code">
          {val.slice(1, -1)}
        </code>
      );
    } else if (val.startsWith('*') && val.endsWith('*') && val.length > 2) {
      tokens.push(
        <strong key={m.index} className="wa-bold">
          {renderPixelText(val.slice(1, -1))}
        </strong>
      );
    } else if (val.startsWith('_') && val.endsWith('_') && val.length > 2) {
      tokens.push(
        <em key={m.index} className="wa-italic">
          {renderPixelText(val.slice(1, -1))}
        </em>
      );
    } else if (val.startsWith('~') && val.endsWith('~') && val.length > 2) {
      tokens.push(
        <del key={m.index} className="wa-strike">
          {renderPixelText(val.slice(1, -1))}
        </del>
      );
    } else {
      tokens.push(renderPixelText(val));
    }

    lastIdx = m.index + val.length;
  }

  if (lastIdx < line.length) {
    tokens.push(renderPixelText(line.substring(lastIdx)));
  }

  return tokens;
}
