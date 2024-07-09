'use client';
import React, { useState } from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { ConfirmDialog } from 'primereact/confirmdialog';
import { Calendar } from 'primereact/calendar';
import FileUploader from '@/components/FileUploader';

export default function Page() {
  const [name, setName] = useState('');
  const [lastname, setLastname] = useState('');
  const [title, setTitle] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gsm, setGsm] = useState('');
  const [resume, setResume] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [isoPhone, setIsoPhone] = useState('');
  const [isoPhone2, setIsoPhone2] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const handleFileUpload = (files: React.SetStateAction<never[]>) => {
    setUploadedFiles(files);
  };

  const handleSubmit = () => {
    console.log('Yeni Personel Ekle');
    const apiUrl = `${process.env.NEXT_PUBLIC_UTILS_URL}/personel`;
    const solrUrl = `${process.env.NEXT_PUBLIC_UTILS_URL}/add_to_solr`;

    const formData = new FormData();
    formData.append('name', name);
    formData.append('lastname', lastname);
    formData.append('title', title);
    formData.append('address', address);
    formData.append('phone', phone);
    formData.append('email', email);
    formData.append('gsm', gsm);
    formData.append('resume', resume);
    formData.append('birth_date', birthDate);
    formData.append('iso_phone', isoPhone);
    formData.append('iso_phone2', isoPhone2);

    uploadedFiles.forEach((file) => {
      formData.append('files', file);
    });

    fetch(apiUrl, {
      method: 'POST',
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        console.log('Personel API response:', data);

        // After successfully adding personel, add to Solr
        fetch(solrUrl, {
          method: 'POST',
          body: formData,
        })
          .then((response) => response.json())
          .then((data) => {
            console.log('Solr API response:', data);
          })
          .catch((error) => {
            console.error('Error adding to Solr:', error);
          });
      })
      .catch((error) => {
        console.error('Error adding personel:', error);
      });
  };

  return (
    <div className=''>
      <div className='flex items-center  justify-between p-2'>
        <h1 className='text-xl font-bold'>Personel Ayarları</h1>
        <Button
          onClick={handleSubmit}
          color='help'
          label='Yeni Personel Ekle'
          icon='pi pi-plus'
          className='p-button-sm'
        />
      </div>

      <div className='flex flex-col gap-2'>
        <div className='w-full flex md:flex-row flex-col gap-4 '>
          <div className=' w-full md:w-1/2 '>
            <FileUploader onFileUpload={handleFileUpload} />
          </div>
          <div className='flex-col flex w-full md:w-1/2'>
            <div className='p-field flex flex-wrap gap-2'>
              <div className='flex-1'>
                <label htmlFor='name' className='text-sm'>
                  İsim
                </label>
                <InputText
                  className='w-full p-1 text-sm'
                  id='name'
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className='flex-1'>
                <label htmlFor='lastname' className='text-sm'>
                  Soyisim
                </label>
                <InputText
                  className='w-full p-1 text-sm'
                  id='lastname'
                  value={lastname}
                  onChange={(e) => setLastname(e.target.value)}
                />
              </div>
            </div>
            <div className='p-field flex flex-wrap gap-2'>
              <div className='flex-1'>
                <label htmlFor='title' className='text-sm'>
                  Unvan
                </label>
                <InputText
                  className='w-full p-1 text-sm'
                  id='title'
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
            </div>

            <div className='p-field flex flex-wrap gap-2'>
              <div className='flex-1'>
                <label htmlFor='address' className='text-sm'>
                  Adres
                </label>
                <InputTextarea
                  className='w-full p-1 text-sm'
                  id='address'
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
            </div>
            <div className='p-field flex flex-wrap gap-2'>
              <div className='flex-1'>
                <label htmlFor='phone' className='text-sm'>
                  Telefon
                </label>
                <InputText
                  className='w-full p-1 text-sm'
                  id='phone'
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className='flex-1'>
                <label htmlFor='email' className='text-sm'>
                  Email
                </label>
                <InputText
                  className='w-full p-1 text-sm'
                  id='email'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className='p-field flex flex-wrap gap-2'>
              <div className='flex-1'>
                <label htmlFor='gsm' className='text-sm'>
                  GSM
                </label>
                <InputText
                  className='w-full p-1 text-sm'
                  id='gsm'
                  value={gsm}
                  onChange={(e) => setGsm(e.target.value)}
                />
              </div>
              <div className='p-field flex flex-wrap gap-2'>
                <div className='flex-1'>
                  <label htmlFor='birth_date' className='text-sm'>
                    Doğum Tarihi
                  </label>
                  <InputText
                    className='w-full p-1 text-sm'
                    id='birth_date'
                    value={birthDate}
                    type='date'
                    lang='tr'
                    onChange={(e) => setBirthDate(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className='p-field flex flex-wrap gap-2'>
              <div className='flex-1'>
                <label htmlFor='iso_phone' className='text-sm'>
                  ISO Telefon 1
                </label>
                <InputText
                  className='w-full p-1 text-sm'
                  id='iso_phone'
                  value={isoPhone}
                  onChange={(e) => setIsoPhone(e.target.value)}
                />
              </div>
              <div className='flex-1'>
                <label htmlFor='iso_phone2' className='text-sm'>
                  ISO Telefon 2
                </label>
                <InputText
                  className='w-full p-1 text-sm'
                  id='iso_phone2'
                  value={isoPhone2}
                  onChange={(e) => setIsoPhone2(e.target.value)}
                />
              </div>
            </div>
            <div className='p-field flex flex-wrap gap-2'>
              <div className='flex-1'>
                <label htmlFor='resume' className='text-sm'>
                  Özgeçmiş
                </label>
                <InputTextarea
                  className='w-full p-1 text-sm'
                  id='resume'
                  value={resume}
                  onChange={(e) => setResume(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <ConfirmDialog />
    </div>
  );
}
