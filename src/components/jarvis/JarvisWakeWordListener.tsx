import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Radio,
  Sliders,
  Sparkles,
  Volume2,
  Check,
  Zap,
  Hand,
  Settings2,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Moon,
} from 'lucide-react';
import { playJarvisActivationChime, playJarvisSleepChime } from '../../utils/audioUtils';

interface JarvisWakeWordListenerProps {
  onWake: (trigger: 'voice' | 'clap') => void;
  isVoiceModalOpen: boolean;
  onSleep?: () => void;
}

type Sensitivity = 'low' | 'medium' | 'high';
type ClapMode = 'single' | 'double';

export const JarvisWakeWordListener: React.FC<JarvisWakeWordListenerProps> = ({
  onWake,
  isVoiceModalOpen,
  onSleep,
}) => {
  // Persistence state
  const [isEnabled, setIsEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('jarvis_handsfree_enabled');
    return saved !== null ? saved === 'true' : true;
  });

  const [wakeWordEnabled, setWakeWordEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('jarvis_wakeword_enabled');
    return saved !== null ? saved === 'true' : true;
  });

  const [clapEnabled, setClapEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('jarvis_clap_enabled');
    return saved !== null ? saved === 'true' : true;
  });

  const [sensitivity, setSensitivity] = useState<Sensitivity>(() => {
    const saved = localStorage.getItem('jarvis_clap_sensitivity') as Sensitivity;
    return saved === 'low' || saved === 'medium' || saved === 'high' ? saved : 'medium';
  });

  const [clapMode, setClapMode] = useState<ClapMode>(() => {
    const saved = localStorage.getItem('jarvis_clap_mode') as ClapMode;
    return saved === 'single' || saved === 'double' ? saved : 'single';
  });

  // UI state
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [micPermissionState, setMicPermissionState] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [wakeStatusMessage, setWakeStatusMessage] = useState<string | null>(null);
  const [lastTriggerType, setLastTriggerType] = useState<'voice' | 'clap' | null>(null);

  // References
  const speechRecognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const isCooldownRef = useRef(false);
  const lastClapTimeRef = useRef<number>(0);
  const panelRef = useRef<HTMLDivElement>(null);

  // Save preferences
  useEffect(() => {
    localStorage.setItem('jarvis_handsfree_enabled', String(isEnabled));
  }, [isEnabled]);

  useEffect(() => {
    localStorage.setItem('jarvis_wakeword_enabled', String(wakeWordEnabled));
  }, [wakeWordEnabled]);

  useEffect(() => {
    localStorage.setItem('jarvis_clap_enabled', String(clapEnabled));
  }, [clapEnabled]);

  useEffect(() => {
    localStorage.setItem('jarvis_clap_sensitivity', sensitivity);
  }, [sensitivity]);

  useEffect(() => {
    localStorage.setItem('jarvis_clap_mode', clapMode);
  }, [clapMode]);

  // Click outside to close panel
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsPanelOpen(false);
      }
    };
    if (isPanelOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPanelOpen]);

  // Trigger wake sequence
  const triggerWake = useCallback(
    (source: 'voice' | 'clap') => {
      if (isCooldownRef.current) return;
      isCooldownRef.current = true;

      // Flash feedback
      setLastTriggerType(source);
      setWakeStatusMessage(
        source === 'voice' ? '🎙️ "Wake up JARVIS" detected!' : '👏 Sharp clap detected!'
      );

      // Play authentic Iron-Man Jarvis activation chime
      playJarvisActivationChime();

      // Notify parent to open Voice Modal
      onWake(source);

      // Cooldown to prevent double triggering
      setTimeout(() => {
        isCooldownRef.current = false;
        setWakeStatusMessage(null);
      }, 2400);
    },
    [onWake]
  );

  // Trigger sleep sequence
  const triggerSleep = useCallback(() => {
    if (isCooldownRef.current) return;
    isCooldownRef.current = true;

    setLastTriggerType('voice');
    setWakeStatusMessage('💤 "JARVIS sleep" detected — Standby');

    playJarvisSleepChime();

    if (onSleep) {
      onSleep();
    }

    setTimeout(() => {
      isCooldownRef.current = false;
      setWakeStatusMessage(null);
    }, 2400);
  }, [onSleep]);

  // Check microphone permissions
  const inspectPermission = useCallback(async () => {
    try {
      if (navigator.permissions && navigator.permissions.query) {
        const status = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        setMicPermissionState(status.state as 'prompt' | 'granted' | 'denied');
        status.onchange = () => {
          setMicPermissionState(status.state as 'prompt' | 'granted' | 'denied');
        };
      }
    } catch {
      // Browser doesn't support mic permissions.query
    }
  }, []);

  useEffect(() => {
    inspectPermission();
  }, [inspectPermission]);

  // Stop background mic stream
  const stopAudioListening = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch {}
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setAudioLevel(0);
  }, []);

  // Stop background SpeechRecognition
  const stopSpeechRecognition = useCallback(() => {
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.abort();
      } catch {}
      speechRecognitionRef.current = null;
    }
  }, []);

  // Initialize Speech Recognition for wake words: "wake up jarvis", "hey jarvis", "jarvis"
  const startSpeechRecognition = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('[JarvisWake] Browser speech recognition not available');
      return;
    }

    try {
      stopSpeechRecognition();

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        // Recognition started
      };

      recognition.onresult = (event: any) => {
        if (isVoiceModalOpen || isCooldownRef.current) return;

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0]?.transcript?.trim().toLowerCase() || '';

          // Match sleep patterns first ("jarvis sleep", "sleep jarvis", etc.)
          const sleepPattern =
            /\b(jarvis\s*sleep|sleep\s*jarvis|go\s*to\s*sleep\s*jarvis|jarvis\s*go\s*to\s*sleep|sleep\s*mode|shutdown\s*jarvis|jarvis\s*shutdown|close\s*jarvis|jarvis\s*close|jarvis\s*sleep\s*now|bye\s*jarvis|jarvis\s*bye|good\s*night\s*jarvis|jarvis\s*good\s*night|standby\s*jarvis|jarvis\s*standby)\b/i;

          if (sleepPattern.test(transcript)) {
            console.log('[JarvisWake] Sleep command detected:', transcript);
            triggerSleep();
            break;
          }

          // Match wake patterns
          const wakePattern = /\b(wake\s*up\s*jarvis|wake\s*up|hey\s*jarvis|hello\s*jarvis|ok\s*jarvis|hi\s*jarvis|^jarvis\b|start\s*jarvis)\b/i;

          if (wakePattern.test(transcript)) {
            console.log('[JarvisWake] Wake word detected:', transcript);
            triggerWake('voice');
            break;
          }
        }
      };

      recognition.onerror = (e: any) => {
        // Safe errors to ignore and allow continuous background listening
        if (e.error === 'no-speech' || e.error === 'network') {
          return;
        }
        if (e.error === 'not-allowed') {
          setMicPermissionState('denied');
        }
      };

      recognition.onend = () => {
        // Auto-restart if hands-free is enabled and voice modal is not active
        if (isEnabled && wakeWordEnabled && !isVoiceModalOpen) {
          setTimeout(() => {
            if (isEnabled && wakeWordEnabled && !isVoiceModalOpen) {
              try {
                recognition.start();
              } catch {}
            }
          }, 300);
        }
      };

      recognition.start();
      speechRecognitionRef.current = recognition;
    } catch (err) {
      console.warn('[JarvisWake] Failed to initialize SpeechRecognition:', err);
    }
  }, [isEnabled, wakeWordEnabled, isVoiceModalOpen, triggerWake, triggerSleep, stopSpeechRecognition]);

  // Initialize Web Audio API Clap Detector
  const startClapDetector = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) return;

    try {
      stopAudioListening();

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      mediaStreamRef.current = stream;
      setMicPermissionState('granted');

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.2;
      source.connect(analyser);
      analyserRef.current = analyser;

      const bufferLength = analyser.fftSize;
      const dataArray = new Float32Array(bufferLength);

      let ambientFloor = 0.04;
      let lastSpikeTime = 0;

      // Sensitivity thresholds
      const peakThreshold = sensitivity === 'high' ? 0.24 : sensitivity === 'low' ? 0.44 : 0.32;

      const analyzeAudio = () => {
        if (!analyserRef.current || isVoiceModalOpen) {
          animFrameRef.current = requestAnimationFrame(analyzeAudio);
          return;
        }

        analyserRef.current.getFloatTimeDomainData(dataArray);

        // Find instantaneous peak amplitude
        let maxVal = 0;
        let sumSquares = 0;
        for (let i = 0; i < bufferLength; i++) {
          const abs = Math.abs(dataArray[i]);
          if (abs > maxVal) maxVal = abs;
          sumSquares += abs * abs;
        }
        const rms = Math.sqrt(sumSquares / bufferLength);

        // Update visualizer level (smoothed)
        setAudioLevel((prev) => Math.min(100, Math.round(prev * 0.7 + maxVal * 160)));

        // Adapt background ambient floor slowly
        if (maxVal < 0.15) {
          ambientFloor = ambientFloor * 0.95 + maxVal * 0.05;
        }

        const now = performance.now();

        // Detect transient peak characteristic of a hand clap:
        // Sudden spike well above threshold and 3.2x above ambient floor
        if (
          !isCooldownRef.current &&
          maxVal > peakThreshold &&
          maxVal > ambientFloor * 3.2 &&
          now - lastSpikeTime > 250 // minimum spacing from micro-ripples
        ) {
          lastSpikeTime = now;

          if (clapMode === 'single') {
            console.log('[JarvisWake] Single clap detected! Peak:', maxVal.toFixed(2));
            triggerWake('clap');
          } else {
            // Double clap mode: requires 2 claps within 700ms (min 150ms apart)
            const timeSincePrev = now - lastClapTimeRef.current;
            if (timeSincePrev > 140 && timeSincePrev < 700) {
              console.log('[JarvisWake] Double clap detected! Interval:', timeSincePrev.toFixed(0), 'ms');
              lastClapTimeRef.current = 0;
              triggerWake('clap');
            } else {
              lastClapTimeRef.current = now;
            }
          }
        }

        animFrameRef.current = requestAnimationFrame(analyzeAudio);
      };

      animFrameRef.current = requestAnimationFrame(analyzeAudio);
    } catch (err: any) {
      console.warn('[JarvisWake] Unable to start clap microphone listener:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setMicPermissionState('denied');
      }
    }
  }, [sensitivity, clapMode, isVoiceModalOpen, triggerWake, stopAudioListening]);

  // Master controller: Start / Stop listening based on state
  useEffect(() => {
    // If voice modal is open, pause background listening so the modal has dedicated mic access
    if (isVoiceModalOpen) {
      stopAudioListening();
      stopSpeechRecognition();
      return;
    }

    if (!isEnabled) {
      stopAudioListening();
      stopSpeechRecognition();
      return;
    }

    if (wakeWordEnabled) {
      startSpeechRecognition();
    } else {
      stopSpeechRecognition();
    }

    if (clapEnabled) {
      startClapDetector();
    } else {
      stopAudioListening();
    }

    return () => {
      stopAudioListening();
      stopSpeechRecognition();
    };
  }, [
    isEnabled,
    wakeWordEnabled,
    clapEnabled,
    isVoiceModalOpen,
    startSpeechRecognition,
    startClapDetector,
    stopAudioListening,
    stopSpeechRecognition,
  ]);

  // Request mic permission manually when user clicks
  const handleRequestMicAccess = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicPermissionState('granted');
      setIsEnabled(true);
      if (wakeWordEnabled) startSpeechRecognition();
      if (clapEnabled) startClapDetector();
    } catch (e) {
      console.warn('[JarvisWake] Permission request was not granted:', e);
      setMicPermissionState('denied');
    }
  };

  const handleTestChime = () => {
    playJarvisActivationChime();
  };

  return (
    <>
      {/* 1. Futuristic Floating JARVIS Sentinel Pill (Always visible across all tabs) */}
      <div className="fixed bottom-6 left-6 z-40 select-none">
        <div className="relative" ref={panelRef}>
          {/* Quick HUD Capsule */}
          <div
            onClick={() => setIsPanelOpen((prev) => !prev)}
            className={`flex items-center gap-2.5 px-3.5 py-2 rounded-full border backdrop-blur-md cursor-pointer transition-all duration-300 shadow-xl ${
              isEnabled && !isVoiceModalOpen
                ? 'bg-slate-950/90 border-cyan-500/50 hover:border-cyan-400 text-cyan-200 shadow-cyan-950/40 hover:shadow-cyan-500/30'
                : 'bg-slate-900/80 border-slate-700/60 hover:border-slate-600 text-slate-400 shadow-black/40'
            }`}
            title="JARVIS Hands-Free Sentinel: Clapping & Voice Wake detection settings"
          >
            {/* Pulsing indicator orb */}
            <div className="relative flex items-center justify-center w-5 h-5">
              {isEnabled && !isVoiceModalOpen ? (
                <>
                  <span
                    className="absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-40 animate-ping"
                    style={{ animationDuration: '2.5s' }}
                  ></span>
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]"></div>
                </>
              ) : (
                <div className="w-2 h-2 rounded-full bg-slate-500"></div>
              )}
            </div>

            {/* Status Text & Icons */}
            <div className="flex items-center gap-1.5 text-xs font-semibold tracking-wide">
              <span className="font-mono text-cyan-400 font-bold">JARVIS</span>
              <span className="text-slate-400 text-[11px] hidden sm:inline">•</span>
              <span className="text-[11px] hidden sm:inline">
                {isVoiceModalOpen
                  ? 'Session Active'
                  : isEnabled
                  ? 'Listening for Wake/Clap'
                  : 'Hands-Free Off'}
              </span>

              {/* Mode Badges */}
              {isEnabled && !isVoiceModalOpen && (
                <div className="flex items-center gap-1 ml-1">
                  {wakeWordEnabled && (
                    <span
                      className="px-1.5 py-0.5 rounded text-[10px] bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-medium"
                      title="Voice Wake Word: Say 'Wake up JARVIS'"
                    >
                      "Wake Up"
                    </span>
                  )}
                  {clapEnabled && (
                    <span
                      className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-medium flex items-center gap-0.5"
                      title="Clap Trigger: Clap hands to start"
                    >
                      👏 {clapMode === 'double' ? 'x2' : 'x1'}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Audio level meter dot or settings toggle icon */}
            <div className="flex items-center pl-1 border-l border-slate-700/60 ml-1">
              {isEnabled && !isVoiceModalOpen && audioLevel > 5 ? (
                <div
                  className="w-1.5 rounded-full bg-cyan-400 transition-all duration-75"
                  style={{ height: `${Math.min(18, Math.max(4, audioLevel / 4))}px` }}
                />
              ) : (
                <Settings2 className="w-3.5 h-3.5 text-slate-400 hover:text-cyan-300 transition-colors" />
              )}
            </div>
          </div>

          {/* 2. Sentinel Configuration Popover Panel */}
          {isPanelOpen && (
            <div className="absolute bottom-12 left-0 w-84 bg-slate-950/95 border border-cyan-500/40 rounded-2xl shadow-2xl backdrop-blur-xl p-4 text-slate-200 text-xs animate-in fade-in slide-in-from-bottom-2 duration-200 z-50">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-cyan-950 border border-cyan-500/50 flex items-center justify-center text-cyan-400">
                    <Radio className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white tracking-wide">JARVIS Hands-Free Sentinel</h4>
                    <p className="text-[10px] text-cyan-400/80">Voice Wake & Clap Activation</p>
                  </div>
                </div>

                {/* Master Switch */}
                <button
                  onClick={() => setIsEnabled((prev) => !prev)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    isEnabled ? 'bg-cyan-500' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      isEnabled ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Mic Permission Warning / Prompt */}
              {micPermissionState === 'denied' && (
                <div className="mt-3 p-2.5 bg-rose-950/50 border border-rose-500/40 rounded-xl text-[11px] text-rose-300 flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Microphone access is blocked</p>
                    <p className="text-slate-400 text-[10px] mt-0.5">
                      Please allow microphone access in your browser bar to enable voice and clap triggers.
                    </p>
                  </div>
                </div>
              )}

              {micPermissionState === 'prompt' && isEnabled && (
                <div className="mt-3 p-2.5 bg-cyan-950/50 border border-cyan-500/40 rounded-xl text-[11px] text-cyan-200 flex items-center justify-between gap-2">
                  <span className="text-[11px]">Allow mic access to start listening</span>
                  <button
                    onClick={handleRequestMicAccess}
                    className="px-2.5 py-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-md text-[10px] cursor-pointer"
                  >
                    Grant Mic
                  </button>
                </div>
              )}

              {/* Toggles */}
              <div className="mt-3 space-y-2.5">
                {/* Voice Wake-Word Switch */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-colors">
                  <div className="flex items-center gap-2">
                    <Mic className="w-3.5 h-3.5 text-cyan-400" />
                    <div>
                      <p className="font-semibold text-slate-200">Voice Wake Word</p>
                      <p className="text-[10px] text-slate-400">Say "Wake up JARVIS" or "Hey JARVIS"</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={wakeWordEnabled}
                    onChange={(e) => setWakeWordEnabled(e.target.checked)}
                    disabled={!isEnabled}
                    className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
                  />
                </div>

                {/* Clap Detection Switch */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">👏</span>
                    <div>
                      <p className="font-semibold text-slate-200">Acoustic Clap Trigger</p>
                      <p className="text-[10px] text-slate-400">Clap hands to immediately start JARVIS</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={clapEnabled}
                    onChange={(e) => setClapEnabled(e.target.checked)}
                    disabled={!isEnabled}
                    className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
                  />
                </div>

                {/* Clap Mode (Single vs Double) */}
                {clapEnabled && (
                  <div className="p-2 rounded-xl bg-slate-900/40 border border-slate-800/60 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Clap Trigger Style:</span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => setClapMode('single')}
                          className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                            clapMode === 'single'
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                              : 'bg-slate-800 text-slate-400 hover:text-slate-300'
                          }`}
                        >
                          Single Clap (Quick)
                        </button>
                        <button
                          onClick={() => setClapMode('double')}
                          className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                            clapMode === 'double'
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                              : 'bg-slate-800 text-slate-400 hover:text-slate-300'
                          }`}
                        >
                          Double Clap 👏 👏
                        </button>
                      </div>
                    </div>

                    {/* Sensitivity selector */}
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
                      <span>Clap Sensitivity:</span>
                      <div className="flex gap-1">
                        {(['low', 'medium', 'high'] as Sensitivity[]).map((level) => (
                          <button
                            key={level}
                            onClick={() => setSensitivity(level)}
                            className={`px-2 py-0.5 rounded text-[10px] capitalize font-medium transition-colors ${
                              sensitivity === level
                                ? 'bg-cyan-500 text-slate-950 font-bold'
                                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            {level}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                <button
                  onClick={handleTestChime}
                  className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-colors font-medium cursor-pointer"
                >
                  <Volume2 className="w-3 h-3" />
                  <span>Test Activation Chime</span>
                </button>

                <button
                  onClick={() => setIsPanelOpen(false)}
                  className="text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Activation Notification Banner (when woken via voice or clap) */}
      {wakeStatusMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-bounce-subtle pointer-events-none">
          <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-gradient-to-r from-slate-950 via-cyan-950 to-slate-950 border border-cyan-400/80 shadow-[0_0_30px_rgba(34,211,238,0.4)] text-white backdrop-blur-xl">
            <div className="w-8 h-8 rounded-full bg-cyan-400/20 border border-cyan-400 flex items-center justify-center text-cyan-300 animate-pulse">
              <Zap className="w-4 h-4 fill-cyan-400 text-cyan-400" />
            </div>
            <div>
              <p className="font-mono text-xs font-bold text-cyan-300 tracking-wider">
                J.A.R.V.I.S. ONLINE
              </p>
              <p className="text-xs text-slate-200 font-medium">{wakeStatusMessage}</p>
            </div>
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping ml-2"></span>
          </div>
        </div>
      )}
    </>
  );
};
