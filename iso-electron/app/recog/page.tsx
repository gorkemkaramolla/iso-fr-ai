'use client';
import React, { useState, useEffect, useRef } from 'react';
import { InputText } from 'primereact/inputtext';
import { FilterMatchMode, FilterService } from 'primereact/api';
import { InputIcon } from 'primereact/inputicon';
import { IconField } from 'primereact/iconfield';
import {
  DataTable,
  DataTableFilterMeta,
  DataTableRowEditCompleteEvent,
  DataTableSelectionCellChangeEvent,
} from 'primereact/datatable';
import {
  Column,
  ColumnFilterElementTemplateOptions,
  ColumnEditorOptions,
} from 'primereact/column';
import { Dropdown, DropdownChangeEvent } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { InputNumber, InputNumberChangeEvent } from 'primereact/inputnumber';
import CalendarComponent from '@/components/camera/Calendar';
import { Nullable } from 'primereact/ts-helpers';
import { getRecogFaces } from '@/services/camera/service';
import { Menu } from 'primereact/menu';
import { Ripple } from 'primereact/ripple';
import { MultiSelect, MultiSelectChangeEvent } from 'primereact/multiselect';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { ConfirmPopup, confirmPopup } from 'primereact/confirmpopup';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import EnlargedImage from '../profiles/enlarged-image';
import { TrashIcon } from 'lucide-react';
import { RecogContext } from '@/context/RecogContext';

interface RecognizedFace {
  _id: {
    $oid: string;
  };
  timestamp: number;
  label: string;
  similarity: number;
  emotion: string;
  gender: number;
  age: number;
  image_path: string;
  personnel_id?: string;
  camera?: string;
}
interface ColumnMeta {
  field: string;
  header: string;
}

const defaultFilters: DataTableFilterMeta = {
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  label: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
  similarity: { value: null, matchMode: FilterMatchMode.CUSTOM },
  emotion: { value: null, matchMode: FilterMatchMode.EQUALS },
  gender: { value: null, matchMode: FilterMatchMode.EQUALS },
  age: { value: null, matchMode: FilterMatchMode.CUSTOM },
};

// The rule argument should be a string in the format "custom_[field]".
FilterService.register('custom_age', (value, filters) => {
  const [from, to] = filters ?? [null, null];
  if (from === null && to === null) return true;
  if (from !== null && to === null) return from <= value;
  if (from === null && to !== null) return value <= to;
  return from <= value && value <= to;
});
// The rule argument should be a string in the format "custom_[field]".
FilterService.register('custom_similarity', (value, filters) => {
  const [from, to] = filters ?? [null, null];
  if (from === null && to === null) return true;
  if (from !== null && to === null) return from <= value;
  if (from === null && to !== null) return value <= to;
  return from <= value && value <= to;
});
const emotionMap: { [key: number]: { [key: string]: string } } = {
  0: {
    label: 'Normal',
    label_en: 'Neutral',
    icon: '😐',
  },
  1: {
    label: 'Mutlu',
    label_en: 'Happy',
    icon: '😄',
  },
  2: {
    label: 'Üzgün',
    label_en: 'Sad',
    icon: '😢',
  },
  3: {
    label: 'Şaşırmış',
    label_en: 'Surprised',
    icon: '😲',
  },
  4: {
    label: 'Korkmuş',
    label_en: 'Fear',
    icon: '😨',
  },
  5: {
    label: 'İğrenmiş',
    label_en: 'Disgust',
    icon: '🤢',
  },
  6: {
    label: 'Kızgın',
    label_en: 'Angry',
    icon: '😠',
  },
};

const RecognizedFacesTable: React.FC = () => {
  const router = useRouter();
  const toast = useRef<Toast>(null);
  const [enlargedImage, setEnlargedImage] = useState(false);
  // const recogFaces = React.useContext(RecogContext);
  const [recognizedFaces, setRecognizedFaces] = useState<RecognizedFace[]>([]);
  const [filters, setFilters] = useState<DataTableFilterMeta>(defaultFilters);
  const [globalFilterValue, setGlobalFilterValue] = useState<string>('');
  const [selectedFaces, setSelectedFaces] = useState<RecognizedFace[] | null>(
    null
  );
  const [selectedDate, setSelectedDate] = useState<Nullable<Date>>(() => {
    if (typeof window !== 'undefined') {
      const storedDate = localStorage.getItem('selectedDateRecog');
      return storedDate ? new Date(storedDate) : null;
    }
    return null;
  });
  const dt = useRef<DataTable<RecognizedFace[]>>(null);
  // const [loading, setLoading] = useState<boolean>(true);
  const exportItemsMenu = useRef<Menu>(null);
  const [persons, setPersons] = useState<string[]>([]);

  useEffect(() => {
    if (selectedDate) {
      localStorage.setItem('selectedDateRecog', selectedDate?.toISOString());
    }
    // console.log('selec tedDate:', selectedDate);
    const fetchRecogFaces = async () => {
      try {
        // Fetch recognized face data from the backend using fetch
        const faces = (await getRecogFaces(
          selectedDate?.toISOString()
        )) as RecognizedFace[];
        setRecognizedFaces(faces);
        const uniqueLabels = Array.from(
          new Set(
            faces.map((face) => {
              return face.label;
            })
          )
        );
        setPersons(uniqueLabels);
        // setLoading(false);
      } catch (error) {
        console.error('Error fetching recognized face data:', error);
      }
    };
    fetchRecogFaces();
  }, [selectedDate, setRecognizedFaces]);

  const formatTimestamp = (value: number) => {
    return new Date(value).toLocaleString('tr-TR');
  };

  const formatGender = (value: number) => {
    return value === 1 ? 'Erkek' : 'Kadın';
  };

  const exportCSV = (selectionOnly: boolean) => {
    dt.current?.exportCSV({ selectionOnly });
  };
  const cols: ColumnMeta[] = [
    { field: 'timestamp', header: 'Timestamp' },
    { field: 'label', header: 'Label' },
    { field: 'similarity', header: 'Similarity' },
    { field: 'emotion', header: 'Emotion' },
    { field: 'gender', header: 'Gender' },
    { field: 'age', header: 'Age' },
    { field: 'image_path', header: 'Image' },
  ];
  const exportColumns = cols.map((col) => ({
    title: col.header,
    dataKey: col.field,
  }));

  const exportPdf = () => {
    import('jspdf').then((jsPDF) => {
      import('jspdf-autotable').then(() => {
        const doc = new jsPDF.default('portrait', 'px', 'a4') as any;

        doc.autoTable(exportColumns, recognizedFaces);
        doc.save('tanınan_yuzler.pdf');
      });
    });
  };
  const exportExcel = () => {
    import('xlsx').then((xlsx) => {
      const worksheet = xlsx.utils.json_to_sheet(recognizedFaces);
      const workbook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
      const excelBuffer = xlsx.write(workbook, {
        bookType: 'xlsx',
        type: 'array',
      });

      saveAsExcelFile(excelBuffer, 'tanınan_yuzler');
    });
  };

  const saveAsExcelFile = (buffer: any, fileName = 'tanınan_yuzler_excel') => {
    import('file-saver').then((module) => {
      if (module && module.default) {
        const EXCEL_TYPE =
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
        const EXCEL_EXTENSION = '.xlsx';
        const data = new Blob([buffer], {
          type: EXCEL_TYPE,
        });

        module.default.saveAs(
          data,
          fileName + '_export_' + new Date().getTime() + EXCEL_EXTENSION
        );
      }
    });
  };

  const exportItems = [
    {
      label: 'CSV',
      icon: 'pi pi-file',
      command: () => exportCSV(false),
    },
    {
      label: 'Excel',
      icon: 'pi pi-file-excel',
      command: () => exportExcel(),
    },
    {
      label: 'PDF',
      icon: 'pi pi-file-pdf',
      command: () => exportPdf(),
    },
  ];

  let deleteTimeoutId: NodeJS.Timeout | null = null;
  const accept = () => {
    // setItemsToDelete(selectedItems);
    showUndoToast();
  };

  const showUndoToast = () => {
    toast.current?.show({
      severity: 'info',
      summary: 'Deletion Initiated',
      detail: 'Items will be deleted. Click Undo to cancel.',
      life: 4000,
      content: (
        <div className='mb-2 w-full flex-1'>
          <span className='font-bold'>
            {selectedFaces?.length} item(s) will be deleted.
          </span>
          <div className='flex flex-1 pt-4'>
            <Button
              type='button'
              label='Undo'
              severity='info'
              className='p-button-sm'
              onClick={undoDeletion}
            />
          </div>
        </div>
      ),
    });

    // Set a timeout to actually delete the items if undo is not clicked
    deleteTimeoutId = setTimeout(() => {
      if (selectedFaces && selectedFaces?.length > 0) {
        handleDeleteSelected();
      }
    }, 4000);
  };

  const undoDeletion = () => {
    setSelectedFaces(null);
    toast.current?.clear();
    if (deleteTimeoutId) {
      clearTimeout(deleteTimeoutId);
      deleteTimeoutId = null;
    }
    toast.current?.show({
      severity: 'info',
      summary: 'Deletion Cancelled',
      detail: 'The items were not deleted.',
      life: 1500,
    });
  };

  const reject = () => {
    toast.current?.show({
      severity: 'warn',
      summary: 'Rejected',
      detail: 'You have rejected',
      life: 1500,
    });
  };

  const confirmDelete = async (event: any) => {
    confirmPopup({
      target: event.currentTarget,
      message: 'Bu kayıtları silmek istediğinizden emin misiniz?',
      icon: 'pi pi-info-circle',
      defaultFocus: 'reject',
      acceptClassName: 'p-button-danger',
      accept,
      reject,
    });
  };

  const renderHeader = () => {
    return (
      <div className='flex justify-between w-full items-center px-2 py-0 m-0'>
        <div></div>
        <div className='text-2xl nunito-700 '>Tanınan Yüzler</div>

        {/* <div className='flex items-center gap-4'>
          <IconField iconPosition='left'>
            <InputIcon className='pi pi-search' />
            <InputText
              className='w-[400px] py-2'
              value={globalFilterValue}
              onChange={onGlobalFilterChange}
              placeholder='Keyword Search'
            />
          </IconField>
        </div> */}
        <div className='flex items-center'>
          <div
            style={{ fontSize: '1.5rem' }}
            className='pi pi-file-export text-blue-500 p-4 p-ripple rounded-lg ml-4'
            onClick={(event) => exportItemsMenu?.current?.toggle(event)}
            title='Dışarı Aktar'
          >
            <Ripple
              pt={{
                root: { style: { background: 'rgba(156, 39, 176, 0.3)' } },
              }}
            />
          </div>
          <Menu model={exportItems} popup ref={exportItemsMenu} />
        </div>
      </div>
    );
  };
  const renderRowDeleteAndExportButtons = () => {
    return (
      <>
        {selectedFaces && selectedFaces?.length > 0 && (
          <div className='flex items-center gap-4'>
            <button
              onClick={confirmDelete}
              className='btn btn-sm btn-error rounded-xl'
              title='Seçilenleri Sil'
            >
              <TrashIcon size={16} />
              <span>Sil</span>
              {selectedFaces?.length > 0 && (
                <span className='px-1.5 py-0.5 bg-white text-red-500 text-xs font-semibold rounded-full'>
                  {selectedFaces?.length}
                </span>
              )}
            </button>
            <div
              style={{ fontSize: '1.2rem' }}
              className='pi pi-file-export text-blue-500 p-2 p-ripple rounded-lg'
              onClick={(event) => exportItemsMenu?.current?.toggle(event)}
              title='Dışarı Aktar'
            >
              <Ripple
                pt={{
                  root: { style: { background: 'rgba(156, 39, 176, 0.3)' } },
                }}
              />
            </div>
            <Menu model={exportItems} popup ref={exportItemsMenu} />
          </div>
        )}
      </>
    );
  };
  const onRowEditComplete = async (e: DataTableRowEditCompleteEvent) => {
    let _recognizedFaces = [...recognizedFaces];
    // console.log('e:', e);
    let { newData, index } = e;
    _recognizedFaces[index] = newData as RecognizedFace;

    const id = newData._id.$oid;
    const { _id, ...dataToSend } = newData;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_FLASK_URL}/recog/${id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(dataToSend),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.message === 'Log updated successfully') {
        setRecognizedFaces(_recognizedFaces);
        toast.current?.show({
          severity: 'success',
          summary: 'Update Successful',
          detail: 'The document has been updated successfully.',
          life: 3000,
        });
      } else {
        throw new Error('Update failed');
      }
    } catch (error) {
      console.error('Error updating document:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Update Failed',
        detail: 'There was an error updating the document. Please try again.',
        life: 3000,
      });
    }
  };
  const textEditor = (options: ColumnEditorOptions) => {
    return (
      <InputText
        type='text'
        value={options.value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          options.editorCallback!(e.target.value)
        }
      />
    );
  };
  const emotionBodyTemplate = (rowData: RecognizedFace) => {
    const emotion = emotionMap[Number(rowData.emotion)];
    return emotion ? (
      <div>
        <span>{emotion.icon}</span> <span>{emotion.label}</span>
      </div>
    ) : (
      'Unknown'
    );
  };
  const handleDeleteSelected = async () => {
    if (!selectedFaces) return;
    try {
      await Promise.all(
        selectedFaces.map((face) =>
          fetch(`${process.env.NEXT_PUBLIC_FLASK_URL}/recog/${face._id.$oid}`, {
            method: 'DELETE',
          })
        )
      );
      setRecognizedFaces((prevFaces) =>
        prevFaces.filter((face) => !selectedFaces.includes(face))
      );
      setSelectedFaces(null);
    } catch (error) {
      console.error('Error deleting recognized face data:', error);
    }
  };

  const simularityEditor = (options: ColumnEditorOptions) => {
    return (
      <InputNumber
        inputId='percent'
        // prefix='%'
        mode='decimal'
        minFractionDigits={1}
        maxFractionDigits={2}
        max={1}
        min={0}
        step={0.01}
        value={options.value}
        onChange={(e: InputNumberChangeEvent) =>
          options.editorCallback!(e.value!)
        }
      />
    );
  };
  const ageEditor = (options: ColumnEditorOptions) => {
    return (
      <InputNumber
        inputId='age'
        max={100}
        min={0}
        step={1}
        value={options.value}
        onChange={(e: InputNumberChangeEvent) =>
          options.editorCallback!(e.value!)
        }
      />
    );
  };

  const calendarEditor = (options: ColumnEditorOptions): JSX.Element => {
    return (
      <Calendar
        placeholder='gg/aa/yy ss:dd'
        dateFormat={'dd/mm/yy'}
        value={new Date(options.value)}
        onChange={(e) =>
          options.editorCallback && options.editorCallback(e.value?.getTime())
        }
        showTime
      />
    );
  };

  const emotionEditor = (options: ColumnEditorOptions) => {
    return (
      <Dropdown
        value={options.value}
        options={[
          'Normal',
          'Mutlu',
          'Üzgün',
          'Şaşkın',
          'Korkmuş',
          'İğrenmiş',
          'Kızgın',
        ]}
        onChange={(e: DropdownChangeEvent) => options.editorCallback!(e.value)}
        placeholder='Select an Emotion'
      />
    );
  };

  const genderEditor = (options: ColumnEditorOptions) => {
    return (
      <Dropdown
        value={options.value}
        options={[
          { label: 'Erkek', value: 1 },
          { label: 'Kadın', value: 0 },
        ]}
        onChange={(e: DropdownChangeEvent) => options.editorCallback!(e.value)}
        optionLabel='label'
        placeholder='Select a Gender'
      />
    );
  };

  const emotionFilterTemplate = (
    options: ColumnFilterElementTemplateOptions
  ) => {
    return (
      <Dropdown
        value={options.value}
        options={[
          'Normal',
          'Mutlu',
          'Üzgün',
          'Şaşkın',
          'Korkmuş',
          'İğrenmiş',
          'Kızgın',
        ]}
        onChange={(e) => options.filterCallback(e.value, options.index)}
        placeholder='Select an Emotion'
        className='p-column-filter h-8 [&_.p-inputtext]:pt-1'
        showClear
      />
    );
  };

  // const genderFilterTemplate = (
  //   options: ColumnFilterElementTemplateOptions
  // ) => {
  //   return (
  //     <Dropdown
  //       value={options.value}
  //       options={[
  //         { label: 'Erkek', value: 1 },
  //         { label: 'Kadın', value: 0 },
  //       ]}
  //       onChange={(e) => options.filterCallback(e.value, options.index)}
  //       optionLabel='label'
  //       placeholder='Select a Gender'
  //       className='p-column-filter h-8 [&_.p-inputtext]:pt-1'
  //       showClear
  //     />
  //   );
  // };

  const ageRowFilterTemplate = (options: any) => {
    const [from, to] = options.value ?? [null, null];

    return (
      <div className='flex gap-1'>
        <InputNumber
          value={from}
          onChange={(e) => options.filterApplyCallback([e.value, to])}
          placeholder='from'
          style={{
            minWidth: '4rem !important',
            maxWidth: '4rem !important',
            height: '2rem',
          }}
        />
        <InputNumber
          value={to}
          onChange={(e) => options.filterApplyCallback([from, e.value])}
          placeholder='to'
          style={{
            minWidth: '4rem !important',
            maxWidth: '4rem !important',
            height: '2rem',
          }}
        />
      </div>
    );
  };
  const simRowFilterTemplate = (options: any) => {
    const [from, to] = options.value ?? [null, null];

    return (
      <div className='flex gap-1'>
        <InputNumber
          value={from}
          onChange={(e) => options.filterApplyCallback([e.value, to])}
          mode='decimal'
          minFractionDigits={1}
          maxFractionDigits={2}
          max={1}
          min={0}
          step={0.01}
          placeholder='from'
          style={{
            minWidth: '4rem !important',
            maxWidth: '4rem !important',
            height: '2rem',
          }}
        />
        <InputNumber
          value={to}
          onChange={(e) => options.filterApplyCallback([from, e.value])}
          mode='decimal'
          minFractionDigits={1}
          maxFractionDigits={2}
          max={1}
          min={0}
          step={0.01}
          placeholder='to'
          style={{
            minWidth: '4rem !important',
            maxWidth: '4rem !important',
            height: '2rem',
          }}
        />
      </div>
    );
  };
  const dateFilterTemplate = (options: ColumnFilterElementTemplateOptions) => {
    // console.log('options:', options.value);
    // setSelectedDate(options.value);
    return (
      <CalendarComponent
        className='h-8'
        minDate={new Date('2024-08-01')}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
      />
    );
  };

  const personBodyTemplate = (rowData: RecognizedFace) => {
    return (
      <div className='inline-flex text-center items-center p-0 m-0'>
        <div
          className='flex gap-2 items-center justify-center text-center cursor-pointer p-0 m-0'
          onClick={() => router.push(`/profiles/?id=${rowData.personnel_id}`)}
          title={`Personel ${rowData.label} Sayfasına Git`}
        >
          <Image
            width={200}
            height={200}
            src={`${process.env.NEXT_PUBLIC_UTILS_URL}/personel/image/?id=${rowData.personnel_id}`}
            alt=''
            className='min-w-[20px] w-[20px] min-h-[20px] h-[20px] rounded-full shadow-lg'
            onError={(e) => {
              e.currentTarget.src = '/inner_circle.png';
            }}
          />
          <span className='font-bold text-md'>{rowData.label}</span>
        </div>
      </div>
    );
  };
  const personItemTemplate = (option: string) => {
    console.log('option:', option);
    return (
      <div className='flex items-center gap-2'>
        <Image
          alt={option}
          src={process.env.NEXT_PUBLIC_FLASK_URL + '/faces/' + option}
          width={32}
          height={32}
          onError={(e) => {
            e.currentTarget.src = '/inner_circle.png';
          }}
        />
        <span>{option}</span>
      </div>
    );
  };
  const personRowFilterTemplate = (
    options: ColumnFilterElementTemplateOptions
  ) => {
    return (
      <MultiSelect
        value={options.value}
        options={persons}
        itemTemplate={personItemTemplate}
        onChange={(e: MultiSelectChangeEvent) =>
          options.filterApplyCallback(e.value)
        }
        // optionLabel='name'
        placeholder='Any'
        className='p-column-filter'
        maxSelectedLabels={1}
        style={{ minWidth: '14rem' }}
      />
    );
  };

  const header = renderHeader();

  return (
    <div className='flex items-center justify-center my-10 mx-20 rounded-lg shadow-lg '>
      <Toast ref={toast} />
      <ConfirmPopup />
      {
        // @ts-ignore
        <DataTable
          ref={dt}
          className='w-full nunito-400 [&_.p-datatable-wrapper]:rounded-t-xl [&_.p-paginator-bottom]:rounded-b-xl'
          value={recognizedFaces}
          size='small'
          paginator
          rows={100}
          rowsPerPageOptions={[50, 100, 500]}
          dataKey='_id.$oid'
          filters={filters}
          filterDisplay='row'
          // loading={loading}
          dragSelection
          // header={header}
          emptyMessage='No recognized faces found.'
          scrollable
          removableSort
          sortMode='single'
          sortOrder={1}
          editMode='row'
          onRowEditComplete={onRowEditComplete}
          selectionMode={'checkbox'}
          selection={selectedFaces!}
          onSelectionChange={(
            e: DataTableSelectionCellChangeEvent<RecognizedFace[]>
          ) => setSelectedFaces(e.value as unknown as RecognizedFace[])}
        >
          <Column
            selectionMode='multiple'
            headerStyle={{ width: '3rem' }}
          ></Column>
          <Column
            field='timestamp'
            header='Tanıma Tarihi'
            body={(rowData) => formatTimestamp(rowData.timestamp)}
            sortable
            filterPlaceholder='Search by date'
            filter
            filterElement={dateFilterTemplate}
            showFilterMenu={false}
            editor={(options) => calendarEditor(options)}
            className='[&_.p-column-filter>.p-column-filter-clear-button]:hidden'
          />
          <Column
            field='label'
            header='İsim'
            filterMenuStyle={{ width: '14rem' }}
            style={{ maxWidth: '14rem' }}
            sortable
            filterPlaceholder='İsim ile ara'
            // filterElement={personRowFilterTemplate}
            body={personBodyTemplate}
            filter
            showFilterMenu={false}
            className='[&_input]:h-8'

            // editor={(options) => textEditor(options)}
          />
          <Column
            field='similarity'
            header='Benzerlik Oranı'
            filterMenuStyle={{ width: '14rem' }}
            style={{ maxWidth: '14rem' }}
            sortable
            filter
            showFilterMenu={false}
            filterElement={simRowFilterTemplate}
            editor={(options) => simularityEditor(options)}
          />
          <Column
            field='emotion'
            header='Duygu Durumu'
            filterMenuStyle={{ width: '12rem' }}
            style={{ maxWidth: '12rem' }}
            sortable
            filter
            showFilterMenu={false}
            filterPlaceholder='Duygu Durumu'
            body={emotionBodyTemplate}
            // filterElement={emotionFilterTemplate}
            editor={(options) => emotionEditor(options)}
            className='[&_input]:h-8'
            // className='[&_.p-column-filter>.p-column-filter-clear-button]:hidden'
          />
          <Column
            field='gender'
            header='Cinsiyet Tahmini'
            filterMenuStyle={{ width: '12rem' }}
            style={{ maxWidth: '12rem' }}
            body={(rowData) => formatGender(rowData.gender)}
            sortable
            filter
            showFilterMenu={false}
            filterPlaceholder='Cinsiyet'
            // filterElement={genderFilterTemplate}
            editor={(options) => genderEditor(options)}
            className='[&_input]:h-8'
          />
          <Column
            field='age'
            header='Yaş Tahmini'
            filterField='age'
            showFilterMenu={false}
            filterMenuStyle={{ width: '14rem' }}
            style={{ maxWidth: '14rem' }}
            sortable
            filter
            filterElement={ageRowFilterTemplate}
            editor={(options) => ageEditor(options)}
          />

          <Column
            field='image_path'
            header='Fotoğraf'
            body={(rowData) => (
              <div>
                <Image
                  className='cursor-pointer hover:opacity-80 transition-opacity duration-300'
                  width={64}
                  height={32}
                  objectFit='cover'
                  src={`${process.env.NEXT_PUBLIC_FLASK_URL}/images/${rowData.image_path}`}
                  onClick={() => setEnlargedImage(rowData.image_path)}
                  alt={''}
                />
                {enlargedImage === rowData.image_path && (
                  <EnlargedImage
                    src={`${process.env.NEXT_PUBLIC_FLASK_URL}/images/${rowData.image_path}`}
                    onClose={() => setEnlargedImage(false)}
                    alt={''}
                  />
                )}
              </div>
            )}
          />

          <Column
            field=''
            header='Eylemler'
            rowEditor
            filter
            showFilterMenu={false}
            filterElement={renderRowDeleteAndExportButtons}
            filterMenuStyle={{ width: '14rem' }}
            style={{ maxWidth: '14rem', width: '14rem' }}
            bodyStyle={{ textAlign: 'center' }}
            filterClear={() => null}
            className='[&_.p-column-filter>.p-column-filter-clear-button]:hidden'
            // filterClear={false}
            // filterHeaderStyle={{ display: 'flex', width: '100%' }}
          ></Column>
        </DataTable>
      }
    </div>
  );
};

export default RecognizedFacesTable;
