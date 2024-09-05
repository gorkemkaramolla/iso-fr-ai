"use client";
import React, { useEffect, useState, useRef } from "react";
import { Toast } from "primereact/toast";
import { Download, Trash2, MoreVertical, ImageIcon } from "lucide-react";
import { Input } from "@nextui-org/react"; // Assuming Input is from PrimeReact

interface Video {
  filename: string;
  title: string;
}

const Home: React.FC = () => {
  const toast = useRef<Toast>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<Video[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    fetchVideos();
  }, []);

  useEffect(() => {
    if (videos.length > 0 && !selectedVideo) {
      setSelectedVideo(videos[0]);
    }
  }, [videos, selectedVideo]);

  useEffect(() => {
    if (searchQuery) {
      setFilteredVideos(
        videos.filter((video) =>
          video.title.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    } else {
      setFilteredVideos(videos);
    }
  }, [searchQuery, videos]);

  const fetchVideos = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_FLASK_URL}/videos`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch videos");
      }
      const data = await response.json();
      setVideos(data);
      setFilteredVideos(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    }
  };

  const downloadVideo = async (filename: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_FLASK_URL}/videos/${filename}`
      );
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      toast.current?.show({
        severity: "info",
        summary: "Info",
        detail: `${filename} downloaded`,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    }
  };

  const deleteVideo = async (filename: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_FLASK_URL}/videos/${filename}`,
        {
          method: "DELETE",
        }
      );
      if (!response.ok) {
        throw new Error("Failed to delete the video");
      }
      toast.current?.show({
        severity: "success",
        summary: "Success",
        detail: `${filename} deleted successfully.`,
      });
      fetchVideos();
      if (selectedVideo && selectedVideo.filename === filename) {
        setSelectedVideo(videos.find((v) => v.filename !== filename) || null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    }
  };

  if (!videos) {
    return <p className="text-center text-gray-600 mt-8">Loading...</p>;
  }

  if (videos.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 p-8 flex items-center justify-center">
        <p className="text-center text-gray-600 text-xl">No videos available</p>
      </div>
    );
  }

  return (
    <div className=" bg-gray-100">
      <Toast ref={toast} />
      <div className="container mx-auto px-4 pt-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 leading-10">
          Video Kayıtları
          <hr />
        </h1>

        {error && <p className="text-red-500 text-center mb-4">{error}</p>}

        <div className="flex flex-col xl:flex-row gap-6">
          {/* Featured Video */}
          {selectedVideo && (
            <div className="xl:w-3/4 flex flex-col">
              <div className="bg-white rounded-lg shadow-md overflow-hidden  flex flex-col">
                <div className="relative">
                  <video
                    src={`${process.env.NEXT_PUBLIC_FLASK_URL}/videos/${selectedVideo.filename}`}
                    className="w-full h-full object-fit"
                    controls
                  />
                </div>
                <div className="p-4">
                  <h2 className="text-xl font-semibold text-gray-800 mb-2">
                    {selectedVideo.title}
                  </h2>
                  <div className="flex items-center justify-between mt-4">
                    <button
                      onClick={() => downloadVideo(selectedVideo.filename)}
                      className="text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <Download className="w-6 h-6" />
                    </button>
                    <button
                      onClick={() => deleteVideo(selectedVideo.filename)}
                      className="text-red-600 hover:text-red-800 transition-colors"
                    >
                      <Trash2 className="w-6 h-6" />
                    </button>
                    <button className="text-gray-600 hover:text-gray-800 transition-colors">
                      <MoreVertical className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Video List */}
          <div className="xl:w-1/4 flex flex-col">
            <div className="bg-white rounded-lg shadow-md overflow-hidden flex-grow flex flex-col max-h-[80vh]">
              {/* <h3 className="text-lg font-semibold p-4 border-b">
                Diğer Videolar
              </h3> */}
              {/* Search Input */}
              <div className="p-4 border-b m-2">
                <Input
                  isClearable
                  onClear={() => setSearchQuery("")}
                  type="text"
                  className="grow"
                  placeholder="Video Ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="overflow-y-scroll flex-grow">
                {filteredVideos.map((video) => (
                  <div
                    key={video.filename}
                    className={`p-4 hover:bg-gray-100 cursor-pointer ${
                      selectedVideo?.filename === video.filename
                        ? "bg-gray-200"
                        : ""
                    }`}
                    onClick={() => setSelectedVideo(video)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="">
                        <ImageIcon className="w-10 h-10" />
                      </div>
                      <div className="">
                        <h4 className="text-sm font-semibold text-gray-800 mb-1 text-balance">
                          {video.title}
                        </h4>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
