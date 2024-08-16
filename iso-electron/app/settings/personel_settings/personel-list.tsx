// 'use client';

// import React, { useState, useEffect, useMemo, useRef } from 'react';
// import { DataTable, DataTableRowEvent } from 'primereact/datatable';
// import { Column } from 'primereact/column';
// import { useRouter } from 'next/navigation';
// import { InputText } from 'primereact/inputtext';
// import { Search, User, Mail, Briefcase } from 'lucide-react';
// import Image from 'next/image';
// import { Toast } from 'primereact/toast';
// import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog'; // Import ConfirmDialog
// import { Card } from 'primereact/card';
// import { motion } from 'framer-motion';

// interface Personel {
//   _id: string;
//   name: string;
//   lastname: string;
//   email: string;
//   title: string;
// }

// export default function ShowPersonel() {

//   useEffect(() => {
//     fetchPersonel();
//   }, []); // Empty dependency array ensures this runs once on mount

//   const fetchPersonel = async () => {
//     setLoading(true);
//     try {
//       const response = await fetch(
//         `${process.env.NEXT_PUBLIC_UTILS_URL}/personel`
//       );
//       const data = await response.json();
//       if (response.ok) {
//         setPersonel(data);
//       } else {
//         console.error('Failed to fetch personel:', data.message);
//         toastRef.current?.show({
//           severity: 'error',
//           summary: 'Error',
//           detail: 'Failed to fetch personnel data.',
//         });
//       }
//     } catch (error) {
//       console.error('Error fetching personel:', error);
//       toastRef.current?.show({
//         severity: 'error',
//         summary: 'Error',
//         detail: 'An error occurred while fetching personnel data.',
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleRowClick = (e: DataTableRowEvent) => {
//     const rowData = e.data as Personel;
//     router.push(`/profiles/?id=${rowData._id}`);
//   };

//   const filteredPersonel = useMemo(() => {
//     return personel.filter((person) =>
//       Object.values(person).some((value) =>
//         value.toString().toLowerCase().includes(globalFilter.toLowerCase())
//       )
//     );
//   }, [personel, globalFilter]);

//   const header = (
//     <div className='flex justify-between items-center mb-4'>
//       <div className='relative'>
//         <Search
//           className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400'
//           size={18}
//         />
//         <InputText
//           type='search'
//           value={globalFilter}
//           onChange={(e) => setGlobalFilter(e.target.value)}
//           placeholder='Search...'
//           className='pl-10 p-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500'
//         />
//       </div>
//     </div>
//   );

//   const profileImageBodyTemplate = (rowData: Personel) => {
//     return (
//       <div className='flex items-center justify-center'>
//         <Image
//           src={`${process.env.NEXT_PUBLIC_UTILS_URL}/personel/image?id=${rowData._id}`}
//           width={200}
//           height={200}
//           className='rounded-full object-cover w-32 h-32'
//           alt={`${rowData.name} ${rowData.lastname}`}
//         />
//       </div>
//     );
//   };

//   const actionBodyTemplate = (rowData: Personel) => {
//     const confirmDelete = () => {
//       confirmDialog({
//         message: 'Bu kişiyi silmek istediğinizden emin misiniz?',
//         header: 'Silme Onayı',
//         icon: 'pi pi-exclamation-triangle',
//         acceptLabel: 'Evet',
//         rejectLabel: 'Hayır',
//         accept: async () => {
//           try {
//             const response = await fetch(
//               `${process.env.NEXT_PUBLIC_UTILS_URL}/personel/${rowData._id}`,
//               { method: 'DELETE' }
//             );
//             if (response.ok) {
//               toastRef.current?.show({
//                 severity: 'success',
//                 summary: 'Başarılı',
//                 detail: 'Kişi başarıyla silindi.',
//               });
//               fetchPersonel(); // Refresh the list
//               router.refresh();
//             } else {
//               toastRef.current?.show({
//                 severity: 'error',
//                 summary: 'Hata',
//                 detail: 'Kişi silinirken bir hata oluştu.',
//               });
//             }
//           } catch (error) {
//             console.error('Error deleting personel:', error);
//             toastRef.current?.show({
//               severity: 'error',
//               summary: 'Hata',
//               detail: 'Kişi silinirken bir hata oluştu.',
//             });
//           }
//         },
//       });
//     };

//     return (
//       <div className='flex items-center justify-center'>
//         <button onClick={confirmDelete} className='p-button p-button-danger'>
//           Sil
//         </button>
//       </div>
//     );
//   };

//   const nameBodyTemplate = (rowData: Personel) => {
//     return (
//       <div className='flex items-center'>
//         <User className='mr-2 text-blue-500' size={18} />
//         <span className='font-medium'>{`${rowData.name} ${rowData.lastname}`}</span>
//       </div>
//     );
//   };

//   const emailBodyTemplate = (rowData: Personel) => {
//     return (
//       <div className='flex items-center'>
//         <Mail className='mr-2 text-green-500' size={18} />
//         <span>{rowData.email}</span>
//       </div>
//     );
//   };

//   const titleBodyTemplate = (rowData: Personel) => {
//     return (
//       <div className='flex items-center'>
//         <Briefcase className='mr-2 text-purple-500' size={18} />
//         <span>{rowData.title}</span>
//       </div>
//     );
//   };

//   return (
//     <motion.div
//       className='w-full bg-white rounded-lg shadow-xl overflow-hidden'
//       initial={{ opacity: 0 }}
//       animate={{ opacity: 1 }}
//       transition={{ duration: 0.5 }}
//     >
//       <Card title='Personel Listesi' className='p-6'>
//         <Toast ref={toastRef} />
//         <ConfirmDialog />
//         <div className='p-6'>
//           {header}
//           <DataTable
//             value={filteredPersonel}
//             onRowClick={handleRowClick}
//             emptyMessage='Kişi bulunamadı.'
//             className='p-datatable-sm'
//             stripedRows
//             responsiveLayout='stack'
//             breakpoint='960px'
//             rowHover
//             loading={loading}
//           >
//             <Column
//               body={profileImageBodyTemplate}
//               header='Profil'
//               style={{ width: '220px', textAlign: 'center' }}
//             />
//             <Column
//               body={nameBodyTemplate}
//               header='Adı'
//               sortable
//               sortField='name'
//             />
//             <Column
//               body={emailBodyTemplate}
//               header='E-posta'
//               sortable
//               sortField='email'
//             />
//             <Column
//               body={titleBodyTemplate}
//               header='Unvan'
//               sortable
//               sortField='title'
//             />
//             <Column
//               body={actionBodyTemplate}
//               header='İşlemler'
//               style={{ width: '100px', textAlign: 'center' }}
//             />
//           </DataTable>
//         </div>
//       </Card>
//     </motion.div>
//   );
// }
import React, { useEffect, useRef, useState } from 'react';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Input,
  Button,
  DropdownTrigger,
  Dropdown,
  DropdownMenu,
  DropdownItem,
  Pagination,
  Selection,
  SortDescriptor,
  User,
} from '@nextui-org/react';
import { PlusIcon } from '../../../components/ui/PlusIcon';
import { VerticalDotsIcon } from '@/components/ui/VerticalDotsIcon';
import { ChevronDownIcon } from '../../../components/ui/ChevronDownIcon';
import { SearchIcon } from '../../../components/ui/SearchIcon';
import { columns } from './data';
import { capitalize } from '@/utils/capitalize';
import { Personel } from '@/types';
import { useRouter } from 'next/navigation';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { ExternalLink, Trash2 } from 'lucide-react';
import Link from 'next/link';
import AddPersonelDialog from './add-user';
import createApi from '@/utils/axios_instance';

const INITIAL_VISIBLE_COLUMNS = [
  'name',
  'lastname',
  'title',
  'address',
  'phone',
  'email',
  'gsm',
  'resume',
  'birth_date',
  'iso_phone',
  'iso_phone2',
  'file_path',
  'actions',
];

export default function App() {
  const [personel, setPersonel] = useState<Personel[]>([]);
  const [filterValue, setFilterValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set([]));
  const [visibleColumns, setVisibleColumns] = useState<Selection>(
    new Set(INITIAL_VISIBLE_COLUMNS)
  );
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: 'name',
    direction: 'ascending',
  });
  const [page, setPage] = useState(1);
  const router = useRouter();
  const toastRef = useRef<Toast>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchPersonel();
  }, []);

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
        toastRef.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to fetch personnel data.',
        });
      }
    } catch (error) {
      toastRef.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'An error occurred while fetching personnel data.',
      });
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = () => {
    confirmDialog({
      message: `Seçilen ${Array.from(
        selectedKeys
      )} id'li personeli silmek istediğinizden emin misiniz?`,
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: deletePersonel,
      reject: () => {
        toastRef.current?.show({
          severity: 'info',
          summary: 'Cancelled',
          detail: 'Silme işlemi iptal edildi.',
        });
      },
    });
  };

  const deletePersonel = async () => {
    const selectedIds = Array.from(selectedKeys);
    const api = createApi(process.env.NEXT_PUBLIC_UTILS_URL);

    try {
      const deletePromises = selectedIds.map(async (id) => {
        const response = await api.delete(`/personel/${id}`);
        return response.status === 200; // Check if the response was successful
      });

      const results = await Promise.all(deletePromises);

      const allSuccessful = results.every((result) => result === true);

      if (allSuccessful) {
        toastRef.current?.show({
          severity: 'success',
          summary: 'Success',
          detail: 'Seçilen tüm kullanıcılar başarıyla silindi.',
        });
        fetchPersonel(); // Refresh the personnel list after successful deletion
      } else {
        toastRef.current?.show({
          severity: 'warn',
          summary: 'Partial Success',
          detail: 'Seçilen personelin bazıları silinemedi.',
        });
      }
    } catch (error) {
      toastRef.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Bir hata oluştu. Lütfen tekrar deneyin.',
      });
    }
  };

  const renderCell = (
    person: Personel,
    columnKey: React.Key
  ): React.ReactNode => {
    const cellValue = person[columnKey as keyof Personel];

    switch (columnKey) {
      case 'name':
        return (
          <User
            avatarProps={{
              radius: 'full',
              size: 'sm',
              src: `${process.env.NEXT_PUBLIC_UTILS_URL}/personel/image/?id=${person._id}`,
            }}
            classNames={{ description: 'text-default-500' }}
            description={person.email}
            name={`${person.name} ${person.lastname}`}
          />
        );

      case 'actions':
        return (
          <div className='relative flex justify-end items-center gap-2'>
            <Dropdown>
              <DropdownTrigger>
                <Button isIconOnly size='sm' variant='light'>
                  <VerticalDotsIcon className='text-default-300' />
                </Button>
              </DropdownTrigger>
              <DropdownMenu>
                <DropdownItem>
                  <Link
                    className='flex justify-between w-full'
                    href={`/profiles?id=${person._id}`}
                  >
                    <span>Profili Görüntüle</span>
                    <ExternalLink />
                  </Link>
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        );
      default:
        return cellValue;
    }
  };

  const filteredItems = React.useMemo(() => {
    let filteredPersonel: Personel[] = [...personel];

    if (filterValue) {
      filteredPersonel = filteredPersonel.filter((person) =>
        Object.values(person)
          .join(' ')
          .toLowerCase()
          .includes(filterValue.toLowerCase())
      );
    }

    return filteredPersonel;
  }, [personel, filterValue]);

  const sortedItems = React.useMemo(() => {
    return [...filteredItems].sort((a: Personel, b: Personel) => {
      const first = a[sortDescriptor.column as keyof Personel] as string;
      const second = b[sortDescriptor.column as keyof Personel] as string;
      const cmp = first.localeCompare(second);
      return sortDescriptor.direction === 'descending' ? -cmp : cmp;
    });
  }, [sortDescriptor, filteredItems]);

  const items = React.useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return sortedItems.slice(start, end);
  }, [page, sortedItems, rowsPerPage]);

  const pages = Math.ceil(filteredItems.length / rowsPerPage);

  const topContent = (
    <div className='flex justify-between gap-3 items-end'>
      <Input
        isClearable
        className='w-full sm:max-w-[44%]'
        placeholder='İsim, Soyisim, E-posta, Telefon...'
        startContent={<SearchIcon />}
        value={filterValue}
        onClear={() => setFilterValue('')}
        onValueChange={setFilterValue}
      />
      <div className='flex gap-3'>
        <Dropdown>
          <DropdownTrigger className='hidden sm:flex'>
            <Button
              endContent={<ChevronDownIcon className='text-small' />}
              variant='flat'
            >
              Sütünları Göster
            </Button>
          </DropdownTrigger>
          <DropdownMenu
            disallowEmptySelection
            aria-label='Table Columns'
            closeOnSelect={false}
            selectedKeys={visibleColumns}
            selectionMode='multiple'
            onSelectionChange={setVisibleColumns}
          >
            {columns.map((column) => (
              <DropdownItem key={column.uid} className='capitalize'>
                {capitalize(column.name)}
              </DropdownItem>
            ))}
          </DropdownMenu>
        </Dropdown>
        <Button
          onClick={() => {
            setIsModalOpen(true);
          }}
          color='primary'
          endContent={<PlusIcon />}
        >
          Yeni Personel Ekle
        </Button>
        {selectedKeys !== 'all' && selectedKeys?.size > 0 && (
          <Button color='danger' onPress={confirmDelete}>
            Seçilenleri Sil
            <Trash2 className='w-5' />
          </Button>
        )}
      </div>
    </div>
  );

  const bottomContent = (
    <div className='py-2 px-2 flex justify-between items-center'>
      <span className='w-[30%] text-small text-default-400'>
        {selectedKeys === 'all'
          ? 'All items selected'
          : `${selectedKeys.size} of ${filteredItems.length} selected`}
      </span>
      <Pagination
        className='[&_li]:flex [&_li]:items-center [&_li]:justify-center'
        isCompact
        showControls
        showShadow
        color='primary'
        page={page}
        total={pages}
        onChange={setPage}
      />
      <div className='hidden sm:flex w-[30%] justify-end gap-2'>
        <Button
          isDisabled={page === 1}
          size='sm'
          variant='flat'
          onPress={() => setPage((prev) => Math.max(prev - 1, 1))}
        >
          Previous
        </Button>
        <Button
          isDisabled={page === pages}
          size='sm'
          variant='flat'
          onPress={() => setPage((prev) => Math.min(prev + 1, pages))}
        >
          Next
        </Button>
      </div>
    </div>
  );

  return (
    <div>
      <AddPersonelDialog
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
      />

      <Toast ref={toastRef} />
      <ConfirmDialog />

      <Table
        aria-label='Example table with custom cells, pagination and sorting'
        isHeaderSticky
        bottomContent={bottomContent}
        bottomContentPlacement='outside'
        classNames={{ wrapper: 'max-h-[382px]' }}
        selectedKeys={selectedKeys}
        selectionMode='multiple'
        sortDescriptor={sortDescriptor}
        topContent={topContent}
        topContentPlacement='outside'
        onSelectionChange={setSelectedKeys}
        onSortChange={setSortDescriptor}
      >
        <TableHeader
          columns={columns.filter(
            (col) => visibleColumns === 'all' || visibleColumns.has(col.uid)
          )}
        >
          {(column) => (
            <TableColumn
              key={column.uid}
              align={column.uid === 'actions' ? 'center' : 'start'}
              allowsSorting={column.sortable}
            >
              {column.name}
            </TableColumn>
          )}
        </TableHeader>
        <TableBody emptyContent={'No personnel found'} items={items}>
          {(item) => (
            <TableRow key={item._id}>
              {(columnKey) => (
                <TableCell>{renderCell(item, columnKey)}</TableCell>
              )}
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
