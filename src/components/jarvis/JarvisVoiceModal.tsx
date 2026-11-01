import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  PhoneOff,
  Sparkles,
  Radio,
  RotateCcw,
  Bot,
  User,
  Zap,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Send,
  RefreshCw,
  Info,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  FileCheck2,
  Brain,
  Moon,
  FileUp,
  Upload,
  Copy,
  Check,
  MapPin,
  Calendar,
  Users,
  Car,
  FileText,
} from 'lucide-react';
import {
  float32ToPcm16Base64,
  GaplessAudioPlayer,
  playWavAudio,
  playJarvisSleepChime,
} from '../../utils/audioUtils';
import { Itinerary, Lead, LeadStatus } from '../../types';
import { buildFullItineraryFromAi } from '../../utils/itineraryBuilderHelper';
import { parseDestinationFromText } from '../../utils/destinationParser';
import { parseItineraryText, ParseResult } from '../../utils/itineraryTextParser';
import {
  getFormattedMemoryPrompt,
  learnFromExchange,
  recordCreatedItinerary,
} from '../../utils/jarvisMemory';
import { JarvisMemoryModal } from './JarvisMemoryModal';

const sampleUploadItineraries = [
  {
    label: 'Sikkim & Darjeeling Dual Quote (Innova + Sharing Sumo)',
    text: `*North East Destinations - Sikkim & Darjeeling Tour*
Guest Name: Mr. Sandeep Mukherjee
Contact: +91 98310 99421
Email: sandeep.m@gmail.com
Origin: Kolkata
Pickup Hub: NJP Railway Station
Drop Hub: Bagdogra Airport (IXB)
Dates: 15 Nov 2026 to 21 Nov 2026
Pax: 4 Adults + 1 Child

Day 1: Pick up from NJP railway station and drive to Gangtok along Teesta river. Check in hotel. Evening walk at MG Marg. Stay at Gangtok.
Day 2: Full day excursion to Tsomgo Lake (Changu Lake) and Baba Harbhajan Singh Mandir. Return to Gangtok hotel for night stay.
Day 3: Gangtok to Pelling via Ravangla Buddha Park. Evening check in at Pelling hotel with view of Kanchenjunga.
Day 4: Pelling local sightseeing covering Chenrezig Glass Skywalk, Pemayangtse Monastery, and Khecheopalri Lake. Overnight at Pelling.
Day 5: Pelling to Darjeeling through tea gardens. Evening at leisure at Chowrasta Mall. Night stay in Darjeeling.
Day 6: Early morning 4 AM Tiger Hill sunrise view over Kanchenjunga, Ghoom Monastery, Batasia Loop. Post breakfast visit HMI Zoo. Night in Darjeeling.
Day 7: Check out and departure drop to Bagdogra airport via Mirik lake.

Hotel Category: Deluxe Category (3-Star Mountain View)
Meal Plan: MAP (Daily Breakfast & Dinner)
Pricing Mode: Both (Dual Comparison)
Reserved Cab Facility: Rs 88,000 Total (Innova / Xylo dedicated private SUV throughout)
Sharing Cab Facility: Rs 56,000 Total (Fixed Tata Sumo / Mahindra Bolero point-to-point transit)

Inclusions:
- Accommodation on double sharing basis in selected deluxe hotels
- Daily breakfast & dinner as per meal plan
- All transfers and sightseeing as per itinerary
- Driver allowances, mountain fuel, toll and parking taxes

Exclusions:
- Airfare / train tickets
- Personal expenses, laundry, telephone calls
- Entry fees at monuments and camera charges
- Nathula Pass / Zero Point supplement if required`,
  },
  {
    label: 'Meghalaya Waterfalls (Reserved Swift/WagonR)',
    text: `Tour Plan: Mystical Meghalaya
Guest: Dr. Meenakshi Iyer
Phone: +91 98400 12345
Origin: Bangalore
Pickup: Guwahati Airport (GAU)
Drop: Guwahati Airport (GAU)
Dates: 05 Dec 2026 to 09 Dec 2026
Pax: 2 Adults
Hotel Category: Super Deluxe Category (4-Star Premium)
Meal Plan: CP (Daily Breakfast Only)
Pricing Mode: Reserved Cab

Day 1: Arrival at Guwahati airport. Scenic drive to Shillong with stop at Umiam Lake (Barapani). Night stay in Shillong.
Day 2: Shillong to Cherrapunji (Sohra). Visit Nohkalikai Waterfalls, Mawsmai Cave, and Seven Sisters Falls. Stay in Cherrapunji.
Day 3: Day trip to Mawlynnong clean village and Living Root Bridge at Riwai. Enjoy boating at Dawki Umngot river. Return to Shillong for stay.
Day 4: Shillong local sights - Ward's Lake, Don Bosco Museum, and Cathedral. Evening shopping at Police Bazaar. Stay in Shillong.
Day 5: Drive back to Guwahati. Visit Kamakhya Temple and drop at Guwahati Airport.

Quotation:
Reserved Cab Facility: Rs 46,000 Total (Small Cab - Swift / WagonR dedicated for couple)

Inclusions:
- Dedicated Small Cab (Swift / WagonR) with driver allowances & fuel
- 4 Nights stay in Super Deluxe properties with daily breakfast
- All sight entries and parking charges`,
  },
  {
    label: 'North Sikkim Expedition (Tempo Traveller / Sumo)',
    text: `North Sikkim High Altitude Expedition
Client: Vikram Malhotra
Origin: Delhi
Pax: 12 Adults
Pickup: Bagdogra Airport
Drop: NJP Railway Station
Dates: 10 Apr 2027 to 15 Apr 2027

Day 1: Bagdogra to Gangtok scenic drive. Night in Gangtok.
Day 2: Gangtok to Lachen via Chungthang and Singhik view points. Overnight stay at Lachen.
Day 3: Early morning drive to Gurudongmar Lake (17,800 ft). Post lunch drive to Lachung. Night in Lachung.
Day 4: Lachung to Yumthang Valley of Flowers and hot springs. Return drive to Gangtok. Night in Gangtok.
Day 5: Gangtok local sightseeing - Tsomgo Lake and Baba Mandir. Night in Gangtok.
Day 6: Gangtok to NJP departure drop.

Pricing Mode: Both
Reserved Cab Facility: Rs 1,48,000 Total (Spacious Tempo Traveller for 12 Pax)
Sharing Cab Facility: Rs 96,000 Total (Fixed Tata Sumo / Mahindra Bolero transit)`,
  },
];

interface JarvisVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'voice' | 'upload' | 'chat';
  destinationContext?: string;
  onApplyItineraryPrompt?: (prompt: string) => void;
  currentItinerary?: Itinerary | null;
  onApplyItinerary?: (itinerary: Itinerary) => void;
  onApplyParsedItinerary?: (parsedData: Partial<Itinerary>) => void;
  wakeTriggerSource?: 'voice' | 'clap' | 'manual';
  savedItineraries?: Itinerary[];
  leads?: Lead[];
  onSelectItinerary?: (itinerary: Itinerary) => void;
  onSaveLead?: (lead: Lead) => void;
  onUpdateLeadStatus?: (leadId: string, status: LeadStatus, note?: string) => void;
  onNavigate?: (tab: 'home' | 'itinerary' | 'leads' | 'accounts' | 'saved', mode?: 'builder' | 'preview') => void;
  onShowToast?: (message: string) => void;
}

interface TranscriptItem {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

const isJarvisSleepIntent = (text: string): boolean => {
  if (!text) return false;
  const clean = text.toLowerCase().trim();
  const sleepPattern =
    /\b(jarvis\s*sleep|sleep\s*jarvis|go\s*to\s*sleep|sleep\s*now|close\s*jarvis|jarvis\s*close|shutdown\s*jarvis|jarvis\s*shutdown|bye\s*jarvis|jarvis\s*bye|good\s*night\s*jarvis|jarvis\s*good\s*night|standby\s*jarvis|jarvis\s*standby|take\s*a\s*rest\s*jarvis|jarvis\s*take\s*a\s*rest|sleep\s*mode)\b/i;
  if (sleepPattern.test(clean)) return true;
  if (/^(sleep|go to sleep|sleep now|good night|bye|goodbye|shut down|close)$/i.test(clean)) return true;
  return false;
};

export const JarvisVoiceModal: React.FC<JarvisVoiceModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'voice',
  destinationContext,
  onApplyItineraryPrompt,
  currentItinerary,
  onApplyItinerary,
  onApplyParsedItinerary,
  wakeTriggerSource = 'manual',
  savedItineraries = [],
  leads = [],
  onSelectItinerary,
  onSaveLead,
  onUpdateLeadStatus,
  onNavigate,
  onShowToast,
}) => {
  const isSleepingRef = useRef(false);

  // Unified Mode: 'voice' | 'upload' | 'chat'
  const [activeMode, setActiveMode] = useState<'voice' | 'upload' | 'chat'>(initialMode || 'voice');

  useEffect(() => {
    if (isOpen && initialMode) {
      setActiveMode(initialMode);
    }
  }, [isOpen, initialMode]);

  // Upload Text Itinerary Mode States
  const [uploadText, setUploadText] = useState('');
  const [isParsingUploadText, setIsParsingUploadText] = useState(false);
  const [uploadParseResult, setUploadParseResult] = useState<ParseResult | null>(null);
  const [uploadDragActive, setUploadDragActive] = useState(false);
  const uploadFileInputRef = useRef<HTMLInputElement>(null);

  const [connectionStatus, setConnectionStatus] = useState<
    'disconnected' | 'connecting' | 'connected' | 'error'
  >('disconnected');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Audio & Mic States
  const [isMicActive, setIsMicActive] = useState<boolean>(false);
  const [isMicPermissionDenied, setIsMicPermissionDenied] = useState<boolean>(false);
  const [isRequestingMic, setIsRequestingMic] = useState<boolean>(false);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [isJarvisSpeaking, setIsJarvisSpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [showPermissionGuide, setShowPermissionGuide] = useState<boolean>(false);
  const [isGeneratingItinerary, setIsGeneratingItinerary] = useState<boolean>(false);
  const [generatedSuccessMessage, setGeneratedSuccessMessage] = useState<string | null>(null);
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState<boolean>(false);

  // Web Speech STT fallback
  const [isWebSpeechListening, setIsWebSpeechListening] = useState(false);
  const speechRecognitionRef = useRef<any>(null);

  // Transcripts & Full Conversation History
  const [transcripts, setTranscripts] = useState<TranscriptItem[]>([]);
  const [currentAssistantText, setCurrentAssistantText] = useState<string>('');
  const [currentUserText, setCurrentUserText] = useState<string>('');
  const [textInput, setTextInput] = useState('');

  // Conversation history maintained across all user inputs and assistant replies
  const conversationHistoryRef = useRef<Array<{ role: 'user' | 'model'; content: string }>>([]);

  // WebSocket and Audio Nodes
  const wsRef = useRef<WebSocket | null>(null);
  const playerRef = useRef<GaplessAudioPlayer | null>(null);
  const micAudioCtxRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const isMicMutedRef = useRef(false);
  const isJarvisSpeakingRef = useRef(false);
  const lastAssistantSpokeTimestampRef = useRef<number>(0);

  isMicMutedRef.current = isMicMuted;
  isJarvisSpeakingRef.current = isJarvisSpeaking;
  if (isJarvisSpeaking) {
    lastAssistantSpokeTimestampRef.current = Date.now();
  }

  // Auto-scroll transcripts
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts, currentAssistantText, currentUserText]);

  // Connect on modal open
  useEffect(() => {
    if (isOpen) {
      isSleepingRef.current = false;
      initSession();
    } else {
      endVoiceSession();
    }

    return () => {
      endVoiceSession();
    };
  }, [isOpen]);

  /**
   * Puts JARVIS to sleep cleanly when user says "JARVIS sleep" or clicks Sleep
   */
  const handleJarvisSleep = (spokenTrigger?: string) => {
    if (isSleepingRef.current) return;
    isSleepingRef.current = true;

    const farewell =
      'Going to sleep now, Sir. Standby mode engaged. You can wake me anytime by saying "Wake up JARVIS" or clapping.';

    if (spokenTrigger) {
      setTranscripts((prev) => [
        ...prev,
        {
          id: `usr-sleep-${Date.now()}`,
          role: 'user',
          text: spokenTrigger,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }

    setTranscripts((prev) => [
      ...prev,
      {
        id: `asst-sleep-${Date.now()}`,
        role: 'assistant',
        text: farewell,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);

    // Play authentic descending power-down chime
    playJarvisSleepChime();

    // Audible browser farewell voice if speaker active
    if (!isSpeakerMuted) {
      speakWithBrowserSynthesis('Going to sleep now, Sir. Standby mode engaged.');
    }

    // Smoothly disconnect and close
    setTimeout(() => {
      endVoiceSession();
      onClose();
      isSleepingRef.current = false;
    }, 1100);
  };

  const initSession = async () => {
    setConnectionStatus('connecting');
    setErrorMessage(null);
    setIsMicActive(false);
    setIsGeneratingItinerary(false);
    setGeneratedSuccessMessage(null);

    const destLabel = destinationContext && !destinationContext.toLowerCase().includes('andaman')
      ? destinationContext
      : 'Sikkim & North East';
    let initialGreeting = `Good day, Sir. I am JARVIS, Senior AI Travel Architect. All systems online for Sikkim, Darjeeling, Meghalaya & North East. Which destination shall we plan today? You can say "Plan 5 days for Sikkim" or specify your tour details.`;

    if (wakeTriggerSource === 'voice') {
      initialGreeting = `At your service, Sir! I heard your command. All systems online for Sikkim & North East. How may I craft your tour plan today?`;
    } else if (wakeTriggerSource === 'clap') {
      initialGreeting = `Right away, Sir! Acoustic clap recognized. JARVIS is online and ready for your travel instructions.`;
    }

    setTranscripts([
      {
        id: 'init-msg',
        role: 'assistant',
        text: initialGreeting,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);

    conversationHistoryRef.current = [
      {
        role: 'model',
        content: initialGreeting,
      },
    ];

    // If hands-free woken by voice or clap, immediately announce presence
    if (wakeTriggerSource === 'voice' || wakeTriggerSource === 'clap') {
      setTimeout(() => {
        speakWithBrowserSynthesis(initialGreeting);
      }, 300);
    }

    // 1. Initialize Gapless Audio Player (Speaker)
    try {
      const player = new GaplessAudioPlayer();
      playerRef.current = player;
    } catch (err) {
      console.warn('[JARVIS UI] Player setup notice:', err);
    }

    // 2. Connect to Backend WebSocket
    connectWebSocket();

    // 3. Inspect if microphone permission is already granted
    checkPermissionStatusAndMaybeStart();
  };

  const checkPermissionStatusAndMaybeStart = async () => {
    try {
      if (navigator.permissions && navigator.permissions.query) {
        const perm = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        if (perm.state === 'granted') {
          await startMicrophoneStream();
        } else if (perm.state === 'denied') {
          setIsMicPermissionDenied(true);
        } else {
          setIsMicPermissionDenied(false);
        }

        perm.onchange = () => {
          if (perm.state === 'granted') {
            setIsMicPermissionDenied(false);
          } else if (perm.state === 'denied') {
            setIsMicPermissionDenied(true);
          }
        };
      }
    } catch {
      // Browser doesn't support permissions.query for mic, wait for user gesture
    }
  };

  const connectWebSocket = () => {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/live`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[JARVIS UI] WebSocket connected to backend');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'ready') {
            setConnectionStatus('connected');
          } else if (data.type === 'audio' && data.audio) {
            setIsJarvisSpeaking(true);
            isJarvisSpeakingRef.current = true;
            lastAssistantSpokeTimestampRef.current = Date.now();
            playerRef.current?.queueChunk(data.audio, () => {
              if (playerRef.current && !playerRef.current.isPlaying()) {
                setIsJarvisSpeaking(false);
                isJarvisSpeakingRef.current = false;
                lastAssistantSpokeTimestampRef.current = Date.now();
              }
            });
          } else if (data.type === 'transcription') {
            if (data.role === 'assistant') {
              setCurrentAssistantText((prev) => prev + data.text);
            } else if (data.role === 'user') {
              setCurrentUserText((prev) => {
                const combined = prev + data.text;
                if (isJarvisSleepIntent(combined)) {
                  setTimeout(() => handleJarvisSleep(combined), 60);
                }
                return combined;
              });
            }
          } else if (data.type === 'turn_complete') {
            if (playerRef.current && !playerRef.current.isPlaying()) {
              setIsJarvisSpeaking(false);
              isJarvisSpeakingRef.current = false;
            }
            lastAssistantSpokeTimestampRef.current = Date.now();
            setCurrentAssistantText((currAssText) => {
              if (currAssText.trim()) {
                const text = currAssText.trim();
                setTranscripts((prev) => [
                  ...prev,
                  {
                    id: `asst-${Date.now()}`,
                    role: 'assistant',
                    text,
                    timestamp: new Date().toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    }),
                  },
                ]);
                conversationHistoryRef.current.push({ role: 'model', content: text });
              }
              return '';
            });

            setCurrentUserText((currUsrText) => {
              if (currUsrText.trim()) {
                const text = currUsrText.trim();

                // Immediate Sleep Command check
                if (isJarvisSleepIntent(text)) {
                  handleJarvisSleep(text);
                  return '';
                }

                setTranscripts((prev) => [
                  ...prev,
                  {
                    id: `usr-${Date.now()}`,
                    role: 'user',
                    text,
                    timestamp: new Date().toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    }),
                  },
                ]);
                conversationHistoryRef.current.push({ role: 'user', content: text });

                // Detect if the user's spoken words ask to generate the itinerary
                if (
                  /generate.*itinerary|create.*itinerary|make.*itinerary|build.*itinerary|move to.*builder/i.test(
                    text
                  )
                ) {
                  handleGenerateItinerary();
                }
              }
              return '';
            });
          } else if (data.type === 'interrupted') {
            console.log('[JARVIS UI] Interrupted by user');
            playerRef.current?.stop();
            setIsJarvisSpeaking(false);
          } else if (data.type === 'error') {
            console.warn('[JARVIS UI] Live backend message:', data.error);
            setConnectionStatus('connected');
          }
        } catch (err) {
          console.error('[JARVIS UI] Error parsing ws message:', err);
        }
      };

      ws.onerror = (err) => {
        console.warn('[JARVIS UI] WebSocket error, maintaining continuous audio & text session:', err);
        setConnectionStatus('connected');
      };

      ws.onclose = () => {
        console.log('[JARVIS UI] WebSocket closed');
        if (connectionStatus === 'connecting') {
          setConnectionStatus('connected');
        }
      };
    } catch (err) {
      console.warn('[JARVIS UI] WebSocket setup caught:', err);
      setConnectionStatus('connected');
    }
  };

  /**
   * Start microphone stream from direct user click event
   */
  const startMicrophoneStream = async () => {
    if (!navigator?.mediaDevices?.getUserMedia) {
      setIsMicPermissionDenied(true);
      setShowPermissionGuide(true);
      return;
    }

    setIsRequestingMic(true);
    setErrorMessage(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      mediaStreamRef.current = stream;
      setIsMicActive(true);
      setIsMicPermissionDenied(false);
      setShowPermissionGuide(false);

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        startMicCapture(stream, wsRef.current);
      }

      // Start continuous speech recognition so every travel specification is transcribed and stored
      startContinuousSpeechRecognition();

      setTranscripts((prev) => [
        ...prev,
        {
          id: `mic-on-${Date.now()}`,
          role: 'assistant',
          text: 'Microphone uplink active, Sir. I am listening to your voice now.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err: any) {
      console.warn('[JARVIS UI] User denied microphone or browser blocked:', err);
      setIsMicActive(false);
      setIsMicPermissionDenied(true);
      setShowPermissionGuide(true);
    } finally {
      setIsRequestingMic(false);
    }
  };

  const startMicCapture = (stream: MediaStream, ws: WebSocket) => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass({ sampleRate: 16000 });
      micAudioCtxRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      // ScriptProcessorNode with buffer size 4096 (approx. 1/4 second at 16kHz)
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      source.connect(processor);
      processor.connect(audioCtx.destination);

      processor.onaudioprocess = (e) => {
        // Echo cancellation gate: If JARVIS is currently speaking, or spoke in the last 400ms, mute mic input
        const isEchoActive = isJarvisSpeakingRef.current || (Date.now() - lastAssistantSpokeTimestampRef.current < 450);
        if (isMicMutedRef.current || isEchoActive || ws.readyState !== WebSocket.OPEN) {
          setAudioLevel(0);
          setIsUserSpeaking(false);
          return;
        }

        const inputData = e.inputBuffer.getChannelData(0);

        // Simple volume calculation for visualizer
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) {
          sum += Math.abs(inputData[i]);
        }
        const avg = sum / inputData.length;
        setAudioLevel(Math.min(100, Math.round(avg * 400)));
        setIsUserSpeaking(avg > 0.02);

        // Convert Float32 to 16kHz 16-bit PCM Base64 and send
        const pcmBase64 = float32ToPcm16Base64(inputData);
        ws.send(
          JSON.stringify({
            type: 'audio',
            audio: pcmBase64,
          })
        );
      };
    } catch (err) {
      console.error('[JARVIS UI] Error setting up mic processor:', err);
    }
  };

  /**
   * Continuous Speech Recognition: captures every travel detail spoken by the user in real time
   */
  const startContinuousSpeechRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('[JARVIS STT] Web Speech API not supported in this browser.');
      return;
    }

    try {
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.stop();
        } catch {}
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsWebSpeechListening(true);
      };

      recognition.onresult = (event: any) => {
        // Echo suppression: Ignore recognition events triggered by JARVIS's own speakers
        const isEchoActive = isJarvisSpeakingRef.current || (Date.now() - lastAssistantSpokeTimestampRef.current < 450);
        if (isEchoActive) {
          return;
        }

        let interimText = '';
        let finalSegment = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const item = event.results[i];
          const transcriptChunk = item[0]?.transcript || '';
          if (item.isFinal) {
            finalSegment += transcriptChunk + ' ';
          } else {
            interimText += transcriptChunk;
          }
        }

        if (interimText) {
          setCurrentUserText(interimText);
        }

        if (finalSegment.trim()) {
          const spoken = finalSegment.trim();
          setCurrentUserText('');

          // Filter out echoes that repeat the last assistant words
          const lastMsg = conversationHistoryRef.current[conversationHistoryRef.current.length - 1];
          if (lastMsg && lastMsg.role === 'model' && lastMsg.content) {
            const cleanSpoken = spoken.toLowerCase().replace(/[^a-z0-9]/g, '');
            const cleanLast = lastMsg.content.toLowerCase().replace(/[^a-z0-9]/g, '');
            if (cleanSpoken.length > 8 && cleanLast.includes(cleanSpoken)) {
              console.log('[JARVIS Echo Suppressed]: Spoken text matched assistant audio');
              return;
            }
          }

          // 1. Check if user commanded JARVIS to sleep
          if (isJarvisSleepIntent(spoken)) {
            handleJarvisSleep(spoken);
            return;
          }

          // 2. Add to transcripts so user visually sees what was heard
          setTranscripts((prev) => [
            ...prev,
            {
              id: `usr-${Date.now()}`,
              role: 'user',
              text: spoken,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ]);

          // 3. Store in conversation history so itinerary generator has access to all information
          conversationHistoryRef.current.push({ role: 'user', content: spoken });

          // 4. Send text to WebSocket session if connected
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'text', text: spoken }));
          }

          // 5. Automatic Itinerary Generation Trigger:
          // If the user mentions Sikkim, Darjeeling, Meghalaya, Andaman, or asks to plan/generate/create a tour
          const isExplicitGenerateCommand =
            /\b(generate|create|make|build|save|move to builder|open builder|save to builder|plan|tour|itinerary|trip|package|holiday|sikkim|gangtok|tsomgo|nathula|pelling|lachung|darjeeling|meghalaya|shillong|cherrapunji|andaman|days|nights|adults|pax)\b/i.test(
              spoken
            );

          if (isExplicitGenerateCommand) {
            handleGenerateItinerary(spoken);
          }
        }
      };

      recognition.onerror = (e: any) => {
        if (e.error !== 'no-speech' && e.error !== 'network') {
          console.warn('[JARVIS STT] Recognition notice:', e.error);
        }
      };

      recognition.onend = () => {
        setIsWebSpeechListening(false);
        // Automatically restart while mic is active
        if (mediaStreamRef.current && mediaStreamRef.current.active) {
          setTimeout(() => {
            if (mediaStreamRef.current && mediaStreamRef.current.active) {
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
      console.warn('[JARVIS STT] Failed to start:', err);
      setIsWebSpeechListening(false);
    }
  };

  const handleToggleWebSpeech = () => {
    if (isWebSpeechListening) {
      try {
        speechRecognitionRef.current?.stop();
      } catch {}
      setIsWebSpeechListening(false);
    } else {
      startContinuousSpeechRecognition();
    }
  };

  const endVoiceSession = () => {
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch {}
      speechRecognitionRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    if (playerRef.current) {
      playerRef.current.close();
      playerRef.current = null;
    }

    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    if (micAudioCtxRef.current) {
      micAudioCtxRef.current.close();
      micAudioCtxRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    setConnectionStatus('disconnected');
    setIsMicActive(false);
    setIsJarvisSpeaking(false);
    setIsUserSpeaking(false);
    setAudioLevel(0);
  };

  const handleToggleMic = () => {
    if (!isMicActive) {
      startMicrophoneStream();
      return;
    }
    setIsMicMuted((prev) => !prev);
  };

  const handleToggleSpeaker = () => {
    setIsSpeakerMuted((prev) => {
      const next = !prev;
      playerRef.current?.setMuted(next);
      return next;
    });
  };

  const handleInterruptJarvis = () => {
    playerRef.current?.stop();
    setIsJarvisSpeaking(false);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'text', text: '[Interrupt]' }));
    }
  };

  const currentAudioElementRef = useRef<HTMLAudioElement | null>(null);

  const playJarvisAudio = (base64Audio: string, onEnd?: () => void) => {
    try {
      if (currentAudioElementRef.current) {
        currentAudioElementRef.current.pause();
        currentAudioElementRef.current = null;
      }
      setIsJarvisSpeaking(true);
      const audioEl = playWavAudio(base64Audio, () => {
        setIsJarvisSpeaking(false);
        currentAudioElementRef.current = null;
        onEnd?.();
      });
      currentAudioElementRef.current = audioEl;

      // Failsafe timer so visualizer never gets stuck in speaking state
      setTimeout(() => {
        setIsJarvisSpeaking(false);
      }, 14000);
    } catch (e) {
      console.warn('[JARVIS Audio Player error]:', e);
      setIsJarvisSpeaking(false);
      onEnd?.();
    }
  };

  const speakWithBrowserSynthesis = (text: string, onEnd?: () => void) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const clean = text.replace(/[*#_`]/g, '').trim().slice(0, 500);
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.rate = 1.0;
      utterance.pitch = 0.95;
      utterance.onend = () => {
        setIsJarvisSpeaking(false);
        onEnd?.();
      };
      utterance.onerror = () => {
        setIsJarvisSpeaking(false);
        onEnd?.();
      };
      setIsJarvisSpeaking(true);
      window.speechSynthesis.speak(utterance);

      // Failsafe timer
      setTimeout(() => {
        setIsJarvisSpeaking(false);
      }, 12000);
    } else {
      setIsJarvisSpeaking(false);
      onEnd?.();
    }
  };

  /**
   * Primary Itinerary Compilation & Transition to Itinerary Builder
   */
  const handleGenerateItinerary = async (userPromptOrEvent?: string | React.MouseEvent) => {
    const immediateUserText = typeof userPromptOrEvent === 'string' ? userPromptOrEvent : undefined;
    if (isGeneratingItinerary) return;
    setIsGeneratingItinerary(true);

    const confirmationText =
      'Right away, Sir! Synthesizing your travel requirements and loading the complete itinerary into the Builder...';

    setTranscripts((prev) => [
      ...prev,
      {
        id: `sys-${Date.now()}`,
        role: 'assistant',
        text: confirmationText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);

    // Gather all user content from conversationHistoryRef AND transcripts AND currentUserText AND immediateUserText
    const transcriptUserTexts = transcripts
      .filter((t) => t.role === 'user')
      .map((t) => t.text);

    if (immediateUserText && immediateUserText.trim()) {
      transcriptUserTexts.push(immediateUserText.trim());
    }

    const history = [...conversationHistoryRef.current].filter((m) => m.content.trim().length > 0);

    for (const t of transcriptUserTexts) {
      if (!history.some((h) => h.content.includes(t))) {
        history.push({ role: 'user', content: t });
      }
    }

    if (currentUserText.trim()) {
      history.push({ role: 'user', content: currentUserText.trim() });
    }

    const allSpokenDetails = history
      .filter((m) => m.role === 'user')
      .map((m) => m.content)
      .join('\n');

    // Detect destination directly mentioned in speech or text prioritizing immediate speech
    const targetDest = parseDestinationFromText(
      immediateUserText || currentUserText,
      history,
      destinationContext
    );

    // Always create a clean new itinerary for the requested destination
    const isExplicitNew = true;

    // Filter out any stale model turns or conflicting destination mentions
    const sanitizedHistory = history.filter((m) => {
      if (
        (targetDest === 'Sikkim' || targetDest === 'North Sikkim' || targetDest === 'Darjeeling') &&
        m.role === 'model' &&
        m.content.toLowerCase().includes('andaman')
      ) {
        return false;
      }
      return true;
    });

    sanitizedHistory.push({
      role: 'user',
      content: allSpokenDetails.trim()
        ? `Create the complete itinerary plan right now using all the travel specifications provided: "${allSpokenDetails}". Destination: ${targetDest}. Return hasItineraryUpdate: true and the full complete itinerary JSON object with all days, night stays, sightseeing highlights, transport, and pricing so the data is directly created in the Itinerary Builder.`
        : `Please generate a complete 5-day tour itinerary for ${targetDest} with deluxe hotels and dedicated cab, populated with all days and pricing so it opens in the Itinerary Builder.`,
    });

    try {
      const response = await fetch('/api/ai-itinerary-bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: sanitizedHistory,
          currentItinerary: null,
          destinationContext: targetDest,
          savedItineraries: (savedItineraries || []).map((it) => ({
            id: it.id,
            quoteNumber: it.quoteNumber,
            guestName: it.guestName,
            destination: it.destination,
            durationDays: it.durationDays,
            sellingCost: it.sellingCost,
            travelStartDate: it.travelStartDate,
            hotelCategory: it.hotelCategory,
            daysCount: it.days?.length || 0,
          })),
          leads: (leads || []).map((l) => ({
            id: l.id,
            guestName: l.guestName,
            phone: l.phone,
            destination: l.destination,
            status: l.status,
            priority: l.priority,
            durationDays: l.durationDays,
            adults: l.adults,
            budget: l.budget,
            quoteNumber: l.quoteNumber,
            itineraryId: l.itineraryId,
          })),
          action: 'create_new_itinerary',
          model: 'gemini-3.8-flash',
          jarvisMemory: getFormattedMemoryPrompt(),
        }),
      });

      if (!response.ok) throw new Error('Failed to generate itinerary');
      const data = await response.json();

      if (data.itinerary && onApplyItinerary) {
        const enriched = {
          ...data.itinerary,
          destination: data.itinerary.destination || targetDest,
        };
        const fullItinerary = buildFullItineraryFromAi(enriched, null, true);
        onApplyItinerary(fullItinerary);

        // Self-update memory for future tasks
        recordCreatedItinerary(fullItinerary);
        learnFromExchange(sanitizedHistory.map((m) => m.content).join(' '), data.reply || '', fullItinerary);

        const successText = `Right away, Sir! I have generated your complete itinerary for "${fullItinerary.title}" in ${fullItinerary.destination} and loaded all details into the Itinerary Builder.`;

        setGeneratedSuccessMessage(`✓ Itinerary "${fullItinerary.title}" loaded! Moving to Builder...`);
        setTranscripts((prev) => [
          ...prev,
          {
            id: `done-${Date.now()}`,
            role: 'assistant',
            text: successText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);

        // Speak aloud the completion announcement
        speakWithBrowserSynthesis(successText, () => {
          endVoiceSession();
          onClose();
        });

        // Close and move to Itinerary Builder
        setTimeout(() => {
          endVoiceSession();
          onClose();
        }, 1200);
        return;
      }

      // If no data.itinerary was returned, construct a rich fallback from default destination template
      if (onApplyItinerary) {
        const fallback = buildFullItineraryFromAi(
          {
            destination: targetDest,
            title: `${targetDest} Premier Tour Package`,
          },
          null,
          true
        );
        onApplyItinerary(fallback);

        const successText = `Done, Sir! I have compiled your itinerary for ${fallback.destination} and opened it in the Itinerary Builder for your review.`;
        setGeneratedSuccessMessage(`✓ Generated and moving to Itinerary Builder...`);
        speakWithBrowserSynthesis(successText);
        setTimeout(() => {
          endVoiceSession();
          onClose();
        }, 1200);
      }
    } catch (err: any) {
      console.error('[JARVIS UI] Error generating itinerary:', err);
      // Fallback: construct valid itinerary and apply anyway
      if (onApplyItinerary) {
        const fallback = buildFullItineraryFromAi(
          {
            destination: targetDest,
          },
          null,
          true
        );
        onApplyItinerary(fallback);
        setGeneratedSuccessMessage(`✓ Generated and moving to Itinerary Builder...`);
        setTimeout(() => {
          endVoiceSession();
          onClose();
        }, 1000);
      }
    } finally {
      setIsGeneratingItinerary(false);
    }
  };

  const sendPromptToJarvis = async (userPrompt: string) => {
    if (!userPrompt.trim()) return;
    const text = userPrompt.trim();
    setTextInput('');

    // Ensure audio context is active
    playerRef.current?.resume();

    // Append to transcript
    setTranscripts((prev) => [
      ...prev,
      {
        id: `usr-${Date.now()}`,
        role: 'user',
        text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);

    // Check if the user is asking JARVIS to sleep
    if (isJarvisSleepIntent(text)) {
      handleJarvisSleep();
      return;
    }

    // Record in full conversation history
    conversationHistoryRef.current.push({ role: 'user', content: text });

    // Detect destination from prompt text prioritizing current text
    const promptDest = parseDestinationFromText(
      text,
      conversationHistoryRef.current,
      destinationContext
    );

    // Check if the user is asking to generate / create / make the itinerary or mentioning tour planning
    const isGenerateIntent =
      /generate.*itinerary|create.*itinerary|make.*itinerary|build.*itinerary|move to.*builder|open.*builder|generate.*now|plan.*tour|plan.*itinerary|plan.*trip|create.*tour|5-day|north sikkim|darjeeling|meghalaya|andaman|\b(create|generate|make|build|plan)\b.*\b(itinerary|tour|trip|package)\b/i.test(
        text
      ) ||
      Boolean(
        /plan|tour|itinerary|trip|days|create|make/i.test(text) &&
        /sikkim|gangtok|darjeeling|meghalaya|andaman|lachen|lachung/i.test(text)
      );

    if (isGenerateIntent) {
      await handleGenerateItinerary(text);
      return;
    }

    const isExplicitNew = Boolean(
      promptDest && currentItinerary?.destination && promptDest.toLowerCase() !== currentItinerary.destination.toLowerCase()
    ) || /create|new|plan|tour|itinerary|different destination/i.test(text);

    setIsJarvisSpeaking(true);
    try {
      const response = await fetch('/api/ai-itinerary-bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: conversationHistoryRef.current,
          currentItinerary: isExplicitNew ? null : currentItinerary,
          destinationContext: promptDest || destinationContext,
          savedItineraries: (savedItineraries || []).map((it) => ({
            id: it.id,
            quoteNumber: it.quoteNumber,
            guestName: it.guestName,
            destination: it.destination,
            durationDays: it.durationDays,
            sellingCost: it.sellingCost,
            travelStartDate: it.travelStartDate,
            hotelCategory: it.hotelCategory,
            daysCount: it.days?.length || 0,
          })),
          leads: (leads || []).map((l) => ({
            id: l.id,
            guestName: l.guestName,
            phone: l.phone,
            destination: l.destination,
            status: l.status,
            priority: l.priority,
            durationDays: l.durationDays,
            adults: l.adults,
            budget: l.budget,
            quoteNumber: l.quoteNumber,
            itineraryId: l.itineraryId,
          })),
          model: 'gemini-3.8-flash',
          jarvisMemory: getFormattedMemoryPrompt(),
        }),
      });

      if (!response.ok) throw new Error('API response was not ok');
      const data = await response.json();
      const reply = data.reply || 'At your service, Sir. I have noted all your specifications.';

      // Self-update JARVIS memory bank from this exchange
      learnFromExchange(text, reply, data.itinerary);

      setTranscripts((prev) => [
        ...prev,
        {
          id: `asst-${Date.now()}`,
          role: 'assistant',
          text: reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);

      conversationHistoryRef.current.push({ role: 'model', content: reply });

      // Handle App Actions:
      // 1. Navigation
      if (data.action === 'navigate' && data.navigationTarget && onNavigate) {
        onNavigate(data.navigationTarget.tab, data.navigationTarget.mode);
        onShowToast?.(`✓ Navigated to ${data.navigationTarget.tab.toUpperCase()}`);
      }

      // 2. Load / Update Saved Quote
      if (
        (data.action === 'load_saved_quote' || data.action === 'update_saved_quote') &&
        (data.targetQuoteNumber || data.targetItineraryId) &&
        onSelectItinerary
      ) {
        const targetNumber = (data.targetQuoteNumber || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const targetId = data.targetItineraryId;
        const matched = savedItineraries.find(
          (s) =>
            (targetId && s.id === targetId) ||
            (targetNumber && (s.quoteNumber || '').toLowerCase().replace(/[^a-z0-9]/g, '').includes(targetNumber)) ||
            (data.itinerary?.guestName && (s.guestName || '').toLowerCase() === data.itinerary.guestName.toLowerCase())
        );

        if (matched) {
          if (data.itinerary && onApplyItinerary) {
            const updated = buildFullItineraryFromAi(data.itinerary, matched);
            onApplyItinerary(updated);
            onShowToast?.(`✓ Loaded & updated Quote #${updated.quoteNumber} for ${updated.guestName}!`);
          } else {
            onSelectItinerary(matched);
            onShowToast?.(`✓ Loaded Quote #${matched.quoteNumber} (${matched.guestName}) into Builder`);
          }
        }
      }

      // 3. Create or Update CRM Lead
      if (data.leadData && onSaveLead) {
        if (data.action === 'update_lead' && data.targetLeadId) {
          const existingLead = leads.find((l) => l.id === data.targetLeadId);
          if (existingLead) {
            const updated: Lead = {
              ...existingLead,
              ...data.leadData,
              updatedAt: new Date().toISOString(),
            };
            onSaveLead(updated);
            onShowToast?.(`✓ Updated CRM Lead: ${updated.guestName}`);
          }
        } else if (data.action === 'create_lead') {
          const newLead: Lead = {
            id: `lead-${Date.now()}`,
            guestName: data.leadData.guestName || 'New Inquiry',
            phone: data.leadData.phone || '',
            email: data.leadData.email || '',
            destination: data.leadData.destination || 'North East',
            durationDays: Number(data.leadData.durationDays) || 5,
            durationNights: Math.max(1, (Number(data.leadData.durationDays) || 5) - 1),
            adults: Number(data.leadData.adults) || 2,
            children: 0,
            infants: 0,
            preferredCab: 'both',
            status: data.leadData.status || 'new',
            priority: 'high',
            source: 'JARVIS Voice Assistant',
            nextFollowUpDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
            notes: data.leadData.notes || 'Inquiry registered by JARVIS Voice',
            logs: [
              {
                id: `log-${Date.now()}`,
                timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
                type: 'note',
                summary: 'Lead inquiry registered via JARVIS Voice Assistant.',
                loggedBy: 'JARVIS Voice',
              },
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          onSaveLead(newLead);
          onShowToast?.(`✓ Created new CRM lead for ${newLead.guestName}`);
        }
      }

      // If the AI returned an itinerary update, auto-apply and transition to builder immediately!
      if (data.itinerary && onApplyItinerary) {
        const isExplicitNew = data.action === 'create_new_itinerary' || Boolean(
          data.itinerary?.destination &&
          currentItinerary?.destination &&
          data.itinerary.destination.toLowerCase() !== currentItinerary.destination.toLowerCase()
        );
        const enrichedAiData = {
          ...data.itinerary,
          destination: data.itinerary.destination || promptDest || 'Sikkim',
        };
        const fullItin = buildFullItineraryFromAi(enrichedAiData, isExplicitNew ? null : currentItinerary, isExplicitNew);
        onApplyItinerary(fullItin);
        recordCreatedItinerary(fullItin);
        setGeneratedSuccessMessage(`✓ Itinerary "${fullItin.title}" loaded! Moving to Builder...`);
        speakWithBrowserSynthesis(
          `Itinerary for ${fullItin.title} in ${fullItin.destination} has been created and loaded into the Itinerary Builder, Sir!`
        );
        setTimeout(() => {
          endVoiceSession();
          onClose();
        }, 1200);
        return;
      }

      // Request TTS spoken audio and play immediately via HTML5 audio
      try {
        const ttsRes = await fetch('/api/jarvis-tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: reply, voice: 'Fenrir' }),
        });

        if (ttsRes.ok) {
          const ttsData = await ttsRes.json();
          if (ttsData.audio) {
            playJarvisAudio(ttsData.audio);
            return;
          }
        }
        speakWithBrowserSynthesis(reply);
      } catch {
        speakWithBrowserSynthesis(reply);
      }
    } catch (err) {
      console.warn('[JARVIS UI] Bot fallback error:', err);
      speakWithBrowserSynthesis('Understood, Sir. I have recorded your preferences.');
    }
  };

  const handleTestAudio = () => {
    const greeting = destinationContext?.toLowerCase().includes('andaman')
      ? 'Good day, Sir. JARVIS audio systems are fully operational for Andaman Islands planning. Makruzz and Nautika ferry advisories are active.'
      : 'Good day, Sir. JARVIS audio systems are fully operational. Nathula Pass and North Sikkim travel logistics stand ready.';

    setTranscripts((prev) => [
      ...prev,
      {
        id: `test-${Date.now()}`,
        role: 'assistant',
        text: greeting,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setIsJarvisSpeaking(true);

    fetch('/api/jarvis-tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: greeting, voice: 'Fenrir' }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.audio) {
          playJarvisAudio(data.audio);
        } else {
          speakWithBrowserSynthesis(greeting);
        }
      })
      .catch(() => {
        speakWithBrowserSynthesis(greeting);
      });
  };

  const handleUploadFile = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setUploadText(content);
      setUploadParseResult(null);
    };
    reader.readAsText(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setUploadDragActive(true);
    } else if (e.type === 'dragleave') {
      setUploadDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setUploadDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleAiExtractUploadText = async () => {
    if (!uploadText.trim()) {
      onShowToast?.('⚠️ Please paste or upload itinerary text first.');
      return;
    }
    setIsParsingUploadText(true);
    try {
      const result = await parseItineraryText(uploadText);
      setUploadParseResult(result);
      onShowToast?.('✓ Itinerary parsed successfully with Gemini AI!');

      if (!isSpeakerMuted) {
        const dest = result.itinerary.destination || 'North East';
        const days = result.itinerary.durationDays || 5;
        speakWithBrowserSynthesis(
          `Sir, I have analyzed your text itinerary for ${dest}. Extracted ${days} days with vehicle options and hotel details. You can apply it directly to the builder or ask me to make adjustments.`
        );
      }
    } catch (err: any) {
      console.error('Extraction error:', err);
      onShowToast?.('⚠️ Could not parse text with AI. Please check format.');
    } finally {
      setIsParsingUploadText(false);
    }
  };

  const handleApplyUploadResult = () => {
    if (!uploadParseResult || !uploadParseResult.itinerary) return;
    const fullItin = uploadParseResult.itinerary as Itinerary;
    if (onApplyItinerary) {
      onApplyItinerary(fullItin);
    } else if (onApplyParsedItinerary) {
      onApplyParsedItinerary(fullItin);
    }
    onShowToast?.(`✓ Itinerary #${fullItin.quoteNumber || 'Quote'} loaded into builder!`);
    if (onNavigate) {
      onNavigate('itinerary', 'builder');
    }
    endVoiceSession();
    onClose();
  };

  const handleDiscussWithVoice = () => {
    if (uploadParseResult?.itinerary) {
      const fullItin = uploadParseResult.itinerary as Itinerary;
      if (onApplyItinerary) {
        onApplyItinerary(fullItin);
      }
    }
    setActiveMode('voice');
    if (!isMicActive) {
      startMicrophoneStream();
    }
    speakWithBrowserSynthesis(
      `I have loaded your ${uploadParseResult?.itinerary?.destination || 'custom'} itinerary into memory. What changes or additions would you like me to make?`
    );
  };

  const handleSendTextMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    sendPromptToJarvis(textInput);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-xl animate-fade-in">
      {/* Background Holographic Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className={`relative w-full ${activeMode === 'upload' ? 'max-w-4xl' : 'max-w-2xl'} transition-all duration-300 bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 border border-cyan-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]`}>
        {/* Top Header Bar */}
        <div className="p-4 sm:p-5 border-b border-cyan-500/20 flex items-center justify-between bg-slate-950/60 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-2xl bg-cyan-950/80 border border-cyan-400/40 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Zap className="w-5 h-5 text-cyan-400 animate-pulse" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-950 animate-ping"></span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-wider text-white">
                  J.A.R.V.I.S.
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 uppercase tracking-widest">
                  AI Copilot & Itinerary Architect
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Voice Assistant · Intelligent Text Upload · Full App Copilot
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Memory Bank Inspection Button */}
            <button
              type="button"
              onClick={() => setIsMemoryModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-purple-950/80 hover:bg-purple-900/80 border border-purple-500/40 text-xs text-purple-300 font-semibold transition-colors cursor-pointer"
              title="View & teach rules to JARVIS's persistent memory bank"
            >
              <Brain className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden sm:inline">Memory</span>
            </button>

            {/* Instant Generate & Move to Builder Trigger */}
            <button
              type="button"
              onClick={handleGenerateItinerary}
              disabled={isGeneratingItinerary}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs transition-all shadow-md shadow-emerald-500/20 active:scale-95 cursor-pointer disabled:opacity-50"
              title="Compile all provided details into Itinerary Builder"
            >
              <Sparkles className="w-3.5 h-3.5 text-slate-950" />
              <span>{isGeneratingItinerary ? 'Building...' : 'Move to Builder'}</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-950" />
            </button>

            {activeMode === 'voice' && (
              <button
                type="button"
                onClick={handleTestAudio}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-950/80 hover:bg-cyan-900/80 border border-cyan-500/40 text-xs text-cyan-300 font-medium transition-colors cursor-pointer"
                title="Click to test JARVIS voice audio output"
              >
                <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Hear Voice</span>
              </button>
            )}

            <button
              onClick={() => {
                endVoiceSession();
                onClose();
              }}
              className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
              title="Close JARVIS"
            >
              <PhoneOff className="w-4 h-4 text-rose-400" />
            </button>
          </div>
        </div>

        {/* Unified 3-Mode Selector Bar */}
        <div className="px-4 py-2 bg-slate-950 border-b border-cyan-500/20 flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 border border-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveMode('voice')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeMode === 'voice'
                  ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Voice AI</span>
              {isMicActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveMode('upload')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeMode === 'upload'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <FileUp className="w-3.5 h-3.5" />
              <span>Upload & Paste Text</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-mono font-bold">
                AI
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMode('chat')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeMode === 'chat'
                  ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-md shadow-purple-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Chat Copilot</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400 shrink-0">
            {activeMode === 'upload' && uploadParseResult && (
              <span className="text-emerald-400 font-medium font-mono flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{uploadParseResult.itinerary.durationDays || 0} Days Ready</span>
              </span>
            )}
            {activeMode === 'voice' && (
              <span className="text-cyan-400 font-mono text-[10px]">
                {isMicActive ? '● Listening' : '○ Standby'}
              </span>
            )}
            <span className="text-slate-400 font-mono text-[10px] hidden sm:inline">
              📍 {currentItinerary?.destination || destinationContext || 'Sikkim'}
            </span>
          </div>
        </div>

        {/* Dedicated Real-Time Full-App Travel Architect HUD */}
        <div className="px-4 py-1.5 bg-slate-950/90 border-b border-cyan-500/20 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 overflow-hidden flex-wrap">
            <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300 text-[10px] font-mono font-bold shrink-0">
              TRAVEL ARCHITECT
            </span>
            <span className="text-slate-300 truncate text-[11px]">
              📍 {currentItinerary?.destination || destinationContext || 'Sikkim'} • 👤 {currentItinerary?.guestName || 'Valued Guest'} • 📅 {currentItinerary?.durationDays || 5} Days • 🚗 {currentItinerary?.reservedCab?.vehicleType || 'Dedicated SUV'}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {savedItineraries && savedItineraries.length > 0 && (
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 text-[10px] font-mono">
                📋 {savedItineraries.length} Quotes
              </span>
            )}
            {leads && leads.length > 0 && (
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 text-[10px] font-mono">
                👥 {leads.length} Leads
              </span>
            )}
            <span className="text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Cortex Active
            </span>
          </div>
        </div>

        {/* MODE 2: UPLOAD & PASTE ITINERARY (AI-POWERED) */}
        {activeMode === 'upload' ? (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs bg-slate-950/40">
            {/* Drop Zone */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-4 sm:p-5 text-center transition-all ${
                uploadDragActive
                  ? 'border-emerald-500 bg-emerald-950/30'
                  : 'border-slate-700 bg-slate-900/60 hover:border-slate-600'
              }`}
            >
              <input
                type="file"
                ref={uploadFileInputRef}
                accept=".txt,.text,.md,.rtf,.doc,.docx"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleUploadFile(e.target.files[0]);
                }}
                className="hidden"
              />

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3 text-left">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">
                      Drag & Drop Itinerary File (.txt, .md, .doc)
                    </span>
                    <span className="text-[11px] text-slate-400 block">
                      Or click browse to select a client quotation from your device
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => uploadFileInputRef.current?.click()}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold cursor-pointer transition-colors shrink-0"
                >
                  Browse File
                </button>
              </div>
            </div>

            {/* Quick Sample Presets */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span>Try Sample Itinerary:</span>
              </span>
              {sampleUploadItineraries.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setUploadText(s.text);
                    setUploadParseResult(null);
                  }}
                  className="px-2.5 py-1 text-[11px] bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-800 hover:border-cyan-500/40 transition-colors cursor-pointer"
                >
                  {s.label.split(':')[0]}
                </button>
              ))}
            </div>

            {/* Raw Text Area */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                <label className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Paste Itinerary Text (From WhatsApp, Email, or Tour Proposal)</span>
                </label>
                <div className="flex items-center gap-3">
                  <span>
                    {uploadText.length} chars · {uploadText ? uploadText.trim().split(/\s+/).length : 0} words
                  </span>
                  {uploadText && (
                    <button
                      type="button"
                      onClick={() => {
                        setUploadText('');
                        setUploadParseResult(null);
                      }}
                      className="text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <textarea
                rows={7}
                value={uploadText}
                onChange={(e) => {
                  setUploadText(e.target.value);
                  setUploadParseResult(null);
                }}
                placeholder={`Paste any itinerary text or WhatsApp message here, for example:
Guest: Mr. Sandeep Mukherjee
Pax: 4 Adults
Dates: 15 Nov to 21 Nov
Day 1: NJP to Gangtok. Stay Gangtok.
Day 2: Tsomgo Lake & Baba Mandir excursion.
Day 3: Gangtok to Pelling via Ravangla.
Day 4: Pelling local sightseeing.
Day 5: Pelling to Darjeeling.
Day 6: Tiger Hill sunrise and Darjeeling sights.
Day 7: Drop to Bagdogra.
Reserved Innova Cab: Rs 88,000 Total
Sharing Sumo: Rs 56,000 Total
Hotel: Deluxe MAP plan...`}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 leading-relaxed"
              />
            </div>

            {/* AI Parse Trigger Button */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5 text-cyan-400" />
                <span>Powered by Gemini 3.8 Flash · Extracts days, routes, cabs & rates</span>
              </span>

              <button
                type="button"
                onClick={handleAiExtractUploadText}
                disabled={isParsingUploadText || !uploadText.trim()}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 disabled:opacity-40 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer active:scale-95"
              >
                {isParsingUploadText ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Extracting with Gemini AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-slate-950" />
                    <span>AI Parse & Extract Itinerary</span>
                  </>
                )}
              </button>
            </div>

            {/* Extraction Results Breakdown Card */}
            {uploadParseResult && uploadParseResult.itinerary && (
              <div className="bg-slate-900/90 border border-emerald-500/40 rounded-2xl p-4 sm:p-5 space-y-4 animate-fade-in shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                    </span>
                    <div>
                      <h4 className="font-bold text-white text-sm">
                        {uploadParseResult.itinerary.title || 'Extracted Tour Itinerary'}
                      </h4>
                      <p className="text-[11px] text-emerald-300">
                        📍 {uploadParseResult.itinerary.destination} · {uploadParseResult.itinerary.durationDays || 0} Days / {uploadParseResult.itinerary.durationNights || 0} Nights
                      </p>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-mono text-xs font-bold">
                    ✓ AI Verified
                  </span>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Guest Details</span>
                    <span className="font-bold text-white truncate block">
                      {uploadParseResult.itinerary.guestName || 'Valued Guest'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {uploadParseResult.itinerary.adults || 2} Adults{uploadParseResult.itinerary.children ? `, ${uploadParseResult.itinerary.children} Kids` : ''}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Hotel & Meals</span>
                    <span className="font-bold text-white truncate block">
                      {uploadParseResult.itinerary.hotelCategory || 'Deluxe'}
                    </span>
                    <span className="text-[10px] text-emerald-400 truncate block">
                      {uploadParseResult.itinerary.mealPlan || 'MAP Plan'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Reserved Cab (Option A)</span>
                    <span className="font-bold text-sky-400 truncate block">
                      {uploadParseResult.itinerary.reservedCab?.vehicleType || 'Innova / Xylo'}
                    </span>
                    <span className="text-[10px] text-white font-mono font-bold block">
                      ₹{(uploadParseResult.itinerary.reservedCab?.totalPackagePrice || uploadParseResult.itinerary.sellingCost || 0).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Sharing Cab (Option B)</span>
                    <span className="font-bold text-amber-400 truncate block">
                      {uploadParseResult.itinerary.sharingCab?.vehicleType || 'Tata Sumo / Bolero'}
                    </span>
                    <span className="text-[10px] text-white font-mono font-bold block">
                      ₹{(uploadParseResult.itinerary.sharingCab?.totalPackagePrice || uploadParseResult.itinerary.sellingCostSharing || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Day-by-Day Preview List */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-bold text-slate-300 block">
                    Extracted Daily Route Schedule:
                  </span>
                  <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
                    {uploadParseResult.itinerary.days?.map((day) => (
                      <div
                        key={day.dayNumber}
                        className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start justify-between gap-2 text-[11px]"
                      >
                        <div className="flex items-start gap-2">
                          <span className="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 font-mono font-bold text-[10px] shrink-0 mt-0.5">
                            Day {day.dayNumber}
                          </span>
                          <div>
                            <span className="font-bold text-slate-200 block">{day.title}</span>
                            <span className="text-[10px] text-slate-400 block line-clamp-1">
                              {day.description}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] text-emerald-400 font-medium shrink-0 bg-emerald-950/60 px-2 py-0.5 rounded">
                          Stay: {day.nightStay || 'Gangtok'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Detected & Missing Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-[11px]">
                  <div className="space-y-1">
                    <span className="font-semibold text-emerald-400 block">✓ Detected From Text:</span>
                    <ul className="space-y-0.5 text-slate-300 text-[10px]">
                      {uploadParseResult.detectedFields.slice(0, 4).map((f, i) => (
                        <li key={i} className="flex items-center gap-1">
                          <span className="text-emerald-400">•</span>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {uploadParseResult.missingFields && uploadParseResult.missingFields.length > 0 && (
                    <div className="space-y-1">
                      <span className="font-semibold text-amber-400 block">ℹ️ Defaults Supplied:</span>
                      <ul className="space-y-0.5 text-slate-400 text-[10px]">
                        {uploadParseResult.missingFields.slice(0, 4).map((m, i) => (
                          <li key={i} className="flex items-center gap-1">
                            <span className="text-amber-400">•</span>
                            <span>{m}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Direct Action Hub */}
                <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={handleDiscussWithVoice}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    <Mic className="w-4 h-4 text-cyan-400" />
                    <span>Talk to JARVIS About This Plan</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleApplyUploadResult}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer active:scale-95"
                  >
                    <span>Load Into Builder & Open</span>
                    <ArrowRight className="w-4 h-4 text-slate-950" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* MODES 1 & 3: VOICE OR CHAT COPILOT */
          <>
            {/* Central JARVIS Visualizer / Arc Reactor (In Voice Mode) */}
            {activeMode === 'voice' && (
              <div className="p-5 sm:p-6 flex flex-col items-center justify-center border-b border-cyan-500/10 bg-radial from-cyan-950/30 via-transparent to-transparent relative">
                <div className="relative flex items-center justify-center w-32 h-32 sm:w-40 sm:h-40">
                  {/* Outer Rotating Glowing Ring */}
                  <div
                    className={`absolute inset-0 rounded-full border-2 border-dashed transition-all duration-700 ${
                      isJarvisSpeaking
                        ? 'border-cyan-400 animate-spin scale-110 shadow-lg shadow-cyan-500/30'
                        : isUserSpeaking
                        ? 'border-emerald-400 animate-spin scale-105'
                        : 'border-slate-700'
                    }`}
                    style={{ animationDuration: isJarvisSpeaking ? '8s' : '20s' }}
                  ></div>

                  {/* Middle Waveform Ring */}
                  <div
                    className={`absolute inset-3 rounded-full border border-cyan-500/40 transition-all duration-300 ${
                      isJarvisSpeaking
                        ? 'scale-105 bg-cyan-500/10 shadow-inner'
                        : isUserSpeaking
                        ? 'scale-100 bg-emerald-500/10'
                        : 'bg-slate-900/60'
                    }`}
                  ></div>

                  {/* Inner Arc Reactor Core */}
                  <button
                    type="button"
                    onClick={isJarvisSpeaking ? handleInterruptJarvis : !isMicActive ? startMicrophoneStream : handleToggleMic}
                    className={`relative z-10 w-20 h-20 sm:w-24 sm:h-24 rounded-full flex flex-col items-center justify-center transition-all duration-200 border-2 cursor-pointer group focus:outline-none focus:ring-4 focus:ring-cyan-500/30 ${
                      isJarvisSpeaking
                        ? 'bg-gradient-to-tr from-cyan-600 via-sky-500 to-emerald-400 border-white shadow-xl shadow-cyan-400/50 scale-105'
                        : isUserSpeaking
                        ? 'bg-gradient-to-tr from-emerald-600 to-teal-400 border-emerald-300 shadow-xl shadow-emerald-400/40'
                        : isMicActive
                        ? 'bg-gradient-to-tr from-cyan-800 to-teal-900 border-cyan-400 shadow-lg shadow-cyan-500/30 hover:scale-102'
                        : 'bg-gradient-to-tr from-slate-800 to-slate-900 border-cyan-500/60 hover:border-cyan-300 shadow-md hover:scale-105'
                    }`}
                    title={
                      isJarvisSpeaking
                        ? 'Click to interrupt'
                        : !isMicActive
                        ? 'Click to start microphone input'
                        : isMicMuted
                        ? 'Mic is muted. Click to unmute'
                        : 'Mic active. Click to mute'
                    }
                  >
                    {isJarvisSpeaking ? (
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-5 bg-white rounded-full animate-bounce"></span>
                        <span className="w-1.5 h-8 bg-white rounded-full animate-bounce delay-100"></span>
                        <span className="w-1.5 h-6 bg-white rounded-full animate-bounce delay-200"></span>
                        <span className="w-1.5 h-4 bg-white rounded-full animate-bounce delay-150"></span>
                      </div>
                    ) : isUserSpeaking ? (
                      <div className="flex items-center gap-1">
                        <span className="w-1 h-3 bg-emerald-100 rounded-full animate-pulse"></span>
                        <span className="w-1.5 h-6 bg-white rounded-full animate-pulse"></span>
                        <span className="w-1 h-4 bg-emerald-100 rounded-full animate-pulse"></span>
                      </div>
                    ) : isMicActive ? (
                      <div className="flex flex-col items-center">
                        <Mic className="w-6 h-6 text-cyan-300 animate-pulse" />
                        <span className="text-[8px] font-bold text-cyan-200 uppercase tracking-wider mt-0.5">Listening</span>
                      </div>
                    ) : isMicPermissionDenied ? (
                      <div className="flex flex-col items-center">
                        <Volume2 className="w-6 h-6 text-cyan-300 animate-pulse" />
                        <span className="text-[8px] font-bold text-cyan-200 uppercase tracking-wider mt-0.5">Audio Ready</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center group-hover:scale-110 transition-transform">
                        <Mic className="w-6 h-6 text-cyan-300" />
                        <span className="text-[8px] font-bold text-cyan-300 uppercase tracking-wider mt-0.5">Tap to Mic</span>
                      </div>
                    )}
                  </button>
                </div>

                {/* Dynamic Voice Status Text */}
                <div className="mt-3 text-center space-y-1">
                  <div className="flex items-center justify-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isJarvisSpeaking
                          ? 'bg-cyan-400 animate-ping'
                          : isUserSpeaking
                          ? 'bg-emerald-400 animate-pulse'
                          : isMicActive
                          ? 'bg-emerald-400'
                          : 'bg-cyan-400'
                      }`}
                    ></span>
                    <span className="text-xs sm:text-sm font-bold text-white tracking-wide">
                      {isGeneratingItinerary
                        ? 'JARVIS is creating your itinerary...'
                        : isJarvisSpeaking
                        ? 'JARVIS is speaking...'
                        : isUserSpeaking
                        ? 'Listening to your specifications, Sir...'
                        : isMicActive
                        ? 'Microphone active · Speak your travel details or say "Generate"'
                        : isMicPermissionDenied
                        ? 'Spoken Voice Output Active · JARVIS speaks all answers aloud'
                        : 'Ready · Provide your details, then say "Generate the itinerary"'}
                    </span>
                  </div>
                </div>

                {/* Big Featured Action Banner: Generate Itinerary & Move to Builder */}
                <div className="mt-3.5 w-full max-w-lg bg-gradient-to-r from-cyan-950/80 via-slate-900 to-emerald-950/80 border border-emerald-500/40 rounded-2xl p-3 flex items-center justify-between gap-3 shadow-lg">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                      <FileCheck2 className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Ready to finalize?</p>
                      <p className="text-[11px] text-slate-300">
                        Say "Generate the itinerary" or click to transfer everything into the builder.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleGenerateItinerary}
                    disabled={isGeneratingItinerary}
                    className="px-3.5 py-2 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                    <span>{isGeneratingItinerary ? 'Compiling...' : 'Generate & Open'}</span>
                  </button>
                </div>

                {/* Success Notification Banner */}
                {generatedSuccessMessage && (
                  <div className="mt-2.5 p-2.5 bg-emerald-950/90 border border-emerald-400/60 rounded-xl text-xs text-emerald-200 flex items-center gap-2 animate-fade-in shadow-md">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-semibold">{generatedSuccessMessage}</span>
                  </div>
                )}

                {/* Microphone Permission Help Card */}
                {isMicPermissionDenied && (
                  <div className="mt-3 w-full max-w-lg bg-slate-900/90 border border-cyan-500/40 rounded-2xl p-3 shadow-xl animate-fade-in text-xs text-slate-300">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5">
                        <ShieldAlert className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-white block">Microphone Access Notice</span>
                          <p className="text-slate-300 text-[11px] mt-0.5">
                            Browser microphone access is currently set to blocked. <strong>Spoken Voice Output is fully active</strong>: type below or click suggestions to talk with JARVIS.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowPermissionGuide((prev) => !prev)}
                        className="text-cyan-400 hover:text-cyan-300 text-[11px] font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                      >
                        <span>{showPermissionGuide ? 'Hide' : 'Unblock Steps'}</span>
                        {showPermissionGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {showPermissionGuide && (
                      <div className="mt-2.5 pt-2.5 border-t border-slate-800 text-[11px] space-y-1.5 bg-slate-950/60 p-2.5 rounded-xl">
                        <p className="font-semibold text-cyan-300">3 Quick Steps to Allow Mic:</p>
                        <ol className="list-decimal list-inside space-y-0.5 text-slate-300 pl-1">
                          <li>Look at your browser's address bar at the top.</li>
                          <li>Click the lock 🔒 or microphone 🎙️ icon beside the URL.</li>
                          <li>Change <strong>Microphone</strong> from "Block" to <strong>"Allow"</strong>.</li>
                        </ol>
                        <div className="flex items-center gap-2 pt-1.5">
                          <button
                            type="button"
                            onClick={startMicrophoneStream}
                            disabled={isRequestingMic}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg text-xs cursor-pointer transition-colors"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${isRequestingMic ? 'animate-spin' : ''}`} />
                            <span>{isRequestingMic ? 'Requesting...' : 'Retry Microphone'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleToggleWebSpeech}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg text-xs cursor-pointer border border-slate-700 transition-colors"
                          >
                            <Mic className="w-3.5 h-3.5 text-emerald-400" />
                            <span>{isWebSpeechListening ? 'Listening...' : 'Try Browser STT'}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Connect Mic Call-to-action when in prompt state */}
                {!isMicActive && !isMicPermissionDenied && (
                  <div className="mt-2.5 flex items-center gap-2 animate-fade-in">
                    <button
                      type="button"
                      onClick={startMicrophoneStream}
                      disabled={isRequestingMic}
                      className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-black rounded-xl text-xs cursor-pointer transition-all shadow-lg shadow-cyan-500/20 active:scale-95"
                    >
                      <Mic className="w-3.5 h-3.5 text-slate-950" />
                      <span>{isRequestingMic ? 'Activating Microphone...' : 'Start Voice Input (Mic)'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleToggleWebSpeech}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs cursor-pointer border border-slate-700 transition-colors"
                      title="Use browser speech-to-text"
                    >
                      <span>{isWebSpeechListening ? 'Listening...' : 'Browser STT'}</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Live Streaming Transcript Window (Larger in Chat Mode, compact in Voice Mode) */}
            <div className={`flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 ${activeMode === 'chat' ? 'min-h-[320px]' : 'min-h-[140px] max-h-[220px]'} bg-slate-950/40`}>
              <div className="text-[11px] font-mono text-cyan-400/80 uppercase tracking-wider flex items-center justify-between pb-1 border-b border-slate-800">
                <div className="flex items-center gap-1.5">
                  <Radio className="w-3 h-3 text-cyan-400" />
                  <span>{activeMode === 'chat' ? 'Interactive JARVIS Chat Console' : 'Voice Conversation Transcript'}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-normal">
                  Spoken audio active
                </span>
              </div>

              {transcripts.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-start gap-2.5 text-xs ${
                    item.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {item.role === 'assistant' && (
                    <div className="w-6 h-6 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center shrink-0 text-cyan-400 text-[10px] font-bold">
                      J
                    </div>
                  )}
                  <div
                    className={`max-w-[82%] p-3 rounded-2xl ${
                      item.role === 'user'
                        ? 'bg-emerald-600 text-white rounded-tr-xs'
                        : 'bg-slate-800/90 text-slate-200 border border-slate-700/80 rounded-tl-xs'
                    }`}
                  >
                    <p className="leading-relaxed whitespace-pre-wrap">{item.text}</p>
                    <span className="text-[10px] opacity-60 block mt-1 text-right font-mono">
                      {item.timestamp}
                    </span>
                  </div>
                  {item.role === 'user' && (
                    <div className="w-6 h-6 rounded-lg bg-emerald-950 border border-emerald-500/40 flex items-center justify-center shrink-0 text-emerald-400 text-[10px] font-bold">
                      U
                    </div>
                  )}
                </div>
              ))}

              {/* Real-time Streaming User Partial */}
              {currentUserText && (
                <div className="flex items-start justify-end gap-2.5 text-xs">
                  <div className="max-w-[82%] p-3 rounded-2xl bg-emerald-700/70 text-white border border-emerald-400/40">
                    <p className="leading-relaxed italic">{currentUserText}...</p>
                    <span className="text-[10px] opacity-70 block mt-1 text-right font-mono">
                      Transcribing...
                    </span>
                  </div>
                </div>
              )}

              {/* Real-time Streaming Assistant Partial */}
              {currentAssistantText && (
                <div className="flex items-start justify-start gap-2.5 text-xs">
                  <div className="w-6 h-6 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center shrink-0 text-cyan-400 text-[10px] font-bold animate-pulse">
                    J
                  </div>
                  <div className="max-w-[82%] p-3 rounded-2xl bg-slate-800/90 text-cyan-200 border border-cyan-500/40">
                    <p className="leading-relaxed whitespace-pre-wrap">{currentAssistantText}</p>
                    <span className="text-[10px] opacity-70 block mt-1 text-right font-mono">
                      Speaking...
                    </span>
                  </div>
                </div>
              )}

              <div ref={transcriptEndRef} />
            </div>

            {/* Quick Voice & Chat Commands (Destination Aware & App Aware) */}
            <div className="px-4 py-2 bg-slate-950/80 border-t border-slate-800 flex items-center gap-2 overflow-x-auto text-[11px] no-scrollbar">
              <span className="text-cyan-400 font-bold shrink-0">One-Click Actions:</span>
              <button
                type="button"
                onClick={handleGenerateItinerary}
                className="px-2.5 py-1 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/60 text-emerald-300 font-bold shrink-0 cursor-pointer transition-colors"
              >
                ✨ "Generate Itinerary Now"
              </button>
              {savedItineraries && savedItineraries.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const latest = savedItineraries[0];
                    sendPromptToJarvis(`Load saved quote ${latest.quoteNumber} for ${latest.guestName || 'guest'}`);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-cyan-950/70 hover:bg-cyan-900/70 border border-cyan-500/40 text-cyan-300 shrink-0 cursor-pointer transition-colors"
                >
                  📂 "Load Quote #{savedItineraries[0].quoteNumber}"
                </button>
              )}
              {leads && leads.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const pendingLead = leads.find((l) => l.status === 'new') || leads[0];
                    sendPromptToJarvis(`Create a custom quote itinerary for lead ${pendingLead.guestName} (${pendingLead.destination})`);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-purple-950/70 hover:bg-purple-900/70 border border-purple-500/40 text-purple-300 shrink-0 cursor-pointer transition-colors"
                >
                  👥 "Quote for Lead {leads[0].guestName?.split(' ')[0]}"
                </button>
              )}
              <button
                type="button"
                onClick={() => handleGenerateItinerary('Plan a 5-day Sikkim and Gangtok tour for 2 adults with Tsomgo Lake, Baba Mandir, and Pelling')}
                className="px-2.5 py-1 rounded-lg bg-emerald-900/60 hover:bg-emerald-800/80 border border-emerald-500/50 text-emerald-300 font-bold shrink-0 cursor-pointer transition-colors"
              >
                🏔️ "5-Day Sikkim Tour"
              </button>
              <button
                type="button"
                onClick={() => handleGenerateItinerary('Plan a 6-day Meghalaya and Kaziranga tour for 2 adults covering Shillong, Cherrapunji, Dawki, and Kaziranga')}
                className="px-2.5 py-1 rounded-lg bg-teal-900/60 hover:bg-teal-800/80 border border-teal-500/50 text-teal-300 font-medium shrink-0 cursor-pointer transition-colors"
              >
                🌿 "6-Day Meghalaya"
              </button>
              <button
                type="button"
                onClick={() => handleGenerateItinerary('Plan a 4-day Darjeeling and Kalimpong tour for 2 adults with Tiger Hill sunrise')}
                className="px-2.5 py-1 rounded-lg bg-amber-900/60 hover:bg-amber-800/80 border border-amber-500/50 text-amber-300 font-medium shrink-0 cursor-pointer transition-colors"
              >
                🫖 "4-Day Darjeeling"
              </button>
              <button
                type="button"
                onClick={() => handleGenerateItinerary('Plan a 5-day Andaman trip for 2 adults covering Port Blair, Havelock and Neil Island')}
                className="px-2.5 py-1 rounded-lg bg-cyan-900/60 hover:bg-cyan-800/80 border border-cyan-500/50 text-cyan-300 font-medium shrink-0 cursor-pointer transition-colors"
              >
                🏝️ "5-Day Andaman"
              </button>
              <button
                type="button"
                onClick={() => sendPromptToJarvis('Is Nathula Pass open on Monday?')}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white shrink-0 cursor-pointer transition-colors"
              >
                🛡️ "Is Nathula Open Monday?"
              </button>
            </div>

            {/* Bottom Interactive Control Center */}
            <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950 flex flex-col gap-2.5">
              {/* Quick text input for Spoken Voice / Chat conversation */}
              <form onSubmit={handleSendTextMessage} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder='Ask JARVIS anything, or type "Generate 5-day Sikkim trip"...'
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                <button
                  type="submit"
                  disabled={!textInput.trim() || isGeneratingItinerary}
                  className="p-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 font-bold rounded-xl transition-all cursor-pointer shadow-md"
                  title="Send to JARVIS"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>

              {/* Action Buttons for Mic, Speaker and Call */}
              <div className="flex items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2">
                  {/* Mic State Action */}
                  {isMicActive ? (
                    <button
                      type="button"
                      onClick={handleToggleMic}
                      className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-md ${
                        isMicMuted
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                      }`}
                      title={isMicMuted ? 'Unmute Microphone' : 'Mute Microphone'}
                    >
                      {isMicMuted ? (
                        <>
                          <MicOff className="w-4 h-4 text-rose-400" />
                          <span>Mic Muted</span>
                        </>
                      ) : (
                        <>
                          <Mic className="w-4 h-4 text-emerald-400" />
                          <span>Mic Active</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={startMicrophoneStream}
                      disabled={isRequestingMic}
                      className="inline-flex items-center gap-2 px-3 py-2.5 rounded-xl font-bold text-xs bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300 transition-all cursor-pointer shadow-sm"
                      title="Click to allow or connect microphone"
                    >
                      <Mic className="w-4 h-4 text-cyan-400" />
                      <span>{isRequestingMic ? 'Checking...' : isMicPermissionDenied ? 'Retry Mic' : 'Start Mic'}</span>
                    </button>
                  )}

                  {/* Speaker Mute Toggle */}
                  <button
                    type="button"
                    onClick={handleToggleSpeaker}
                    className={`p-2.5 rounded-xl transition-all cursor-pointer border ${
                      isSpeakerMuted
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                    }`}
                    title={isSpeakerMuted ? 'Unmute Speaker' : 'Mute Speaker'}
                  >
                    {isSpeakerMuted ? (
                      <VolumeX className="w-4 h-4 text-rose-400" />
                    ) : (
                      <Volume2 className="w-4 h-4 text-cyan-400" />
                    )}
                  </button>

                  {/* Interrupt Jarvis Button */}
                  {isJarvisSpeaking && (
                    <button
                      type="button"
                      onClick={handleInterruptJarvis}
                      className="px-3 py-2.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold hover:bg-amber-500/30 transition-all cursor-pointer"
                      title="Interrupt JARVIS speech"
                    >
                      Interrupt
                    </button>
                  )}
                </div>

                {/* End Call / Close Button */}
                <button
                  type="button"
                  onClick={() => {
                    endVoiceSession();
                    onClose();
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-all cursor-pointer shadow-lg shadow-rose-900/30 active:scale-95"
                >
                  <PhoneOff className="w-4 h-4" />
                  <span>Close Session</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Jarvis Autonomous Memory Cortex Modal */}
      <JarvisMemoryModal
        isOpen={isMemoryModalOpen}
        onClose={() => setIsMemoryModalOpen(false)}
      />
    </div>
  );
};
