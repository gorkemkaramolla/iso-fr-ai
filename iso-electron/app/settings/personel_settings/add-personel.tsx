'use client';
import React, { useState, ChangeEvent, useRef } from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { ConfirmDialog } from 'primereact/confirmdialog';
import { Toast } from 'primereact/toast';
import { z } from 'zod';
import FileUploader from '@/components/FileUploader';
import { useRouter } from 'next/navigation';

interface FormDataState {
  name: string;
  lastname: string;
  title: string;
  address: string;
  phone: string;
  email: string;
  gsm: string;
  resume: string;
  birth_date: string;
  iso_phone: string;
  iso_phone2: string;
  uploadedFile: File | null;
}

const formSchema = z.object({
  name: z.string().nonempty({ message: 'İsim boş bırakılmamalı' }),
  lastname: z.string().nonempty({ message: 'Soyisim boş bırakılmamalı' }),
  title: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email({ message: 'Geçersiz email adresi' }),
  gsm: z
    .string()
    .regex(/^\d+$/, { message: 'GSM sadece rakam içermelidir' })
    .optional(),
  resume: z.string().optional(),
  birth_date: z.string().optional(),
  iso_phone: z.string().optional(),
  iso_phone2: z.string().optional(),
  uploadedFile: z.any().optional(),
});

export default function AddPersonel() {
  const [formData, setFormData] = useState<FormDataState>({
    name: '',
    lastname: '',
    title: '',
    address: '',
    phone: '',
    email: '',
    gsm: '',
    resume: '',
    birth_date: '',
    iso_phone: '',
    iso_phone2: '',
    uploadedFile: null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const toast = useRef<Toast>(null);
  const router = useRouter();

  const showError = (error: string) => {
    toast.current?.show({
      severity: 'error',
      summary: 'Error',
      detail: error,
      life: 3000,
    });
  };

  const showSuccess = (message: string) => {
    toast.current?.show({
      severity: 'success',
      summary: 'Success',
      detail: message,
      life: 3000,
    });
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [id]: value }));
  };

  const handleFileUpload = (file: File) => {
    setFormData((prevData) => ({ ...prevData, uploadedFile: file }));
  };

  const handleSubmit = () => {
    try {
      formSchema.parse(formData);
      setErrors({});

      const apiUrl = `${process.env.NEXT_PUBLIC_UTILS_URL}/personel`;

      const fd = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null) {
          fd.append(key, value as Blob);
        }
      });

      fetch(apiUrl, {
        method: 'POST',
        body: fd,
      })
        .then(async (response) => {
          const data = await response.json();
          if (response.ok) {
            showSuccess(data.message || 'Personel başarıyla eklendi.');
            router.push(`/profiles/${data.data._id}`);
          } else {
            showError(data.message || 'Bir hata oluştu.');
          }
        })
        .catch((error) => {
          showError(error.message || 'Bir hata oluştu.');
        });
    } catch (e) {
      if (e instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        e.errors.forEach((err) => {
          if (err.path && err.path[0]) {
            fieldErrors[err.path[0]] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        showError('An unexpected error occurred');
      }
    }
  };

  return (
    <div className=''>
      <Toast ref={toast}></Toast>

      <div className='flex items-center justify-between p-2'>
        <h1 className='text-xl font-bold'>Personel Ayarları</h1>
        <Button
          onClick={handleSubmit}
          label='Yeni Personel Ekle'
          icon='pi pi-plus'
          className='p-button-sm'
        />
      </div>

      <div className='flex flex-col gap-2'>
        <div className='w-full flex md:flex-row flex-col gap-4'>
          <div className='w-full md:w-1/2'>
            <FileUploader onFileUpload={handleFileUpload} />
          </div>
          <div className='flex-col flex w-full md:w-1/2'>
            <div className='p-field flex flex-wrap gap-2'>
              <div className='flex-1'>
                <label htmlFor='name' className='text-sm'>
                  İsim
                </label>
                <InputText
                  className={`w-full p-1 text-sm ${
                    errors.name ? 'border-red-500' : ''
                  }`}
                  id='name'
                  value={formData.name}
                  onChange={handleChange}
                />
                {errors.name && (
                  <small className='p-error'>{errors.name}</small>
                )}
              </div>
              <div className='flex-1'>
                <label htmlFor='lastname' className='text-sm'>
                  Soyisim
                </label>
                <InputText
                  className={`w-full p-1 text-sm ${
                    errors.lastname ? 'border-red-500' : ''
                  }`}
                  id='lastname'
                  value={formData.lastname}
                  onChange={handleChange}
                />
                {errors.lastname && (
                  <small className='p-error'>{errors.lastname}</small>
                )}
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
                  value={formData.title}
                  onChange={handleChange}
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
                  value={formData.address}
                  onChange={handleChange}
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
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
              <div className='flex-1'>
                <label htmlFor='email' className='text-sm'>
                  Email
                </label>
                <InputText
                  className={`w-full p-1 text-sm ${
                    errors.email ? 'border-red-500' : ''
                  }`}
                  id='email'
                  value={formData.email}
                  onChange={handleChange}
                />
                {errors.email && (
                  <small className='p-error'>{errors.email}</small>
                )}
              </div>
            </div>
            <div className='p-field flex flex-wrap gap-2'>
              <div className='flex-1'>
                <label htmlFor='gsm' className='text-sm'>
                  GSM
                </label>
                <InputText
                  className={`w-full p-1 text-sm ${
                    errors.gsm ? 'border-red-500' : ''
                  }`}
                  id='gsm'
                  value={formData.gsm}
                  onChange={handleChange}
                />
                {errors.gsm && <small className='p-error'>{errors.gsm}</small>}
              </div>
            </div>
            <div className='p-field flex flex-wrap gap-2'>
              <div className='flex-1'>
                <label htmlFor='birth_date' className='text-sm'>
                  Doğum Tarihi
                </label>
                <InputText
                  className='w-full p-1 text-sm'
                  id='birth_date'
                  value={formData.birth_date}
                  type='date'
                  lang='tr'
                  onChange={handleChange}
                />
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
                  value={formData.iso_phone}
                  onChange={handleChange}
                />
              </div>
              <div className='flex-1'>
                <label htmlFor='iso_phone2' className='text-sm'>
                  ISO Telefon 2
                </label>
                <InputText
                  className='w-full p-1 text-sm'
                  id='iso_phone2'
                  value={formData.iso_phone2}
                  onChange={handleChange}
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
                  value={formData.resume}
                  onChange={handleChange}
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
