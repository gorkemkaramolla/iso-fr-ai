'use client';
import React, { useState, useEffect } from 'react';
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

const RecognizedFacesTable: React.FC = () => {
  const [recognizedFaces, setRecognizedFaces] = useState<RecognizedFace[]>([]);
  const [filters, setFilters] = useState<DataTableFilterMeta>(defaultFilters);
  const [globalFilterValue, setGlobalFilterValue] = useState<string>('');
  const [selectedFaces, setSelectedFaces] = useState<RecognizedFace[] | null>(
    null
  );
  const [selectedDate, setSelectedDate] = useState<Nullable<Date>>(new Date()); // State for selected date

  const [loading, setLoading] = useState<boolean>(true);
  useEffect(() => {
    // console.log('selec tedDate:', selectedDate);
    const fetchRecogFaces = async () => {
      try {
        // Fetch recognized face data from the backend using fetch
        const faces = await getRecogFaces(selectedDate?.toISOString());
        setRecognizedFaces(faces);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching recognized face data:', error);
      }
    };
    fetchRecogFaces();

    // const fetchData = async () => {
    //   try {
    //     const response = await fetch(
    //       process.env.NEXT_PUBLIC_FLASK_URL + '/recog'
    //     );
    //     if (!response.ok) {
    //       throw new Error(`HTTP error! status: ${response.status}`);
    //     }
    //     const data = await response.json();
    //     setRecognizedFaces(data);
    //     setLoading(false);
    //   } catch (error) {
    //     console.error('Error fetching recognized face data:', error);
    //   }
    // };

    // fetchData();
  }, [selectedDate]);

  const formatTimestamp = (value: number) => {
    return new Date(value).toLocaleString();
  };

  const formatGender = (value: number) => {
    return value === 1 ? 'Male' : 'Female';
  };

  const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    let _filters: DataTableFilterMeta = { ...filters };
    //@ts-ignore
    _filters['global'].value = value;

    setFilters(_filters);
    setGlobalFilterValue(value);
  };

  const initFilters = () => {
    setFilters(defaultFilters);
    setGlobalFilterValue('');
  };

  const renderHeader = () => {
    return (
      <div className='flex justify-between w-full items-center px-2'>
        <div className='text-4xl nunito-700 '>Tanınan Yüzler</div>
        <div className='flex items-center gap-4'>
          {selectedFaces && selectedFaces?.length > 0 && (
            <button
              className='p-button p-component p-button-danger'
              onClick={handleDeleteSelected}
            >
              <span className='p-button-label'>Delete Selected</span>
            </button>
          )}
          <IconField iconPosition='left'>
            <InputIcon className='pi pi-search' />
            <InputText
              className='w-[400px]'
              value={globalFilterValue}
              onChange={onGlobalFilterChange}
              placeholder='Keyword Search'
            />
          </IconField>
        </div>
      </div>
    );
  };
  const onRowEditComplete = (e: DataTableRowEditCompleteEvent) => {
    let _recognizedFaces = [...recognizedFaces];
    let { newData, index } = e;
    _recognizedFaces[index] = newData as RecognizedFace;
    setRecognizedFaces(_recognizedFaces);
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
        prefix='%'
        mode='decimal'
        minFractionDigits={1}
        maxFractionDigits={2}
        max={100}
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
        value={options.value}
        onChange={(e) =>
          options.editorCallback && options.editorCallback(e.value)
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
          'Angry',
          'Disgust',
          'Fear',
          'Happy',
          'Sad',
          'Surprise',
          'Neutral',
          'Unknown',
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
          { label: 'Male', value: 1 },
          { label: 'Female', value: 0 },
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
          'Angry',
          'Disgust',
          'Fear',
          'Happy',
          'Sad',
          'Surprise',
          'Neutral',
          'Unknown',
        ]}
        onChange={(e) => options.filterCallback(e.value, options.index)}
        placeholder='Select an Emotion'
        className='p-column-filter'
        showClear
      />
    );
  };

  const genderFilterTemplate = (
    options: ColumnFilterElementTemplateOptions
  ) => {
    return (
      <Dropdown
        value={options.value}
        options={[
          { label: 'Male', value: 1 },
          { label: 'Female', value: 0 },
        ]}
        onChange={(e) => options.filterCallback(e.value, options.index)}
        optionLabel='label'
        placeholder='Select a Gender'
        className='p-column-filter'
        showClear
      />
    );
  };

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
          }}
        />
        <InputNumber
          value={to}
          onChange={(e) => options.filterApplyCallback([from, e.value])}
          placeholder='to'
          style={{
            minWidth: '4rem !important',
            maxWidth: '4rem !important',
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
          max={100}
          min={0}
          step={0.01}
          placeholder='from'
          style={{
            minWidth: '4rem !important',
            maxWidth: '4rem !important',
          }}
        />
        <InputNumber
          value={to}
          onChange={(e) => options.filterApplyCallback([from, e.value])}
          mode='decimal'
          minFractionDigits={1}
          maxFractionDigits={2}
          max={100}
          min={0}
          step={0.01}
          placeholder='to'
          style={{
            minWidth: '4rem !important',
            maxWidth: '4rem !important',
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
        minDate={new Date('2024-08-01')}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
      />
    );
  };
  const header = renderHeader();

  return (
    <div className='container mx-auto my-10 rounded-lg shadow-lg '>
      {
        // @ts-ignore
        <DataTable
          className='custom-datatable'
          value={recognizedFaces}
          size='small'
          paginator
          rows={100}
          rowsPerPageOptions={[50, 100, 500]}
          dataKey='_id.$oid'
          filters={filters}
          filterDisplay='row'
          loading={loading}
          // globalFilterFields={['name', 'country.name', 'representative.name', 'status']}
          // filterDisplay='menu'
          dragSelection
          globalFilterFields={[
            'label',
            'emotion',
            'similarity',
            'gender',
            'age',
          ]}
          header={header}
          emptyMessage='No recognized faces found.'
          scrollable
          removableSort
          rowGroupMode='subheader'
          groupRowsBy='label'
          sortMode='single'
          sortOrder={1}
          rowGroupHeaderTemplate={(data) => (
            <div className='inline-flex text-center'>
              <div className='flex gap-2 items-center justify-center text-center'>
                <img
                  src={
                    process.env.NEXT_PUBLIC_FLASK_URL + '/faces/' + data.label
                  }
                  alt=''
                  className='w-[32px] h-[32px] rounded-full shadow-lg'
                  onError={(e) => {
                    e.currentTarget.src = '/inner_circle.png';
                  }}
                />
                <span className='font-bold text-lg'>{data.label}</span>
              </div>
            </div>
          )}
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
            header='Timestamp'
            body={(rowData) => formatTimestamp(rowData.timestamp)}
            sortable
            filterPlaceholder='Search by date'
            filter
            filterElement={dateFilterTemplate}
            showFilterMenu={false}
            editor={(options) => calendarEditor(options)}
          />
          <Column
            field='label'
            header='Label'
            filterMenuStyle={{ width: '14rem' }}
            style={{ maxWidth: '14rem' }}
            sortable
            filterPlaceholder='Search by name'
            filter
            showFilterMenu={false}
            editor={(options) => textEditor(options)}
          />
          <Column
            field='similarity'
            header='Similarity'
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
            header='Emotion'
            filterMenuStyle={{ width: '14rem' }}
            style={{ maxWidth: '14rem' }}
            sortable
            filter
            showFilterMenu={false}
            filterElement={emotionFilterTemplate}
            editor={(options) => emotionEditor(options)}
          />
          <Column
            field='gender'
            header='Gender'
            filterMenuStyle={{ width: '14rem' }}
            style={{ maxWidth: '14rem' }}
            body={(rowData) => formatGender(rowData.gender)}
            sortable
            filter
            showFilterMenu={false}
            filterElement={genderFilterTemplate}
            editor={(options) => genderEditor(options)}
          />
          <Column
            field='age'
            header='Age'
            filterField='age'
            showFilterMenu={false}
            filterMenuStyle={{ width: '11rem' }}
            style={{ maxWidth: '11rem' }}
            sortable
            filter
            filterElement={ageRowFilterTemplate}
            editor={(options) => ageEditor(options)}
          />
          {/* <Column
            field='age'
            header='Age'
            sortable
            filter
            filterPlaceholder='Search by age'
            editor={(options) => ageEditor(options)}
          /> */}
          <Column
            field='image_path'
            header='Image'
            body={(rowData) => (
              <img
                src={`${process.env.NEXT_PUBLIC_FLASK_URL}/images/${rowData.image_path}`}
                alt='Face'
                style={{ width: '50px', height: '50px', borderRadius: '5px' }}
              />
            )}
          />
          <Column
            header='Actions'
            rowEditor
            headerStyle={{ width: '10%', minWidth: '8rem' }}
            bodyStyle={{ textAlign: 'center' }}
          ></Column>
        </DataTable>
      }
    </div>
  );
};

export default RecognizedFacesTable;
