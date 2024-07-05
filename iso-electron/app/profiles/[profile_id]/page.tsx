import api from '@/utils/axios_instance';
import Link from 'next/link';
import Image from 'next/image';
import React from 'react';
import {
  Heading1,
  GraduationCap,
  Building,
  Building2,
  Globe,
  Mail,
  MapPinnedIcon,
  Phone,
  Printer,
  BriefcaseBusiness,
  Factory,
  Calendar,
  Cake,
  Pin,
} from 'lucide-react';
import createApi from '@/utils/axios_instance';
interface Props {
  params: {
    profile_id: string;
  };
}

const Profile = async ({ params: { profile_id } }: Props) => {
  const api = createApi(process.env.NEXT_PUBLIC_UTILS_URL);
  const person: Person = (await api.get(`/person/${profile_id}`)).data;
  console.log(person);

  return (
    <div className='flex container mx-auto p-2 md:p-8 flex-col w-screen justify-center items-center'>
      <div className='m-4 justify-center md:items-start items-center w-full md:flex-row gap-6 flex-col flex '>
        <div className=' w-full md:w-3/12 flex  justify-center flex-row md:flex-col gap-3 '>
          <div className='flex'>
            <Image
              src={`${process.env.NEXT_PUBLIC_FR_URL}/images${person.image_path}`}
              width={5}
              height={1}
              className='rounded-full md:h-64 md:w-64 w-24 h-24 object-cover'
              alt={`${person.first_name} ${person.last_name}`}
            />
          </div>
          <div className='flex flex-col'>
            <div className='flex flex-col text-sm  justify-center gap-3 '>
              <p className='font-extrabold text-xl'>
                {person.first_name} {person.last_name}
              </p>
            </div>

            <div className='md:text-base flex gap-4'>
              <div>
                Doğum Tarihi:{' '}
                <span className='flex items-center justify-center gap-2'>
                  <Cake size={22} />
                  {person.birth_date}
                </span>
              </div>
              <div>
                Doğum Yeri:{' '}
                <span className='flex items-center gap-2'>
                  <MapPinnedIcon size={22} />
                  Atakum,Samsun
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className='w-9/12 flex flex-col p-2 md:py-8 gap-4 md:px-8 item-center  '>
          <div className='flex flex-col gap-4'>
            <div className='flex flex-col gap-2'>
              <div className='flex items-center gap-2'>
                <Factory size={24} />
                55. Grup - Deniz,Hava ve Demiryolu Ana ve Yan Sanayii
              </div>
              <div className='flex items-center gap-2'>
                <Building2 size={24} />
                ADA DENİZCİLİK VE TERSANE İŞLETMECİLİĞİ ANONİM ŞİRKETİ
              </div>
              <div className='flex items-center gap-2'>
                <MapPinnedIcon />
                AYDINTEPE MAHALLESİ GÜZİN SOKAK NO:1 İÇMELER İSTANBUL TUZLA
              </div>
              <div className='flex gap-4'>
                <div className='flex items-center gap-2'>
                  <Phone />
                  902164474901
                </div>
                <div className='flex items-center gap-2'>
                  <Printer />
                  902164474910
                </div>
              </div>
            </div>
            <div className='flex items-center gap-2'>
              <Globe size={24} />
              <Link
                className='text-blue-400'
                target='_blank'
                href='https://www.google.com'
              >
                www.google.com
              </Link>
              <Mail />
              <Link
                className='text-blue-400'
                target='_blank'
                href='https://www.google.com'
              >
                gorkemkaramolla@gmail.com
              </Link>
            </div>

            <div className='flex items-center gap-2'>
              <GraduationCap size={24} />
              <p>NİŞANTAŞI UNIVERSITESI</p>
            </div>

            {/* <div>Temsilci ID : 123124151</div>
            <div>TC Kimlik No: 3354353252352</div> */}
          </div>
          <h2 className='font-extrabold text-2xl'>Özgeçmiş</h2>
          <p>{person.biography}</p>
        </div>
      </div>
    </div>
  );
};

export default Profile;
