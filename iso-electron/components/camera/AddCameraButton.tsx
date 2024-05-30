import React, { useState } from "react";
import { PlusIcon, XIcon } from "lucide-react";
import axios from "axios";

interface AddCameraButtonProps {
  showAddCamera: boolean;
  setShowAddCamera: React.Dispatch<React.SetStateAction<boolean>>;
  disabled: boolean;
}

const AddCameraButton: React.FC<AddCameraButtonProps> = ({
  disabled,
  showAddCamera,
  setShowAddCamera,
}) => {
  const [newCameraLabel, setNewCameraLabel] = useState("");
  const [newCameraUrl, setNewCameraUrl] = useState("");

  const handleAddCameraUrl = async () => {
    try {
      await axios.post(process.env.NEXT_PUBLIC_FLASK_URL + "/camera-url", {
        label: newCameraLabel,
        url: newCameraUrl,
        crossOriginIsolated: false,
      });
      alert("Camera URL added successfully");
      setNewCameraLabel("");
      setNewCameraUrl("");
      setShowAddCamera(false); // Hide the section after adding a camera
    } catch (error) {
      console.error("Error adding camera URL:", error);
      alert("Failed to add camera URL");
    }
  };

  return (
    <div className="bg-slate-100 rounded-xl p-4 m-4">
      {!showAddCamera ? (
        <button
          data-tip={
            disabled ? "Maximum 6 kamera eklenebilir" : "Yeni kamera ekle"
          }
          className="tooltip tooltip-bottom btn btn-default btn-circle btn-outline 
            rounded-3xl text-semibold flex items-center justify-center group"
          disabled={disabled}
          onClick={() => setShowAddCamera(true)} // Show the section when the button is clicked
        >
          <PlusIcon className="w-4 h-4" />
          {/* <span className='hidden group-hover:flex '>Kamera Ekle</span> */}
        </button>
      ) : (
        <div className="flex items-center justify-center gap-4 pb-4">
          <button
            className="tooltip tooltip-bottom btn btn-sm btn-circle btn-default btn-outline rounded-3xl text-semibold 
             text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500 text-center flex items-center justify-center gap-2"
            disabled={disabled}
            data-tip={"İptal"}
            onClick={() => setShowAddCamera(false)} // Show the section when the button is clicked
          >
            <XIcon className="w-4 h-4" />
          </button>
          <h2 className="text-lg font-bold ">Yeni Kamera URL Ekle</h2>
        </div>
      )}
      {showAddCamera && ( // Only render this section if showAddCamera is true
        <div>
          <div className="flex items-center justify-center">
            <div className=" flex items-center justify-center gap-2">
              <input
                type="text"
                placeholder="Kamera İsmi"
                value={newCameraLabel}
                onChange={(e) => setNewCameraLabel(e.target.value)}
                className="input input-bordered w-full max-w-xs"
              />
              <input
                type="text"
                placeholder="Kamera URL"
                value={newCameraUrl}
                onChange={(e) => setNewCameraUrl(e.target.value)}
                className="input input-bordered w-full max-w-xs"
              />
              <button
                onClick={handleAddCameraUrl}
                className="btn btn-primary text-white"
              >
                Ekle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddCameraButton;
