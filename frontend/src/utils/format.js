export function formatDate(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function winrate(wins, total) {
  if (!total) return '0%';
  return `${((wins / total) * 100).toFixed(1)}%`;
}
