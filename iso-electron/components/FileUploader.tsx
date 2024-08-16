'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Toast } from 'primereact/toast';
import {
  FileUpload,
  FileUploadHeaderTemplateOptions,
  FileUploadSelectEvent,
  ItemTemplateOptions,
} from 'primereact/fileupload';
import { ProgressBar } from 'primereact/progressbar';
import { Button } from 'primereact/button';
import { Tooltip } from 'primereact/tooltip';
import { Tag } from 'primereact/tag';
import Image from 'next/image';

interface ExtendedFile extends File {
  objectURL: string;
}

export default function FileUploader({
  onFileUpload,
}: {
  onFileUpload: (file: File) => void;
}) {
  const toast = useRef<Toast>(null);
  const [totalSize, setTotalSize] = useState(0);
  const fileUploadRef = useRef<FileUpload>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const onTemplateSelect = (e: FileUploadSelectEvent) => {
    let _totalSize = totalSize;
    let files = Array.from(e.files) as ExtendedFile[];

    for (let i = 0; i < files.length; i++) {
      files[i].objectURL = URL.createObjectURL(files[i]);
      _totalSize += files[i].size || 0;
      onFileUpload(files[i]);
    }

    setTotalSize(_totalSize);
  };

  const onTemplateRemove = (file: ExtendedFile, callback: Function) => {
    URL.revokeObjectURL(file.objectURL); // Revoke the object URL to free memory
    setTotalSize(totalSize - file.size);
    callback();
  };

  const onTemplateClear = () => {
    setTotalSize(0);
  };

  const headerTemplate = (options: FileUploadHeaderTemplateOptions) => {
    const { className, chooseButton, cancelButton } = options;
    const value = totalSize / 10000;
    const formattedValue =
      fileUploadRef && fileUploadRef.current
        ? fileUploadRef.current.formatSize(totalSize)
        : '0 B';

    return (
      <div
        className={className}
        style={{
          backgroundColor: 'transparent',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {chooseButton}
        {cancelButton}
        <div className='flex align-items-center gap-2 ml-auto'>
          <span style={{ fontSize: '0.8em' }}>{formattedValue} / 1 MB</span>
          <ProgressBar
            value={value}
            showValue={false}
            style={{ width: '8rem', height: '8px' }}
          ></ProgressBar>
        </div>
      </div>
    );
  };

  const itemTemplate = (inFile: object, props: ItemTemplateOptions) => {
    const file = inFile as ExtendedFile;
    return (
      <div className='flex '>
        <div
          className='flex align-items-center justify-end '
          style={{ width: '30%' }}
        >
          <Image
            alt={file.name}
            role='presentation'
            src={file.objectURL}
            height={60}
            width={60}
          />
          <span className='flex flex-column text-left ml-2'>
            {file.name}
            <small>{new Date().toLocaleDateString()}</small>
          </span>
        </div>
        <Tag
          value={props.formatSize}
          severity='warning'
          className='px-2 py-1 text-xs'
        />
        <Button
          type='button'
          icon='pi pi-times'
          className='p-button-outlined p-button-rounded p-button-danger ml-auto'
          style={{ width: '2rem', height: '2rem' }}
          onClick={() => onTemplateRemove(file, props.onRemove)}
        />
      </div>
    );
  };

  const emptyTemplate = () => {
    return (
      <div className='flex flex-col items-center'>
        <span
          style={{ fontSize: '1em', color: 'var(--text-color-secondary)' }}
          className='my-3'
        >
          Drag and Drop Image Here
        </span>
        <i
          className='pi pi-image mt-3 p-4'
          style={{
            fontSize: '4em',
            borderRadius: '50%',
            backgroundColor: 'var(--surface-b)',
            color: 'var(--surface-d)',
          }}
        ></i>
      </div>
    );
  };

  const chooseOptions = {
    icon: 'pi pi-fw pi-images',
    iconOnly: true,
    className: 'custom-choose-btn p-button-rounded p-button-outlined',
  };

  const cancelOptions = {
    icon: 'pi pi-fw pi-times',
    iconOnly: true,
    className:
      'custom-cancel-btn p-button-danger p-button-rounded p-button-outlined',
  };

  if (!isClient) {
    return null;
  }

  return (
    <div>
      <Toast ref={toast}></Toast>
      <Tooltip target='.custom-choose-btn' content='Choose' position='bottom' />
      <Tooltip target='.custom-cancel-btn' content='Clear' position='bottom' />

      <FileUpload
        ref={fileUploadRef}
        name='demo[]'
        url='/api/upload'
        multiple={false}
        accept='image/*'
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
      />
    </div>
  );
}
