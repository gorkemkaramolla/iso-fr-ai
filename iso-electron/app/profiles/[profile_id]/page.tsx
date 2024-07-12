import createApi from '@/utils/axios_instance';
import { formatDate } from '@/utils/formatDate';
import { Mail, Phone, MapPin, Briefcase, Calendar, Globe } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface Props {
  params: {
    profile_id: string;
  };
}

export default async function Profile({ params: { profile_id } }: Props) {
  const api = createApi(process.env.NEXT_PUBLIC_UTILS_URL);
  const response = await api.get(`/personel/${profile_id}`);
  const personel: Personel = response.data;

  return (
    <div className=' container mx-auto flex px-4 sm:px-6 lg:px-8'>
      <div className='w-full max-w-4xl mx-auto bg-white shadow-xl rounded-lg overflow-hidden'>
        <div className='bg-gradient-to-r from-blue-600 to-indigo-700 h-32'></div>
        <div className='relative px-6 -mt-20 pb-8'>
          <div className='flex flex-col items-center'>
            <Image
              alt={`${personel.name} ${personel.lastname}`}
              src={`${process.env.NEXT_PUBLIC_UTILS_URL}/personel/image/?id=${personel._id}`}
              width={140}
              height={140}
              className='rounded-full border-4 aspect-video border-white shadow-lg w-64 h-64'
            />
            <h1 className='mt-4 text-3xl font-bold text-gray-900'>
              {personel.name} {personel.lastname}
            </h1>
            <p className='text-xl text-gray-600 mt-1'>{personel.title}</p>
          </div>

          <div className='mt-8 grid grid-cols-1 md:grid-cols-2 gap-6'>
            <InfoSection title='Contact Information'>
              <InfoItem icon={<Mail />} label='Email'>
                {personel.email}
              </InfoItem>
              <InfoItem icon={<Phone />} label='Phone'>
                {personel.phone}
              </InfoItem>
              <InfoItem icon={<Phone />} label='GSM'>
                {personel.gsm}
              </InfoItem>
              <InfoItem icon={<MapPin />} label='Address'>
                {personel.address}
              </InfoItem>
            </InfoSection>

            <InfoSection title='Additional Details'>
              <InfoItem icon={<Calendar />} label='Birth Date'>
                {formatDate(personel.birth_date)}
              </InfoItem>
              <InfoItem icon={<Globe />} label='ISO Phone'>
                {personel.iso_phone}
              </InfoItem>
              <InfoItem icon={<Globe />} label='ISO Phone 2'>
                {personel.iso_phone2}
              </InfoItem>
            </InfoSection>
          </div>

          <InfoSection title='Resume'>
            <div className='bg-gray-50 p-4 rounded-lg text-gray-700 leading-relaxed'>
              <Briefcase className='inline-block w-5 h-5 mr-2 text-blue-600' />
              <p className='inline'>{personel.resume}</p>
            </div>
          </InfoSection>

          <div className='mt-8 flex justify-center'>
            <Link href={`/edit/${personel._id}`}>
              <button className='bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-full transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50'>
                Edit Profile
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className='text-xl font-semibold text-gray-800 mb-4'>{title}</h2>
      <div className='space-y-3'>{children}</div>
    </div>
  );
}

function InfoItem({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className='flex items-center text-gray-700'>
      <div className='mr-3 text-blue-600'>{icon}</div>
      <div>
        <p className='font-medium'>{label}</p>
        <p className='text-gray-600'>{children}</p>
      </div>
    </div>
  );
}
