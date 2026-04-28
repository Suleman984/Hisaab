export const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2);

export const today = () =>
  new Date().toISOString().split('T')[0];

export const dateStr = (ts: number) =>
  new Date(ts).toISOString().split('T')[0];

export const fmt = (n: number) =>
  'Rs ' + (Math.round(n) || 0).toLocaleString();

export const fmtTime = (ts: number) => {
  const d = new Date(ts);
  const diff = Date.now() - ts;
  if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
  if (d.toDateString() === new Date().toDateString())
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString([], { day: 'numeric', month: 'short' });
};

export const initials = (name: string) =>
  (name || '??').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

export const getGreeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning,' : h < 17 ? 'Good afternoon,' : 'Good evening,';
};
