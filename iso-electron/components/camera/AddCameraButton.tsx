import React, { useState } from 'react';
import { PlusIcon, XIcon } from 'lucide-react';
import { Toast } from 'primereact/toast';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, useDisclosure } from '@nextui-org/react';
import { CameraIcon } from '../ui/CameraIcon';

interface AddCameraButtonProps {
  
  toast: React.RefObject<Toast>;
}

const AddCameraButton: React.FC<AddCameraButtonProps> = ({

  toast,
}) => {
  const [newCameraLabel, setNewCameraLabel] = useState('');
  const [newCameraUrl, setNewCameraUrl] = useState('');
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const handleAddCameraUrl = async () => {
    if (!newCameraLabel || !newCameraUrl) {
      alert("Kamera ismi ve URL'si boş olamaz!");
      return;
    }
    try {
      await fetch(`${process.env.NEXT_PUBLIC_FLASK_URL}/camera-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          label: newCameraLabel,
          url: newCameraUrl,
          crossOriginIsolated: false,
        }),
      });

      toast.current?.show({
        severity: 'success',
        summary: 'Success',
        detail: 'Yeni Kamera URL eklendi 🎉',
        life: 2000,
      });

      setNewCameraLabel('');
      setNewCameraUrl('');
      // setShowAddCamera(false); // Hide the section after adding a camera
      onOpenChange(); // Close the modal after adding a camera
    } catch (error) {
      console.error('Error adding camera URL:', error);
      alert('Kamera URL ekleme hatası: ' + error);
    }
  };

  return (
    <div >
      {!isOpen ? (
        <button
          onClick={onOpen}
          className='flex items-center gap-2 '
        >
          <CameraIcon className='w-6 h-6' />
         Yeni Kamera Ekle
        </button>
      ) : null}

      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        backdrop="opaque"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">Yeni Kamera URL Ekle</ModalHeader>
              <ModalBody>
                <Input
                  autoFocus
                  label="Kamera İsmi"
                  placeholder="Kamera İsmi"
                  value={newCameraLabel}
                  onChange={(e) => setNewCameraLabel(e.target.value)}
                  variant="bordered"
                />
                <Input
                  label="Kamera URL"
                  placeholder="Kamera URL"
                  value={newCameraUrl}
                  onChange={(e) => setNewCameraUrl(e.target.value)}
                  variant="bordered"
                />
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="flat" onPress={onClose}>
                  İptal
                </Button>
                <Button color="primary" onPress={handleAddCameraUrl}>
                  Ekle
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
};

export default AddCameraButton;



// import React, { useState } from 'react';
// import { PlusIcon, XIcon } from 'lucide-react';
// import { Toast } from 'primereact/toast';

// interface AddCameraButtonProps {
//   showAddCamera: boolean;
//   setShowAddCamera: React.Dispatch<React.SetStateAction<boolean>>;
//   disabled: boolean;
//   toast: React.RefObject<Toast>;
// }

// const AddCameraButton: React.FC<AddCameraButtonProps> = ({
//   disabled,
//   showAddCamera,
//   setShowAddCamera,
//   toast,
// }) => {
//   const [newCameraLabel, setNewCameraLabel] = useState('');
//   const [newCameraUrl, setNewCameraUrl] = useState('');

//   const handleAddCameraUrl = async () => {
//     if (!newCameraLabel || !newCameraUrl) {
//       alert("Kamera ismi ve URL'si boş olamaz!");
//       return;
//     }

//     try {
//       await fetch(`${process.env.NEXT_PUBLIC_FLASK_URL}/camera-url`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           label: newCameraLabel,
//           url: newCameraUrl,
//           crossOriginIsolated: false,
//         }),
//       });
//       // alert('Kamera URL eklendi 🎉');
//       toast.current?.show({
//         severity: 'success',
//         summary: 'Success',
//         detail: 'Yeni Kamera URL eklendi 🎉',
//         life: 2000,
//       });
//       setNewCameraLabel('');
//       setNewCameraUrl('');
//       setShowAddCamera(false); // Hide the section after adding a camera
//     } catch (error) {
//       console.error('Error adding camera URL:', error);
//       alert('Kamera URL ekleme hatası: ' + error);
//     }
//   };

//   return (
//     <div className='bg-slate-100 rounded-xl p-2 '>
//       {!showAddCamera ? (
//         <button
//           data-tip={
//             disabled ? 'Maximum 4 kamera eklenebilir' : 'Yeni kamera ekle'
//           }
//           className='tooltip tooltip-bottom btn btn-default btn-circle btn-outline 
//             rounded-3xl text-semibold flex items-center justify-center group'
//           disabled={disabled}
//           onClick={() => setShowAddCamera(true)} // Show the section when the button is clicked
//         >
//           <PlusIcon className='w-8 h-8' />
//           {/* <span className='hidden group-hover:flex '>Kamera Ekle</span> */}
//         </button>
//       ) : (
//         <div className='flex items-center justify-center gap-4 pb-4'>
//           <button
//             className='tooltip tooltip-bottom btn btn-sm btn-circle btn-default btn-outline rounded-3xl text-semibold 
//              text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500 text-center flex items-center justify-center gap-2'
//             disabled={disabled}
//             data-tip={'İptal'}
//             onClick={() => setShowAddCamera(false)} // Show the section when the button is clicked
//           >
//             <XIcon className='w-4 h-4' />
//           </button>
//           <h2 className='text-lg font-bold '>Yeni Kamera URL Ekle</h2>
//         </div>
//       )}
//       {showAddCamera && ( // Only render this section if showAddCamera is true
//         <div>
//           <div className='flex items-center justify-center'>
//             <div className=' flex items-center justify-center gap-2'>
//               <input
//                 type='text'
//                 placeholder='Kamera İsmi'
//                 value={newCameraLabel}
//                 onChange={(e) => setNewCameraLabel(e.target.value)}
//                 className='input input-bordered w-full max-w-xs'
//               />
//               <input
//                 type='text'
//                 placeholder='Kamera URL'
//                 value={newCameraUrl}
//                 onChange={(e) => setNewCameraUrl(e.target.value)}
//                 className='input input-bordered w-full max-w-xs'
//               />
//               <button
//                 onClick={handleAddCameraUrl}
//                 className='btn btn-primary text-white'
//               >
//                 Ekle
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default AddCameraButton;
