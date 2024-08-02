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
import { AnimatePresence, motion } from 'framer-motion';
import { PanelBottomClose, Trash2, TrashIcon } from 'lucide-react';
import { FaAngleDown } from 'react-icons/fa';

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
  const [isPlayerVisible, setIsPlayerVisible] = useState(true);
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
          const speakers = Array.from(
            new Set(
              response.data.segments.map((segment: any) => segment.speaker)
            )
          );
          setUniqueSpeakers(speakers as string[]);
        }
      } catch (error) {
        console.error('Error fetching transcription:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTranscription();
  }, [id]);

  useEffect(() => {
    if (transcriptionRef.current) {
      const segmentElements =
        transcriptionRef.current.querySelectorAll<HTMLDivElement>('.segment');
      let segmentFound = false;

      segmentElements.forEach((element) => {
        const start = parseFloat(
          element.getAttribute('data-start-time') || '0'
        );
        const end = parseFloat(element.getAttribute('data-end-time') || '0');

        if (currentTime >= start && currentTime <= end) {
          setHighlightedSegment(element.getAttribute('data-segment-id'));

          const container = transcriptionRef.current;

          if (container) {
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

  const handleTranscriptionDelete = async () => {
    setShowTranscriptionDeleteDialog(true);
  };

  const confirmTranscriptionDelete = async () => {
    setShowTranscriptionDeleteDialog(false);

    try {
      const api = createApi(process.env.NEXT_PUBLIC_DIARIZE_URL);
      const response = await api.delete(`/transcriptions/${id}`);

      if (response.status === 200) {
        const data = response.data;
        if (data.status === 'success') {
          window.location.href = '/transcriptions';
        } else {
          toast.current?.show({
            severity: 'warn',
            summary: 'No changes made',
            detail: 'The transcription could not be deleted.',
            life: 3000,
          });
        }
      } else {
        toast.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to delete the transcription.',
          life: 3000,
        });
      }
    } catch (error) {
      console.error('Error deleting transcription:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: `An error occurred: ${(error as Error).message}`,
        life: 3000,
      });
    }
  };

  const handleSelectAll = () => {
    if (transcription) {
      if (selectedSegments.length === transcription.segments.length) {
        setSelectedSegments([]);
        setSelectedSpeakers([]);
      } else {
        const allSegmentIds = transcription.segments.map(
          (segment) => segment.segment_id
        );
        setSelectedSegments(allSegmentIds);

        const allSpeakers = [
          ...new Set(transcription.segments.map((segment) => segment.speaker)),
        ];
        setSelectedSpeakers(allSpeakers);
      }
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
            return segment && !segment.speaker.includes(speaker);
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
    if (selectedSegments.length === 1 && transcription) {
      const selectedSegment = transcription.segments.find(
        (segment) => segment.segment_id === selectedSegments[0]
      );
      if (selectedSegment) {
        setBulkNewName(selectedSegment.speaker);
      }
    } else {
      setBulkNewName('');
    }
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
    if (selectedSegments.length === 1 && transcription) {
      const selectedSegment = transcription.segments.find(
        (segment) => segment.segment_id === selectedSegments[0]
      );
      if (selectedSegment) {
        setBulkNewText(selectedSegment.transcribed_text);
      }
    } else {
      setBulkNewText('');
    }
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

  const handleEditName = async (newName: string) => {
    if (newName && transcription) {
      setTranscription((prev) => (prev ? { ...prev, name: newName } : null));
      const api = createApi(process.env.NEXT_PUBLIC_DIARIZE_URL);
      try {
        await api.post(`/rename_transcription/${id}`, {
          name: newName,
        });
      } catch (error) {
        console.error('Failed to rename transcription:', error);
        toast.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to rename transcription',
          life: 3000,
        });
      }
    }
  };

  const getSpeakerBorderColor = (speaker: string) => {
    const colors = [
      'border-pastel-red',
      'border-pastel-blue',
      'border-pastel-green',
      'border-pastel-yellow',
      'border-pastel-purple',
      'border-pastel-pink',
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
          <div className='bg-white fixed bottom-0 left-1/2 transform -translate-x-1/2 border py-2 px-8 w-full rounded shadow z-50'>
            <button className='right-0 absolute '>
              <FaAngleDown />
            </button>
            <WaveAudio transcript_id={transcription?.transcription_id!} />
          </div>

          <div className='flex flex-col lg:flex-row min-h-screen bg-gray-50'>
            <div className=' p-4  lg:w-9/12'>
              <div className='flex items-center justify-between w-full'>
                {isEditing ? (
                  <input
                    ref={editingRef}
                    type='text'
                    className='border-none p-4 w-96 bg-transparent text-xl font-extrabold'
                    defaultValue={transcription?.name}
                    onBlur={() => {
                      setIsEditing(false);
                      if (editingRef.current) {
                        handleEditName(editingRef.current.value);
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

                <button
                  onClick={handleTranscriptionDelete}
                  className='p-4 text-red-500 hover:text-red-700'
                >
                  <Trash2 />
                </button>
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
                className='bg-white rounded shadow p-4 overflow-y-scroll h-[600px]'
              >
                <div className='flex w-full justify-around py-2 '>
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
                    <div key={speaker} className=' flex gap-1'>
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
                <AnimatePresence>
                  {transcription?.segments.map((segment, index) => (
                    <motion.div
                      key={segment.segment_id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2, delay: index * 0.03 }}
                      className={`mb-2 rounded-md shadow-sm overflow-hidden cursor-pointer segment border-2 ${getSpeakerBorderColor(
                        segment.speaker
                      )}
                      ${
                        highlightedSegment === segment.segment_id ||
                        selectedSegments.includes(segment.segment_id)
                          ? 'ml-4'
                          : ''
                      }
                      ${
                        highlightedSegment === segment.segment_id
                          ? 'bg-yellow-200' // Highlighted color
                          : selectedSegments.includes(segment.segment_id)
                          ? 'bg-indigo-700 text-white' // Selected color
                          : 'bg-white'
                      }`}
                      data-segment-id={segment.segment_id}
                      data-start-time={segment.start_time}
                      data-end-time={segment.end_time}
                      onClick={() => handleSelectSegment(segment.segment_id)}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <motion.div
                        className={`w-full p-3 `}
                        animate={{
                          backgroundColor:
                            highlightedSegment === segment.segment_id
                              ? '#99F999' // yellow-200, consistent with above
                              : selectedSegments.includes(segment.segment_id)
                              ? '#4338CA' // indigo-700, consistent with above
                              : 'transparent',
                          color: selectedSegments.includes(segment.segment_id)
                            ? 'white'
                            : 'black',
                        }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className='flex justify-between items-center mb-1'>
                          <motion.span
                            className='font-semibold text-sm'
                            whileHover={{ scale: 1.03 }}
                          >
                            {segment.speaker}
                          </motion.span>
                          <motion.span
                            className={`text-xs px-1.5 py-0.5 rounded-full ${
                              highlightedSegment === segment.segment_id ||
                              selectedSegments.includes(segment.segment_id)
                                ? 'bg-opacity-20 bg-gray-800'
                                : 'bg-gray-100'
                            }`}
                            whileHover={{ backgroundColor: '#E5E7EB' }}
                          >
                            {segment.start_time.toFixed(2)}s -{' '}
                            {segment.end_time.toFixed(2)}s
                          </motion.span>
                        </div>
                        <motion.p
                          className='text-sm leading-relaxed'
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.05 }}
                        >
                          {segment.transcribed_text}
                        </motion.p>
                      </motion.div>
                    </motion.div>
                  ))}
                </AnimatePresence>
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
                {selectedSegments.length === 1 ? (
                  <InputText
                    value={bulkNewName}
                    onChange={(e) => setBulkNewName(e.target.value)}
                    className='p-2 text-sm'
                  />
                ) : (
                  <div className='p-2 text-sm'>
                    {selectedSegments.map((segmentId) => {
                      const segment = transcription?.segments.find(
                        (s) => s.segment_id === segmentId
                      );
                      return (
                        <div key={segmentId}>
                          <strong>{segment?.speaker}:</strong>{' '}
                          {segment?.transcribed_text}
                        </div>
                      );
                    })}
                  </div>
                )}
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
                {selectedSegments.length === 1 ? (
                  <InputTextarea
                    rows={5}
                    value={bulkNewText}
                    onChange={(e) => setBulkNewText(e.target.value)}
                    className='p-2 text-sm'
                  />
                ) : (
                  <div className='p-2 text-sm'>
                    {selectedSegments.map((segmentId) => {
                      const segment = transcription?.segments.find(
                        (s) => s.segment_id === segmentId
                      );
                      return (
                        <div key={segmentId}>
                          <strong>{segment?.speaker}:</strong>{' '}
                          {segment?.transcribed_text}
                        </div>
                      );
                    })}
                  </div>
                )}
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
