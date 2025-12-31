import { useState, useEffect, useCallback } from 'react';
import type { Session, Settings, SubGoal, TagType, PinnedItem } from '../types';
import type { Insight } from '../types/insights';
import { useChat } from '../hooks/useChat';
import { useClientSideAnalysis, extractGoalKeywords, checkDriftClientSide } from '../hooks/useClientSideAnalysis';
import { useConversationAnalysis } from '../hooks/useConversationAnalysis';
import { useCognitiveProfile } from '../hooks/useCognitiveProfile';
import { useClipCollections } from '../hooks/useClipCollections';
import { useBehavioralInference } from '../hooks/useBehavioralInference';
import {
  loadSessions,
  saveSessions,
  loadSettings,
  saveSettings,
  generateId,
  exportSessionAsMarkdown,
} from '../utils/storage';
// Old components (keep for now, migrate gradually)
import { Sidebar } from './Sidebar';
import { EnhancedChatInterface } from './EnhancedChatInterface';
import { GoalModal } from './GoalModal';
import { SettingsModal } from './SettingsModal';
import { DriftAlert } from './DriftAlert';
import { InsightIndicator } from './InsightIndicator';
import { FocusModeOverlay } from './FocusMode';
import { CognitiveProfilePanel } from './CognitiveProfilePanel';
import { ThoughtTopology } from './ThoughtTopology';
import { ClipCollections } from './ClipCollections';
import { GoalInference } from './GoalInference';
import { MicroConfirmation } from './MicroConfirmation';
// New 1-click UI components
import { CommandBar } from './CommandBar';
import { FloatingTray } from './FloatingTray';
import { SlidePanel } from './SlidePanel';
import { CollectionsPanel } from './CollectionsPanel';
import { QuickSetup } from './QuickSetup';

export function App() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [settings, setSettings] = useState<Settings>(loadSettings());
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showProfilePanel, setShowProfilePanel] = useState(false);
  const [showTopology, setShowTopology] = useState(false);
  const [showClipCollections, setShowClipCollections] = useState(false);
  const [driftAlert, setDriftAlert] = useState<string | null>(null);
  const [focusMode] = useState(false); // TODO: Add toggle to CommandBar
  // New streamlined UI state
  const [showCollectionsPanel, setShowCollectionsPanel] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true); // Can toggle sidebar

  const goal = currentSession?.goal || '';

  // Clip collections - user-created categories for saving text snippets
  const {
    clips,
    categories,
    addClip,
    removeClip,
    addCategory,
    removeCategory,
  } = useClipCollections();

  // Behavioral inference - learns user patterns over time
  const {
    trackMetric,
    trackClipByCategory,
    analyzePatterns,
    generateObservations,
    getNextObservation,
    respondToObservation,
    getPersonalizationHints,
  } = useBehavioralInference();

  // Core hooks - ONLY the main chat uses LLM
  const { messages, isLoading, error, send, setMessages, clearError } = useChat(goal, settings);

  // CLIENT-SIDE analysis - NO API CALLS
  const {
    actionItems,
    analyzeMessage,
    toggleActionItem,
    dismissActionItem,
    reset: resetClientAnalysis,
  } = useClientSideAnalysis();

  // Insights state - user-triggered only
  const [insightsHistory, setInsightsHistory] = useState<Insight[]>([]);
  const [currentInsight, setCurrentInsight] = useState<Insight | null>(null);

  const addInsight = useCallback((insight: Insight) => {
    setCurrentInsight(insight);
    setInsightsHistory(prev => [insight, ...prev].slice(0, 20));
  }, []);

  const generateSessionInsight = useCallback(() => {
    if (!currentSession) return;
    const msgCount = currentSession.messages.length;
    const completedGoals = currentSession.subGoals.filter(g => g.completed).length;
    const totalGoals = currentSession.subGoals.length;

    const insight: Insight = {
      id: crypto.randomUUID(),
      type: msgCount > 10 ? 'clarification' : 'connection',
      title: 'Session Progress',
      description: `${msgCount} messages exchanged. ${completedGoals}/${totalGoals} milestones completed. ${clips.length} clips saved.`,
      confidence: 0.9,
      crystallization: 0.8,
      relatedMessageIds: [],
      timestamp: new Date(),
    };
    addInsight(insight);
  }, [currentSession, clips.length, addInsight]);

  const dismissInsight = useCallback(() => {
    setCurrentInsight(null);
  }, []);

  const showInsight = useCallback((insight: Insight) => {
    setCurrentInsight(insight);
  }, []);

  const {
    landmarks,
    momentum,
    getSummary,
    checkForLandmark: _checkForLandmark, // Disabled to save tokens
    updateMomentum,
    resetAnalysis: resetConversationAnalysis,
  } = useConversationAnalysis(settings);

  const {
    profile,
    isAnalyzing: isAnalyzingProfile,
    analyzeAndUpdate: _analyzeProfile, // Disabled - user can trigger via Profile panel
    updateThinkingStyle,
    addConceptToModel,
    addConnectionToModel,
    updateMentalModel,
  } = useCognitiveProfile(settings);

  // Load sessions on mount
  useEffect(() => {
    const loaded = loadSessions();
    setSessions(loaded);
  }, []);

  // Sync messages with current session and trigger analyses
  useEffect(() => {
    if (currentSession && messages.length > 0) {
      const updated = {
        ...currentSession,
        messages,
        updatedAt: new Date(),
      };
      setCurrentSession(updated);

      setSessions(prev => {
        const newSessions = prev.map(s => (s.id === updated.id ? updated : s));
        saveSessions(newSessions);
        return newSessions;
      });
    }
  }, [messages]);

  // Client-side only analysis - NO API CALLS
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];

      if (lastMessage.role === 'assistant') {
        // Update momentum (no API call - pure client-side)
        updateMomentum(messages);

        // Client-side action item detection (no API call)
        analyzeMessage(lastMessage);

        // Client-side drift check (no API call)
        // Personalize based on learned behavior
        const hints = getPersonalizationHints();
        const goalKeywords = extractGoalKeywords(goal);
        const { isDrifting, matchRatio } = checkDriftClientSide(messages, goalKeywords);

        // Adjust drift sensitivity based on learned exploration tendency
        let shouldAlert = isDrifting;
        if (hints.driftSensitivity === 'low') {
          // Exploratory users: only alert if severely off track
          shouldAlert = isDrifting && matchRatio < 0.15;
        } else if (hints.driftSensitivity === 'high') {
          // Focused users: alert earlier
          shouldAlert = isDrifting || matchRatio < 0.35;
        }

        if (shouldAlert) {
          setDriftAlert('The conversation may have drifted from your original goal.');
          trackMetric('tangentCount'); // Track for behavioral inference
        }
      }
    }
  }, [messages, updateMomentum, analyzeMessage, goal, trackMetric, getPersonalizationHints]);

  // Behavioral pattern analysis - run periodically
  useEffect(() => {
    // Analyze patterns every 10 messages
    if (messages.length > 0 && messages.length % 10 === 0) {
      analyzePatterns();
      generateObservations();
    }
  }, [messages.length, analyzePatterns, generateObservations]);

  const handleCreateSession = useCallback((goal: string, subGoals: SubGoal[]) => {
    const newSession: Session = {
      id: generateId(),
      name: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      goal,
      subGoals,
      messages: [],
      pinnedItems: [],
    };

    setCurrentSession(newSession);
    setMessages([]);
    resetClientAnalysis();
    resetConversationAnalysis();
    setInsightsHistory([]);
    setCurrentInsight(null);
    setDriftAlert(null);

    setSessions(prev => {
      const newSessions = [...prev, newSession];
      saveSessions(newSessions);
      return newSessions;
    });

    setShowGoalModal(false);
  }, [setMessages, resetClientAnalysis, resetConversationAnalysis]);

  // Quick start: Create a session without a goal (infer later)
  const handleQuickStart = useCallback(() => {
    const newSession: Session = {
      id: generateId(),
      name: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      goal: '', // Empty - will be inferred
      subGoals: [],
      messages: [],
      pinnedItems: [],
    };

    setCurrentSession(newSession);
    setMessages([]);
    resetClientAnalysis();
    resetConversationAnalysis();
    setInsightsHistory([]);
    setCurrentInsight(null);
    setDriftAlert(null);

    setSessions(prev => {
      const newSessions = [...prev, newSession];
      saveSessions(newSessions);
      return newSessions;
    });
  }, [setMessages, resetClientAnalysis, resetConversationAnalysis]);

  // Update session goal (from inference or manual edit)
  const handleUpdateGoal = useCallback((newGoal: string) => {
    if (!currentSession) return;

    const updated = {
      ...currentSession,
      goal: newGoal,
      updatedAt: new Date(),
    };

    setCurrentSession(updated);
    setSessions(prev => {
      const newSessions = prev.map(s => (s.id === updated.id ? updated : s));
      saveSessions(newSessions);
      return newSessions;
    });
  }, [currentSession]);

  const handleSelectSession = useCallback((session: Session) => {
    setCurrentSession(session);
    setMessages(session.messages);
    resetClientAnalysis();
    resetConversationAnalysis();
    setDriftAlert(null);
  }, [setMessages, resetClientAnalysis, resetConversationAnalysis]);

  const handleDeleteSession = useCallback((id: string) => {
    setSessions(prev => {
      const newSessions = prev.filter(s => s.id !== id);
      saveSessions(newSessions);
      return newSessions;
    });

    if (currentSession?.id === id) {
      setCurrentSession(null);
      setMessages([]);
    }
  }, [currentSession, setMessages]);

  const handleExportSession = useCallback((session: Session) => {
    const markdown = exportSessionAsMarkdown(session);
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${session.name || 'session'}-${session.id}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleToggleSubGoal = useCallback((id: string) => {
    if (!currentSession) return;

    const updated = {
      ...currentSession,
      subGoals: currentSession.subGoals.map(sg =>
        sg.id === id ? { ...sg, completed: !sg.completed } : sg
      ),
      updatedAt: new Date(),
    };

    setCurrentSession(updated);
    setSessions(prev => {
      const newSessions = prev.map(s => (s.id === updated.id ? updated : s));
      saveSessions(newSessions);
      return newSessions;
    });
  }, [currentSession]);

  const handleAddSubGoal = useCallback((subGoal: SubGoal) => {
    if (!currentSession) return;

    const updated = {
      ...currentSession,
      subGoals: [...currentSession.subGoals, subGoal],
      updatedAt: new Date(),
    };

    setCurrentSession(updated);
    setSessions(prev => {
      const newSessions = prev.map(s => (s.id === updated.id ? updated : s));
      saveSessions(newSessions);
      return newSessions;
    });
  }, [currentSession]);

  const handleRemoveSubGoal = useCallback((id: string) => {
    if (!currentSession) return;

    const updated = {
      ...currentSession,
      subGoals: currentSession.subGoals.filter(sg => sg.id !== id),
      updatedAt: new Date(),
    };

    setCurrentSession(updated);
    setSessions(prev => {
      const newSessions = prev.map(s => (s.id === updated.id ? updated : s));
      saveSessions(newSessions);
      return newSessions;
    });
  }, [currentSession]);

  const handlePin = useCallback((messageId: string, tag: TagType, excerpt: string) => {
    if (!currentSession) return;

    const pin: PinnedItem = {
      id: generateId(),
      messageId,
      tag,
      excerpt,
    };

    const updated = {
      ...currentSession,
      pinnedItems: [...currentSession.pinnedItems, pin],
      updatedAt: new Date(),
    };

    setCurrentSession(updated);
    setSessions(prev => {
      const newSessions = prev.map(s => (s.id === updated.id ? updated : s));
      saveSessions(newSessions);
      return newSessions;
    });
  }, [currentSession]);

  const handleUnpin = useCallback((pinId: string) => {
    if (!currentSession) return;

    const updated = {
      ...currentSession,
      pinnedItems: currentSession.pinnedItems.filter(p => p.id !== pinId),
      updatedAt: new Date(),
    };

    setCurrentSession(updated);
    setSessions(prev => {
      const newSessions = prev.map(s => (s.id === updated.id ? updated : s));
      saveSessions(newSessions);
      return newSessions;
    });
  }, [currentSession]);

  const handleSaveSettings = useCallback((newSettings: Settings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  }, []);

  const handleRefocus = useCallback(() => {
    if (!currentSession) return;
    send(`Let's refocus on my original goal: ${currentSession.goal}. What should we do next to make progress?`);
    setDriftAlert(null);
    trackMetric('promptedRefocusCount'); // They needed a prompt to refocus
  }, [currentSession, send, trackMetric]);

  const handleUseSynthesis = useCallback((prompt: string) => {
    send(prompt);
    dismissInsight();
    trackMetric('insightsActedOn'); // They used the insight
  }, [send, dismissInsight, trackMetric]);

  const handleDismissInsight = useCallback(() => {
    dismissInsight();
    trackMetric('insightsDismissed');
  }, [dismissInsight, trackMetric]);

  // Handle creating action item from selected text
  const handleCreateActionFromText = useCallback((text: string) => {
    // Use the action items hook's internal mechanism
    // For now, send a message asking to add this as an action item
    send(`Please note this as an action item I need to do: "${text}"`);
    trackMetric('actionItemsCreated');
  }, [send, trackMetric]);

  // Wrapped addClip that also tracks behavior
  const handleAddClip = useCallback((text: string, categoryId: string, sourceMessageId?: string) => {
    addClip(text, categoryId, sourceMessageId);
    trackClipByCategory(categoryId);
  }, [addClip, trackClipByCategory]);

  // Calculate goal alignment based on drift detection and momentum (0-1)
  const goalAlignment = driftAlert ? 0.3 : Math.max(0.5, momentum.level);

  // Get the active mental model for topology view
  const activeMentalModel = profile.mentalModels[0];

  // Helper to handle inline settings updates
  const handleUpdateSettings = useCallback((updates: Partial<Settings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    saveSettings(newSettings);
  }, [settings]);

  // Quick clip from selection
  const handleQuickClip = useCallback((categoryId: string) => {
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed) {
      const text = selection.toString().trim();
      if (text) {
        handleAddClip(text, categoryId);
        selection.removeAllRanges();
      }
    }
  }, [handleAddClip]);

  return (
    <div className={`flex h-screen ${focusMode ? 'bg-gray-950' : 'bg-white dark:bg-gray-900'}`}>
      {/* Focus mode overlay */}
      {focusMode && <FocusModeOverlay depth={momentum.depth} />}

      {/* Sidebar - toggleable */}
      <div className={`transition-all duration-300 ${focusMode || !showSidebar ? 'w-0 overflow-hidden' : 'w-72'}`}>
        <Sidebar
          currentSession={currentSession}
          sessions={sessions}
          actionItems={actionItems}
          insightsHistory={insightsHistory}
          driftDetected={!!driftAlert}
          goalAlignment={goalAlignment}
          onToggleSubGoal={handleToggleSubGoal}
          onAddSubGoal={handleAddSubGoal}
          onRemoveSubGoal={handleRemoveSubGoal}
          onRemovePin={handleUnpin}
          onSelectSession={handleSelectSession}
          onDeleteSession={handleDeleteSession}
          onExportSession={handleExportSession}
          onToggleActionItem={toggleActionItem}
          onDismissActionItem={dismissActionItem}
          onSelectInsight={showInsight}
          onTriggerRecalibrate={handleRefocus}
          onNewSession={() => setShowGoalModal(true)}
          onOpenSettings={() => setShowSettingsModal(true)}
        />
      </div>

      <main className="flex-1 flex flex-col min-w-0">
        {/* NEW: Command Bar - always visible when session active */}
        {currentSession && settings.apiKey && (
          <CommandBar
            settings={settings}
            goal={currentSession.goal}
            tokenEstimate={0} // TODO: wire up token tracking
            clipCount={clips.length}
            insightCount={insightsHistory.length}
            goalAlignment={goalAlignment}
            onUpdateSettings={handleUpdateSettings}
            onUpdateGoal={handleUpdateGoal}
            onOpenCollections={() => setShowCollectionsPanel(true)}
            onCallInsight={generateSessionInsight}
            onOpenProfile={() => setShowProfilePanel(true)}
          />
        )}

        {/* Sidebar toggle - visible when sidebar hidden */}
        {!showSidebar && !focusMode && (
          <button
            onClick={() => setShowSidebar(true)}
            className="absolute top-16 left-2 z-30 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700"
            title="Show sidebar"
          >
            ☰
          </button>
        )}

        {currentSession ? (
          <>
            <EnhancedChatInterface
              messages={messages}
              pinnedItems={currentSession.pinnedItems}
              landmarks={landmarks}
              isLoading={isLoading}
              error={error}
              hasApiKey={!!settings.apiKey}
              focusMode={focusMode}
              currentGoal={currentSession.goal}
              goalAlignment={goalAlignment}
              clipCategories={categories}
              getSummary={getSummary}
              onSend={send}
              onPin={handlePin}
              onUnpin={handleUnpin}
              onClipToCategory={handleAddClip}
              onCreateClipCategory={addCategory}
              onCreateActionItem={handleCreateActionFromText}
              onClearError={clearError}
              onOpenSettings={() => setShowSettingsModal(true)}
            />
            {/* Goal inference - appears after a few messages if no goal set */}
            <GoalInference
              messages={messages}
              currentGoal={currentSession.goal}
              onAcceptGoal={handleUpdateGoal}
              onDismiss={() => {}} // Just hides the component
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            {!settings.apiKey ? (
              // NEW: Inline setup - no modal needed
              <QuickSetup
                settings={settings}
                onSave={(newSettings) => {
                  handleSaveSettings(newSettings);
                  handleQuickStart();
                }}
              />
            ) : (
              <div className="text-center max-w-lg">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                  What can I help you with?
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  Just start chatting. I'll help you stay focused as we go.
                </p>
                <div className="space-y-4">
                  <button
                    onClick={handleQuickStart}
                    className="w-full px-6 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 text-lg font-medium transition-colors"
                  >
                    Start a conversation
                  </button>
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                    <span>or</span>
                    <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                  </div>
                  <button
                    onClick={() => setShowGoalModal(true)}
                    className="w-full px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    Start with a specific goal
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modals */}
      {showGoalModal && (
        <GoalModal
          onSubmit={handleCreateSession}
          onClose={() => setShowGoalModal(false)}
        />
      )}

      {showSettingsModal && (
        <SettingsModal
          settings={settings}
          onSave={handleSaveSettings}
          onClose={() => setShowSettingsModal(false)}
        />
      )}

      {showProfilePanel && (
        <CognitiveProfilePanel
          profile={profile}
          isAnalyzing={isAnalyzingProfile}
          onUpdateStyle={updateThinkingStyle}
          onClose={() => setShowProfilePanel(false)}
        />
      )}

      {showTopology && activeMentalModel && (
        <ThoughtTopology
          model={activeMentalModel}
          onClose={() => setShowTopology(false)}
          onAddConcept={(label, x, y) => {
            addConceptToModel(activeMentalModel.id, {
              label,
              x,
              y,
              importance: 0.5,
            });
          }}
          onAddConnection={(fromId, toId) => {
            addConnectionToModel(activeMentalModel.id, {
              fromId,
              toId,
              type: 'relates',
              strength: 0.5,
            });
          }}
          onUpdateConceptPosition={(conceptId, x, y) => {
            updateMentalModel(activeMentalModel.id, {
              concepts: activeMentalModel.concepts.map(c =>
                c.id === conceptId ? { ...c, x, y } : c
              ),
            });
          }}
        />
      )}

      {showClipCollections && (
        <ClipCollections
          clips={clips}
          categories={categories}
          onRemoveClip={removeClip}
          onRemoveCategory={removeCategory}
          onClose={() => setShowClipCollections(false)}
        />
      )}

      {/* Alerts & Indicators */}
      {driftAlert && (
        <DriftAlert
          message={driftAlert}
          currentGoal={currentSession?.goal}
          onDismiss={() => setDriftAlert(null)}
          onRefocus={handleRefocus}
        />
      )}

      {currentInsight && (
        <InsightIndicator
          insight={currentInsight}
          context={null}
          onDismiss={handleDismissInsight}
          onUseSynthesis={handleUseSynthesis}
        />
      )}

      {/* Behavioral micro-confirmations - learning user patterns */}
      {(() => {
        const observation = getNextObservation();
        return observation ? (
          <MicroConfirmation
            observation={observation}
            onRespond={(response, actionIndex) => {
              respondToObservation(observation.id, response, actionIndex);
              // Track the response
              if (response === 'confirm') {
                trackMetric('insightsAccepted');
              }
            }}
          />
        ) : null;
      })()}

      {/* NEW: Floating Action Tray - quick actions always visible */}
      {currentSession && (
        <FloatingTray
          categories={categories}
          actionItems={actionItems}
          driftDetected={!!driftAlert}
          momentum={momentum}
          onQuickClip={handleQuickClip}
          onRecalibrate={handleRefocus}
          onToggleActionItem={toggleActionItem}
        />
      )}

      {/* NEW: Slide Panel for Collections */}
      <SlidePanel
        isOpen={showCollectionsPanel}
        title="Collections"
        icon="📚"
        onClose={() => setShowCollectionsPanel(false)}
      >
        <CollectionsPanel
          clips={clips}
          categories={categories}
          onRemoveClip={removeClip}
          onAddCategory={addCategory}
        />
      </SlidePanel>
    </div>
  );
}
