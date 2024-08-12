import createApi from '@/utils/axios_instance';
import Profile from './profile'; // Import your Profile component

// Function to generate static parameters for the dynamic routes
export async function generateStaticParams() {
  const api = createApi(process.env.NEXT_PUBLIC_UTILS_URL);
  const response = await api.get('/personel'); // Fetch all profiles
  const profiles = response.data;

  return profiles.map((profile: { _id: string }) => ({
    profile_id: profile._id,
  }));
}

// The page component that fetches data and passes it to the Profile component
export default async function ProfilePage({
  params,
}: {
  params: { profile_id: string };
}) {
  const profileData = await fetchProfileData(params.profile_id);

  return <Profile profileData={profileData} />;
}

// Function to fetch data for a specific profile
async function fetchProfileData(profile_id: string) {
  const api = createApi(process.env.NEXT_PUBLIC_UTILS_URL);
  const response = await api.get(`/personel/${profile_id}`, {
    withCredentials: true,
  });
  return response.data;
}
