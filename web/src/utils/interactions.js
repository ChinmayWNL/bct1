// Shared helpers for hidden "interaction" messages (poll votes, gift claims).
// Interactions are sent as `{ type: 'interaction', kind, targetId, ... }` JSON messages,
// never rendered as bubbles, and aggregated into a { [targetId]: { [voterKey]: entry } } map.

export function applyInteraction(map, data, voterKey, ts = Date.now()) {
  if (!data || data.type !== 'interaction' || !data.targetId || !voterKey) return map;
  const existing = map[data.targetId] || {};
  const entry = { kind: data.kind, choice: data.choice, ts: data.ts || ts };
  // Polls: a voter can change their vote. Gifts: first claim wins.
  if (data.kind === 'gift_claim' && existing[voterKey]) return map;
  return { ...map, [data.targetId]: { ...existing, [voterKey]: entry } };
}

export function tallyPoll(votes = {}, optionCount = 0) {
  const counts = new Array(optionCount).fill(0);
  Object.values(votes).forEach(v => {
    if (v.kind === 'poll_vote' && counts[v.choice] !== undefined) counts[v.choice] += 1;
  });
  const total = counts.reduce((a, b) => a + b, 0);
  return { counts, total };
}

function hashStr(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Deterministic split of `totalXp` into `slots` prizes derived from the packet id.
export function giftPrizes(packetId, totalXp, slots) {
  const weights = Array.from({ length: slots }, (_, i) => 1 + (hashStr(`${packetId}:${i}`) % 100));
  const sum = weights.reduce((a, b) => a + b, 0);
  const prizes = weights.map(w => Math.max(1, Math.floor((totalXp * w) / sum)));
  const diff = totalXp - prizes.reduce((a, b) => a + b, 0);
  prizes[0] += diff;
  return prizes;
}

// Claims in a deterministic order (timestamp, then voter key) mapped to prizes.
export function giftClaimList(packetId, totalXp, slots, votes = {}) {
  const prizes = giftPrizes(packetId, totalXp, slots);
  return Object.entries(votes)
    .filter(([, v]) => v.kind === 'gift_claim')
    .sort((a, b) => (a[1].ts - b[1].ts) || a[0].localeCompare(b[0]))
    .slice(0, slots)
    .map(([key, v], i) => ({ key, ts: v.ts, prize: prizes[i] }));
}

export function buildChatExport(messages, labelFor, snippetFor, format = 'json') {
  const rows = messages.map(m => ({
    id: m.id,
    from: labelFor(m),
    at: m.sentAt ? new Date(m.sentAt).toISOString() : '',
    text: snippetFor(m)
  }));
  if (format === 'txt') {
    return rows.map(r => `[${r.at}] ${r.from}: ${r.text}`).join('\n');
  }
  return JSON.stringify({ exportedAt: new Date().toISOString(), count: rows.length, messages: rows }, null, 2);
}

export function downloadTextFile(filename, text, mime = 'application/json') {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
