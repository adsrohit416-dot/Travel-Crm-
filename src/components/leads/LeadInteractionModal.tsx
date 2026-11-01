import React, { useState } from 'react';
import { X, Phone, MessageSquare, Mail, Calendar, CheckSquare, Plus, Clock, User } from 'lucide-react';
import { InteractionLog, Lead, LeadStatus } from '../../types';

interface LeadInteractionModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
  onUpdateLead: (updatedLead: Lead) => void;
}

export const LeadInteractionModal: React.FC<LeadInteractionModalProps> = ({
  isOpen,
  onClose,
  lead,
  onUpdateLead,
}) => {
  const [logType, setLogType] = useState<InteractionLog['type']>('call');
  const [summary, setSummary] = useState('');
  const [outcome, setOutcome] = useState('');
  const [loggedBy, setLoggedBy] = useState('Travel Specialist');
  const [newStatus, setNewStatus] = useState<LeadStatus>('follow_up');
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');
  const [nextFollowUpTime, setNextFollowUpTime] = useState('');

  if (!isOpen || !lead) return null;

  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!summary.trim()) {
      alert('Please enter interaction summary.');
      return;
    }

    const newLog: InteractionLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      type: logType,
      summary: summary.trim(),
      outcome: outcome.trim() || undefined,
      loggedBy: loggedBy.trim() || 'Agent',
    };

    const updatedLead: Lead = {
      ...lead,
      status: newStatus || lead.status,
      nextFollowUpDate: nextFollowUpDate || lead.nextFollowUpDate,
      nextFollowUpTime: nextFollowUpTime || lead.nextFollowUpTime,
      logs: [newLog, ...(lead.logs || [])],
      updatedAt: new Date().toISOString(),
    };

    onUpdateLead(updatedLead);
    setSummary('');
    setOutcome('');
  };

  const getIconForType = (type: InteractionLog['type']) => {
    switch (type) {
      case 'call':
        return <Phone className="w-3.5 h-3.5 text-sky-400" />;
      case 'whatsapp':
        return <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />;
      case 'email':
        return <Mail className="w-3.5 h-3.5 text-violet-400" />;
      default:
        return <Calendar className="w-3.5 h-3.5 text-amber-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full text-slate-100 shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">{lead.guestName}</h2>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-300 font-mono">{lead.phone}</span>
            </div>
            <p className="text-xs text-slate-400">
              {lead.destination} · Preferred: {lead.preferredCab.toUpperCase()} CAB
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 text-xs max-h-[75vh] overflow-y-auto">
          {/* Add Interaction Form */}
          <form
            onSubmit={handleAddLog}
            className="p-4 rounded-lg bg-slate-950/70 border border-slate-800 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200">Log New Client Activity</span>
              <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-md border border-slate-800">
                <button
                  type="button"
                  onClick={() => setLogType('call')}
                  className={`px-2.5 py-1 rounded text-xs transition-colors ${
                    logType === 'call' ? 'bg-sky-600 text-white font-medium' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Phone Call
                </button>
                <button
                  type="button"
                  onClick={() => setLogType('whatsapp')}
                  className={`px-2.5 py-1 rounded text-xs transition-colors ${
                    logType === 'whatsapp' ? 'bg-emerald-600 text-white font-medium' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  WhatsApp
                </button>
                <button
                  type="button"
                  onClick={() => setLogType('email')}
                  className={`px-2.5 py-1 rounded text-xs transition-colors ${
                    logType === 'email' ? 'bg-violet-600 text-white font-medium' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Email
                </button>
                <button
                  type="button"
                  onClick={() => setLogType('note')}
                  className={`px-2.5 py-1 rounded text-xs transition-colors ${
                    logType === 'note' ? 'bg-amber-600 text-white font-medium' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Internal Note
                </button>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Conversation Notes / What was discussed?</label>
              <textarea
                required
                rows={2}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="e.g. Called guest regarding 6N Sikkim tour. They liked the Reserved Innova option, requested inclusion of Nathula pass..."
                className="w-full bg-slate-900 border border-slate-700 rounded-md p-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Outcome / Agreed Next Step</label>
                <input
                  type="text"
                  value={outcome}
                  onChange={(e) => setOutcome(e.target.value)}
                  placeholder="e.g. Send revised quote tonight"
                  className="w-full bg-slate-900 border border-slate-700 rounded-md px-2.5 py-1.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Update Lead Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as LeadStatus)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-md px-2.5 py-1.5 text-white"
                >
                  <option value="contacted">Contacted / Call Done</option>
                  <option value="itinerary_sent">Itinerary Sent</option>
                  <option value="follow_up">Follow-up Scheduled</option>
                  <option value="negotiation">Under Negotiation</option>
                  <option value="booked">Won / Booked</option>
                  <option value="lost">Lost / Disqualified</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Next Follow-up Date</label>
                <input
                  type="date"
                  value={nextFollowUpDate || lead.nextFollowUpDate}
                  onChange={(e) => setNextFollowUpDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-md px-2.5 py-1.5 text-white font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Specialist:</span>
                <input
                  type="text"
                  value={loggedBy}
                  onChange={(e) => setLoggedBy(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-white text-[11px]"
                />
              </div>

              <button
                type="submit"
                className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-md transition-colors"
              >
                Save Activity
              </button>
            </div>
          </form>

          {/* Activity Timeline */}
          <div>
            <h3 className="font-semibold text-slate-300 mb-3 text-xs">
              Interaction History & Follow-up Trail ({lead.logs?.length || 0})
            </h3>

            {(!lead.logs || lead.logs.length === 0) ? (
              <p className="text-slate-500 italic py-4 text-center">
                No past activities recorded yet. Use the form above to log calls or WhatsApp updates.
              </p>
            ) : (
              <div className="space-y-3">
                {lead.logs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-lg bg-slate-950/40 border border-slate-800 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-slate-400 text-[11px]">
                      <div className="flex items-center gap-1.5">
                        {getIconForType(log.type)}
                        <span className="uppercase font-semibold tracking-wider text-slate-300">
                          {log.type}
                        </span>
                        <span>·</span>
                        <span className="font-mono">{log.timestamp}</span>
                      </div>
                      <span className="text-slate-400">{log.loggedBy}</span>
                    </div>
                    <p className="text-slate-200 text-xs">{log.summary}</p>
                    {log.outcome && (
                      <div className="text-[11px] text-emerald-400/90 font-medium pt-0.5">
                        Outcome: {log.outcome}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 rounded-md transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
