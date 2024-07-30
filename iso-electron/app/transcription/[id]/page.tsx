'use client';

import React, { useEffect, useState, useRef } from 'react';
import TranscriptionHistory from '@/components/transcription/TranscriptionHistory';
import createApi from '@/utils/axios_instance';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { Toast } from 'primereact/toast';
import WaveAudio from '@/components/sound/wave-audio';
import useStore from '@/library/store';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import SkeletonLoader from '@/components/ui/transcript-skeleton';

interface Props {
  params: {
    id: string;
  };
}

const Transcription: React.FC<Props> = ({ params: { id } }) => {
  const [transcription, setTranscription] = useState<Transcript | null>(null);
  const [showBulkSpeakerModal, setShowBulkSpeakerModal] = useState(false);
  const [showBulkTextModal, setShowBulkTextModal] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmDialogAction, setConfirmDialogAction] = useState<string>('');
  const [showTranscriptionDeleteDialog, setShowTranscriptionDeleteDialog] =
    useState(false);
  const [bulkNewName, setBulkNewName] = useState('');
  const [bulkNewText, setBulkNewText] = useState('');
  const [selectedSegments, setSelectedSegments] = useState<string[]>([]);
  const [uniqueSpeakers, setUniqueSpeakers] = useState<string[]>([]);
  const [selectedSpeakers, setSelectedSpeakers] = useState<string[]>([]);
  const currentTime = useStore((state) => state.currentTime);
  const transcriptionRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [highlightedSegment, setHighlightedSegment] = useState<string | null>(
    null
  );
  const [isEditing, setIsEditing] = useState(false);
  const toast = useRef<Toast>(null);
  const editingRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchTranscription = async () => {
      setLoading(true);
      try {
        const api = createApi(process.env.NEXT_PUBLIC_DIARIZE_URL);
        const response = await api.get(`/transcriptions/${String(id)}`);
        if (response.data) {
          setTranscription(response.data);
          const speakers = [
            ...new Set(
              response.data.segments.map((segment: any) => segment.speaker)
            ),
          ];
          setUniqueSpeakers(speakers);
        }
      } catch (error) {
        console.error('Transkripsiyon alınırken hata oluştu:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTranscription();
  }, [id]);

  useEffect(() => {
    if (transcriptionRef.current) {
      const segmentElements =
        transcriptionRef.current.querySelectorAll('.segment');
      let segmentFound = false;
      segmentElements.forEach((element) => {
        const start = parseFloat(
          element.getAttribute('data-start-time') || '0'
        );
        const end = parseFloat(element.getAttribute('data-end-time') || '0');
        if (currentTime >= start && currentTime <= end) {
          setHighlightedSegment(element.getAttribute('data-segment-id'));
          const container = transcriptionRef.current;
          const elementTop = element.offsetTop;
          const containerTop = container.scrollTop;
          const containerHeight = container.clientHeight;
          const elementHeight = element.clientHeight;

          if (elementTop < containerTop) {
            container.scrollTo({ top: elementTop, behavior: 'smooth' });
          } else if (
            elementTop + elementHeight >
            containerTop + containerHeight
          ) {
            container.scrollTo({
              top: elementTop - containerHeight + elementHeight,
              behavior: 'smooth',
            });
          }

          segmentFound = true;
        }
      });
      if (!segmentFound) {
        setHighlightedSegment(null);
      }
    }
  }, [currentTime]);

  useEffect(() => {
    if (isEditing && editingRef.current) {
      editingRef.current.focus();
    }
  }, [isEditing]);

  const handleSelectSegment = (segmentId: string) => {
    setSelectedSegments((prevSelected) =>
      prevSelected.includes(segmentId)
        ? prevSelected.filter((id) => id !== segmentId)
        : [...prevSelected, segmentId]
    );
  };

  const handleTranscriptionDelete = () => {
    setShowTranscriptionDeleteDialog(true);
  };

  const confirmTranscriptionDelete = async () => {
    setShowTranscriptionDeleteDialog(false);
    const api = createApi(process.env.NEXT_PUBLIC_DIARIZE_URL);
    const response = await api.delete(`/transcriptions/${id}`);
    if (response.status === 200) {
      window.location.href = '/transcriptions';
    }
  };

  const handleSelectAll = () => {
    if (transcription) {
      setSelectedSegments(
        selectedSegments.length === transcription.segments.length
          ? []
          : transcription.segments.map((segment) => segment.segment_id)
      );
    }
  };

  const handleSelectSpeaker = (speaker: string) => {
    setSelectedSpeakers((prevSelected) => {
      if (prevSelected.includes(speaker)) {
        const newSelected = prevSelected.filter((s) => s !== speaker);
        setSelectedSegments((prevSegments) =>
          prevSegments.filter((segmentId) => {
            const segment = transcription?.segments.find(
              (s) => s.segment_id === segmentId
            );
            return segment && !newSelected.includes(segment.speaker);
          })
        );
        return newSelected;
      } else {
        const newSelected = [...prevSelected, speaker];
        const speakerSegments =
          transcription?.segments
            .filter((segment) => segment.speaker === speaker)
            .map((segment) => segment.segment_id) || [];
        setSelectedSegments((prevSegments) => [
          ...new Set([...prevSegments, ...speakerSegments]),
        ]);
        return newSelected;
      }
    });
  };

  const handleDeleteSelected = async () => {
    setConfirmDialogAction('delete');
    setShowConfirmDialog(true);
  };

  const confirmDeleteSelected = async () => {
    setShowConfirmDialog(false);
    if (transcription) {
      try {
        const updatedSegments = transcription.segments.filter(
          (segment) => !selectedSegments.includes(segment.segment_id)
        );
        setTranscription({ ...transcription, segments: updatedSegments });
        const api = createApi(process.env.NEXT_PUBLIC_DIARIZE_URL);
        await api.post(`/delete_segments/${id}`, {
          segment_ids: selectedSegments,
        });
        setSelectedSegments([]);
        setSelectedSpeakers([]);
        toast.current?.show({
          severity: 'success',
          summary: 'Başarılı',
          detail: 'Segmentler başarıyla silindi',
          life: 3000,
        });
      } catch (error) {
        console.error('Segmentler silinirken hata oluştu:', error);
        toast.current?.show({
          severity: 'error',
          summary: 'Hata',
          detail: 'Segmentler silinemedi',
          life: 3000,
        });
      }
    }
  };

  const handleRenameSpeakers = () => {
    setConfirmDialogAction('renameSpeakers');
    setShowConfirmDialog(true);
  };

  const confirmRenameSpeakers = async () => {
    setShowConfirmDialog(false);
    setShowBulkSpeakerModal(true);
  };

  const renameSelectedSpeakerNames = async () => {
    setShowBulkSpeakerModal(false);
    if (transcription) {
      try {
        const oldNames = transcription.segments
          .filter((segment) => selectedSegments.includes(segment.segment_id))
          .map((segment) => segment.speaker);
        const updatedSegments = transcription.segments.map((segment) =>
          selectedSegments.includes(segment.segment_id)
            ? { ...segment, speaker: bulkNewName }
            : segment
        );
        setTranscription({ ...transcription, segments: updatedSegments });
        const api = createApi(process.env.NEXT_PUBLIC_DIARIZE_URL);
        await api.post(`/rename_segments/${id}`, {
          old_names: oldNames,
          new_name: bulkNewName,
          segment_ids: selectedSegments,
        });
        setSelectedSegments([]);
        setSelectedSpeakers([]);
        const updatedSpeakers = [
          ...new Set(updatedSegments.map((segment) => segment.speaker)),
        ];
        setUniqueSpeakers(updatedSpeakers);
        toast.current?.show({
          severity: 'success',
          summary: 'Başarılı',
          detail: 'Konuşmacılar başarıyla yeniden adlandırıldı',
          life: 3000,
        });
      } catch (error) {
        console.error(
          'Konuşmacılar yeniden adlandırılırken hata oluştu:',
          error
        );
        toast.current?.show({
          severity: 'error',
          summary: 'Hata',
          detail: 'Konuşmacılar yeniden adlandırılamadı',
          life: 3000,
        });
      }
    }
  };

  const handleRenameTexts = () => {
    setConfirmDialogAction('renameTexts');
    setShowConfirmDialog(true);
  };

  const confirmRenameTexts = async () => {
    setShowConfirmDialog(false);
    setShowBulkTextModal(true);
  };

  const renameSelectedTexts = async () => {
    setShowBulkTextModal(false);
    if (transcription) {
      try {
        const oldTexts = transcription.segments
          .filter((segment) => selectedSegments.includes(segment.segment_id))
          .map((segment) => segment.transcribed_text);
        const updatedSegments = transcription.segments.map((segment) =>
          selectedSegments.includes(segment.segment_id)
            ? { ...segment, transcribed_text: bulkNewText }
            : segment
        );
        setTranscription({ ...transcription, segments: updatedSegments });
        const api = createApi(process.env.NEXT_PUBLIC_DIARIZE_URL);
        await api.post(`/rename_transcribed_text/${id}`, {
          old_texts: oldTexts,
          new_text: bulkNewText,
          segment_ids: selectedSegments,
        });
        setSelectedSegments([]);
        setSelectedSpeakers([]);
        toast.current?.show({
          severity: 'success',
          summary: 'Başarılı',
          detail: 'Metinler başarıyla yeniden adlandırıldı',
          life: 3000,
        });
      } catch (error) {
        console.error('Metinler yeniden adlandırılırken hata oluştu:', error);
        toast.current?.show({
          severity: 'error',
          summary: 'Hata',
          detail: 'Metinler yeniden adlandırılamadı',
          life: 3000,
        });
      }
    }
  };

  const getSpeakerBackgroundColor = (speaker: string) => {
    const colors = [
      'bg-gray-200',
      'bg-stone-100',
      'bg-blue-100',
      'bg-indigo-50',
      'bg-slate-100',
      'bg-amber-50',
    ];
    const hash = speaker
      .split('')
      .reduce((acc, char) => char.charCodeAt(0) + acc, 0);
    return colors[hash % colors.length];
  };

  const handleGetExcel = () => {
    if (transcription) {
      const worksheet = XLSX.utils.json_to_sheet(transcription.segments);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Transkripsiyon');
      const excelBuffer = XLSX.write(workbook, {
        bookType: 'xlsx',
        type: 'array',
      });
      const data = new Blob([excelBuffer], {
        type: 'application/octet-stream',
      });
      saveAs(data, `transcription_${id}.xlsx`);
    }
  };

  const handleGetJSON = () => {
    if (transcription) {
      const json = JSON.stringify(transcription.segments, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      saveAs(blob, `transcription_${id}.json`);
    }
  };

  return (
    <div className=''>
      <Toast ref={toast} />
      {loading ? (
        <SkeletonLoader />
      ) : (
        <div className=''>
          <div className='flex flex-col lg:flex-row min-h-screen bg-gray-50'>
            <div className=' p-4  lg:w-9/12'>
              <div className='flex items-center justify-between w-full'>
                {isEditing ? (
                  <input
                    ref={editingRef}
                    type='text'
                    className='border-none p-4 w-96 bg-transparent text-xl  font-extrabold'
                    defaultValue={transcription?.name}
                    onBlur={() => {
                      setIsEditing(false);
                      if (editingRef.current) {
                        const newName = editingRef.current.value;
                        setTranscription((prev) =>
                          prev ? { ...prev, name: newName } : null
                        );
                        const api = createApi(
                          process.env.NEXT_PUBLIC_DIARIZE_URL
                        );
                        api.post(`/rename_transcription/${id}`, {
                          name: newName,
                        });
                      }
                    }}
                  />
                ) : (
                  <h1
                    onDoubleClick={() => setIsEditing(true)}
                    className='text-xl font-extrabold p-4 w-full'
                  >
                    {transcription?.name}
                  </h1>
                )}
                <button onClick={handleTranscriptionDelete} className='p-4'>
                  Delete
                </button>
              </div>
              <div className='bg-white rounded shadow p-4 mb-4'>
                <WaveAudio transcript_id={transcription?.transcription_id!} />
              </div>

              <div className='flex justify-end space-x-2 mb-4'>
                <Button
                  label='Excel Olarak İndir'
                  icon='pi pi-file-excel'
                  className='p-button-sm'
                  onClick={handleGetExcel}
                />
                <Button
                  label='JSON Olarak İndir'
                  icon='pi pi-file'
                  className='p-button-sm'
                  onClick={handleGetJSON}
                />
              </div>

              <div className='flex justify-between mb-4'>
                <div className='flex flex-col '>
                  <div>
                    <Checkbox
                      checked={
                        selectedSegments.length ===
                        transcription?.segments.length
                      }
                      onChange={handleSelectAll}
                      name='selectall'
                    />
                    <label htmlFor='selectall' className='ml-2'>
                      Hepsini Seç
                    </label>
                  </div>
                  {uniqueSpeakers.map((speaker) => (
                    <div key={speaker} className=''>
                      <Checkbox
                        checked={selectedSpeakers.includes(speaker)}
                        onChange={() => handleSelectSpeaker(speaker)}
                        name={`select-${speaker}`}
                      />
                      <label htmlFor={`select-${speaker}`} className='ml-2'>
                        {speaker}
                      </label>
                    </div>
                  ))}
                </div>
                <div className='flex space-x-2'>
                  <Button
                    label='Seçilenleri Sil'
                    className='p-button-sm p-button-danger'
                    onClick={handleDeleteSelected}
                    disabled={selectedSegments.length === 0}
                  />
                  <Button
                    label='Seçilenlerin Konuşmacı Adını Değiştir'
                    className='p-button-sm'
                    onClick={handleRenameSpeakers}
                    disabled={selectedSegments.length === 0}
                  />
                  <Button
                    label='Seçilenlerin Metnini Değiştir'
                    className='p-button-sm'
                    onClick={handleRenameTexts}
                    disabled={selectedSegments.length === 0}
                  />
                </div>
              </div>
              <div
                ref={transcriptionRef}
                className='bg-white rounded shadow p-4 overflow-y-scroll h-[500px]'
              >
                {transcription?.segments.map((segment) => (
                  <div
                    key={segment.segment_id}
                    className={`mb-2 p-2 rounded segment cursor-pointer ${
                      highlightedSegment === segment.segment_id
                        ? 'bg-yellow-200'
                        : selectedSegments.includes(segment.segment_id)
                        ? 'bg-indigo-700 text-white'
                        : getSpeakerBackgroundColor(segment.speaker)
                    }`}
                    data-segment-id={segment.segment_id}
                    data-start-time={segment.start_time}
                    data-end-time={segment.end_time}
                    onClick={() => handleSelectSegment(segment.segment_id)}
                  >
                    <div className='w-full'>
                      <div className='flex justify-between items-center text-sm  mb-1'>
                        <span className='font-semibold'>{segment.speaker}</span>
                        <span>
                          {segment.start_time.toFixed(2)}s -{' '}
                          {segment.end_time.toFixed(2)}s
                        </span>
                      </div>
                      <p className='text-sm '>{segment.transcribed_text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className='lg:w-3/12'>
              <TranscriptionHistory
                activePageId={transcription?.transcription_id}
              />
            </div>

            <Dialog
              header='İşlemi Onayla'
              visible={showConfirmDialog}
              onHide={() => setShowConfirmDialog(false)}
              footer={
                <div>
                  <Button
                    label='Hayır'
                    icon='pi pi-times'
                    onClick={() => setShowConfirmDialog(false)}
                    className='p-button-text'
                  />
                  <Button
                    label='Evet'
                    icon='pi pi-check'
                    onClick={() => {
                      if (confirmDialogAction === 'delete')
                        confirmDeleteSelected();
                      else if (confirmDialogAction === 'renameSpeakers')
                        confirmRenameSpeakers();
                      else if (confirmDialogAction === 'renameTexts')
                        confirmRenameTexts();
                    }}
                    autoFocus
                  />
                </div>
              }
            >
              <p>
                Seçilen{' '}
                {confirmDialogAction === 'delete'
                  ? 'segmentleri silmek'
                  : 'isimleri veya metinleri değiştirmek'}{' '}
                istediğinize emin misiniz?
              </p>
            </Dialog>

            <Dialog
              header='Seçilen Konuşmacı İsimleri'
              visible={showBulkSpeakerModal}
              onHide={() => setShowBulkSpeakerModal(false)}
              className='w-80'
            >
              <div className='flex flex-col gap-4'>
                <InputText
                  value={bulkNewName}
                  onChange={(e) => setBulkNewName(e.target.value)}
                  className='p-2 text-sm'
                />
                <div className='flex justify-end space-x-2'>
                  <Button
                    label='İptal'
                    className='p-button-text p-button-sm'
                    onClick={() => setShowBulkSpeakerModal(false)}
                  />
                  <Button
                    label='Kaydet'
                    icon='pi pi-check'
                    className='p-button-sm'
                    onClick={renameSelectedSpeakerNames}
                  />
                </div>
              </div>
            </Dialog>

            <Dialog
              header='Seçilen Metin'
              visible={showBulkTextModal}
              onHide={() => setShowBulkTextModal(false)}
              className='w-80'
            >
              <div className='flex flex-col gap-4'>
                <InputTextarea
                  rows={5}
                  value={bulkNewText}
                  onChange={(e) => setBulkNewText(e.target.value)}
                  className='p-2 text-sm'
                />
                <div className='flex justify-end space-x-2'>
                  <Button
                    label='İptal'
                    className='p-button-text p-button-sm'
                    onClick={() => setShowBulkTextModal(false)}
                  />
                  <Button
                    label='Kaydet'
                    icon='pi pi-check'
                    className='p-button-sm'
                    onClick={renameSelectedTexts}
                  />
                </div>
              </div>
            </Dialog>

            <Dialog
              header='Transkripsiyonu Sil'
              visible={showTranscriptionDeleteDialog}
              onHide={() => setShowTranscriptionDeleteDialog(false)}
              footer={
                <div>
                  <Button
                    label='Hayır'
                    icon='pi pi-times'
                    onClick={() => setShowTranscriptionDeleteDialog(false)}
                    className='p-button-text'
                  />
                  <Button
                    label='Evet'
                    icon='pi pi-check'
                    onClick={confirmTranscriptionDelete}
                    autoFocus
                  />
                </div>
              }
            >
              <p>Bu transkripsiyonu silmek istediğinizden emin misiniz?</p>
            </Dialog>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transcription;
