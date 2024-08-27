"use client"
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { usePathname } from 'next/navigation';

const ProfilePage: React.FC = () => {
    const router = useRouter();
    const params = useParams();
    const pathname = usePathname();
    const [data, setData] = useState<any>(null);
    console.log(router)
    console.log(pathname)
    console.log(params)
    const { id } = params;

    useEffect(() => {
        const fetchData = async () => {
            if (id) {
                try {
                    const response = await fetch(`${process.env.NEXT_PUBLIC_UTILS_URL}/personel/last_recog?id=${id}`);
                    if (response.ok) {
                        const result = await response.json();
                        setData(result);
                    } else {
                        console.error('Error fetching data:', response.statusText);
                    }
                } catch (error) {
                    console.error('Error fetching data:', error);
                }
            }
        };

        fetchData();
    }, []);

    return (
        <div className="min-h-screen bg-gray-100 p-4">
            {data ? (
                <div className="max-w-md mx-auto bg-white shadow-lg rounded-lg overflow-hidden p-4">
                    <h2 className="text-lg font-bold">Last Recognition Data</h2>
                    <p>Timestamp: {new Date(data.timestamp).toLocaleString()}</p>
                    <p>Similarity: {data.similarity}</p>
                    <p>Emotion: {data.emotion}</p>
                    <p>Camera Host: {new URL(data.camera).hostname}</p>
                </div>
            ) : (
                <p>Loading...</p>
            )}
        </div>
    );
};

export default ProfilePage;
