'use client';

import React, { useEffect } from 'react';
import { User, KeySquare } from 'lucide-react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { loginSchema, LoginData } from '@/library/validation';
import { FormEvent } from 'react';
import useStore from '@/library/store';

export default function LoginForm() {
  const router = useRouter();
  const { setAccessToken, setRefreshToken } = useStore();
  useEffect(() => {
    router.refresh();
  }, []);
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const formValues: LoginData = {
      username: formData.get('username') as string,
      password: formData.get('password') as string,
    };

    try {
      // Validate form data using Zod
      const result = loginSchema.parse(formValues);

      // Post data to the server if validation is successful
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_SIDE_URL}/login`,
        result
      );
      if (response.data.status === 200) {
        setAccessToken(response.data.access_token);
        setRefreshToken(response.data.refresh_token);
        router.push('/'); // Redirect to home page
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  return (
    <div className='w-full h-[93vh] flex justify-center items-center'>
      <form
        className='card card-compact w-96 bg-base-100 shadow-lg p-4 flex flex-col gap-3'
        onSubmit={handleSubmit}
      >
        <label className='input input-bordered flex items-center gap-2'>
          <User />
          <input
            name='username'
            type='text'
            className='grow'
            placeholder='Username'
          />
        </label>
        <label className='input input-bordered flex items-center gap-2'>
          <KeySquare />
          <input
            name='password'
            type='password'
            className='grow'
            placeholder='Password'
          />
        </label>
        <button type='submit' className='btn btn-primary'>
          Submit
        </button>
      </form>
    </div>
  );
}
