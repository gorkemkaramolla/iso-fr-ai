import React, { useCallback, useEffect, useRef } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';

interface ChangeAllNamesDialogProps {
  visible: boolean;
  dialogData: {
    oldName: string;
    newName: string;
  };
  setDialogData: (data: { oldName: string; newName: string }) => void;
  onHide: () => void;
  onConfirm: () => void;
}

const ChangeAllNamesDialog: React.FC<ChangeAllNamesDialogProps> = ({
  visible,
  dialogData,
  setDialogData,
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
      header='İsim değişikliği onayı'
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
          Seçilen
          <strong>{' ' + dialogData.oldName}</strong> adlı kullanıcıya ait tüm
          konuşma alt segmentlerini değiştirmek üzeresiniz.
        </p>
        <InputText
          ref={inputRef}
          value={dialogData.newName}
          placeholder='Yeni isim'
          onChange={(e) =>
            setDialogData({ ...dialogData, newName: e.target.value })
          }
          onKeyDown={handleKeyDown}
          className='w-full mt-2'
        />
      </div>
    </Dialog>
  );
};

export default ChangeAllNamesDialog;
