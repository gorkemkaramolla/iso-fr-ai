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
} from '@nextui-org/react';
import { PlusIcon } from '@/components/ui/PlusIcon';
import { VerticalDotsIcon } from '@/components/ui/VerticalDotsIcon';
import { ChevronDownIcon } from '@/components/ui/ChevronDownIcon';
import { SearchIcon } from '@/components/ui/SearchIcon';
import { columns } from './user-columns';
import { capitalize } from '@/utils/capitalize';
import { User } from '@/types';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { ExternalLink, Trash2, Edit } from 'lucide-react';
import AddUserDialog from './add-user';
import EditUserDialog from './edit-user-dialog';
import createApi from '@/utils/axios_instance';
import Tooltip from '@/components/ui/tool-tip';
const INITIAL_VISIBLE_COLUMNS = ['username', 'email', 'role', 'actions'];

export default function ShowUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [filterValue, setFilterValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set([]));
  const [visibleColumns, setVisibleColumns] = useState<Selection>(
    new Set(INITIAL_VISIBLE_COLUMNS)
  );
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: 'username',
    direction: 'ascending',
  });
  const [page, setPage] = useState(1);
  const toastRef = useRef<Toast>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);

  useEffect(() => {
    fetchUsers();
    !isModalOpen && fetchUsers();
  }, [isModalOpen]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const api = createApi(process.env.NEXT_PUBLIC_AUTH_URL);
      const response = await api.get('/users');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      toastRef.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to fetch user data.',
      });
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = () => {
    confirmDialog({
      message: `Seçilen kullanıcıları silmek istediğinize emin misiniz?`,
      header: 'Silme İşlemini Onayla',
      icon: 'pi pi-exclamation-triangle',
      accept: deleteUser,
      reject: () => {
        toastRef.current?.show({
          severity: 'info',
          summary: 'İptal Edildi',
          detail: 'Silme işlemi iptal edildi.',
        });
      },
    });
  };

  const deleteUser = async () => {
    const selectedIds = Array.from(selectedKeys) as string[];
    const api = createApi(process.env.NEXT_PUBLIC_AUTH_URL);

    try {
      const deletePromises = selectedIds.map(async (id) => {
        const response = await api.delete(`/users/${id}`);
        return response.status === 200;
      });

      const results = await Promise.all(deletePromises);

      const allSuccessful = results.every((result) => result === true);

      if (allSuccessful) {
        toastRef.current?.show({
          severity: 'success',
          summary: 'Success',
          detail: 'Seçilen kullanıcılar başarıyla silindi.',
        });
        fetchUsers();
      } else {
        toastRef.current?.show({
          severity: 'warn',
          summary: 'Partial Success',
          detail: 'Bazı kullanıcılar silinemedi. Lütfen tekrar deneyin.',
        });
      }
    } catch (error) {
      toastRef.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Bir hatayla karşılaşıldı. Lütfen tekrar deneyin.',
      });
    }
  };

  const handleEditUser = (user: User) => {
    setUserToEdit(user);
    setIsEditModalOpen(true);
  };

  const renderCell = (user: User, columnKey: React.Key): React.ReactNode => {
    const cellValue = user[columnKey as keyof User];

    switch (columnKey) {
      case 'username':
        return <div>{user.username}</div>;

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
                <DropdownItem onClick={() => handleEditUser(user)}>
                  <span className='flex gap-2 items-center justify-between'>
                    <span>Düzenle</span>
                    <span>
                      <Edit />
                    </span>
                  </span>
                </DropdownItem>
                <DropdownItem className='flex' onClick={() => confirmDelete()}>
                  <span className='flex gap-2 items-center justify-between'>
                    <span>Sil</span>
                    <Trash2 />
                  </span>
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
    let filteredUsers: User[] = [...users];

    if (filterValue) {
      filteredUsers = filteredUsers.filter((user) =>
        Object.values(user)
          .join(' ')
          .toLowerCase()
          .includes(filterValue.toLowerCase())
      );
    }

    return filteredUsers;
  }, [users, filterValue]);

  const sortedItems = React.useMemo(() => {
    return [...filteredItems].sort((a: User, b: User) => {
      const first = a[sortDescriptor.column as keyof User] as string;
      const second = b[sortDescriptor.column as keyof User] as string;
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
        placeholder='Kullanıcı Adı veya E-posta...'
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
              Sütunları Göster
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
        <Tooltip content='Yeni bir kullanıcı eklemek için tıklayın'>
          <Button
            onClick={() => {
              setIsModalOpen(true);
            }}
            color='primary'
            endContent={<PlusIcon />}
          >
            Yeni Kullanıcı Ekle
          </Button>
        </Tooltip>
        {selectedKeys !== 'all' && selectedKeys?.size > 0 && (
          <Tooltip content='Seçili kullanıcıları silmek için tıklayın'>
            <Button color='danger' onPress={confirmDelete}>
              Seçilenleri Sil
              <Trash2 className='w-5' />
            </Button>
          </Tooltip>
        )}
      </div>
    </div>
  );

  const bottomContent = (
    <div className='py-2 px-2 flex justify-between items-center'>
      <span className='w-[30%] text-small text-default-400'>
        {selectedKeys === 'all' || selectedKeys.size === filteredItems.length
          ? 'Tümü seçildi'
          : `${selectedKeys.size} seçildi  ${filteredItems.length} kayıttan `}
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
          Geri
        </Button>
        <Button
          isDisabled={page === pages}
          size='sm'
          variant='flat'
          onPress={() => setPage((prev) => Math.min(prev + 1, pages))}
        >
          İleri
        </Button>
      </div>
    </div>
  );

  return (
    <div>
      <AddUserDialog
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
      />
      <EditUserDialog
        isModalOpen={isEditModalOpen}
        setIsModalOpen={setIsEditModalOpen}
        userToEdit={userToEdit}
        fetchUsers={fetchUsers}
      />
      <Toast ref={toastRef} />
      <ConfirmDialog />

      <Table
        aria-label='User table with custom cells, pagination and sorting'
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
        <TableBody emptyContent={'No users found'} items={items}>
          {(item) => (
            <TableRow key={item.id}>
              {(columnKey) => (
                <TableCell key={columnKey}>
                  {renderCell(item, columnKey)}
                </TableCell>
              )}
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
