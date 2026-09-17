"use client";

import { useRef, useState, useEffect, useCallback, type MutableRefObject } from "react";
import Hls from "hls.js";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  SkipBack,
  SkipForward,
  Settings,
  Subtitles,
  PictureInPicture2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface CaptionTrack {
  lang: string;
  label: string;
  src: string;
}

interface VideoPlayerProps {
  src: string;
  poster?: string;
  captions?: CaptionTrack[];
  onProgress?: (progress: number) => void;
  onComplete?: () => void;
  /**
   * Mỗi tick `timeupdate`. Truyền kèm `playbackRate` và `duration` để hook
   * heartbeat chống tua (contract §1) tự đánh giá mẫu này có nối tiếp khoảng
   * đang phát hay không — player không phán xét thay.
   */
  onTimeUpdate?: (currentTime: number, playbackRate: number, durationSeconds: number) => void;
  /** Bắt đầu phát — hook heartbeat dùng để biết phiên xem thật sự bắt đầu. */
  onPlay?: () => void;
  /** `?` — mở bảng phím tắt (contract §7). */
  onToggleShortcutsHelp?: () => void;
  /** Tạm dừng — hook heartbeat gửi ngay thay vì đợi nhịp 10 giây. */
  onPause?: () => void;
  /** Đổi tốc độ phát — heartbeat cần biết để không tính đoạn phát nhanh là tua. */
  onRateChange?: (rate: number) => void;
  /**
   * Điều khiển player từ ngoài (panel ghi chú/transcript cần seek tới mốc).
   * Hook này KHÔNG bắt buộc: player vẫn chạy đủ nếu không truyền.
   */
  controlRef?: MutableRefObject<VideoPlayerHandle | null>;
  initialTime?: number;
  className?: string;
}

/** Lệnh điều khiển từ ngoài — chỉ những gì panel cần, không mở toàn bộ player. */
export interface VideoPlayerHandle {
  /** Nhảy tới giây cụ thể (đã clamp theo thời lượng). */
  seekTo: (seconds: number) => void;
  /** Phát nếu đang dừng, dừng nếu đang phát. */
  togglePlay: () => void;
}

const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
const QUALITY_OPTIONS = ["Auto", "1080p", "720p", "480p", "360p"];

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function VideoPlayer({
  src,
  poster,
  captions = [],
  onProgress,
  onComplete,
  onTimeUpdate,
  onPlay,
  onPause,
  onRateChange,
  onToggleShortcutsHelp,
  controlRef,
  initialTime = 0,
  className,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const progressSaveInterval = useRef<NodeJS.Timeout | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [quality, setQuality] = useState("Auto");
  const [activeCaption, setActiveCaption] = useState<string | null>(null);
  const [buffered, setBuffered] = useState(0);

  // Dropdown states
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [showCaptionMenu, setShowCaptionMenu] = useState(false);

  // Initialize HLS or native video
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (src.includes(".m3u8") && Hls.isSupported()) {
      const hls = new Hls({
        startPosition: initialTime,
      });
      hls.loadSource(src);
      hls.attachMedia(video);
      hlsRef.current = hls;

      return () => {
        hls.destroy();
      };
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Native HLS support (Safari)
      video.src = src;
      if (initialTime > 0) video.currentTime = initialTime;
    } else {
      // Regular video
      video.src = src;
      if (initialTime > 0) video.currentTime = initialTime;
    }
  }, [src, initialTime]);

  // Progress save interval (every 10s)
  useEffect(() => {
    if (isPlaying && onProgress) {
      progressSaveInterval.current = setInterval(() => {
        if (videoRef.current && duration > 0) {
          const progress = (videoRef.current.currentTime / duration) * 100;
          onProgress(progress);
        }
      }, 10000);
    }

    return () => {
      if (progressSaveInterval.current) {
        clearInterval(progressSaveInterval.current);
      }
    };
  }, [isPlaying, duration, onProgress]);

  // Auto-hide controls
  useEffect(() => {
    let hideTimeout: NodeJS.Timeout;

    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(hideTimeout);
      if (isPlaying) {
        hideTimeout = setTimeout(() => setShowControls(false), 3000);
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("mousemove", handleMouseMove);
      container.addEventListener("mouseleave", () => {
        if (isPlaying) setShowControls(false);
      });
    }

    return () => {
      clearTimeout(hideTimeout);
      if (container) {
        container.removeEventListener("mousemove", handleMouseMove);
      }
    };
  }, [isPlaying]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, []);

  const skipBack = useCallback(() => {
    const video = videoRef.current;
    if (video) video.currentTime = Math.max(0, video.currentTime - 10);
  }, []);

  /**
   * Nhảy tới giây cụ thể theo yêu cầu từ panel ngoài (ghi chú/transcript).
   * Clamp theo thời lượng thật để một mốc ghi chú cũ hơn bản video đang phát
   * không đẩy player ra ngoài cuối file.
   */
  const seekTo = useCallback(
    (seconds: number) => {
      const video = videoRef.current;
      if (!video) return;
      const max = video.duration || duration || seconds;
      video.currentTime = Math.min(Math.max(0, seconds), max);
      setCurrentTime(video.currentTime);
    },
    [duration]
  );

  /**
   * Cầu điều khiển cho panel ngoài. Gán bằng effect (không gán lúc render) để
   * không mutate ref của người khác trong thân render — React StrictMode gọi
   * render hai lần và sẽ thấy ref bị ghi khi chưa commit.
   */
  useEffect(() => {
    if (!controlRef) return;
    controlRef.current = { seekTo, togglePlay };
    return () => {
      controlRef.current = null;
    };
  }, [controlRef, seekTo, togglePlay]);

  const skipForward = useCallback(() => {
    const video = videoRef.current;
    if (video)
      video.currentTime = Math.min(duration, video.currentTime + 10);
  }, [duration]);

  const changeVolume = useCallback((newVolume: number) => {
    const video = videoRef.current;
    if (video) {
      video.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  }, []);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      video.muted = !video.muted;
      setIsMuted(video.muted);
    }
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const container = containerRef.current;
    if (!container) return;

    if (document.fullscreenElement) {
      await document.exitFullscreen();
      setIsFullscreen(false);
    } else {
      await container.requestFullscreen();
      setIsFullscreen(true);
    }
  }, []);

  const togglePiP = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await video.requestPictureInPicture();
      }
    } catch (error) {
      console.error("PiP not supported:", error);
    }
  }, []);

  const handleSeek = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const video = videoRef.current;
      const rect = e.currentTarget.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      if (video) video.currentTime = percent * duration;
    },
    [duration]
  );

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      setCurrentTime(video.currentTime);
      onTimeUpdate?.(video.currentTime, video.playbackRate || 1, video.duration || duration);

      // Update buffered
      if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        setBuffered((bufferedEnd / duration) * 100);
      }
    }
  }, [duration, onTimeUpdate]);

  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      setDuration(video.duration);
      if (initialTime > 0 && video.currentTime === 0) {
        video.currentTime = initialTime;
      }
    }
  }, [initialTime]);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    onComplete?.();
  }, [onComplete]);

  const changePlaybackRate = useCallback((rate: number) => {
    const video = videoRef.current;
    if (video) {
      video.playbackRate = rate;
      setPlaybackRate(rate);
      onRateChange?.(rate);
    }
    setShowSpeedMenu(false);
  }, [onRateChange]);

  /**
   * Nhảy tương đối theo số giây (âm = lùi). Dùng cho ← → (5s) và J L (10s) —
   * contract §7. Tua ở đây KHÔNG được tính là đã học: hook heartbeat nhận ra
   * bước nhảy lớn hơn thời gian thực trôi qua nên mở khoảng mới (contract §1).
   */
  const seekBy = useCallback(
    (offsetSeconds: number) => {
      const video = videoRef.current;
      if (!video) return;
      video.currentTime = Math.min(
        Math.max(0, video.currentTime + offsetSeconds),
        video.duration || video.currentTime + offsetSeconds
      );
    },
    []
  );

  /** Bước tới tốc độ kế tiếp trong PLAYBACK_RATES (contract §7: `,` và `.`). */
  const stepPlaybackRate = useCallback(
    (direction: 1 | -1) => {
      const index = PLAYBACK_RATES.indexOf(playbackRate);
      const next = index >= 0 ? index + direction : 0;
      changePlaybackRate(PLAYBACK_RATES[Math.min(Math.max(next, 0), PLAYBACK_RATES.length - 1)]);
    },
    [playbackRate, changePlaybackRate]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      switch (e.code) {
        case "Space":
        case "KeyK":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowLeft":
          e.preventDefault();
          skipBack();
          break;
        case "ArrowRight":
          e.preventDefault();
          skipForward();
          break;
        case "KeyJ":
          // Contract §7: J lùi 10 giây.
          e.preventDefault();
          seekBy(-10);
          break;
        case "KeyL":
          // Contract §7: L tới 10 giây.
          e.preventDefault();
          seekBy(10);
          break;
        case "Comma":
          // Contract §7: `,` giảm tốc độ phát một bậc.
          e.preventDefault();
          stepPlaybackRate(-1);
          break;
        case "Period":
          // Contract §7: `.` tăng tốc độ phát một bậc.
          e.preventDefault();
          stepPlaybackRate(1);
          break;
        case "ArrowUp":
          e.preventDefault();
          changeVolume(Math.min(1, volume + 0.1));
          break;
        case "ArrowDown":
          e.preventDefault();
          changeVolume(Math.max(0, volume - 0.1));
          break;
        case "KeyM":
          toggleMute();
          break;
        case "KeyF":
          toggleFullscreen();
          break;
        case "Slash":
          // Contract §7: `?` (Shift + /) mở bảng phím tắt. Trên layout US `?` là
          // Slash+Shift; chấp nhận cả khi không giữ Shift để bàn phím khác cũng mở được.
          if (e.shiftKey || e.key === "?") {
            e.preventDefault();
            onToggleShortcutsHelp?.();
          }
          break;
        case "KeyC":
          // Toggle captions
          if (captions.length > 0) {
            setActiveCaption(activeCaption ? null : captions[0].lang);
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    volume,
    activeCaption,
    captions,
    togglePlay,
    skipBack,
    skipForward,
    seekBy,
    stepPlaybackRate,
    changeVolume,
    toggleMute,
    toggleFullscreen,
    onToggleShortcutsHelp,
  ]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative aspect-video bg-black rounded-lg overflow-hidden group",
        className
      )}
    >
      <video
        ref={videoRef}
        poster={poster}
        className="w-full h-full"
        onClick={togglePlay}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onPlay={() => {
          setIsPlaying(true);
          onPlay?.();
        }}
        onPause={() => {
          setIsPlaying(false);
          onPause?.();
        }}
        onRateChange={(e) => onRateChange?.(e.currentTarget.playbackRate)}
        playsInline
      >
        {captions.map((track) => (
          <track
            key={track.lang}
            kind="captions"
            src={track.src}
            srcLang={track.lang}
            label={track.label}
          />
        ))}
      </video>

      {/* Controls overlay */}
      <div
        className={cn(
          "absolute inset-0 bg-black/60",
          "transition-opacity duration-300",
          showControls || !isPlaying ? "opacity-100" : "opacity-0"
        )}
      >
        {/* Center play button */}
        <button
          onClick={togglePlay}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          aria-label={isPlaying ? "Tạm dừng" : "Phát"}
        >
          <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors shadow-lg">
            {isPlaying ? (
              <Pause className="h-8 w-8 text-black" />
            ) : (
              <Play className="h-8 w-8 text-black ml-1" />
            )}
          </div>
        </button>

        {/* Bottom controls */}
        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-3">
          {/* Progress bar */}
          <div
            className="h-1 bg-white/30 rounded-full cursor-pointer group/progress"
            onClick={handleSeek}
          >
            {/* Buffered */}
            <div
              className="absolute h-1 bg-white/50 rounded-full"
              style={{ width: `${buffered}%` }}
            />
            {/* Progress */}
            <div
              className="h-full bg-primary-500 rounded-full relative"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow opacity-0 group-hover/progress:opacity-100 transition-opacity" />
            </div>
          </div>

          {/* Control buttons */}
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlay}
                className="hover:bg-white/20 p-1.5 rounded"
                aria-label={isPlaying ? "Tạm dừng" : "Phát"}
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5" />
                )}
              </button>

              <button
                onClick={skipBack}
                className="hover:bg-white/20 p-1.5 rounded"
                aria-label="Tua lùi 10 giây"
              >
                <SkipBack className="h-5 w-5" />
              </button>

              <button
                onClick={skipForward}
                className="hover:bg-white/20 p-1.5 rounded"
                aria-label="Tua tới 10 giây"
              >
                <SkipForward className="h-5 w-5" />
              </button>

              {/* Volume */}
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleMute}
                  className="hover:bg-white/20 p-1.5 rounded"
                  aria-label={isMuted ? "Bật âm thanh" : "Tắt âm thanh"}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="h-5 w-5" />
                  ) : (
                    <Volume2 className="h-5 w-5" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => changeVolume(parseFloat(e.target.value))}
                  className="w-20 h-1 accent-white cursor-pointer"
                  aria-label="Âm lượng"
                />
              </div>

              <span className="text-sm tabular-nums">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Captions */}
              {captions.length > 0 && (
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowCaptionMenu(!showCaptionMenu);
                      setShowSpeedMenu(false);
                      setShowQualityMenu(false);
                    }}
                    className={cn(
                      "hover:bg-white/20 p-1.5 rounded",
                      activeCaption && "text-primary-400"
                    )}
                    aria-label="Phụ đề"
                  >
                    <Subtitles className="h-5 w-5" />
                  </button>
                  {showCaptionMenu && (
                    <div className="absolute bottom-full right-0 mb-2 bg-black/90 rounded-lg py-2 min-w-[120px]">
                      <button
                        onClick={() => {
                          setActiveCaption(null);
                          setShowCaptionMenu(false);
                        }}
                        className={cn(
                          "w-full px-4 py-1.5 text-left text-sm hover:bg-white/10",
                          !activeCaption && "text-primary-400"
                        )}
                      >
                        Off
                      </button>
                      {captions.map((track) => (
                        <button
                          key={track.lang}
                          onClick={() => {
                            setActiveCaption(track.lang);
                            setShowCaptionMenu(false);
                          }}
                          className={cn(
                            "w-full px-4 py-1.5 text-left text-sm hover:bg-white/10",
                            activeCaption === track.lang && "text-primary-400"
                          )}
                        >
                          {track.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Playback Speed */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowSpeedMenu(!showSpeedMenu);
                    setShowQualityMenu(false);
                    setShowCaptionMenu(false);
                  }}
                  className="hover:bg-white/20 px-2 py-1 rounded text-sm"
                  aria-label="Tốc độ phát"
                >
                  {playbackRate}x
                </button>
                {showSpeedMenu && (
                  <div className="absolute bottom-full right-0 mb-2 bg-black/90 rounded-lg py-2 min-w-[100px]">
                    {PLAYBACK_RATES.map((rate) => (
                      <button
                        key={rate}
                        onClick={() => changePlaybackRate(rate)}
                        className={cn(
                          "w-full px-4 py-1.5 text-left text-sm hover:bg-white/10",
                          playbackRate === rate && "text-primary-400"
                        )}
                      >
                        {rate}x {rate === 1 && "(Normal)"}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Quality */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowQualityMenu(!showQualityMenu);
                    setShowSpeedMenu(false);
                    setShowCaptionMenu(false);
                  }}
                  className="hover:bg-white/20 p-1.5 rounded"
                  aria-label="Cài đặt chất lượng"
                >
                  <Settings className="h-5 w-5" />
                </button>
                {showQualityMenu && (
                  <div className="absolute bottom-full right-0 mb-2 bg-black/90 rounded-lg py-2 min-w-[100px]">
                    {QUALITY_OPTIONS.map((q) => (
                      <button
                        key={q}
                        onClick={() => {
                          setQuality(q);
                          setShowQualityMenu(false);
                        }}
                        className={cn(
                          "w-full px-4 py-1.5 text-left text-sm hover:bg-white/10",
                          quality === q && "text-primary-400"
                        )}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* PiP */}
              <button
                onClick={togglePiP}
                className="hover:bg-white/20 p-1.5 rounded"
                aria-label="Thu nhỏ màn hình (Picture in Picture)"
              >
                <PictureInPicture2 className="h-5 w-5" />
              </button>

              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                className="hover:bg-white/20 p-1.5 rounded"
                aria-label={isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}
              >
                {isFullscreen ? (
                  <Minimize className="h-5 w-5" />
                ) : (
                  <Maximize className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
