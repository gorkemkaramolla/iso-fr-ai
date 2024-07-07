'use client';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import createApi from '@/utils/axios_instance';

const getUsers = async () => {
  const api = createApi(process.env.NEXT_PUBLIC_UTILS_URL);
  const response = await api.get('/personel');
  return response; // Ensure you return the response
};

const Page = () => {
  const [personels, setPersonels] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getUsers();
        setPersonels(res.data);
      } catch (error) {
        console.error('Failed to fetch personels:', error);
      }
    };

    router.refresh();
    fetchData();
  }, []);

  return (
    <div className='py-4 flex w-screen overflow-y-scroll'>
      {JSON.stringify(personels)}
    </div>
  );
};

export default Page;

// export default function Page() {
//   const router = useRouter();

//   return <div>asd</div>;
// }
