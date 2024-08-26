import React, { useCallback, useEffect, useRef } from 'react';
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
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        onConfirm();
      }
    },
    [onConfirm]
  );

  useEffect(() => {
    if (visible) {
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 200);
    }
  }, [visible]);

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
          ref={inputRef}
          value={singleRenameData.newName}
          placeholder='Yeni isim'
          onChange={(e) =>
            setSingleRenameData({
              ...singleRenameData,
              newName: e.target.value,
            })
          }
          onKeyDown={handleKeyDown}
          className='w-full mt-2'
        />
      </div>
    </Dialog>
  );
};

export default SingleRenameDialog;
