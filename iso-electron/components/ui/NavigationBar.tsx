import Link from 'next/link';
import React from 'react';
import Image from 'next/image';
// import ElasticSearch from '../utility/ElasticSearch';
import { Button } from 'primereact/button';
import { Settings } from 'lucide-react';
import { deleteCookies } from '@/library/auth/is_authenticated';
import createApi from '@/utils/axios_instance';
interface Props {}

const NavigationBar: React.FC<Props> = () => {
  return (
    <div style={{ zIndex: 100 }} className='sticky top-0 bg-white w-full '>
      <nav className='navbar h-[7vh] w-full  mx-auto container z-40 justify-between bg-base-100 flex '>
        <div className=' navbar-start  '>
          <div className='dropdown'>
            <div
              tabIndex={0}
              role='button'
              className='btn btn-ghost btn-circle'
            >
              <svg
                xmlns='http://www.w3.org/2000/svg'
                className='h-5 w-5'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M4 6h16M4 12h16M4 18h7'
                />
              </svg>
            </div>
            <ul
              tabIndex={0}
              className='menu menu-sm dropdown-content mt-3 z-40 p-2 shadow bg-base-100 rounded-box w-52'
            >
              <li>
                <Link href={'/'}>Ana Sayfa</Link>
              </li>
              <li>
                <Link href={'/speech'}>Ses kayıt</Link>
              </li>
              <li>
                <Link href={'/stream'}>Kameralar</Link>
              </li>
              <li>
                <Link href={'/monitoring'}>İzlence</Link>
              </li>
            </ul>
          </div>
        </div>
        <div className='navbar-center'>
          <Link href={'/'} className=' btn-md   text-xl'>
            <Image
              width={100}
              height={100}
              src='/logo.svg'
              alt='hello'
              className='w-full  h-full'
            />
          </Link>
        </div>
        <div className='navbar-end'>{/* <ElasticSearch /> */}</div>

        <div className='dropdown dropdown-end'>
          <div tabIndex={1} role='button' className='btn btn-ghost btn-circle'>
            <button className='btn btn-ghost btn-circle'>
              <div className='indicator'>
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  className='h-5 w-5'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2'
                    d='M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9'
                  />
                </svg>
                <span className='badge badge-xs badge-primary indicator-item'></span>
              </div>
            </button>
          </div>
          <ul
            tabIndex={0}
            className='menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52'
          >
            Bildirim
          </ul>
        </div>

        <div className='dropdown dropdown-end'>
          <div
            tabIndex={0}
            role='button'
            className='btn btn-ghost btn-circle avatar'
          >
            <div className='w-10 rounded-full'>
              <img alt='Tailwind CSS Navbar component' src='iso_logo.jpg' />
            </div>
          </div>
          <ul
            tabIndex={0}
            className='menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow'
          >
            <li>
              <Link href={'/admin'} className='justify-between'>
                Profile
                <span className='badge'>New</span>
              </Link>
            </li>
            <li>
              <Link href={'/settings'}>Ayarlar</Link>
            </li>
            <li>
              <Link href={'/api/logout'}>Çıkış Yap</Link>
            </li>
          </ul>
        </div>
      </nav>
    </div>
  );
};

export default NavigationBar;
