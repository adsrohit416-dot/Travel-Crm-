import React, { useState, useEffect, useMemo } from 'react';
import { Sparkles, Mic } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { StartPage } from './components/home/StartPage';
import { LeadDashboard } from './components/leads/LeadDashboard';
import { LeadModal } from './components/leads/LeadModal';
import { LeadInteractionModal } from './components/leads/LeadInteractionModal';
import { ItineraryBuilder } from './components/itinerary/ItineraryBuilder';
import { ItineraryPreview } from './components/itinerary/ItineraryPreview';
import { ItineraryList } from './components/itinerary/ItineraryList';
import { TextItineraryUploadModal } from './components/itinerary/TextItineraryUploadModal';
import { SettingsModal } from './components/settings/SettingsModal';
import { TemplatesModal } from './components/templates/TemplatesModal';
import { AccountsDashboard } from './components/accounts/AccountsDashboard';
import { SalesTeamModal } from './components/sales/SalesTeamModal';
import { AIAssistantDrawer } from './components/itinerary/AIAssistantDrawer';
import { JarvisVoiceModal } from './components/jarvis/JarvisVoiceModal';
import { JarvisWakeWordListener } from './components/jarvis/JarvisWakeWordListener';
import { BookingConfirmationVoucherModal } from './components/voucher/BookingConfirmationVoucherModal';
import { ConvertLeadPayload } from './components/leads/ConvertLeadModal';
import { initialSampleAccounts } from './data/defaultAccounts';
import {
  clearAllTripAccounts,
  convertItineraryToBookingAccount,
  convertLeadToBookingAccount,
  getCompanyProfile,
  getItineraries,
  getLeads,
  getSalesPersons,
  getTripAccounts,
  saveCompanyProfile,
  saveItineraries,
  saveLeads,
  saveSalesPersons,
  saveTripAccounts,
  syncTripAccount,
} from './utils/storage';
import {
  BookingVoucherData,
  CompanyProfile,
  Itinerary,
  ItineraryDay,
  Lead,
  SalesPerson,
  TripAccount,
} from './types';
import {
  buildVoucherFromItinerary,
  buildVoucherFromLead,
  buildVoucherFromTripAccount,
} from './utils/voucherHelper';
import {
  createBlankItinerary,
  createBlankItineraryFromLead,
  preconfiguredTemplates,
  defaultTermsAndConditions,
  defaultPaymentMilestones,
} from './data/defaultTemplates';
import {
  NORTH_SIKKIM_COMPULSORY_MEAL_PLAN,
  NORTH_SIKKIM_DAY_MEAL_PLAN,
  getDefaultDestinationCover,
  getDefaultDayImage,
} from './data/destinationImages';

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'itinerary' | 'leads' | 'accounts' | 'saved' | 'settings'>('home');
  const [viewMode, setViewMode] = useState<'builder' | 'preview'>('builder');

  // Core Data State
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>(getCompanyProfile);
  const [leads, setLeads] = useState<Lead[]>(getLeads);
  const [itineraries, setItineraries] = useState<Itinerary[]>(getItineraries);
  const [tripAccounts, setTripAccounts] = useState<TripAccount[]>(getTripAccounts);
  const [salesPersons, setSalesPersons] = useState<SalesPerson[]>(getSalesPersons);

  // Active items being edited/viewed
  const [currentItinerary, setCurrentItinerary] = useState<Itinerary | null>(() => {
    const list = getItineraries();
    const sikkimDefault = list.find((it) => it.destination?.toLowerCase() === 'sikkim');
    return sikkimDefault || (list.length > 0 ? list[0] : null);
  });
  const [builderSession, setBuilderSession] = useState<number>(() => Date.now());

  // Modal triggers
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  const [isInteractionModalOpen, setIsInteractionModalOpen] = useState(false);
  const [interactionLead, setInteractionLead] = useState<Lead | null>(null);

  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
  const [isTextUploadModalOpen, setIsTextUploadModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isSalesTeamModalOpen, setIsSalesTeamModalOpen] = useState(false);
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [voiceModalInitialMode, setVoiceModalInitialMode] = useState<'voice' | 'upload' | 'chat'>('voice');
  const [wakeTriggerSource, setWakeTriggerSource] = useState<'voice' | 'clap' | 'manual'>('manual');
  const [aiInitialPrompt, setAiInitialPrompt] = useState<string | undefined>(undefined);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [activeVoucherData, setActiveVoucherData] = useState<BookingVoucherData | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 3200);
  };

  const handleWakeJarvis = (trigger: 'voice' | 'clap') => {
    setWakeTriggerSource(trigger);
    setVoiceModalInitialMode('voice');
    setIsVoiceModalOpen(true);
  };

  const handleOpenVoiceModalManual = (mode?: 'voice' | 'upload' | 'chat' | unknown) => {
    setWakeTriggerSource('manual');
    const safeMode = mode === 'upload' || mode === 'chat' || mode === 'voice' ? mode : 'voice';
    setVoiceModalInitialMode(safeMode);
    setIsVoiceModalOpen(true);
  };

  const handleOpenTextUpload = () => {
    handleOpenVoiceModalManual('upload');
  };

  const handleSleepJarvis = () => {
    setIsVoiceModalOpen(false);
    setIsAiDrawerOpen(false);
    showToast('💤 JARVIS is now in standby / sleep mode.');
  };

  const handleOpenAiCopilot = (initialPrompt?: string) => {
    setAiInitialPrompt(initialPrompt);
    setIsAiDrawerOpen(true);
  };

  const handleApplyAiItinerary = (updatedItin: Itinerary) => {
    setCurrentItinerary(updatedItin);
    handleSaveItinerary(updatedItin);
    setActiveTab('itinerary');
    setViewMode('builder');
    showToast(`✓ Applied AI updates to Quote #${updatedItin.quoteNumber}!`);
  };

  // Synchronize state changes to localStorage
  useEffect(() => {
    saveCompanyProfile(companyProfile);
  }, [companyProfile]);

  useEffect(() => {
    saveLeads(leads);
  }, [leads]);

  useEffect(() => {
    saveItineraries(itineraries);
  }, [itineraries]);

  useEffect(() => {
    saveTripAccounts(tripAccounts);
  }, [tripAccounts]);

  useEffect(() => {
    saveSalesPersons(salesPersons);
  }, [salesPersons]);

  // Compute overdue leads for navigation indicator
  const overdueLeadsCount = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return leads.filter(
      (l) =>
        l.status !== 'booked' &&
        l.status !== 'lost' &&
        l.nextFollowUpDate &&
        l.nextFollowUpDate <= today
    ).length;
  }, [leads]);

  // Handlers for Custom Sales Team (Add, Update, Delete)
  const handleAddSalesPerson = (newPerson: Omit<SalesPerson, 'id' | 'createdAt'>) => {
    const created: SalesPerson = {
      ...newPerson,
      id: `sp-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setSalesPersons((prev) => [...prev, created]);
    showToast(`✓ Added ${created.name} to Sales Team`);
  };

  const handleUpdateSalesPerson = (updated: SalesPerson) => {
    setSalesPersons((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    showToast(`✓ Updated profile for ${updated.name}`);
  };

  const handleDeleteSalesPerson = (id: string) => {
    const person = salesPersons.find((p) => p.id === id);
    setSalesPersons((prev) => prev.filter((p) => p.id !== id));
    showToast(`Deleted ${person?.name || 'sales person'} from team.`);
  };

  const handleQuickAddSalesPerson = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const exists = salesPersons.some((p) => p.name.toLowerCase() === trimmed.toLowerCase());
    if (exists) return;

    const newPerson: SalesPerson = {
      id: `sp-${Date.now()}`,
      name: trimmed,
      role: 'Travel Consultant',
      commissionPercentage: 50,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    setSalesPersons((prev) => [...prev, newPerson]);
    showToast(`✓ Added "${trimmed}" as a custom sales person.`);
  };

  // Convert Itinerary to Confirmed Booking with advance payment & auto-sync with accounts
  const handleConvertItineraryToBooking = (
    itin: Itinerary,
    payload: {
      advanceAmount: number;
      paymentMode: 'upi' | 'net_banking' | 'cash' | 'credit_card' | 'cheque';
      paymentDate: string;
      referenceNumber: string;
      paymentNotes: string;
      salesPerson: string;
      sellingCost: number;
      packageCost: number;
    }
  ) => {
    const { updatedItinerary, updatedAccounts, isFirstTimeConversion, voucherNumber } = convertItineraryToBookingAccount(
      itin,
      payload,
      tripAccounts
    );
    setTripAccounts(updatedAccounts);
    setCurrentItinerary(updatedItinerary);
    setItineraries((prev) => prev.map((item) => (item.id === updatedItinerary.id ? updatedItinerary : item)));

    // User Requirement: "When Package get confirm kindly provide voucher in pdf only for the first time with all lead and package information"
    if (isFirstTimeConversion) {
      const voucherData = buildVoucherFromItinerary(
        updatedItinerary,
        payload,
        voucherNumber
      );
      setActiveVoucherData(voucherData);
      setIsVoucherModalOpen(true);
      showToast(`🎉 Tour Confirmed! Booking Voucher #${voucherNumber} generated in PDF format.`);
    } else {
      showToast(`🎉 Tour converted! Advance of ₹${payload.advanceAmount.toLocaleString('en-IN')} recorded in Accounts.`);
    }
  };

  // Handlers for Accounts & Balance Sheet
  const handleUpdateAccount = (updatedAcc: TripAccount) => {
    setTripAccounts((prev) => prev.map((a) => (a.id === updatedAcc.id ? updatedAcc : a)));
    showToast(`✓ Updated balance sheet for Quote #${updatedAcc.quoteNumber}`);
  };

  const handleCreateAccount = (newAcc: TripAccount) => {
    setTripAccounts((prev) => [newAcc, ...prev]);
    showToast(`✓ Created new booking account #${newAcc.quoteNumber}`);
  };

  const handleDeleteAccount = (id: string) => {
    setTripAccounts((prev) => prev.filter((a) => a.id !== id));
    showToast('Booking account record deleted.');
  };

  const handleClearAllAccounts = () => {
    clearAllTripAccounts();
    setTripAccounts([]);
    showToast('✓ All dummy accounts removed. Ledger is fresh and clean.');
  };

  const handleResetToSampleAccounts = () => {
    saveTripAccounts(initialSampleAccounts);
    setTripAccounts(initialSampleAccounts);
    showToast('Sample demo accounts restored.');
  };

  // Convert Lead to Confirmed Booking with Advance Payment & Auto-Sync with Accounts
  const handleConvertLeadWithAdvance = (payload: ConvertLeadPayload) => {
    const lead = leads.find((l) => l.id === payload.leadId);
    if (!lead) return;

    const { updatedLead, updatedAccounts, isFirstTimeConversion, voucherNumber } = convertLeadToBookingAccount(
      lead,
      payload,
      tripAccounts
    );

    setLeads((prev) => prev.map((l) => (l.id === updatedLead.id ? updatedLead : l)));
    setTripAccounts(updatedAccounts);

    // User Requirement: "When Package get confirm kindly provide voucher in pdf only for the first time with all lead and package information"
    if (isFirstTimeConversion) {
      const linkedItinerary = itineraries.find(
        (it) => it.id === lead.itineraryId || it.leadId === lead.id || it.quoteNumber === payload.quoteNumber
      );
      const voucherData = buildVoucherFromLead(
        updatedLead,
        payload,
        linkedItinerary,
        voucherNumber
      );
      setActiveVoucherData(voucherData);
      setIsVoucherModalOpen(true);
      showToast(`🎉 ${lead.guestName} Confirmed! Official Booking Voucher #${voucherNumber} generated in PDF.`);
    } else {
      showToast(
        `🎉 ${lead.guestName} converted! ₹${payload.advanceAmount.toLocaleString('en-IN')} advance credited to Accounts & Balance Sheet.`
      );
    }
  };

  // On-demand Voucher inspection & PDF re-download handlers
  const handleOpenVoucherForItinerary = (itin: Itinerary) => {
    const matchedAccount = tripAccounts.find(
      (a) => a.quoteNumber === itin.quoteNumber || (itin.leadId && a.leadId === itin.leadId)
    );
    const totalPaid =
      matchedAccount?.clientPayments?.reduce((s, p) => s + (p.amount || 0), 0) ||
      Math.round((itin.sellingCost || 0) * 0.3);
    const lastPayment = matchedAccount?.clientPayments?.[matchedAccount.clientPayments.length - 1];

    const voucher = buildVoucherFromItinerary(
      itin,
      {
        advanceAmount: totalPaid,
        paymentMode: lastPayment?.paymentMode || 'upi',
        paymentDate: lastPayment?.date || itin.updatedAt?.split('T')[0] || new Date().toISOString().split('T')[0],
        referenceNumber: lastPayment?.referenceNumber || itin.quoteNumber,
        salesPerson: itin.salesPerson,
        sellingCost: itin.sellingCost,
      },
      itin.voucherNumber
    );
    setActiveVoucherData(voucher);
    setIsVoucherModalOpen(true);
  };

  const handleOpenVoucherForLead = (lead: Lead) => {
    const linkedItinerary = itineraries.find(
      (it) => it.id === lead.itineraryId || it.leadId === lead.id || it.quoteNumber === lead.quoteNumber
    );
    const matchedAccount = tripAccounts.find((a) => a.leadId === lead.id || a.quoteNumber === lead.quoteNumber);
    const totalPaid =
      matchedAccount?.clientPayments?.reduce((s, p) => s + (p.amount || 0), 0) ||
      Math.round((lead.sellingCost || 0) * 0.3);
    const lastPayment = matchedAccount?.clientPayments?.[matchedAccount.clientPayments.length - 1];

    const voucher = buildVoucherFromLead(
      lead,
      {
        advanceAmount: totalPaid,
        paymentMode: lastPayment?.paymentMode || 'upi',
        paymentDate: lastPayment?.date || lead.updatedAt?.split('T')[0] || new Date().toISOString().split('T')[0],
        referenceNumber: lastPayment?.referenceNumber || lead.quoteNumber || `ADV-${Date.now().toString().slice(-6)}`,
        salesPerson: lead.salesPerson,
        sellingCost: lead.sellingCost,
      },
      linkedItinerary,
      lead.voucherNumber
    );
    setActiveVoucherData(voucher);
    setIsVoucherModalOpen(true);
  };

  const handleOpenVoucherForAccount = (account: TripAccount) => {
    const linkedItinerary = itineraries.find(
      (it) => it.quoteNumber === account.quoteNumber || (account.itineraryId && it.id === account.itineraryId)
    );
    const linkedLead = leads.find((l) => l.id === account.leadId || l.quoteNumber === account.quoteNumber);
    const voucher = buildVoucherFromTripAccount(account, linkedItinerary, linkedLead);
    setActiveVoucherData(voucher);
    setIsVoucherModalOpen(true);
  };

  // Handlers for Company Profile & Logo Upload
  const handleSaveProfile = (updatedProfile: CompanyProfile) => {
    setCompanyProfile(updatedProfile);
  };

  const handleUpdateLogo = (newLogoUrl: string) => {
    setCompanyProfile((prev) => ({
      ...prev,
      logoUrl: newLogoUrl,
    }));
  };

  const handleUpdateQrCode = (newQrUrl: string) => {
    setCompanyProfile((prev) => ({
      ...prev,
      upiQrCodeUrl: newQrUrl,
    }));
    showToast('Payment QR code updated successfully.');
  };

  // Handlers for Leads CRM
  const handleSaveLead = (leadToSave: Lead) => {
    setLeads((prev) => {
      const exists = prev.some((l) => l.id === leadToSave.id);
      if (exists) {
        return prev.map((l) => (l.id === leadToSave.id ? leadToSave : l));
      }
      return [leadToSave, ...prev];
    });

    // Auto-sync into trip accounts ledger ONLY if converted/booked
    if (leadToSave.status === 'booked' || leadToSave.tripStatus === 'completed') {
      const synced = syncTripAccount(leadToSave, undefined, tripAccounts);
      setTripAccounts(synced);
    }
  };

  const handleDeleteLead = (leadId: string) => {
    setLeads((prev) => prev.filter((l) => l.id !== leadId));
    showToast('Inquiry deleted successfully.');
  };

  // Bridge: 1-Click Convert Lead to Blank Itinerary Quote with Dual-Rate option
  // (Note: Unconverted quotes stay in Lead/Itinerary section; Accounts remains blank until converted)
  const handleConvertLeadToQuote = (lead: Lead) => {
    const newItinerary: Itinerary = createBlankItineraryFromLead(lead);

    setCurrentItinerary(newItinerary);
    setActiveTab('itinerary');
    setViewMode('builder');

    // Update lead status to 'itinerary_sent'
    setLeads((prev) =>
      prev.map((l) =>
        l.id === lead.id
          ? {
              ...l,
              status: 'itinerary_sent',
              itineraryId: newItinerary.id,
              logs: [
                {
                  id: `log-${Date.now()}`,
                  timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
                  type: 'note',
                  summary: `Initiated blank quotation ${newItinerary.quoteNumber} for ${newItinerary.durationDays} Days with predefined inclusions & terms.`,
                  loggedBy: 'System',
                },
                ...(l.logs || []),
              ],
            }
          : l
      )
    );
    showToast(`Created blank itinerary quote #${newItinerary.quoteNumber} for ${lead.guestName}`);
  };

  // Handlers for Itineraries
  const handleEditItinerary = (itin: Itinerary) => {
    const cloned: Itinerary = JSON.parse(JSON.stringify(itin));
    setCurrentItinerary(cloned);
    setBuilderSession(Date.now());
    setActiveTab('itinerary');
    setViewMode('builder');
    showToast(`Loaded Quote #${itin.quoteNumber} (${itin.guestName || itin.title})`);
  };

  const handleNewItinerary = () => {
    const blankItin = createBlankItinerary();
    setCurrentItinerary(blankItin);
    setBuilderSession(Date.now());
    setActiveTab('itinerary');
    setViewMode('builder');
  };

  const handleSaveItinerary = (itin: Itinerary) => {
    // 1. Update itineraries list state and synchronously persist to localStorage
    let nextItineraries: Itinerary[] = [];
    setItineraries((prev) => {
      const matchIndex = prev.findIndex(
        (item) =>
          item.id === itin.id ||
          (Boolean(itin.quoteNumber) && Boolean(item.quoteNumber) && item.quoteNumber === itin.quoteNumber)
      );
      if (matchIndex >= 0) {
        nextItineraries = [...prev];
        nextItineraries[matchIndex] = itin;
      } else {
        nextItineraries = [itin, ...prev];
      }
      saveItineraries(nextItineraries);
      return nextItineraries;
    });

    // Synchronous fallback write to ensure immediate persistence across reloads/tabs
    if (nextItineraries.length > 0) {
      saveItineraries(nextItineraries);
    } else {
      const currentList = getItineraries();
      const matchIndex = currentList.findIndex(
        (item) =>
          item.id === itin.id ||
          (Boolean(itin.quoteNumber) && Boolean(item.quoteNumber) && item.quoteNumber === itin.quoteNumber)
      );
      if (matchIndex >= 0) {
        currentList[matchIndex] = itin;
      } else {
        currentList.unshift(itin);
      }
      saveItineraries(currentList);
    }

    setCurrentItinerary(itin);

    // 2. Synchronize with Trip Accounts ledger if this quote or lead is registered in accounts
    setTripAccounts((prev) => {
      const accIndex = prev.findIndex(
        (acc) =>
          acc.itineraryId === itin.id ||
          (Boolean(itin.quoteNumber) && acc.quoteNumber === itin.quoteNumber) ||
          (Boolean(itin.leadId) && acc.leadId === itin.leadId)
      );
      if (accIndex >= 0) {
        const existing = prev[accIndex];
        const updatedAcc: TripAccount = {
          ...existing,
          guestName: itin.guestName || existing.guestName,
          guestPhone: itin.guestPhone || existing.guestPhone,
          destination: itin.destination || existing.destination,
          salesPerson: itin.salesPerson || existing.salesPerson,
          travelDates: itin.travelStartDate
            ? `${itin.travelStartDate} to ${itin.travelEndDate || ''}`
            : existing.travelDates,
          sellingCost: itin.sellingCost || existing.sellingCost,
          packageCost: itin.packageCost !== undefined ? itin.packageCost : existing.packageCost,
          updatedAt: new Date().toISOString(),
        };
        const nextAccs = [...prev];
        nextAccs[accIndex] = updatedAcc;
        saveTripAccounts(nextAccs);
        return nextAccs;
      }
      return prev;
    });

    // 3. CRITICAL USER REQUIREMENT: Sync with Leads CRM (Create new lead if none exists, or update existing)
    setLeads((prev) => {
      const reservedSelling = itin.sellingCost || itin.reservedCab?.totalPackagePrice || 0;
      const sharingSelling = itin.sellingCostSharing || itin.sharingCab?.totalPackagePrice || 0;
      const reservedBuying = itin.packageCost || 0;

      const matchedIndex = prev.findIndex((lead) => {
        return (
          (itin.leadId && lead.id === itin.leadId) ||
          (lead.itineraryId && lead.itineraryId === itin.id) ||
          (itin.quoteNumber && lead.quoteNumber === itin.quoteNumber) ||
          (itin.guestPhone &&
            lead.phone &&
            itin.guestPhone.replace(/\D/g, '').slice(-10) === lead.phone.replace(/\D/g, '').slice(-10) &&
            lead.phone.replace(/\D/g, '').length >= 10) ||
          (itin.guestName &&
            lead.guestName &&
            itin.guestName.trim().toLowerCase() === lead.guestName.trim().toLowerCase())
        );
      });

      let nextLeads: Lead[];
      if (matchedIndex >= 0) {
        const existing = prev[matchedIndex];
        const updatedLead: Lead = {
          ...existing,
          itineraryId: itin.id,
          quoteNumber: itin.quoteNumber,
          guestName: itin.guestName || existing.guestName,
          phone: itin.guestPhone || existing.phone,
          email: itin.guestEmail || existing.email,
          city: itin.guestCity || existing.city,
          status: existing.status === 'booked' ? 'booked' : 'itinerary_sent',
          budget: reservedSelling > 0 ? `₹${reservedSelling.toLocaleString('en-IN')}` : existing.budget,
          packageCost: itin.packageCost !== undefined ? itin.packageCost : existing.packageCost,
          sellingCost: reservedSelling || existing.sellingCost,
          packageCostSharing: itin.packageCostSharing,
          sellingCostSharing: sharingSelling || existing.sellingCostSharing,
          travelStartDate: itin.travelStartDate || existing.travelStartDate,
          travelEndDate: itin.travelEndDate || existing.travelEndDate,
          durationDays: itin.durationDays || existing.durationDays,
          durationNights: itin.durationNights !== undefined ? itin.durationNights : existing.durationNights,
          adults: itin.adults || existing.adults,
          children: itin.children !== undefined ? itin.children : existing.children,
          destination: itin.destination || existing.destination,
          salesPerson: itin.salesPerson || existing.salesPerson,
          logs: [
            {
              id: `log-${Date.now()}`,
              timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
              type: 'note' as const,
              summary: `Quotation #${itin.quoteNumber} updated & synced. Reserved Selling: ₹${reservedSelling.toLocaleString(
                'en-IN'
              )}, Buying: ₹${reservedBuying.toLocaleString('en-IN')}${
                sharingSelling > 0 ? `, Sharing Selling: ₹${sharingSelling.toLocaleString('en-IN')}` : ''
              }.`,
              loggedBy: itin.salesPerson || 'System',
            },
            ...(existing.logs || []),
          ],
          updatedAt: new Date().toISOString(),
        };

        nextLeads = [...prev];
        nextLeads[matchedIndex] = updatedLead;
      } else if (itin.guestName && itin.guestName.trim()) {
        // Automatically create a new Lead inquiry in CRM when creating an itinerary directly without lead info
        const followUp = new Date();
        followUp.setDate(followUp.getDate() + 2);

        const newLead: Lead = {
          id: itin.leadId || `lead-${Date.now()}`,
          guestName: itin.guestName.trim(),
          phone: itin.guestPhone ? itin.guestPhone.trim() : '',
          email: itin.guestEmail ? itin.guestEmail.trim() : '',
          city: itin.guestCity ? itin.guestCity.trim() : '',
          destination: itin.destination || 'Sikkim & Darjeeling',
          durationDays: itin.durationDays || 5,
          durationNights: itin.durationNights !== undefined ? itin.durationNights : 4,
          adults: itin.adults || 2,
          children: itin.children || 0,
          infants: itin.infants || 0,
          preferredCab: itin.pricingMode === 'dual_comparison' ? 'both' : 'reserved',
          budget: reservedSelling > 0 ? `₹${reservedSelling.toLocaleString('en-IN')}` : undefined,
          status: 'itinerary_sent',
          priority: 'high',
          source: 'Direct Itinerary Quotation',
          salesPerson: itin.salesPerson || 'Rohit Sharma',
          quoteNumber: itin.quoteNumber,
          itineraryId: itin.id,
          packageCost: itin.packageCost || 0,
          sellingCost: reservedSelling,
          packageCostSharing: itin.packageCostSharing,
          sellingCostSharing: sharingSelling,
          travelStartDate: itin.travelStartDate,
          travelEndDate: itin.travelEndDate,
          nextFollowUpDate: followUp.toISOString().split('T')[0],
          notes: `Quoted directly via Itinerary Builder (#${itin.quoteNumber}).`,
          logs: [
            {
              id: `log-${Date.now()}`,
              timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
              type: 'note' as const,
              summary: `Direct Itinerary Quote #${itin.quoteNumber} created and synced with Leads CRM. Selling: ₹${reservedSelling.toLocaleString(
                'en-IN'
              )}, Buying: ₹${reservedBuying.toLocaleString('en-IN')}.`,
              loggedBy: itin.salesPerson || 'System',
            },
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        nextLeads = [newLead, ...prev];
      } else {
        nextLeads = prev;
      }

      saveLeads(nextLeads);
      return nextLeads;
    });

    showToast(`✓ Itinerary #${itin.quoteNumber} saved & synced with Leads CRM!`);
  };

  const handleSelectSavedItinerary = (itin: Itinerary) => {
    handleEditItinerary(itin);
  };

  const handleUpdateLeadStatusDirect = (leadId: string, status: any, note?: string) => {
    setLeads((prev) =>
      prev.map((l) => {
        if (l.id !== leadId) return l;
        const newLogs = note
          ? [
              {
                id: `log-${Date.now()}`,
                timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
                type: 'note' as const,
                summary: note,
                loggedBy: 'JARVIS AI',
              },
              ...(l.logs || []),
            ]
          : l.logs;
        return {
          ...l,
          status,
          updatedAt: new Date().toISOString(),
          logs: newLogs,
        };
      })
    );
    showToast(`✓ Updated CRM Lead status to "${status}"`);
  };

  const handleNavigateDirect = (
    tab: 'home' | 'itinerary' | 'leads' | 'accounts' | 'saved' | 'settings',
    mode?: 'builder' | 'preview'
  ) => {
    setActiveTab(tab);
    if (tab === 'itinerary' && mode) {
      setViewMode(mode);
    }
  };

  // Revert / Unbook Lead: Removes corresponding booking account from ledger and reverts status
  const handleUnbookLead = (lead: Lead) => {
    // 1. Remove from tripAccounts
    setTripAccounts((prev) =>
      prev.filter(
        (a) =>
          a.leadId !== lead.id &&
          (!lead.quoteNumber || a.quoteNumber !== lead.quoteNumber) &&
          (!lead.itineraryId || a.itineraryId !== lead.itineraryId)
      )
    );

    // 2. Revert Lead status to 'itinerary_sent' (or 'contacted')
    setLeads((prev) =>
      prev.map((l) =>
        l.id === lead.id
          ? {
              ...l,
              status: l.itineraryId ? 'itinerary_sent' : 'contacted',
              tripStatus: undefined,
              logs: [
                {
                  id: `log-${Date.now()}`,
                  timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
                  type: 'note',
                  summary: 'Booking reverted / unbooked. Associated account entry deleted from Accounts ledger.',
                  loggedBy: 'User',
                },
                ...(l.logs || []),
              ],
              updatedAt: new Date().toISOString(),
            }
          : l
      )
    );

    // 3. Revert itinerary status if linked
    if (lead.itineraryId) {
      setItineraries((prev) =>
        prev.map((itin) =>
          itin.id === lead.itineraryId ? { ...itin, tripStatus: undefined } : itin
        )
      );
      if (currentItinerary?.id === lead.itineraryId) {
        setCurrentItinerary((prev) => (prev ? { ...prev, tripStatus: undefined } : null));
      }
    }

    showToast(`✓ Unbooked "${lead.guestName}". Account removed from ledger.`);
  };

  const handleUnbookItinerary = (itinId: string, quoteNum?: string) => {
    // 1. Remove from tripAccounts
    setTripAccounts((prev) =>
      prev.filter((a) => a.itineraryId !== itinId && (!quoteNum || a.quoteNumber !== quoteNum))
    );
    // 2. Revert itinerary status
    setItineraries((prev) =>
      prev.map((itin) => (itin.id === itinId ? { ...itin, tripStatus: undefined } : itin))
    );
    if (currentItinerary?.id === itinId) {
      setCurrentItinerary((prev) => (prev ? { ...prev, tripStatus: undefined } : null));
    }
    // 3. Revert linked CRM lead status
    setLeads((prev) =>
      prev.map((l) =>
        l.itineraryId === itinId || (quoteNum && l.quoteNumber === quoteNum)
          ? {
              ...l,
              status: 'itinerary_sent',
              tripStatus: undefined,
              logs: [
                {
                  id: `log-${Date.now()}`,
                  timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
                  type: 'note',
                  summary: 'Booking unbooked / canceled from Itinerary Builder. Account entry purged from ledger.',
                  loggedBy: 'User',
                },
                ...(l.logs || []),
              ],
              updatedAt: new Date().toISOString(),
            }
          : l
      )
    );
    showToast('✓ Booking reverted. Account entry deleted from ledger.');
  };


  const handleDuplicateItinerary = (itin: Itinerary) => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const duplicated: Itinerary = {
      ...itin,
      id: `itin-${Date.now()}`,
      quoteNumber: `NED-${new Date().getFullYear()}-${randomSuffix}`,
      guestName: `${itin.guestName || 'Guest'} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const nextList = [duplicated, ...itineraries];
    setItineraries(nextList);
    saveItineraries(nextList);
    handleEditItinerary(duplicated);
    showToast(`Duplicated into Quote #${duplicated.quoteNumber}`);
  };

  const handleDeleteItinerary = (id: string) => {
    const nextList = itineraries.filter((item) => item.id !== id);
    setItineraries(nextList);
    saveItineraries(nextList);
    if (currentItinerary?.id === id) {
      setCurrentItinerary(nextList[0] || null);
    }
    showToast('Itinerary quote deleted.');
  };

  const handleSelectTemplate = (
    templateData: Omit<Itinerary, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newItinerary: Itinerary = {
      ...templateData,
      id: `itin-${Date.now()}`,
      quoteNumber: `NED-${new Date().getFullYear()}-${randomSuffix}`,
      guestName: currentItinerary?.guestName || templateData.guestName,
      guestPhone: currentItinerary?.guestPhone || templateData.guestPhone,
      guestEmail: currentItinerary?.guestEmail || templateData.guestEmail,
      guestCity: currentItinerary?.guestCity || templateData.guestCity,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setCurrentItinerary(newItinerary);
    setBuilderSession(Date.now());
    setActiveTab('itinerary');
    setViewMode('builder');
  };

  const handleGenerateNorthSikkimTour = () => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const start = new Date();
    start.setDate(start.getDate() + 10);
    const startStr = start.toISOString().split('T')[0];
    const end = new Date(start);
    end.setDate(end.getDate() + 4);
    const endStr = end.toISOString().split('T')[0];

    const northSikkimItin: Itinerary = {
      id: `itin-ns-${Date.now()}`,
      quoteNumber: `NED-${new Date().getFullYear()}-${randomSuffix}`,
      title: 'North Sikkim Alpine Odyssey: Lachen, Gurudongmar Lake, Lachung & Yumthang Valley',
      destination: 'North Sikkim (Lachen & Lachung)',
      heroImageUrl: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=1200&auto=format&fit=crop',
      heroImageCaption: 'Gurudongmar Sacred Alpine Lake & Snow Peaks (Alt. 17,800 ft)',
      guestName: 'North Sikkim Tour Guest',
      guestPhone: '+91 98000 00000',
      guestEmail: 'guest@example.com',
      guestCity: 'Kolkata',
      adults: 2,
      children: 0,
      infants: 0,
      travelStartDate: startStr,
      travelEndDate: endStr,
      durationDays: 5,
      durationNights: 4,
      pickupLocation: 'Bagdogra Airport (IXB) / NJP / Gangtok',
      dropLocation: 'Bagdogra Airport (IXB) / NJP / Gangtok',
      hotelCategory: 'Deluxe Category (3-Star Mountain View)',
      mealPlan: NORTH_SIKKIM_COMPULSORY_MEAL_PLAN,
      pricingMode: 'both',
      reservedCab: {
        enabled: true,
        name: 'Option A: Reserved Cab Facility (Private Dedicated SUV)',
        vehicleType: 'Innova / Xylo',
        description: 'Exclusive private luxury mountain vehicle dedicated exclusively for your party from Gangtok to North Sikkim and back. Flexible photo stops and maximum comfort.',
        pricePerPerson: 16500,
        totalPackagePrice: 33000,
        gstPercentage: 0,
        gstIncluded: true,
        specificInclusions: [
          'Exclusive private Innova / Xylo dedicated throughout the North Sikkim tour',
          'Hotel doorstep pickup in Gangtok and drop back',
          'All driver mountain allowance, North Sikkim permit fees, and checkpoint clearances',
          'Flexible photo stops at Singhik, Naga Waterfall & Chungthang confluence',
        ],
        specificExclusions: [
          'Zero Point (Yumesamdong) & Katao snow point vehicle supplement (INR 3,500-4,500 payable on spot to local driver)',
          'Personal winter gear rental (heavy snow coat, gumboots, gloves at Yumthang)',
        ],
      },
      sharingCab: {
        enabled: true,
        name: 'Option B: Sharing Cab Facility (Fixed Tata Sumo / Mahindra Bolero)',
        vehicleType: 'Tata Sumo / Mahindra Bolero',
        description: 'Shared mountain cab (Tata Sumo / Bolero) with seat allocation on fixed departure schedule from Vajra Taxi Stand, Gangtok.',
        pricePerPerson: 8500,
        totalPackagePrice: 17000,
        gstPercentage: 0,
        gstIncluded: true,
        specificInclusions: [
          'Seat allocation in shared Tata Sumo / Bolero on scheduled North Sikkim departure slots',
          'North Sikkim tourist permit and inner-line security passes',
          'Shared route transfers from Gangtok Vajra Stand to Lachen, Gurudongmar, Lachung, Yumthang & return',
        ],
        specificExclusions: [
          'Local taxi from hotel to Gangtok Vajra Taxi Stand on Day 1 morning and return on Day 5',
          'Zero Point / Katao extension charges',
        ],
      },
      packageCost: 24000,
      sellingCost: 33000,
      packageCostSharing: 12000,
      sellingCostSharing: 17000,
      markupPercentage: 27.27,
      totalTransportCost: 15000,
      totalHotelCost: 16000,
      totalActivitiesCost: 2000,
      days: [
        {
          id: 'ns-d1',
          dayNumber: 1,
          date: startStr,
          title: 'Gangtok to Lachen (Alt. 8,838 ft) - Scenic North Sikkim Highway Drive',
          description: 'Morning pickup from Gangtok (around 10:00 AM) and drive towards Lachen. Travel via the picturesque North Sikkim Highway with scenic stops at Singhik Viewpoint, Seven Sisters Waterfalls, Naga Falls, and Chungthang (confluence of Lachen Chu and Lachung Chu rivers). Reach the quaint wooden village of Lachen by late afternoon. Check into hotel and relax.',
          sightseeingHighlights: ['Singhik Viewpoint', 'Seven Sisters Waterfall', 'Naga Waterfall', 'Chungthang Confluence', 'Lachen Monastery'],
          nightStay: 'Lachen',
          mealPlan: NORTH_SIKKIM_DAY_MEAL_PLAN,
          transportDetails: 'Mountain SUV transfer from Gangtok to Lachen (approx 125 km / 6-7 hrs)',
          imageUrl: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=800&auto=format&fit=crop',
          imageCaption: 'Scenic Himalayan valleys along the North Sikkim Highway',
        },
        {
          id: 'ns-d2',
          dayNumber: 2,
          date: '',
          title: 'Excursion to Sacred Gurudongmar Lake (17,800 ft) & Transfer to Lachung (8,610 ft)',
          description: 'Early morning start (04:00 AM) through Cold Desert terrain and Thangu Valley towards Gurudongmar Lake, one of the highest sacred alpine lakes in the world, revered by Buddhists and Sikhs. Marvel at the turquoise blue waters reflecting Mount Siniolchu and Kanchenjunga ranges. Return to Lachen for hot lunch, then proceed to the sister valley village of Lachung. Overnight at Lachung hotel.',
          sightseeingHighlights: ['Gurudongmar Alpine Lake (17,800 ft)', 'Cold Desert Chopta Valley', 'Thangu High-Altitude Outpost', 'Drive to Lachung Valley'],
          nightStay: 'Lachung',
          mealPlan: NORTH_SIKKIM_DAY_MEAL_PLAN,
          transportDetails: 'High-altitude 4WD excursion and transfer to Lachung',
          imageUrl: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=800&auto=format&fit=crop',
          imageCaption: 'Turquoise Waters of Sacred Gurudongmar Lake (Alt. 17,800 ft)',
        },
        {
          id: 'ns-d3',
          dayNumber: 3,
          date: '',
          title: 'Yumthang Valley of Flowers & Optional Zero Point Excursion',
          description: 'After breakfast, proceed to Yumthang Valley, the world-renowned Valley of Flowers at 11,800 ft surrounded by snow-capped peaks and rhododendron forests. Visit the Sulphur Hot Springs known for therapeutic qualities. Optional drive to Zero Point (Yumesamdong at 15,300 ft where civilian road ends amidst perpetual snow). Return to Lachung hotel for lunch. Afternoon visit Lachung Monastery.',
          sightseeingHighlights: ['Yumthang Valley of Flowers', 'Shingba Rhododendron Sanctuary', 'Sulphur Hot Springs', 'Optional Zero Point (Yumesamdong)'],
          nightStay: 'Lachung',
          mealPlan: NORTH_SIKKIM_DAY_MEAL_PLAN,
          transportDetails: 'Scenic excursion cab to Yumthang & Zero Point',
          imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=800&auto=format&fit=crop',
          imageCaption: 'Yumthang Valley flanked by snowbound Himalayan giants',
        },
        {
          id: 'ns-d4',
          dayNumber: 4,
          date: '',
          title: 'Lachung to Gangtok Return via Bheema Waterfall',
          description: 'After a leisurely mountain breakfast, bid farewell to Lachung and commence the scenic descent back to Gangtok. Stop at Bheema Waterfall and Twin Waterfalls along the route. Arrive in Gangtok by late afternoon. Check in to Gangtok hotel and spend the evening shopping at MG Marg for tea, handicrafts, and prayer wheels.',
          sightseeingHighlights: ['Bheema Waterfall', 'Twin Waterfalls', 'Mangan Valley', 'Evening shopping at MG Marg'],
          nightStay: 'Gangtok',
          mealPlan: NORTH_SIKKIM_DAY_MEAL_PLAN,
          transportDetails: 'Scenic mountain descent back to Gangtok',
          imageUrl: 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?q=80&w=800&auto=format&fit=crop',
          imageCaption: 'Cascading Mountain Waterfalls along the return route',
        },
        {
          id: 'ns-d5',
          dayNumber: 5,
          date: endStr,
          title: 'Gangtok Hotel Checkout & Scenic Departure Transfer to NJP / Bagdogra',
          description: 'Enjoy breakfast at your Gangtok hotel. Complete checkout formalities and board your vehicle for the picturesque descent following the Teesta river valley down to Siliguri. Drop at Bagdogra Airport (IXB) or New Jalpaiguri Railway Station (NJP) with unforgettable memories of the Himalayas.',
          sightseeingHighlights: ['Teesta River Gorge View', 'Rangpo Border Checkpoint', 'Siliguri Plains drop'],
          nightStay: 'Departure',
          mealPlan: 'Breakfast Included',
          transportDetails: 'Direct transfer to Bagdogra Airport / NJP Station',
          imageUrl: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=800&auto=format&fit=crop',
          imageCaption: 'Scenic descent through pine hills to departure terminal',
        },
      ],
      commonInclusions: [
        'Accommodation in comfortable deluxe mountain hotels/resorts in Lachen, Lachung & Gangtok',
        'COMPULSORY ALL MEALS (AP Plan): Daily Breakfast, Lunch & Dinner included throughout North Sikkim as per regional tourism regulations',
        'Dedicated vehicle transport (Reserved or Sharing as per chosen package option)',
        'North Sikkim Inner Line Permits, Indian Army security passes, and checkpoint documentation',
        'All driver mountain allowances, fuel charges, state road taxes, and entry fees',
        '24/7 round-the-clock emergency operations coordination support from Siliguri & Gangtok',
      ],
      commonExclusions: [
        'Zero Point (Yumesamdong) / Mount Katao vehicle supplement (payable directly on spot if availed)',
        'Nathula Pass permit & vehicle supplement (INR 5,500 - 6,500 per vehicle approx, closed on Mondays only)',
        'Winter personal gear rental (heavy snow jackets, gumboots, gloves at Yumthang)',
        'Airfare / Train tickets to Bagdogra / NJP',
        'Personal laundry, room heater charges at high altitude, extra beverages, tips, and portage',
      ],
      specialAdvisories: [
        'COMPULSORY ALL MEALS: North Sikkim (Lachen & Lachung) operates strictly on AP Meal Plan (Breakfast, Lunch & Dinner) due to remote mountain logistics.',
        'Nathula Pass (Indo-China Border) is closed ONLY on Mondays for tourists (open Tuesday through Sunday) and is subject to Indian Army permit availability.',
        'Gurudongmar Lake is at an extreme altitude of 17,800 ft. Acclimatization is essential. Children under 4 years and senior citizens with breathing difficulties should exercise caution.',
        'Carry Original Voter ID Card or Passport + 4 passport size photos for North Sikkim army permits (Aadhaar is not accepted at high-altitude army checkpoints).',
        'Only Postpaid BSNL, Jio, and Airtel connections have coverage in parts of North Sikkim.',
      ],
      termsAndConditions: defaultTermsAndConditions,
      paymentMilestones: defaultPaymentMilestones,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setCurrentItinerary(northSikkimItin);
    handleSaveItinerary(northSikkimItin);
    setBuilderSession(Date.now());
    setActiveTab('itinerary');
    setViewMode('builder');
    showToast('✓ Loaded North Sikkim Tour with Compulsory All Meals (AP Plan) & Dual Rates!');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab === 'settings') {
            setIsSettingsModalOpen(true);
          } else {
            setActiveTab(tab);
            if (tab === 'itinerary' && viewMode === 'preview') {
              setViewMode('builder');
            }
          }
        }}
        onNewItinerary={handleNewItinerary}
        onNewLead={() => {
          setEditingLead(null);
          setIsLeadModalOpen(true);
        }}
        onOpenAiCopilot={() => handleOpenAiCopilot()}
        onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
        overdueLeadsCount={overdueLeadsCount}
        totalSavedQuotes={itineraries.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tab 0: Home / Start Page */}
        {activeTab === 'home' && (
          <StartPage
            onNavigateTab={(tab) => {
              if (tab === 'settings') {
                setIsSettingsModalOpen(true);
              } else {
                setActiveTab(tab);
                if (tab === 'itinerary' && viewMode === 'preview') {
                  setViewMode('builder');
                }
              }
            }}
            onNewItinerary={handleNewItinerary}
            onNewLead={() => {
              setEditingLead(null);
              setIsLeadModalOpen(true);
            }}
            onOpenAiCopilot={handleOpenAiCopilot}
            onOpenVoiceModal={() => handleOpenVoiceModalManual('voice')}
            onOpenTemplates={() => setIsTemplatesModalOpen(true)}
            onOpenTextUpload={handleOpenTextUpload}
            onOpenSettings={() => setIsSettingsModalOpen(true)}
            onOpenSalesTeam={() => setIsSalesTeamModalOpen(true)}
            onSelectItinerary={(itin) => {
              setCurrentItinerary(itin);
              setActiveTab('itinerary');
              setViewMode('preview');
            }}
            onEditItinerary={handleEditItinerary}
            onSelectLead={(lead) => {
              setEditingLead(lead);
              setIsLeadModalOpen(true);
            }}
            onGenerateNorthSikkimTour={handleGenerateNorthSikkimTour}
            itineraries={itineraries}
            leads={leads}
            tripAccounts={tripAccounts}
            salesPersons={salesPersons}
            companyProfile={companyProfile}
          />
        )}

        {/* Tab 1: Itinerary Builder & PDF Preview */}
        {activeTab === 'itinerary' && (
          <>
            {viewMode === 'builder' ? (
              <ItineraryBuilder
                key={`${currentItinerary?.id || 'new-itinerary'}-${builderSession}`}
                initialItinerary={currentItinerary}
                leads={leads}
                companyProfile={companyProfile}
                salesPersons={salesPersons}
                onQuickAddSalesPerson={handleQuickAddSalesPerson}
                onOpenManageSalesTeam={() => setIsSalesTeamModalOpen(true)}
                onConvertItineraryToBooking={handleConvertItineraryToBooking}
                onNavigateToAccounts={() => setActiveTab('accounts')}
                onSaveItinerary={handleSaveItinerary}
                onPreviewItinerary={(itin) => {
                  handleSaveItinerary(itin);
                  setCurrentItinerary(itin);
                  setViewMode('preview');
                }}
                onOpenTemplates={() => setIsTemplatesModalOpen(true)}
                onUpdateLogo={handleUpdateLogo}
                onUpdateQrCode={handleUpdateQrCode}
                onOpenSettings={() => setIsSettingsModalOpen(true)}
                onUnbookItinerary={handleUnbookItinerary}
                onOpenAiCopilot={handleOpenAiCopilot}
                onOpenVoucher={handleOpenVoucherForItinerary}
              />
            ) : currentItinerary ? (
              <ItineraryPreview
                itinerary={currentItinerary}
                companyProfile={companyProfile}
                onEdit={() => setViewMode('builder')}
                onBack={() => setViewMode('builder')}
                onUpdateLogo={handleUpdateLogo}
                onUpdateQrCode={handleUpdateQrCode}
                onUpdateItinerary={(updated) => {
                  setCurrentItinerary(updated);
                  handleSaveItinerary(updated);
                }}
              />
            ) : null}
          </>
        )}

        {/* Tab 2: Lead CRM & Client Follow-up Management */}
        {activeTab === 'leads' && (
          <LeadDashboard
            leads={leads}
            salesPersons={salesPersons}
            onQuickAddSalesPerson={handleQuickAddSalesPerson}
            onOpenManageSalesTeam={() => setIsSalesTeamModalOpen(true)}
            onNewLead={() => {
              setEditingLead(null);
              setIsLeadModalOpen(true);
            }}
            onEditLead={(lead) => {
              setEditingLead(lead);
              setIsLeadModalOpen(true);
            }}
            onDeleteLead={handleDeleteLead}
            onConvertLeadToQuote={handleConvertLeadToQuote}
            onOpenInteractionLog={(lead) => {
              setInteractionLead(lead);
              setIsInteractionModalOpen(true);
            }}
            onConvertLeadWithAdvance={handleConvertLeadWithAdvance}
            onNavigateToAccounts={() => setActiveTab('accounts')}
            onUnbookLead={handleUnbookLead}
            onViewVoucher={handleOpenVoucherForLead}
            onViewLeadQuote={(itineraryId) => {
              const itin = itineraries.find((i) => i.id === itineraryId);
              if (itin) {
                setCurrentItinerary(itin);
                setActiveTab('itinerary');
                setViewMode('builder');
              }
            }}
          />
        )}

        {/* Tab 3: Agency Accounts, Balance Sheets & 50% Profit Calculator */}
        {activeTab === 'accounts' && (
          <AccountsDashboard
            accounts={tripAccounts}
            salesPersons={salesPersons}
            onQuickAddSalesPerson={handleQuickAddSalesPerson}
            onOpenManageSalesTeam={() => setIsSalesTeamModalOpen(true)}
            onUpdateAccount={handleUpdateAccount}
            onCreateAccount={handleCreateAccount}
            onDeleteAccount={handleDeleteAccount}
            onClearAllAccounts={handleClearAllAccounts}
            onResetToSampleAccounts={handleResetToSampleAccounts}
            onViewVoucher={handleOpenVoucherForAccount}
            onNavigateToLead={(leadId) => {
              const lead = leads.find((l) => l.id === leadId);
              if (lead) {
                setEditingLead(lead);
                setIsLeadModalOpen(true);
              }
            }}
          />
        )}

        {/* Tab 4: Saved Itineraries & PDF Archive */}
        {activeTab === 'saved' && (
          <ItineraryList
            itineraries={itineraries}
            onSelectItinerary={(itin) => {
              setCurrentItinerary(itin);
              setActiveTab('itinerary');
              setViewMode('preview');
            }}
            onEditItinerary={handleEditItinerary}
            onDuplicateItinerary={handleDuplicateItinerary}
            onDeleteItinerary={handleDeleteItinerary}
            onCreateNew={handleNewItinerary}
          />
        )}
      </main>

      {/* Global Modals */}
      {/* 1. Lead Add / Edit Modal */}
      <LeadModal
        isOpen={isLeadModalOpen}
        onClose={() => setIsLeadModalOpen(false)}
        onSave={handleSaveLead}
        initialLead={editingLead}
        salesPersons={salesPersons}
        onQuickAddSalesPerson={handleQuickAddSalesPerson}
        onOpenManageSalesTeam={() => setIsSalesTeamModalOpen(true)}
      />

      {/* 2. Interaction Log Modal (Calls, WhatsApp, Follow-ups) */}
      <LeadInteractionModal
        isOpen={isInteractionModalOpen}
        onClose={() => setIsInteractionModalOpen(false)}
        lead={interactionLead}
        onUpdateLead={handleSaveLead}
      />

      {/* 3. Pre-configured Tour Templates Modal */}
      <TemplatesModal
        isOpen={isTemplatesModalOpen}
        onClose={() => setIsTemplatesModalOpen(false)}
        onSelectTemplate={handleSelectTemplate}
      />

      {/* 3.1 Upload Text Itinerary Modal (Unified JARVIS Suite) */}
      <TextItineraryUploadModal
        isOpen={isTextUploadModalOpen}
        onClose={() => setIsTextUploadModalOpen(false)}
        destinationContext={activeTab === 'itinerary' && currentItinerary ? currentItinerary.destination : 'Sikkim & North East'}
        currentItinerary={currentItinerary}
        onApplyItinerary={handleApplyAiItinerary}
        savedItineraries={itineraries}
        leads={leads}
        onSelectItinerary={handleSelectSavedItinerary}
        onSaveLead={handleSaveLead}
        onUpdateLeadStatus={handleUpdateLeadStatusDirect}
        onNavigate={handleNavigateDirect}
        onShowToast={showToast}
        onApplyParsedItinerary={(parsedItin: Partial<Itinerary>) => {
          const fullItin = parsedItin as Itinerary;
          setCurrentItinerary(fullItin);
          handleSaveItinerary(fullItin);
          setActiveTab('itinerary');
          setViewMode('builder');
          showToast(`✓ Itinerary #${fullItin.quoteNumber || 'Quote'} parsed and loaded into builder!`);
        }}
      />

      {/* 4. Agency Settings & Logo Upload Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        companyProfile={companyProfile}
        onSaveProfile={handleSaveProfile}
      />

      {/* 5. Dedicated Sales Team Management Modal (Add, Edit, Delete Custom Executives) */}
      <SalesTeamModal
        isOpen={isSalesTeamModalOpen}
        onClose={() => setIsSalesTeamModalOpen(false)}
        salesPersons={salesPersons}
        onAddSalesPerson={handleAddSalesPerson}
        onUpdateSalesPerson={handleUpdateSalesPerson}
        onDeleteSalesPerson={handleDeleteSalesPerson}
      />

      {/* 6. JARVIS AI Itinerary Copilot Drawer */}
      <AIAssistantDrawer
        isOpen={isAiDrawerOpen}
        onClose={() => setIsAiDrawerOpen(false)}
        currentItinerary={currentItinerary}
        onApplyItinerary={handleApplyAiItinerary}
        onShowToast={showToast}
        initialPrompt={aiInitialPrompt}
        onClearInitialPrompt={() => setAiInitialPrompt(undefined)}
        onOpenVoiceModal={handleOpenVoiceModalManual}
        savedItineraries={itineraries}
        leads={leads}
        onSelectItinerary={handleSelectSavedItinerary}
        onSaveLead={handleSaveLead}
        onUpdateLeadStatus={handleUpdateLeadStatusDirect}
        onNavigate={handleNavigateDirect}
      />

      {/* 7. JARVIS Unified AI Suite (Live Voice AI + Smart Text Upload + Chat Copilot) */}
      <JarvisVoiceModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        initialMode={voiceModalInitialMode}
        destinationContext={activeTab === 'itinerary' && currentItinerary ? currentItinerary.destination : 'Sikkim & North East'}
        currentItinerary={currentItinerary}
        onApplyItinerary={handleApplyAiItinerary}
        onApplyParsedItinerary={(parsedItin: Partial<Itinerary>) => {
          const fullItin = parsedItin as Itinerary;
          setCurrentItinerary(fullItin);
          handleSaveItinerary(fullItin);
          setActiveTab('itinerary');
          setViewMode('builder');
          showToast(`✓ Itinerary #${fullItin.quoteNumber || 'Quote'} parsed and loaded into builder!`);
        }}
        wakeTriggerSource={wakeTriggerSource}
        savedItineraries={itineraries}
        leads={leads}
        onSelectItinerary={handleSelectSavedItinerary}
        onSaveLead={handleSaveLead}
        onUpdateLeadStatus={handleUpdateLeadStatusDirect}
        onNavigate={handleNavigateDirect}
        onShowToast={showToast}
      />

      {/* 8. Global Hands-Free Wake-Word & Acoustic Clap Sentinel (Active across all screens) */}
      <JarvisWakeWordListener
        onWake={handleWakeJarvis}
        isVoiceModalOpen={isVoiceModalOpen}
        onSleep={handleSleepJarvis}
      />

      {/* 9. Official Tour Booking Confirmation Voucher (PDF) - Provided for first-time confirmation */}
      <BookingConfirmationVoucherModal
        isOpen={isVoucherModalOpen}
        onClose={() => setIsVoucherModalOpen(false)}
        voucherData={activeVoucherData}
        companyProfile={companyProfile}
      />

      {/* Floating JARVIS Voice & Copilot Trigger (Always accessible) */}
      {!isAiDrawerOpen && !isVoiceModalOpen && (
        <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2">
          {/* Direct Live Voice Conversation with JARVIS */}
          <button
            onClick={() => handleOpenVoiceModalManual('voice')}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-slate-950 font-black rounded-full shadow-2xl shadow-cyan-500/40 hover:shadow-cyan-500/60 border border-cyan-200/60 transition-all duration-200 active:scale-95 group text-xs tracking-wide cursor-pointer animate-pulse-subtle"
            title="Talk to JARVIS with Live Voice (Gemini 3.8 Live API)"
          >
            <Mic className="w-4 h-4 text-slate-950 group-hover:scale-110 transition-transform" />
            <span>Talk to JARVIS</span>
            <span className="w-2 h-2 rounded-full bg-slate-950 animate-ping"></span>
          </button>

          {/* Quick Chat Drawer Access */}
          <button
            onClick={() => handleOpenAiCopilot()}
            className="p-2.5 bg-slate-900/90 hover:bg-slate-800 text-emerald-400 rounded-full shadow-xl border border-emerald-500/50 hover:border-emerald-400 transition-all duration-200 active:scale-95 cursor-pointer"
            title="Open JARVIS Text Chat Drawer"
          >
            <Sparkles className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Floating In-App Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 right-6 z-50 bg-slate-900 border border-emerald-500/50 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs animate-fade-in font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
