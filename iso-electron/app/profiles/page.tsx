"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import dynamic from "next/dynamic";
import createApi from "@/utils/axios_instance";
import { Personel } from "@/types";
import RecogList from "@/components/personnel/RecogList";
import Emotion from "@/components/personnel/Emotion";

const ClientProfile = dynamic(() => import("./profile"), {
  ssr: false,
});

function ProfileContent() {
  const searchParams = useSearchParams();
  const [profileData, setProfileData] = useState<Personel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const id = searchParams.get("id");

  useEffect(() => {
    async function fetchProfileData(profileId: string) {
      setIsLoading(true);
      setError(null);
      const api = createApi(process.env.NEXT_PUBLIC_UTILS_URL);
      try {
        const response = await api.get(`/personel/${profileId}`);
        const data: Personel = await response.json();
        setProfileData(data);
      } catch (error) {
        setError("Failed to fetch profile data");
        console.error("Error fetching profile:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (id) {
      fetchProfileData(id);
    } else {
      setIsLoading(false);
      setError("No profile ID provided");
    }
  }, [id]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  if (!profileData) return <div>No profile data available.</div>;

  return <ClientProfile profileData={profileData} />;
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="flex w-full items-start justify-center flex-col lg:flex-row">
        <div className="">
          <ProfileContent />
          <Emotion />
        </div>
        <div className=" h-[90vh] overflow-scroll pr-10">
          <h1 className="text-3xl font-bold text-center my-4 text-gray-800 ">
            Son Tanınmalar
          </h1>
          <hr className="mb-4 w-5/6 mx-auto" />
          <RecogList />
        </div>
      </div>
    </Suspense>
  );
}
