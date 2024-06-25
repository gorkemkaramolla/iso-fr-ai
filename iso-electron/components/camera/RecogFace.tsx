import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

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

    socket.on('new_face', (newFace) => {
      setGroupedRecogFaces((prevGroups) => {
        const group = prevGroups.find((g) => g.name === newFace.label);
        if (group) {
          group.faces.push(newFace);
          return [...prevGroups];
        } else {
          return [
            ...prevGroups,
            {
              name: newFace.label,
              faces: [newFace],
              isCollapsed: true,
            },
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

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      <h1 className='text-3xl font-bold mb-4'>Tanınan Yüzler</h1>
      <input
        type='text'
        placeholder='İsim Ara...'
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className='mb-4 p-2 border rounded w-full'
      />
      <div className='max-h-[75svh] overflow-scroll w-full pr-2'>
        {filteredGroups.map((group) => (
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
                    className='input input-sm input-bordered w-full max-w-xs text-xs font-normal'
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
                  <span className='text-xs overflow-hidden '>{group.name}</span>
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
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'start',
                  flexDirection: 'row-reverse',
                  padding: '4px',
                  border: '1px solid #f0f0f0',
                }}
              >
                {group.faces.map((face, index) => (
                  <div key={index} className='m-1 w-16'>
                    <div className='text-xs text-balance'>{face.timestamp}</div>
                    <img
                      src={`${BASE_URL}/images/${face.image_path}`}
                      alt={`Known Face ${index}`}
                      className='object-cover w-[60px] h-[60px] rounded-sm'
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
