function formatDate(date: string) {
  return new Date(date).toLocaleString('tr-TR', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}
export { formatDate };
