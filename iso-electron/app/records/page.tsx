"use client";
import React, { useEffect, useState, useRef } from 'react';
import { Toast } from 'primereact/toast';
import { Download, Trash2, MoreVertical } from 'lucide-react';

interface Video {
  filename: string;
  title: string;
}

const Home: React.FC = () => {
  const toast = useRef<Toast>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  useEffect(() => {
    fetchVideos();
  }, []);

  useEffect(() => {
    if (videos.length > 0 && !selectedVideo) {
      setSelectedVideo(videos[0]);
    }
  }, [videos, selectedVideo]);

  const fetchVideos = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_FLASK_URL}/videos`);
      if (!response.ok) {
        throw new Error('Failed to fetch videos');
      }
      const data = await response.json();
      setVideos(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    }
  };

  const downloadVideo = async (filename: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_FLASK_URL}/videos/${filename}`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      toast.current?.show({
        severity: 'info',
        summary: 'Info',
        detail: `${filename} downloaded`,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    }
  };

  const deleteVideo = async (filename: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_FLASK_URL}/videos/${filename}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete the video');
      }
      toast.current?.show({
        severity: 'success',
        summary: 'Success',
        detail: `${filename} deleted successfully.`,
      });
      fetchVideos();
      if (selectedVideo && selectedVideo.filename === filename) {
        setSelectedVideo(videos.find(v => v.filename !== filename) || null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    }
  };

  if (!videos) {
    return <p className="text-center text-gray-600 mt-8">Loading...</p>;
  }

  if (videos.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 p-8 flex items-center justify-center">
        <p className="text-center text-gray-600 text-xl">No videos available</p>
      </div>
    );
  }

  return (
    <div className=" bg-gray-100">
      <Toast ref={toast} />
      <div className="container mx-auto px-4 pt-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 leading-10">
          Video Kayıtları
          <hr />
        </h1>

        {error && <p className="text-red-500 text-center mb-4">{error}</p>}

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Featured Video */}
          {selectedVideo && (
            <div className="lg:w-3/4 flex flex-col">
              <div className="bg-white rounded-lg shadow-md overflow-hidden flex-grow flex flex-col">
                <div className="relative flex-grow">
                  <video
                    src={`${process.env.NEXT_PUBLIC_FLASK_URL}/videos/${selectedVideo.filename}`}
                    className="w-full h-full object-cover"
                    controls
                  />
                </div>
                <div className="p-4">
                  <h2 className="text-xl font-semibold text-gray-800 mb-2">{selectedVideo.title}</h2>
                  <div className="flex items-center justify-between mt-4">
                    <button
                      onClick={() => downloadVideo(selectedVideo.filename)}
                      className="text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <Download className="w-6 h-6" />
                    </button>
                    <button
                      onClick={() => deleteVideo(selectedVideo.filename)}
                      className="text-red-600 hover:text-red-800 transition-colors"
                    >
                      <Trash2 className="w-6 h-6" />
                    </button>
                    <button className="text-gray-600 hover:text-gray-800 transition-colors">
                      <MoreVertical className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Video List */}
          <div className="lg:w-1/4 flex flex-col">
            <div className="bg-white rounded-lg shadow-md overflow-hidden flex-grow flex flex-col max-h-[80vh]">
              <h3 className="text-lg font-semibold p-4 border-b">Diğer Videolar</h3>
              <div className="overflow-y-scroll flex-grow">
                {videos.map((video) => (
                  <div 
                    key={video.filename} 
                    className={`p-4 hover:bg-gray-100 cursor-pointer ${selectedVideo?.filename === video.filename ? 'bg-gray-200' : ''}`}
                    onClick={() => setSelectedVideo(video)}
                  >
                    <div className="flex items-center">
                      <div className="w-1/3">
                        <video
                          src={`${process.env.NEXT_PUBLIC_FLASK_URL}/videos/${video.filename}`}
                          className="w-full aspect-video object-cover rounded"
                        />
                      </div>
                      <div className="w-2/3 pl-4">
                        <h4 className="text-sm font-semibold text-gray-800 mb-1 line-clamp-2">{video.title}</h4>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
// "use client";
// import React, { useEffect, useState, useRef } from 'react';
// import { Toast } from 'primereact/toast';
// import { Download, Trash2, MoreVertical } from 'lucide-react';

// interface Video {
//   filename: string;
//   title: string;
// }

// const Home: React.FC = () => {
//   const toast = useRef<Toast>(null);
//   const [videos, setVideos] = useState<Video[]>([]);
//   const [error, setError] = useState<string | null>(null);
//   const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

//   useEffect(() => {
//     fetchVideos();
//   }, []);

//   useEffect(() => {
//     if (videos.length > 0 && !selectedVideo) {
//       setSelectedVideo(videos[0]);
//     }
//   }, [videos, selectedVideo]);

//   const fetchVideos = async () => {
//     try {
//       const response = await fetch(`${process.env.NEXT_PUBLIC_FLASK_URL}/videos`);
//       if (!response.ok) {
//         throw new Error('Failed to fetch videos');
//       }
//       const data = await response.json();
//       setVideos(data);
//     } catch (e) {
//       setError(e instanceof Error ? e.message : 'Unknown error');
//     }
//   };

//   const downloadVideo = async (filename: string) => {
//     try {
//       const response = await fetch(`${process.env.NEXT_PUBLIC_FLASK_URL}/videos/${filename}`);
//       const blob = await response.blob();
//       const url = URL.createObjectURL(blob);
//       const a = document.createElement('a');
//       a.href = url;
//       a.download = filename;
//       a.click();
//       toast.current?.show({
//         severity: 'info',
//         summary: 'Info',
//         detail: `${filename} downloaded`,
//       });
//     } catch (e) {
//       setError(e instanceof Error ? e.message : 'Unknown error');
//     }
//   };

//   const deleteVideo = async (filename: string) => {
//     try {
//       const response = await fetch(`${process.env.NEXT_PUBLIC_FLASK_URL}/videos/${filename}`, {
//         method: 'DELETE',
//       });
//       if (!response.ok) {
//         throw new Error('Failed to delete the video');
//       }
//       toast.current?.show({
//         severity: 'success',
//         summary: 'Success',
//         detail: `${filename} deleted successfully.`,
//       });
//       fetchVideos();
//       if (selectedVideo && selectedVideo.filename === filename) {
//         setSelectedVideo(videos.find(v => v.filename !== filename) || null);
//       }
//     } catch (e) {
//       setError(e instanceof Error ? e.message : 'Unknown error');
//     }
//   };

//   if (!videos) {
//     return <p className="text-center text-gray-600 mt-8">Loading...</p>;
//   }

//   if (videos.length === 0) {
//     return (
//       <div className="min-h-screen bg-gray-100 p-8 flex items-center justify-center">
//         <p className="text-center text-gray-600 text-xl">No videos available</p>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-100">
//       <Toast ref={toast} />
//       <div className="container mx-auto px-4 py-8">
//         <h1 className="text-3xl font-bold text-gray-800 mb-8 leading-10">
//           Video Kayıtları
//           <hr />
//         </h1>

//         {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        
//         <div className="grid grid-cols-4 grid-rows-1 gap-6">
//           {/* Featured Video */}
//           {selectedVideo && (
//             <div className="col-span-3 row-span-1">
//               <div className="bg-white rounded-lg shadow-md overflow-hidden">
//                 <div className="relative">
//                   <video
//                     src={`${process.env.NEXT_PUBLIC_FLASK_URL}/videos/${selectedVideo.filename}`}
//                     className="w-full aspect-video object-cover"
//                     controls
//                     // autoPlay
//                   />
//                 </div>
//                 <div className="p-4">
//                   <h2 className="text-xl font-semibold text-gray-800 mb-2">{selectedVideo.title}</h2>
//                   <div className="flex items-center justify-between mt-4">
//                     <button
//                       onClick={() => downloadVideo(selectedVideo.filename)}
//                       className="text-blue-600 hover:text-blue-800 transition-colors"
//                     >
//                       <Download className="w-6 h-6" />
//                     </button>
//                     <button
//                       onClick={() => deleteVideo(selectedVideo.filename)}
//                       className="text-red-600 hover:text-red-800 transition-colors"
//                     >
//                       <Trash2 className="w-6 h-6" />
//                     </button>
//                     <button className="text-gray-600 hover:text-gray-800 transition-colors">
//                       <MoreVertical className="w-6 h-6" />
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* Video List */}
//           <div className="col-span-1 row-span-1">
//             <div className="bg-white rounded-lg shadow-md overflow-hidden">
//               <h3 className="text-lg font-semibold p-4 border-b">Diğer Videolar</h3>
//               <div className="">
//                 {videos.map((video) => (
//                   <div 
//                     key={video.filename} 
//                     className={`p-4 hover:bg-gray-100 cursor-pointer ${selectedVideo?.filename === video.filename ? 'bg-gray-200' : ''}`}
//                     onClick={() => setSelectedVideo(video)}
//                   >
//                     <div className="flex items-center">
//                       <div className="w-1/3">
//                         <video
//                           src={`${process.env.NEXT_PUBLIC_FLASK_URL}/videos/${video.filename}`}
//                           className="w-full aspect-video object-cover rounded"
//                         />
//                       </div>
//                       <div className="w-2/3 pl-4">
//                         <h4 className="text-sm font-semibold text-gray-800 mb-1 line-clamp-2">{video.title}</h4>
//                       </div>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Home;

// "use client";
// import React, { useEffect, useState, useRef } from 'react';
// import { Toast } from 'primereact/toast';
// import { Play, Download, Trash2, MoreVertical } from 'lucide-react';

// interface Video {
//   filename: string;
//   title: string;
// }

// const Home: React.FC = () => {
//   const toast = useRef<Toast>(null);
//   const [videos, setVideos] = useState<Video[]>([]);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     fetchVideos();
//   }, []);

//   const fetchVideos = async () => {
//     try {
//       const response = await fetch(`${process.env.NEXT_PUBLIC_FLASK_URL}/videos`);
//       if (!response.ok) {
//         throw new Error('Failed to fetch videos');
//       }
//       const data = await response.json();
//       setVideos(data);
//     } catch (e) {
//       setError(e instanceof Error ? e.message : 'Unknown error');
//     }
//   };

//   const downloadVideo = async (filename: string) => {
//     try {
//       const response = await fetch(`${process.env.NEXT_PUBLIC_FLASK_URL}/videos/${filename}`);
//       const blob = await response.blob();
//       const url = URL.createObjectURL(blob);
//       const a = document.createElement('a');
//       a.href = url;
//       a.download = filename;
//       a.click();
//       toast.current?.show({
//         severity: 'info',
//         summary: 'Info',
//         detail: `${filename} downloaded`,
//       });
//     } catch (e) {
//       setError(e instanceof Error ? e.message : 'Unknown error');
//     }
//   };

//   const deleteVideo = async (filename: string) => {
//     try {
//       const response = await fetch(`${process.env.NEXT_PUBLIC_FLASK_URL}/videos/${filename}`, {
//         method: 'DELETE',
//       });
//       if (!response.ok) {
//         throw new Error('Failed to delete the video');
//       }
//       toast.current?.show({
//         severity: 'success',
//         summary: 'Success',
//         detail: `${filename} deleted successfully.`,
//       });
//       fetchVideos();
//     } catch (e) {
//       setError(e instanceof Error ? e.message : 'Unknown error');
//     }
//   };

//   if (!videos) {
//     return <p className="text-center text-gray-600 mt-8">Loading...</p>;
//   }

//   if (videos.length === 0) {
//     return (
//       <div className="min-h-screen bg-gray-100 p-8 flex items-center justify-center">
//         <p className="text-center text-gray-600 text-xl">No videos available</p>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-100">
//       <Toast ref={toast} />
//       <div className="container mx-auto px-4 py-8">
//         <h1 className="text-3xl font-bold text-gray-800 mb-8 leading-10">Video Kayıtları
//         <hr />
//         </h1>
      
//         {error && <p className="text-red-500 text-center mb-4">{error}</p>}
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
//           {videos.map((video) => (
//             <div key={video.filename} className="bg-white rounded-lg shadow-md overflow-hidden">
//               <div className="relative">
//                 <video
//                   src={`${process.env.NEXT_PUBLIC_FLASK_URL}/videos/${video.filename}`}
//                   className="w-full aspect-video object-cover"
//                   controls
//                 />
             
//               </div>
//               <div className="p-4">
//                 <h2 className="text-lg font-semibold text-gray-800 mb-2 truncate">{video.title}</h2>
//                 <div className="flex items-center justify-between">
//                   <button
//                     onClick={() => downloadVideo(video.filename)}
//                     className="text-blue-600 hover:text-blue-800 transition-colors"
//                   >
//                     <Download className="w-5 h-5" />
//                   </button>
//                   <button
//                     onClick={() => deleteVideo(video.filename)}
//                     className="text-red-600 hover:text-red-800 transition-colors"
//                   >
//                     <Trash2 className="w-5 h-5" />
//                   </button>
//                   <button className="text-gray-600 hover:text-gray-800 transition-colors">
//                     <MoreVertical className="w-5 h-5" />
//                   </button>
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Home;

// 'use client';
// import { Button } from 'primereact/button';
// import React, { useEffect, useState, useRef } from 'react';
// import { Toast } from 'primereact/toast';

// interface Video {
//   filename: string;
//   title: string;
// }

// const Home: React.FC = () => {
//   const toast = useRef<Toast>(null);
//   const [videos, setVideos] = useState<Video[]>([]);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     fetchVideos();
//   }, []);

//   const fetchVideos = async () => {
//     try {
//       const response = await fetch(
//         `${process.env.NEXT_PUBLIC_FLASK_URL}/videos`
//       );
//       if (!response.ok) {
//         throw new Error('Failed to fetch videos');
//       }
//       const data = await response.json();
//       setVideos(data);
//     } catch (e) {
//       if (e instanceof Error) {
//         setError(e.message);
//       } else {
//         setError('Unknown error');
//       }
//     }
//   };

//   const downloadVideo = async (filename: string) => {
//     try {
//       const response = await fetch(
//         `${process.env.NEXT_PUBLIC_FLASK_URL}/videos/${filename}`
//       );
//       const blob = await response.blob();
//       const url = URL.createObjectURL(blob);
//       const a = document.createElement('a');
//       a.href = url;
//       a.download = filename; // Sets the download file name to the video's filename
//       a.click();
//       toast.current?.show({
//         severity: 'info',
//         summary: 'Info',
//         detail: `${filename} indirildi`,
//       });
//     } catch (e) {
//       if (e instanceof Error) {
//         setError(e.message);
//       } else {
//         setError('Unknown error');
//       }
//     }
//   };

//   const deleteVideo = async (filename: string) => {
//     try {
//       const response = await fetch(
//         `${process.env.NEXT_PUBLIC_FLASK_URL}/videos/${filename}`,
//         {
//           method: 'DELETE',
//         }
//       );
//       if (!response.ok) {
//         throw new Error('Failed to delete the video');
//       }
//       toast.current?.show({
//         severity: 'success',
//         summary: 'Success',
//         detail: `${filename} deleted successfully.`,
//       });
//       fetchVideos(); // Refresh the video list after deletion
//     } catch (e) {
//       if (e instanceof Error) {
//         setError(e.message);
//       } else {
//         setError('Unknown error');
//       }
//     }
//   };

//   if (!videos) {
//     return <p>Loading...</p>;
//   }

//   if (videos.length === 0) 
//     return <div className='min-h-screen bg-gray-100 p-8 overflow-y-scroll'>
//     <p className='text-center'>Video Kaydı Henüz Yok</p></div>;

//   return (
//     <div className='max-h-screen bg-gray-100 p-8 overflow-y-scroll'>
//       <Toast ref={toast} />
//       <h1 className='text-3xl font-bold text-center mb-8'>Video Galeri</h1>
//       {error && <p className='text-red-500 text-center'>{error}</p>}
//       <div className='container mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
//         {videos.map((video) => (
//           <div
//             key={video.filename}
//             className='bg-white shadow-md rounded-lg p-4 relative'
//           >
//             <h2 className='text-xl font-semibold mb-4'>{video.title}</h2>
//             <video
//               src={`${process.env.NEXT_PUBLIC_FLASK_URL}/videos/${video.filename}`}
//               controls
//               width='100%'
//               height='100%'
//               className='mb-16'
//             />
//             <div className='absolute bottom-4 left-4 flex space-x-2'>
//               <Button onClick={() => downloadVideo(video.filename)}>Download</Button>
//               <Button onClick={() => deleteVideo(video.filename)} className='p-button-danger'>
//                 Delete
//               </Button>
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default Home;
