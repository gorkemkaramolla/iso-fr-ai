'use client';
import Link from 'next/link';
import React, { useRef } from 'react';
import Image from 'next/image';
import { Button } from 'primereact/button';
import { AudioLines, Contact, ScanFace, User, Users } from 'lucide-react';
import { Menu } from 'primereact/menu';
import { useRouter } from 'next/navigation';
import SearchComponent from '../search/main-search-component';
interface Props {}

const NavigationBar: React.FC<Props> = () => {
  const router = useRouter();
  const menu = useRef<Menu>(null);
  const profileMenu = useRef<Menu>(null);

  const menuItems = [
    {
      label: 'Konuşma Sentezi',
      icon: () => {
        return <AudioLines className='w-5 mr-1.5 -ml-0.5' />;
      },
      command: () => {
        router.push('/speech');
      },
    },
    {
      label: 'Yüz Tanıma',
      icon: () => {
        return <ScanFace className='w-5 mr-1.5 -ml-0.5' />;
      },
      command: () => {
        router.push('/stream');
      },
    },
    {
      label: 'Tanınan Yüzler',
      icon: () => {
        return <Contact className='w-5 mr-1.5 -ml-0.5' />;
      },
      command: () => {
        router.push('/recog');
      },
    },
    {
      label: 'Video Kayıtları',
      icon: 'pi pi-video',
      command: () => {
        router.push('/records');
      },
    },
    {
      label: 'İzlence',
      icon: 'pi pi-chart-bar',
      command: () => {
        router.push('/monitoring');
      },
    },
  ];

  const profileItems = [
    {
      label: 'Yönetici Paneli',
      icon: 'pi pi-user-plus',
      command: () => {
        router.push('/admin');
      },
    },
    {
      label: 'Personel Ayarları',
      icon: () => {
        return <Users className='w-4 mr-1.5' />;
      },
      command: () => {
        router.push('/settings/personel_settings');
      },
    },
    {
      label: 'Kamera Ayarları',
      icon: 'pi pi-camera',
      command: () => {
        router.push('/settings/camera_settings');
      },
    },
    {
      label: 'Çıkış Yap',
      icon: 'pi pi-sign-out',
      command: () => {
        router.push('/api/logout');
      },
    },
  ];

  return (
    <nav style={{ zIndex: 100 }} className='sticky top-0 bg-white w-full '>
      <div className='navbar h-[7vh] w-full mx-auto container z-40 flex justify-between items-center bg-base-100'>
        <div className='flex justify-center items-center'>
          <Link href={'/'} className='btn-md text-xl'>
            <Image
              width={100}
              height={100}
              src='/logo.svg'
              alt='Logo'
              className='w-full   h-full'
            />
          </Link>
        </div>
        <div className='flex items-center justify-center gap-4'>
          <div>
            <SearchComponent />
          </div>
          <div className='flex items-center space-x-4'>
            <Button
              icon='pi pi-bars'
              className='p-button-rounded p-button-text [&>span]:font-extrabold [&>span]:text-2xl text-black'
              onClick={(event) => menu?.current?.toggle(event)}
            />
            <Menu model={menuItems} popup ref={menu} popupAlignment='right' />
          </div>
          <Button
            tabIndex={0}
            role='button'
            className='btn btn-ghost btn-circle avatar'
            onClick={(event) => profileMenu.current?.toggle(event)}
          >
            <div className='w-8'>
              <User className='w-8 h-8' />
            </div>
          </Button>
          <Menu model={profileItems} popup ref={profileMenu} />
        </div>
      </div>
    </nav>
  );
};

export default NavigationBar;
