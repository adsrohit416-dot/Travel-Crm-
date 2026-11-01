import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  X,
  RotateCcw,
  Bot,
  User,
  CheckCircle2,
  ArrowRight,
  Maximize2,
  Minimize2,
  Calendar,
  MapPin,
  Car,
  Building,
  DollarSign,
  TrendingUp,
  FileText,
  AlertCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Mic,
  Volume2,
  VolumeX,
  Brain,
  Moon,
  FolderOpen,
  Users,
  Eye,
  PlusCircle,
} from 'lucide-react';
import { playJarvisSleepChime } from '../../utils/audioUtils';
import { Itinerary, Lead, LeadStatus } from '../../types';
import { buildFullItineraryFromAi } from '../../utils/itineraryBuilderHelper';
import { parseDestinationFromText } from '../../utils/destinationParser';
import {
  getFormattedMemoryPrompt,
  learnFromExchange,
  recordCreatedItinerary,
} from '../../utils/jarvisMemory';
import { JarvisMemoryModal } from '../jarvis/JarvisMemoryModal';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  hasItineraryUpdate?: boolean;
  itinerary?: Partial<Itinerary> | null;
  suggestedPrompts?: string[];
  actionMeta?: {
    action?: string;
    targetQuoteNumber?: string;
    leadName?: string;
  };
}

interface AIAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentItinerary: Itinerary | null;
  onApplyItinerary: (itinerary: Itinerary) => void;
  onShowToast: (message: string) => void;
  initialPrompt?: string;
  onClearInitialPrompt?: () => void;
  onOpenVoiceModal?: () => void;
  savedItineraries?: Itinerary[];
  leads?: Lead[];
  onSelectItinerary?: (itinerary: Itinerary) => void;
  onSaveLead?: (lead: Lead) => void;
  onUpdateLeadStatus?: (leadId: string, status: LeadStatus, note?: string) => void;
  onNavigate?: (tab: 'home' | 'itinerary' | 'leads' | 'accounts' | 'saved', mode?: 'builder' | 'preview') => void;
}

export const AIAssistantDrawer: React.FC<AIAssistantDrawerProps> = ({
  isOpen,
  onClose,
  currentItinerary,
  onApplyItinerary,
  onShowToast,
  initialPrompt,
  onClearInitialPrompt,
  onOpenVoiceModal,
  savedItineraries = [],
  leads = [],
  onSelectItinerary,
  onSaveLead,
  onUpdateLeadStatus,
  onNavigate,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome-msg',
      role: 'assistant',
      content: `Greetings! I am **JARVIS**, your Senior AI Travel Architect and Personal Assistant for North East Destinations.

At your service:
- 🎙️ **Live Voice Mode**: You can talk directly to me via real-time speech!
- 🪄 **Create complete itineraries** from simple commands (e.g. *"JARVIS, prepare a 5D/4N luxury Sikkim tour for 4 adults"*).
- ✨ **Rewrite all tour days** with captivating, DMC storytelling, mountain driving times, and scenic photo stops.
- 🔄 **Adjust parameters instantly** (dates, passenger count, luxury hotel tiers, or dedicated cab fleets).
- 💰 **Calculate package net costs, selling quotes, and agency commissions**.

How may I assist you today, Sir?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestedPrompts: [
        '✨ Rewrite all itinerary days in a perfect way',
        '🪄 Create 5D/4N Sikkim & Gangtok tour for 2 adults',
        '🌿 Plan 6D Meghalaya (Shillong, Cherrapunji, Dawki)',
        '🏨 Upgrade to 4-Star Super Deluxe category',
      ],
    },
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedModel, setSelectedModel] = useState<'gemini-3.8-flash' | 'gemini-3.1-flash-lite'>('gemini-3.8-flash');
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);
  const [appliedMessageId, setAppliedMessageId] = useState<string | null>(null);
  const [previewDayDetails, setPreviewDayDetails] = useState<string | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Clean up audio on unmount or drawer close
  useEffect(() => {
    return () => {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
    };
  }, []);

  const handleToggleSpeak = async (msgId: string, text: string) => {
    if (playingAudioId === msgId) {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
      setPlayingAudioId(null);
      return;
    }

    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }

    setPlayingAudioId(msgId);
    try {
      const cleanText = text
        .replace(/[*#_`]/g, '')
        .replace(/\[.*?\]/g, '')
        .replace(/https?:\/\/\S+/g, '')
        .trim();

      const res = await fetch('/api/jarvis-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleanText.slice(0, 800) }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.audio) {
          const binary = atob(data.audio);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
          }
          const blob = new Blob([bytes], { type: data.mimeType || 'audio/wav' });
          const audioUrl = URL.createObjectURL(blob);
          const audio = new Audio(audioUrl);
          currentAudioRef.current = audio;
          audio.onended = () => {
            setPlayingAudioId(null);
            currentAudioRef.current = null;
            URL.revokeObjectURL(audioUrl);
          };
          audio.onerror = () => {
            speakWithBrowserTts(cleanText);
          };
          await audio.play();
          return;
        }
      }
      speakWithBrowserTts(cleanText);
    } catch (err) {
      console.warn('Backend TTS failed, using browser synthesis:', err);
      speakWithBrowserTts(text);
    }
  };

  const speakWithBrowserTts = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const clean = text.replace(/[*#_`]/g, '').trim().slice(0, 500);
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.rate = 1.0;
      utterance.pitch = 0.95;
      utterance.onend = () => setPlayingAudioId(null);
      utterance.onerror = () => setPlayingAudioId(null);
      window.speechSynthesis.speak(utterance);
    } else {
      setPlayingAudioId(null);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, messages]);

  // When opened with an initialPrompt (e.g., from "AI Rewrite All Days" or "AI Polish Day")
  useEffect(() => {
    if (isOpen && initialPrompt && initialPrompt.trim()) {
      handleSendMessage(initialPrompt);
      if (onClearInitialPrompt) {
        onClearInitialPrompt();
      }
    }
  }, [isOpen, initialPrompt]);

  const handleSendMessage = async (textToSend?: string, actionOverride?: string) => {
    const text = (textToSend || inputPrompt).trim();
    if (!text || isLoading) return;

    // Check if user is putting JARVIS to sleep
    const isSleep =
      /\b(jarvis\s*sleep|sleep\s*jarvis|go\s*to\s*sleep|sleep\s*now|close\s*jarvis|jarvis\s*close|good\s*night\s*jarvis|shutdown\s*jarvis|jarvis\s*bye|bye\s*jarvis|standby\s*jarvis|jarvis\s*standby)\b/i.test(
        text
      ) || /^(sleep|go to sleep|sleep now|good night|bye)$/i.test(text);

    if (isSleep) {
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      const sleepAssistantMessage: ChatMessage = {
        id: `ai-sleep-${Date.now()}`,
        role: 'assistant',
        content: 'Going to sleep now, Sir. Standby mode engaged. You can wake me whenever you need to build or polish an itinerary.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, userMessage, sleepAssistantMessage]);
      setInputPrompt('');
      playJarvisSleepChime();
      onShowToast('💤 JARVIS is now in standby / sleep mode.');
      setTimeout(() => {
        onClose();
      }, 1000);
      return;
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputPrompt('');
    setIsLoading(true);

    try {
      // Filter out static welcome message and previous error bubbles so Gemini receives a clean conversation
      const conversationHistory = [...messages, userMessage]
        .filter((m) => m.id !== 'welcome-msg' && !m.id.startsWith('err-') && m.content.trim().length > 0)
        .map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          content: m.content,
        }));

      const promptDest = parseDestinationFromText(
        text,
        conversationHistory,
        currentItinerary?.destination
      );

      const isExplicitNew = Boolean(
        promptDest &&
          currentItinerary?.destination &&
          promptDest.toLowerCase() !== currentItinerary.destination.toLowerCase()
      ) || /create.*new|new.*itinerary|plan.*tour|create.*tour|different.*destination|5-day|north sikkim|darjeeling/i.test(text);

      const response = await fetch('/api/ai-itinerary-bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: conversationHistory,
          currentItinerary: isExplicitNew ? null : currentItinerary,
          destinationContext: promptDest,
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
          action: actionOverride,
          model: selectedModel,
          jarvisMemory: getFormattedMemoryPrompt(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status ${response.status}`);
      }

      const data = await response.json();

      // Autonomous Learning: Learn user preferences and tour insights from this exchange
      learnFromExchange(text, data.reply || '', data.itinerary);
      const assistantMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: data.reply || 'Here is the plan and operations update based on your request.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        hasItineraryUpdate: Boolean(data.itinerary && (data.hasItineraryUpdate || (data.itinerary.days && data.itinerary.days.length > 0))),
        itinerary: data.itinerary || null,
        suggestedPrompts: data.suggestedPrompts || [
          '✨ Rewrite day descriptions with local highlights',
          'Add Nathula Pass & Baba Mandir permit',
          'Optimize Buying Cost vs Quoted Selling Price',
        ],
        actionMeta: {
          action: data.action,
          targetQuoteNumber: data.targetQuoteNumber,
          leadName: data.leadData?.guestName,
        },
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // 1. Navigation Action (builder, preview, leads, saved, accounts)
      if (data.action === 'navigate' && data.navigationTarget && onNavigate) {
        onNavigate(data.navigationTarget.tab, data.navigationTarget.mode);
        onShowToast(`✓ Navigated to ${data.navigationTarget.tab.toUpperCase()}`);
      }

      // 2. Load / Switch Saved Quote Action
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
          if (data.itinerary) {
            const updated = buildFullItineraryFromAi(data.itinerary, matched);
            onApplyItinerary(updated);
            onShowToast(`✓ Loaded & updated Quote #${updated.quoteNumber} for ${updated.guestName}!`);
          } else {
            onSelectItinerary(matched);
            onShowToast(`✓ Loaded Quote #${matched.quoteNumber} (${matched.guestName}) into Builder`);
          }
        }
      }

      // 3. Create or Update Lead Action in CRM
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
            onShowToast(`✓ Updated CRM Lead: ${updated.guestName}`);
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
            source: 'JARVIS Travel Copilot',
            nextFollowUpDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
            notes: data.leadData.notes || 'Inquiry registered by JARVIS AI',
            logs: [
              {
                id: `log-${Date.now()}`,
                timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
                type: 'note',
                summary: 'Lead registered by JARVIS.',
                loggedBy: 'JARVIS',
              },
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          onSaveLead(newLead);
          onShowToast(`🎉 New Lead Registered in CRM: ${newLead.guestName}!`);
        }
      }

      // 4. AUTO-APPLY: Immediately create/load the itinerary into the Itinerary Builder
      if (data.itinerary && (data.hasItineraryUpdate || (data.itinerary.days && data.itinerary.days.length > 0))) {
        recordCreatedItinerary(data.itinerary);
        handleApplyToItinerary(data.itinerary, assistantMessage.id);
      }
    } catch (err: any) {
      console.error('AI Bot error:', err);
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ **Notice:** ${err.message || 'Could not communicate with the Gemini API server.'}\n\nPlease verify that your Gemini API key is configured in the environment or Settings panel.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedPrompts: ['Retry last message'],
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyToItinerary = (updatedItinData: Partial<Itinerary>, messageId: string) => {
    if (!updatedItinData) return;

    const isNewDest = Boolean(
      updatedItinData.destination &&
      currentItinerary?.destination &&
      updatedItinData.destination.toLowerCase() !== currentItinerary.destination.toLowerCase()
    );

    const mergedItinerary = buildFullItineraryFromAi(
      updatedItinData,
      isNewDest ? null : currentItinerary,
      isNewDest
    );

    onApplyItinerary(mergedItinerary);
    setAppliedMessageId(messageId);
    onShowToast(`🎉 Successfully applied AI itinerary "${mergedItinerary.title}" to builder!`);
    // Close drawer so user is immediately focused on the Itinerary Builder
    setTimeout(() => {
      onClose();
    }, 400);
  };

  const handleClearHistory = () => {
    if (window.confirm('Clear AI conversation history?')) {
      setMessages([
        {
          id: `welcome-${Date.now()}`,
          role: 'assistant',
          content: 'Conversation history cleared. Ready to design or polish your next itinerary!',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          suggestedPrompts: [
            '✨ Rewrite all itinerary days in a perfect way',
            '🪄 Create 5D/4N Sikkim & Gangtok tour for 2 adults',
            '🌿 Plan 6D Meghalaya tour',
          ],
        },
      ]);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-y-0 right-0 z-50 flex flex-col bg-slate-950 border-l border-emerald-500/30 shadow-2xl transition-all duration-300 ease-in-out ${
        isExpanded ? 'w-full md:w-[750px] lg:w-[850px]' : 'w-full md:w-[480px] lg:w-[540px]'
      }`}
    >
      {/* Top Header */}
      <div className="bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-teal-500 to-emerald-500 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-cyan-950/50">
            <Sparkles className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white text-sm tracking-tight flex items-center gap-1.5">
                <span>JARVIS AI Copilot</span>
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30 font-semibold">
                {selectedModel === 'gemini-3.8-flash' ? 'gemini-3.8-flash' : 'flash-lite'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Personal Himalayan Travel Assistant & DMC Intelligence
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Memory Bank Inspection Button */}
          <button
            type="button"
            onClick={() => setIsMemoryModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-purple-950/80 hover:bg-purple-900 border border-purple-500/40 text-purple-300 text-xs font-semibold transition-colors cursor-pointer"
            title="Inspect & Teach JARVIS Memory Bank"
          >
            <Brain className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden md:inline">Memory</span>
          </button>

          {/* Talk to JARVIS Voice Button */}
          {onOpenVoiceModal && (
            <button
              type="button"
              onClick={onOpenVoiceModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-slate-950 text-xs font-bold shadow-md transition-all cursor-pointer animate-pulse-subtle"
              title="Launch Live Voice conversation with JARVIS (gemini-3.8-live)"
            >
              <Mic className="w-3.5 h-3.5 text-slate-950" />
              <span>Talk to JARVIS</span>
            </button>
          )}

          {/* Model Switcher */}
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value as any)}
            className="hidden sm:block bg-slate-950 border border-slate-700 text-slate-300 text-[11px] rounded-lg px-2 py-1 font-mono cursor-pointer"
            title="Switch Gemini Model"
          >
            <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite</option>
            <option value="gemini-3.8-flash">Gemini 3.8 Flash</option>
          </select>

          {/* Expand / Minimize */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            title={isExpanded ? 'Collapse Drawer' : 'Expand Drawer'}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Clear History */}
          <button
            type="button"
            onClick={handleClearHistory}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            title="Clear Chat History"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Put JARVIS to Sleep */}
          <button
            type="button"
            onClick={() => handleSendMessage('JARVIS sleep')}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-950/80 hover:bg-indigo-900/80 border border-indigo-500/40 text-xs text-indigo-300 font-semibold transition-colors cursor-pointer"
            title="Put JARVIS to sleep (or say/type 'JARVIS sleep')"
          >
            <Moon className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Sleep</span>
          </button>

          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
            title="Close Assistant"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Laser-Focused Itinerary Mission HUD */}
      <div className="px-4 py-2 bg-slate-950/95 border-b border-emerald-500/20 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono font-bold shrink-0">
            TRAVEL ARCHITECT
          </span>
          <span className="text-slate-300 truncate text-[11px]">
            Created exclusively to design & refine complete day-by-day itineraries
          </span>
        </div>
        <span className="text-[10px] text-emerald-400 font-mono font-bold shrink-0 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          Learning Cortex Active
        </span>
      </div>

      {/* Active Itinerary Context Banner */}
      <div className="bg-slate-900/60 border-b border-slate-800/80 px-4 py-2 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 truncate">
          <span className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider flex items-center gap-1 shrink-0">
            <FileText className="w-3 h-3 text-emerald-400" />
            <span>Active Quote:</span>
          </span>
          <span className="text-white font-medium truncate font-mono text-[11px]">
            {currentItinerary ? (
              `${currentItinerary.quoteNumber || 'Quote'} · ${currentItinerary.title || 'Untitled'} (${currentItinerary.durationDays || 1}D)`
            ) : (
              'No active itinerary selected'
            )}
          </span>
        </div>
        {currentItinerary && (
          <span className="text-[10px] text-emerald-400 font-mono font-bold shrink-0">
            ₹{(currentItinerary.sellingCost || 0).toLocaleString('en-IN')}
          </span>
        )}
      </div>

      {/* Quick Action Tiles */}
      <div className="bg-slate-900/30 p-2.5 border-b border-slate-800/60 flex items-center gap-2 overflow-x-auto text-[11px] no-scrollbar">
        <button
          type="button"
          onClick={() =>
            handleSendMessage(
              'Rewrite all day plans in a perfect way with captivating storytelling, scenic milestones, photo stops, and accurate mountain timing',
              'rewrite_all_days'
            )
          }
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-500/40 text-emerald-300 font-semibold whitespace-nowrap transition-colors cursor-pointer"
        >
          <Sparkles className="w-3 h-3 text-emerald-400" />
          <span>✨ Rewrite All Days Perfectly</span>
        </button>

        {savedItineraries && savedItineraries.length > 0 && (
          <button
            type="button"
            onClick={() => {
              const latest = savedItineraries[0];
              handleSendMessage(`Load and review saved quotation #${latest.quoteNumber} for ${latest.guestName || 'guest'}`);
            }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-950/70 hover:bg-cyan-900/80 border border-cyan-500/40 text-cyan-300 font-semibold whitespace-nowrap transition-colors cursor-pointer"
          >
            <FolderOpen className="w-3 h-3 text-cyan-400" />
            <span>📂 Quote #{savedItineraries[0].quoteNumber}</span>
          </button>
        )}

        {leads && leads.length > 0 && (
          <button
            type="button"
            onClick={() => {
              const pending = leads.find((l) => l.status === 'new') || leads[0];
              handleSendMessage(`Create a tailored itinerary quote for CRM Lead ${pending.guestName} (${pending.destination}, ${pending.adults} adults)`);
            }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-950/70 hover:bg-purple-900/80 border border-purple-500/40 text-purple-300 font-semibold whitespace-nowrap transition-colors cursor-pointer"
          >
            <Users className="w-3 h-3 text-purple-400" />
            <span>👥 Quote for Lead {leads[0].guestName?.split(' ')[0]}</span>
          </button>
        )}

        <button
          type="button"
          onClick={() =>
            handleSendMessage(
              'Create a 5 Days / 4 Nights Sikkim Gangtok & North Sikkim tour plan with Tsomgo Lake, Lachung and Yumthang Valley for 2 adults'
            )
          }
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 whitespace-nowrap transition-colors cursor-pointer"
        >
          <span>🪄 Plan 5D Sikkim Tour</span>
        </button>

        <button
          type="button"
          onClick={() =>
            handleSendMessage(
              'Plan a 6 Days / 5 Nights Meghalaya tour covering Shillong, Cherrapunji waterfalls, Mawlynnong clean village, and crystal-clear Dawki river boating for 2 adults'
            )
          }
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 whitespace-nowrap transition-colors cursor-pointer"
        >
          <span>🌿 Plan 6D Meghalaya</span>
        </button>

        <button
          type="button"
          onClick={() =>
            handleSendMessage(
              'Upgrade the current itinerary hotels to 4-Star Super Deluxe category, adjust buying cost to reflect premium mountain view rooms, and calculate 25% markup'
            )
          }
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 whitespace-nowrap transition-colors cursor-pointer"
        >
          <span>🏨 Upgrade to 4-Star</span>
        </button>
      </div>

      {/* Messages Thread (Scrollable) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} space-y-1.5`}
          >
            {/* Header / Avatar */}
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 w-full">
              {msg.role === 'assistant' ? (
                <>
                  <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-cyan-400 to-emerald-400 flex items-center justify-center text-slate-950 font-bold text-[9px]">
                    <Bot className="w-2.5 h-2.5 text-slate-950" />
                  </div>
                  <span className="font-semibold text-cyan-300">JARVIS</span>
                  <span className="text-[10px] text-slate-500 font-mono">{msg.timestamp}</span>

                  {/* Listen to JARVIS TTS Voice */}
                  <button
                    type="button"
                    onClick={() => handleToggleSpeak(msg.id, msg.content)}
                    className="ml-auto inline-flex items-center gap-1 text-[10px] text-cyan-300 hover:text-cyan-200 bg-cyan-950/60 hover:bg-cyan-900/80 px-2 py-0.5 rounded border border-cyan-500/30 transition-colors cursor-pointer"
                    title={playingAudioId === msg.id ? 'Stop voice' : 'Listen to JARVIS voice'}
                  >
                    {playingAudioId === msg.id ? (
                      <>
                        <VolumeX className="w-3 h-3 text-cyan-300 animate-pulse" />
                        <span>Stop</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3 h-3 text-cyan-400" />
                        <span>Listen</span>
                      </>
                    )}
                  </button>
                </>
              ) : (
                <>
                  <div className="w-4 h-4 rounded-full bg-sky-600 flex items-center justify-center text-white font-bold text-[9px]">
                    <User className="w-2.5 h-2.5 text-white" />
                  </div>
                  <span className="font-semibold text-sky-400">You</span>
                  <span className="text-[10px] text-slate-500 font-mono">{msg.timestamp}</span>
                </>
              )}
            </div>

            {/* Bubble */}
            <div
              className={`p-3.5 rounded-2xl text-xs leading-relaxed max-w-[92%] shadow-md ${
                msg.role === 'user'
                  ? 'bg-sky-600 text-white rounded-tr-xs'
                  : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-xs space-y-3'
              }`}
            >
              {/* Message text with basic markdown formatting */}
              <div className="whitespace-pre-wrap break-words space-y-2">
                {msg.content}
              </div>

              {/* Structured Itinerary Update Card (if generated/updated by AI) */}
              {msg.hasItineraryUpdate && msg.itinerary && (
                <div className="mt-3 bg-slate-950 border-2 border-emerald-500/50 rounded-xl p-3.5 space-y-3 shadow-lg">
                  <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2.5">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider block">
                        ✨ Ready Itinerary Plan
                      </span>
                      <h4 className="font-bold text-white text-sm leading-tight mt-0.5">
                        {msg.itinerary.title || 'Custom Tour Plan'}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-emerald-400" />
                        <span>{msg.itinerary.destination || 'North East'}</span>
                        <span>·</span>
                        <span>
                          {msg.itinerary.durationNights || 4}N / {msg.itinerary.durationDays || 5}D
                        </span>
                        <span>·</span>
                        <span>{msg.itinerary.adults || 2} Pax</span>
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-400 block font-mono">Quoted Selling</span>
                      <span className="text-base font-black text-emerald-400 font-mono">
                        ₹{(msg.itinerary.sellingCost || msg.itinerary.reservedCab?.totalPackagePrice || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Highlights Grid */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Pickup / Drop:</span>
                      <span className="text-slate-200 font-medium truncate block">
                        {msg.itinerary.pickupLocation || 'IXB'} ➔ {msg.itinerary.dropLocation || 'IXB'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Hotel & Meal:</span>
                      <span className="text-slate-200 font-medium truncate block">
                        {msg.itinerary.hotelCategory || 'Deluxe'} ({msg.itinerary.mealPlan || 'MAP'})
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Buying Cost:</span>
                      <span className="text-amber-400 font-mono font-bold block">
                        ₹{(msg.itinerary.packageCost || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Est. Net Profit:</span>
                      <span className="text-emerald-400 font-mono font-bold block">
                        ₹{Math.max(0, (msg.itinerary.sellingCost || 0) - (msg.itinerary.packageCost || 0)).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Days list preview toggle */}
                  {msg.itinerary.days && msg.itinerary.days.length > 0 && (
                    <div>
                      <button
                        type="button"
                        onClick={() =>
                          setPreviewDayDetails(previewDayDetails === msg.id ? null : msg.id)
                        }
                        className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium flex items-center justify-between w-full py-1 cursor-pointer"
                      >
                        <span>
                          📋 View Day-by-Day Tour Breakdown ({msg.itinerary.days.length} Days)
                        </span>
                        {previewDayDetails === msg.id ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {previewDayDetails === msg.id && (
                        <div className="space-y-2 mt-2 max-h-56 overflow-y-auto pr-1">
                          {msg.itinerary.days.map((day: any, i: number) => (
                            <div
                              key={i}
                              className="bg-slate-900 p-2 rounded-lg border border-slate-800 text-[11px] space-y-1"
                            >
                              <div className="flex items-center justify-between">
                                <strong className="text-white">
                                  D{day.dayNumber}: {day.title}
                                </strong>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {day.nightStay ? `Stay: ${day.nightStay}` : ''}
                                </span>
                              </div>
                              <p className="text-slate-300 text-[10px] leading-snug">
                                {day.description}
                              </p>
                              {day.sightseeingHighlights && day.sightseeingHighlights.length > 0 && (
                                <div className="flex items-center gap-1 flex-wrap pt-0.5">
                                  {day.sightseeingHighlights.map((h: string, hi: number) => (
                                    <span
                                      key={hi}
                                      className="text-[9px] bg-slate-950 text-slate-400 px-1.5 py-0.2 rounded border border-slate-800"
                                    >
                                      {h}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Apply to Itinerary Action Button */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => handleApplyToItinerary(msg.itinerary!, msg.id)}
                      className={`w-full py-2 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer ${
                        appliedMessageId === msg.id
                          ? 'bg-emerald-600 text-slate-950 hover:bg-emerald-500'
                          : 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 hover:from-emerald-400 hover:to-teal-300'
                      }`}
                    >
                      {appliedMessageId === msg.id ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-slate-950" />
                          <span>Applied to Itinerary Builder! (Click to Re-apply)</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-slate-950" />
                          <span>Apply Directly to Itinerary Builder</span>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-950" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Suggested Follow-up Prompts */}
              {msg.suggestedPrompts && msg.suggestedPrompts.length > 0 && (
                <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider block">
                    Suggested Next Steps:
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {msg.suggestedPrompts.map((prompt, pi) => (
                      <button
                        key={pi}
                        type="button"
                        onClick={() => handleSendMessage(prompt)}
                        className="text-[10px] bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-1 rounded-lg border border-slate-700/80 transition-colors text-left cursor-pointer"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-start gap-2 animate-pulse">
            <div className="w-6 h-6 rounded-full bg-emerald-600/50 flex items-center justify-center text-slate-950 font-bold text-xs">
              <Sparkles className="w-3.5 h-3.5 text-slate-950 animate-spin" />
            </div>
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl rounded-tl-xs text-xs text-slate-400 space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-emerald-400">
                  {selectedModel === 'gemini-3.8-flash' ? 'Gemini 3.8 Flash' : 'Gemini 3.1 Flash Lite'}
                </span>
                <span>is designing your tour plan...</span>
              </div>
              <div className="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className="w-1/2 h-full bg-emerald-500 rounded-full animate-[shimmer_1.5s_infinite]"></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Composer Footer */}
      <div className="bg-slate-900 border-t border-slate-800 p-3.5 shrink-0 space-y-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="relative flex items-end gap-2"
        >
          <div className="relative flex-1">
            <textarea
              ref={inputRef}
              rows={2}
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Ask JARVIS to plan, rewrite days, update dates/hotels, or calculate rates..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 resize-none focus:outline-none focus:border-emerald-500 pr-10"
            />
          </div>

          <button
            type="submit"
            disabled={!inputPrompt.trim() || isLoading}
            className="p-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-bold rounded-xl transition-all cursor-pointer shadow-md shrink-0 mb-0.5"
            title="Send Message"
          >
            <Send className="w-4 h-4 text-slate-950" />
          </button>
        </form>

        <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
          <span>Press Enter to send · Shift+Enter for new line</span>
          <span className="font-mono text-emerald-400">DMC Ground Intelligence Active</span>
        </div>
      </div>

      {/* Cognitive Cortex Memory Modal */}
      <JarvisMemoryModal
        isOpen={isMemoryModalOpen}
        onClose={() => setIsMemoryModalOpen(false)}
      />
    </div>
  );
};
