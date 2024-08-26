import React from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';

interface SingleRenameDialogProps {
  visible: boolean;
  singleRenameData: {
    segmentId: string;
    oldName: string;
    newName: string;
  };
  setSingleRenameData: (data: {
    segmentId: string;
    oldName: string;
    newName: string;
  }) => void;
  onHide: () => void;
  onConfirm: () => void;
}

const SingleRenameDialog: React.FC<SingleRenameDialogProps> = ({
  visible,
  singleRenameData,
  setSingleRenameData,
  onHide,
  onConfirm,
}) => {
  return (
    <Dialog
      visible={visible}
      style={{ width: '50vw' }}
      header='Konuşmacı ismi değiştirme'
      modal
      footer={
        <div>
          <Button
            label='İptal'
            icon='pi pi-times'
            onClick={onHide}
            className='p-button-text'
          />
          <Button
            label='Onayla'
            icon='pi pi-check'
            onClick={onConfirm}
            autoFocus
          />
        </div>
      }
      onHide={onHide}
    >
      <div>
        <p>
          <strong>{`${singleRenameData.segmentId}`}</strong> ID&apos;li Konuşma
          alt segmentine ait <strong>{singleRenameData.oldName + ' '}</strong>
          konuşmacı adını değiştirmek üzeresiniz.
        </p>

        <InputText
          value={singleRenameData.newName}
          placeholder='Yeni isim'
          onChange={(e) =>
            setSingleRenameData({
              ...singleRenameData,
              newName: e.target.value,
            })
          }
          className='w-full mt-2'
        />
      </div>
    </Dialog>
  );
};

export default SingleRenameDialog;
