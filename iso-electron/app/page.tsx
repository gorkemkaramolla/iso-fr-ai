'use client';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
// import api from '@/utils/axios_instance';
// import Image from 'next/image';
// import Link from 'next/link';

// const Page = () => {
//   const [detections, setDetections] = useState<DetectionLog[]>([]);

//   useEffect(() => {
//     const fetchDetections = async () => {
//       try {
//         const response = await api.get('/get-detections');
//         setDetections(response.data || []);
//       } catch (error) {
//         console.error('Error fetching detections:', error);
//         // Handle the error appropriately
//       }
//     };

//     fetchDetections();
//   }, []);

//   // Group detections by label
//   const groupedDetections = detections.reduce<Record<string, DetectionLog[]>>(
//     (acc, detection) => {
//       if (!detection || !detection.label) {
//         return acc; // Skip undefined or invalid detections
//       }
//       if (!acc[detection.label]) {
//         acc[detection.label] = [];
//       }
//       acc[detection.label].push(detection);
//       return acc;
//     },
//     {}
//   );

//   // Get currently active users
//   const activeUsers = Object.keys(groupedDetections).filter((label) =>
//     groupedDetections[label].some((log) => log.status !== 'Quited')
//   );

//   // Count active users
//   const activeUsersCount = activeUsers.length;

//   return (
//     <div className='py-4  flex w-screen overflow-y-scroll  '>
//       <div className='w-1/4 '>
//         <strong>Currently Active Users: {activeUsersCount}</strong>
//         <ul>
//           {activeUsers.map((user, i) => (
//             <li key={i}>{user}</li>
//           ))}
//         </ul>
//       </div>
//       <div className='flex flex-col w-2/4 h-full text-sm justify-center overflow-y-scroll  gap-4'>
//         {detections.map((detection, i) => (
//           <Link href={`/profiles/${detection.person_id}`} key={i} className=''>
//             <a
//               className={`${
//                 detection.status !== 'Quited'
//                   ? 'border-2 border-green-500 '
//                   : 'border-2 border-red-500'
//               } rounded-lg shadow-lg overflow-hidden flex items-center p-5 gap-4`}
//             >
//               <Image
//                 src={`data:image/jpeg;base64,${detection.image_entered}`}
//                 width={120}
//                 height={120}
//                 alt='face image'
//                 className='flex-none aspect-square'
//               />
//               <div>
//                 <div className='font-bold text-lg mb-2'>{detection.label}</div>
//                 <p className=''>Emotion: {detection.emotion_entered}</p>
//                 <p className=''>Giriş Zamanı: {detection.time_entered}</p>
//                 {detection.status === 'Quited' && (
//                   <p className=''>Çıkış Zamanı: {detection.time_quited}</p>
//                 )}
//                 <p className=''>Durum: {detection.status}</p>
//               </div>
//             </a>
//           </Link>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default Page;
export default function Page() {
  const router = useRouter();

  useEffect(() => {
    router.refresh();
  }, []);
  return <div>asd</div>;
}
