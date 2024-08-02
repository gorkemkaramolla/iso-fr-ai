import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { SearchIcon, XIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Tooltip } from 'primereact/tooltip';
import { FaTable } from 'react-icons/fa'; // Importing FontAwesome icon
import { Toast } from 'primereact/toast';

const BASE_URL = process.env.NEXT_PUBLIC_FLASK_URL;
const socket = io(BASE_URL!);
const InfoItem = ({
  label,
  value,
}: {
  label: string | number;
  value: string | number;
}) => (
  <p className='text-sm'>
    <span className='font-semibold text-gray-700'>{label}:</span>{' '}
    <span className='text-gray-600'>{value}</span>
  </p>
);
const getRecogFaces = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/recog`);
    return response.data;
  } catch (error) {
    console.error('Error fetching recognized faces', error);
    throw error;
  }
};
('');
const updateRecogName = async (id: string, newName: string) => {
  try {
    await axios.put(`${BASE_URL}/recog/name/${id}`, { name: newName });
    return true;
  } catch (error) {
    console.error('Error updating name', error);
    return false;
  }
};

interface IRecogFace {
  toast: React.RefObject<Toast>;
}

const RecogFaces: React.FC<IRecogFace> = ({ toast }) => {
  const router = useRouter();
  const [groupedRecogFaces, setGroupedRecogFaces] = useState<
    GroupedRecogFaces[]
  >([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [editingName, setEditingName] = useState<string | null>(null);
  const [newName, setNewName] = useState<string>('');
  const [selectedFace, setSelectedFace] = useState<RecogFace | null>(null);

  const mergeGroups = (groups: GroupedRecogFaces[]) => {
    const merged = groups.reduce((acc: GroupedRecogFaces[], current) => {
      const foundIndex = acc.findIndex((g) => g.name === current.name);
      if (foundIndex !== -1) {
        acc[foundIndex].faces = [...acc[foundIndex].faces, ...current.faces];
      } else {
        acc.push(current);
      }
      return acc;
    }, []);

    const uniqueMerged = merged.map((group) => ({
      ...group,
      faces: Array.from(
        new Set(group.faces.map((face) => JSON.stringify(face)))
      )
        .map((face) => JSON.parse(face))
        .sort(
          (a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        ),
    }));

    return uniqueMerged;
  };

  useEffect(() => {
    const fetchRecogFaces = async () => {
      try {
        const faces = await getRecogFaces();
        console.log(faces);

        faces.sort(
          (a: RecogFace, b: RecogFace) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

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

        const sortedGrouped = mergeGroups(grouped).sort((a, b) => {
          const aLatestTimestamp = new Date(
            Math.max(
              ...a.faces.map((face) => new Date(face.timestamp).getTime())
            )
          ).getTime();
          const bLatestTimestamp = new Date(
            Math.max(
              ...b.faces.map((face) => new Date(face.timestamp).getTime())
            )
          ).getTime();
          return bLatestTimestamp - aLatestTimestamp;
        });

        setGroupedRecogFaces(sortedGrouped);
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
          group.faces.unshift(newFace);
          const updatedGroups = [...prevGroups];
          updatedGroups.splice(groupIndex, 1);
          return [group, ...updatedGroups];
        } else {
          return [
            {
              name: newFace.label,
              faces: [newFace],
              isCollapsed: true,
            },
            ...prevGroups,
          ];
        }
      });

      // Show success toast
      toast.current?.show({
        severity: 'info',
        summary: 'Yeni Yüz Tanımlandı',
        detail: `"${newFace.label}" adlı yüz tanımlandı.`,
        life: 4000,
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
  const handleImageClick = (id: string) => {
    router.push(`/personel/${id}`);
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className='backdrop-blur-lg p-4 rounded-xl'>
      <div className='flex items-center justify-between'>
        <h1 className='text-3xl font-bold mb-2'>Tanınan Yüzler</h1>
        <FaTable
          className='ml-2 pb-1 text-[rgb(80,74,237)] cursor-pointer'
          size={32}
          onClick={() => router.push('/recog')}
          title='Tablo Görünümü'
        />
      </div>
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
      <div className='max-h-[60svh] overflow-scroll w-full p-1 pr-3'>
        {filteredGroups.map((group) => (
          <div key={group.name} className='mb-2 flex flex-col gap-2 w-full'>
            <div
              className='flex items-center justify-start gap-2  font-bold
              bg-slate-50 w-full p-2 rounded-xl shadow-md '
            >
              <>
                <img
                  src={`${BASE_URL}/faces/${group.name}`}
                  alt='avatar'
                  className='shadow-md shadow-red-500 object-cover w-10 h-10 rounded-full cursor-pointer'
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = './inner_circle.png';
                  }}
                  onClick={() => handleImageClick(group.name)}
                  title='Profile Git'
                />
              </>
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
                    className='btn btn-sm btn-primary text-white'
                  >
                    Kaydet
                  </button>
                  <button
                    onClick={() => setEditingName(null)}
                    className='btn btn-sm btn-secondary text-white'
                  >
                    İptal
                  </button>
                </div>
              ) : (
                <div className='flex justify-between items-center w-full'>
                  <div className='text-xs  overflow-hidden '>
                    <span
                      className='cursor-pointer'
                      onClick={() => handleToggle(group.name)}
                      title='Tüm yüz tanımalar'
                    >
                      {group.name}
                    </span>

                    <br />
                    <span className='font-light text-xs'>
                      {formatLastSeen(getLatestTimestamp(group.faces))}
                    </span>
                  </div>
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
                className='flex flex-wrap gap-2 items-start justify-center p-2 pt-4 border
              border-gray-200 rounded-xl shadow-md max-w-[21.5rem]'
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
                        className='object-cover w-[60px] h-[60px] rounded-sm cursor-pointer'
                        onClick={() => {
                          setSelectedFace(face);
                          (
                            document.getElementById(
                              `modal-${index}`
                            ) as HTMLDialogElement
                          ).showModal();
                        }}
                      />
                      <div className='text-xs text-balance font-light'>
                        {formatLastSeen(face.timestamp)}
                      </div>
                      <dialog id={`modal-${index}`} className='modal'>
                        <div className='modal-box max-w-3xl bg-white rounded-lg shadow-2xl overflow-hidden'>
                          <form
                            method='dialog'
                            className='absolute right-2 top-2'
                          >
                            <button className='btn btn-circle btn-ghost text-gray-500 hover:text-red-500 transition-colors duration-200'>
                              <XIcon className='w-6 h-6 stroke-[3]' />
                            </button>
                          </form>
                          {selectedFace && (
                            <div className='flex flex-col md:flex-row'>
                              <div className='md:w-1/2 p-4'>
                                <img
                                  src={`${BASE_URL}/images/${selectedFace.image_path}`}
                                  alt='Selected Face'
                                  className='object-cover w-full h-full rounded-lg shadow-md'
                                />
                              </div>
                              <div className='md:w-1/2 p-6 bg-gray-50'>
                                <h2 className='text-2xl font-bold mb-4 text-gray-800'>
                                  {selectedFace.label}
                                </h2>
                                <div className='space-y-3'>
                                  <InfoItem
                                    label='Tarih'
                                    value={new Date(
                                      selectedFace.timestamp
                                    ).toLocaleString()}
                                  />
                                  <InfoItem
                                    label='Benzerlik'
                                    value={selectedFace.similarity}
                                  />
                                  <InfoItem
                                    label='Duygu'
                                    value={selectedFace.emotion}
                                  />
                                  <InfoItem
                                    label='Cinsiyet'
                                    value={
                                      selectedFace.gender == 1
                                        ? 'Erkek'
                                        : 'Kadın'
                                    }
                                  />
                                  <InfoItem
                                    label='Yaş'
                                    value={selectedFace.age}
                                  />
                                  <InfoItem
                                    label='Fotoğraf Adresi'
                                    value={selectedFace.image_path}
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        <form method='dialog' className='modal-backdrop'>
                          <button>close</button>
                        </form>
                      </dialog>
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
