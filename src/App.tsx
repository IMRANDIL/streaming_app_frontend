import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "./App.css";

export default function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoID, setVideoID] = useState<string | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false); // State for the loading spinner
  const currentPlayingVideoRef = useRef<string | null>(null);
  const lastPlayedVideoRef = useRef<HTMLVideoElement | null>(null);
  const lastPlayedTimeRef = useRef<number>(0);
  const userSeeking = useRef<boolean>(false);

  const isVideoFileType = (filename: string) => {
    // Add more video formats here if needed
    const videoFormats = [".mp4", ".avi"];
    const ext = filename.slice(filename.lastIndexOf(".")).toLowerCase();
    return videoFormats.includes(ext);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.size <= 10 * 1024 * 1024) {
        // Check if the file size is within the allowed limit (10MB)
        if (isVideoFileType(file.name)) {
          setSelectedFile(file);
        } else {
          toast.warn("Invalid file type. Only mp4 and avi files are allowed.");
        }
      } else {
        toast.warn("File size exceeds the maximum limit of 10MB.");
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append("video", selectedFile);

    try {
      setLoading(true); // Show loading spinner while uploading
      const response = await axios.post(
        "http://localhost:8080/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // Video uploaded successfully, get the video ID from the response
      setVideoID(response?.data.id);

      // Fetch the updated list of videos
      fetchVideos();
    } catch (error) {
      toast.error(error?.response?.data);
    } finally {
      setLoading(false); // Hide loading spinner after upload completes
    }
  };

  const fetchVideos = async () => {
    try {
      const response = await axios.get("http://localhost:8080/videos");
      setVideos(response.data);
    } catch (error) {
      console.error("Error fetching videos:", error);
    }
  };

  const handleVideoPlay = (videoID: string) => {
    if (!userSeeking.current) {
      // Pause the previous video if it exists
      if (
        lastPlayedVideoRef.current &&
        lastPlayedVideoRef.current !== videoID
      ) {
        lastPlayedVideoRef.current.pause();
      }

      // Update the lastPlayedVideoRef with the currently playing video element
      lastPlayedVideoRef.current = document.getElementById(
        videoID
      ) as HTMLVideoElement;

      if (currentPlayingVideoRef.current === videoID) {
        // If it's the same video that was paused, seek to the last paused position
        lastPlayedVideoRef.current.currentTime = lastPlayedTimeRef.current;
      }

      // Update the current playing video and reset the last paused time
      currentPlayingVideoRef.current = videoID;
      lastPlayedTimeRef.current = 0;
      userSeeking.current = false;
    }
  };

  const handleVideoPause = () => {
    if (currentPlayingVideoRef.current) {
      // Store the current playback position when pausing the video
      lastPlayedTimeRef.current = lastPlayedVideoRef.current?.currentTime || 0;
    }
    currentPlayingVideoRef.current = null;
  };

  const handleSeeking = () => {
    userSeeking.current = true;
  };

  useEffect(() => {
    // Fetch the initial list of videos on component mount
    fetchVideos();
  }, []);

  return (
    <div>
      <div className="upload">
        {loading ? (
          // Show the loading spinner if the file is being uploaded
          <div className="spinner" />
        ) : (
          <img
            src="https://media.giphy.com/media/7T8uLiWEsnytWkQKvF/giphy.gif"
            alt="Video Upload GIF"
            draggable="false"
          />
        )}
        <label htmlFor="fileInput">Choose a video</label>
        <input type="file" id="fileInput" onChange={handleFileChange} />
        <button onClick={handleUpload}>Upload</button>
      </div>

      <div className="video-list">
        {videos.length > 0 ? (
          <>
            <h2>All Videos</h2>
            {videos.map((video) => (
              <div key={video.id} className="video-card">
                <p>Video ID: {video.id}</p>
                <p>Video Name: {video.name}</p>
                <video
                  key={video.id} // Add key attribute to the video element
                  id={video.id}
                  width="320"
                  height="240"
                  controls
                  onPlay={() => handleVideoPlay(video.id)}
                  onPause={handleVideoPause}
                  onSeeking={handleSeeking}
                >
                  <source src={video.url} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            ))}
          </>
        ) : (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              marginTop: "80px",
            }}
          >
            <img
              src="https://media.giphy.com/media/fipN1GOuDK8txSqay3/giphy.gif"
              alt="No Videos GIF"
              draggable="false"
              height={"100%"}
              width={"100%"}
            />
          </div>
        )}
      </div>
    </div>
  );
}

interface Video {
  id: string;
  name: string;
  url: string;
}
