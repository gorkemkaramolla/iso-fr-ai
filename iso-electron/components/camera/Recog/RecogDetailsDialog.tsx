import React from 'react';
import { Modal, ModalContent, ModalBody } from '@nextui-org/react';
import RecogDetails from './RecogDetails';
import { RecogFace } from '@/types';

interface RecogDetailsModalProps {
  selectedFace: RecogFace | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const RecogDetailsModal: React.FC<RecogDetailsModalProps> = ({
  selectedFace,
  isOpen,
  onOpenChange,
}) => {
  return (
    <>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size='4xl'>
        <ModalContent>
          <ModalBody className='p-0 m-0'>
            {selectedFace && <RecogDetails selectedFace={selectedFace} />}
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default RecogDetailsModal;
