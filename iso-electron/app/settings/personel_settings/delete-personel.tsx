import React from 'react';
import { Button } from 'primereact/button';
import axios from 'axios';
import { useState } from 'react';

type Props = {
  personelId: string;
  onDeleteSuccess: () => void;
};

export default function DeletePersonel({ personelId, onDeleteSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.delete(
        `${process.env.NEXT_PUBLIC_UTILS_URL}/personel/${personelId}`
      );
      if (response.status === 200) {
        onDeleteSuccess();
      }
    } catch (err) {
      setError('Failed to delete personel.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <Button
        label='Sil'
        icon='pi pi-trash'
        className='p-button-danger'
        onClick={handleDelete}
        loading={loading}
      />
    </>
  );
}
