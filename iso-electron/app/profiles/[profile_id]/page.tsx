import api from '@/utils/axios_instance';
import { Heading1 } from 'lucide-react';
import Image from 'next/image';
import React from 'react';

interface Props {
  params: {
    profile_id: string;
  };
}

const Profile = async ({ params: { profile_id } }: Props) => {
  const person: Person = (await api.get(`/person/${profile_id}`)).data;
  console.log(person);

  return (
    <div className='flex container mx-auto p-2 md:p-8 flex-col w-screen justify-center items-center'>
      <div className='m-4 justify-center md:items-start items-center w-full md:flex-row gap-6 flex-col flex '>
        <div className=' w-full md:w-3/12 flex  justify-center flex-row md:flex-col gap-3 '>
          <div className='flex'>
            <Image
              src={`${process.env.NEXT_PUBLIC_FLASK_URL}/images${person.image_path}`}
              width={5}
              height={1}
              className='rounded-full md:h-64 md:w-64 w-24 h-24 object-cover'
              alt={`${person.first_name} ${person.last_name}`}
            />
          </div>
          <div className='flex flex-col'>
            <div className='flex flex-col text-sm  justify-center gap-3 '>
              <p className='font-extrabold text-xl'>GÖRKEM KARAMOLLA</p>
            </div>

            <div className='md:text-base '>
              <div>
                Doğum Tarihi: <span>{person.birth_date}</span>
              </div>
              <div>
                <label>
                  Email: <span>{person.email}</span>
                </label>
              </div>
            </div>
          </div>
        </div>
        <div className='w-9/12 flex flex-col p-2 md:py-8 gap-4 md:px-8 item-center  '>
          <h2 className='font-extrabold text-2xl'>Özgeçmiş</h2>
          <p>{person.biography}</p>
        </div>
      </div>
    </div>
  );
};

export default Profile;
