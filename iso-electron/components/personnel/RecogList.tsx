import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  User,
  Calendar,
  Image,
} from "lucide-react";
import { PiGenderIntersexFill, PiSecurityCameraFill } from "react-icons/pi";
import { TbFaceId, TbMoodSuprised, TbMoodNeutral } from "react-icons/tb";
import { FaRegSadTear, FaRegAngry } from "react-icons/fa";
import { HiOutlineEmojiHappy } from "react-icons/hi";
import { IoMdSad } from "react-icons/io";

interface RecogData {
  _id: { $oid: string };
  age: number;
  camera: string;
  emotion: string;
  gender: number;
  image_path: string;
  label: string;
  personnel_id: string;
  similarity: number;
  timestamp: number;
}

const ProfilePage: React.FC = () => {
  const [data, setData] = useState<RecogData[]>([]);
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  useEffect(() => {
    const fetchData = async () => {
      if (id) {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_UTILS_URL}/personel_last_recog/${id}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
            }
          );
          if (response.ok) {
            const result = await response.json();
            console.log("Data fetched:", result);
            setData(result);
          } else {
            console.error("Error fetching data:", response.statusText);
          }
        } catch (error) {
          console.error("Error fetching data:", error);
        }
      }
    };
    fetchData();
  }, [id]);

  const getEmotionColor = (emotion: string) => {
    const colors: { [key: string]: string } = {
      happy: "bg-green-100 text-green-800",
      sad: "bg-blue-100 text-blue-800",
      angry: "bg-red-100 text-red-800",
      neutral: "bg-gray-100 text-gray-800",
      surprised: "bg-yellow-100 text-yellow-800",
      fear: "bg-purple-100 text-purple-800",
    };
    return colors[emotion.toLowerCase()] || "bg-gray-100 text-gray-800";
  };

  const getEmotionIcon = (emotion: string) => {
    const icons: { [key: string]: JSX.Element } = {
      surprised: <TbMoodSuprised className="w-5 h-5" />,
      sad: <FaRegSadTear className="w-5 h-5" />,
      happy: <HiOutlineEmojiHappy className="w-5 h-5" />,
      angry: <FaRegAngry className="w-5 h-5" />,
      neutral: <TbMoodNeutral className="w-5 h-5" />,
      fear: <IoMdSad className="w-5 h-5" />,
    };
    return icons[emotion.toLowerCase()] || <TbMoodNeutral className="w-5 h-5" />;
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 ">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800 leading-10">
          Son Tanınmalar
        <hr />
        </h1>
        {data && data.length > 0 ? (
          data.map((item) => (
            <div
              key={item._id.$oid}
              className="bg-white shadow-lg rounded-xl overflow-hidden mb-4"
            >
              <div className="p-4">
                <ul className="space-y-4">
                  <li className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-6 h-6 text-blue-500" />
                      <span className="text-gray-700">
                        {new Date(item.timestamp).toLocaleString("tr-TR")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-row-reverse">
                      <PiSecurityCameraFill className="w-6 h-6" />
                      <span className="text-gray-700 truncate">
                        {new URL(item?.camera!).hostname}
                      </span>
                    </div>
                  </li>
                  <li className="flex items-center">
                    {/* <Image className="w-6 h-6 text-blue-500" /> */}
                    <img
                src={`${process.env.NEXT_PUBLIC_FLASK_URL}/images/${item.image_path}`}
                alt='Face'
                style={{ width: '500px', height: '250px', borderRadius: '5px' }}
              />
                    {/* <span className="text-gray-700 truncate">
                      {item.image_path}
                    </span> */}
                  </li>
                </ul>
              </div>
              <div className="bg-gray-50 px-4 py-2">
                <ul className="flex gap-4 [&_li]:gap-2">
                  <li className="flex items-center">
                    <TbFaceId className="w-6 h-6 text-blue-500" />
                    <span className="text-gray-700">
                      Benzerlik ~ %{(item.similarity * 100).toFixed(2)}
                    </span>
                  </li>
                  <li className="flex items-center">
                    <span
                      className={`px-2 py-1 rounded-full text-sm font-semibold inline-flex gap-2 ${getEmotionColor(
                          item.emotion
                        )}`}
                        >
                        {getEmotionIcon(item.emotion)}
                      {item.emotion}
                    </span>
                  </li>
                  <li className="flex items-center">
                    <User className="w-6 h-6 text-blue-500" />
                    <span className="text-gray-700"> Yaş ~ {item.age}</span>
                  </li>
                  <li className="flex items-center">
                    <PiGenderIntersexFill className={`w-6 h-6 ${item.gender === 1 ? "text-blue-500" : "text-rose-500"}`} />
                    <span className="text-gray-700">
                      {item.gender === 1 ? "Erkek" : "Kadın"}
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-6">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading profile data...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;


// import React, { useEffect, useState } from "react";
// import { useSearchParams } from "next/navigation";
// import {
//   User,
//   Calendar,
//   Fingerprint,
//   Brain,
//   UserCircle2,
//   Image,
//   Camera,
// } from "lucide-react";
// import { PiGenderIntersexFill, PiSecurityCameraFill } from "react-icons/pi";
// import { TbFaceId } from "react-icons/tb";
// interface RecogData {
//   _id: { $oid: string };
//   age: number;
//   camera: string;
//   emotion: string;
//   gender: number;
//   image_path: string;
//   label: string;
//   personnel_id: string;
//   similarity: number;
//   timestamp: number;
// }

// const ProfilePage: React.FC = () => {
//   const [data, setData] = useState<RecogData[]>([]);
//   const searchParams = useSearchParams();
//   const id = searchParams.get("id");

//   useEffect(() => {
//     const fetchData = async () => {
//       if (id) {
//         try {
//           const response = await fetch(
//             `${process.env.NEXT_PUBLIC_UTILS_URL}/personel_last_recog/${id}`,
//             {
//               method: "POST",
//               headers: {
//                 "Content-Type": "application/json",
//               },
//             }
//           );
//           if (response.ok) {
//             const result = await response.json();
//             console.log("Data fetched:", result);
//             setData(result);
//           } else {
//             console.error("Error fetching data:", response.statusText);
//           }
//         } catch (error) {
//           console.error("Error fetching data:", error);
//         }
//       }
//     };
//     fetchData();
//   }, [id]);

//   const getEmotionColor = (emotion: string) => {
//     const colors: { [key: string]: string } = {
//       happy: "bg-green-100 text-green-800",
//       sad: "bg-blue-100 text-blue-800",
//       angry: "bg-red-100 text-red-800",
//       neutral: "bg-gray-100 text-gray-800",
//       surprised: "bg-yellow-100 text-yellow-800",
//     };
//     return colors[emotion.toLowerCase()] || "bg-gray-100 text-gray-800";
//   };

//   return (
//     <div className="min-h-screen bg-gray-100 p-4">
//       <div className="max-w-2xl mx-auto">
//         <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
//           Son Tanınmalar
//         </h1>
//         {data && data.length > 0 ? (
//           data.map((item) => (
//             <div
//               key={item._id.$oid}
//               className="bg-white shadow-lg rounded-lg overflow-hidden mb-4"
//             >
//               <div className="p-6">
//                 {/* <h2 className="text-2xl font-semibold mb-4 text-gray-800">Last Recognition</h2> */}
//                 <ul className="space-y-4">
//                   <li className="flex items-center justify-between">
//                     <div className="flex items-center gap-2">

//                     <Calendar className="w-6 h-6 text-blue-500" />
//                     <span className="text-gray-700">
//                       {new Date(item.timestamp).toLocaleString("tr-TR")}
//                     </span>
//                     </div>
//                     <div className="flex items-center gap-2 flex-row-reverse">
//                     <PiSecurityCameraFill  className="w-6 h-6" />
//                     <span className="text-gray-700 truncate">
//                       {new URL(item?.camera!).hostname}
//                     </span>
//                   </div>
//                   </li>

//                   <li className="flex items-center">
//                     <Image className="w-6 h-6 text-blue-500" />
//                     <span className="text-gray-700 truncate">
//                       {item.image_path}
//                     </span>
//                   </li>
               
//                 </ul>
//               </div>
//               <div className="bg-gray-50 px-6 py-4">
//                 <ul className="flex gap-4 [&_li]:gap-2">
//                   <li className="flex items-center">
//                     <TbFaceId className="w-6 h-6 text-blue-500" />
//                     <span className="text-gray-700">
//                       Benzerlik ~ %{(item.similarity * 100).toFixed(2)}
//                     </span>
//                   </li>
//                   <li className="flex items-center">
//                     <Brain className="w-6 h-6 text-blue-500" />
//                     <span
//                       className={`px-2 py-1 rounded-full text-sm font-semibold ${getEmotionColor(
//                         item.emotion
//                       )}`}
//                     >
//                       {item.emotion}
//                     </span>
//                   </li>
//                   <li className="flex items-center">
//                     <User className="w-6 h-6 text-blue-500" />
//                     <span className="text-gray-700"> Yaş ~ {item.age}</span>
//                   </li>
//                   <li className="flex items-center">
//                     <PiGenderIntersexFill className={`w-6 h-6 ${item.gender === 1 ? "text-blue-500" : "text-rose-500"}`}/>
//                     <span className="text-gray-700">
//                       {item.gender === 1 ? "Erkek" : "Kadın"}
//                     </span>
//                   </li>
//                 </ul>
//                 {/* <div className="text-sm font-medium text-gray-500">
//                   Personnel ID: {item.personnel_id}
//                 </div>
//                 <div className="text-sm font-medium text-gray-500">
//                   Label: {item.label}
//                 </div> */}
//               </div>
//             </div>
//           ))
//         ) : (
//           <div className="text-center py-12">
//             <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900 mx-auto"></div>
//             <p className="mt-4 text-gray-600">Loading profile data...</p>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default ProfilePage;
