import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar, Clock, Moon, Sun, Utensils, Target, Sparkles,
  CheckCircle2, Plus, Trash2, ArrowRight, ArrowLeft, RefreshCw,
  Play, Pause, RotateCcw, Flame, Zap, ShieldAlert, ListChecks,
  Send, Award, BookOpen, Layers, Sliders, ChevronRight,
  Check, AlertCircle, Coffee, Brain, Key, Save, Download, X, Volume2,
  Activity, Dumbbell, Heart, UserCheck, BookMarked, Edit3, Filter,
  BarChart3, Settings, Smile, BatteryCharging, Tag, LayoutGrid, CheckSquare, FileText,
  LogIn, LogOut, Cloud
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import AuthPage from './components/AuthPage';

// ============================================================================
// CONSTANTS & STORAGE KEYS
// ============================================================================
const defaultApiKey = ""; // Canvas runtime automatically injects the key when empty
const STORAGE_KEY = "chronos_ai_state_v3";
const API_KEY_STORAGE = "chronos_gemini_api_key";

const DEFAULT_FIXED_SCHEDULES = [
  { id: 'f1', title: 'Core Work / University Classes', startTime: '09:00', endTime: '17:00', category: 'Work' },
  { id: 'f2', title: 'Daily Commute & Transit', startTime: '08:15', endTime: '09:00', category: 'Commute' },
  { id: 'f3', title: 'Evening Commute', startTime: '17:00', endTime: '17:45', category: 'Commute' }
];

const DEFAULT_BIO_SCHEDULE = {
  sleepStart: '23:00',
  wakeUp: '06:30',
  windDownMinutes: 45,
  chronotype: 'Morning Peak (Lark)',
  meals: [
    { id: 'm1', name: 'Breakfast & Hydration', time: '07:15', duration: 30 },
    { id: 'm2', name: 'Mid-Day Lunch', time: '13:00', duration: 45 },
    { id: 'm3', name: 'Healthy Dinner', time: '19:45', duration: 45 }
  ]
};

const DEFAULT_GOALS_DATA = {
  timeframe: '90 Days (Quarter Mastery)',
  intensity: 'Balanced High-Performance',
  goals: [
    { id: 'g1', title: 'Master Full-Stack AI Engineering', priority: 'High', dailyMinutes: 90, notes: 'Build portfolio projects and practice algorithms' },
    { id: 'g2', title: 'Boxing & Athletic Conditioning', priority: 'High', dailyMinutes: 45, notes: 'Heavy bag drills + strength training' },
    { id: 'g3', title: 'Daily Gym & Mobility', priority: 'High', dailyMinutes: 45, notes: 'Compound lifts + 10k steps' },
    { id: 'g4', title: 'Read 15 Non-Fiction Books', priority: 'Medium', dailyMinutes: 30, notes: 'Before bed wind-down reading' }
  ]
};

const DEFAULT_MORE_ABOUT_ME = {
  workEnvironment: 'Hybrid (Home & Office)',
  energySlumpTime: '14:30 - 16:00 Afternoon Dip',
  focusStyle: 'Pomodoro Sprint (25-45 min bursts)',
  caffeineCutoff: '14:00',
  stressTriggers: 'Back-to-back meetings without transition buffers, late-night screen exposure',
  personalConstraints: 'Need 15-min decompression after evening commute; prefer physical training in late afternoon or early morning',
  motivationDrivers: 'Visual streak grids, clear micro-steps, measurable daily progress',
  customVariables: [
    { id: 'cv1', label: 'Recovery Need', value: 'High after leg/boxing days' },
    { id: 'cv2', label: 'Learning Style', value: 'Hands-on coding before theory' },
    { id: 'cv3', label: 'Weather / Local Factor', value: 'Avoid outdoor cardio during peak afternoon heat' }
  ]
};

// Color palettes for HabitKit-style dot-matrix cards
const CARD_PALETTES = {
  rose: {
    name: 'Coral Rose',
    iconBg: 'bg-rose-500/15 text-rose-400 border-rose-500/25',
    checkDone: 'bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-500/30',
    dotActive: 'bg-rose-400 shadow-[0_0_6px_rgba(251,113,133,0.45)]',
    dotInactive: 'bg-rose-950/35 hover:bg-rose-900/50',
    dotTodayRing: 'ring-1 ring-rose-400/80',
    textAccent: 'text-rose-400'
  },
  emerald: {
    name: 'Emerald Mint',
    iconBg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
    checkDone: 'bg-emerald-500 text-white border-emerald-400 shadow-lg shadow-emerald-500/30',
    dotActive: 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.45)]',
    dotInactive: 'bg-emerald-950/35 hover:bg-emerald-900/50',
    dotTodayRing: 'ring-1 ring-emerald-400/80',
    textAccent: 'text-emerald-400'
  },
  indigo: {
    name: 'Electric Indigo',
    iconBg: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/25',
    checkDone: 'bg-indigo-500 text-white border-indigo-400 shadow-lg shadow-indigo-500/30',
    dotActive: 'bg-indigo-400 shadow-[0_0_6px_rgba(129,140,248,0.45)]',
    dotInactive: 'bg-indigo-950/40 hover:bg-indigo-900/50',
    dotTodayRing: 'ring-1 ring-indigo-400/80',
    textAccent: 'text-indigo-400'
  },
  amber: {
    name: 'Solar Amber',
    iconBg: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
    checkDone: 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/30',
    dotActive: 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.45)]',
    dotInactive: 'bg-amber-950/35 hover:bg-amber-900/50',
    dotTodayRing: 'ring-1 ring-amber-400/80',
    textAccent: 'text-amber-400'
  },
  purple: {
    name: 'Neon Violet',
    iconBg: 'bg-purple-500/15 text-purple-400 border-purple-500/25',
    checkDone: 'bg-purple-500 text-white border-purple-400 shadow-lg shadow-purple-500/30',
    dotActive: 'bg-purple-400 shadow-[0_0_6px_rgba(192,132,252,0.45)]',
    dotInactive: 'bg-purple-950/35 hover:bg-purple-900/50',
    dotTodayRing: 'ring-1 ring-purple-400/80',
    textAccent: 'text-purple-400'
  }
};

// ============================================================================
// DATE, HEATMAP & EXPORT HELPERS
// ============================================================================
function getISODate(dateObj = new Date()) {
  const yyyy = dateObj.getFullYear();
  const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
  const dd = String(dateObj.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function formatDateTimeStamp(isoOrDate = new Date()) {
  const d = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate;
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

// Build a 7-row x N-column (default 20 weeks = 140 days) grid of ISO dates ending on the current week
function buildHeatmapGrid(weeksCount = 20) {
  const today = new Date();
  const todayISO = getISODate(today);
  const dayOfWeek = today.getDay(); // 0 (Sun) .. 6 (Sat)
  const endOfGrid = new Date(today);
  endOfGrid.setDate(today.getDate() + (6 - dayOfWeek));

  const totalDays = weeksCount * 7;
  const startOfGrid = new Date(endOfGrid);
  startOfGrid.setDate(endOfGrid.getDate() - totalDays + 1);

  const columns = [];
  const cursor = new Date(startOfGrid);
  for (let w = 0; w < weeksCount; w++) {
    const col = [];
    for (let d = 0; d < 7; d++) {
      const iso = getISODate(cursor);
      col.push({
        iso,
        label: cursor.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        isToday: iso === todayISO,
        isFuture: cursor > today && iso !== todayISO
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    columns.push(col);
  }
  return columns;
}

// Generate optional historical completions when demo seeding is explicitly enabled
function seedHistoryForId(idStr) {
  let hash = 0;
  for (let i = 0; i < idStr.length; i++) {
    hash = (hash * 31 + idStr.charCodeAt(i)) % 100000;
  }
  const history = {};
  const today = new Date();
  for (let offset = 1; offset <= 45; offset++) {
    const d = new Date(today);
    d.setDate(today.getDate() - offset);
    const iso = getISODate(d);
    const pseudo = ((hash + offset * 17) % 10);
    if (offset <= 28 && pseudo >= 3) {
      history[iso] = true;
    } else if (offset > 28 && offset <= 42 && pseudo >= 6) {
      history[iso] = true;
    }
  }
  return history;
}

function calculateStreakFromHistory(historyMap = {}) {
  const today = new Date();
  let streak = 0;
  const cursor = new Date(today);
  if (!historyMap[getISODate(cursor)]) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (historyMap[getISODate(cursor)]) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function timeToMinutes(hhmm) {
  if (!hhmm || !hhmm.includes(':')) return 0;
  const [h, m] = hhmm.split(':').map(Number);
  return (h * 60) + m;
}

function formatMinutesToDuration(mins) {
  if (mins <= 0) return '0m';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function playFocusChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.25);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.8);
  } catch {
    // Ignore audio errors
  }
}

function escapeICSText(str = '') {
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

function downloadWorksheetAsICS(worksheet) {
  if (!worksheet?.schedule?.length) return;
  const today = new Date();
  const dateStr = getISODate(today).replace(/-/g, '');

  const events = worksheet.schedule.map((block, idx) => {
    const startRaw = (block.startTime || '09:00').replace(':', '');
    const endRaw = (block.endTime || '10:00').replace(':', '');
    const startMins = timeToMinutes(block.startTime || '09:00');
    const endMins = timeToMinutes(block.endTime || '10:00');

    const endDateObj = new Date(today);
    if (endMins <= startMins) {
      endDateObj.setDate(endDateObj.getDate() + 1);
    }
    const endDateStr = getISODate(endDateObj).replace(/-/g, '');

    const steps = (block.actionableMicroSteps || []).map((s, i) => `${i + 1}. ${s}`).join('\n');
    const rawDesc = `${block.aiTip || ''}\n\nMicro-Steps:\n${steps}`;

    return [
      'BEGIN:VEVENT',
      `UID:${block.id || `chronos-${dateStr}-${idx}`}@chronos-ai`,
      `DTSTAMP:${dateStr}T000000Z`,
      `DTSTART:${dateStr}T${startRaw}00`,
      `DTEND:${endDateStr}T${endRaw}00`,
      `SUMMARY:${escapeICSText(`[${block.category}] ${block.title}`)}`,
      `DESCRIPTION:${escapeICSText(rawDesc)}`,
      'END:VEVENT'
    ].join('\r\n');
  });

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Chronos AI//Gemini Calibrator//EN',
    ...events,
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `chronos-worksheet-${dateStr}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

// ============================================================================
// GEMINI API HELPER WITH SMART RETRY, TIMEOUT & ENV/UI KEY SUPPORT
// ============================================================================
async function callGeminiAPI(prompt, systemInstruction, responseSchema = null, customApiKey = "") {
  const envKey =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) || "";
  const effectiveKey = customApiKey?.trim() || envKey || defaultApiKey;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${effectiveKey}`;

  const payload = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    systemInstruction: { parts: [{ text: systemInstruction }] }
  };

  if (responseSchema) {
    payload.generationConfig = {
      responseMimeType: "application/json",
      responseSchema: responseSchema
    };
  }

  const delays = [1000, 2000, 4000];
  for (let attempt = 0; attempt <= delays.length; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        let errDetail = `API status ${response.status}`;
        try {
          const errJson = await response.json();
          errDetail = errJson?.error?.message || errDetail;
        } catch {
          // ignore parse failure
        }
        if (response.status >= 400 && response.status < 500 && response.status !== 429) {
          const nonRetryErr = new Error(errDetail);
          nonRetryErr.noRetry = true;
          throw nonRetryErr;
        }
        throw new Error(errDetail);
      }

      const result = await response.json();
      const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("Empty response from Gemini");

      if (!responseSchema) return text;

      const cleaned = text.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
      return JSON.parse(cleaned);
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.noRetry || attempt === delays.length) {
        throw error;
      }
      await new Promise(res => setTimeout(res, delays[attempt]));
    }
  }
}

// ============================================================================
// JSON SCHEMAS FOR GEMINI OUTPUTS
// ============================================================================
const ROADMAP_SCHEMA = {
  type: "OBJECT",
  properties: {
    researchSummary: { type: "STRING" },
    chronotypeAdvice: { type: "STRING" },
    scientificFramework: { type: "STRING" },
    personalVariableAdaptations: { type: "STRING" },
    phases: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          phaseName: { type: "STRING" },
          duration: { type: "STRING" },
          focus: { type: "STRING" },
          keyHabits: { type: "ARRAY", items: { type: "STRING" } },
          expectedOutcome: { type: "STRING" }
        },
        required: ["phaseName", "duration", "focus", "keyHabits", "expectedOutcome"]
      }
    },
    efficiencyHacks: {
      type: "ARRAY",
      items: { type: "STRING" }
    }
  },
  required: ["researchSummary", "chronotypeAdvice", "scientificFramework", "personalVariableAdaptations", "phases", "efficiencyHacks"]
};

const WORKSHEET_SCHEMA = {
  type: "OBJECT",
  properties: {
    dailyMantra: { type: "STRING" },
    estimatedEfficiencyScore: { type: "INTEGER" },
    schedule: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          id: { type: "STRING" },
          startTime: { type: "STRING" },
          endTime: { type: "STRING" },
          title: { type: "STRING" },
          category: { type: "STRING", enum: ["Fixed", "Bio/Meal", "Deep Work", "Habit", "Recovery"] },
          priority: { type: "STRING", enum: ["Critical", "High", "Medium", "Low"] },
          energyRequired: { type: "STRING", enum: ["High", "Medium", "Low"] },
          actionableMicroSteps: { type: "ARRAY", items: { type: "STRING" } },
          aiTip: { type: "STRING" }
        },
        required: ["id", "startTime", "endTime", "title", "category", "priority", "energyRequired", "actionableMicroSteps", "aiTip"]
      }
    },
    coreHabits: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          id: { type: "STRING" },
          name: { type: "STRING" },
          triggerCue: { type: "STRING" },
          durationMinutes: { type: "INTEGER" },
          category: { type: "STRING" }
        },
        required: ["id", "name", "triggerCue", "durationMinutes", "category"]
      }
    }
  },
  required: ["dailyMantra", "estimatedEfficiencyScore", "schedule", "coreHabits"]
};

const JOURNAL_INSIGHT_SCHEMA = {
  type: "OBJECT",
  properties: {
    patternDetected: { type: "STRING" },
    praiseAndMomentum: { type: "STRING" },
    scheduleAdjustmentTip: { type: "STRING" },
    nextJournalPrompt: { type: "STRING" }
  },
  required: ["patternDetected", "praiseAndMomentum", "scheduleAdjustmentTip", "nextJournalPrompt"]
};

// ============================================================================
// MAIN APPLICATION COMPONENT
// ============================================================================
export default function App() {
  const todayISO = useMemo(() => getISODate(new Date()), []);
  const heatmapColumns = useMemo(() => buildHeatmapGrid(22), []);

  // Load persisted local state if available
  const savedState = useMemo(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  // Supabase Auth & Cloud Sync State
  const [session, setSession] = useState(null);
  const [authChecked, setAuthChecked] = useState(!isSupabaseConfigured);
  const [guestMode, setGuestMode] = useState(false);
  const [isCloudHydrated, setIsCloudHydrated] = useState(false);
  const [cloudSyncStatus, setCloudSyncStatus] = useState('idle'); // 'idle' | 'syncing' | 'synced' | 'error'

  // Navigation & Wizard State (Steps 1 to 5)
  const [currentStep, setCurrentStep] = useState(savedState?.currentStep || 1);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [errorBanner, setErrorBanner] = useState(null);

  // Custom API Key & Settings Modal
  const [userApiKey, setUserApiKey] = useState(() => {
    try {
      return localStorage.getItem(API_KEY_STORAGE) || '';
    } catch {
      return '';
    }
  });
  const [showKeyModal, setShowKeyModal] = useState(false);

  // Step 1: Fixed Schedules
  const [fixedSchedules, setFixedSchedules] = useState(
    savedState?.fixedSchedules || DEFAULT_FIXED_SCHEDULES
  );
  const [newFixed, setNewFixed] = useState({ title: '', startTime: '10:00', endTime: '11:00', category: 'Work' });

  // Step 2: Bio-Rhythm
  const [bioSchedule, setBioSchedule] = useState(
    savedState?.bioSchedule || DEFAULT_BIO_SCHEDULE
  );
  const [newMeal, setNewMeal] = useState({ name: '', time: '16:00', duration: 20 });

  // Step 3: Goals + "More About Me" Personal Variables
  const [goalsData, setGoalsData] = useState(
    savedState?.goalsData || DEFAULT_GOALS_DATA
  );
  const [newGoal, setNewGoal] = useState({ title: '', priority: 'High', dailyMinutes: 60, notes: '' });

  const [moreAboutMe, setMoreAboutMe] = useState(
    savedState?.moreAboutMe || DEFAULT_MORE_ABOUT_ME
  );
  const [newCustomVar, setNewCustomVar] = useState({ label: '', value: '' });
  const [showMoreAboutMeModal, setShowMoreAboutMeModal] = useState(false);

  // Step 4: AI Roadmap
  const [roadmap, setRoadmap] = useState(savedState?.roadmap || null);
  const [refinementInput, setRefinementInput] = useState("");
  const [refinementHistory, setRefinementHistory] = useState(savedState?.refinementHistory || []);

  // Step 5: Worksheet, HabitKit Heatmap History & Journals
  const [worksheet, setWorksheet] = useState(savedState?.worksheet || null);
  const [completionHistory, setCompletionHistory] = useState(savedState?.completionHistory || {});
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');
  const [activeView, setActiveView] = useState('heatmap'); // 'heatmap' | 'timeline' | 'journals'
  const [expandedCards, setExpandedCards] = useState({});
  const [recalibratePrompt, setRecalibratePrompt] = useState("");
  const [showRecalibrateModal, setShowRecalibrateModal] = useState(false);
  const [showAddCustomTaskModal, setShowAddCustomTaskModal] = useState(false);
  const [newCustomTask, setNewCustomTask] = useState({
    title: '',
    category: 'Habit',
    startTime: '18:00',
    endTime: '18:45',
    cue: 'After work decompression',
    palette: 'rose'
  });

  // --- EVERYDAY JOURNALS & TASK MICRO-NOTES STATE ---
  const [journals, setJournals] = useState(() => {
    if (savedState?.journals) return savedState.journals;
    const now = new Date();
    return [
      {
        id: 'j_seed_1',
        title: 'Morning Calibration & Energy Check',
        promptType: 'Morning Intention',
        content: 'Slept 7.5 hours. Feeling sharp for the morning deep-work sprint and evening boxing session. Keeping caffeine before 2 PM.',
        mood: 'Energized',
        energyLevel: 4,
        tags: ['Focus', 'Boxing', 'Routine'],
        writtenAtISO: now.toISOString(),
        journalDateLabel: formatDateTimeStamp(now),
        lastEditedLabel: null,
        linkedTaskTitle: 'General Daily Log'
      }
    ];
  });

  const [journalForm, setJournalForm] = useState({
    title: '',
    promptType: 'Daily Reflection',
    content: '',
    mood: 'Focused',
    energyLevel: 4,
    tagsInput: 'DeepWork, Progress',
    linkedTaskTitle: 'General Daily Log'
  });
  const [editingJournalId, setEditingJournalId] = useState(null);
  const [editingDraft, setEditingDraft] = useState(null);
  const [aiJournalInsight, setAiJournalInsight] = useState(savedState?.aiJournalInsight || null);

  // Per-block inline quick journal notes
  const [blockNotes, setBlockNotes] = useState(savedState?.blockNotes || {});
  const [activeBlockNoteInput, setActiveBlockNoteInput] = useState({});

  // Pomodoro / Focus Timer State
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [activeTaskTitle, setActiveTaskTitle] = useState("Select any card to start a focus sprint");
  const [timerMode, setTimerMode] = useState('focus');
  const [focusSessionsCompleted, setFocusSessionsCompleted] = useState(savedState?.focusSessionsCompleted || 0);

  // 1. Listen for Supabase auth state
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
      setAuthChecked(true);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  // 2. Load saved user state from Supabase after sign-in
  useEffect(() => {
    if (!session?.user || !supabase) {
      setIsCloudHydrated(false);
      setCloudSyncStatus('idle');
      return;
    }

    let cancelled = false;
    setIsCloudHydrated(false);
    setCloudSyncStatus('syncing');

    supabase
      .from('chronos_user_states')
      .select('state')
      .eq('user_id', session.user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setCloudSyncStatus('error');
          setIsCloudHydrated(true);
          return;
        }
        const s = data?.state;
        if (s) {
          if (s.currentStep) setCurrentStep(s.currentStep);
          if (s.fixedSchedules) setFixedSchedules(s.fixedSchedules);
          if (s.bioSchedule) setBioSchedule(s.bioSchedule);
          if (s.goalsData) setGoalsData(s.goalsData);
          if (s.moreAboutMe) setMoreAboutMe(s.moreAboutMe);
          if (s.roadmap !== undefined) setRoadmap(s.roadmap);
          if (s.refinementHistory) setRefinementHistory(s.refinementHistory);
          if (s.worksheet !== undefined) setWorksheet(s.worksheet);
          if (s.completionHistory) setCompletionHistory(s.completionHistory);
          if (s.journals) setJournals(s.journals);
          if (s.blockNotes) setBlockNotes(s.blockNotes);
          if (s.aiJournalInsight !== undefined) setAiJournalInsight(s.aiJournalInsight);
          if (s.focusSessionsCompleted !== undefined) setFocusSessionsCompleted(s.focusSessionsCompleted);
        }
        setCloudSyncStatus('synced');
        setIsCloudHydrated(true);
      });

    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);

  // Safe Step Recovery Guard: prevent blank screen if state has Step 4/5 without data
  useEffect(() => {
    if (currentStep === 5 && !worksheet) {
      setCurrentStep(roadmap ? 4 : 3);
    } else if (currentStep === 4 && !roadmap) {
      setCurrentStep(3);
    }
  }, [currentStep, roadmap, worksheet]);

  // Persist local state automatically
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        currentStep,
        fixedSchedules,
        bioSchedule,
        goalsData,
        moreAboutMe,
        roadmap,
        refinementHistory,
        worksheet,
        completionHistory,
        journals,
        blockNotes,
        aiJournalInsight,
        focusSessionsCompleted
      }));
    } catch {
      // Ignore storage quota errors
    }
  }, [
    currentStep, fixedSchedules, bioSchedule, goalsData, moreAboutMe,
    roadmap, refinementHistory, worksheet, completionHistory,
    journals, blockNotes, aiJournalInsight, focusSessionsCompleted
  ]);

  // 3. Debounced cloud auto-save to Supabase whenever state changes
  useEffect(() => {
    if (!session?.user || !supabase || !isCloudHydrated) return;
    setCloudSyncStatus('syncing');
    const timer = setTimeout(async () => {
      const { error } = await supabase.from('chronos_user_states').upsert({
        user_id: session.user.id,
        state: {
          currentStep,
          fixedSchedules,
          bioSchedule,
          goalsData,
          moreAboutMe,
          roadmap,
          refinementHistory,
          worksheet,
          completionHistory,
          journals,
          blockNotes,
          aiJournalInsight,
          focusSessionsCompleted
        },
        updated_at: new Date().toISOString()
      });
      setCloudSyncStatus(error ? 'error' : 'synced');
    }, 1200);
    return () => clearTimeout(timer);
  }, [
    session?.user?.id, isCloudHydrated,
    currentStep, fixedSchedules, bioSchedule, goalsData, moreAboutMe,
    roadmap, refinementHistory, worksheet, completionHistory,
    journals, blockNotes, aiJournalInsight, focusSessionsCompleted
  ]);

  // Pure Pomodoro Timer Countdown (separated from side effects for React 19 StrictMode safety)
  useEffect(() => {
    if (!isTimerRunning) return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Pomodoro Completion Side Effects (runs once when countdown reaches 0)
  useEffect(() => {
    if (timerSeconds !== 0 || !isTimerRunning) return;
    setIsTimerRunning(false);
    playFocusChime();
    if (timerMode !== 'break') {
      setFocusSessionsCompleted((c) => c + 1);
    }
  }, [timerSeconds, isTimerRunning, timerMode]);

  const handleSignOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setGuestMode(false);
    setCloudSyncStatus('idle');
  };

  const formatTimer = (totalSec) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const changeTimerMode = (mode) => {
    setIsTimerRunning(false);
    setTimerMode(mode);
    if (mode === 'focus') setTimerSeconds(25 * 60);
    if (mode === 'deep') setTimerSeconds(50 * 60);
    if (mode === 'break') setTimerSeconds(5 * 60);
  };

  const startFocusForTask = (taskLabel) => {
    const nextMode = timerMode === 'deep' ? 'deep' : 'focus';
    setTimerMode(nextMode);
    setActiveTaskTitle(taskLabel);
    setTimerSeconds(nextMode === 'deep' ? 50 * 60 : 25 * 60);
    setIsTimerRunning(true);
  };

  const handleSaveApiKey = (e) => {
    e.preventDefault();
    try {
      localStorage.setItem(API_KEY_STORAGE, userApiKey.trim());
    } catch {
      // Ignore storage errors
    }
    setShowKeyModal(false);
    setErrorBanner(null);
  };

  // ============================================================================
  // SCHEDULE OVERLAP & FREE-TIME CALCULATOR (WITH INTERVAL MERGING & OVERNIGHT SUPPORT)
  // ============================================================================
  const scheduleStats = useMemo(() => {
    const wakeMins = timeToMinutes(bioSchedule.wakeUp);
    let sleepMins = timeToMinutes(bioSchedule.sleepStart);
    if (sleepMins <= wakeMins) sleepMins += 24 * 60;

    const awakeTotal = Math.max(0, sleepMins - wakeMins);

    const intervals = fixedSchedules
      .map((item) => {
        const s = timeToMinutes(item.startTime);
        let e = timeToMinutes(item.endTime);
        if (e <= s) e += 24 * 60;
        return { ...item, s, e };
      })
      .sort((a, b) => a.s - b.s);

    const overlaps = [];
    const merged = [];
    for (const cur of intervals) {
      if (!merged.length) {
        merged.push({ ...cur });
      } else {
        const last = merged[merged.length - 1];
        if (cur.s < last.e) {
          overlaps.push(`"${last.title}" overlaps with "${cur.title}"`);
          if (cur.e > last.e) {
            last.e = cur.e;
            last.title = `${last.title} / ${cur.title}`;
          }
        } else {
          merged.push({ ...cur });
        }
      }
    }

    const fixedTotal = merged.reduce((acc, iv) => acc + Math.max(0, iv.e - iv.s), 0);
    const mealsTotal = bioSchedule.meals.reduce((acc, m) => acc + (Number(m.duration) || 0), 0);
    const windDownTotal = Number(bioSchedule.windDownMinutes) || 0;
    const goalsRequested = goalsData.goals.reduce((acc, g) => acc + (Number(g.dailyMinutes) || 0), 0);
    const freePocket = Math.max(0, awakeTotal - fixedTotal - mealsTotal - windDownTotal);

    return { awakeTotal, fixedTotal, mealsTotal, freePocket, goalsRequested, overlaps };
  }, [fixedSchedules, bioSchedule, goalsData]);

  // ============================================================================
  // HANDLERS FOR STEP 1, 2, 3 & "MORE ABOUT ME"
  // ============================================================================
  const handleAddFixed = (e) => {
    e.preventDefault();
    if (!newFixed.title.trim()) return;
    if (newFixed.endTime === newFixed.startTime) {
      setErrorBanner("Start time and end time cannot be identical for a fixed commitment.");
      return;
    }
    setErrorBanner(null);
    setFixedSchedules([...fixedSchedules, { ...newFixed, id: `f_${Date.now()}` }]);
    setNewFixed({ title: '', startTime: '10:00', endTime: '11:00', category: 'Work' });
  };

  const handleRemoveFixed = (id) => {
    setFixedSchedules(fixedSchedules.filter(item => item.id !== id));
  };

  const handleUpdateMeal = (id, field, value) => {
    setBioSchedule({
      ...bioSchedule,
      meals: bioSchedule.meals.map(m => m.id === id ? { ...m, [field]: value } : m)
    });
  };

  const handleAddMeal = (e) => {
    e.preventDefault();
    if (!newMeal.name.trim()) return;
    setBioSchedule({
      ...bioSchedule,
      meals: [...bioSchedule.meals, { ...newMeal, id: `m_${Date.now()}` }]
    });
    setNewMeal({ name: '', time: '16:00', duration: 20 });
  };

  const handleRemoveMeal = (id) => {
    setBioSchedule({
      ...bioSchedule,
      meals: bioSchedule.meals.filter(m => m.id !== id)
    });
  };

  const handleAddGoal = (e) => {
    e.preventDefault();
    if (!newGoal.title.trim()) return;
    setGoalsData({
      ...goalsData,
      goals: [...goalsData.goals, { ...newGoal, id: `g_${Date.now()}` }]
    });
    setNewGoal({ title: '', priority: 'High', dailyMinutes: 60, notes: '' });
  };

  const handleRemoveGoal = (id) => {
    setGoalsData({
      ...goalsData,
      goals: goalsData.goals.filter(g => g.id !== id)
    });
  };

  const handleAddCustomVariable = (e) => {
    e.preventDefault();
    if (!newCustomVar.label.trim() || !newCustomVar.value.trim()) return;
    setMoreAboutMe({
      ...moreAboutMe,
      customVariables: [
        ...(moreAboutMe.customVariables || []),
        { id: `cv_${Date.now()}`, label: newCustomVar.label.trim(), value: newCustomVar.value.trim() }
      ]
    });
    setNewCustomVar({ label: '', value: '' });
  };

  const handleRemoveCustomVariable = (id) => {
    setMoreAboutMe({
      ...moreAboutMe,
      customVariables: (moreAboutMe.customVariables || []).filter(v => v.id !== id)
    });
  };

  // ============================================================================
  // STEP 4: AI ROADMAP GENERATION & REFINEMENT (WITH "MORE ABOUT ME")
  // ============================================================================
  const generateInitialRoadmap = async () => {
    if (goalsData.goals.length === 0) {
      setErrorBanner("Please add at least one goal in Step 3 before generating your roadmap.");
      return;
    }
    setIsLoading(true);
    setErrorBanner(null);
    setLoadingMessage("Gemini is analyzing your fixed constraints, bio-rhythms, goals, and 'More About Me' personal variables...");

    const systemInstruction = `You are an elite Behavioral Scientist, Chronobiologist, and AI Productivity Architect.
Analyze the user's unalterable schedule, sleep/meal timings, future goals, and their "More About Me" personal variables.
Synthesize a research-backed Strategic Roadmap using behavioral psychology (Atomic Habits, Deep Work, circadian protocols) explicitly tailored to their personal nuances, energy slumps, and custom variables.`;

    const userPrompt = `
      USER DATA FOR CALIBRATION:
      1. Unalterable Fixed Commitments: ${JSON.stringify(fixedSchedules)}
      2. Sleep & Bio-Rhythm: Sleep ${bioSchedule.sleepStart} to ${bioSchedule.wakeUp}, Wind-down ${bioSchedule.windDownMinutes} mins, Chronotype: ${bioSchedule.chronotype}.
      3. Meals: ${JSON.stringify(bioSchedule.meals)}
      4. Available Free Pocket: ~${scheduleStats.freePocket} mins/day vs ${scheduleStats.goalsRequested} mins requested.
      5. Target Timeframe: ${goalsData.timeframe} (Intensity: ${goalsData.intensity})
      6. Goals & Tasks to Achieve: ${JSON.stringify(goalsData.goals)}
      7. "MORE ABOUT ME" PERSONAL VARIABLES & CONSTRAINTS: ${JSON.stringify(moreAboutMe)}

      Create a comprehensive, phased roadmap that fits seamlessly into their free time pockets and respects every "More About Me" variable.
    `;

    try {
      const data = await callGeminiAPI(userPrompt, systemInstruction, ROADMAP_SCHEMA, userApiKey);
      setRoadmap(data);
      setCurrentStep(4);
    } catch (err) {
      setErrorBanner(`Failed to generate AI Roadmap (${err.message}). If running outside Canvas, click the Key icon in the top bar to set your Gemini API key.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefineRoadmap = async (e) => {
    e.preventDefault();
    if (!refinementInput.trim()) return;

    const userFeedback = refinementInput;
    setRefinementInput("");
    setIsLoading(true);
    setErrorBanner(null);
    setLoadingMessage("Gemini is recalibrating your strategic roadmap based on your feedback and personal variables...");

    const systemInstruction = `You are an elite AI Productivity Architect. Update the existing JSON roadmap strictly following the user's modification request while respecting their fixed constraints, sleep schedule, and "More About Me" variables.`;

    const userPrompt = `
      Current Roadmap JSON: ${JSON.stringify(roadmap)}
      User's Fixed Schedule: ${JSON.stringify(fixedSchedules)}
      User's Sleep/Meals: ${JSON.stringify(bioSchedule)}
      "More About Me" Variables: ${JSON.stringify(moreAboutMe)}
      User's Modification Request: "${userFeedback}"

      Return the updated Roadmap JSON incorporating this feedback.
    `;

    try {
      const updated = await callGeminiAPI(userPrompt, systemInstruction, ROADMAP_SCHEMA, userApiKey);
      setRoadmap(updated);
      setRefinementHistory([...refinementHistory, { user: userFeedback, timestamp: new Date().toLocaleTimeString() }]);
    } catch (err) {
      setErrorBanner(`Could not apply refinement (${err.message}). Please verify your connection or API Key.`);
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================================
  // STEP 5: GENERATE DAILY WORKSHEET & INITIALIZE HEATMAP HISTORY
  // ============================================================================
  const initializeHistoryForWorksheet = (wsData, useDemoSeed = false) => {
    setCompletionHistory(prev => {
      const next = { ...prev };
      (wsData.coreHabits || []).forEach(h => {
        if (!next[h.id]) next[h.id] = useDemoSeed ? seedHistoryForId(h.id + h.name) : {};
      });
      (wsData.schedule || []).forEach(b => {
        if (!next[b.id]) next[b.id] = useDemoSeed ? seedHistoryForId(b.id + b.title) : {};
      });
      return next;
    });
  };

  const generateDailyWorksheet = async () => {
    setIsLoading(true);
    setErrorBanner(null);
    setLoadingMessage("Building your HabitKit-style Daily Tracker & Chronological Worksheet...");

    const systemInstruction = `You are a master time-blocking engine. Build a complete, chronological, hour-by-hour Daily Worksheet from Wake-up (${bioSchedule.wakeUp}) to Sleep (${bioSchedule.sleepStart}).
    CRITICAL RULES:
    1. NEVER overwrite or move the user's Unalterable Fixed Commitments: ${JSON.stringify(fixedSchedules)}. Include them at their exact times with category 'Fixed'.
    2. Include all Meals at their scheduled times with category 'Bio/Meal'.
    3. Fill the remaining available pockets of time with 'Deep Work', 'Habit', and 'Recovery' blocks derived from the approved Roadmap and Goals.
    4. Explicitly honor all "More About Me" variables (${JSON.stringify(moreAboutMe)}), including energy slump windows, caffeine cutoff, decompression buffers, and custom variables.
    5. Sort all schedule items chronologically from wake-up to bedtime using 24-hour HH:MM format.
    6. Provide 2-3 specific actionableMicroSteps for each block so the user knows *exactly* what to do immediately.`;

    const userPrompt = `
      Approved Roadmap: ${JSON.stringify(roadmap)}
      Unalterable Fixed Schedule: ${JSON.stringify(fixedSchedules)}
      Bio & Meals: ${JSON.stringify(bioSchedule)}
      Goals: ${JSON.stringify(goalsData.goals)}
      More About Me Variables: ${JSON.stringify(moreAboutMe)}

      Generate the calibrated Daily Worksheet JSON now.
    `;

    try {
      const data = await callGeminiAPI(userPrompt, systemInstruction, WORKSHEET_SCHEMA, userApiKey);
      setWorksheet(data);
      initializeHistoryForWorksheet(data, false);
      setCurrentStep(5);
    } catch (err) {
      setErrorBanner(`Failed to generate the Daily Worksheet (${err.message}). Please check your API key or try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmergencyRecalibrate = async (e) => {
    e.preventDefault();
    if (!recalibratePrompt.trim()) return;

    setIsLoading(true);
    setShowRecalibrateModal(false);
    setErrorBanner(null);
    setLoadingMessage("Recalibrating your remaining day around your disruption & personal variables...");

    const completedTodayIds = Object.keys(completionHistory).filter(
      id => completionHistory[id]?.[todayISO]
    );

    const systemInstruction = `You are an agile AI daily scheduler. The user's day experienced an unexpected disruption or change. Adjust their Daily Worksheet JSON intelligently while keeping completed blocks and unalterable fixed commitments intact, respecting "More About Me" variables, and prioritizing high-impact habits in smaller time pockets.`;

    const userPrompt = `
      Current Worksheet: ${JSON.stringify(worksheet)}
      Completed Item IDs Today: ${JSON.stringify(completedTodayIds)}
      "More About Me" Variables: ${JSON.stringify(moreAboutMe)}
      Recent Journal Context: ${JSON.stringify(journals.slice(0, 3))}
      User's Disruption / Situation: "${recalibratePrompt}"

      Return the recalibrated Daily Worksheet JSON.
    `;

    try {
      const updated = await callGeminiAPI(userPrompt, systemInstruction, WORKSHEET_SCHEMA, userApiKey);
      setWorksheet(updated);
      initializeHistoryForWorksheet(updated, false);
      setRecalibratePrompt("");
    } catch (err) {
      setErrorBanner(`Failed to recalibrate schedule (${err.message}). Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================================
  // HEATMAP TICKING & CUSTOM TASK CREATION HANDLERS
  // ============================================================================
  const toggleDateCompletion = (itemId, dateISO = todayISO) => {
    setCompletionHistory(prev => {
      const itemMap = prev[itemId] || {};
      return {
        ...prev,
        [itemId]: {
          ...itemMap,
          [dateISO]: !itemMap[dateISO]
        }
      };
    });
  };

  const handleAddCustomTask = (e) => {
    e.preventDefault();
    if (!newCustomTask.title.trim() || !worksheet) return;
    const id = `custom_${Date.now()}`;
    const startMins = timeToMinutes(newCustomTask.startTime);
    let endMins = timeToMinutes(newCustomTask.endTime);
    if (endMins <= startMins) endMins += 24 * 60;

    const newBlock = {
      id,
      startTime: newCustomTask.startTime,
      endTime: newCustomTask.endTime,
      title: newCustomTask.title.trim(),
      category: newCustomTask.category,
      priority: 'High',
      energyRequired: 'Medium',
      actionableMicroSteps: [
        `Cue: ${newCustomTask.cue || 'Scheduled daily slot'}`,
        'Execute core session with zero phone distractions',
        'Tick today on the progress grid immediately after finishing'
      ],
      aiTip: 'Custom user-added habit block synced to your daily progress matrix.',
      customPalette: newCustomTask.palette
    };

    const nextSchedule = [...(worksheet.schedule || []), newBlock].sort(
      (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
    );
    const nextHabits = [
      ...(worksheet.coreHabits || []),
      {
        id: `${id}_habit`,
        name: newCustomTask.title.trim(),
        triggerCue: newCustomTask.cue || newCustomTask.startTime,
        durationMinutes: Math.max(15, endMins - startMins),
        category: newCustomTask.category,
        customPalette: newCustomTask.palette
      }
    ];

    setWorksheet({
      ...worksheet,
      schedule: nextSchedule,
      coreHabits: nextHabits
    });
    setCompletionHistory(prev => ({
      ...prev,
      [id]: prev[id] || {},
      [`${id}_habit`]: prev[`${id}_habit`] || {}
    }));
    setNewCustomTask({
      title: '',
      category: 'Habit',
      startTime: '18:00',
      endTime: '18:45',
      cue: 'After work decompression',
      palette: 'rose'
    });
    setShowAddCustomTaskModal(false);
  };

  // ============================================================================
  // EVERYDAY JOURNAL & MICRO-NOTE HANDLERS (WITH TIMESTAMP + EDITING)
  // ============================================================================
  const handleAddJournalEntry = (e) => {
    e.preventDefault();
    if (!journalForm.content.trim()) return;
    const now = new Date();
    const tags = journalForm.tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    const newEntry = {
      id: `journal_${Date.now()}`,
      title: journalForm.title.trim() || `${journalForm.promptType} - ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
      promptType: journalForm.promptType,
      content: journalForm.content.trim(),
      mood: journalForm.mood,
      energyLevel: Number(journalForm.energyLevel) || 4,
      tags,
      linkedTaskTitle: journalForm.linkedTaskTitle || 'General Daily Log',
      writtenAtISO: now.toISOString(),
      journalDateLabel: formatDateTimeStamp(now),
      lastEditedLabel: null
    };

    setJournals([newEntry, ...journals]);
    setJournalForm({
      ...journalForm,
      title: '',
      content: ''
    });
  };

  const startEditingJournal = (entry) => {
    setEditingJournalId(entry.id);
    setEditingDraft({
      title: entry.title,
      promptType: entry.promptType,
      content: entry.content,
      mood: entry.mood,
      energyLevel: entry.energyLevel,
      tagsInput: (entry.tags || []).join(', '),
      linkedTaskTitle: entry.linkedTaskTitle || 'General Daily Log'
    });
  };

  const handleSaveEditedJournal = (id) => {
    if (!editingDraft?.content?.trim()) return;
    const now = new Date();
    const tags = (editingDraft.tagsInput || '')
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    setJournals(journals.map(j => {
      if (j.id !== id) return j;
      return {
        ...j,
        title: editingDraft.title.trim() || j.title,
        promptType: editingDraft.promptType,
        content: editingDraft.content.trim(),
        mood: editingDraft.mood,
        energyLevel: Number(editingDraft.energyLevel) || j.energyLevel,
        tags,
        linkedTaskTitle: editingDraft.linkedTaskTitle,
        lastEditedLabel: formatDateTimeStamp(now)
      };
    }));
    setEditingJournalId(null);
    setEditingDraft(null);
  };

  const handleDeleteJournal = (id) => {
    setJournals(journals.filter(j => j.id !== id));
  };

  const handleAddBlockMicroNote = (blockId, blockTitle) => {
    const text = (activeBlockNoteInput[blockId] || '').trim();
    if (!text) return;
    const now = new Date();
    const stamp = formatDateTimeStamp(now);
    const noteObj = {
      id: `bn_${Date.now()}`,
      text,
      journalDateLabel: stamp,
      lastEditedLabel: null
    };
    setBlockNotes(prev => ({
      ...prev,
      [blockId]: [noteObj, ...(prev[blockId] || [])]
    }));
    setJournals(prev => [
      {
        id: `journal_block_${Date.now()}`,
        title: `Task Note: ${blockTitle}`,
        promptType: 'Task Micro-Journal',
        content: text,
        mood: 'Focused',
        energyLevel: 4,
        tags: ['TaskNote', blockTitle.split(' ')[0]],
        linkedTaskTitle: blockTitle,
        writtenAtISO: now.toISOString(),
        journalDateLabel: stamp,
        lastEditedLabel: null
      },
      ...prev
    ]);
    setActiveBlockNoteInput(prev => ({ ...prev, [blockId]: '' }));
  };

  const handleAnalyzeJournalsWithAI = async () => {
    if (journals.length === 0) return;
    setIsLoading(true);
    setErrorBanner(null);
    setLoadingMessage("Gemini is analyzing your timestamped journals, mood trends, and habit streaks...");

    const systemInstruction = `You are an empathetic Behavioral Coach and Chronobiology Analyst. Analyze the user's timestamped daily journal entries, "More About Me" personal variables, and habit completion progress to surface actionable insights.`;
    const userPrompt = `
      "More About Me" Variables: ${JSON.stringify(moreAboutMe)}
      Recent Timestamped Journal Entries: ${JSON.stringify(journals.slice(0, 8))}
      Current Daily Worksheet Mantra: ${worksheet?.dailyMantra || 'N/A'}

      Provide a concise, high-impact behavioral analysis JSON.
    `;

    try {
      const insight = await callGeminiAPI(userPrompt, systemInstruction, JOURNAL_INSIGHT_SCHEMA, userApiKey);
      setAiJournalInsight(insight);
    } catch (err) {
      setErrorBanner(`Could not analyze journals (${err.message}).`);
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================================
  // CARD VISUAL HELPERS (HABITKIT STYLE)
  // ============================================================================
  const getPaletteForItem = (item, idx = 0) => {
    if (item.customPalette && CARD_PALETTES[item.customPalette]) {
      return CARD_PALETTES[item.customPalette];
    }
    const text = `${item.title || item.name || ''} ${item.category || ''}`.toLowerCase();
    if (text.includes('box') || text.includes('gym') || text.includes('fit') || text.includes('athletic') || text.includes('workout')) {
      return CARD_PALETTES.rose;
    }
    if (text.includes('meal') || text.includes('bio') || text.includes('breakfast') || text.includes('lunch') || text.includes('dinner') || text.includes('hydrat')) {
      return CARD_PALETTES.emerald;
    }
    if (text.includes('deep') || text.includes('ai') || text.includes('code') || text.includes('work') || text.includes('study')) {
      return CARD_PALETTES.indigo;
    }
    if (text.includes('read') || text.includes('book') || text.includes('recover') || text.includes('wind') || text.includes('sleep')) {
      return CARD_PALETTES.purple;
    }
    const keys = Object.keys(CARD_PALETTES);
    return CARD_PALETTES[keys[idx % keys.length]];
  };

  const getIconForItem = (item) => {
    const text = `${item.title || item.name || ''} ${item.category || ''}`.toLowerCase();
    if (text.includes('box') || text.includes('cardio') || text.includes('athletic')) return Activity;
    if (text.includes('gym') || text.includes('strength') || text.includes('lift') || text.includes('fit')) return Dumbbell;
    if (text.includes('meal') || text.includes('lunch') || text.includes('dinner') || text.includes('breakfast')) return Utensils;
    if (text.includes('read') || text.includes('book')) return BookOpen;
    if (text.includes('deep') || text.includes('code') || text.includes('ai')) return Brain;
    if (text.includes('sleep') || text.includes('wind') || text.includes('recover')) return Moon;
    return Flame;
  };

  // Metrics for Step 5
  const totalScheduleBlocks = worksheet?.schedule?.length || 0;
  const doneScheduleToday = (worksheet?.schedule || []).filter(
    b => completionHistory[b.id]?.[todayISO]
  ).length;
  const scheduleProgressPct = totalScheduleBlocks > 0
    ? Math.round((doneScheduleToday / totalScheduleBlocks) * 100)
    : 0;

  const totalCoreHabits = worksheet?.coreHabits?.length || 0;
  const doneHabitsToday = (worksheet?.coreHabits || []).filter(
    h => completionHistory[h.id]?.[todayISO]
  ).length;

  const filteredSchedule = useMemo(() => {
    if (!worksheet?.schedule) return [];
    if (selectedCategoryFilter === 'All') return worksheet.schedule;
    if (selectedCategoryFilter === 'Gym & Health') {
      return worksheet.schedule.filter(b => {
        const t = `${b.title} ${b.category}`.toLowerCase();
        return t.includes('gym') || t.includes('box') || t.includes('fit') || t.includes('habit') || t.includes('recover') || t.includes('workout');
      });
    }
    return worksheet.schedule.filter(b => b.category === selectedCategoryFilter);
  }, [worksheet, selectedCategoryFilter]);

  const steps = [
    { num: 1, label: 'Fixed Locks', icon: Calendar },
    { num: 2, label: 'Bio-Rhythm', icon: Moon },
    { num: 3, label: 'Goals & About Me', icon: UserCheck },
    { num: 4, label: 'AI Roadmap', icon: Brain },
    { num: 5, label: 'Daily Tracker', icon: LayoutGrid }
  ];

  // Auth Gate (placed after all hooks to satisfy React Rules of Hooks)
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[#09090d] text-slate-300 flex items-center justify-center text-sm">
        Checking session...
      </div>
    );
  }

  if (isSupabaseConfigured && !session && !guestMode) {
    return <AuthPage onGuestContinue={() => setGuestMode(true)} />;
  }

  return (
    <div className="min-h-screen bg-[#09090d] text-slate-100 pb-28 font-sans selection:bg-indigo-500 selection:text-white">
      {/* =====================================================================
          TOP NAVIGATION BAR & STEPPER
      ===================================================================== */}
      <header className="sticky top-0 z-40 bg-[#09090d]/90 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowMoreAboutMeModal(true)}
              className="w-10 h-10 rounded-full bg-[#16161f] hover:bg-[#1f1f2b] border border-slate-800 flex items-center justify-center text-slate-300 hover:text-white transition"
              title="More About Me & Personal Variables"
            >
              <Settings className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                Chronos AI
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#16161f] text-slate-200 border border-slate-700">
                  PRO
                </span>
              </h1>
              <p className="text-xs text-slate-400">HabitKit Heatmap Tracker • AI Schedule & Daily Journal</p>
            </div>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2">
            {isSupabaseConfigured && session && (
              <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#16161f] border border-slate-800 text-[11px] text-slate-300">
                <Cloud className={`w-3.5 h-3.5 ${
                  cloudSyncStatus === 'synced'
                    ? 'text-emerald-400'
                    : cloudSyncStatus === 'error'
                    ? 'text-rose-400'
                    : 'text-amber-400'
                }`} />
                <span>
                  {cloudSyncStatus === 'syncing'
                    ? 'Syncing...'
                    : cloudSyncStatus === 'error'
                    ? 'Sync Error'
                    : 'Cloud Synced'}
                </span>
              </div>
            )}

            <button
              onClick={() => setShowMoreAboutMeModal(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[#16161f] hover:bg-[#1f1f2b] text-indigo-300 border border-indigo-500/30 transition"
            >
              <UserCheck className="w-3.5 h-3.5" />
              More About Me ({(moreAboutMe.customVariables || []).length + 6})
            </button>

            {worksheet && (
              <button
                onClick={() => downloadWorksheetAsICS(worksheet)}
                className="w-9 h-9 rounded-full bg-[#16161f] hover:bg-[#1f1f2b] text-slate-300 border border-slate-800 flex items-center justify-center transition"
                title="Export Daily Worksheet to Calendar (.ics)"
              >
                <Download className="w-4 h-4 text-indigo-400" />
              </button>
            )}

            <button
              onClick={() => setShowKeyModal(true)}
              className={`w-9 h-9 rounded-full border flex items-center justify-center transition ${
                userApiKey
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700/60'
                  : 'bg-[#16161f] text-slate-300 border-slate-800 hover:bg-[#1f1f2b]'
              }`}
              title="Gemini API Key Settings"
            >
              <Key className="w-4 h-4" />
            </button>

            {isSupabaseConfigured && (
              session ? (
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[#16161f] hover:bg-rose-950/50 text-slate-300 hover:text-rose-200 border border-slate-800 transition"
                  title={`Signed in as ${session.user.email}`}
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              ) : (
                <button
                  onClick={() => setGuestMode(false)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/40 transition"
                  title="Sign in to sync your data"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign In</span>
                </button>
              )
            )}

            {currentStep === 5 && worksheet && (
              <button
                onClick={() => setShowAddCustomTaskModal(true)}
                className="w-10 h-10 rounded-full bg-indigo-500 hover:bg-indigo-400 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30 transition"
                title="Add Custom Habit / Task Card"
              >
                <Plus className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* 5-Step Progress Bar */}
        <div className="max-w-6xl mx-auto px-4 pb-3">
          <nav className="flex items-center justify-between gap-2 overflow-x-auto">
            {steps.map((s, idx) => {
              const Icon = s.icon;
              const isActive = currentStep === s.num;
              const isUnlocked =
                s.num <= 3 ||
                (s.num === 4 && roadmap) ||
                (s.num === 5 && worksheet);

              return (
                <React.Fragment key={s.num}>
                  <button
                    onClick={() => isUnlocked && setCurrentStep(s.num)}
                    disabled={!isUnlocked}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                        : isUnlocked
                        ? 'bg-[#14141c] text-slate-300 hover:bg-[#1d1d28] border border-slate-800/90'
                        : 'bg-[#111116] text-slate-600 cursor-not-allowed'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{s.num}. {s.label}</span>
                  </button>
                  {idx < steps.length - 1 && (
                    <ChevronRight className="w-4 h-4 text-slate-700 shrink-0" />
                  )}
                </React.Fragment>
              );
            })}
          </nav>
        </div>
      </header>

      {/* =====================================================================
          MAIN CONTENT CONTAINER
      ===================================================================== */}
      <main className="max-w-6xl mx-auto px-4 pt-6 space-y-6">
        {/* Error Banner */}
        {errorBanner && (
          <div className="flex items-start justify-between gap-3 p-4 rounded-2xl bg-rose-950/60 border border-rose-800/80 text-rose-200 text-sm">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorBanner}</span>
            </div>
            <button onClick={() => setErrorBanner(null)} className="text-rose-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Overlap Warning */}
        {scheduleStats.overlaps.length > 0 && currentStep <= 3 && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-amber-950/50 border border-amber-800/70 text-amber-200 text-xs">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold">Schedule Overlap Detected:</strong>{' '}
              {scheduleStats.overlaps.join(' • ')}
            </div>
          </div>
        )}

        {/* =================================================================
            STEP 1: UNALTERABLE FIXED SCHEDULES
        ================================================================= */}
        {currentStep === 1 && (
          <section className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-white">Step 1: Unalterable Fixed Schedules</h2>
                <p className="text-sm text-slate-400 mt-1">
                  Lock in your non-negotiable blocks (work, classes, commute). Gemini will never move or overwrite these.
                </p>
              </div>
              <div className="px-3.5 py-2 rounded-xl bg-[#14141c] border border-slate-800 text-xs text-slate-300">
                Fixed Time Locked: <strong className="text-indigo-400">{formatMinutesToDuration(scheduleStats.fixedTotal)}</strong>
              </div>
            </div>

            <div className="grid md:grid-cols-5 gap-6">
              {/* Add Form */}
              <form onSubmit={handleAddFixed} className="md:col-span-2 bg-[#14141c] border border-slate-800/90 rounded-3xl p-5 space-y-4 h-fit">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Plus className="w-4 h-4 text-indigo-400" />
                  Add Fixed Commitment
                </h3>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Commitment Title</label>
                  <input
                    type="text"
                    value={newFixed.title}
                    onChange={(e) => setNewFixed({ ...newFixed, title: e.target.value })}
                    placeholder="e.g., Office Standup / University Lecture"
                    className="w-full px-3 py-2 rounded-xl bg-[#0c0c12] border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Start Time</label>
                    <input
                      type="time"
                      value={newFixed.startTime}
                      onChange={(e) => setNewFixed({ ...newFixed, startTime: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[#0c0c12] border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">End Time</label>
                    <input
                      type="time"
                      value={newFixed.endTime}
                      onChange={(e) => setNewFixed({ ...newFixed, endTime: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[#0c0c12] border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Category</label>
                  <select
                    value={newFixed.category}
                    onChange={(e) => setNewFixed({ ...newFixed, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#0c0c12] border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Work">Work / Study</option>
                    <option value="Commute">Commute / Transit</option>
                    <option value="Family">Family / Personal</option>
                    <option value="Health">Medical / Fixed Fitness</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Lock Commitment
                </button>
              </form>

              {/* Fixed List */}
              <div className="md:col-span-3 space-y-3">
                {[...fixedSchedules]
                  .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))
                  .map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-[#14141c] border border-slate-800/90 hover:border-slate-700 transition"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="px-2.5 py-1.5 rounded-xl bg-[#0c0c12] border border-slate-800 text-xs font-mono text-indigo-300">
                          {item.startTime} - {item.endTime}
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-white">{item.title}</h4>
                          <span className="text-xs text-slate-400">{item.category}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveFixed(item.id)}
                        className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition"
                        title="Remove commitment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setCurrentStep(2)}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold flex items-center gap-2 transition"
              >
                Next: Sleep & Bio-Rhythm
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </section>
        )}

        {/* =================================================================
            STEP 2: SLEEP & BIO-RHYTHM
        ================================================================= */}
        {currentStep === 2 && (
          <section className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Step 2: Sleep, Chronotype & Nutrition</h2>
              <p className="text-sm text-slate-400 mt-1">
                Align deep work with your circadian peak and protect your recovery windows.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Sleep & Chronotype Card */}
              <div className="bg-[#14141c] border border-slate-800/90 rounded-3xl p-5 space-y-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Moon className="w-4 h-4 text-purple-400" />
                  Sleep & Energy Architecture
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1 flex items-center gap-1">
                      <Sun className="w-3.5 h-3.5 text-amber-400" /> Wake-Up Time
                    </label>
                    <input
                      type="time"
                      value={bioSchedule.wakeUp}
                      onChange={(e) => setBioSchedule({ ...bioSchedule, wakeUp: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[#0c0c12] border border-slate-800 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1 flex items-center gap-1">
                      <Moon className="w-3.5 h-3.5 text-indigo-400" /> Sleep Target
                    </label>
                    <input
                      type="time"
                      value={bioSchedule.sleepStart}
                      onChange={(e) => setBioSchedule({ ...bioSchedule, sleepStart: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[#0c0c12] border border-slate-800 text-sm text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Evening Wind-Down Buffer: <strong className="text-white">{bioSchedule.windDownMinutes} mins</strong>
                  </label>
                  <input
                    type="range"
                    min="15"
                    max="90"
                    step="15"
                    value={bioSchedule.windDownMinutes}
                    onChange={(e) => setBioSchedule({ ...bioSchedule, windDownMinutes: Number(e.target.value) })}
                    className="w-full accent-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Chronotype</label>
                  <select
                    value={bioSchedule.chronotype}
                    onChange={(e) => setBioSchedule({ ...bioSchedule, chronotype: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#0c0c12] border border-slate-800 text-sm text-white"
                  >
                    <option value="Morning Peak (Lark)">Morning Peak (Lark) – Best focus 07:00-12:00</option>
                    <option value="Balanced Mid-Day (Hummingbird)">Balanced Mid-Day (Hummingbird) – Best focus 10:00-15:00</option>
                    <option value="Night Owl (Wolf)">Night Owl (Wolf) – Best focus 16:00-23:00</option>
                  </select>
                </div>
              </div>

              {/* Meals Card */}
              <div className="bg-[#14141c] border border-slate-800/90 rounded-3xl p-5 space-y-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Utensils className="w-4 h-4 text-emerald-400" />
                  Meal & Fuel Windows
                </h3>
                <div className="space-y-2.5">
                  {bioSchedule.meals.map((meal) => (
                    <div key={meal.id} className="grid grid-cols-12 gap-2 items-center bg-[#0c0c12] p-2.5 rounded-xl border border-slate-800">
                      <input
                        type="text"
                        value={meal.name}
                        onChange={(e) => handleUpdateMeal(meal.id, 'name', e.target.value)}
                        className="col-span-5 bg-transparent text-xs text-white focus:outline-none"
                      />
                      <input
                        type="time"
                        value={meal.time}
                        onChange={(e) => handleUpdateMeal(meal.id, 'time', e.target.value)}
                        className="col-span-4 bg-[#14141c] px-2 py-1 rounded text-xs text-slate-200 border border-slate-800"
                      />
                      <div className="col-span-2 flex items-center gap-1">
                        <input
                          type="number"
                          min="10"
                          max="120"
                          value={meal.duration}
                          onChange={(e) => handleUpdateMeal(meal.id, 'duration', Number(e.target.value))}
                          className="w-full bg-[#14141c] px-1.5 py-1 rounded text-xs text-slate-200 border border-slate-800 text-center"
                        />
                        <span className="text-[10px] text-slate-500">m</span>
                      </div>
                      <button
                        onClick={() => handleRemoveMeal(meal.id)}
                        className="col-span-1 text-slate-500 hover:text-rose-400 flex justify-center"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleAddMeal} className="grid grid-cols-12 gap-2 pt-2 border-t border-slate-800">
                  <input
                    type="text"
                    placeholder="Add snack / pre-workout..."
                    value={newMeal.name}
                    onChange={(e) => setNewMeal({ ...newMeal, name: e.target.value })}
                    className="col-span-5 px-2.5 py-1.5 rounded-lg bg-[#0c0c12] border border-slate-800 text-xs text-white"
                  />
                  <input
                    type="time"
                    value={newMeal.time}
                    onChange={(e) => setNewMeal({ ...newMeal, time: e.target.value })}
                    className="col-span-3 px-2 py-1.5 rounded-lg bg-[#0c0c12] border border-slate-800 text-xs text-white"
                  />
                  <input
                    type="number"
                    min="5"
                    max="90"
                    value={newMeal.duration}
                    onChange={(e) => setNewMeal({ ...newMeal, duration: Number(e.target.value) })}
                    className="col-span-2 px-2 py-1.5 rounded-lg bg-[#0c0c12] border border-slate-800 text-xs text-white text-center"
                  />
                  <button
                    type="submit"
                    className="col-span-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <button
                onClick={() => setCurrentStep(1)}
                className="px-5 py-2.5 rounded-xl bg-[#14141c] hover:bg-slate-800 text-slate-300 text-sm font-medium border border-slate-800 flex items-center gap-2 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <button
                onClick={() => setCurrentStep(3)}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold flex items-center gap-2 transition"
              >
                Next: Goals & "More About Me"
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </section>
        )}

        {/* =================================================================
            STEP 3: GOALS, TIMEFRAME & "MORE ABOUT ME" PERSONAL VARIABLES
        ================================================================= */}
        {currentStep === 3 && (
          <section className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-white">Step 3: Target Goals & "More About Me"</h2>
                <p className="text-sm text-slate-400 mt-1">
                  Add your daily habits/goals and specify personal variables in <strong>More About Me</strong> that can alter or customize your plan.
                </p>
              </div>
              <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-[#14141c] border border-slate-800 text-xs">
                <span className="text-slate-400">
                  Available Pocket: <strong className="text-emerald-400">{formatMinutesToDuration(scheduleStats.freePocket)}</strong>
                </span>
                <span className="text-slate-700">|</span>
                <span className="text-slate-400">
                  Goals Requested:{' '}
                  <strong className={scheduleStats.goalsRequested > scheduleStats.freePocket ? 'text-rose-400' : 'text-indigo-400'}>
                    {formatMinutesToDuration(scheduleStats.goalsRequested)}
                  </strong>
                </span>
              </div>
            </div>

            {/* Timeframe & Intensity */}
            <div className="grid md:grid-cols-2 gap-4 bg-[#14141c] border border-slate-800/90 rounded-3xl p-5">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Target Horizon</label>
                <select
                  value={goalsData.timeframe}
                  onChange={(e) => setGoalsData({ ...goalsData, timeframe: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#0c0c12] border border-slate-800 text-sm text-white"
                >
                  <option value="30 Days (Sprint Mastery)">30 Days (Sprint Mastery)</option>
                  <option value="90 Days (Quarter Mastery)">90 Days (Quarter Mastery)</option>
                  <option value="6 Months (Deep Transformation)">6 Months (Deep Transformation)</option>
                  <option value="1 Year (Long-Term Architecture)">1 Year (Long-Term Architecture)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Execution Intensity</label>
                <select
                  value={goalsData.intensity}
                  onChange={(e) => setGoalsData({ ...goalsData, intensity: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#0c0c12] border border-slate-800 text-sm text-white"
                >
                  <option value="Sustainable & Gentle">Sustainable & Gentle (Low Burnout Risk)</option>
                  <option value="Balanced High-Performance">Balanced High-Performance</option>
                  <option value="Monk Mode (Maximum Output)">Monk Mode (Maximum Output)</option>
                </select>
              </div>
            </div>

            {/* Goals Grid */}
            <div className="grid md:grid-cols-5 gap-6">
              <form onSubmit={handleAddGoal} className="md:col-span-2 bg-[#14141c] border border-slate-800/90 rounded-3xl p-5 space-y-4 h-fit">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Target className="w-4 h-4 text-rose-400" />
                  Add Daily Habit / Goal
                </h3>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Goal or Habit Title</label>
                  <input
                    type="text"
                    value={newGoal.title}
                    onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                    placeholder="e.g., Boxing / Daily Gym / SaaS MVP"
                    className="w-full px-3 py-2 rounded-xl bg-[#0c0c12] border border-slate-800 text-sm text-white"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Priority</label>
                    <select
                      value={newGoal.priority}
                      onChange={(e) => setNewGoal({ ...newGoal, priority: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[#0c0c12] border border-slate-800 text-sm text-white"
                    >
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Daily Mins</label>
                    <input
                      type="number"
                      min="10"
                      max="360"
                      step="5"
                      value={newGoal.dailyMinutes}
                      onChange={(e) => setNewGoal({ ...newGoal, dailyMinutes: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl bg-[#0c0c12] border border-slate-800 text-sm text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Context / Notes</label>
                  <textarea
                    rows={2}
                    value={newGoal.notes}
                    onChange={(e) => setNewGoal({ ...newGoal, notes: e.target.value })}
                    placeholder="Key milestones or preferred time of day..."
                    className="w-full px-3 py-2 rounded-xl bg-[#0c0c12] border border-slate-800 text-sm text-white"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold transition flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add to Daily Goals
                </button>
              </form>

              <div className="md:col-span-3 space-y-3">
                {goalsData.goals.map((goal) => (
                  <div
                    key={goal.id}
                    className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-[#14141c] border border-slate-800/90"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-white">{goal.title}</h4>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${
                          goal.priority === 'High'
                            ? 'bg-rose-950 text-rose-300 border border-rose-800/60'
                            : goal.priority === 'Medium'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800/60'
                            : 'bg-slate-800 text-slate-300'
                        }`}>
                          {goal.priority}
                        </span>
                        <span className="text-xs font-mono text-indigo-300">{goal.dailyMinutes}m/day</span>
                      </div>
                      {goal.notes && <p className="text-xs text-slate-400">{goal.notes}</p>}
                    </div>
                    <button
                      onClick={() => handleRemoveGoal(goal.id)}
                      className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* =================================================================
                "MORE ABOUT ME" — PERSONAL VARIABLES & PLAN MODIFIERS
            ================================================================= */}
            <div className="bg-gradient-to-br from-[#161622] via-[#14141c] to-[#191524] border border-indigo-500/30 rounded-3xl p-6 space-y-5 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      More About Me
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider font-semibold">
                        Dynamic Plan Modifiers
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Add any personal variables, energy dips, environment rules, or life constraints that should alter how Gemini builds your plan.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Work / Study Environment</label>
                  <input
                    type="text"
                    value={moreAboutMe.workEnvironment}
                    onChange={(e) => setMoreAboutMe({ ...moreAboutMe, workEnvironment: e.target.value })}
                    placeholder="e.g., Hybrid, WFH, High-noise office"
                    className="w-full px-3 py-2 rounded-xl bg-[#0c0c12] border border-slate-800 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Typical Energy Dip Window</label>
                  <input
                    type="text"
                    value={moreAboutMe.energySlumpTime}
                    onChange={(e) => setMoreAboutMe({ ...moreAboutMe, energySlumpTime: e.target.value })}
                    placeholder="e.g., 14:30 - 16:00 post-lunch slump"
                    className="w-full px-3 py-2 rounded-xl bg-[#0c0c12] border border-slate-800 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Preferred Focus Cadence & Caffeine Cutoff</label>
                  <input
                    type="text"
                    value={moreAboutMe.focusStyle}
                    onChange={(e) => setMoreAboutMe({ ...moreAboutMe, focusStyle: e.target.value })}
                    placeholder="e.g., 25m sprints, no caffeine after 2 PM"
                    className="w-full px-3 py-2 rounded-xl bg-[#0c0c12] border border-slate-800 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Personal Constraints & Non-Negotiable Nuances</label>
                  <textarea
                    rows={2}
                    value={moreAboutMe.personalConstraints}
                    onChange={(e) => setMoreAboutMe({ ...moreAboutMe, personalConstraints: e.target.value })}
                    placeholder="e.g., Need 15m quiet buffer after commute; prefer gym/boxing before dinner..."
                    className="w-full px-3 py-2 rounded-xl bg-[#0c0c12] border border-slate-800 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Friction Triggers & Burnout Signals to Avoid</label>
                  <textarea
                    rows={2}
                    value={moreAboutMe.stressTriggers}
                    onChange={(e) => setMoreAboutMe({ ...moreAboutMe, stressTriggers: e.target.value })}
                    placeholder="e.g., Back-to-back deep work without movement; heavy meals before coding..."
                    className="w-full px-3 py-2 rounded-xl bg-[#0c0c12] border border-slate-800 text-xs text-white"
                  />
                </div>
              </div>

              {/* Custom Key-Value Variables */}
              <div className="space-y-3 pt-2 border-t border-slate-800/80">
                <label className="block text-xs font-semibold text-indigo-300">
                  Custom Personal Variables (Add any factor that can alter your daily plan):
                </label>
                <div className="flex flex-wrap gap-2">
                  {(moreAboutMe.customVariables || []).map((cv) => (
                    <div
                      key={cv.id}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0c0c12] border border-indigo-500/30 text-xs"
                    >
                      <span className="font-semibold text-indigo-300">{cv.label}:</span>
                      <span className="text-slate-200">{cv.value}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomVariable(cv.id)}
                        className="text-slate-500 hover:text-rose-400"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleAddCustomVariable} className="grid sm:grid-cols-12 gap-2">
                  <input
                    type="text"
                    placeholder="Variable name (e.g., Fasting Window, Pet Walk, Medication)"
                    value={newCustomVar.label}
                    onChange={(e) => setNewCustomVar({ ...newCustomVar, label: e.target.value })}
                    className="sm:col-span-4 px-3 py-2 rounded-xl bg-[#0c0c12] border border-slate-800 text-xs text-white"
                  />
                  <input
                    type="text"
                    placeholder="How it affects your plan (e.g., First meal at 12:30 PM, 20m walk at 07:00)"
                    value={newCustomVar.value}
                    onChange={(e) => setNewCustomVar({ ...newCustomVar, value: e.target.value })}
                    className="sm:col-span-6 px-3 py-2 rounded-xl bg-[#0c0c12] border border-slate-800 text-xs text-white"
                  />
                  <button
                    type="submit"
                    className="sm:col-span-2 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1 transition"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Variable
                  </button>
                </form>
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <button
                onClick={() => setCurrentStep(2)}
                className="px-5 py-2.5 rounded-xl bg-[#14141c] hover:bg-slate-800 text-slate-300 text-sm font-medium border border-slate-800 flex items-center gap-2 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <button
                onClick={generateInitialRoadmap}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/25 transition"
              >
                <Sparkles className="w-4 h-4" />
                Architect AI Roadmap
              </button>
            </div>
          </section>
        )}

        {/* =================================================================
            STEP 4: AI RESEARCH & STRATEGIC ROADMAP
        ================================================================= */}
        {currentStep === 4 && roadmap && (
          <section className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-white">Step 4: Strategic AI Roadmap</h2>
                <p className="text-sm text-slate-400 mt-1">
                  Calibrated around your chronotype and your <strong>More About Me</strong> personal variables.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowMoreAboutMeModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-[#14141c] hover:bg-slate-800 text-indigo-300 border border-indigo-500/30 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <UserCheck className="w-4 h-4" />
                  Edit "More About Me"
                </button>
                <button
                  onClick={generateDailyWorksheet}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-semibold flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition"
                >
                  Launch Daily Habit Tracker
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scientific Summary Cards */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-[#14141c] border border-slate-800 space-y-1.5">
                <div className="text-xs font-semibold text-indigo-400 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" /> Research Synthesis
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{roadmap.researchSummary}</p>
              </div>
              <div className="p-4 rounded-2xl bg-[#14141c] border border-slate-800 space-y-1.5">
                <div className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                  <Sun className="w-3.5 h-3.5" /> Chronotype Alignment
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{roadmap.chronotypeAdvice}</p>
              </div>
              <div className="p-4 rounded-2xl bg-[#14141c] border border-slate-800 space-y-1.5">
                <div className="text-xs font-semibold text-purple-400 flex items-center gap-1.5">
                  <Brain className="w-3.5 h-3.5" /> Behavioral Framework
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{roadmap.scientificFramework}</p>
              </div>
              <div className="p-4 rounded-2xl bg-[#14141c] border border-emerald-800/50 space-y-1.5">
                <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5" /> "More About Me" Adaptations
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {roadmap.personalVariableAdaptations || 'Tailored to your energy dips, environment, and custom constraints.'}
                </p>
              </div>
            </div>

            {/* Phases */}
            <div className="grid md:grid-cols-3 gap-4">
              {roadmap.phases?.map((phase, idx) => (
                <div key={idx} className="p-5 rounded-3xl bg-[#14141c] border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                      Phase {idx + 1}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                      {phase.duration}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white">{phase.phaseName}</h3>
                  <p className="text-xs text-slate-400">{phase.focus}</p>
                  <ul className="space-y-1.5 pt-1">
                    {phase.keyHabits?.map((h, i) => (
                      <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="pt-2 border-t border-slate-800 text-xs text-emerald-300">
                    <strong>Outcome:</strong> {phase.expectedOutcome}
                  </div>
                </div>
              ))}
            </div>

            {/* Iterative Refinement Chat */}
            <form onSubmit={handleRefineRoadmap} className="bg-[#14141c] border border-slate-800 rounded-3xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">
                  Want to adjust the roadmap or add another constraint? Tell Gemini:
                </label>
                {refinementHistory.length > 0 && (
                  <span className="text-[11px] text-slate-500">
                    {refinementHistory.length} refinement(s) applied
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={refinementInput}
                  onChange={(e) => setRefinementInput(e.target.value)}
                  placeholder="e.g., Move Boxing to 18:00 and keep mornings for AI Engineering..."
                  className="flex-1 px-3.5 py-2 rounded-xl bg-[#0c0c12] border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold flex items-center gap-1.5 transition"
                >
                  <Send className="w-4 h-4" />
                  Refine
                </button>
              </div>
            </form>
          </section>
        )}

        {/* =================================================================
            STEP 5: HABITKIT-INSPIRED EVERYDAY INTERFACE + JOURNALS
        ================================================================= */}
        {currentStep === 5 && worksheet && (
          <section className="space-y-6">
            {/* Top Category Pills & Quick Stats Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <button
                  onClick={() => setSelectedCategoryFilter('All')}
                  className={`w-10 h-10 rounded-full flex items-center justify-center border transition shrink-0 ${
                    selectedCategoryFilter === 'All'
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                      : 'bg-[#16161f] text-slate-400 border-slate-800 hover:text-white'
                  }`}
                  title="Show All Tasks & Habits"
                >
                  <ListChecks className="w-4 h-4" />
                </button>
                <span className="text-slate-700 text-lg select-none">•</span>
                {[
                  { id: 'Gym & Health', label: 'Gym & Health', icon: Dumbbell },
                  { id: 'Deep Work', label: 'Deep Work', icon: Brain },
                  { id: 'Habit', label: 'Habits', icon: Flame },
                  { id: 'Bio/Meal', label: 'Bio / Fuel', icon: Utensils },
                  { id: 'Fixed', label: 'Fixed Locks', icon: Calendar }
                ].map((cat) => {
                  const Icon = cat.icon;
                  const active = selectedCategoryFilter === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategoryFilter(cat.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold border transition whitespace-nowrap ${
                        active
                          ? 'bg-[#222230] text-white border-slate-600 shadow-sm'
                          : 'bg-[#14141c] text-slate-400 border-slate-800/80 hover:text-slate-200'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowRecalibrateModal(true)}
                  className="px-3.5 py-2 rounded-full bg-rose-950/60 hover:bg-rose-900/70 text-rose-200 border border-rose-800/60 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Recalibrate Day
                </button>
              </div>
            </div>

            {/* Daily Progress & Focus Timer Strip */}
            <div className="grid md:grid-cols-12 gap-4">
              <div className="md:col-span-5 p-5 rounded-3xl bg-[#14141c] border border-slate-800/90 flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-400" />
                    Today's Progress • {todayISO}
                  </span>
                  <span className="text-xs font-bold text-emerald-400">
                    {doneScheduleToday}/{totalScheduleBlocks} Tasks • {doneHabitsToday}/{totalCoreHabits} Habits
                  </span>
                </div>
                <p className="text-sm font-semibold text-white leading-snug">“{worksheet.dailyMantra}”</p>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Daily Completion</span>
                    <span className="text-white font-semibold">{scheduleProgressPct}%</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-[#09090d] overflow-hidden border border-slate-800/80">
                    <div
                      className="h-full bg-gradient-to-r from-rose-500 via-indigo-500 to-emerald-400 transition-all duration-300"
                      style={{ width: `${scheduleProgressPct}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Focus Sprint Timer */}
              <div className="md:col-span-7 p-5 rounded-3xl bg-[#14141c] border border-slate-800/90 flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-indigo-300 font-semibold">
                    <Clock className="w-3.5 h-3.5" />
                    Active Focus Sprint • {focusSessionsCompleted} completed
                  </div>
                  <p className="text-sm font-bold text-white truncate max-w-sm">{activeTaskTitle}</p>
                  <div className="flex gap-1.5 pt-0.5">
                    {[
                      { id: 'focus', label: '25m Focus' },
                      { id: 'deep', label: '50m Deep' },
                      { id: 'break', label: '5m Break' }
                    ].map(m => (
                      <button
                        key={m.id}
                        onClick={() => changeTimerMode(m.id)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition ${
                          timerMode === m.id
                            ? 'bg-indigo-600 text-white'
                            : 'bg-[#0c0c12] text-slate-400 hover:text-white border border-slate-800'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-3xl font-mono font-bold text-white tracking-wider">
                    {formatTimer(timerSeconds)}
                  </span>
                  <button
                    onClick={() => setIsTimerRunning(!isTimerRunning)}
                    className="w-11 h-11 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center transition shadow-lg shadow-indigo-600/25"
                  >
                    {isTimerRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => changeTimerMode(timerMode)}
                    className="w-11 h-11 rounded-2xl bg-[#0c0c12] hover:bg-slate-800 text-slate-300 border border-slate-800 flex items-center justify-center transition"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* =================================================================
                VIEW 1: HABITKIT-STYLE HEATMAP CARDS
            ================================================================= */}
            {activeView === 'heatmap' && (
              <div className="space-y-6">
                {/* Core Habits Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                      <Flame className="w-4 h-4 text-rose-400" />
                      Core Daily Habits — Tap Checkmark to Tick Today (or click any dot to backfill)
                    </h3>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    {(worksheet.coreHabits || []).map((habit, idx) => {
                      const palette = getPaletteForItem(habit, idx);
                      const Icon = getIconForItem(habit);
                      const historyMap = completionHistory[habit.id] || {};
                      const isDoneToday = !!historyMap[todayISO];
                      const streak = calculateStreakFromHistory(historyMap);

                      return (
                        <div
                          key={habit.id}
                          className="p-5 rounded-[28px] bg-[#14141c] border border-slate-800/80 hover:border-slate-700/80 transition space-y-4 shadow-xl"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3.5">
                              <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 ${palette.iconBg}`}>
                                <Icon className="w-6 h-6" />
                              </div>
                              <div>
                                <h4 className="text-lg font-bold text-white tracking-tight">{habit.name}</h4>
                                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                                  <span>{habit.triggerCue}</span>
                                  <span>•</span>
                                  <span className={palette.textAccent}>{streak}d streak</span>
                                </div>
                              </div>
                            </div>

                            <button
                              onClick={() => toggleDateCompletion(habit.id, todayISO)}
                              className={`w-12 h-12 rounded-2xl border flex items-center justify-center transition-all duration-200 shrink-0 ${
                                isDoneToday
                                  ? palette.checkDone
                                  : 'bg-[#1d1d26] border-slate-700/80 text-slate-400 hover:text-white hover:border-slate-500'
                              }`}
                              title={isDoneToday ? 'Completed today! Click to undo' : 'Tick today’s habit'}
                            >
                              <Check className="w-6 h-6 stroke-[2.5]" />
                            </button>
                          </div>

                          <div className="overflow-x-auto pb-1">
                            <div className="inline-flex gap-[5px]">
                              {heatmapColumns.map((col, cIdx) => (
                                <div key={cIdx} className="flex flex-col gap-[5px]">
                                  {col.map((cell) => {
                                    const active = !!historyMap[cell.iso];
                                    return (
                                      <button
                                        key={cell.iso}
                                        type="button"
                                        disabled={cell.isFuture}
                                        onClick={() => toggleDateCompletion(habit.id, cell.iso)}
                                        title={`${cell.label}${cell.isToday ? ' (Today)' : ''}: ${active ? 'Completed' : 'Not completed'}`}
                                        className={`w-[11px] h-[11px] rounded-[3px] transition-all ${
                                          cell.isFuture
                                            ? 'bg-slate-900/30 opacity-25 cursor-default'
                                            : active
                                            ? palette.dotActive
                                            : palette.dotInactive
                                        } ${cell.isToday ? palette.dotTodayRing : ''}`}
                                      />
                                    );
                                  })}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Daily Scheduled Tasks as HabitKit Cards */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                      <LayoutGrid className="w-4 h-4 text-indigo-400" />
                      Today's Time-Blocked Schedule Cards ({filteredSchedule.length})
                    </h3>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    {filteredSchedule.map((block, idx) => {
                      const palette = getPaletteForItem(block, idx + 1);
                      const Icon = getIconForItem(block);
                      const historyMap = completionHistory[block.id] || {};
                      const isDoneToday = !!historyMap[todayISO];
                      const streak = calculateStreakFromHistory(historyMap);
                      const isExpanded = !!expandedCards[block.id];
                      const notesForBlock = blockNotes[block.id] || [];

                      return (
                        <div
                          key={block.id}
                          className="p-5 rounded-[28px] bg-[#14141c] border border-slate-800/80 hover:border-slate-700/80 transition space-y-4 shadow-xl"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3.5 min-w-0">
                              <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 ${palette.iconBg}`}>
                                <Icon className="w-6 h-6" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-mono font-semibold text-indigo-300">
                                    {block.startTime} - {block.endTime}
                                  </span>
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1e1e2a] text-slate-300 border border-slate-700/70">
                                    {block.category}
                                  </span>
                                </div>
                                <h4 className={`text-base font-bold truncate mt-0.5 ${isDoneToday ? 'line-through text-slate-400' : 'text-white'}`}>
                                  {block.title}
                                </h4>
                              </div>
                            </div>

                            <button
                              onClick={() => toggleDateCompletion(block.id, todayISO)}
                              className={`w-12 h-12 rounded-2xl border flex items-center justify-center transition-all duration-200 shrink-0 ${
                                isDoneToday
                                  ? palette.checkDone
                                  : 'bg-[#1d1d26] border-slate-700/80 text-slate-400 hover:text-white hover:border-slate-500'
                              }`}
                              title="Tick today's task"
                            >
                              <Check className="w-6 h-6 stroke-[2.5]" />
                            </button>
                          </div>

                          <div className="overflow-x-auto pb-1">
                            <div className="inline-flex gap-[5px]">
                              {heatmapColumns.map((col, cIdx) => (
                                <div key={cIdx} className="flex flex-col gap-[5px]">
                                  {col.map((cell) => {
                                    const active = !!historyMap[cell.iso];
                                    return (
                                      <button
                                        key={cell.iso}
                                        type="button"
                                        disabled={cell.isFuture}
                                        onClick={() => toggleDateCompletion(block.id, cell.iso)}
                                        title={`${cell.label}${cell.isToday ? ' (Today)' : ''}: ${active ? 'Done' : 'Missed'}`}
                                        className={`w-[11px] h-[11px] rounded-[3px] transition-all ${
                                          cell.isFuture
                                            ? 'bg-slate-900/30 opacity-25 cursor-default'
                                            : active
                                            ? palette.dotActive
                                            : palette.dotInactive
                                        } ${cell.isToday ? palette.dotTodayRing : ''}`}
                                      />
                                    );
                                  })}
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-1 border-t border-slate-800/70 text-xs">
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedCards(prev => ({ ...prev, [block.id]: !prev[block.id] }))
                                }
                                className="text-slate-400 hover:text-white font-medium flex items-center gap-1"
                              >
                                <ListChecks className="w-3.5 h-3.5 text-indigo-400" />
                                {isExpanded ? 'Hide Details & Journal' : `Steps & Journal (${notesForBlock.length})`}
                              </button>
                              <span className="text-slate-600">•</span>
                              <span className="text-slate-400">{streak}d streak</span>
                            </div>

                            <button
                              type="button"
                              onClick={() => startFocusForTask(`${block.startTime} ${block.title}`)}
                              className="px-2.5 py-1 rounded-lg bg-[#1d1d26] hover:bg-indigo-600 text-slate-300 hover:text-white text-[11px] font-semibold flex items-center gap-1 transition"
                            >
                              <Play className="w-3 h-3" /> Focus
                            </button>
                          </div>

                          {isExpanded && (
                            <div className="pt-3 border-t border-slate-800/80 space-y-3">
                              {block.actionableMicroSteps?.length > 0 && (
                                <ul className="space-y-1">
                                  {block.actionableMicroSteps.map((step, i) => (
                                    <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                                      <span className={palette.textAccent}>•</span>
                                      <span>{step}</span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                              {block.aiTip && (
                                <div className="text-[11px] text-indigo-300 bg-indigo-950/30 border border-indigo-800/40 rounded-xl p-2.5">
                                  <strong>AI Tip:</strong> {block.aiTip}
                                </div>
                              )}

                              <div className="space-y-2 pt-1">
                                <label className="block text-[11px] font-semibold text-slate-400">
                                  Add Timestamped Task Journal Note:
                                </label>
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    value={activeBlockNoteInput[block.id] || ''}
                                    onChange={(e) =>
                                      setActiveBlockNoteInput(prev => ({ ...prev, [block.id]: e.target.value }))
                                    }
                                    placeholder="Log sets, reps, blockers, or thoughts..."
                                    className="flex-1 px-3 py-1.5 rounded-xl bg-[#0c0c12] border border-slate-800 text-xs text-white"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleAddBlockMicroNote(block.id, block.title)}
                                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                                  >
                                    Log
                                  </button>
                                </div>
                              </div>
                              {notesForBlock.length > 0 && (
                                <div className="space-y-1.5 pt-1">
                                  {notesForBlock.map((n) => (
                                    <div key={n.id} className="p-2 rounded-xl bg-[#0c0c12] border border-slate-800/80 text-xs">
                                      <div className="text-[10px] text-indigo-400 font-mono">{n.journalDateLabel}</div>
                                      <div className="text-slate-200 mt-0.5">{n.text}</div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================
                VIEW 2: CHRONOLOGICAL CHECKLIST TIMELINE VIEW
            ======================================================== */}
            {activeView === 'timeline' && (
              <div className="space-y-3">
                {filteredSchedule.map((block, idx) => {
                  const palette = getPaletteForItem(block, idx);
                  const isDoneToday = !!completionHistory[block.id]?.[todayISO];
                  return (
                    <div
                      key={block.id}
                      className={`p-4 rounded-2xl border transition flex items-start justify-between gap-4 ${
                        isDoneToday
                          ? 'bg-[#111117] border-slate-800/50 opacity-70'
                          : 'bg-[#14141c] border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start gap-3.5">
                        <button
                          onClick={() => toggleDateCompletion(block.id, todayISO)}
                          className={`mt-0.5 w-7 h-7 rounded-xl border flex items-center justify-center transition ${
                            isDoneToday
                              ? palette.checkDone
                              : 'bg-[#1d1d26] border-slate-700 text-slate-400 hover:text-white'
                          }`}
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-mono font-semibold text-indigo-300">
                              {block.startTime} - {block.endTime}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                              {block.category}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {block.priority} Priority • {block.energyRequired} Energy
                            </span>
                          </div>
                          <h4 className={`text-sm font-bold ${isDoneToday ? 'line-through text-slate-500' : 'text-white'}`}>
                            {block.title}
                          </h4>
                          {block.actionableMicroSteps?.length > 0 && (
                            <ul className="pt-1 space-y-0.5">
                              {block.actionableMicroSteps.map((s, i) => (
                                <li key={i} className="text-xs text-slate-400">• {s}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => startFocusForTask(`${block.startTime} ${block.title}`)}
                        className="px-3 py-1.5 rounded-xl bg-[#0c0c12] hover:bg-indigo-600 text-xs text-slate-300 hover:text-white border border-slate-800 shrink-0 transition"
                      >
                        Focus
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ========================================================
                EVERYDAY JOURNALS & REFLECTION STUDIO
            ======================================================== */}
            {(activeView === 'journals' || activeView === 'heatmap') && (
              <div className="pt-4 space-y-6">
                <div className="border-t border-slate-800/80 pt-6 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <BookMarked className="w-5 h-5 text-indigo-400" />
                      Everyday Journals & Timestamped Reflections
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Every entry automatically locks in the exact date & time stamp when written and can be edited anytime afterward.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAnalyzeJournalsWithAI}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 transition"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    AI Analyze My Journals & Streaks
                  </button>
                </div>

                {/* AI Journal Coach Output */}
                {aiJournalInsight && (
                  <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-950/50 via-[#14141c] to-purple-950/40 border border-indigo-500/40 grid md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold uppercase text-indigo-400">Pattern Detected</span>
                      <p className="text-xs text-slate-200 leading-relaxed">{aiJournalInsight.patternDetected}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold uppercase text-emerald-400">Momentum & Wins</span>
                      <p className="text-xs text-slate-200 leading-relaxed">{aiJournalInsight.praiseAndMomentum}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold uppercase text-amber-400">Schedule Adjustment</span>
                      <p className="text-xs text-slate-200 leading-relaxed">{aiJournalInsight.scheduleAdjustmentTip}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold uppercase text-purple-400">Next Reflection Prompt</span>
                      <p className="text-xs text-slate-200 leading-relaxed">{aiJournalInsight.nextJournalPrompt}</p>
                    </div>
                  </div>
                )}

                <div className="grid lg:grid-cols-12 gap-6">
                  {/* Write New Journal Entry Form */}
                  <form
                    onSubmit={handleAddJournalEntry}
                    className="lg:col-span-5 bg-[#14141c] border border-slate-800/90 rounded-3xl p-5 space-y-4 h-fit"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <Edit3 className="w-4 h-4 text-indigo-400" />
                        New Daily Journal Entry
                      </h4>
                      <span className="text-[11px] font-mono text-slate-400">
                        {formatDateTimeStamp(new Date())}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Journal Type</label>
                        <select
                          value={journalForm.promptType}
                          onChange={(e) => setJournalForm({ ...journalForm, promptType: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-[#0c0c12] border border-slate-800 text-xs text-white"
                        >
                          <option value="Morning Intention">Morning Intention</option>
                          <option value="Daily Reflection">Daily Reflection</option>
                          <option value="Workout / Training Log">Workout / Training Log</option>
                          <option value="Bottlenecks & Friction">Bottlenecks & Friction</option>
                          <option value="Evening Gratitude & Wins">Evening Gratitude & Wins</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Linked Task / Habit</label>
                        <select
                          value={journalForm.linkedTaskTitle}
                          onChange={(e) => setJournalForm({ ...journalForm, linkedTaskTitle: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-[#0c0c12] border border-slate-800 text-xs text-white"
                        >
                          <option value="General Daily Log">General Daily Log</option>
                          {(worksheet.coreHabits || []).map(h => (
                            <option key={h.id} value={h.name}>Habit: {h.name}</option>
                          ))}
                          {(worksheet.schedule || []).map(b => (
                            <option key={b.id} value={b.title}>{b.startTime} - {b.title}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Entry Headline (Optional)</label>
                      <input
                        type="text"
                        value={journalForm.title}
                        onChange={(e) => setJournalForm({ ...journalForm, title: e.target.value })}
                        placeholder="e.g., Great heavy-bag session & deep coding flow"
                        className="w-full px-3 py-2 rounded-xl bg-[#0c0c12] border border-slate-800 text-xs text-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-slate-400 mb-1 flex items-center gap-1">
                          <Smile className="w-3.5 h-3.5 text-amber-400" /> Mood State
                        </label>
                        <select
                          value={journalForm.mood}
                          onChange={(e) => setJournalForm({ ...journalForm, mood: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-[#0c0c12] border border-slate-800 text-xs text-white"
                        >
                          <option value="Energized">Energized 🔥</option>
                          <option value="Focused">Focused 🎯</option>
                          <option value="Calm">Calm 🌿</option>
                          <option value="Tired">Tired 🌙</option>
                          <option value="Stressed">Stressed ⚡</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1 flex items-center gap-1">
                          <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" /> Energy ({journalForm.energyLevel}/5)
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="5"
                          value={journalForm.energyLevel}
                          onChange={(e) => setJournalForm({ ...journalForm, energyLevel: Number(e.target.value) })}
                          className="w-full accent-emerald-500 mt-2"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Journal Content</label>
                      <textarea
                        rows={4}
                        value={journalForm.content}
                        onChange={(e) => setJournalForm({ ...journalForm, content: e.target.value })}
                        placeholder="Write your thoughts, workout numbers, wins, or what you want to change tomorrow..."
                        className="w-full px-3 py-2 rounded-xl bg-[#0c0c12] border border-slate-800 text-xs text-white leading-relaxed"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Tags (comma-separated)</label>
                      <input
                        type="text"
                        value={journalForm.tagsInput}
                        onChange={(e) => setJournalForm({ ...journalForm, tagsInput: e.target.value })}
                        placeholder="Boxing, Gym, AI, Mindset"
                        className="w-full px-3 py-2 rounded-xl bg-[#0c0c12] border border-slate-800 text-xs text-white"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition"
                    >
                      <Save className="w-4 h-4" />
                      Save Journal with Date Stamp
                    </button>
                  </form>

                  {/* Saved Journals Timeline */}
                  <div className="lg:col-span-7 space-y-3">
                    {journals.length === 0 ? (
                      <div className="p-8 rounded-3xl border border-dashed border-slate-800 text-center text-slate-500 text-sm">
                        No journal entries yet. Write your first reflection on the left!
                      </div>
                    ) : (
                      journals.map((entry) => {
                        const isEditing = editingJournalId === entry.id;
                        return (
                          <div
                            key={entry.id}
                            className="p-5 rounded-3xl bg-[#14141c] border border-slate-800/90 space-y-3"
                          >
                            {!isEditing ? (
                              <>
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                  <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="text-[11px] font-mono font-semibold text-indigo-300 bg-indigo-950/50 border border-indigo-800/50 px-2.5 py-0.5 rounded-full">
                                        Written: {entry.journalDateLabel}
                                      </span>
                                      {entry.lastEditedLabel && (
                                        <span className="text-[10px] font-mono text-amber-300/90 bg-amber-950/40 border border-amber-800/40 px-2 py-0.5 rounded-full">
                                          Edited: {entry.lastEditedLabel}
                                        </span>
                                      )}
                                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                                        {entry.promptType}
                                      </span>
                                    </div>
                                    <h4 className="text-base font-bold text-white mt-2">{entry.title}</h4>
                                  </div>

                                  <div className="flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => startEditingJournal(entry)}
                                      className="px-2.5 py-1 rounded-lg bg-[#0c0c12] hover:bg-slate-800 text-slate-300 text-xs border border-slate-800 flex items-center gap-1 transition"
                                    >
                                      <Edit3 className="w-3 h-3 text-indigo-400" /> Edit
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteJournal(entry.id)}
                                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>

                                <p className="text-xs text-slate-200 whitespace-pre-line leading-relaxed">
                                  {entry.content}
                                </p>

                                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/70 text-[11px] text-slate-400">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span>Mood: <strong className="text-white">{entry.mood}</strong></span>
                                    <span>•</span>
                                    <span>Energy: <strong className="text-emerald-400">{entry.energyLevel}/5</strong></span>
                                    {entry.linkedTaskTitle && (
                                      <>
                                        <span>•</span>
                                        <span className="text-indigo-300">{entry.linkedTaskTitle}</span>
                                      </>
                                    )}
                                  </div>
                                  <div className="flex flex-wrap gap-1.5">
                                    {(entry.tags || []).map((t, i) => (
                                      <span key={i} className="px-2 py-0.5 rounded-md bg-[#0c0c12] border border-slate-800 text-[10px] text-slate-300">
                                        #{t}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </>
                            ) : (
                              <div className="space-y-3">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-mono text-indigo-300">
                                    Original Date Stamp: {entry.journalDateLabel}
                                  </span>
                                  <span className="text-amber-400 font-semibold">Editing Entry</span>
                                </div>
                                <input
                                  type="text"
                                  value={editingDraft.title}
                                  onChange={(e) => setEditingDraft({ ...editingDraft, title: e.target.value })}
                                  className="w-full px-3 py-2 rounded-xl bg-[#0c0c12] border border-slate-800 text-xs text-white font-semibold"
                                />
                                <div className="grid grid-cols-2 gap-2">
                                  <select
                                    value={editingDraft.mood}
                                    onChange={(e) => setEditingDraft({ ...editingDraft, mood: e.target.value })}
                                    className="px-3 py-1.5 rounded-xl bg-[#0c0c12] border border-slate-800 text-xs text-white"
                                  >
                                    <option value="Energized">Energized 🔥</option>
                                    <option value="Focused">Focused 🎯</option>
                                    <option value="Calm">Calm 🌿</option>
                                    <option value="Tired">Tired 🌙</option>
                                    <option value="Stressed">Stressed ⚡</option>
                                  </select>
                                  <input
                                    type="text"
                                    value={editingDraft.tagsInput}
                                    onChange={(e) => setEditingDraft({ ...editingDraft, tagsInput: e.target.value })}
                                    placeholder="Tags (comma-separated)"
                                    className="px-3 py-1.5 rounded-xl bg-[#0c0c12] border border-slate-800 text-xs text-white"
                                  />
                                </div>
                                <textarea
                                  rows={4}
                                  value={editingDraft.content}
                                  onChange={(e) => setEditingDraft({ ...editingDraft, content: e.target.value })}
                                  className="w-full px-3 py-2 rounded-xl bg-[#0c0c12] border border-slate-800 text-xs text-white"
                                />
                                <div className="flex justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingJournalId(null);
                                      setEditingDraft(null);
                                    }}
                                    className="px-3 py-1.5 rounded-xl bg-slate-800 text-xs text-slate-300"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSaveEditedJournal(entry.id)}
                                    className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white flex items-center gap-1.5 transition"
                                  >
                                    <Check className="w-3.5 h-3.5" /> Save Changes
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================
                FLOATING BOTTOM PILL DOCK
            ======================================================== */}
            <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40">
              <div className="flex items-center gap-2 p-1.5 rounded-full bg-[#181822]/95 backdrop-blur-xl border border-slate-700/80 shadow-2xl">
                <button
                  onClick={() => setActiveView('heatmap')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold transition ${
                    activeView === 'heatmap'
                      ? 'bg-[#2a2a3a] text-white shadow-inner border border-slate-600/80'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="HabitKit Heatmap Grid View"
                >
                  <LayoutGrid className="w-4 h-4" />
                  <span className="hidden sm:inline">Heatmap Cards</span>
                </button>
                <button
                  onClick={() => setActiveView('timeline')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold transition ${
                    activeView === 'timeline'
                      ? 'bg-[#2a2a3a] text-white shadow-inner border border-slate-600/80'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Chronological Checklist View"
                >
                  <CheckSquare className="w-4 h-4" />
                  <span className="hidden sm:inline">Checklist</span>
                </button>
                <button
                  onClick={() => setActiveView('journals')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold transition ${
                    activeView === 'journals'
                      ? 'bg-[#2a2a3a] text-white shadow-inner border border-slate-600/80'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Everyday Journals & Reflections"
                >
                  <FileText className="w-4 h-4" />
                  <span className="hidden sm:inline">Journals ({journals.length})</span>
                </button>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* ========================================================
          "MORE ABOUT ME" GLOBAL MODAL
      ======================================================== */}
      {showMoreAboutMeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-xl w-full bg-[#14141c] border border-indigo-500/40 rounded-3xl p-6 space-y-4 shadow-2xl my-8">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-indigo-400" />
                More About Me — Personal Plan Variables
              </h3>
              <button onClick={() => setShowMoreAboutMeModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Update your personal variables anytime. Click <strong>Save & Re-Sync Worksheet</strong> to immediately adapt your schedule around these changes.
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Work Environment</label>
                <input
                  type="text"
                  value={moreAboutMe.workEnvironment}
                  onChange={(e) => setMoreAboutMe({ ...moreAboutMe, workEnvironment: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#0c0c12] border border-slate-800 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Energy Slump Window</label>
                <input
                  type="text"
                  value={moreAboutMe.energySlumpTime}
                  onChange={(e) => setMoreAboutMe({ ...moreAboutMe, energySlumpTime: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#0c0c12] border border-slate-800 text-xs text-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Personal Constraints & Preferences</label>
              <textarea
                rows={2}
                value={moreAboutMe.personalConstraints}
                onChange={(e) => setMoreAboutMe({ ...moreAboutMe, personalConstraints: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#0c0c12] border border-slate-800 text-xs text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-indigo-300">Custom Variables</label>
              <div className="flex flex-wrap gap-1.5">
                {(moreAboutMe.customVariables || []).map(cv => (
                  <span key={cv.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0c0c12] border border-slate-800 text-xs">
                    <strong className="text-indigo-300">{cv.label}:</strong> {cv.value}
                    <button onClick={() => handleRemoveCustomVariable(cv.id)} className="text-slate-500 hover:text-rose-400">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <form onSubmit={handleAddCustomVariable} className="grid grid-cols-12 gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Factor (e.g. Knee Recovery)"
                  value={newCustomVar.label}
                  onChange={(e) => setNewCustomVar({ ...newCustomVar, label: e.target.value })}
                  className="col-span-4 px-2.5 py-1.5 rounded-xl bg-[#0c0c12] border border-slate-800 text-xs text-white"
                />
                <input
                  type="text"
                  placeholder="Effect (e.g. Upper-body boxing only)"
                  value={newCustomVar.value}
                  onChange={(e) => setNewCustomVar({ ...newCustomVar, value: e.target.value })}
                  className="col-span-6 px-2.5 py-1.5 rounded-xl bg-[#0c0c12] border border-slate-800 text-xs text-white"
                />
                <button type="submit" className="col-span-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold">
                  Add
                </button>
              </form>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowMoreAboutMeModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-xs text-slate-300"
              >
                Done
              </button>
              {roadmap && (
                <button
                  type="button"
                  onClick={() => {
                    setShowMoreAboutMeModal(false);
                    generateDailyWorksheet();
                  }}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Save & Re-Sync Worksheet
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          ADD CUSTOM TASK / HABIT CARD MODAL
      ======================================================== */}
      {showAddCustomTaskModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleAddCustomTask} className="max-w-md w-full bg-[#14141c] border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-400" />
                Add Custom Habit / Daily Task Card
              </h3>
              <button type="button" onClick={() => setShowAddCustomTaskModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Habit or Task Name</label>
              <input
                type="text"
                value={newCustomTask.title}
                onChange={(e) => setNewCustomTask({ ...newCustomTask, title: e.target.value })}
                placeholder="e.g., Boxing / Daily Gym / Cold Plunge"
                className="w-full px-3 py-2 rounded-xl bg-[#0c0c12] border border-slate-800 text-sm text-white"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Start Time</label>
                <input
                  type="time"
                  value={newCustomTask.startTime}
                  onChange={(e) => setNewCustomTask({ ...newCustomTask, startTime: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#0c0c12] border border-slate-800 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">End Time</label>
                <input
                  type="time"
                  value={newCustomTask.endTime}
                  onChange={(e) => setNewCustomTask({ ...newCustomTask, endTime: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#0c0c12] border border-slate-800 text-xs text-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Category</label>
                <select
                  value={newCustomTask.category}
                  onChange={(e) => setNewCustomTask({ ...newCustomTask, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#0c0c12] border border-slate-800 text-xs text-white"
                >
                  <option value="Habit">Habit</option>
                  <option value="Deep Work">Deep Work</option>
                  <option value="Recovery">Recovery</option>
                  <option value="Bio/Meal">Bio/Meal</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Heatmap Color</label>
                <select
                  value={newCustomTask.palette}
                  onChange={(e) => setNewCustomTask({ ...newCustomTask, palette: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#0c0c12] border border-slate-800 text-xs text-white"
                >
                  <option value="rose">Coral Rose (Gym/Boxing)</option>
                  <option value="emerald">Emerald Mint</option>
                  <option value="indigo">Electric Indigo</option>
                  <option value="amber">Solar Amber</option>
                  <option value="purple">Neon Violet</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowAddCustomTaskModal(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-xs text-slate-300">
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white">
                Create Heatmap Card
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================
          LOADING OVERLAY
      ======================================================== */}
      {isLoading && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#14141c] border border-indigo-500/40 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center mx-auto animate-pulse">
              <Sparkles className="w-6 h-6 text-indigo-400" />
            </div>
            <h3 className="text-base font-bold text-white">Calibrating with Gemini...</h3>
            <p className="text-xs text-slate-300 leading-relaxed">{loadingMessage}</p>
          </div>
        </div>
      )}

      {/* ========================================================
          API KEY MODAL
      ======================================================== */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSaveApiKey} className="max-w-md w-full bg-[#14141c] border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-indigo-400" />
                Gemini API Key Settings
              </h3>
              <button type="button" onClick={() => setShowKeyModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Leave blank when running inside Gemini Canvas, or paste your Google AI Studio API key for standalone local use.
            </p>
            <input
              type="password"
              value={userApiKey}
              onChange={(e) => setUserApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full px-3.5 py-2 rounded-xl bg-[#0c0c12] border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowKeyModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-xs text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" /> Save Key
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================
          EMERGENCY RECALIBRATE MODAL
      ======================================================== */}
      {showRecalibrateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleEmergencyRecalibrate} className="max-w-md w-full bg-[#14141c] border border-rose-800/50 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-rose-400" />
                Emergency Day Recalibration
              </h3>
              <button type="button" onClick={() => setShowRecalibrateModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Describe what changed (e.g., “Unexpected 2-hour meeting from 14:00-16:00” or “Feeling low energy today”). Completed blocks stay intact.
            </p>
            <textarea
              rows={3}
              value={recalibratePrompt}
              onChange={(e) => setRecalibratePrompt(e.target.value)}
              placeholder="What disrupted your schedule?"
              className="w-full px-3.5 py-2 rounded-xl bg-[#0c0c12] border border-slate-800 text-sm text-white focus:outline-none focus:border-rose-500"
              required
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowRecalibrateModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-xs text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white"
              >
                Recalibrate Now
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}