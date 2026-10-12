const HISTORY_EVENT = 'aegis:chat-updated';

export function notifyAegisChatUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(HISTORY_EVENT));
  }
}

export async function sendAegisChat({ token, message, attachment_ids = [], signal }) {
  const response = await fetch('/api/admin/aegis/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ message: String(message || '').trim(), attachment_ids }),
    signal,
    cache: 'no-store',
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail || data.error || `Aegis request failed (${response.status})`);
  }
  const answer = String(
    data.reply || data.message || data.response || data.answer ||
    data.result?.reply || data.result?.response || ''
  ).trim();
  if (!answer) throw new Error('Aegis returned no readable response.');
  notifyAegisChatUpdated();
  return { data, answer };
}

export async function loadAegisHistory(token) {
  const response = await fetch('/api/admin/aegis/chat/history', {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!response.ok) throw new Error('Aegis conversation history could not be loaded.');
  const data = await response.json().catch(() => ({}));
  const messages = Array.isArray(data?.messages) ? data.messages : [];
  return messages.slice().reverse()
    .filter((message) => message?.role === 'user' || message?.role === 'assistant')
    .map((message) => ({
      role: message.role === 'user' ? 'owner' : 'agent',
      agent: 'Aegis',
      text: String(message.content || ''),
    }));
}
