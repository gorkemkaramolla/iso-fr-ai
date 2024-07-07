'use client';
import React, { useEffect, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import LogoSpinner from '@/components/ui/LogoSpinner';
import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';

const CameraManager: React.FC = () => {
  const [cameraUrls, setCameraUrls] = useState<Camera[]>([]);
  const [editMode, setEditMode] = useState<string | null>(null);
  const [editData, setEditData] = useState<Camera>({ label: '', url: '' });
  const [newCamera, setNewCamera] = useState<Camera>({ label: '', url: '' });
  const [displayDialog, setDisplayDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const BASE_URL = process.env.NEXT_PUBLIC_FR_URL;

  useEffect(() => {
    const fetchCameraUrls = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${BASE_URL}/camera-urls`);
        const data = await response.json();
        setCameraUrls(data);
      } catch (error) {
        console.error('Error fetching camera URLs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCameraUrls();
  }, [BASE_URL]);

  const handleDelete = (label: string) => {
    confirmDialog({
      message: 'Are you sure you want to delete this camera?',
      header: 'Delete Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        setLoading(true);
        try {
          await fetch(`${BASE_URL}/camera-url/${label}`, { method: 'DELETE' });
          setCameraUrls(cameraUrls.filter((camera) => camera.label !== label));
        } catch (error) {
          console.error('Error deleting camera URL:', error);
        } finally {
          setLoading(false);
        }
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

  const handleUpdate = async (label: string) => {
    const trimmedLabel = editData.label.trim();
    const trimmedUrl = editData.url.trim();

    if (!trimmedLabel || !trimmedUrl) {
      alert('Both label and URL are required.');
      return;
    }

    confirmDialog({
      message: 'Are you sure you want to save the changes?',
      header: 'Save Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        setLoading(true);
        try {
          await fetch(`${BASE_URL}/camera-url/${label}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...editData,
              label: trimmedLabel,
              url: trimmedUrl,
            }),
          });
          setCameraUrls(
            cameraUrls.map((camera) =>
              camera.label === label
                ? { ...editData, label: trimmedLabel, url: trimmedUrl }
                : camera
            )
          );
          setEditMode(null);
          setEditData({ label: '', url: '' });
        } catch (error) {
          console.error('Error updating camera URL:', error);
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handleAddNewCamera = async () => {
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
    try {
      await fetch(`${BASE_URL}/camera-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newCamera,
          label: trimmedLabel,
          url: trimmedUrl,
        }),
      });
      setCameraUrls([
        ...cameraUrls,
        { ...newCamera, label: trimmedLabel, url: trimmedUrl },
      ]);
      setNewCamera({ label: '', url: '' });
      setDisplayDialog(false);
    } catch (error) {
      console.error('Error adding new camera:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='container mx-auto'>
      {loading ? (
        <div className='flex justify-center items-center h-screen'>
          <LogoSpinner />
        </div>
      ) : (
        <>
          <div className='flex items-center justify-between p-4'>
            <h1 className='text-3xl font-bold'>Kamera Ayarları</h1>
            <Button
              label='Yeni Kamera Ekle'
              icon='pi pi-plus'
              onClick={() => setDisplayDialog(true)}
            />
          </div>
          <DataTable
            value={cameraUrls}
            responsiveLayout='scroll'
            className='border rounded-xl'
          >
            <Column field='label' header='Kamera Adı' />
            <Column field='url' header='URL' />
            <Column
              header='İşlemler'
              body={(rowData) => (
                <div className='flex gap-4'>
                  <Button
                    icon='pi pi-pencil'
                    className='p-button-rounded p-button-warning'
                    onClick={() => handleEdit(rowData.label)}
                    tooltip='Düzenle'
                  />
                  <Button
                    icon='pi pi-trash'
                    className='p-button-rounded p-button-danger'
                    onClick={() => handleDelete(rowData.label)}
                    tooltip='Sil'
                  />
                </div>
              )}
            />
          </DataTable>

          <Dialog
            header='Yeni Kamera Ekle'
            visible={displayDialog}
            onHide={() => setDisplayDialog(false)}
          >
            <div className='grid grid-rows-2 gap-4'>
              <div className='p-field grid grid-cols-2 items-center gap-4'>
                <label htmlFor='label'>Kamera Adı</label>
                <InputText
                  id='label'
                  value={newCamera.label}
                  onChange={(e) =>
                    setNewCamera({ ...newCamera, label: e.target.value })
                  }
                />
              </div>
              <div className='p-field grid grid-cols-2 items-center gap-4'>
                <label htmlFor='url'>URL</label>
                <InputText
                  id='url'
                  value={newCamera.url}
                  onChange={(e) =>
                    setNewCamera({ ...newCamera, url: e.target.value })
                  }
                />
              </div>
            </div>
            <Button
              className='mt-4'
              label='Ekle'
              icon='pi pi-check'
              onClick={handleAddNewCamera}
            />
          </Dialog>

          <Dialog
            header='Düzenle'
            visible={editMode !== null}
            onHide={() => setEditMode(null)}
          >
            <div className='grid grid-rows-2 gap-4'>
              <div className='p-field grid grid-cols-2 items-center gap-4'>
                <label htmlFor='editLabel'>Kamera Adı</label>
                <InputText
                  id='editLabel'
                  value={editData.label}
                  onChange={(e) =>
                    setEditData({ ...editData, label: e.target.value })
                  }
                />
              </div>
              <div className='p-field grid grid-cols-2 items-center gap-4'>
                <label htmlFor='editUrl'>URL</label>
                <InputText
                  id='editUrl'
                  value={editData.url}
                  onChange={(e) =>
                    setEditData({ ...editData, url: e.target.value })
                  }
                />
              </div>
            </div>
            <Button
              className='mt-4'
              label='Kaydet'
              icon='pi pi-check'
              onClick={() => handleUpdate(editMode!)}
            />
          </Dialog>
        </>
      )}
      <ConfirmDialog />
    </div>
  );
};

export default CameraManager;
