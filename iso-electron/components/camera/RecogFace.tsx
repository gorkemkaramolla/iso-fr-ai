import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useRouter } from "next/navigation";
import { Toast } from "primereact/toast";
import { Nullable } from "primereact/ts-helpers";
import RecogFaceExpandedListItem from "./Recog/RecogFaceExpandedListItem";
import RecogFaceCollapsedItem from "./Recog/RecogFaceCollapsedItem";
import { getRecogFaces, updateRecogName } from "@/services/camera/service";
import RecogFaceHeaderBar from "./Recog/RecogFaceHeaderBar";
import { GroupedRecogFaces, RecogFace } from "@/types";
import RecogFacesAvatarGroup from "./Recog/AvatarGroup";

const socket = io(process.env.NEXT_PUBLIC_FLASK_URL!);
interface IRecogFace {
  toast: React.RefObject<Toast>;
}

const RecogFaces: React.FC<IRecogFace> = ({ toast }) => {
  const [selectedDate, setSelectedDate] = useState<Nullable<Date>>(new Date());
  const router = useRouter();
  const [groupedRecogFaces, setGroupedRecogFaces] = useState<
    GroupedRecogFaces[]
  >([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [editingName, setEditingName] = useState<string | null>(null);
  const [newName, setNewName] = useState<string>("");
  const [selectedFace, setSelectedFace] = useState<RecogFace | null>(null);
  const [filteredGroups, setFilteredGroups] = useState(groupedRecogFaces);

  const handleEditName = async (id: string) => {
    if (await updateRecogName(id, newName)) {
      setGroupedRecogFaces((prevGroups) =>
        prevGroups.map((group) =>
          group.name === id ? { ...group, name: newName } : group
        )
      );

      // Update filteredGroups as well
      setFilteredGroups((prevFilteredGroups) =>
        prevFilteredGroups
          .map((group) =>
            group.name === id ? { ...group, name: newName } : group
          )
          .filter((group) =>
            group.name.toLowerCase().includes(searchQuery.toLowerCase())
          )
      );

      setEditingName(null);
    }
  };

  // Update filteredGroups whenever searchQuery or groupedRecogFaces changes
  useEffect(() => {
    setFilteredGroups(
      groupedRecogFaces.filter((group) =>
        group?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [searchQuery, groupedRecogFaces]);

  const mergeGroups = (groups: GroupedRecogFaces[]) => {
    const merged = groups.reduce((acc: GroupedRecogFaces[], current) => {
      const foundIndex = acc.findIndex(
        (g) => g.personnel_id === current.personnel_id
      );
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
        const faces = await getRecogFaces(selectedDate?.toISOString());
        // console.log(faces);

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
                personnel_id: face.personnel_id,
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
        setError("Failed to fetch recognized faces.");
      } finally {
        setLoading(false);
      }
    };

    fetchRecogFaces();

    socket.on("new_face", (newFace) => {
      setGroupedRecogFaces((prevGroups) => {
        const groupIndex = prevGroups.findIndex(
          (g) => g.personnel_id === newFace.personnel_id
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
              personnel_id: newFace.personnel_id,
              name: newFace.label,
              faces: [newFace],
              isCollapsed: true,
            },
            ...prevGroups,
          ];
        }
      });

      // // Show success toast
      // toast.current?.show({
      //   severity: 'info',
      //   summary: 'Yeni Yüz Tanımlandı',
      //   detail: `"${newFace.label}" adlı yüz tanımlandı.`,
      //   life: 4000,
      // });
    });

    return () => {
      socket.off("new_face");
    };
  }, [editingName, selectedDate]);

  const handleToggle = (name: string) => {
    setGroupedRecogFaces((prevGroups) =>
      prevGroups.map((group) =>
        group.name === name
          ? { ...group, isCollapsed: !group.isCollapsed }
          : group
      )
    );
  };

  const handleImageClick = (id: string) => {
    router.push(`/profiles/?id=${id}`);
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="backdrop-blur-lg p-4 rounded-xl">
      <div className="block xl:hidden w-full">
        <RecogFacesAvatarGroup
          groups={filteredGroups}
          handleImageClick={handleImageClick}
        />
      </div>
      <div className="hidden xl:block">
        <RecogFaceHeaderBar
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
        <div className="max-h-[60svh] overflow-scroll w-full p-1 pr-3">
          {filteredGroups.map((group) => (
            <div key={group.name} className="mb-2 flex flex-col gap-2 w-full">
              <RecogFaceCollapsedItem
                key={group.name}
                group={group}
                editingName={editingName}
                newName={newName}
                setNewName={setNewName}
                setEditingName={setEditingName}
                handleImageClick={handleImageClick}
                handleEditName={handleEditName}
                handleToggle={handleToggle}
              />
              {!group.isCollapsed && (
                <div
                  className="flex flex-wrap gap-2 items-start justify-center p-2 pt-4 border
              border-gray-200 rounded-xl shadow-md max-w-[22rem]"
                >
                  {group.faces
                    .sort(
                      (a, b) =>
                        new Date(b.timestamp).getTime() -
                        new Date(a.timestamp).getTime()
                    )
                    .slice(0, 4) // Limit to the first 4 items
                    .map((face, index) => (
                      <RecogFaceExpandedListItem
                        key={index}
                        face={face}
                        index={index}
                        setSelectedFace={setSelectedFace}
                        selectedFace={selectedFace}
                      />
                    ))}

                  {group.faces.length > 4 && (
                    <div className="text-xs text-balance font-light text-gray-700">
                      +{group.faces.length - 4} daha fazla yüz tanımlandı...
                      {/* <button
                      className='btn btn-sm btn-primary text-white'
                      onClick={() => handleToggle(group.name)}
                    >
                      {group.isCollapsed ? 'Tümünü Göster' : 'Gizle'}
                    </button> */}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RecogFaces;
