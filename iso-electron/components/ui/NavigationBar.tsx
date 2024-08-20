// 'use client';
'use client';
import React, { useRef, useState } from 'react';
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Button,
  AvatarIcon,
  NavbarMenuToggle,
  NavbarMenu,
  NavbarMenuItem,
} from '@nextui-org/react';
import { useRouter } from 'next/navigation';
import { AudioLines, Contact, ScanFace, User, Users } from 'lucide-react';
import Image from 'next/image';
import { handleLogout } from '@/utils/logout';
import { Menu } from 'primereact/menu';
import SearchComponent from '../search/main-search-component';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
export default function App() {
  const router = useRouter();
  const profileMenu = useRef<Menu>(null);
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuItems = [
    {
      label: 'Konuşma Sentezi',
      icon: () => {
        return <AudioLines className='w-5 mr-1.5 -ml-0.5' />;
      },
      command: () => {
        router.push('/speech');
      },
      href: '/speech',
    },
    {
      label: 'Yüz Tanıma',
      icon: () => {
        return <ScanFace className='w-5 mr-1.5 -ml-0.5' />;
      },
      command: () => {
        router.push('/stream');
      },
      href: '/stream',
    },
    {
      label: 'Tanınan Yüzler',
      icon: () => {
        return <Contact className='w-5 mr-1.5 -ml-0.5' />;
      },
      command: () => {
        router.push('/recog');
      },
      href: '/recog',
    },
    {
      label: 'Video Kayıtları',
      icon: () => <i className='pi pi-video pr-2'></i>,
      command: () => {
        router.push('/records');
      },
      href: '/records',
    },
    {
      label: 'İzlence',
      icon: () => <i className='pi pi-chart-bar pr-2'></i>,
      command: () => {
        router.push('/monitoring');
      },
      href: '/monitoring',
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
        handleLogout(router);
      },
    },
  ];
  return (
    <Navbar
      classNames={{
        item: [
          'flex',
          'relative',
          'h-full',
          'items-center',
          "data-[active=true]:after:content-['']",
          'data-[active=true]:after:absolute',
          'data-[active=true]:after:bottom-0',
          'data-[active=true]:after:left-0',
          'data-[active=true]:after:right-0',
          'data-[active=true]:after:h-[2px]',
          'data-[active=true]:after:rounded-[2px]',
          'data-[active=true]:after:bg-primary',
        ],
      }}
      isMenuOpen={isMenuOpen}
      onMenuOpenChange={setIsMenuOpen}
    >
      <NavbarContent justify='start'>
        <NavbarMenuToggle
          className='sm:hidden'
          aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
          // onClick={() => setIsMenuOpen(!isMenuOpen)}
        />

        <NavbarBrand>
          <Link href={'/'} className='btn-md text-xl'>
            <Image
              width={100}
              height={100}
              src='/logo.svg'
              alt='Logo'
              className='w-10 h-10 min-h-10 min-w-10'
            />
          </Link>
        </NavbarBrand>
      </NavbarContent>
      <NavbarContent className='hidden sm:flex gap-4' justify='center'>
        {menuItems.map((item, index) => (
          <NavbarItem key={index} isActive={pathname === item.href}>
            <Link
              // color={pathname == item.href ? 'foreground' : 'warning'}
              href={item.href}
              aria-current={pathname === item.href ? 'page' : undefined}
              className={`${
                pathname == item.href ? 'text-[rgb(56,0,255)]' : ''
              } flex items-center`}
              title={item.label}
            >
              <span className='inline-flex'>{item.icon()}</span>
              <span className='hidden lg:inline-flex'>{item.label}</span>
            </Link>
          </NavbarItem>
        ))}
        {/* <NavbarItem isActive={pathname === '/speech'}>
          <Link
            color={pathname !== '/speech' ? 'foreground' : 'warning'}
            href='/speech'
            aria-current={pathname === '/speech' ? 'page' : undefined}
            className='flex items-center gap-1'
          >
            <span className='inline-flex '>
              <AudioLines className='w-5 mr-1.5 -ml-0.5' />
            </span>
            <span className='inline-flex'>Konuşma Sentezi</span>
          </Link>
        </NavbarItem>
        <NavbarItem isActive={pathname === '/stream'}>
          <Link
            color={pathname !== '/stream' ? 'foreground' : 'warning'}
            href='/stream'
            aria-current={pathname === '/stream' ? 'page' : undefined}
            className='flex items-center gap-1'
          >
            <span>
              <ScanFace className='w-5 mr-1.5 -ml-0.5' />
            </span>
            <span>Yüz Tanıma</span>
          </Link>
        </NavbarItem>
        <NavbarItem isActive={pathname === '/recog'}>
          <Link
            color={pathname !== '/recog' ? 'foreground' : 'warning'}
            href='/recog'
            aria-current={pathname === '/recog' ? 'page' : undefined}
            className='flex items-center gap-1'
          >
            <span>
              <Contact className='w-5 mr-1.5 -ml-0.5' />
            </span>
            <span>Tanınan Yüzler</span>
          </Link>
        </NavbarItem>
        <NavbarItem isActive={pathname === '/records'}>
          <Link
            color={pathname !== '/records' ? 'foreground' : 'warning'}
            href='/records'
            aria-current={pathname === '/records' ? 'page' : undefined}
            className='flex items-center gap-2'
          >
            <i className='pi pi-video'></i>
            Video Kayıtları
          </Link>
        </NavbarItem>
        <NavbarItem isActive={pathname === '/monitoring'}>
          <Link
            color={pathname !== '/monitoring' ? 'foreground' : 'warning'}
            href='/monitoring'
            aria-current={pathname === '/monitoring' ? 'page' : undefined}
            className='flex items-center gap-2'
          >
            <i className='pi pi-chart-bar'></i>
            İzlence
          </Link>
        </NavbarItem> */}
      </NavbarContent>
      <NavbarContent justify='end' className=''>
        <SearchComponent />
        <Button
          tabIndex={0}
          role='button'
          onClick={(event) => profileMenu.current?.toggle(event)}
          variant='light'
          isIconOnly
        >
          <AvatarIcon />
        </Button>
        <Menu model={profileItems} popup ref={profileMenu} />
        {/* <NavbarItem className='hidden lg:flex'>
          <Link href='#'>Login</Link>
        </NavbarItem>
        <NavbarItem>
          <Button as={Link} color='primary' href='#' variant='flat'>
            Sign Up
          </Button>
        </NavbarItem> */}
      </NavbarContent>
      <NavbarMenu>
        {menuItems.map((item, index) => (
          <NavbarMenuItem key={`${item}-${index}`}>
            <Link
              href={item.href}
              aria-current={pathname === item.href ? 'page' : undefined}
              className={`${
                pathname == item.href ? 'text-[rgb(56,0,255)]' : ''
              } w-full flex items-center gap-2`}
              title={item.label}
              onClick={() => setIsMenuOpen(false)}
            >
              {item.icon()}
              {item.label}
            </Link>
          </NavbarMenuItem>
        ))}
      </NavbarMenu>
    </Navbar>
  );
}

// import Link from 'next/link';
// import React, { useRef } from 'react';
// import Image from 'next/image';
// import { Button } from 'primereact/button';
// import { AudioLines, Contact, ScanFace, User, Users } from 'lucide-react';
// import { Menu } from 'primereact/menu';
// import { useRouter } from 'next/navigation';
// import SearchComponent from '../search/main-search-component';
// import { handleLogout } from '@/utils/logout';
// interface Props {}

// const NavigationBar: React.FC<Props> = () => {
//   const router = useRouter();
//   const menu = useRef<Menu>(null);
//   const profileMenu = useRef<Menu>(null);

//   const menuItems = [
//     {
//       label: 'Konuşma Sentezi',
//       icon: () => {
//         return <AudioLines className='w-5 mr-1.5 -ml-0.5' />;
//       },
//       command: () => {
//         router.push('/speech');
//       },
//     },
//     {
//       label: 'Yüz Tanıma',
//       icon: () => {
//         return <ScanFace className='w-5 mr-1.5 -ml-0.5' />;
//       },
//       command: () => {
//         router.push('/stream');
//       },
//     },
//     {
//       label: 'Tanınan Yüzler',
//       icon: () => {
//         return <Contact className='w-5 mr-1.5 -ml-0.5' />;
//       },
//       command: () => {
//         router.push('/recog');
//       },
//     },
//     {
//       label: 'Video Kayıtları',
//       icon: 'pi pi-video',
//       command: () => {
//         router.push('/records');
//       },
//     },
//     {
//       label: 'İzlence',
//       icon: 'pi pi-chart-bar',
//       command: () => {
//         router.push('/monitoring');
//       },
//     },
//   ];

//   const profileItems = [
//     {
//       label: 'Yönetici Paneli',
//       icon: 'pi pi-user-plus',
//       command: () => {
//         router.push('/admin');
//       },
//     },
//     {
//       label: 'Personel Ayarları',
//       icon: () => {
//         return <Users className='w-4 mr-1.5' />;
//       },
//       command: () => {
//         router.push('/settings/personel_settings');
//       },
//     },
//     {
//       label: 'Kamera Ayarları',
//       icon: 'pi pi-camera',
//       command: () => {
//         router.push('/settings/camera_settings');
//       },
//     },
//     {
//       label: 'Çıkış Yap',
//       icon: 'pi pi-sign-out',
//       command: () => {
//         handleLogout(router);
//       },
//     },
//   ];

//   return (
//     <nav style={{ zIndex: 100 }} className='sticky top-0 bg-white w-full '>
//       <div className='navbar h-[7vh] w-full mx-auto container z-40 flex justify-between items-center bg-base-100'>
//         <div className='flex justify-center items-center'>
//           <Link href={'/'} className='btn-md text-xl'>
//             <Image
//               width={100}
//               height={100}
//               src='/logo.svg'
//               alt='Logo'
//               className='w-full   h-full'
//             />
//           </Link>
//         </div>
//         <div className='flex items-center justify-center gap-4'>
//           <div>
//             <SearchComponent />
//           </div>
//           <div className='flex items-center space-x-4'>
//             <Button
//               icon='pi pi-bars'
//               className='p-button-rounded p-button-text [&>span]:font-extrabold [&>span]:text-2xl text-black'
//               onClick={(event) => menu?.current?.toggle(event)}
//             />
//             <Menu model={menuItems} popup ref={menu} popupAlignment='right' />
//           </div>
//           <Button
//             tabIndex={0}
//             role='button'
//             className='btn btn-ghost btn-circle avatar'
//             onClick={(event) => profileMenu.current?.toggle(event)}
//           >
//             <div className='w-8'>
//               <User className='w-8 h-8' />
//             </div>
//           </Button>
//           <Menu model={profileItems} popup ref={profileMenu} />
//         </div>
//       </div>
//     </nav>
//   );
// };

// export default NavigationBar;
