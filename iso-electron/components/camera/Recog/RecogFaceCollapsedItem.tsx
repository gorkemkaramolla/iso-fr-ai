import {
  formatLastSeen,
  getLatestTimestamp,
  truncateString,
} from '@/library/camera/utils';
import { GroupedRecogFaces } from '@/types';
import React from 'react';

interface RecogFaceCollapsedItemProps {
  group: GroupedRecogFaces;
  editingName: string | null;
  newName: string;
  setNewName: (name: string) => void;
  setEditingName: (name: string | null) => void;
  handleImageClick: (name: string) => void;
  handleEditName: (name: string) => void;
  handleToggle: (name: string) => void;
}

const RecogFaceCollapsedItem: React.FC<RecogFaceCollapsedItemProps> = ({
  group,
  editingName,
  newName,
  setNewName,
  setEditingName,
  handleImageClick,
  handleEditName,
  handleToggle,
}) => {
  return (
    <div className='flex items-center justify-start gap-2 font-bold bg-slate-50 w-full p-2 rounded-xl shadow-md'>
      <>
        <img
          // src={`${process.env.NEXT_PUBLIC_FLASK_URL}/faces/${group.name}`}
          src={`${process.env.NEXT_PUBLIC_UTILS_URL}/personel/image/?id=${group.personnel_id}`}
          alt='avatar'
          className='shadow-md shadow-red-500 object-cover w-10 h-10 rounded-full cursor-pointer'
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = './inner_circle.png';
          }}
          onClick={() => handleImageClick(group.personnel_id)}
          title='Profile Git'
        />
      </>
      {editingName === group.name ? (
        <div className='flex items-center gap-2'>
          <input
            type='text'
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className='input input-sm input-bordered w-full max-w-xs text-xs font-normal px-2'
          />
          <button
            onClick={() => handleEditName(group.name)}
            className='btn btn-sm btn-primary text-white'
          >
            Kaydet
          </button>
          <button
            onClick={() => setEditingName(null)}
            className='btn btn-sm btn-secondary text-white'
          >
            İptal
          </button>
        </div>
      ) : (
        <div className='flex justify-between items-center w-full'>
          <div className='text-xs overflow-hidden'>
            <span
              className='cursor-pointer'
              onClick={() => handleToggle(group.name)}
              title='Tüm yüz tanımalar'
            >
              {truncateString(group.name, 20)}
            </span>
            <br />
            <span className='font-light text-xs'>
              {formatLastSeen(getLatestTimestamp(group.faces))}
            </span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setEditingName(group.name);
              setNewName(group.name);
            }}
            className='btn btn-sm btn-outline'
          >
            Düzenle
          </button>
        </div>
      )}
    </div>
  );
};

export default RecogFaceCollapsedItem;
