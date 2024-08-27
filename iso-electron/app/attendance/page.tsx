"use client";
import React, { useState, useEffect } from "react";
import { Chip, User, Input, DateRangePicker } from "@nextui-org/react";
import { MultiSelect, MultiSelectChangeEvent } from 'primereact/multiselect';
import { now, getLocalTimeZone, ZonedDateTime } from "@internationalized/date";
import { I18nProvider } from "@react-aria/i18n";

interface Personnel {
  _id: string;
  name: string;
  lastname: string;
  title: string;
  address: string;
  phone: string;
  email: string;
  gsm: string;
  resume: string;
  birth_date: string;
  iso_phone: string;
  iso_phone2: string;
  file_path: string;
}

type Status = "Giriş" | "Çıkış" | "Gelmedi";

export default function PersonnelAttendance() {
  const [personnel, setPersonnel] = useState<Personnel[] | null>(null);
  const [personnelStatus, setPersonnelStatus] = useState<{ [key: string]: Status }>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status[]>(["Giriş", "Çıkış", "Gelmedi"]);
  const [dateRange, setDateRange] = useState<{ start: ZonedDateTime; end: ZonedDateTime }>(() => {
    const today = now(getLocalTimeZone());
    return {
      start: new ZonedDateTime(today.year, today.month, today.day, "UTC", 0, 0, 0, 0, 0),
      end: new ZonedDateTime(today.year, today.month, today.day, "UTC", 0, 23, 59, 59, 999),
    };
  });

  useEffect(() => {
    fetchPersonnelForDateRange(dateRange.start, dateRange.end);
  }, []);

  const fetchPersonnelForDateRange = async (start: ZonedDateTime, end: ZonedDateTime) => {
    setLoading(true);
    try {

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_UTILS_URL}/personel`
      );
      const data = await response.json();
      if (response.ok) {
        const initialStatus: { [key: string]: Status } = {};
        data.forEach((person: Personnel) => {
          initialStatus[person._id] = "Gelmedi";
        });
        setPersonnel(data);
        setPersonnelStatus(initialStatus);
      } else {
        console.error("Failed to fetch personnel data for date range");
      }
    } catch (error) {
      console.error("Error fetching personnel for date range:", error);
    } finally {
      setLoading(false);
    }
  };


  const fetchLastRecogs = async (start: ZonedDateTime, end: ZonedDateTime) => {
    setLoading(true);
    try {
      const startMillis = start.toDate().getTime();
      const endMillis = end.toDate().getTime();
      const response = await fetch(`${process.env.NEXT_PUBLIC_UTILS_URL}/personel/last_recog`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          start: startMillis,
          end: endMillis,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        // Process the data as needed
        console.log("Last recognized personnel data:", data);
        // Example: Update state with the fetched data
        // setLastRecogs(data);
      } else {
        console.error("Failed to fetch last recognized personnel data");
      }
    } catch (error) {
      console.error("Error fetching last recognized personnel data:", error);
    } finally {
      setLoading(false);
    }
  };
  
  // Example usage of fetchLastRecogs
  useEffect(() => {
    fetchLastRecogs(dateRange.start, dateRange.end);
  }, [dateRange]);
  

  const handleStatusChange = (personId: string) => {
    setPersonnelStatus((prevStatus) => {
      const currentStatus = prevStatus[personId];
      const newStatus =
        currentStatus === "Giriş"
          ? "Çıkış"
          : currentStatus === "Çıkış"
          ? "Gelmedi"
          : "Giriş";
      return { ...prevStatus, [personId]: newStatus };
    });
  };

  const handleStatusFilterChange = (e: MultiSelectChangeEvent) => {
    const newStatusFilter = e.value as Status[];
    setStatusFilter(newStatusFilter.length > 0 ? newStatusFilter : ["Giriş", "Çıkış", "Gelmedi"]);
  };

  const filteredPersonnel = personnel?.filter((person) => {
    const nameMatch = `${person.name} ${person.lastname}`.toLowerCase().includes(searchTerm.toLowerCase());
    const statusMatch = statusFilter.includes(personnelStatus[person._id]);
    return nameMatch && statusMatch;
  });

  const statusOptions = [
    "Giriş", "Çıkış", "Gelmedi"
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center nunito-700">
        Personel Giriş Çıkışları
      </h1>

      <div className="mb-6 flex flex-col md:flex-row gap-4 justify-center items-center">
        <Input
          type="text"
          placeholder="İsime göre arama..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-[260px]"
          size="md"
          classNames={{
            input: "!h-[3.5rem]",
            innerWrapper: "h-[3.5rem]",
            inputWrapper: "h-[3.5rem]",
          }}
        />
        <I18nProvider locale="tr-TR">
          <DateRangePicker
            label="Tarih Aralığı"
            hideTimeZone
            visibleMonths={2}
            defaultValue={dateRange}
            onChange={setDateRange}
            hourCycle={24}
            className="max-w-sm"
            size="md"
            pageBehavior="visible"
          />
        </I18nProvider>
        <div className="max-w-[260px]">
          <MultiSelect
            value={statusFilter}
            onChange={handleStatusFilterChange}
            options={statusOptions}
            panelHeaderTemplate={() => null}
            optionLabel=""
            placeholder="Durum Seçin"
            className="w-full md:w-20rem border-none rounded-xl bg-[rgb(244,244,245)] shadow-sm h-[3.5rem] items-center flex"
        
          />
        </div>
      </div>

      {loading ? (
        <p className="text-center">Loading...</p>
      ) : (
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-3xl">
          {filteredPersonnel?.map((person) => (
            <div key={person._id} className="flex items-center justify-between p-4 border-b last:border-b-0">
              <User
                avatarProps={{
                  size: "md",
                  src: `${process.env.NEXT_PUBLIC_UTILS_URL}/personel/image/?id=${person._id}` || undefined,
                }}
                description={person.title}
                name={`${person.name} ${person.lastname}`}
              />
              <div className="flex items-center space-x-2 flex-row-reverse gap-2">
                <Chip
                  color={
                    personnelStatus[person._id] === "Giriş"
                      ? "primary"
                      : personnelStatus[person._id] === "Çıkış"
                      ? "default"
                      : "danger"
                  }
                  className={`cursor-pointer ${
                    personnelStatus[person._id] === "Çıkış" ? "text-black" : "text-white"
                  } select-none font-black`}
                  size={"md"}
                  variant="shadow"
                  onClick={() => handleStatusChange(person._id)}
                >
                  {personnelStatus[person._id]}
                  {personnelStatus[person._id] !== "Gelmedi" && (
                    <span className="ml-2 text-xs">
                      {new Date().toLocaleString("tr-TR")}
                    </span>
                  )}
                </Chip>
                {personnelStatus[person._id] === "Çıkış" && (
                  <Chip
                    color="primary"
                    className="text-white select-none font-black"
                    size={"md"}
                    variant="shadow"
                  >
                    Giriş
                    <span className="ml-2 text-xs">
                      {new Date().toLocaleString("tr-TR")}
                    </span>
                  </Chip>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


// "use client";
// import React, { useState, useEffect } from "react";
// import { Chip, User, Input, DateRangePicker, Dropdown, DropdownTrigger, Button, DropdownMenu, DropdownItem, SharedSelection } from "@nextui-org/react";
// import {
//   now,
//   getLocalTimeZone,
//   ZonedDateTime,
//   parseDateTime,
// } from "@internationalized/date";
// import { I18nProvider } from "@react-aria/i18n";
// interface Personnel {
//   _id: string;
//   name: string;
//   lastname: string;
//   title: string;
//   address: string;
//   phone: string;
//   email: string;
//   gsm: string;
//   resume: string;
//   birth_date: string;
//   iso_phone: string;
//   iso_phone2: string;
//   file_path: string;
// }

// type Status = "Giriş" | "Çıkış" | "Gelmedi";

// export default function PersonnelAttendance() {
//   const [personnel, setPersonnel] = useState<Personnel[] | null>(null);
//   const [personnelStatus, setPersonnelStatus] = useState<{
//     [key: string]: Status;
//   }>({});
//   const [loading, setLoading] = useState(true);
//   const [searchTerm, setSearchTerm] = useState("");
  
//   const [statusFilter, setStatusFilter] = useState<Set<Status | "All">>(new Set(["All"]));
//   // import { useState } from 'react';
//   // import { now, getLocalTimeZone, ZonedDateTime, parseDateTime } from '@internationalized/date';

//   const [dateRange, setDateRange] = useState<{
//     start: ZonedDateTime;
//     end: ZonedDateTime;
//   }>(() => {
//     const today = now(getLocalTimeZone());
//     return {
//       start: new ZonedDateTime(
//         today.year,
//         today.month,
//         today.day,
//         "UTC",
//         0,
//         0,
//         0,
//         0,
//         0
//       ),
//       end: new ZonedDateTime(
//         today.year,
//         today.month,
//         today.day,
//         "UTC",
//         0,
//         23,
//         59,
//         59,
//         999
//       ),
//     };
//   });

//   const handleDateRangeChange = (range: {
//     start: ZonedDateTime;
//     end: ZonedDateTime;
//   }) => {
//     setDateRange(range);

//     // // Convert ZonedDateTime to JavaScript Date objects
//     // const startDate = range.start.toDate();
//     // const endDate = range.end.toDate();

//     // console.log("Start Date:", startDate);
//     // console.log("End Date:", endDate);

//     // // You can perform additional actions here, such as fetching data for the selected date range
//     // fetchPersonnelForDateRange(startDate, endDate);
//   };

//   useEffect(() => {
//     fetchPersonnelForDateRange(dateRange.start, dateRange.end);
//   }, [dateRange]);
//   const fetchPersonnelForDateRange = async (
//     start: ZonedDateTime,
//     end: ZonedDateTime
//   ) => {
//     setLoading(true);
//     try {
//       const startStr = start.toString();
//       const endStr = end.toString();
//       const response = await fetch(
//         `${process.env.NEXT_PUBLIC_UTILS_URL}/personel?start=${startStr}&end=${endStr}`
//       );
//       const data = await response.json();
//       if (response.ok) {
//         const initialStatus: { [key: string]: Status } = {};
//         data.forEach((person: Personnel) => {
//           initialStatus[person._id] = "Gelmedi";
//         });
//         setPersonnel(data);
//         setPersonnelStatus(initialStatus);
//       } else {
//         console.error("Failed to fetch personnel data for date range");
//       }
//     } catch (error) {
//       console.error("Error fetching personnel for date range:", error);
//     } finally {
//       setLoading(false);
//     }
//   };
//   // const fetchPersonnel = async () => {
//   //   setLoading(true);
//   //   try {

//   //     const response = await fetch(`${process.env.NEXT_PUBLIC_UTILS_URL}/personel`);
//   //     const data = await response.json();
//   //     if (response.ok) {
//   //       const initialStatus: { [key: string]: Status } = {};
//   //       data.forEach((person: Personnel) => {
//   //         initialStatus[person._id] = "Gelmedi";
//   //       });
//   //       setPersonnel(data);
//   //       setPersonnelStatus(initialStatus);
//   //     } else {
//   //       console.error("Failed to fetch personnel data");
//   //     }
//   //   } catch (error) {
//   //     console.error("Error fetching personnel:", error);
//   //   } finally {
//   //     setLoading(false);
//   //   }
//   // };

//   const handleStatusChange = (personId: string) => {
//     setPersonnelStatus((prevStatus) => {
//       const currentStatus = prevStatus[personId];
//       const newStatus =
//         currentStatus === "Giriş"
//           ? "Çıkış"
//           : currentStatus === "Çıkış"
//           ? "Gelmedi"
//           : "Giriş";
//       return { ...prevStatus, [personId]: newStatus };
//     });
//   };


//   const handleStatusFilterChange = (keys: SharedSelection) => {
//     const newStatusFilter = new Set(keys as Set<Status | "All">);
//     if (newStatusFilter.has("All")) {
//       setStatusFilter(new Set(["All"]));
//     } else {
//       setStatusFilter(newStatusFilter);
//     }
//   };

//   const filteredPersonnel = personnel?.filter((person) => {
//     const nameMatch = `${person.name} ${person.lastname}`
//       .toLowerCase()
//       .includes(searchTerm.toLowerCase());
//     const statusMatch = statusFilter.has("All") || statusFilter.has(personnelStatus[person._id]);
//     return nameMatch && statusMatch;
//   });
//   return (
//     <div className="container mx-auto px-4 py-8">
//       <h1 className="text-3xl font-bold mb-6 text-center nunito-700">
//         Personel Giriş Çıkışları
//       </h1>

//       <div className="mb-6 flex flex-col md:flex-row gap-4 justify-center items-center">
//         <Input
//           type="text"
//           placeholder="İsime göre arama..."
//           value={searchTerm}
//           onChange={(e) => setSearchTerm(e.target.value)}
//           className="max-w-[260px]"
//           size="md"
//         />
//         <I18nProvider locale="tr-TR">
//           <DateRangePicker
//             label="Event duration"
//             hideTimeZone
//             visibleMonths={2}
//             defaultValue={dateRange}
//             onChange={handleDateRangeChange}
//             hourCycle={24}
//             className="max-w-sm"
//             size="md"
//             pageBehavior="visible"
//           />
//         </I18nProvider>
//         <Dropdown>
//   <DropdownTrigger>
//     <Button variant="bordered">
//       {statusFilter.has("All") ? "Tüm Durumlar" : Array.from(statusFilter).join(", ")}
//     </Button>
//   </DropdownTrigger>
//   <DropdownMenu
//     closeOnSelect={false}
//     disallowEmptySelection
//     selectionMode="multiple"
//     selectedKeys={statusFilter}
//     onSelectionChange={handleStatusFilterChange}
//     aria-label="Status filter"
//   >
//     <DropdownItem key="All">Tüm Durumlar</DropdownItem>
//     <DropdownItem key="Giriş">Giriş</DropdownItem>
//     <DropdownItem key="Çıkış">Çıkış</DropdownItem>
//     <DropdownItem key="Gelmedi">Gelmedi</DropdownItem>
//   </DropdownMenu>
// </Dropdown>
//       </div>

//       {loading ? (
//         <p className="text-center">Loading...</p>
//       ) : (
//         <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl">
//           {filteredPersonnel?.map((person) => (
//             <div
//               key={person._id}
//               className="flex items-center justify-between p-4 border-b last:border-b-0"
//             >
//               <User
//                 avatarProps={{
//                   size: "md",
//                   src:
//                     `${process.env.NEXT_PUBLIC_UTILS_URL}/personel/image/?id=${person._id}` ||
//                     undefined,
//                 }}
//                 description={person.title}
//                 name={`${person.name} ${person.lastname}`}
//               />
//                <div className="flex items-center space-x-2 flex-row-reverse gap-2">
//                 <Chip
//                   color={
//                     personnelStatus[person._id] === "Giriş"
//                       ? "primary"
//                       : personnelStatus[person._id] === "Çıkış"
//                       ? "default"
//                       : "danger"
//                   }
//                   className={`cursor-pointer ${
//                     personnelStatus[person._id] === "Çıkış"
//                       ? "text-black"
//                       : "text-white"
//                   } select-none font-black`}
//                   size={"md"}
//                   variant="shadow"
//                   onClick={() => handleStatusChange(person._id)}
//                 >
//                   {personnelStatus[person._id]}
//                   {personnelStatus[person._id] !== "Gelmedi" && (
//                     <span className="ml-2 text-xs">
//                       {new Date().toLocaleString("tr-TR")}
//                     </span>
//                   )}
//                 </Chip>
//                 {personnelStatus[person._id] === "Çıkış" && (
//                   <Chip
//                     color="primary"
//                     className="text-white select-none font-black"
//                     size={"md"}
//                     variant="shadow"
//                   >
//                     Giriş
//                     <span className="ml-2 text-xs">
//                       {new Date().toLocaleString("tr-TR")}
//                     </span>
//                   </Chip>
//                 )}
//               </div>

//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }

// "use client";
// import React, { useState, useEffect } from "react";
// import { Chip, User, Input } from "@nextui-org/react";

// interface Personnel {
//   _id: string;
//   name: string;
//   lastname: string;
//   title: string;
//   address: string;
//   phone: string;
//   email: string;
//   gsm: string;
//   resume: string;
//   birth_date: string;
//   iso_phone: string;
//   iso_phone2: string;
//   file_path: string;
// }

// type Status = "Giriş" | "Çıkış" | "Gelmedi";

// export default function PersonnelAttendance() {
//   const [personnel, setPersonnel] = useState<Personnel[] | null>(null);
//   const [personnelStatus, setPersonnelStatus] = useState<{ [key: string]: Status }>({});
//   const [loading, setLoading] = useState(true);
//   const [searchTerm, setSearchTerm] = useState("");

//   useEffect(() => {
//     fetchPersonnel();
//   }, []);

//   const fetchPersonnel = async () => {
//     setLoading(true);
//     try {
//       const response = await fetch(`${process.env.NEXT_PUBLIC_UTILS_URL}/personel`);
//       const data = await response.json();
//       if (response.ok) {
//         const initialStatus: { [key: string]: Status } = {};
//         data.forEach((person: Personnel) => {
//           initialStatus[person._id] = "Gelmedi";
//         });
//         setPersonnel(data);
//         setPersonnelStatus(initialStatus);
//       } else {
//         console.error("Failed to fetch personnel data");
//       }
//     } catch (error) {
//       console.error("Error fetching personnel:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleStatusChange = (personId: string) => {
//     setPersonnelStatus((prevStatus) => {
//       const currentStatus = prevStatus[personId];
//       const newStatus = currentStatus === "Giriş" ? "Çıkış" : currentStatus === "Çıkış" ? "Gelmedi" : "Giriş";
//       return { ...prevStatus, [personId]: newStatus };
//     });
//   };

//   const filteredPersonnel = personnel?.filter((person) =>
//     `${person.name} ${person.lastname}`.toLowerCase().includes(searchTerm.toLowerCase())
//   );

//   return (
//     <div className="container mx-auto px-4 py-8">
//       <h1 className="text-3xl font-bold mb-6 text-center">Personnel Attendance</h1>

//       <div className="mb-6">
//         <Input
//           type="text"
//           placeholder="Search by name..."
//           value={searchTerm}
//           onChange={(e) => setSearchTerm(e.target.value)}
//           className="max-w-xs mx-auto"
//         />
//       </div>

//       {loading ? (
//         <p className="text-center">Loading...</p>
//       ) : (
//         <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl">
//           {filteredPersonnel?.map((person) => (
//             <div key={person._id} className="flex items-center justify-between p-4 border-b last:border-b-0">
//               <User
//                 avatarProps={{
//                   size: "md",
//                   src: `${process.env.NEXT_PUBLIC_UTILS_URL}/personel/image/?id=${person._id}` || undefined,
//                 }}
//                 description={person.title}
//                 name={`${person.name} ${person.lastname}`}
//               />
//               <Chip
//                 color={
//                   personnelStatus[person._id] === "Giriş"
//                     ? "success"
//                     : personnelStatus[person._id] === "Çıkış"
//                     ? "danger"
//                     : "default"
//                 }
//                 className={`cursor-pointer ${
//                   personnelStatus[person._id] === "Gelmedi" ? "text-black" : "text-white"
//                 } select-none`}
//                 size="sm"
//                 variant="shadow"
//                 onClick={() => handleStatusChange(person._id)}
//               >
//                 {personnelStatus[person._id]}
//               </Chip>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }

// "use client";
// import React, { useState, useEffect } from "react";
// import { Chip, User } from "@nextui-org/react";

// interface Personnel {
//   _id: string;                // Unique identifier
//   name: string;               // First name
//   lastname: string;           // Last name
//   title: string;              // Job title
//   address: string;            // Address
//   phone: string;              // Phone number
//   email: string;              // Email address
//   gsm: string;                // GSM number (mobile phone)
//   resume: string;             // Resume or other related info
//   birth_date: string;         // Birthdate (in YYYY-MM-DD format)
//   iso_phone: string;          // ISO phone number
//   iso_phone2: string;         // Second ISO phone number
//   file_path: string;          // File path to the personnel image
// }

// type Status = "Giriş" | "Çıkış" | "Gelmedi";

// export default function PersonnelAttendance() {
//   const [personnel, setPersonnel] = useState<Personnel[] | null>(null);
//   const [personnelStatus, setPersonnelStatus] = useState<{ [key: string]: Status }>({});
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     fetchPersonnel();
//   }, []);

//   const fetchPersonnel = async () => {
//     setLoading(true);
//     try {
//       const response = await fetch(`${process.env.NEXT_PUBLIC_UTILS_URL}/personel`);
//       const data = await response.json();
//       if (response.ok) {
//         const initialStatus: { [key: string]: Status } = {};
//         data.forEach((person: Personnel) => {
//           initialStatus[person._id] = "Gelmedi"; // Default status
//         });
//         setPersonnel(data);
//         setPersonnelStatus(initialStatus);
//       } else {
//         console.error("Failed to fetch personnel data");
//       }
//     } catch (error) {
//       console.error("Error fetching personnel:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleStatusChange = (personId: string) => {
//     setPersonnelStatus((prevStatus) => {
//       const currentStatus = prevStatus[personId];
//       const newStatus = currentStatus === "Giriş" ? "Çıkış" : currentStatus === "Çıkış" ? "Gelmedi" : "Giriş";
//       return { ...prevStatus, [personId]: newStatus };
//     });
//   };

//   return (
//     <div className="flex flex-col gap-1 w-full">
//       {loading ? (
//         <p>Loading...</p>
//       ) : (
//         <div className="max-w-sm flex flex-col justify-between gap-2">
//           {personnel?.map((person) => (
//             <div key={person._id} className="w-full flex justify-between gap-2">
//               <User
//                 avatarProps={{ size: "md", src: `${process.env.NEXT_PUBLIC_UTILS_URL}/personel/image/?id=${person._id}` || undefined }}
//                 description={person.title}
//                 name={`${person.name} ${person.lastname}`}
//               />
//               <div className="flex items-center">
//                 <Chip
//                   color={
//                     personnelStatus[person._id] === "Giriş"
//                       ? "success"
//                       : personnelStatus[person._id] === "Çıkış"
//                       ? "danger"
//                       : "default"
//                   }
//                   className={`cursor-pointer ${personnelStatus[person._id] === "Gelmedi" ? "text-black" : "text-white"} select-none`}
//                   size="sm"
//                   variant="shadow"
//                   onClick={() => handleStatusChange(person._id)}
//                 >
//                   {personnelStatus[person._id]}
//                 </Chip>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }

// "use client";
// import React, { useState, useEffect } from "react";
// import { Chip, User } from "@nextui-org/react";

// interface Personnel {
//     _id: string;                // Unique identifier
//     name: string;               // First name
//     lastname: string;           // Last name
//     title: string;              // Job title
//     address: string;            // Address
//     phone: string;              // Phone number
//     email: string;              // Email address
//     gsm: string;                // GSM number (mobile phone)
//     resume: string;             // Resume or other related info
//     birth_date: string;         // Birthdate (in YYYY-MM-DD format)
//     iso_phone: string;          // ISO phone number
//     iso_phone2: string;         // Second ISO phone number
//     file_path: string;          // File path to the personnel image
//   }

// export default function PersonnelAttendance() {
//   const [personnel, setPersonnel] = useState<Personnel[] | null>(null);
//   const [groupSelected, setGroupSelected] = useState<string[]>([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     fetchPersonnel();
//   }, []);

//   const fetchPersonnel = async () => {
//     setLoading(true);
//     try {
//       const response = await fetch(`${process.env.NEXT_PUBLIC_UTILS_URL}/personel`);
//       const data = await response.json();
//       if (response.ok) {
//         setPersonnel(data);
//       } else {
//         console.error("Failed to fetch personnel data");
//       }
//     } catch (error) {
//       console.error("Error fetching personnel:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="flex flex-col gap-1 w-full">
//       {loading ? (
//         <p>Loading...</p>
//       ) : (
//         <div className="max-w-sm flex flex-col justify-between gap-2">

//           {personnel?.map((person) => (
//              <div className="w-full flex justify-between gap-2">
//              <User
//                avatarProps={{ size: "md", src: undefined }}
//                description={
//                 person.title
//                }
//                name={person.name+ " " + person.lastname}

//              />
//              <div className="flex items-center">
//                <Chip color={groupSelected.includes(person._id) ? "success" : "danger"} className="text-white" size="sm" variant="shadow">
//                  {groupSelected.includes(person._id) ? "Giriş" : "Çıkış"}
//                </Chip>
//              </div>
//            </div>

//           ))}
//         </div>
//       )}

//     </div>
//   );
// }
