import React, { useState, useEffect } from 'react';
import { XIcon, PlusIcon } from 'lucide-react';

type LogField =
  | 'date'
  | 'log'
  | 'source'
  | 'id'
  | 'container_name'
  | 'container_id';

const initialLogFields: LogField[] = [
  'date',
  'log',
  'source',
  'id',
  'container_name',
  'container_id',
];

interface FilterChipProps {
  onFilterChange: (fields: LogField[]) => void;
}

export default function FilterChip({ onFilterChange }: FilterChipProps) {
  const [activeFields, setActiveFields] = useState<LogField[]>(() => {
    const savedActiveFields = localStorage.getItem('activeLogFields');
    return savedActiveFields
      ? (JSON.parse(savedActiveFields) as LogField[])
      : initialLogFields;
  });

  const [inactiveFields, setInactiveFields] = useState<LogField[]>(() => {
    const savedInactiveFields = localStorage.getItem('inactiveLogFields');
    return savedInactiveFields
      ? (JSON.parse(savedInactiveFields) as LogField[])
      : [];
  });

  useEffect(() => {
    localStorage.setItem('activeLogFields', JSON.stringify(activeFields));
  }, [activeFields]);

  useEffect(() => {
    localStorage.setItem('inactiveLogFields', JSON.stringify(inactiveFields));
  }, [inactiveFields]);

  const handleDeactivate = (fieldToDeactivate: LogField) => {
    const updatedActiveFields = activeFields.filter(
      (field) => field !== fieldToDeactivate
    );
    setActiveFields(updatedActiveFields);
    setInactiveFields((prev) => [...prev, fieldToDeactivate]);
    onFilterChange(
      updatedActiveFields.length ? updatedActiveFields : initialLogFields
    );
  };

  const handleActivate = (fieldToActivate: LogField) => {
    const updatedActiveFields = [...activeFields, fieldToActivate];
    setActiveFields(updatedActiveFields);
    setInactiveFields((prev) =>
      prev.filter((field) => field !== fieldToActivate)
    );
    onFilterChange(updatedActiveFields);
  };

  const resetFilters = () => {
    setActiveFields(initialLogFields);
    setInactiveFields([]);
    onFilterChange(initialLogFields);
  };

  return (
    <div className='bg-white/80 backdrop-blur-sm p-3 rounded-lg shadow-lg'>
      <h3 className='text-gray-900 text-sm font-semibold mb-2'>
        Log Filtreleri
      </h3>

      {activeFields.length === 0 && (
        <p className='text-blue-600 text-xs mb-2'>
          Bilgilendirme: Herhangi bir filtre seçilmedi. Arama tüm alanlarda
          yapılacak.
        </p>
      )}

      <div className='flex flex-wrap gap-2 mb-2'>
        {activeFields.map((field, index) => (
          <button
            key={index}
            className='bg-gray-200 text-gray-800 px-2 py-1 rounded-full text-xs flex items-center hover:bg-gray-300 transition-colors'
            onClick={() => handleDeactivate(field)}
          >
            <span className='mr-1'>{field}</span>
            <XIcon size={12} />
          </button>
        ))}
      </div>

      {inactiveFields.length > 0 && (
        <div className='flex flex-wrap gap-2 mb-2'>
          {inactiveFields.map((field, index) => (
            <button
              key={index}
              className='bg-gray-300 text-gray-600 px-2 py-1 rounded-full text-xs flex items-center hover:bg-gray-400 transition-colors'
              onClick={() => handleActivate(field)}
            >
              <span className='mr-1'>{field}</span>
              <PlusIcon size={12} />
            </button>
          ))}
        </div>
      )}

      {inactiveFields.length > 0 && (
        <button
          onClick={resetFilters}
          className='text-gray-600 text-xs hover:text-gray-800 transition-colors'
        >
          Filtreleri Sıfırla
        </button>
      )}

      {activeFields.length === initialLogFields.length && (
        <p className='text-green-600 text-xs mt-2'>Tüm alanlar aktif.</p>
      )}
    </div>
  );
}
