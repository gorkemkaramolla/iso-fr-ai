'use client';

import React, { useState, useRef, ChangeEvent } from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { Dialog } from 'primereact/dialog';

import { z } from 'zod';
import FileUploader from '@/components/FileUploader';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/card';
import { InputTextarea } from 'primereact/inputtextarea';

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
  email: z.string().email({ message: 'Geçersiz email adresi' }),
  phone: z.string().optional(),
  gsm: z
    .string()
    .regex(/^\d+$/, { message: 'GSM sadece rakam içermelidir' })
    .optional(),
  address: z.string().optional(),
  title: z.string().optional(),
  resume: z.string().optional(),
  birth_date: z.string().optional(),
  iso_phone: z.string().optional(),
  iso_phone2: z.string().optional(),
  uploadedFile: z.any().optional(),
});

interface AddPersonelDialogProps {
  isModalOpen: boolean;
  setIsModalOpen: (isOpen: boolean) => void;
}

export default function AddPersonelDialog({
  isModalOpen,
  setIsModalOpen,
}: AddPersonelDialogProps) {
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
  const [errors, setErrors] = useState<
    Partial<Record<keyof FormDataState, string>>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useRef<Toast>(null);
  const router = useRouter();

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      formSchema.parse(formData);
      setErrors({});

      const fd = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null) fd.append(key, value as string | Blob);
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_UTILS_URL}/personel`,
        {
          method: 'POST',
          body: fd,
        }
      );
      const data = await response.json();
      if (response.ok) {
        toast.current?.show({
          severity: 'success',
          summary: 'Success',
          detail: data.message || 'Personel başarıyla eklendi.',
          life: 3000,
        });

        // Send a request to update the database
        const updateResponse = await fetch(
          `${process.env.NEXT_PUBLIC_FLASK_URL}/update_database_with_id`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ personnel_id: data.data._id }),
          }
        );

        if (updateResponse.ok) {
          console.log('Database updated successfully');
        } else {
          console.error('Failed to update the database');
        }

        router.push(`/profiles?id=${data.data._id}`);
        setIsModalOpen(false);
      } else {
        throw new Error(data.message || 'Bir hata oluştu.');
      }
    } catch (e) {
      if (e instanceof z.ZodError) {
        const fieldErrors: Partial<Record<keyof FormDataState, string>> = {};
        e.errors.forEach((err) => {
          if (err.path[0])
            fieldErrors[err.path[0] as keyof FormDataState] = err.message;
        });
        setErrors(fieldErrors);
      } else if (e instanceof Error) {
        toast.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: e.message,
          life: 3000,
        });
      } else {
        toast.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'An unexpected error occurred',
          life: 3000,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      header='Yeni Kullanıcı Ekle'
      visible={isModalOpen}
      onHide={() => setIsModalOpen(false)}
      style={{ width: '50vw' }}
    >
      <Toast ref={toast} />
      <Card>
        <FileUploader
          onFileUpload={(file: File) =>
            setFormData((prev) => ({ ...prev, uploadedFile: file }))
          }
        />
        {(Object.keys(formData) as Array<keyof FormDataState>).map((field) => {
          if (field === 'uploadedFile') return null;
          if (field === 'address' || field === 'resume') {
            return (
              <div key={field}>
                <label
                  htmlFor={field}
                  className='block text-sm font-medium text-gray-700 mb-1'
                >
                  {field.charAt(0).toUpperCase() + field.slice(1)}
                </label>
                <InputTextarea
                  id={field}
                  value={formData[field]}
                  onChange={handleChange}
                  rows={3}
                  className='w-full p-2 border border-gray-300 rounded-md'
                />
                {errors[field] && (
                  <p className='mt-1 text-sm text-red-500'>{errors[field]}</p>
                )}
              </div>
            );
          }
          return (
            <div key={field}>
              <label
                htmlFor={field}
                className='block text-sm font-medium text-gray-700 mb-1'
              >
                {field.charAt(0).toUpperCase() + field.slice(1)}
              </label>
              <InputText
                id={field}
                value={formData[field]}
                onChange={handleChange}
                className={`w-full p-2 border rounded-md ${
                  errors[field] ? 'border-red-500' : 'border-gray-300'
                }`}
                type={field === 'birth_date' ? 'date' : 'text'}
              />
              {errors[field] && (
                <p className='mt-1 text-sm text-red-500'>{errors[field]}</p>
              )}
            </div>
          );
        })}
        <Button
          onClick={handleSubmit}
          label='Yeni Personel Ekle'
          icon='pi pi-user-plus'
          className='p-button-md bg-indigo-600 border-indigo-600 hover:bg-indigo-700 mt-6'
          disabled={isSubmitting}
        />
      </Card>
    </Dialog>
  );
}
