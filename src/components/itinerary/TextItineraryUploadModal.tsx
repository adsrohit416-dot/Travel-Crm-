import React from 'react';
import { JarvisVoiceModal } from '../jarvis/JarvisVoiceModal';
import { Itinerary, Lead, LeadStatus } from '../../types';

export interface TextItineraryUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyParsedItinerary: (parsedData: Partial<Itinerary>) => void;
  destinationContext?: string;
  currentItinerary?: Itinerary | null;
  onApplyItinerary?: (itinerary: Itinerary) => void;
  savedItineraries?: Itinerary[];
  leads?: Lead[];
  onSelectItinerary?: (itinerary: Itinerary) => void;
  onSaveLead?: (lead: Lead) => void;
  onUpdateLeadStatus?: (leadId: string, status: LeadStatus, note?: string) => void;
  onNavigate?: (tab: 'home' | 'itinerary' | 'leads' | 'accounts' | 'saved', mode?: 'builder' | 'preview') => void;
  onShowToast?: (message: string) => void;
}

/**
 * TextItineraryUploadModal is unified into the all-in-one JARVIS AI suite.
 * It opens directly in "upload" mode with full AI text parsing, drag-and-drop,
 * route breakdown, and seamless 1-click toggling to Voice AI and Chat Copilot.
 */
export const TextItineraryUploadModal: React.FC<TextItineraryUploadModalProps> = ({
  isOpen,
  onClose,
  onApplyParsedItinerary,
  destinationContext,
  currentItinerary,
  onApplyItinerary,
  savedItineraries = [],
  leads = [],
  onSelectItinerary,
  onSaveLead,
  onUpdateLeadStatus,
  onNavigate,
  onShowToast,
}) => {
  return (
    <JarvisVoiceModal
      isOpen={isOpen}
      onClose={onClose}
      initialMode="upload"
      destinationContext={destinationContext || currentItinerary?.destination || 'Sikkim & North East'}
      currentItinerary={currentItinerary}
      onApplyItinerary={onApplyItinerary || ((itin) => onApplyParsedItinerary(itin))}
      onApplyParsedItinerary={onApplyParsedItinerary}
      savedItineraries={savedItineraries}
      leads={leads}
      onSelectItinerary={onSelectItinerary}
      onSaveLead={onSaveLead}
      onUpdateLeadStatus={onUpdateLeadStatus}
      onNavigate={onNavigate}
      onShowToast={onShowToast}
    />
  );
};
