import {
  Home,
  FileText,
  Users,
  Compass,
  Settings,
  PlusCircle,
  PhoneCall,
  Download,
  Wallet,
  Sparkles,
  Mic,
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'home' | 'itinerary' | 'leads' | 'accounts' | 'saved' | 'settings';
  setActiveTab: (tab: 'home' | 'itinerary' | 'leads' | 'accounts' | 'saved' | 'settings') => void;
  onNewItinerary: () => void;
  onNewLead: () => void;
  onOpenAiCopilot?: () => void;
  onOpenVoiceModal?: () => void;
  overdueLeadsCount: number;
  totalSavedQuotes: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onNewItinerary,
  onNewLead,
  onOpenAiCopilot,
  onOpenVoiceModal,
  overdueLeadsCount,
  totalSavedQuotes,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur border-b border-slate-800 text-slate-100 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-8">
          {/* Zone 1: Single text element wordmark with logo - Clickable to return Home */}
          <div
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-3 shrink-0 cursor-pointer group"
            title="Go to Start Page / Home"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold overflow-hidden group-hover:scale-105 transition-transform">
              <Compass className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-white whitespace-nowrap block leading-tight group-hover:text-emerald-300 transition-colors">
                North East Destinations
              </span>
              <span className="text-[11px] text-slate-400 tracking-wide block">
                Itinerary & Lead Management
              </span>
            </div>
          </div>

          {/* Zone 2: Navigation Links (single line, no capsules) */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <button
              onClick={() => setActiveTab('home')}
              className={`flex items-center gap-2 py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 cursor-pointer ${
                activeTab === 'home'
                  ? 'border-emerald-500 text-white font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Start Page</span>
            </button>

            <button
              onClick={() => setActiveTab('itinerary')}
              className={`flex items-center gap-2 py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 cursor-pointer ${
                activeTab === 'itinerary'
                  ? 'border-emerald-500 text-white font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Itinerary Builder</span>
            </button>

            <button
              onClick={() => setActiveTab('leads')}
              className={`flex items-center gap-2 py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                activeTab === 'leads'
                  ? 'border-emerald-500 text-white font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Lead CRM</span>
              {overdueLeadsCount > 0 && (
                <span className="text-[11px] font-mono tabular-nums text-amber-400 font-bold ml-1">
                  ({overdueLeadsCount})
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('accounts')}
              className={`flex items-center gap-2 py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                activeTab === 'accounts'
                  ? 'border-emerald-500 text-white font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Wallet className="w-4 h-4" />
              <span>Accounts & Profit</span>
            </button>

            <button
              onClick={() => setActiveTab('saved')}
              className={`flex items-center gap-2 py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                activeTab === 'saved'
                  ? 'border-emerald-500 text-white font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Download className="w-4 h-4" />
              <span>Saved Quotes</span>
              <span className="text-[11px] font-mono tabular-nums text-slate-400 ml-1">
                [{totalSavedQuotes}]
              </span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                activeTab === 'settings'
                  ? 'border-emerald-500 text-white font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Agency & Bank Settings</span>
            </button>
          </nav>

          {/* Zone 3: Primary Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {onOpenVoiceModal && (
              <button
                onClick={onOpenVoiceModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-cyan-200 bg-gradient-to-r from-cyan-950/90 to-teal-950/90 hover:from-cyan-900 hover:to-teal-900 border border-cyan-400/50 rounded-md shadow-xs transition-colors whitespace-nowrap cursor-pointer group"
                title="Talk to JARVIS with Live Voice (Gemini 3.8 Live API)"
              >
                <Mic className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
                <span>Talk to JARVIS</span>
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
              </button>
            )}

            {onOpenAiCopilot && (
              <button
                onClick={onOpenAiCopilot}
                className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-300 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/50 rounded-md shadow-xs transition-colors whitespace-nowrap cursor-pointer"
                title="Open JARVIS AI Copilot Drawer"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>JARVIS Text</span>
              </button>
            )}

            <button
              onClick={onNewLead}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-md transition-colors whitespace-nowrap"
            >
              <PhoneCall className="w-3.5 h-3.5 text-slate-400" />
              <span>+ Add Inquiry</span>
            </button>

            <button
              onClick={onNewItinerary}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-md shadow-sm transition-colors whitespace-nowrap"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Create Itinerary</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
