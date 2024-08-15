'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { DataTable, DataTableRowEvent } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { useRouter } from 'next/navigation';
import { InputText } from 'primereact/inputtext';
import { Search, User, Mail, Briefcase } from 'lucide-react';
import Image from 'next/image';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog'; // Import ConfirmDialog
import { Card } from 'primereact/card';
import { motion } from 'framer-motion';

interface Personel {
  _id: string;
  name: string;
  lastname: string;
  email: string;
  title: string;
}

export default function ShowPersonel() {
  const [personel, setPersonel] = useState<Personel[]>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const toastRef = useRef<Toast>(null); // Create a ref for Toast

  useEffect(() => {
    fetchPersonel();
  }, []); // Empty dependency array ensures this runs once on mount

  const fetchPersonel = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_UTILS_URL}/personel`
      );
      const data = await response.json();
      if (response.ok) {
        setPersonel(data);
      } else {
        console.error('Failed to fetch personel:', data.message);
        toastRef.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to fetch personnel data.',
        });
      }
    } catch (error) {
      console.error('Error fetching personel:', error);
      toastRef.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'An error occurred while fetching personnel data.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (e: DataTableRowEvent) => {
    const rowData = e.data as Personel;
    router.push(`/profiles/?id=${rowData._id}`);
  };

  const filteredPersonel = useMemo(() => {
    return personel.filter((person) =>
      Object.values(person).some((value) =>
        value.toString().toLowerCase().includes(globalFilter.toLowerCase())
      )
    );
  }, [personel, globalFilter]);

  const header = (
    <div className='flex justify-between items-center mb-4'>
      <div className='relative'>
        <Search
          className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400'
          size={18}
        />
        <InputText
          type='search'
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder='Search...'
          className='pl-10 p-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500'
        />
      </div>
    </div>
  );

  const profileImageBodyTemplate = (rowData: Personel) => {
    return (
      <div className='flex items-center justify-center'>
        <Image
          src={`${process.env.NEXT_PUBLIC_UTILS_URL}/personel/image?id=${rowData._id}`}
          width={200}
          height={200}
          className='rounded-full object-cover w-32 h-32'
          alt={`${rowData.name} ${rowData.lastname}`}
        />
      </div>
    );
  };

  const actionBodyTemplate = (rowData: Personel) => {
    const confirmDelete = () => {
      confirmDialog({
        message: 'Bu kişiyi silmek istediğinizden emin misiniz?',
        header: 'Silme Onayı',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Evet',
        rejectLabel: 'Hayır',
        accept: async () => {
          try {
            const response = await fetch(
              `${process.env.NEXT_PUBLIC_UTILS_URL}/personel/${rowData._id}`,
              { method: 'DELETE' }
            );
            if (response.ok) {
              toastRef.current?.show({
                severity: 'success',
                summary: 'Başarılı',
                detail: 'Kişi başarıyla silindi.',
              });
              fetchPersonel(); // Refresh the list
              router.refresh();
            } else {
              toastRef.current?.show({
                severity: 'error',
                summary: 'Hata',
                detail: 'Kişi silinirken bir hata oluştu.',
              });
            }
          } catch (error) {
            console.error('Error deleting personel:', error);
            toastRef.current?.show({
              severity: 'error',
              summary: 'Hata',
              detail: 'Kişi silinirken bir hata oluştu.',
            });
          }
        },
      });
    };

    return (
      <div className='flex items-center justify-center'>
        <button onClick={confirmDelete} className='p-button p-button-danger'>
          Sil
        </button>
      </div>
    );
  };

  const nameBodyTemplate = (rowData: Personel) => {
    return (
      <div className='flex items-center'>
        <User className='mr-2 text-blue-500' size={18} />
        <span className='font-medium'>{`${rowData.name} ${rowData.lastname}`}</span>
      </div>
    );
  };

  const emailBodyTemplate = (rowData: Personel) => {
    return (
      <div className='flex items-center'>
        <Mail className='mr-2 text-green-500' size={18} />
        <span>{rowData.email}</span>
      </div>
    );
  };

  const titleBodyTemplate = (rowData: Personel) => {
    return (
      <div className='flex items-center'>
        <Briefcase className='mr-2 text-purple-500' size={18} />
        <span>{rowData.title}</span>
      </div>
    );
  };

  return (
    <motion.div
      className='w-full bg-white rounded-lg shadow-xl overflow-hidden'
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Card title='Personel Listesi' className='p-6'>
        <Toast ref={toastRef} />
        <ConfirmDialog />
        <div className='p-6'>
          {header}
          <DataTable
            value={filteredPersonel}
            onRowClick={handleRowClick}
            emptyMessage='Kişi bulunamadı.'
            className='p-datatable-sm'
            stripedRows
            responsiveLayout='stack'
            breakpoint='960px'
            rowHover
            loading={loading}
          >
            <Column
              body={profileImageBodyTemplate}
              header='Profil'
              style={{ width: '220px', textAlign: 'center' }}
            />
            <Column
              body={nameBodyTemplate}
              header='Adı'
              sortable
              sortField='name'
            />
            <Column
              body={emailBodyTemplate}
              header='E-posta'
              sortable
              sortField='email'
            />
            <Column
              body={titleBodyTemplate}
              header='Unvan'
              sortable
              sortField='title'
            />
            <Column
              body={actionBodyTemplate}
              header='İşlemler'
              style={{ width: '100px', textAlign: 'center' }}
            />
          </DataTable>
        </div>
      </Card>
    </motion.div>
  );
}
