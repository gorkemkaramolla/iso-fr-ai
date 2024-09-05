import React, { useState } from 'react';
import { saveAs } from 'file-saver';
import { Parser } from 'json2csv';
import * as XLSX from 'xlsx';
import { RiFileExcel2Line } from 'react-icons/ri';
import { BsFiletypeCsv, BsFiletypeJson } from 'react-icons/bs';
import { FaFileWord } from 'react-icons/fa';
import { ClipboardCheck, Clipboard, Ellipsis, Trash2 } from 'lucide-react';
import ConfirmationDialog from '../ui/confirmation-dialog';
import Tooltip from '../ui/tool-tip';
import { motion } from 'framer-motion';

interface ExportButtonsProps {
  data: any;
  isActivePage?: boolean;
  isTranscriptionNameEditing?: boolean;
  setTranscriptionNameEditing?: React.Dispatch<React.SetStateAction<boolean>>;
  fileName?: string;
  handleDeleteTranscription?: () => void;
  showDelete?: boolean;
  showRename?: boolean;
  showExport?: boolean;
  handleCopy: () => void; // Accept handleCopy as a prop
}

const ExportButtons: React.FC<ExportButtonsProps> = ({
  data,
  isActivePage,
  fileName = 'export',
  isTranscriptionNameEditing,
  setTranscriptionNameEditing,
  handleDeleteTranscription,
  handleCopy,
  showDelete = false,
  showRename = false,
  showExport = false,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showCopyAnimation, setShowCopyAnimation] = useState(false);

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
    if (
      setTranscriptionNameEditing &&
      isTranscriptionNameEditing !== undefined
    ) {
      setTranscriptionNameEditing(!isTranscriptionNameEditing);
    }
  };

  const confirmDelete = () => {
    if (handleDeleteTranscription) {
      handleDeleteTranscription();
    }
    setIsDialogOpen(false);
  };

  const handleCopyClick = () => {
    handleCopy();
    setShowCopyAnimation(true);
    setTimeout(() => setShowCopyAnimation(false), 2000); // Hide animation after 2 seconds
  };

  return (
    <div className={isActivePage ? '' : 'text-gray-700'}>
      <div className='dropdown dropdown-end'>
        <label tabIndex={0} className='btn btn-ghost btn-circle'>
          <Ellipsis className='' size={24} />
        </label>
        <ul
          tabIndex={0}
          className='menu dropdown-content z-[1] p-2 shadow bg-base-100 rounded-box w-52'
        >
          {showRename &&
            setTranscriptionNameEditing &&
            isTranscriptionNameEditing !== undefined && (
              <li className='text-gray-700'>
                <button onClick={handleRename}>
                  {!isTranscriptionNameEditing
                    ? 'Sentez Adını Değiştir'
                    : 'İptal Et'}
                </button>
              </li>
            )}

          {showDelete && handleDeleteTranscription && (
            <li className='bg-red-500 text-white'>
              <button
                onClick={() => setIsDialogOpen(true)}
                className='w-full flex justify-between'
              >
                Sentezi Sil
                <Trash2 size={18} />
              </button>
            </li>
          )}
          {showExport && (
            <li className='text-gray-700'>
              <details>
                <summary>Dışarıya Aktar</summary>
                <ul className='p-2'>
                  <li>
                    <button
                      onClick={handleCopyClick}
                      className='w-full flex justify-between'
                    >
                      <div
                        className={`flex justify-between w-full ${
                          showCopyAnimation ? 'text-green-600' : ''
                        }`}
                      >
                        <span>
                          {showCopyAnimation ? 'Kopyalandı' : 'Kopyala'}
                        </span>
                        {showCopyAnimation ? (
                          <ClipboardCheck size={18} />
                        ) : (
                          <Clipboard size={18} />
                        )}
                      </div>
                    </button>
                  </li>

                  <li>
                    <Tooltip
                      content='Excel formatında dışa aktar'
                      placement='right'
                    >
                      <button
                        onClick={handleExportExcel}
                        className='w-full flex justify-between'
                      >
                        Excel
                        <RiFileExcel2Line size={18} />
                      </button>
                    </Tooltip>
                  </li>
                  <li>
                    <Tooltip
                      content='CSV formatında dışa aktar'
                      placement='right'
                    >
                      <button
                        onClick={handleExportCSV}
                        className='w-full flex justify-between'
                      >
                        CSV
                        <BsFiletypeCsv size={18} />
                      </button>
                    </Tooltip>
                  </li>
                  <li>
                    <Tooltip
                      content='JSON formatında dışa aktar'
                      placement='right'
                    >
                      <button
                        onClick={handleExportJSON}
                        className='w-full flex justify-between'
                      >
                        JSON
                        <BsFiletypeJson size={18} />
                      </button>
                    </Tooltip>
                  </li>
                  <li>
                    <Tooltip
                      content='Word formatında dışa aktar'
                      placement='right'
                    >
                      <button
                        onClick={handleExportWord}
                        className='w-full flex justify-between'
                      >
                        Word
                        <FaFileWord size={18} />
                      </button>
                    </Tooltip>
                  </li>
                </ul>
              </details>
            </li>
          )}
        </ul>
      </div>

      {/* PrimeReact Dialog */}
      {showDelete && handleDeleteTranscription && (
        <ConfirmationDialog
          visible={isDialogOpen}
          title='Silme Onayı'
          message='Sentezi silmek istediğinizden emin misiniz?'
          onHide={() => setIsDialogOpen(false)}
          onConfirm={confirmDelete}
          confirmLabel='Sil'
          confirmClassName='p-button-danger'
        />
      )}
    </div>
  );
};

export default ExportButtons;
