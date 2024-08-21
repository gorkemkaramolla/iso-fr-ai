import React from 'react';
import { saveAs } from 'file-saver';
import { Parser } from 'json2csv';
import * as XLSX from 'xlsx';
import { RiFileExcel2Line } from 'react-icons/ri';
import { BsFiletypeCsv, BsFiletypeJson } from 'react-icons/bs';
import { FaFileWord } from 'react-icons/fa';
import NextUIDropDown from '@/components/ui/nextui-dropdown'; // Import your updated NextUIDropDown component
import { Ellipsis, Trash2 } from 'lucide-react';

interface ExportButtonsProps {
  data: any;
  isTranscriptionNameEditing: boolean;
  setTranscriptionNameEditing: React.Dispatch<React.SetStateAction<boolean>>;
  fileName: string;
  handleDeleteTranscription: () => void;
}

const ExportButtons: React.FC<ExportButtonsProps> = ({
  data,
  fileName,
  isTranscriptionNameEditing,
  setTranscriptionNameEditing,
  handleDeleteTranscription,
}) => {
  const flattenData = (data: any) => {
    const { segments, ...rest } = data;
    const segmentsString = segments ? JSON.stringify(segments) : '';
    return [{ ...rest, segments: segmentsString }];
  };

  const handleExportExcel = () => {
    const flattenedData = flattenData(data);
    const worksheet = XLSX.utils.json_to_sheet(flattenedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  };

  const handleExportCSV = () => {
    const flattenedData = flattenData(data);
    const parser = new Parser();
    const csv = parser.parse(flattenedData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `${fileName}.csv`);
  };

  const handleExportWord = () => {
    const flattenedData = flattenData(data);
    let content = '';
    flattenedData.forEach((item: any, index: number) => {
      content += `Segment ${index + 1}\n\n`;
      Object.entries(item).forEach(([key, value]) => {
        content += `${key}: ${value}\n`;
      });
      content += '\n\n';
    });
    const blob = new Blob([content], {
      type: 'application/msword;charset=utf-8;',
    });
    saveAs(blob, `${fileName}.doc`);
  };

  const handleExportJSON = () => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
    saveAs(blob, `${fileName}.json`);
  };

  const handleRename = () => {
    setTranscriptionNameEditing(!isTranscriptionNameEditing);
  };
  return (
    <div className='dropdown dropdown-end'>
      <label tabIndex={0} className='btn btn-ghost btn-circle'>
        <Ellipsis size={24} />
      </label>
      <ul
        tabIndex={0}
        className='menu dropdown-content z-[1] p-2 shadow bg-base-100 rounded-box w-52'
      >
        <li>
          <button
            onClick={() => {
              handleRename();
            }}
          >
            {!isTranscriptionNameEditing ? 'Sentez Adını Değiştir' : 'İptal Et'}
          </button>
        </li>
        <li className='bg-red-500 text-white'>
          <button
            onClick={handleDeleteTranscription}
            className='w-full flex justify-between'
          >
            Sentezi Sil
            <Trash2 size={18} />
          </button>
        </li>
        <li>
          <details>
            <summary>Dışarıya Aktar</summary>
            <ul className='p-2'>
              <li>
                <button
                  onClick={handleExportExcel}
                  className='w-full flex justify-between'
                >
                  Excel
                  <RiFileExcel2Line size={18} />
                </button>
              </li>
              <li>
                <button
                  onClick={handleExportCSV}
                  className='w-full flex justify-between'
                >
                  CSV
                  <BsFiletypeCsv size={18} />
                </button>
              </li>
              <li>
                <button
                  onClick={handleExportJSON}
                  className='w-full flex justify-between'
                >
                  JSON
                  <BsFiletypeJson size={18} />
                </button>
              </li>
              <li>
                <button
                  onClick={handleExportWord}
                  className='w-full flex justify-between'
                >
                  Word
                  <FaFileWord size={18} />
                </button>
              </li>
            </ul>
          </details>
        </li>
      </ul>
    </div>
  );
};

export default ExportButtons;
