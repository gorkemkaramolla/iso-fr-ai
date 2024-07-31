import React from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Avatar } from 'primereact/avatar';
import { Divider } from 'primereact/divider';

const FaceDialog = ({ visible, onHide, selectedFace, BASE_URL, index }: { visible: boolean, onHide: () => void, selectedFace: any, BASE_URL: string, index: number }) => {
  const header = (
    <div className="flex align-items-center gap-2">
      <Avatar image={`${BASE_URL}/images/${selectedFace?.image_path}`} shape="circle" size="large" />
      <span className="font-bold text-xl">{selectedFace?.label}</span>
    </div>
  );

  const footer = (
    <div>
      <Button label="Close" icon="pi pi-times" onClick={onHide} className="p-button-text" />
    </div>
  );

  return (
    <Dialog
      id={`modal-${index}`}
      header={header}
      visible={visible}
      style={{ width: '50vw' }}
      footer={footer}
      onHide={onHide}
      breakpoints={{ '960px': '75vw', '641px': '100vw' }}
    >
      {selectedFace && (
        <Card>
          <img
            src={`${BASE_URL}/images/${selectedFace.image_path}`}
            alt="Selected Face"
            className="w-full h-auto rounded-lg mb-4"
          />
          <Divider />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p><strong>Date:</strong> {new Date(selectedFace.timestamp).toLocaleString()}</p>
              <p><strong>Similarity:</strong> {selectedFace.similarity}</p>
              <p><strong>Emotion:</strong> {selectedFace.emotion}</p>
            </div>
            <div>
              <p><strong>Gender:</strong> {selectedFace.gender === 1 ? 'Male' : 'Female'}</p>
              <p><strong>Age:</strong> {selectedFace.age}</p>
              <p><strong>Image Path:</strong> {selectedFace.image_path}</p>
            </div>
          </div>
        </Card>
      )}
    </Dialog>
  );
};

export default FaceDialog;