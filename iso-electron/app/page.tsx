import api from '@/utils/axios_instance';
import Image from 'next/image';
import Link from 'next/link';

export default async function Page() {
  let detections: DetectionLog[] = [];

  try {
    detections = (await api.get('/get-detections')).data || [];
  } catch (error) {
    console.error('Error fetching detections:', error);
    // Handle the error appropriately
  }

  // Group detections by label
  const groupedDetections = detections.reduce<Record<string, DetectionLog[]>>(
    (acc, detection) => {
      if (!detection || !detection.label) {
        return acc; // Skip undefined or invalid detections
      }
      if (!acc[detection.label]) {
        acc[detection.label] = [];
      }
      acc[detection.label].push(detection);
      return acc;
    },
    {}
  );

  // Get currently active users
  const activeUsers = Object.keys(groupedDetections).filter((label) =>
    groupedDetections[label].some((log) => log.status !== 'Quited')
  );

  // Count active users
  const activeUsersCount = activeUsers.length;

  return (
    <div className='p-4 flex w-screen'>
      <div className='mb-4 w-1/4'>
        <strong>Currently Active Users: {activeUsersCount}</strong>
        <ul>
          {activeUsers.map((user, i) => (
            <li key={i}>{user}</li>
          ))}
        </ul>
      </div>
      <div className='flex flex-col w-3/4 text-sm justify-center overflow-y-scroll h-[93vh] gap-4'>
        {detections.map((detection, i) => (
          <Link href={'/'} key={i} className=''>
            <div
              className={`${
                detection.status !== 'Quited'
                  ? 'border-2 border-green-500 '
                  : 'border-2 border-red-500'
              } rounded-lg shadow-lg overflow-hidden flex items-center p-5 gap-4`}
            >
              <Image
                src={`data:image/jpeg;base64,${detection.image_entered}`}
                width={120}
                height={120}
                alt='face image'
                className='flex-none aspect-square'
              />
              <div>
                <div className='font-bold text-lg mb-2'>{detection.label}</div>
                <p className=''>Emotion: {detection.emotion_entered}</p>
                <p className=''>Giriş Zamanı: {detection.time_entered}</p>
                {detection.status === 'Quited' && (
                  <p className=''>Çıkış Zamanı: {detection.time_quited}</p>
                )}
                <p className=''>Durum: {detection.status}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
