import React from 'react';
import { Divider } from 'primereact/divider';
import InfoItem from './RecogDetailsInfoItem';

interface RecogDetailsProps {
  selectedFace: RecogFace | null;
}

const RecogDetails: React.FC<RecogDetailsProps> = ({ selectedFace }) => {
  if (!selectedFace) return null;

  return (
    <div className='flex flex-col md:flex-row'>
      <div className='md:w-3/5'>
        <img
          src={`${process.env.NEXT_PUBLIC_FLASK_URL}/images/${selectedFace.image_path}`}
          alt='Selected Face'
          className='object-cover w-full h-full rounded-l-lg shadow-md'
        />
      </div>
      <div className='md:w-2/5 p-6 bg-gray-50 rounded-r-lg'>
        <h2 className='text-2xl font-bold mb-4 text-gray-800'>
          {selectedFace.label}
        </h2>
        <Divider />
        <div className='space-y-3'>
          <InfoItem
            label='Tarih'
            value={new Date(selectedFace.timestamp).toLocaleString()}
          />
          <InfoItem label='Benzerlik' value={selectedFace.similarity} />
          <InfoItem label='Duygu' value={selectedFace.emotion} />
          <InfoItem
            label='Cinsiyet'
            value={selectedFace.gender == 1 ? 'Erkek' : 'Kadın'}
          />
          <InfoItem label='Yaş' value={selectedFace.age} />
          <InfoItem label='Fotoğraf Adresi' value={selectedFace.image_path} />
        </div>
      </div>
    </div>
  );
};

export default RecogDetails;
