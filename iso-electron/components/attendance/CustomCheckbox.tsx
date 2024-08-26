import React from "react";
import {Checkbox, Link, User, Chip, cn} from "@nextui-org/react";

export const CustomCheckbox = ({ user, statusColor, value }: { user: any, statusColor: any, value: any }) => {
  return (
    <Checkbox
      aria-label={user.name}
      classNames={{
        base: cn(
          "inline-flex max-w-md w-full bg-content1 m-0",
          "hover:bg-content2 items-center justify-start",
          "cursor-pointer rounded-lg gap-2 p-4 border-2 border-transparent",
        //   "data-[selected=true]:border-primary"
        ),
        label: "w-full",
      }}
      value={value}
    >
      <div className="w-full flex justify-between gap-2">
        <User
          avatarProps={{ size: "md", src: user.avatar }}
          description={
            user.role
          }
          name={user.name}
  
            
        />
        <div className="flex items-center">
          <Chip color={statusColor} className="text-white" size="sm" variant="shadow">
            {user.status}
          </Chip>
        </div>
      </div>
    </Checkbox>
  );
};
