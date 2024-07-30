'use client';

import React, { useEffect, useRef, useState, FormEvent } from 'react';
import { User, KeySquare } from 'lucide-react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { loginSchema, LoginData } from '@/library/validation';
import useStore from '@/library/store';
import Image from 'next/image';
import { Toast } from 'primereact/toast';
import { ZodError } from 'zod';

export default function LoginForm() {
  const router = useRouter();
  const { setAccessToken, setRefreshToken } = useStore();
  const toastRef = useRef<Toast>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    router.refresh();
  }, [router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const formValues: LoginData = {
      username: formData.get('username') as string,
      password: formData.get('password') as string,
    };

    // Validate form data using Zod
    try {
      loginSchema.parse(formValues);
      setErrors({});
    } catch (error) {
      if (error instanceof ZodError) {
        const fieldErrors: { [key: string]: string } = {};
        error.errors.forEach((err) => {
          if (err.path) {
            fieldErrors[err.path[0]] = err.message;
          }
        });
        setErrors(fieldErrors);
        return;
      }
    }

    try {
      // Post data to the server if validation is successful
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_SIDE_URL}/login`,
        formValues
      );
      if (response.status === 200) {
        setAccessToken(response.data.access_token);
        setRefreshToken(response.data.refresh_token);
        toastRef.current?.show({
          severity: 'success',
          summary: 'Success',
          detail: 'Login successful',
          life: 3000,
        });
        router.push('/'); // Redirect to home page
      }
    } catch (error) {
      toastRef.current?.show({
        severity: 'error',
        summary: 'Login Error',
        detail: 'Invalid username or password.',
        life: 3000,
      });
      console.error('Login error:', error);
    }
  };

  return (
    <div className='w-full h-[100dvh] flex justify-center items-center bg-gradient-to-r from-indigo-600 to-blue-500'>
      <Toast ref={toastRef} />
      <div className='flex w-full  justify-center flex-col items-center'>
        <div className='card card-compact items-center bg-white shadow-2xl p-12 rounded-lg'>
          <Image
            alt='Logo'
            className='rounded-full mb-6'
            width={150}
            height={150}
            src={'/iso_logo.jpg'}
          />

          <form className='w-80' onSubmit={handleSubmit}>
            <div className='mb-4'>
              <label className='block text-sm font-medium text-gray-700'>
                Username
              </label>
              <div className='mt-1 relative rounded-md shadow-sm'>
                <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                  <User className='text-gray-400' />
                </div>
                <input
                  name='username'
                  type='text'
                  className={`input input-bordered pl-10 w-full ${
                    errors.username ? 'input-error' : ''
                  }`}
                  placeholder='Username'
                />
                {errors.username && (
                  <p className='text-red-500 text-xs mt-1'>{errors.username}</p>
                )}
              </div>
            </div>

            <div className='mb-6'>
              <label className='block text-sm font-medium text-gray-700'>
                Password
              </label>
              <div className='mt-1 relative rounded-md shadow-sm'>
                <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                  <KeySquare className='text-gray-400' />
                </div>
                <input
                  name='password'
                  type='password'
                  className={`input input-bordered pl-10 w-full ${
                    errors.password ? 'input-error' : ''
                  }`}
                  placeholder='Password'
                />
                {errors.password && (
                  <p className='text-red-500 text-xs mt-1'>{errors.password}</p>
                )}
              </div>
            </div>

            <button type='submit' className='btn btn-primary w-full'>
              Submit
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
