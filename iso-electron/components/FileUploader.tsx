"use client";

import React, { useRef, useState, useEffect } from "react";
import { Toast } from "primereact/toast";
import {
  FileUpload,
  FileUploadHeaderTemplateOptions,
  FileUploadSelectEvent,
  ItemTemplateOptions,
} from "primereact/fileupload";
import { ProgressBar } from "primereact/progressbar";
import { Button } from "primereact/button";
import { Tooltip } from "primereact/tooltip";
import { Tag } from "primereact/tag";
import Image from "next/image";

interface ExtendedFile extends File {
  objectURL: string;
}

export default function FileUploader({
  onFileUpload,
}: {
  onFileUpload: (file: File | null) => void;
}) {
  const toast = useRef<Toast>(null);
  const [totalSize, setTotalSize] = useState(0);
  const fileUploadRef = useRef<FileUpload>(null);
  const [isClient, setIsClient] = useState(false);
  const [noFaceDetected, setNoFaceDetected] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  // const onTemplateSelect = (e: FileUploadSelectEvent) => {
  //   let _totalSize = totalSize;
  //   let files = Array.from(e.files) as ExtendedFile[];

  //   for (let i = 0; i < files.length; i++) {
  //     files[i].objectURL = URL.createObjectURL(files[i]);
  //     _totalSize += files[i].size || 0;
  //     onFileUpload(files[i]);
  //   }

  //   setTotalSize(_totalSize);
  // };

  const onTemplateSelect = async (e: FileUploadSelectEvent) => {
    let _totalSize = totalSize;
    let files = Array.from(e.files) as ExtendedFile[];
  
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append('image', file);
  
      try {
        const response = await fetch(process.env.NEXT_PUBLIC_FLASK_URL + '/detect_face', {
          method: 'POST',
          body: formData,
        });
  
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
  
        const data = await response.json();
  
        if (data.bboxes && data.bboxes.length > 0) {
          setNoFaceDetected(false);
          file.objectURL = URL.createObjectURL(file);
          _totalSize += file.size || 0;
          onFileUpload(file);
        } else {
          setNoFaceDetected(true);
          console.log('No face detected in the image:', file.name);
          // fileUploadRef.current?.clear();
          onFileUpload(null);
        }
      } catch (error) {
        setNoFaceDetected(true);
        console.error('Error detecting face:', error);
        // fileUploadRef.current?.clear();
        onFileUpload(null);
      }
    }
  
    setTotalSize(_totalSize);
  };

  // const onTemplateRemove = (file: ExtendedFile, callback: Function) => {
  //   URL.revokeObjectURL(file.objectURL); // Revoke the object URL to free memory
  //   setTotalSize(totalSize - file.size);
  //   callback();
  // };

  const onTemplateClear = () => {
    setTotalSize(0);
  };

  const headerTemplate = (options: FileUploadHeaderTemplateOptions) => {
    const { className, chooseButton, cancelButton } = options;
    const value = totalSize / 10000;
    const formattedValue =
      fileUploadRef && fileUploadRef.current
        ? fileUploadRef.current.formatSize(totalSize)
        : "0 B";

    return (
      <div
        // className={className + " [&_span>span]:w-2 [&_span]:w-6 [&_span]:h-4 [&_button]:w-6 [&_button]:h-4 [&_button>span]:w-2 "}
        className={className}

        // style={{
        //   backgroundColor: 'transparent',
        //   display: 'flex',
        //   alignItems: 'center',
        // }}
      >
        {chooseButton}
        {cancelButton}
        <div className="flex items-center gap-4 ml-auto">
          <div className="text-xs font-light text-nowrap nunito-400">
            {formattedValue} / 1 MB
          </div>
          {/* <ProgressBar
            value={value}
            showValue={false}
            style={{ width: '4rem', height: '0.8rem' }}
          ></ProgressBar> */}
        </div>
      </div>
    );
  };

  const itemTemplate = (inFile: object, props: ItemTemplateOptions) => {
    const file = inFile as ExtendedFile;
    return (
      <div className="flex flex-col items-center justify-end m-0 p-0 gap-2">
        {noFaceDetected && (
          <Tag
            value="No Face Detected"
            severity="danger"
            className="mt-2"
          ></Tag>
        )}
        <Image
          alt={file.name}
          role="presentation"
          src={file.objectURL}
          height={60}
          width={100}
          objectFit="cover"
          className={(noFaceDetected ? "border-2 border-red-500": "") +" w-full h-full rounded-lg"}
        />
        <span className="flex flex-row text-left ml-2">{file.name}</span>
      </div>
    );
  };

  const emptyTemplate = () => {
    return (
      <div className="flex flex-col items-center">
        <span
          style={{ fontSize: "1em", color: "var(--text-color-secondary)" }}
          // className="my-3"
        >
          Drag and Drop Image Here
        </span>
        <i
          className="pi pi-image mt-3 p-4"
          style={{
            fontSize: "2em",
            borderRadius: "50%",
            backgroundColor: "var(--surface-b)",
            color: "var(--surface-d)",
          }}
        ></i>
      </div>
    );
  };

  const chooseOptions = {
    icon: "pi pi-fw pi-images",
    iconOnly: true,
    className: "custom-choose-btn p-button-rounded p-button-outlined w-6 h-4",
  };

  const cancelOptions = {
    icon: "pi pi-fw pi-times",
    iconOnly: true,
    className:
      "custom-cancel-btn p-button-danger p-button-rounded p-button-outlined w-6 h-4",
  };

  if (!isClient) {
    return null;
  }

  return (
    <div>
      <Toast ref={toast}></Toast>
      <Tooltip target=".custom-choose-btn" content="Choose" position="bottom" />
      <Tooltip target=".custom-cancel-btn" content="Clear" position="bottom" />

      <FileUpload
        ref={fileUploadRef}
        name="demo[]"
        url="/api/upload"
        multiple={false}
        accept="image/*"
        maxFileSize={5000000}
        onSelect={onTemplateSelect}
        onError={onTemplateClear}
        onClear={onTemplateClear}
        headerTemplate={headerTemplate}
        itemTemplate={itemTemplate}
        emptyTemplate={emptyTemplate}
        chooseOptions={chooseOptions}
        cancelOptions={cancelOptions}
        customUpload
        progressBarTemplate={() => null}
      />
    </div>
  );
}
