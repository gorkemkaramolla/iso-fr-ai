import createApi from '@/utils/axios_instance';
import dynamic from 'next/dynamic';
import { notFound } from 'next/navigation';
import { Personel } from '@/types';

// Dynamically import the Profile component, disabling server-side rendering
const ClientProfile = dynamic(() => import('./profile'), {
  ssr: false,
});

// Function to fetch data for a specific profile
async function fetchProfileData(profile_id: string) {
  const api = createApi(process.env.NEXT_PUBLIC_UTILS_URL);
  try {
    const response = await api.get(`/personel/${profile_id}`, {
      next: { tags: ['profile'] },
    });
    return await response.json();
  } catch (error) {
    return null;
  }
}

// The page component that fetches data and passes it to the ClientProfile component
export default async function ProfilePage({
  params,
}: {
  params: { profile_id: string };
}) {
  const profileData = await fetchProfileData(params.profile_id);

  if (!profileData) {
    notFound(); // This will trigger a 404 page if the profile is not found
  }

  return <ClientProfile profileData={profileData} />;
}

export async function generateStaticParams() {
  const api = createApi(process.env.NEXT_PUBLIC_UTILS_URL);
  const response = await api.get('/personel', {
    next: { tags: ['profiles'] },
  });
  const profiles = await response.json();

  return profiles.map((profile: Personel) => ({
    profile_id: profile._id,
  }));
}
