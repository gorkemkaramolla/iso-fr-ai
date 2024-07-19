'use client';
import React, { useState, useEffect } from 'react';
import { DataTable, DataTableRowEvent } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { useRouter } from 'next/navigation';
import { InputText } from 'primereact/inputtext';
import { Search, User, Mail, Briefcase } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@mui/material';

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
  const router = useRouter();

  useEffect(() => {
    fetchPersonel();
  }, []);

  const fetchPersonel = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_UTILS_URL}/personel`
      );
      const data = await response.json();
      if (response.ok) {
        setPersonel(data);
      } else {
        console.error('Failed to fetch personel:', data.message);
      }
    } catch (error) {
      console.error('Error fetching personel:', error);
    }
  };

  const handleRowClick = (e: DataTableRowEvent) => {
    const rowData = e.data as Personel;
    router.push(`/profiles/${rowData._id}`);
  };

  const header = (
    <div className='flex justify-between items-center mb-4'>
      <h1 className='text-xl font-bold'>Personel List</h1>
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
      <div className='flex items-center'>
        <Image
          src={`${process.env.NEXT_PUBLIC_UTILS_URL}/personel/image?id=${rowData._id}`}
          width={50}
          className='w-12 h-12'
          height={50}
          alt='Profile Image'
        />
      </div>
    );
  };

  const actionBodyTemplate = (rowData: Personel) => {
    return (
      <div className='flex items-center'>
        <span>
          <Button>Sil</Button>
        </span>
      </div>
    );
  };
  const nameBodyTemplate = (rowData: Personel) => {
    return (
      <div className='flex items-center'>
        <User className='mr-2 text-gray-500' size={18} />
        <span>{`${rowData.name} ${rowData.lastname}`}</span>
      </div>
    );
  };

  const emailBodyTemplate = (rowData: Personel) => {
    return (
      <div className='flex items-center'>
        <Mail className='mr-2 text-gray-500' size={18} />
        <span>{rowData.email}</span>
      </div>
    );
  };

  const titleBodyTemplate = (rowData: Personel) => {
    return (
      <div className='flex items-center'>
        <Briefcase className='mr-2 text-gray-500' size={18} />
        <span>{rowData.title}</span>
      </div>
    );
  };

  return (
    <div className='mx-auto'>
      {header}
      <DataTable
        value={personel}
        onRowClick={handleRowClick}
        globalFilter={globalFilter}
        emptyMessage='No personel found.'
        className='p-datatable-sm p-datatable-hoverable-rows'
        stripedRows
        responsiveLayout='scroll'
      >
        <Column body={profileImageBodyTemplate} />
        <Column
          body={nameBodyTemplate}
          header='Name'
          sortable
          sortField='name'
        />
        <Column
          body={emailBodyTemplate}
          header='Email'
          sortable
          sortField='email'
        />
        <Column
          body={titleBodyTemplate}
          header='Ünvan'
          sortable
          sortField='Ünvan'
        />
        <Column body={actionBodyTemplate} sortable />
      </DataTable>
    </div>
  );
}
