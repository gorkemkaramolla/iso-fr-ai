'use client';

import React from 'react';
import Link from 'next/link';
import { Panel } from 'primereact/panel';
import { Button } from 'primereact/button';
import 'primereact/resources/themes/lara-light-indigo/theme.css'; //theme
import 'primereact/resources/primereact.min.css'; //core css
import 'primeicons/primeicons.css'; //icons
import { Camera, User } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SettingsPage() {
  return (
    <motion.div
      className='container mx-auto flex flex-col gap-4 h-[92vh] overflow-hidden p-4'
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Panel header='Ayarlar' className='h-full overflow-y-scroll'>
        <div className='flex flex-col gap-4'>
          <Link href='/settings/camera_settings'>
            <Button
              icon={<Camera className='h-5 w-5' />}
              label='Kamera Ayarları'
              className='p-button-text p-button-plain gap-2 w-full text-left items-center flex'
            />
          </Link>
          <Link href='/settings/personel_settings'>
            <Button
              icon={<User className='h-5 w-5' />}
              label='Personel Ayarları'
              className='p-button-text flex gap-2 items-center p-button-plain w-full text-left'
            />
          </Link>
        </div>
      </Panel>
    </motion.div>
  );
}
