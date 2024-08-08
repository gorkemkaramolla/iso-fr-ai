'use client';
import React, { useEffect, useState, useRef, useMemo } from 'react';
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

import TextEditor from './editor';
import { Segment, Transcript } from '@/types';
interface Props {
  params: {
    id: string;
  };
}

const Transcription: React.FC<Props> = ({ params: { id } }) => {
  const [transcription, setTranscription] = useState<Transcript | null>(null);
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

  const generateRandomColor = (): string => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return `${color}33`;
  };

  const speakerColors = useMemo(() => {
    const colors: Record<string, string> = {};
    transcription?.segments.forEach((segment) => {
      if (!colors[segment.speaker]) {
        colors[segment.speaker] = generateRandomColor();
      }
    });
    return colors;
  }, [transcription?.segments]);

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
          (segment: Segment) => segment.segment_id
        );
        setSelectedSegments(allSegmentIds);

        const allSpeakers = [
          ...new Set(
            transcription.segments.map((segment: Segment) => segment.speaker)
          ),
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

  const handleSpeakerNameChange = async (
    segmentId: string,
    newName: string
  ) => {
    if (transcription) {
      const oldName = transcription.segments.find(
        (segment) => segment.segment_id === segmentId
      )?.speaker;

      setTranscription((prev) => {
        if (!prev) return prev;

        const updatedSegments = prev.segments.map((segment) =>
          segment.segment_id === segmentId
            ? { ...segment, speaker: newName }
            : segment
        );

        return { ...prev, segments: updatedSegments };
      });

      const api = createApi(process.env.NEXT_PUBLIC_DIARIZE_URL);
      try {
        await api.post(`/rename_segments/${id}`, {
          old_names: [oldName],
          new_name: newName,
          segment_ids: [segmentId],
        });
      } catch (error) {
        console.error('Failed to rename speaker:', error);
        toast.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to rename speaker',
          life: 3000,
        });
      }
    }
  };

  const handleTranscribedTextChange = async (
    segmentId: string,
    newText: string
  ) => {
    if (transcription) {
      const oldText = transcription.segments.find(
        (segment) => segment.segment_id === segmentId
      )?.transcribed_text;

      setTranscription((prev) => {
        if (!prev) return prev;

        const updatedSegments = prev.segments.map((segment) =>
          segment.segment_id === segmentId
            ? { ...segment, transcribed_text: newText }
            : segment
        );

        return { ...prev, segments: updatedSegments };
      });

      const api = createApi(process.env.NEXT_PUBLIC_DIARIZE_URL);
      try {
        await api.post(`/rename_transcribed_text/${id}`, {
          old_texts: [oldText],
          new_text: newText,
          segment_ids: [segmentId],
        });
      } catch (error) {
        console.error('Failed to rename transcribed text:', error);
        toast.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to rename transcribed text',
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
        await api.put(`/transcriptions/${id}`, {
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
          <div className='bg-white fixed bottom-0 left-1/2 transform -translate-x-1/2   px-8 w-full  z-50'>
            <button className='right-0 absolute '>
              <FaAngleDown />
            </button>
            <WaveAudio
              speakerColors={speakerColors}
              segments={transcription?.segments!}
              transcript_id={transcription?.transcription_id!}
            />
          </div>

          <div className='flex flex-col lg:flex-row min-h-screen'>
            <div className='p-4 lg:w-9/12'>
              <TextEditor
                speakerColors={speakerColors}
                currentTime={currentTime}
                transcription={transcription}
                editingRef={editingRef}
                handleEditName={handleEditName}
                handleTranscriptionDelete={handleTranscriptionDelete}
                handleGetExcel={handleGetExcel}
                handleGetJSON={handleGetJSON}
                handleDeleteSelected={() => {}}
                handleSelectSegment={handleSelectSegment}
                handleSelectAll={handleSelectAll}
                handleSelectSpeaker={handleSelectSpeaker}
                handleSpeakerNameChange={handleSpeakerNameChange}
                handleTranscribedTextChange={handleTranscribedTextChange}
                selectedSegments={selectedSegments}
                selectedSpeakers={selectedSpeakers}
                uniqueSpeakers={uniqueSpeakers}
                highlightedSegment={highlightedSegment}
                transcriptionRef={transcriptionRef}
                getSpeakerBorderColor={getSpeakerBorderColor}
                isEditing={isEditing}
                setIsEditing={setIsEditing}
              />
            </div>

            <div className='lg:w-3/12'>
              <TranscriptionHistory
                activePageId={transcription?.transcription_id}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transcription;
