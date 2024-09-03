import React from 'react';
import { TbFaceId, TbMoodNeutral, TbMoodSuprised, TbCalendarTime, TbPhoto } from 'react-icons/tb';
import { HiOutlineEmojiHappy } from 'react-icons/hi';
import { FaRegSadTear, FaRegAngry } from 'react-icons/fa';
import { IoMdSad } from 'react-icons/io';
import { User } from 'lucide-react';
import { PiGenderIntersexFill } from 'react-icons/pi';
import { RecogFace } from '@/types';

interface RecogDetailsProps {
  selectedFace: RecogFace | null;
}

const emotionMap: { [key: number]: string } = {
  0: 'neutral',
  1: 'happy',
  2: 'sad',
  3: 'surprised',
  4: 'fear',
  5: 'disgust',
  6: 'angry',
};

const getEmotionColor = (emotion: string | number) => {
  const emotionStr = typeof emotion === 'number' ? emotionMap[emotion] : emotion.toLowerCase();
  const colors: { [key: string]: string } = {
    neutral: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
    happy: 'bg-green-100 text-green-800 hover:bg-green-200',
    sad: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
    surprised: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
    fear: 'bg-purple-100 text-purple-800 hover:bg-purple-200',
    disgust: 'bg-pink-100 text-pink-800 hover:bg-pink-200',
    angry: 'bg-red-100 text-red-800 hover:bg-red-200',
  };
  return colors[emotionStr] || 'bg-gray-100 text-gray-800 hover:bg-gray-200';
};

const getEmotionIcon = (emotion: string | number) => {
  const emotionStr = typeof emotion === 'number' ? emotionMap[emotion] : emotion.toLowerCase();
  const icons: { [key: string]: JSX.Element } = {
    neutral: <TbMoodNeutral className='w-6 h-6' />,
    happy: <HiOutlineEmojiHappy className='w-6 h-6' />,
    sad: <FaRegSadTear className='w-6 h-6' />,
    surprised: <TbMoodSuprised className='w-6 h-6' />,
    fear: <IoMdSad className='w-6 h-6' />,
    disgust: <img src="/api/placeholder/20/20" alt="disgust face" className='w-6 h-6' />,
    angry: <FaRegAngry className='w-6 h-6' />,
  };
  return icons[emotionStr] || <TbMoodNeutral className='w-5 h-5' />;
};

const RecogDetails: React.FC<RecogDetailsProps> = ({ selectedFace }) => {
  if (!selectedFace) return null;

  return (
    <div className='flex flex-col md:flex-row bg-transparent'>
      <div className='md:w-3/5'>
        <img
          src={`${process.env.NEXT_PUBLIC_FLASK_URL}/images/${selectedFace.image_path}`}
          alt='Selected Face'
          className='object-cover w-full h-full rounded-l-lg shadow-md'
        />
      </div>
      <div className='md:w-2/5 p-6 rounded-r-lg bg-white shadow-md'>
        <h2 className='text-2xl font-bold mb-4 text-gray-800'>
          {selectedFace.label}
        </h2>
        <hr />
        <div className='mt-4'>
          <div className='flex items-center hover:bg-gray-100 p-2 rounded-lg transition-colors duration-200'>
            <TbCalendarTime className='w-6 h-6 text-blue-500 mr-2' />
            <span className='text-gray-700'>
              <strong>Tarih:</strong> {new Date(selectedFace.timestamp).toLocaleString("tr-TR")}
            </span>
          </div>
        
        </div>
        <div className='py-2 mb-4 rounded-lg'>
          <ul className='flex flex-col flex-wrap gap-4'>
            <li className='flex items-center hover:bg-gray-100 p-2 rounded-lg transition-colors duration-200'>
              <TbFaceId className='w-6 h-6 text-blue-500 mr-2' />
              <span className='text-gray-700'>
                Benzerlik ~ %{(selectedFace.similarity * 100).toFixed(2)}
              </span>
            </li>
            <li className='flex items-center'>
              <span
                className={`px-2 py-1 rounded-full text-sm font-semibold inline-flex items-center gap-2 transition-colors duration-200 ${getEmotionColor(
                  selectedFace.emotion
                )}`}
              >
                {getEmotionIcon(selectedFace.emotion)}
                {typeof selectedFace.emotion === 'number' 
                  ? emotionMap[selectedFace.emotion] 
                  : selectedFace.emotion}
              </span>
            </li>
            <li className='flex items-center hover:bg-gray-100 p-2 rounded-lg transition-colors duration-200'>
              <User className='w-6 h-6 text-blue-500 mr-2' />
              <span className='text-gray-700'> Yaş ~ {selectedFace.age}</span>
            </li>
            <li className='flex items-center hover:bg-gray-100 p-2 rounded-lg transition-colors duration-200'>
              <PiGenderIntersexFill
                className={`w-6 h-6 mr-2 ${
                  selectedFace.gender === 1 ? 'text-blue-500' : 'text-rose-500'
                }`}
              />
              <span className='text-gray-700'>
                {selectedFace.gender === 1 ? 'Erkek' : 'Kadın'}
              </span>
            </li>
          </ul>
        </div>
        <div className='flex items-center hover:bg-gray-100 p-2 rounded-lg transition-colors duration-200'>
            <TbPhoto className='w-6 h-6 text-blue-500 mr-2' />
            <span className='text-gray-700 truncate'>
              <strong>Fotoğraf Adresi:</strong> {selectedFace.image_path}
            </span>
          </div>
      </div>
    </div>
  );
};

export default RecogDetails;
// import React from 'react';
// import { TbFaceId, TbMoodNeutral, TbMoodSuprised } from 'react-icons/tb';
// import { HiOutlineEmojiHappy } from 'react-icons/hi';
// import { FaRegSadTear, FaRegAngry } from 'react-icons/fa';
// import { IoMdSad } from 'react-icons/io';
// import { User } from 'lucide-react';
// import { PiGenderIntersexFill } from 'react-icons/pi';
// import { RecogFace } from '@/types';

// interface RecogDetailsProps {
//   selectedFace: RecogFace | null;
// }

// const emotionMap: { [key: number]: string } = {
//   0: 'neutral',
//   1: 'happy',
//   2: 'sad',
//   3: 'surprised',
//   4: 'fear',
//   5: 'disgust',
//   6: 'angry',
// };

// const getEmotionColor = (emotion: string | number) => {
//   const emotionStr = typeof emotion === 'number' ? emotionMap[emotion] : emotion.toLowerCase();
//   const colors: { [key: string]: string } = {
//     neutral: 'bg-gray-100 text-gray-800',
//     happy: 'bg-green-100 text-green-800',
//     sad: 'bg-blue-100 text-blue-800',
//     surprised: 'bg-yellow-100 text-yellow-800',
//     fear: 'bg-purple-100 text-purple-800',
//     disgust: 'bg-pink-100 text-pink-800',
//     angry: 'bg-red-100 text-red-800',
//   };
//   return colors[emotionStr] || 'bg-gray-100 text-gray-800';
// };

// const getEmotionIcon = (emotion: string | number) => {
//   const emotionStr = typeof emotion === 'number' ? emotionMap[emotion] : emotion.toLowerCase();
//   const icons: { [key: string]: JSX.Element } = {
//     neutral: <TbMoodNeutral className='w-5 h-5' />,
//     happy: <HiOutlineEmojiHappy className='w-5 h-5' />,
//     sad: <FaRegSadTear className='w-5 h-5' />,
//     surprised: <TbMoodSuprised className='w-5 h-5' />,
//     fear: <IoMdSad className='w-5 h-5' />,
//     disgust: <img src="/api/placeholder/20/20" alt="disgust face" className='w-5 h-5' />,
//     angry: <FaRegAngry className='w-5 h-5' />,
//   };
//   return icons[emotionStr] || <TbMoodNeutral className='w-5 h-5' />;
// };

// const RecogDetails: React.FC<RecogDetailsProps> = ({ selectedFace }) => {
//   if (!selectedFace) return null;

//   return (
//     <div className='flex flex-col md:flex-row bg-transparent'>
//       <div className='md:w-3/5'>
//         <img
//           src={`${process.env.NEXT_PUBLIC_FLASK_URL}/images/${selectedFace.image_path}`}
//           alt='Selected Face'
//           className='object-cover w-full h-full rounded-l-lg shadow-md'
//         />
//       </div>
//       <div className='md:w-2/5 p-6 rounded-r-lg'>
//         <h2 className='text-2xl font-bold mb-4 text-gray-800'>
//           {selectedFace.label}
//         </h2>
//         <div className='bg-gray-50 px-4 py-2 mb-4'>
//           <ul className='flex flex-col flex-wrap gap-4 [&_li]:gap-2'>
//             <li className='flex items-center'>
//               <TbFaceId className='w-6 h-6 text-blue-500' />
//               <span className='text-gray-700'>
//                 Benzerlik ~ %{(selectedFace.similarity * 100).toFixed(2)}
//               </span>
//             </li>
//             <li className='flex items-center'>
//               <span
//                 className={`px-2 py-1 rounded-full text-sm font-semibold inline-flex gap-2 ${getEmotionColor(
//                   selectedFace.emotion
//                 )}`}
//               >
//                 {getEmotionIcon(selectedFace.emotion)}
//                 {typeof selectedFace.emotion === 'number' 
//                   ? emotionMap[selectedFace.emotion] 
//                   : selectedFace.emotion}
//               </span>
//             </li>
//             <li className='flex items-center'>
//               <User className='w-6 h-6 text-blue-500' />
//               <span className='text-gray-700'> Yaş ~ {selectedFace.age}</span>
//             </li>
//             <li className='flex items-center'>
//               <PiGenderIntersexFill
//                 className={`w-6 h-6 ${
//                   selectedFace.gender === 1 ? 'text-blue-500' : 'text-rose-500'
//                 }`}
//               />
//               <span className='text-gray-700'>
//                 {selectedFace.gender === 1 ? 'Erkek' : 'Kadın'}
//               </span>
//             </li>
//           </ul>
//         </div>
//         <div className='space-y-3'>
//           <p><strong>Tarih:</strong> {new Date(selectedFace.timestamp).toLocaleString()}</p>
//           <p><strong>Fotoğraf Adresi:</strong> {selectedFace.image_path}</p>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default RecogDetails;


// import React from 'react';
// import { Divider } from 'primereact/divider';
// import InfoItem from './RecogDetailsInfoItem';
// import { RecogFace } from '@/types';

// interface RecogDetailsProps {
//   selectedFace: RecogFace | null;
// }

// const RecogDetails: React.FC<RecogDetailsProps> = ({ selectedFace }) => {
//   if (!selectedFace) return null;

//   return (
//     <div className='flex flex-col md:flex-row bg-transparent'>
//       <div className='md:w-3/5'>
//         <img
//           src={`${process.env.NEXT_PUBLIC_FLASK_URL}/images/${selectedFace.image_path}`}
//           alt='Selected Face'
//           className='object-cover w-full h-full rounded-l-lg shadow-md'
//         />
//       </div>
//       <div className='md:w-2/5 p-6 rounded-r-lg'>
//         <h2 className='text-2xl font-bold mb-4 text-gray-800'>
//           {selectedFace.label}
//         </h2>
//         <Divider />
//         <div className='space-y-3'>
//           <InfoItem
//             label='Tarih'
//             value={new Date(selectedFace.timestamp).toLocaleString()}
//           />
//           <InfoItem label='Benzerlik' value={selectedFace.similarity} />
//           <InfoItem label='Duygu' value={selectedFace.emotion} />
//           <InfoItem
//             label='Cinsiyet'
//             value={selectedFace.gender == 1 ? 'Erkek' : 'Kadın'}
//           />
//           <InfoItem label='Yaş' value={selectedFace.age} />
//           <InfoItem label='Fotoğraf Adresi' value={selectedFace.image_path} />
//         </div>
//       </div>
//     </div>
//   );
// };

// export default RecogDetails;
