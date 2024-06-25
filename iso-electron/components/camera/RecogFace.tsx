import axios from 'axios';
import React, { useEffect, useState } from 'react';

const BASE_URL = process.env.NEXT_PUBLIC_FLASK_URL; // Replace with your Flask server URL

const getRecogFaces = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/recog`);
    return response.data;
  } catch (error) {
    console.error('Error fetching recognized faces', error);
    throw error;
  }
};

const RecogFaces: React.FC = () => {
  const [groupedRecogFaces, setGroupedRecogFaces] = useState<
    GroupedRecogFaces[]
  >([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecogFaces = async () => {
      try {
        const faces = await getRecogFaces();
        console.log(faces);

        // Group faces by label and initialize as collapsed
        const grouped = faces.reduce(
          (acc: GroupedRecogFaces[], face: RecogFace) => {
            const group = acc.find((g) => g.name === face.label);
            if (group) {
              group.faces.push(face);
            } else {
              acc.unshift({
                name: face.label,
                faces: [face],
                isCollapsed: true,
              });
            }
            return acc;
          },
          []
        );

        setGroupedRecogFaces(grouped);
      } catch (err) {
        setError('Failed to fetch recognized faces.');
      } finally {
        setLoading(false);
      }
    };

    fetchRecogFaces();
  }, []);

  const handleToggle = (name: string) => {
    setGroupedRecogFaces((prevGroups) =>
      prevGroups.map((group) =>
        group.name === name
          ? { ...group, isCollapsed: !group.isCollapsed }
          : group
      )
    );
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      <h1 className='text-3xl font-bold mb-8'>Tanınan Yüzler</h1>
      <div className='max-h-[60vh] overflow-scroll w-full pr-2'>
        {groupedRecogFaces.map((group) => (
          <div key={group.name} className='mb-2 shadow-sm'>
            <div
              onClick={() => handleToggle(group.name)}
              style={{
                cursor: 'pointer',
                fontWeight: 'bold',
                marginBottom: '10px',
                background: '#f0f0f0',
                padding: '8px',
                borderRadius: '4px',
              }}
              className='flex items-center justify-start gap-2'
            >
              <img
                src={`${BASE_URL}/images/${group.faces[0].image_path}`}
                alt='avatar'
                className='shadow-md shadow-red-500 object-cover w-10 h-10 rounded-full'
              />
              <span className='text-xs overflow-hidden'>{group.name}</span>
            </div>
            {!group.isCollapsed && (
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'start',
                  flexDirection: 'row-reverse',
                }}
              >
                {group.faces.map((face, index) => (
                  <div key={index} className='m-1 w-16'>
                    <div className='text-xs text-balance'>{face.timestamp}</div>
                    <img
                      src={`${BASE_URL}/images/${face.image_path}`}
                      alt={`Known Face ${index}`}
                      className='shadow-md shadow-red-500 object-cover w-[60px] h-[60px] rounded-sm'
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecogFaces;

// import axios from 'axios';
// import React, { useEffect, useState } from 'react';
// import { io, Socket } from 'socket.io-client';
// const BASE_URL = process.env.NEXT_PUBLIC_FLASK_URL; // Replace with your Flask server URL

// const getRecogFaces = async () => {
//   try {
//     const response = await axios.get(`${BASE_URL}/recog`);
//     return response.data;
//   } catch (error) {
//     console.error('Error fetching recognized faces', error);
//     throw error;
//   }
// };

// const RecogFaces: React.FC = () => {
//   const [recogFaces, setRecogFaces] = useState<RecogFace[]>([]);
//   const [loading, setLoading] = useState<boolean>(true);
//   const [error, setError] = useState<string | null>(null);
//   const [collapsedLabels, setCollapsedLabels] = useState<{
//     [key: string]: boolean;
//   }>({});

//   useEffect(() => {
//     const fetchRecogFaces = async () => {
//       try {
//         const faces = await getRecogFaces();
//         console.log(faces);
//         setRecogFaces(faces);
//       } catch (err) {
//         setError('Failed to fetch recognized faces.');
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchRecogFaces();

//     // Establish WebSocket connection
//     const socket: Socket = io(BASE_URL!);

//     // Listen for new face detections
//     socket.on('new_face_detected', (newFace: RecogFace) => {
//       console.log('New face detected:', newFace);
//       setRecogFaces((prevFaces) => [...prevFaces, newFace]);
//     });

//     // Cleanup on component unmount
//     return () => {
//       socket.disconnect();
//     };
//   }, []);

//   const handleToggle = (label: string) => {
//     setCollapsedLabels((prev) => ({
//       ...prev,
//       [label]: !prev[label],
//     }));
//   };

//   if (loading) return <div>Loading...</div>;
//   if (error) return <div>{error}</div>;

//   // Group faces by label
//   const groupedFaces = recogFaces.reduce((acc, face) => {
//     if (!acc[face.label]) {
//       acc[face.label] = [];
//     }
//     acc[face.label].push(face);
//     return acc;
//   }, {} as { [key: string]: RecogFace[] });

//   return (
//     <div>
//       <h1 className='text-3xl font-bold '>Tanınan Yüzler</h1>
//       {Object.keys(groupedFaces).map((label) => (
//         <div
//           key={label}
//           style={{
//             marginBottom: '20px',
//           }}
//         >
//           <div
//             onClick={() => handleToggle(label)}
//             style={{
//               cursor: 'pointer',
//               fontWeight: 'bold',
//               marginBottom: '10px',
//               background: '#f0f0f0',
//               padding: '10px',
//               borderRadius: '5px',
//             }}
//           >
//             {label}
//           </div>
//           {!collapsedLabels[label] && (
//             <div
//               style={{
//                 display: 'flex',
//                 flexWrap: 'wrap',
//                 alignItems: 'center',
//                 justifyContent: 'center',
//                 flexDirection: 'row-reverse',
//               }}
//             >
//               {groupedFaces[label].map((face, index) => (
//                 <div key={index} style={{ margin: '4px' }}>
//                   <div className='text-xs text-center'>{face.timestamp}</div>
//                   <img
//                     src={`${BASE_URL}/images/${face.image_path}`}
//                     alt={`Known Face ${index}`}
//                     style={{
//                       width: '150px',
//                       height: '150px',
//                       objectFit: 'contain',
//                     }}
//                   />
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>
//       ))}
//     </div>
//   );
// };

// export default RecogFaces;

// import axios from 'axios';
// // import img from '/flask/unknown_faces/Unknown/Unknown-20240610-132724.jpg';
// export const getRecogFaces = async () => {
//   try {
//     const response = await axios.get(
//       `${process.env.NEXT_PUBLIC_FLASK_URL}/recog`
//     );
//     return response.data;
//   } catch (error) {
//     console.error('Error fetching known faces', error);
//     throw error;
//   }
// };

// import React, { useEffect, useState } from 'react';

// interface RecogFace {
//   _id: {
//     $oid: string;
//   };
//   emotion: string;
//   image_path: string;
//   label: string;
//   similarity: number;
//   timestamp: string;
// }

// const RecogFaces: React.FC = () => {
//   const [recogFaces, setRecogFaces] = useState<RecogFace[]>([]);
//   const [loading, setLoading] = useState<boolean>(true);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     const fetchRecogFaces = async () => {
//       try {
//         const faces = await getRecogFaces();
//         console.log(faces);
//         setRecogFaces(faces);
//       } catch (err) {
//         setError('Failed to fetch known faces.');
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchRecogFaces();
//   }, []);

//   if (loading) return <div>Loading...</div>;
//   if (error) return <div>{error}</div>;

//   return (
//     <div>
//       <h1>Tanınan Yüzler</h1>
//       <div style={{ display: 'flex', flexWrap: 'wrap' }}>
//         {recogFaces.map((face, index) => (
//           <div key={index} style={{ margin: '10px' }}>
//             <div>
//               {face.label} - <span className='text-xs'>{face.timestamp}</span>
//             </div>
//             <img
//               src={`${process.env.NEXT_PUBLIC_FLASK_URL}/images/${face.image_path}`}
//               alt={`Known Face ${index}`}
//               style={{ width: '150px', height: '150px', objectFit: 'contain' }}
//             />
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default RecogFaces;
