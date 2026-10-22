// Playfair Cipher Chat Lock
//
// Classic Playfair (5x5 key square, I/J share a cell, digraph rules) wrapped in a
// chat-friendly "envelope" so that a message can be restored exactly:
//   - Only A-Z letters are enciphered; spaces, digits, punctuation and emoji stay in place,
//     so a locked chat still *looks* like a chat, just unreadable.
//   - Each word (run of letters) is enciphered on its own, so word boundaries survive.
//   - Letter case is carried by the cipher letters themselves.
//   - The positions of inserted filler letters (X / Q) and of original J's are stored in a
//     small numeric header so decryption is lossless instead of "HELXLO".
//
// Envelope format (stored as the message text):  🔐PF1|f=3,9;j=0|Wkhuh lv qr vsrrq
//
// NOTE: Playfair is a classical cipher. This is a privacy screen against people glancing at
// your chat, not a replacement for the XMTP end-to-end encryption underneath.

export const PLAYFAIR_PREFIX = '🔐PF1|';

const ALPHABET = 'ABCDEFGHIKLMNOPQRSTUVWXYZ'; // no J

// Build the 5x5 key square as a 25-letter string (row-major).
export function buildKeySquare(key) {
  const seen = new Set();
  let square = '';
  const source = String(key || '').toUpperCase().replace(/J/g, 'I') + ALPHABET;
  for (const ch of source) {
    if (ALPHABET.includes(ch) && !seen.has(ch)) {
      seen.add(ch);
      square += ch;
    }
  }
  return square;
}

// 5 rows of 5 letters, handy for rendering the grid
export function keySquareRows(key) {
  const square = buildKeySquare(key);
  return [0, 1, 2, 3, 4].map(r => square.slice(r * 5, r * 5 + 5).split(''));
}

export function countKeyLetters(key) {
  return (String(key || '').match(/[A-Za-z]/g) || []).length;
}

function makeLookup(square) {
  const pos = {};
  for (let i = 0; i < 25; i++) {
    pos[square[i]] = { row: Math.floor(i / 5), col: i % 5 };
  }
  return pos;
}

// Encipher/decipher one digraph of uppercase letters. dir = +1 encrypt, -1 decrypt.
function transformPair(a, b, square, pos, dir) {
  const pa = pos[a];
  const pb = pos[b];
  if (pa.row === pb.row) {
    return square[pa.row * 5 + (pa.col + dir + 5) % 5] + square[pb.row * 5 + (pb.col + dir + 5) % 5];
  }
  if (pa.col === pb.col) {
    return square[((pa.row + dir + 5) % 5) * 5 + pa.col] + square[((pb.row + dir + 5) % 5) * 5 + pb.col];
  }
  return square[pa.row * 5 + pb.col] + square[pb.row * 5 + pa.col];
}

function matchCase(letter, sample) {
  return sample === sample.toLowerCase() ? letter.toLowerCase() : letter.toUpperCase();
}

const fillerFor = (ch) => (ch.toUpperCase() === 'X' ? 'Q' : 'X');

// Split a word into Playfair digraphs, inserting fillers between doubled letters and at the
// end of odd-length words. Returns the padded letters and which of them are fillers.
function toDigraphs(word) {
  const letters = [];
  const isFiller = [];
  let i = 0;
  while (i < word.length) {
    const a = word[i];
    const b = word[i + 1];
    letters.push(a);
    isFiller.push(false);
    if (b === undefined || b.toUpperCase() === a.toUpperCase()) {
      letters.push(matchCase(fillerFor(a), a));
      isFiller.push(true);
      i += 1;
    } else {
      letters.push(b);
      isFiller.push(false);
      i += 2;
    }
  }
  return { letters, isFiller };
}

function parseMeta(meta) {
  const out = { f: new Set(), j: new Set() };
  (meta || '').split(';').forEach(part => {
    const [k, v] = part.split('=');
    if ((k === 'f' || k === 'j') && v) {
      v.split(',').forEach(n => out[k].add(Number(n)));
    }
  });
  return out;
}

// Encrypt a plaintext chat message into a self-describing Playfair envelope.
export function encryptPlayfair(plainText, key) {
  const square = buildKeySquare(key);
  const pos = makeLookup(square);
  const fillers = [];
  const js = [];
  let letterIndex = 0; // index into the padded letter stream across the whole message

  const cipher = String(plainText).replace(/[A-Za-z]+/g, (word) => {
    const { letters, isFiller } = toDigraphs(word);
    let out = '';
    for (let i = 0; i < letters.length; i += 2) {
      const a = letters[i];
      const b = letters[i + 1];
      if (isFiller[i]) fillers.push(letterIndex + i);
      if (isFiller[i + 1]) fillers.push(letterIndex + i + 1);
      if (!isFiller[i] && a.toUpperCase() === 'J') js.push(letterIndex + i);
      if (!isFiller[i + 1] && b.toUpperCase() === 'J') js.push(letterIndex + i + 1);
      const pair = transformPair(
        a.toUpperCase().replace('J', 'I'),
        b.toUpperCase().replace('J', 'I'),
        square, pos, 1
      );
      out += matchCase(pair[0], a) + matchCase(pair[1], b);
    }
    letterIndex += letters.length;
    return out;
  });

  const meta = [
    fillers.length ? `f=${fillers.join(',')}` : '',
    js.length ? `j=${js.join(',')}` : ''
  ].filter(Boolean).join(';');

  return `${PLAYFAIR_PREFIX}${meta}|${cipher}`;
}

export function isPlayfairEnvelope(text) {
  return typeof text === 'string' && text.startsWith(PLAYFAIR_PREFIX);
}

function splitEnvelope(envelope) {
  const body = envelope.slice(PLAYFAIR_PREFIX.length);
  const sep = body.indexOf('|');
  if (sep === -1) return { meta: '', cipher: body };
  return { meta: body.slice(0, sep), cipher: body.slice(sep + 1) };
}

// The scrambled text a snooper sees (envelope header stripped).
export function getPlayfairCipherText(text) {
  if (!isPlayfairEnvelope(text)) return text;
  return splitEnvelope(text).cipher;
}

// Decrypt an envelope back to the exact original text. With the wrong key this returns
// readable-looking gibberish, which is how Playfair behaves.
export function decryptPlayfair(text, key) {
  if (!isPlayfairEnvelope(text)) return text;
  const { meta, cipher } = splitEnvelope(text);
  const { f: fillers, j: js } = parseMeta(meta);
  const square = buildKeySquare(key);
  const pos = makeLookup(square);
  let letterIndex = 0;

  return cipher.replace(/[A-Za-z]+/g, (word) => {
    // Enciphered words always have even length; tolerate tampered input
    const padded = word.length % 2 ? word + 'X' : word;
    let out = '';
    for (let i = 0; i < padded.length; i += 2) {
      const a = padded[i];
      const b = padded[i + 1];
      const pair = transformPair(
        a.toUpperCase().replace('J', 'I'),
        b.toUpperCase().replace('J', 'I'),
        square, pos, -1
      );
      [[pair[0], a, letterIndex + i], [pair[1], b, letterIndex + i + 1]].forEach(([plain, sample, idx]) => {
        if (fillers.has(idx)) return;
        out += matchCase(js.has(idx) ? 'J' : plain, sample);
      });
    }
    letterIndex += padded.length;
    return out;
  });
}

// While a chat is locked, messages that were never encrypted (sent before the cipher was turned
// on, or by a peer without the key) are still shown Playfair-scrambled. The real key isn't
// available then, so they are scrambled with a key square derived from the stored fingerprint.
export function screenKeyFromHash(keyHash) {
  const hex = String(keyHash || '').replace(/[^0-9a-f]/gi, '');
  let key = '';
  for (let i = 0; i + 1 < hex.length; i += 2) {
    key += ALPHABET[parseInt(hex.slice(i, i + 2), 16) % 25];
  }
  return key;
}

// Fingerprint of the key square (not the raw key) so the app can tell a wrong key apart
// without ever storing the key itself. Keys that build the same square are equivalent.
export async function hashPlayfairKey(key, scope = '') {
  const material = `blockchat-playfair:${scope}:${buildKeySquare(key)}`;
  try {
    if (typeof window !== 'undefined' && window.crypto?.subtle) {
      const digest = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(material));
      return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (e) {}
  // Fallback (insecure contexts): FNV-1a
  let h = 0x811c9dc5;
  for (let i = 0; i < material.length; i++) {
    h ^= material.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return `fnv-${h.toString(16)}`;
}
