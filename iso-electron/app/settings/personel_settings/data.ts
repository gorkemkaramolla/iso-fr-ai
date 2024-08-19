import React from 'react';
const columns = [
  { name: 'Bilgiler', uid: 'name', sortable: true },

  { name: 'Id', uid: '_id', sortable: true },
  { name: 'Unvan', uid: 'title', sortable: true },
  { name: 'E-posta', uid: 'email' },
  { name: 'Gsm', uid: 'gsm', sortable: true },

  { name: 'Doğum Tarihi', uid: 'birth_date' },
  { name: 'İso_telefon', uid: 'iso_phone' },
  { name: 'İso_telefon2', uid: 'iso_phone2' },
  { name: 'Eylemler', uid: 'actions' },
];

export { columns };
