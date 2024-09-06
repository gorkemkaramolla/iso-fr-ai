"use client";

import { ChangeEvent } from "react";
import { motion } from "framer-motion";
import { Input, Link, DatePicker } from "@nextui-org/react";
import {
  parseDate,
  CalendarDate,
  parseDateTime,
} from "@internationalized/date";

interface InfoItemProps {
  icon: React.ReactNode;
  label: string;
  isEditing: boolean;
  name: string;
  value: string | undefined;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  href?: string;
}

export default function InfoItem({
  icon,
  label,
  isEditing,
  name,
  value,
  onChange,
  href,
}: InfoItemProps) {
  const handleDateChange = (date: CalendarDate) => {
    const formattedDate = date.toString(); // Convert DateValue to string
    onChange({
      target: { name, value: formattedDate },
    } as ChangeEvent<HTMLInputElement>);
  };

  return (
    <motion.div
      className="flex items-center gap-4 rounded-large"
      animate={
        isEditing
          ? {
              backgroundColor: ["#ffffff", "#eef2ff", "#ffffff"],
              boxShadow: [
                "0 0 0 rgba(59, 130, 246, 0)",
                "0 0 6px rgba(59, 130, 246, 0.3)",
                "0 0 0 rgba(59, 130, 246, 0)",
              ],
            }
          : {}
      }
      transition={{ duration: 0.7, ease: "easeInOut" }}
    >
      <div className="text-primary">{icon}</div>
      <div className="flex-grow">
        <p className="text-small font-medium text-foreground">{label}</p>
        {isEditing ? (
          name === "birth_date" ? (
            <DatePicker
              value={value ? parseDate(value) : null} // Convert string to DateValue (CalendarDate)
              onChange={handleDateChange}
              label="Select date"
              className="max-w-xs"
              variant="bordered"
            />
          ) : (
            <Input
              name={name}
              value={value}
              onChange={onChange}
              variant="bordered"
              size="sm"
              className="min-w-[200px]"
            />
          )
        ) : href ? (
          <Link href={href} color="primary" underline="hover">
            {value}
          </Link>
        ) : (
          <p className="text-default-500">{value}</p>
        )}
      </div>
    </motion.div>
  );
}
