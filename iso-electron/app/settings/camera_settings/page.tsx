'use client';
import React, { useEffect, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import LogoSpinner from '@/components/ui/LogoSpinner';
import 'primereact/resources/themes/lara-light-indigo/theme.css'; //theme
import 'primereact/resources/primereact.min.css'; //core css
import 'primeicons/primeicons.css'; //icons

// Define the types for the camera data and the component state

const CameraManager: React.FC = () => {
  const [cameraUrls, setCameraUrls] = useState<Camera[]>([]);
  const [editMode, setEditMode] = useState<string | null>(null);
  const [editData, setEditData] = useState<Camera>({ label: '', url: '' });
  const [newCamera, setNewCamera] = useState<Camera>({ label: '', url: '' });
  const [displayDialog, setDisplayDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const BASE_URL = process.env.NEXT_PUBLIC_FLASK_URL;
  useEffect(() => {
    setLoading(true);
    fetch(`${BASE_URL}/camera-urls`)
      .then((response) => response.json())
      .then((data) => {
        setCameraUrls(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching camera URLs:', error);
        setLoading(false);
      });
  }, []);

  const handleDelete = (label: string) => {
    confirmDialog({
      message: 'Bu kamerayı silmek istediğinize emin misiniz?',
      header: 'Delete Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        setLoading(true);
        fetch(`${BASE_URL}/camera-url/${label}`, {
          method: 'DELETE',
        })
          .then((response) => response.json())
          .then(() => {
            setCameraUrls(
              cameraUrls.filter((camera) => camera.label !== label)
            );
            setLoading(false);
          })
          .catch((error) => {
            console.error('Error deleting camera URL:', error);
            setLoading(false);
          });
      },
    });
  };

  const handleEdit = (label: string) => {
    const camera = cameraUrls.find((camera) => camera.label === label);
    if (camera) {
      setEditMode(label);
      setEditData({ label: camera.label, url: camera.url });
    }
  };

  const handleUpdate = (label: string) => {
    const trimmedLabel = editData.label.trim();
    const trimmedUrl = editData.url.trim();

    if (!trimmedLabel || !trimmedUrl) {
      alert('Both label and URL are required.');
      return;
    }
    confirmDialog({
      message: 'Değişiklikleri kaydetmek istediğinize emin misiniz?',
      header: 'Save Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        setLoading(true);
        fetch(`${BASE_URL}/camera-url/${label}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...editData,
            label: trimmedLabel,
            url: trimmedUrl,
          }),
        })
          .then((response) => response.json())
          .then(() => {
            setCameraUrls(
              cameraUrls.map((camera) =>
                camera.label === label
                  ? { ...editData, label: trimmedLabel, url: trimmedUrl }
                  : camera
              )
            );
            setEditMode(null);
            setEditData({ label: '', url: '' });
            setLoading(false);
          })
          .catch((error) => {
            console.error('Error updating camera URL:', error);
            setLoading(false);
          });
      },
    });
  };

  const handleAddNewCamera = () => {
    const hasWhitespace = (str: string) => /\s/.test(str);
    const trimmedLabel = newCamera.label.trim();
    const trimmedUrl = newCamera.url.trim();

    if (!trimmedLabel || !trimmedUrl) {
      alert('Both label and URL are required.');
      return;
    }

    if (hasWhitespace(trimmedLabel) || hasWhitespace(trimmedUrl)) {
      alert('Label and URL cannot contain spaces.');
      return;
    }
    setLoading(true);
    fetch(`${BASE_URL}/camera-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...newCamera,
        label: trimmedLabel,
        url: trimmedUrl,
      }),
    })
      .then((response) => response.json())
      .then(() => {
        setCameraUrls([
          ...cameraUrls,
          { ...newCamera, label: trimmedLabel, url: trimmedUrl },
        ]);
        setNewCamera({ label: '', url: '' });
        setDisplayDialog(false);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error adding new camera:', error);
        setLoading(false);
      });
  };
  return (
    <>
      {loading && (
        <div className='flex justify-center items-center h-screen'>
          <LogoSpinner />
        </div>
      )}
      {!loading && (
        <>
          <div className='flex items-center justify-between p-2'>
            <h1 className='text-xl font-bold'>Kamera Ayarları</h1>
            <Button
              color='help'
              label='Yeni Kamera Ekle'
              icon='pi pi-plus'
              className='p-button-sm'
              onClick={() => setDisplayDialog(true)}
            />
          </div>
          <DataTable
            value={cameraUrls}
            responsiveLayout='scroll'
            className='border rounded-xl [&_div]:rounded-xl'
          >
            <Column field='label' header='Kamera Adı' className='text-left' />
            <Column field='url' header='URL' className='p-0 m-0 text-left' />
            <Column
              header='İşlemler'
              body={(rowData) => (
                <div className='flex gap-2'>
                  <Button
                    icon='pi pi-pencil'
                    className='p-button-rounded p-button-warning p-button-sm'
                    onClick={() => handleEdit(rowData.label)}
                    tooltip='Düzenle'
                    tooltipOptions={{ position: 'bottom' }}
                  />
                  <Button
                    icon='pi pi-trash'
                    className='p-button-rounded p-button-danger p-button-sm'
                    onClick={() => handleDelete(rowData.label)}
                    tooltip='Sil'
                    tooltipOptions={{ position: 'bottom' }}
                  />
                </div>
              )}
            />
          </DataTable>

          <Dialog
            header='Yeni Kamera Ekle'
            visible={displayDialog}
            onHide={() => setDisplayDialog(false)}
            style={{ width: '30vw' }}
          >
            <div className='grid grid-rows-2 gap-2'>
              <div className='p-field grid grid-cols-2 items-center gap-2'>
                <label htmlFor='label' className='text-sm'>
                  Kamera Adı
                </label>
                <InputText
                  id='label'
                  value={newCamera.label}
                  onChange={(e) =>
                    setNewCamera({ ...newCamera, label: e.target.value })
                  }
                  className='p-1 text-sm'
                />
              </div>
              <div className='p-field grid grid-cols-2 items-center gap-2'>
                <label htmlFor='url' className='text-sm'>
                  URL
                </label>
                <InputText
                  id='url'
                  value={newCamera.url}
                  onChange={(e) =>
                    setNewCamera({ ...newCamera, url: e.target.value })
                  }
                  className='p-1 text-sm'
                />
              </div>
            </div>
            <Button
              className='mt-2 p-button-sm'
              label='Ekle'
              icon='pi pi-check'
              onClick={handleAddNewCamera}
            />
          </Dialog>

          <Dialog
            header='Düzenle'
            visible={editMode !== null}
            onHide={() => setEditMode(null)}
            style={{ width: '30vw' }}
          >
            <div className='grid grid-rows-2 gap-2'>
              <div className='p-field grid grid-cols-2 items-center gap-2'>
                <label htmlFor='editLabel' className='text-sm'>
                  Kamera Adı
                </label>
                <InputText
                  id='editLabel'
                  value={editData.label}
                  onChange={(e) =>
                    setEditData({ ...editData, label: e.target.value })
                  }
                  className='p-1 text-sm'
                />
              </div>
              <div className='p-field grid grid-cols-2 items-center gap-2'>
                <label htmlFor='editUrl' className='text-sm'>
                  URL
                </label>
                <InputText
                  id='editUrl'
                  value={editData.url}
                  onChange={(e) =>
                    setEditData({ ...editData, url: e.target.value })
                  }
                  className='p-1 text-sm'
                />
              </div>
            </div>
            <Button
              className='mt-2 p-button-sm'
              label='Kaydet'
              icon='pi pi-check'
              onClick={() => handleUpdate(editMode!)}
            />
          </Dialog>
        </>
      )}
      <ConfirmDialog />
    </>
  );
};

export default CameraManager;
