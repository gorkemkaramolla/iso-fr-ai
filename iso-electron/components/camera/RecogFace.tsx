import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { SearchIcon, XIcon } from 'lucide-react';

const BASE_URL = process.env.NEXT_PUBLIC_FLASK_URL;
const socket = io(BASE_URL!);

const getRecogFaces = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/recog`);
    return response.data;
  } catch (error) {
    console.error('Error fetching recognized faces', error);
    throw error;
  }
};

const updateRecogName = async (id: string, newName: string) => {
  try {
    await axios.put(`${BASE_URL}/recog/name/${id}`, { name: newName });
    return true;
  } catch (error) {
    console.error('Error updating name', error);
    return false;
  }
};

const RecogFaces: React.FC = () => {
  const [groupedRecogFaces, setGroupedRecogFaces] = useState<
    GroupedRecogFaces[]
  >([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [editingName, setEditingName] = useState<string | null>(null);
  const [newName, setNewName] = useState<string>('');
  useEffect(() => {
    const mergeGroups = (groups: GroupedRecogFaces[]) => {
      const merged = groups.reduce((acc: GroupedRecogFaces[], current) => {
        const foundIndex = acc.findIndex((g) => g.name === current.name);
        if (foundIndex !== -1) {
          // Merge faces of groups with the same name
          acc[foundIndex].faces = [...acc[foundIndex].faces, ...current.faces];
        } else {
          acc.push(current);
        }
        return acc;
      }, []);

      // Ensure unique faces in each group after merge
      const uniqueMerged = merged.map((group) => ({
        ...group,
        faces: Array.from(
          new Set(group.faces.map((face) => JSON.stringify(face)))
        )
          .map((face) => JSON.parse(face))
          .sort(
            (a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          ),
      }));

      return uniqueMerged;
    };

    // Apply mergeGroups function whenever groupedRecogFaces changes
    const mergedGroups = mergeGroups(groupedRecogFaces);
    if (JSON.stringify(mergedGroups) !== JSON.stringify(groupedRecogFaces)) {
      setGroupedRecogFaces(mergedGroups);
    }
  }, [groupedRecogFaces]);
  useEffect(() => {
    const fetchRecogFaces = async () => {
      try {
        const faces = await getRecogFaces();
        console.log(faces);

        // Sort faces by timestamp in descending order
        faces.sort(
          (a: RecogFace, b: RecogFace) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

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

    socket.on('new_face', (newFace) => {
      setGroupedRecogFaces((prevGroups) => {
        const groupIndex = prevGroups.findIndex(
          (g) => g.name === newFace.label
        );
        if (groupIndex !== -1) {
          const group = prevGroups[groupIndex];
          group.faces.unshift(newFace); // Add new face at the beginning of the group's faces array
          const updatedGroups = [...prevGroups];
          updatedGroups.splice(groupIndex, 1); // Remove the old group
          return [group, ...updatedGroups]; // Add the updated group at the top
        } else {
          return [
            {
              name: newFace.label,
              faces: [newFace],
              isCollapsed: true,
            },
            ...prevGroups, // Add new group at the beginning of the array
          ];
        }
      });
    });

    return () => {
      socket.off('new_face');
    };
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

  const handleEditName = async (id: string) => {
    if (await updateRecogName(id, newName)) {
      setGroupedRecogFaces((prevGroups) =>
        prevGroups.map((group) =>
          group.name === id ? { ...group, name: newName } : group
        )
      );
      setEditingName(null);
    } else {
      alert('Error updating name');
    }
  };

  const filteredGroups = groupedRecogFaces.filter((group) =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getLatestTimestamp = (faces: RecogFace[]) => {
    const latestFace = faces.reduce((latest, face) => {
      const faceTime = new Date(face.timestamp).getTime();
      return faceTime > new Date(latest.timestamp).getTime() ? face : latest;
    });
    return latestFace.timestamp;
  };

  const formatLastSeen = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);

    const units = [
      { label: 'yıl', seconds: 31536000 },
      { label: 'ay', seconds: 2592000 },
      { label: 'hafta', seconds: 604800 },
      { label: 'gün', seconds: 86400 },
      { label: 'saat', seconds: 3600 },
      { label: 'dakika', seconds: 60 },
      { label: 'saniye', seconds: 1 },
    ];

    for (const unit of units) {
      const amount = Math.floor(diffInSeconds / unit.seconds);
      if (amount >= 1) {
        return `${amount} ${unit.label}${amount >= 1 ? ' önce' : ''}`;
      }
    }

    return 'şimdi';
  };
  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      <h1 className='text-3xl font-bold mb-2'>Tanınan Yüzler</h1>
      <label className='input input-bordered flex items-center gap-2 mb-2'>
        <input
          type='text'
          className='grow'
          placeholder='İsim Ara...'
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <XIcon
            onClick={() => setSearchQuery('')}
            className='text-red-600 cursor-pointer active:scale-75 transition-transform duration-200'
          />
        )}
        <div
          className={`${searchQuery ? 'hidden' : 'tooltip tooltip-left'}`}
          data-tip='İsime göre arama yapınız.'
        >
          <SearchIcon className={`opacity-70 ${searchQuery ? 'hidden' : ''}`} />
        </div>
      </label>
      <div className='max-h-[70svh] overflow-scroll w-full pr-2'>
        {filteredGroups.map((group) => (
          <div key={group.name} className='mb-2  flex flex-col gap-2 w-full'>
            <div
              onClick={() => handleToggle(group.name)}
              className='flex items-center justify-start gap-2 cursor-pointer font-bold 
              bg-slate-50 w-full p-2 rounded-xl shadow-md'
            >
              <img
                src={`${BASE_URL}/faces/face-images/${group.name}.jpg`}
                alt='avatar'
                className='shadow-md shadow-red-500 object-cover w-10 h-10 rounded-full'
                onError={(e) => {
                  e.currentTarget.onerror = null; // Prevent infinite loop
                  e.currentTarget.src = './inner_circle.png';
                }}
              />
              {editingName === group.name ? (
                <div className='flex items-center gap-2'>
                  <input
                    type='text'
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className='input input-sm input-bordered w-full max-w-xs text-xs font-normal px-2'
                  />
                  <button
                    onClick={() => handleEditName(group.name)}
                    className='btn btn-sm  btn-primary text-white'
                  >
                    Kaydet
                  </button>
                  <button
                    onClick={() => setEditingName(null)}
                    className='btn btn-sm  btn-secondary text-white'
                  >
                    İptal
                  </button>
                </div>
              ) : (
                <div className='flex justify-between items-center w-full'>
                  <span className='text-xs overflow-hidden '>
                    {group.name}
                    <br />
                    <span className='font-light text-xs'>
                      {formatLastSeen(getLatestTimestamp(group.faces))}
                    </span>
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingName(group.name);
                      setNewName(group.name);
                    }}
                    className='btn btn-sm btn-outline'
                  >
                    Düzenle
                  </button>
                </div>
              )}
            </div>
            {!group.isCollapsed && (
              <div
                className='flex flex-wrap gap-2 items-start justify-start p-2 pt-4 border
              border-gray-200 rounded-b-xl shadow-md -mt-4 -z-40'
              >
                {group.faces
                  .sort(
                    (a, b) =>
                      new Date(b.timestamp).getTime() -
                      new Date(a.timestamp).getTime()
                  )
                  .map((face, index) => (
                    <div key={index} className='m-1 w-16'>
                      <img
                        src={`${BASE_URL}/images/${face.image_path}`}
                        alt={`Known Face ${index}`}
                        className='object-cover w-[60px] h-[60px] rounded-sm'
                      />
                      <div className='text-xs text-balance font-light'>
                        {formatLastSeen(face.timestamp)}
                      </div>
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

// import React, { useEffect, useState } from 'react';
// import axios from 'axios';
// import { io } from 'socket.io-client';

// const BASE_URL = process.env.NEXT_PUBLIC_FLASK_URL;
// const socket = io(BASE_URL!);

// const getRecogFaces = async () => {
//   try {
//     const response = await axios.get(`${BASE_URL}/recog`);
//     return response.data;
//   } catch (error) {
//     console.error('Error fetching recognized faces', error);
//     throw error;
//   }
// };

// const updateRecogName = async (id: string, newName: string) => {
//   try {
//     await axios.put(`${BASE_URL}/recog/name/${id}`, { name: newName });
//     return true;
//   } catch (error) {
//     console.error('Error updating name', error);
//     return false;
//   }
// };

// const RecogFaces: React.FC = () => {
//   const [groupedRecogFaces, setGroupedRecogFaces] = useState<
//     GroupedRecogFaces[]
//   >([]);
//   const [loading, setLoading] = useState<boolean>(true);
//   const [error, setError] = useState<string | null>(null);
//   const [searchQuery, setSearchQuery] = useState<string>('');
//   const [editingName, setEditingName] = useState<string | null>(null);
//   const [newName, setNewName] = useState<string>('');
//   useEffect(() => {
//     const mergeGroups = (groups: GroupedRecogFaces[]) => {
//       const merged = groups.reduce((acc: GroupedRecogFaces[], current) => {
//         const foundIndex = acc.findIndex((g) => g.name === current.name);
//         if (foundIndex !== -1) {
//           // Merge faces of groups with the same name
//           acc[foundIndex].faces = [...acc[foundIndex].faces, ...current.faces];
//         } else {
//           acc.push(current);
//         }
//         return acc;
//       }, []);

//       // Ensure unique faces in each group after merge
//       const uniqueMerged = merged.map((group) => ({
//         ...group,
//         faces: Array.from(
//           new Set(group.faces.map((face) => JSON.stringify(face)))
//         )
//           .map((face) => JSON.parse(face))
//           .sort(
//             (a, b) =>
//               new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
//           ),
//       }));

//       return uniqueMerged;
//     };

//     // Apply mergeGroups function whenever groupedRecogFaces changes
//     const mergedGroups = mergeGroups(groupedRecogFaces);
//     if (JSON.stringify(mergedGroups) !== JSON.stringify(groupedRecogFaces)) {
//       setGroupedRecogFaces(mergedGroups);
//     }
//   }, [groupedRecogFaces]);
//   useEffect(() => {
//     const fetchRecogFaces = async () => {
//       try {
//         const faces = await getRecogFaces();
//         console.log(faces);

//         // Sort faces by timestamp in descending order
//         faces.sort(
//           (a: RecogFace, b: RecogFace) =>
//             new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
//         );

//         // Group faces by label and initialize as collapsed
//         const grouped = faces.reduce(
//           (acc: GroupedRecogFaces[], face: RecogFace) => {
//             const group = acc.find((g) => g.name === face.label);
//             if (group) {
//               group.faces.push(face);
//             } else {
//               acc.unshift({
//                 name: face.label,
//                 faces: [face],
//                 isCollapsed: true,
//               });
//             }
//             return acc;
//           },
//           []
//         );

//         setGroupedRecogFaces(grouped);
//       } catch (err) {
//         setError('Failed to fetch recognized faces.');
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchRecogFaces();

//     socket.on('new_face', (newFace) => {
//       setGroupedRecogFaces((prevGroups) => {
//         const groupIndex = prevGroups.findIndex(
//           (g) => g.name === newFace.label
//         );
//         if (groupIndex !== -1) {
//           const group = prevGroups[groupIndex];
//           group.faces.unshift(newFace); // Add new face at the beginning of the group's faces array
//           const updatedGroups = [...prevGroups];
//           updatedGroups.splice(groupIndex, 1); // Remove the old group
//           return [group, ...updatedGroups]; // Add the updated group at the top
//         } else {
//           return [
//             {
//               name: newFace.label,
//               faces: [newFace],
//               isCollapsed: true,
//             },
//             ...prevGroups, // Add new group at the beginning of the array
//           ];
//         }
//       });
//     });

//     return () => {
//       socket.off('new_face');
//     };
//   }, []);

//   const handleToggle = (name: string) => {
//     setGroupedRecogFaces((prevGroups) =>
//       prevGroups.map((group) =>
//         group.name === name
//           ? { ...group, isCollapsed: !group.isCollapsed }
//           : group
//       )
//     );
//   };

//   const handleEditName = async (id: string) => {
//     if (await updateRecogName(id, newName)) {
//       setGroupedRecogFaces((prevGroups) =>
//         prevGroups.map((group) =>
//           group.name === id ? { ...group, name: newName } : group
//         )
//       );
//       setEditingName(null);
//     } else {
//       alert('Error updating name');
//     }
//   };

//   const filteredGroups = groupedRecogFaces.filter((group) =>
//     group.name.toLowerCase().includes(searchQuery.toLowerCase())
//   );

//   if (loading) return <div>Loading...</div>;
//   if (error) return <div>{error}</div>;

//   return (
//     <div>
//       <h1 className='text-3xl font-bold mb-2'>Tanınan Yüzler</h1>
//       {/* <input
//         type='text'
//         placeholder='İsim Ara...'
//         value={searchQuery}
//         onChange={(e) => setSearchQuery(e.target.value)}
//         className='input input-bordered mb-4 p-2 border rounded w-full'
//       /> */}
//       <label className='input input-bordered flex items-center gap-2 mb-2'>
//         <input
//           type='text'
//           className='grow'
//           placeholder='İsim Ara...'
//           value={searchQuery}
//           onChange={(e) => setSearchQuery(e.target.value)}
//         />
//         <svg
//           xmlns='http://www.w3.org/2000/svg'
//           viewBox='0 0 16 16'
//           fill='currentColor'
//           className='h-4 w-4 opacity-70'
//         >
//           <path
//             fillRule='evenodd'
//             d='M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z'
//             clipRule='evenodd'
//           />
//         </svg>
//       </label>
//       <div className='max-h-[80svh] overflow-scroll w-full pr-2'>
//         {filteredGroups.map((group) => (
//           <div key={group.name} className='mb-2 shadow-sm'>
//             <div
//               onClick={() => handleToggle(group.name)}
//               style={{
//                 cursor: 'pointer',
//                 fontWeight: 'bold',
//                 marginBottom: '10px',
//                 background: '#f0f0f0',
//                 padding: '8px',
//                 borderRadius: '4px',
//               }}
//               className='flex items-center justify-start gap-2'
//             >
//               <img
//                 src={`${BASE_URL}/faces/face-images/${group.name}.jpg`}
//                 alt='avatar'
//                 className='shadow-md shadow-red-500 object-cover w-10 h-10 rounded-full'
//                 onError={(e) => {
//                   e.currentTarget.onerror = null; // Prevent infinite loop
//                   e.currentTarget.src = './inner_circle.png';
//                 }}
//               />
//               {editingName === group.name ? (
//                 <div className='flex items-center gap-2'>
//                   <input
//                     type='text'
//                     value={newName}
//                     onChange={(e) => setNewName(e.target.value)}
//                     className='input input-sm input-bordered w-full max-w-xs text-xs font-normal px-2'
//                   />
//                   <button
//                     onClick={() => handleEditName(group.name)}
//                     className='btn btn-sm  btn-primary text-white'
//                   >
//                     Kaydet
//                   </button>
//                   <button
//                     onClick={() => setEditingName(null)}
//                     className='btn btn-sm  btn-secondary text-white'
//                   >
//                     İptal
//                   </button>
//                 </div>
//               ) : (
//                 <div className='flex justify-between items-center w-full'>
//                   <span className='text-xs overflow-hidden '>{group.name}</span>
//                   <button
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       setEditingName(group.name);
//                       setNewName(group.name);
//                     }}
//                     className='btn btn-sm btn-outline'
//                   >
//                     Düzenle
//                   </button>
//                 </div>
//               )}
//             </div>
//             {!group.isCollapsed && (
//               <div
//                 style={{
//                   display: 'flex',
//                   flexWrap: 'wrap',
//                   alignItems: 'center',
//                   justifyContent: 'start',

//                   padding: '4px',
//                   border: '1px solid #f0f0f0',
//                 }}
//               >
//                 {group.faces
//                   .sort(
//                     (a, b) =>
//                       new Date(a.timestamp).getTime() -
//                       new Date(b.timestamp).getTime()
//                   )
//                   .map((face, index) => (
//                     <div key={index} className='m-1 w-16'>
//                       <div className='text-xs text-balance'>
//                         {face.timestamp}
//                       </div>
//                       <img
//                         src={`${BASE_URL}/images/${face.image_path}`}
//                         alt={`Known Face ${index}`}
//                         className='object-cover w-[60px] h-[60px] rounded-sm'
//                       />
//                     </div>
//                   ))}
//               </div>
//             )}
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default RecogFaces;
// import React, { useEffect, useState } from 'react';
// import axios from 'axios';
// import { io } from 'socket.io-client';

// const BASE_URL = process.env.NEXT_PUBLIC_FLASK_URL;
// const socket = io(BASE_URL!);

// const getRecogFaces = async () => {
//   try {
//     const response = await axios.get(`${BASE_URL}/recog`);
//     return response.data;
//   } catch (error) {
//     console.error('Error fetching recognized faces', error);
//     throw error;
//   }
// };

// const updateRecogName = async (id: string, newName: string) => {
//   try {
//     await axios.put(`${BASE_URL}/recog/name/${id}`, { name: newName });
//     return true;
//   } catch (error) {
//     console.error('Error updating name', error);
//     return false;
//   }
// };

// const RecogFaces: React.FC = () => {
//   const [groupedRecogFaces, setGroupedRecogFaces] = useState<
//     GroupedRecogFaces[]
//   >([]);
//   const [loading, setLoading] = useState<boolean>(true);
//   const [error, setError] = useState<string | null>(null);
//   const [searchQuery, setSearchQuery] = useState<string>('');
//   const [editingName, setEditingName] = useState<string | null>(null);
//   const [newName, setNewName] = useState<string>('');

//   useEffect(() => {
//     const fetchRecogFaces = async () => {
//       try {
//         const faces = await getRecogFaces();
//         console.log(faces);

//         // Sort faces by timestamp in descending order
//         faces.sort(
//           (a: RecogFace, b: RecogFace) =>
//             new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
//         );

//         // Group faces by label and initialize as collapsed
//         const grouped = faces.reduce(
//           (acc: GroupedRecogFaces[], face: RecogFace) => {
//             const group = acc.find((g) => g.name === face.label);
//             if (group) {
//               group.faces.push(face);
//             } else {
//               acc.unshift({
//                 name: face.label,
//                 faces: [face],
//                 isCollapsed: true,
//               });
//             }
//             return acc;
//           },
//           []
//         );

//         setGroupedRecogFaces(grouped);
//       } catch (err) {
//         setError('Failed to fetch recognized faces.');
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchRecogFaces();

//     socket.on('new_face', (newFace) => {
//       setGroupedRecogFaces((prevGroups) => {
//         const group = prevGroups.find((g) => g.name === newFace.label);
//         if (group) {
//           group.faces.unshift(newFace); // Add new face at the beginning of the group's faces array
//           return [...prevGroups];
//         } else {
//           return [
//             {
//               name: newFace.label,
//               faces: [newFace],
//               isCollapsed: true,
//             },
//             ...prevGroups, // Add new group at the beginning of the array
//           ];
//         }
//       });
//     });

//     return () => {
//       socket.off('new_face');
//     };
//   }, []);

//   const handleToggle = (name: string) => {
//     setGroupedRecogFaces((prevGroups) =>
//       prevGroups.map((group) =>
//         group.name === name
//           ? { ...group, isCollapsed: !group.isCollapsed }
//           : group
//       )
//     );
//   };

//   const handleEditName = async (id: string) => {
//     if (await updateRecogName(id, newName)) {
//       setGroupedRecogFaces((prevGroups) =>
//         prevGroups.map((group) =>
//           group.name === id ? { ...group, name: newName } : group
//         )
//       );
//       setEditingName(null);
//     } else {
//       alert('Error updating name');
//     }
//   };

//   const filteredGroups = groupedRecogFaces.filter((group) =>
//     group.name.toLowerCase().includes(searchQuery.toLowerCase())
//   );

//   if (loading) return <div>Loading...</div>;
//   if (error) return <div>{error}</div>;

//   return (
//     <div>
//       <h1 className='text-3xl font-bold mb-4'>Tanınan Yüzler</h1>
//       <input
//         type='text'
//         placeholder='İsim Ara...'
//         value={searchQuery}
//         onChange={(e) => setSearchQuery(e.target.value)}
//         className='mb-4 p-2 border rounded w-full'
//       />
//       <div className='max-h-[75svh] overflow-scroll w-full pr-2'>
//         {filteredGroups.map((group) => (
//           <div key={group.name} className='mb-2 shadow-sm'>
//             <div
//               onClick={() => handleToggle(group.name)}
//               style={{
//                 cursor: 'pointer',
//                 fontWeight: 'bold',
//                 marginBottom: '10px',
//                 background: '#f0f0f0',
//                 padding: '8px',
//                 borderRadius: '4px',
//               }}
//               className='flex items-center justify-start gap-2'
//             >
//               <img
//                 src={`${BASE_URL}/faces/face-images/${group.name}.jpg`}
//                 alt='avatar'
//                 className='shadow-md shadow-red-500 object-cover w-10 h-10 rounded-full'
//                 onError={(e) => {
//                   e.currentTarget.onerror = null; // Prevent infinite loop
//                   e.currentTarget.src = './inner_circle.png';
//                 }}
//               />
//               {editingName === group.name ? (
//                 <div className='flex items-center gap-2'>
//                   <input
//                     type='text'
//                     value={newName}
//                     onChange={(e) => setNewName(e.target.value)}
//                     className='input input-sm input-bordered w-full max-w-xs text-xs font-normal px-2'
//                   />
//                   <button
//                     onClick={() => handleEditName(group.name)}
//                     className='btn btn-sm  btn-primary text-white'
//                   >
//                     Kaydet
//                   </button>
//                   <button
//                     onClick={() => setEditingName(null)}
//                     className='btn btn-sm  btn-secondary text-white'
//                   >
//                     İptal
//                   </button>
//                 </div>
//               ) : (
//                 <div className='flex justify-between items-center w-full'>
//                   <span className='text-xs overflow-hidden '>{group.name}</span>
//                   <button
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       setEditingName(group.name);
//                       setNewName(group.name);
//                     }}
//                     className='btn btn-sm btn-outline'
//                   >
//                     Düzenle
//                   </button>
//                 </div>
//               )}
//             </div>
//             {!group.isCollapsed && (
//               <div
//                 style={{
//                   display: 'flex',
//                   flexWrap: 'wrap',
//                   alignItems: 'center',
//                   justifyContent: 'start',
//                   padding: '4px',
//                   border: '1px solid #f0f0f0',
//                 }}
//               >
//                 {group.faces.map((face, index) => (
//                   <div key={index} className='m-1 w-16'>
//                     <div className='text-xs text-balance'>{face.timestamp}</div>
//                     <img
//                       src={`${BASE_URL}/images/${face.image_path}`}
//                       alt={`Known Face ${index}`}
//                       className='object-cover w-[60px] h-[60px] rounded-sm'
//                     />
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default RecogFaces;

// import React, { useEffect, useState } from 'react';
// import axios from 'axios';
// import { io } from 'socket.io-client';

// const BASE_URL = process.env.NEXT_PUBLIC_FLASK_URL;
// const socket = io(BASE_URL!);

// const getRecogFaces = async () => {
//   try {
//     const response = await axios.get(`${BASE_URL}/recog`);
//     return response.data;
//   } catch (error) {
//     console.error('Error fetching recognized faces', error);
//     throw error;
//   }
// };

// const updateRecogName = async (id: string, newName: string) => {
//   try {
//     await axios.put(`${BASE_URL}/recog/name/${id}`, { name: newName });
//     return true;
//   } catch (error) {
//     console.error('Error updating name', error);
//     return false;
//   }
// };

// const RecogFaces: React.FC = () => {
//   const [groupedRecogFaces, setGroupedRecogFaces] = useState<
//     GroupedRecogFaces[]
//   >([]);
//   const [loading, setLoading] = useState<boolean>(true);
//   const [error, setError] = useState<string | null>(null);
//   const [searchQuery, setSearchQuery] = useState<string>('');
//   const [editingName, setEditingName] = useState<string | null>(null);
//   const [newName, setNewName] = useState<string>('');

//   useEffect(() => {
//     const fetchRecogFaces = async () => {
//       try {
//         const faces = await getRecogFaces();
//         console.log(faces);

//         // Group faces by label and initialize as collapsed
//         const grouped = faces.reduce(
//           (acc: GroupedRecogFaces[], face: RecogFace) => {
//             const group = acc.find((g) => g.name === face.label);
//             if (group) {
//               group.faces.push(face);
//             } else {
//               acc.unshift({
//                 name: face.label,
//                 faces: [face],
//                 isCollapsed: true,
//               });
//             }
//             return acc;
//           },
//           []
//         );

//         setGroupedRecogFaces(grouped);
//       } catch (err) {
//         setError('Failed to fetch recognized faces.');
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchRecogFaces();

//     socket.on('new_face', (newFace) => {
//       setGroupedRecogFaces((prevGroups) => {
//         const group = prevGroups.find((g) => g.name === newFace.label);
//         if (group) {
//           group.faces.push(newFace);
//           return [...prevGroups];
//         } else {
//           return [
//             ...prevGroups,
//             {
//               name: newFace.label,
//               faces: [newFace],
//               isCollapsed: true,
//             },
//           ];
//         }
//       });
//     });

//     return () => {
//       socket.off('new_face');
//     };
//   }, []);

//   const handleToggle = (name: string) => {
//     setGroupedRecogFaces((prevGroups) =>
//       prevGroups.map((group) =>
//         group.name === name
//           ? { ...group, isCollapsed: !group.isCollapsed }
//           : group
//       )
//     );
//   };

//   const handleEditName = async (id: string) => {
//     if (await updateRecogName(id, newName)) {
//       setGroupedRecogFaces((prevGroups) =>
//         prevGroups.map((group) =>
//           group.name === id ? { ...group, name: newName } : group
//         )
//       );
//       setEditingName(null);
//     } else {
//       alert('Error updating name');
//     }
//   };

//   const filteredGroups = groupedRecogFaces.filter((group) =>
//     group.name.toLowerCase().includes(searchQuery.toLowerCase())
//   );

//   if (loading) return <div>Loading...</div>;
//   if (error) return <div>{error}</div>;

//   return (
//     <div>
//       <h1 className='text-3xl font-bold mb-4'>Tanınan Yüzler</h1>
//       <input
//         type='text'
//         placeholder='İsim Ara...'
//         value={searchQuery}
//         onChange={(e) => setSearchQuery(e.target.value)}
//         className='mb-4 p-2 border rounded w-full'
//       />
//       <div className='max-h-[75svh] overflow-scroll w-full pr-2'>
//         {filteredGroups.map((group) => (
//           <div key={group.name} className='mb-2 shadow-sm'>
//             <div
//               onClick={() => handleToggle(group.name)}
//               style={{
//                 cursor: 'pointer',
//                 fontWeight: 'bold',
//                 marginBottom: '10px',
//                 background: '#f0f0f0',
//                 padding: '8px',
//                 borderRadius: '4px',
//               }}
//               className='flex items-center justify-start gap-2'
//             >
//               <img
//                 src={`${BASE_URL}/faces/face-images/${group.name}.jpg`}
//                 alt='avatar'
//                 className='shadow-md shadow-red-500 object-cover w-10 h-10 rounded-full'
//                 onError={(e) => {
//                   e.currentTarget.onerror = null; // Prevent infinite loop
//                   e.currentTarget.src = './inner_circle.png';
//                 }}
//               />
//               {editingName === group.name ? (
//                 <div className='flex items-center gap-2'>
//                   <input
//                     type='text'
//                     value={newName}
//                     onChange={(e) => setNewName(e.target.value)}
//                     className='input input-sm input-bordered w-full max-w-xs text-xs font-normal px-2'
//                   />
//                   <button
//                     onClick={() => handleEditName(group.name)}
//                     className='btn btn-sm  btn-primary text-white'
//                   >
//                     Kaydet
//                   </button>
//                   <button
//                     onClick={() => setEditingName(null)}
//                     className='btn btn-sm  btn-secondary text-white'
//                   >
//                     İptal
//                   </button>
//                 </div>
//               ) : (
//                 <div className='flex justify-between items-center w-full'>
//                   <span className='text-xs overflow-hidden '>{group.name}</span>
//                   <button
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       setEditingName(group.name);
//                       setNewName(group.name);
//                     }}
//                     className='btn btn-sm btn-outline'
//                   >
//                     Düzenle
//                   </button>
//                 </div>
//               )}
//             </div>
//             {!group.isCollapsed && (
//               <div
//                 style={{
//                   display: 'flex',
//                   flexWrap: 'wrap',
//                   alignItems: 'center',
//                   justifyContent: 'start',
//                   flexDirection: 'row-reverse',
//                   padding: '4px',
//                   border: '1px solid #f0f0f0',
//                 }}
//               >
//                 {group.faces.map((face, index) => (
//                   <div key={index} className='m-1 w-16'>
//                     <div className='text-xs text-balance'>{face.timestamp}</div>
//                     <img
//                       src={`${BASE_URL}/images/${face.image_path}`}
//                       alt={`Known Face ${index}`}
//                       className='object-cover w-[60px] h-[60px] rounded-sm'
//                     />
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default RecogFaces;

// import React, { useEffect, useState } from 'react';
// import axios from 'axios';
// import { io } from 'socket.io-client';

// const BASE_URL = process.env.NEXT_PUBLIC_FLASK_URL;
// const socket = io(BASE_URL!);

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
//   const [groupedRecogFaces, setGroupedRecogFaces] = useState<
//     GroupedRecogFaces[]
//   >([]);
//   const [loading, setLoading] = useState<boolean>(true);
//   const [error, setError] = useState<string | null>(null);
//   const [searchQuery, setSearchQuery] = useState<string>('');

//   useEffect(() => {
//     const fetchRecogFaces = async () => {
//       try {
//         const faces = await getRecogFaces();
//         console.log(faces);

//         // Group faces by label and initialize as collapsed
//         const grouped = faces.reduce(
//           (acc: GroupedRecogFaces[], face: RecogFace) => {
//             const group = acc.find((g) => g.name === face.label);
//             if (group) {
//               group.faces.push(face);
//             } else {
//               acc.unshift({
//                 name: face.label,
//                 faces: [face],
//                 isCollapsed: true,
//               });
//             }
//             return acc;
//           },
//           []
//         );

//         setGroupedRecogFaces(grouped);
//       } catch (err) {
//         setError('Failed to fetch recognized faces.');
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchRecogFaces();

//     socket.on('new_face', (newFace) => {
//       setGroupedRecogFaces((prevGroups) => {
//         const group = prevGroups.find((g) => g.name === newFace.label);
//         if (group) {
//           group.faces.push(newFace);
//           return [...prevGroups];
//         } else {
//           return [
//             ...prevGroups,
//             {
//               name: newFace.label,
//               faces: [newFace],
//               isCollapsed: true,
//             },
//           ];
//         }
//       });
//     });

//     return () => {
//       socket.off('new_face');
//     };
//   }, []);

//   const handleToggle = (name: string) => {
//     setGroupedRecogFaces((prevGroups) =>
//       prevGroups.map((group) =>
//         group.name === name
//           ? { ...group, isCollapsed: !group.isCollapsed }
//           : group
//       )
//     );
//   };

//   const filteredGroups = groupedRecogFaces.filter((group) =>
//     group.name.toLowerCase().includes(searchQuery.toLowerCase())
//   );

//   if (loading) return <div>Loading...</div>;
//   if (error) return <div>{error}</div>;

//   return (
//     <div>
//       <h1 className='text-3xl font-bold mb-4'>Tanınan Yüzler</h1>
//       <input
//         type='text'
//         placeholder='İsim Ara...'
//         value={searchQuery}
//         onChange={(e) => setSearchQuery(e.target.value)}
//         className='mb-4 p-2 border rounded w-full'
//       />
//       <div className='max-h-[75svh] overflow-scroll w-full pr-2'>
//         {filteredGroups.map((group) => (
//           <div key={group.name} className='mb-2 shadow-sm'>
//             <div
//               onClick={() => handleToggle(group.name)}
//               style={{
//                 cursor: 'pointer',
//                 fontWeight: 'bold',
//                 marginBottom: '10px',
//                 background: '#f0f0f0',
//                 padding: '8px',
//                 borderRadius: '4px',
//               }}
//               className='flex items-center justify-start gap-2'
//             >
//               <img
//                 src={`${BASE_URL}/faces/face-images/${group.name}.jpg`}
//                 alt='avatar'
//                 className='shadow-md shadow-red-500 object-cover w-10 h-10 rounded-full'
//                 onError={(e) => {
//                   e.currentTarget.onerror = null; // Prevent infinite loop
//                   e.currentTarget.src = './inner_circle.png';
//                 }}
//               />
//               <span className='text-xs overflow-hidden'>{group.name}</span>
//             </div>
//             {!group.isCollapsed && (
//               <div
//                 style={{
//                   display: 'flex',
//                   flexWrap: 'wrap',
//                   alignItems: 'center',
//                   justifyContent: 'start',
//                   flexDirection: 'row-reverse',
//                   padding: '4px',
//                   border: '1px solid #f0f0f0',
//                 }}
//               >
//                 {group.faces.map((face, index) => (
//                   <div key={index} className='m-1 w-16'>
//                     <div className='text-xs text-balance'>{face.timestamp}</div>
//                     <img
//                       src={`${BASE_URL}/images/${face.image_path}`}
//                       alt={`Known Face ${index}`}
//                       className='object-cover w-[60px] h-[60px] rounded-sm'
//                     />
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default RecogFaces;
