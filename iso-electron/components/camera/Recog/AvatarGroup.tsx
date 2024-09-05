import React, { useEffect, useState } from "react";
import { Avatar, AvatarGroup, AvatarIcon, Badge } from "@nextui-org/react";
import { GroupedRecogFaces } from "@/types";
import Link from "next/link";

interface RecogFaceCollapsedItemProps {
  groups: GroupedRecogFaces[];
  handleImageClick: (name: string) => void;
}

const emotions = [
  "😐",
  "😄",
  "😢",
  "😲",
  "😨",
  "🤢",
  "😠",
  // [neutral, happy, sad, surprised, scared, disgusted, angry
];
];

const RecogFacesAvatarGroup: React.FC<RecogFaceCollapsedItemProps> = ({
  groups,
  handleImageClick,
}) => {
  const [maxAvatars, setMaxAvatars] = useState(11);

  const calculateMaxAvatars = () => {
    const width = window.innerWidth;
    if (width < 600) return 3;
    if (width < 900) return 5;
    if (width < 1200) return 10;
    return 20;
  };

  useEffect(() => {
    const handleResize = () => {
      setMaxAvatars(calculateMaxAvatars());
    };

    // Set initial value
    handleResize();

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <AvatarGroup
      isBordered
      isGrid
      max={maxAvatars}
      classNames={{
        base: "flex gap-4",
      }}
    >
      {groups.map((group, index) => (
        <Badge
          key={index}
          isOneChar
          content={emotions[Number(group!.faces?.at(0)!.emotion!)]}
          placement="bottom-right"
        >
          <Badge
            key={index}
            content={group!.faces?.length}
            color="primary"
            placement="top-right"
            classNames={{ badge: "bg-opacity-75" }}
          >
            <Avatar
              key={index}
              src={`${process.env.NEXT_PUBLIC_UTILS_URL}/personel/image/?id=${group.personnel_id}`}
              classNames={{
                base: "bg-gradient-to-br from-[#FFB457] to-[#FF705B]",
                icon: "text-black/80",
                fallback: "w-10 h-10",
              }}
              style={{ fontSize: "1.5rem" }}
              onClick={() => handleImageClick(group.personnel_id)}
              title={`${group.name}`}
              showFallback
              fallback={<AvatarIcon />}
              isBordered
              color={group?.faces?.at(0)?.gender === 0 ? "danger" : "secondary"}
            />
          </Badge>
        </Badge>
      ))}
    </AvatarGroup>
  );
};

export default RecogFacesAvatarGroup;
