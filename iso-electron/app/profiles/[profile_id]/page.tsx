import api from '@/utils/axios_instance';
import React from 'react';

interface Props {
  params: {
    profile_id: string;
  };
}

const Profile = async ({ params: { profile_id } }: Props) => {
  const personel: Personel = (await api.get(`/personel/${profile_id}`)).data;
  return (
    <div>
      <div>{personel.ADI}</div>
      <div>{personel.SOYADI}</div>
      <div>{personel.DOGUM_TARIHI}</div>
      <div>{personel.EPOSTA}</div>
      <div>{personel.FOTO_DOSYA_ADI}</div>
    </div>
  );
};

export default Profile;
