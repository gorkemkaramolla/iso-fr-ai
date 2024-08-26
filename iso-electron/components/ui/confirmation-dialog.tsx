import React from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';

interface ConfirmationDialogProps {
  visible: boolean;
  title: string;
  message: string;
  onHide: () => void;
  onConfirm: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmClassName?: string;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  visible,
  title,
  message,
  onHide,
  onConfirm,
  confirmLabel = 'Onayla',
  cancelLabel = 'İptal',
  confirmClassName = 'p-button-danger',
}) => {
  return (
    <Dialog
      visible={visible}
      style={{ width: '350px' }}
      header={title}
      modal
      footer={
        <div>
          <Button
            label={cancelLabel}
            icon='pi pi-times'
            onClick={onHide}
            className='p-button-text'
          />
          <Button
            label={confirmLabel}
            icon='pi pi-check'
            onClick={onConfirm}
            className={confirmClassName}
          />
        </div>
      }
      onHide={onHide}
    >
      <div>
        <p>{message}</p>
      </div>
    </Dialog>
  );
};

export default ConfirmationDialog;
