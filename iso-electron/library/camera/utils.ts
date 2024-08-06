export const truncateString = (str: string, num: number) => {
  if (str.length <= num) {
    return str;
  }
  return str.slice(0, num) + '...';
};

export const formatLastSeen = (timestamp: string) => {
  const now = new Date();
  const then = new Date(timestamp);
  const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  const units = [
    { label: 'yıl', seconds: 31536000 },
    { label: 'ay', seconds: 2592000 },
    { label: 'hafta', seconds: 604800 },
    { label: 'gün', seconds: 86400 },
    { label: 'saat', seconds: 3600 },
    { label: 'dakika', seconds: 60 },
    { label: 'saniye', seconds: 1 },
  ];

  for (const unit of units) {
    const amount = Math.floor(diffInSeconds / unit.seconds);
    if (amount >= 1) {
      return `${amount} ${unit.label}${amount >= 1 ? ' önce' : ''}`;
    }
  }

  return 'şimdi';
};

export const getLatestTimestamp = (faces: RecogFace[]) => {
  const latestFace = faces.reduce((latest, face) => {
    const faceTime = new Date(face.timestamp).getTime();
    return faceTime > new Date(latest.timestamp).getTime() ? face : latest;
  });
  return latestFace.timestamp;
};
