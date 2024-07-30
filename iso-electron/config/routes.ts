const ROUTE_LINKS = {
  home: {
    path: '/',
    links: {
      'Ana Sayfa': '/',
      Konuşmalar: '/speech',
      Yayın: '/stream',
      Izlence: '/monitoring',
    },
  },
  settings: {
    path: '/settings',
    links: {
      Ayarlar: '/settings',
      'Kişi Ayarları': '/settings/personel_settings',
    },
  },
  profile: {
    path: '/profiles',
    links: {
      'Edit Profile': '/profiles/edit',
    },
  },
};
export { ROUTE_LINKS as ROUTES };
