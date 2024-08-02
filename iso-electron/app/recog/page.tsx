'use client';
import React, { useState, useEffect } from 'react';
import {
  DataTable,
  DataTableExpandedRows,
  DataTableFilterMeta,
} from 'primereact/datatable';
import { Column, ColumnFilterElementTemplateOptions } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { FilterMatchMode } from 'primereact/api';
import { Button } from 'primereact/button';
import { InputIcon } from 'primereact/inputicon';
import { IconField } from 'primereact/iconfield';
import { Card } from 'primereact/card';

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
  similarity: { value: null, matchMode: FilterMatchMode.EQUALS },
  emotion: { value: null, matchMode: FilterMatchMode.EQUALS },
  gender: { value: null, matchMode: FilterMatchMode.EQUALS },
  age: { value: null, matchMode: FilterMatchMode.EQUALS },
};

const RecognizedFacesTable: React.FC = () => {
  const [recognizedFaces, setRecognizedFaces] = useState<RecognizedFace[]>([]);
  const [filters, setFilters] = useState<DataTableFilterMeta>(defaultFilters);
  const [globalFilterValue, setGlobalFilterValue] = useState<string>('');
  const [expandedRows, setExpandedRows] = useState<
    DataTableExpandedRows | RecognizedFace[]
  >([]);
  useEffect(() => {
    // Fetch recognized face data from the backend using fetch
    const fetchData = async () => {
      try {
        const response = await fetch(
          process.env.NEXT_PUBLIC_FLASK_URL + '/recog'
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setRecognizedFaces(data);
      } catch (error) {
        console.error('Error fetching recognized face data:', error);
      }
    };

    fetchData();
  }, []);

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

  const clearFilter = () => {
    initFilters();
  };

  const initFilters = () => {
    setFilters(defaultFilters);
    setGlobalFilterValue('');
  };

  const renderHeader = () => {
    return (
      <div className='flex justify-between w-full'>
        <div className='text-4xl'>Tanınan Yüzler</div>
        <IconField iconPosition='left'>
          <InputIcon className='pi pi-search' />
          <InputText
            className='w-[600px]'
            value={globalFilterValue}
            onChange={onGlobalFilterChange}
            placeholder='Keyword Search'
          />
        </IconField>
        <Button
          type='button'
          icon='pi pi-filter-slash'
          label='Clear'
          outlined
          onClick={clearFilter}
        />
      </div>
    );
  };

  const emotionFilterTemplate = (
    options: ColumnFilterElementTemplateOptions
  ) => {
    return (
      <Dropdown
        value={options.value}
        options={['Neutral', 'Happy', 'Sad', 'Angry', 'Surprised']}
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

  const header = renderHeader();

  return (
    <div className='container mx-auto my-10'>
      <Card>
        <DataTable
          className='custom-datatable'
          value={recognizedFaces}
          size='small'
          paginator
          rows={100}
          rowsPerPageOptions={[50, 100, 500]}
          dataKey='_id.$oid'
          filters={filters}
          filterDisplay='menu'
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
          rowGroupMode='subheader' // Enable row grouping
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
        >
          <Column field='_id.$oid' header='ID' sortable />
          <Column
            field='timestamp'
            header='Timestamp'
            body={(rowData) => formatTimestamp(rowData.timestamp)}
            sortable
          />
          <Column
            field='label'
            header='Label'
            sortable
            filter
            filterPlaceholder='Search by label'
          />
          <Column field='similarity' header='Similarity' sortable filter />
          <Column
            field='emotion'
            header='Emotion'
            sortable
            filter
            filterElement={emotionFilterTemplate}
          />
          <Column
            field='gender'
            header='Gender'
            body={(rowData) => formatGender(rowData.gender)}
            sortable
            filter
            filterElement={genderFilterTemplate}
          />
          <Column
            field='age'
            header='Age'
            sortable
            filter
            filterPlaceholder='Search by age'
          />
          <Column
            field='image_path'
            header='Image Path'
            body={(rowData) => (
              <img
                src={`${process.env.NEXT_PUBLIC_FLASK_URL}/images/${rowData.image_path}`}
                alt='Face'
                style={{ width: '50px', height: '50px', borderRadius: '5px' }}
              />
            )}
          />
        </DataTable>
      </Card>
    </div>
  );
};

export default RecognizedFacesTable;

// "use client"
// import React, { useState, useEffect } from 'react';
// import { DataTable, DataTableFilterMeta } from 'primereact/datatable';
// import { Column, ColumnFilterElementTemplateOptions } from 'primereact/column';
// import { InputText } from 'primereact/inputtext';
// import { Dropdown } from 'primereact/dropdown';
// import { FilterMatchMode } from 'primereact/api';
// import { Button } from 'primereact/button';
// import { InputIcon } from 'primereact/inputicon';
// import { IconField } from 'primereact/iconfield';

// import 'primereact/resources/themes/lara-light-indigo/theme.css';
// import 'primereact/resources/primereact.min.css';
// import 'primeicons/primeicons.css';
// import { Card } from 'primereact/card';

// interface RecognizedFace {
//   _id: {
//     $oid: string;
//   };
//   timestamp: number;
//   label: string;
//   similarity: number;
//   emotion: string;
//   gender: number;
//   age: number;
//   image_path: string;
// }

// const defaultFilters: DataTableFilterMeta = {
//   global: { value: null, matchMode: FilterMatchMode.CONTAINS },
//   label: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
//   similarity: { value: null, matchMode: FilterMatchMode.EQUALS },
//   emotion: { value: null, matchMode: FilterMatchMode.EQUALS },
//   gender: { value: null, matchMode: FilterMatchMode.EQUALS },
//   age: { value: null, matchMode: FilterMatchMode.EQUALS },
// };

// const RecognizedFacesTable: React.FC = () => {
//   const [recognizedFaces, setRecognizedFaces] = useState<RecognizedFace[]>([]);
//   const [filters, setFilters] = useState<DataTableFilterMeta>(defaultFilters);
//   const [globalFilterValue, setGlobalFilterValue] = useState<string>('');

//   useEffect(() => {
//     // Fetch recognized face data from the backend using fetch
//     const fetchData = async () => {
//       try {
//         const response = await fetch(process.env.NEXT_PUBLIC_FLASK_URL + '/recog');
//         if (!response.ok) {
//           throw new Error(`HTTP error! status: ${response.status}`);
//         }
//         const data = await response.json();
//         setRecognizedFaces(data);
//       } catch (error) {
//         console.error("Error fetching recognized face data:", error);
//       }
//     };

//     fetchData();
//   }, []);

//   const formatTimestamp = (value: number) => {
//     return new Date(value).toLocaleString();
//   };

//   const formatGender = (value: number) => {
//     return value === 1 ? 'Male' : 'Female';
//   };

//   const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const value = e.target.value;
//     let _filters: DataTableFilterMeta = { ...filters };
//     //@ts-ignore
//     _filters['global'].value = value;

//     setFilters(_filters);
//     setGlobalFilterValue(value);
//   };

//   const clearFilter = () => {
//     initFilters();
//   };

//   const initFilters = () => {
//     setFilters(defaultFilters);
//     setGlobalFilterValue('');
//   };

//   const renderHeader = () => {
//     return (
//       <div className="flex justify-between w-full">
//         <div className='text-4xl'>Tanınan Yüzler</div>
//         <IconField  iconPosition="left">
//           <InputIcon className="pi pi-search" />
//           <InputText className='w-[600px]' value={globalFilterValue} onChange={onGlobalFilterChange} placeholder="Keyword Search" />
//         </IconField>
//         <Button type="button" icon="pi pi-filter-slash" label="Clear" outlined onClick={clearFilter} />
//       </div>
//     );
//   };

//   const emotionFilterTemplate = (options: ColumnFilterElementTemplateOptions) => {
//     return (
//       <Dropdown
//         value={options.value}
//         options={['Neutral', 'Happy', 'Sad', 'Angry', 'Surprised']}
//         onChange={(e) => options.filterCallback(e.value, options.index)}
//         placeholder="Select an Emotion"
//         className="p-column-filter"
//         showClear
//       />
//     );
//   };

//   const genderFilterTemplate = (options: ColumnFilterElementTemplateOptions) => {
//     return (
//       <Dropdown
//         value={options.value}
//         options={[
//           { label: 'Male', value: 1 },
//           { label: 'Female', value: 0 }
//         ]}
//         onChange={(e) => options.filterCallback(e.value, options.index)}
//         optionLabel="label"
//         placeholder="Select a Gender"
//         className="p-column-filter"
//         showClear
//       />
//     );
//   };

//   const header = renderHeader();

//   return (
//     <div className='container mx-auto my-10'>
//         <Card>
//       <DataTable
//         value={recognizedFaces}
//         paginator
//         rows={10}
//         rowsPerPageOptions={[5, 10, 25, 50]}
//         dataKey="_id.$oid"
//         filters={filters}
//         filterDisplay="menu"
//         globalFilterFields={['label', 'emotion', 'gender', 'age']}
//         header={header}
//         emptyMessage="No recognized faces found."
//         scrollHeight="800px"
//         scrollable
//         removableSort
//       >
//         <Column field="_id.$oid" header="ID" sortable />
//         <Column field="timestamp" header="Timestamp" body={(rowData) => formatTimestamp(rowData.timestamp)} sortable />
//         <Column field="label" header="Label" sortable filter filterPlaceholder="Search by label" />
//         <Column field="similarity" header="Similarity" sortable filter />
//         <Column field="emotion" header="Emotion" sortable filter filterElement={emotionFilterTemplate} />
//         <Column field="gender" header="Gender" body={(rowData) => formatGender(rowData.gender)} sortable filter filterElement={genderFilterTemplate} />
//         <Column field="age" header="Age" sortable filter filterPlaceholder="Search by age" />
//         <Column field="image_path" header="Image Path" body={(rowData) => (
//           <img src={`${process.env.NEXT_PUBLIC_FLASK_URL}/images/${rowData.image_path}`} alt="Face" style={{ width: '50px', height: '50px' }} />
//         )} />
//       </DataTable>
//       </Card>
//     </div>
//   );
// };

// export default RecognizedFacesTable;
