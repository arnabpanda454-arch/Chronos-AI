import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar, Clock, Moon, Sun, Utensils, Target, Sparkles, Plus, Trash2,
  ArrowRight, ArrowLeft, RefreshCw, Play, Pause, RotateCcw, Flame,
  ShieldAlert, ListChecks, Send, Award, BookOpen, ChevronRight, Check,
  AlertCircle, Brain, Key, Save, Download, X, Activity, Dumbbell,
  UserCheck, BookMarked, Edit3, Settings, Smile, BatteryCharging,
  LayoutGrid, CheckSquare, FileText
} from 'lucide-react';

const defaultApiKey = "";
const STORAGE_KEY = "chronos_ai_state_v3";
const API_KEY_STORAGE = "chronos_gemini_api_key";

const DEFAULT_FIXED = [
  { id: 'f1', title: 'Core Work / University Classes', startTime: '09:00', endTime: '17:00', category: 'Work' },
  { id: 'f2', title: 'Daily Commute & Transit', startTime: '08:15', endTime: '09:00', category: 'Commute' },
  { id: 'f3', title: 'Evening Commute', startTime: '17:00', endTime: '17:45', category: 'Commute' }
];

const DEFAULT_BIO = {
  sleepStart: '23:00', wakeUp: '06:30', windDownMinutes: 45, chronotype: 'Morning Peak (Lark)',
  meals: [
    { id: 'm1', name: 'Breakfast & Hydration', time: '07:15', duration: 30 },
    { id: 'm2', name: 'Mid-Day Lunch', time: '13:00', duration: 45 },
    { id: 'm3', name: 'Healthy Dinner', time: '19:45', duration: 45 }
  ]
};

const DEFAULT_GOALS = {
  timeframe: '90 Days (Quarter Mastery)', intensity: 'Balanced High-Performance',
  goals: [
    { id: 'g1', title: 'Master Full-Stack AI Engineering', priority: 'High', dailyMinutes: 90, notes: 'Portfolio projects & algorithms' },
    { id: 'g2', title: 'Boxing & Athletic Conditioning', priority: 'High', dailyMinutes: 45, notes: 'Heavy bag drills + footwork' },
    { id: 'g3', title: 'Daily Gym & Mobility', priority: 'High', dailyMinutes: 45, notes: 'Compound lifts + 10k steps' },
    { id: 'g4', title: 'Read 15 Non-Fiction Books', priority: 'Medium', dailyMinutes: 30, notes: 'Evening wind-down reading' }
  ]
};

const DEFAULT_ABOUT_ME = {
  workEnvironment: 'Hybrid (Home & Office)',
  energySlumpTime: '14:30 - 16:00 Afternoon Dip',
  focusStyle: 'Pomodoro Sprint (25-45m bursts), no caffeine after 14:00',
  personalConstraints: 'Need 15m decompression after evening commute; prefer boxing/gym in late afternoon',
  stressTriggers: 'Back-to-back deep work without movement; late-night screen exposure',
  customVariables: [
    { id: 'cv1', label: 'Recovery Need', value: 'High after boxing/leg days' },
    { id: 'cv2', label: 'Learning Style', value: 'Hands-on building before theory' }
  ]
};

const PALETTES = {
  rose: { icon: 'bg-rose-500/15 text-rose-400 border-rose-500/30', check: 'bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-500/30', on: 'bg-rose-400 shadow-[0_0_5px_rgba(251,113,133,0.5)]', off: 'bg-rose-950/35 hover:bg-rose-900/50', text: 'text-rose-400' },
  emerald: { icon: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', check: 'bg-emerald-500 text-white border-emerald-400 shadow-lg shadow-emerald-500/30', on: 'bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.5)]', off: 'bg-emerald-950/35 hover:bg-emerald-900/50', text: 'text-emerald-400' },
  indigo: { icon: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30', check: 'bg-indigo-500 text-white border-indigo-400 shadow-lg shadow-indigo-500/30', on: 'bg-indigo-400 shadow-[0_0_5px_rgba(129,140,248,0.5)]', off: 'bg-indigo-950/40 hover:bg-indigo-900/50', text: 'text-indigo-400' },
  amber: { icon: 'bg-amber-500/15 text-amber-400 border-amber-500/30', check: 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/30', on: 'bg-amber-400 shadow-[0_0_5px_rgba(251,191,36,0.5)]', off: 'bg-amber-950/35 hover:bg-amber-900/50', text: 'text-amber-400' },
  purple: { icon: 'bg-purple-500/15 text-purple-400 border-purple-500/30', check: 'bg-purple-500 text-white border-purple-400 shadow-lg shadow-purple-500/30', on: 'bg-purple-400 shadow-[0_0_5px_rgba(192,132,252,0.5)]', off: 'bg-purple-950/35 hover:bg-purple-900/50', text: 'text-purple-400' }
};

const getISODate = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const formatStamp = (d = new Date()) => (typeof d === 'string' ? new Date(d) : d).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
const toMins = (t) => { if (!t || !t.includes(':')) return 0; const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const fmtDur = (m) => m <= 0 ? '0m' : (Math.floor(m / 60) > 0 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`);

function buildHeatmapGrid(weeks = 22) {
  const today = new Date(), todayISO = getISODate(today);
  const end = new Date(today); end.setDate(today.getDate() + (6 - today.getDay()));
  const cursor = new Date(end); cursor.setDate(end.getDate() - weeks * 7 + 1);
  return Array.from({ length: weeks }, () => Array.from({ length: 7 }, () => {
    const iso = getISODate(cursor), label = cursor.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const cell = { iso, label, isToday: iso === todayISO, isFuture: cursor > today && iso !== todayISO };
    cursor.setDate(cursor.getDate() + 1);
    return cell;
  }));
}

function seedHistory(idStr) {
  let h = 0; for (let i = 0; i < idStr.length; i++) h = (h * 31 + idStr.charCodeAt(i)) % 10000;
  const map = {}, today = new Date();
  for (let i = 1; i <= 42; i++) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    if (((h + i * 17) % 10) >= (i <= 25 ? 3 : 6)) map[getISODate(d)] = true;
  }
  return map;
}

function calcStreak(map = {}) {
  const c = new Date();
  if (!map[getISODate(c)]) c.setDate(c.getDate() - 1);
  let s = 0; while (map[getISODate(c)]) { s++; c.setDate(c.getDate() - 1); }
  return s;
}

async function callGeminiAPI(prompt, sys, schema = null, customKey = "") {
  const envKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) || "";
  const key = customKey?.trim() || envKey || defaultApiKey;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${key}`;
  const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }], systemInstruction: { parts: [{ text: sys }] } };
  if (schema) payload.generationConfig = { responseMimeType: "application/json", responseSchema: schema };

  const delays = [1000, 2000, 4000];
  for (let i = 0; i <= delays.length; i++) {
    try {
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) {
        const err = new Error(`API status ${res.status}`);
        if (res.status >= 400 && res.status < 500 && res.status !== 429) err.noRetry = true;
        throw err;
      }
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("Empty response");
      return schema ? JSON.parse(text.replace(/^```json\s*/i, '').replace(/```$/i, '').trim()) : text;
    } catch (e) {
      if (e.noRetry || i === delays.length) throw e;
      await new Promise(r => setTimeout(r, delays[i]));
    }
  }
}

const ROADMAP_SCHEMA = {
  type: "OBJECT",
  properties: {
    researchSummary: { type: "STRING" }, chronotypeAdvice: { type: "STRING" },
    scientificFramework: { type: "STRING" }, personalVariableAdaptations: { type: "STRING" },
    phases: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: { phaseName: { type: "STRING" }, duration: { type: "STRING" }, focus: { type: "STRING" }, keyHabits: { type: "ARRAY", items: { type: "STRING" } }, expectedOutcome: { type: "STRING" } },
        required: ["phaseName", "duration", "focus", "keyHabits", "expectedOutcome"]
      }
    },
    efficiencyHacks: { type: "ARRAY", items: { type: "STRING" } }
  },
  required: ["researchSummary", "chronotypeAdvice", "scientificFramework", "personalVariableAdaptations", "phases", "efficiencyHacks"]
};

const WORKSHEET_SCHEMA = {
  type: "OBJECT",
  properties: {
    dailyMantra: { type: "STRING" }, estimatedEfficiencyScore: { type: "INTEGER" },
    schedule: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          id: { type: "STRING" }, startTime: { type: "STRING" }, endTime: { type: "STRING" }, title: { type: "STRING" },
          category: { type: "STRING", enum: ["Fixed", "Bio/Meal", "Deep Work", "Habit", "Recovery"] },
          priority: { type: "STRING", enum: ["Critical", "High", "Medium", "Low"] },
          energyRequired: { type: "STRING", enum: ["High", "Medium", "Low"] },
          actionableMicroSteps: { type: "ARRAY", items: { type: "STRING" } }, aiTip: { type: "STRING" }
        },
        required: ["id", "startTime", "endTime", "title", "category", "priority", "energyRequired", "actionableMicroSteps", "aiTip"]
      }
    },
    coreHabits: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: { id: { type: "STRING" }, name: { type: "STRING" }, triggerCue: { type: "STRING" }, durationMinutes: { type: "INTEGER" }, category: { type: "STRING" } },
        required: ["id", "name", "triggerCue", "durationMinutes", "category"]
      }
    }
  },
  required: ["dailyMantra", "estimatedEfficiencyScore", "schedule", "coreHabits"]
};

const JOURNAL_SCHEMA = {
  type: "OBJECT",
  properties: { patternDetected: { type: "STRING" }, praiseAndMomentum: { type: "STRING" }, scheduleAdjustmentTip: { type: "STRING" }, nextJournalPrompt: { type: "STRING" } },
  required: ["patternDetected", "praiseAndMomentum", "scheduleAdjustmentTip", "nextJournalPrompt"]
};

export default function App() {
  const todayISO = useMemo(() => getISODate(new Date()), []);
  const gridCols = useMemo(() => buildHeatmapGrid(22), []);
  const saved = useMemo(() => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"); } catch { return null; } }, []);

  const [step, setStep] = useState(saved?.step || 1);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [error, setError] = useState(null);
  const [apiKey, setApiKey] = useState(() => { try { return localStorage.getItem(API_KEY_STORAGE) || ''; } catch { return ''; } });
  const [modal, setModal] = useState(null); // 'key' | 'about' | 'recal' | 'addTask'

  const [fixed, setFixed] = useState(saved?.fixed || DEFAULT_FIXED);
  const [newFixed, setNewFixed] = useState({ title: '', startTime: '10:00', endTime: '11:00', category: 'Work' });
  const [bio, setBio] = useState(saved?.bio || DEFAULT_BIO);
  const [newMeal, setNewMeal] = useState({ name: '', time: '16:00', duration: 20 });
  const [goalsData, setGoalsData] = useState(saved?.goalsData || DEFAULT_GOALS);
  const [newGoal, setNewGoal] = useState({ title: '', priority: 'High', dailyMinutes: 60, notes: '' });
  const [aboutMe, setAboutMe] = useState(saved?.aboutMe || DEFAULT_ABOUT_ME);
  const [newVar, setNewVar] = useState({ label: '', value: '' });

  const [roadmap, setRoadmap] = useState(saved?.roadmap || null);
  const [refineText, setRefineText] = useState("");
  const [worksheet, setWorksheet] = useState(saved?.worksheet || null);
  const [history, setHistory] = useState(saved?.history || {});
  const [catFilter, setCatFilter] = useState('All');
  const [view, setView] = useState('heatmap'); // 'heatmap' | 'timeline' | 'journals'
  const [expanded, setExpanded] = useState({});
  const [recalText, setRecalText] = useState("");
  const [customTask, setCustomTask] = useState({ title: '', category: 'Habit', startTime: '18:00', endTime: '18:45', cue: 'After work', palette: 'rose' });

  const [journals, setJournals] = useState(() => saved?.journals || [{
    id: 'j1', title: 'Morning Calibration & Energy Check', promptType: 'Morning Intention',
    content: 'Slept 7.5 hours. Feeling sharp for morning deep work and evening boxing + gym session.',
    mood: 'Energized', energyLevel: 4, tags: ['Focus', 'Boxing', 'Gym'],
    journalDateLabel: formatStamp(new Date()), lastEditedLabel: null, linkedTaskTitle: 'General Daily Log'
  }]);
  const [jForm, setJForm] = useState({ title: '', promptType: 'Daily Reflection', content: '', mood: 'Focused', energyLevel: 4, tagsInput: 'DeepWork, Progress', linkedTaskTitle: 'General Daily Log' });
  const [editJId, setEditJId] = useState(null);
  const [editJDraft, setEditJDraft] = useState(null);
  const [jInsight, setJInsight] = useState(saved?.jInsight || null);
  const [blockNotes, setBlockNotes] = useState(saved?.blockNotes || {});
  const [noteInput, setNoteInput] = useState({});

  const [timerSec, setTimerSec] = useState(1500);
  const [timerOn, setTimerOn] = useState(false);
  const [timerTask, setTimerTask] = useState("Select any card to start a focus sprint");
  const [timerMode, setTimerMode] = useState('focus');

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ step, fixed, bio, goalsData, aboutMe, roadmap, worksheet, history, journals, blockNotes, jInsight })); } catch {}
  }, [step, fixed, bio, goalsData, aboutMe, roadmap, worksheet, history, journals, blockNotes, jInsight]);

  useEffect(() => {
    if (!timerOn) return;
    const id = setInterval(() => setTimerSec(s => { if (s <= 1) { setTimerOn(false); return 0; } return s - 1; }), 1000);
    return () => clearInterval(id);
  }, [timerOn]);

  const stats = useMemo(() => {
    const wake = toMins(bio.wakeUp); let sleep = toMins(bio.sleepStart); if (sleep <= wake) sleep += 1440;
    const fixedMins = fixed.reduce((a, b) => a + Math.max(0, toMins(b.endTime) - toMins(b.startTime)), 0);
    const mealMins = bio.meals.reduce((a, m) => a + (Number(m.duration) || 0), 0);
    const free = Math.max(0, (sleep - wake) - fixedMins - mealMins - (Number(bio.windDownMinutes) || 0));
    const req = goalsData.goals.reduce((a, g) => a + (Number(g.dailyMinutes) || 0), 0);
    const sorted = [...fixed].sort((a, b) => toMins(a.startTime) - toMins(b.startTime));
    const overlaps = [];
    for (let i = 0; i < sorted.length - 1; i++) if (toMins(sorted[i].endTime) > toMins(sorted[i + 1].startTime)) overlaps.push(`${sorted[i].title} & ${sorted[i + 1].title}`);
    return { fixedMins, free, req, overlaps };
  }, [fixed, bio, goalsData]);

  const genRoadmap = async () => {
    setLoading(true); setError(null); setLoadingMsg("Calibrating roadmap around your schedule, goals & More About Me variables...");
    try {
      const res = await callGeminiAPI(
        `Fixed:${JSON.stringify(fixed)} Bio:${JSON.stringify(bio)} Goals:${JSON.stringify(goalsData)} MoreAboutMe:${JSON.stringify(aboutMe)}`,
        "You are an elite Chronobiologist & AI Productivity Architect. Build a phased roadmap honoring all constraints and More About Me variables.",
        ROADMAP_SCHEMA, apiKey
      );
      setRoadmap(res); setStep(4);
    } catch (e) { setError(`Roadmap error (${e.message}). Tap the Key icon in the top bar to set your Gemini API key.`); }
    finally { setLoading(false); }
  };

  const refineRoadmap = async (e) => {
    e.preventDefault(); if (!refineText.trim()) return;
    setLoading(true); setError(null); setLoadingMsg("Updating roadmap with your feedback...");
    try {
      const res = await callGeminiAPI(`Current:${JSON.stringify(roadmap)} MoreAboutMe:${JSON.stringify(aboutMe)} Feedback:${refineText}`, "Update the roadmap JSON.", ROADMAP_SCHEMA, apiKey);
      setRoadmap(res); setRefineText("");
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  };

  const genWorksheet = async () => {
    setLoading(true); setError(null); setLoadingMsg("Building your HabitKit-style Daily Tracker & Time-Blocked Schedule...");
    try {
      const res = await callGeminiAPI(
        `Roadmap:${JSON.stringify(roadmap)} Fixed:${JSON.stringify(fixed)} Bio:${JSON.stringify(bio)} Goals:${JSON.stringify(goalsData.goals)} MoreAboutMe:${JSON.stringify(aboutMe)}`,
        `Build a chronological daily worksheet (${bio.wakeUp} to ${bio.sleepStart}). Keep Fixed blocks exact, include Bio/Meal blocks, and honor all More About Me variables.`,
        WORKSHEET_SCHEMA, apiKey
      );
      setWorksheet(res);
      setHistory(prev => {
        const next = { ...prev };
        (res.coreHabits || []).forEach(h => { if (!next[h.id]) next[h.id] = seedHistory(h.id + h.name); });
        (res.schedule || []).forEach(b => { if (!next[b.id]) next[b.id] = seedHistory(b.id + b.title); });
        return next;
      });
      setStep(5);
    } catch (e) { setError(`Worksheet error (${e.message}). Check your API key.`); }
    finally { setLoading(false); }
  };

  const recalibrateDay = async (e) => {
    e.preventDefault(); if (!recalText.trim()) return;
    setLoading(true); setModal(null); setLoadingMsg("Recalibrating remaining day...");
    try {
      const res = await callGeminiAPI(`Worksheet:${JSON.stringify(worksheet)} MoreAboutMe:${JSON.stringify(aboutMe)} Disruption:${recalText}`, "Recalibrate the daily schedule keeping Fixed blocks intact.", WORKSHEET_SCHEMA, apiKey);
      setWorksheet(res); setRecalText("");
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  };

  const toggleCell = (id, iso = todayISO) => setHistory(p => ({ ...p, [id]: { ...(p[id] || {}), [iso]: !p[id]?.[iso] } }));

  const addJournal = (e) => {
    e.preventDefault(); if (!jForm.content.trim()) return;
    const now = new Date(), stamp = formatStamp(now);
    const entry = {
      id: `j_${Date.now()}`, title: jForm.title.trim() || `${jForm.promptType} — ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
      promptType: jForm.promptType, content: jForm.content.trim(), mood: jForm.mood, energyLevel: Number(jForm.energyLevel) || 4,
      tags: jForm.tagsInput.split(',').map(t => t.trim()).filter(Boolean), linkedTaskTitle: jForm.linkedTaskTitle,
      journalDateLabel: stamp, lastEditedLabel: null
    };
    setJournals([entry, ...journals]); setJForm({ ...jForm, title: '', content: '' });
  };

  const saveEditJournal = (id) => {
    if (!editJDraft?.content?.trim()) return;
    setJournals(journals.map(j => j.id === id ? {
      ...j, title: editJDraft.title.trim() || j.title, content: editJDraft.content.trim(),
      mood: editJDraft.mood, tags: (editJDraft.tagsInput || '').split(',').map(t => t.trim()).filter(Boolean),
      lastEditedLabel: formatStamp(new Date())
    } : j));
    setEditJId(null); setEditJDraft(null);
  };

  const addBlockNote = (bId, bTitle) => {
    const txt = (noteInput[bId] || '').trim(); if (!txt) return;
    const stamp = formatStamp(new Date());
    setBlockNotes(p => ({ ...p, [bId]: [{ id: `bn_${Date.now()}`, text: txt, stamp }, ...(p[bId] || [])] }));
    setJournals(p => [{ id: `jb_${Date.now()}`, title: `Task Note: ${bTitle}`, promptType: 'Task Micro-Journal', content: txt, mood: 'Focused', energyLevel: 4, tags: ['TaskNote'], linkedTaskTitle: bTitle, journalDateLabel: stamp, lastEditedLabel: null }, ...p]);
    setNoteInput(p => ({ ...p, [bId]: '' }));
  };

  const analyzeJournals = async () => {
    setLoading(true); setLoadingMsg("Analyzing your timestamped journals & habit streaks...");
    try {
      const res = await callGeminiAPI(`AboutMe:${JSON.stringify(aboutMe)} Journals:${JSON.stringify(journals.slice(0, 8))}`, "Analyze the user's journals and habit momentum.", JOURNAL_SCHEMA, apiKey);
      setJInsight(res);
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  };

  const getPal = (item, i = 0) => {
    if (item.customPalette && PALETTES[item.customPalette]) return PALETTES[item.customPalette];
    const t = `${item.title || item.name || ''} ${item.category || ''}`.toLowerCase();
    if (t.includes('box') || t.includes('gym') || t.includes('fit')) return PALETTES.rose;
    if (t.includes('meal') || t.includes('bio') || t.includes('lunch') || t.includes('dinner')) return PALETTES.emerald;
    if (t.includes('deep') || t.includes('ai') || t.includes('work')) return PALETTES.indigo;
    if (t.includes('read') || t.includes('recover') || t.includes('sleep')) return PALETTES.purple;
    return PALETTES[Object.keys(PALETTES)[i % 5]];
  };

  const getIcon = (item) => {
    const t = `${item.title || item.name || ''} ${item.category || ''}`.toLowerCase();
    if (t.includes('box') || t.includes('athletic')) return Activity;
    if (t.includes('gym') || t.includes('fit')) return Dumbbell;
    if (t.includes('meal') || t.includes('lunch') || t.includes('dinner')) return Utensils;
    if (t.includes('read') || t.includes('book')) return BookOpen;
    if (t.includes('deep') || t.includes('ai')) return Brain;
    return Flame;
  };

  const filteredSched = useMemo(() => {
    const list = worksheet?.schedule || [];
    if (catFilter === 'All') return list;
    if (catFilter === 'Gym') return list.filter(b => /gym|box|fit|habit|recover/i.test(`${b.title} ${b.category}`));
    return list.filter(b => b.category === catFilter);
  }, [worksheet, catFilter]);

  const totalBlocks = worksheet?.schedule?.length || 0;
  const doneToday = (worksheet?.schedule || []).filter(b => history[b.id]?.[todayISO]).length;
  const pct = totalBlocks > 0 ? Math.round((doneToday / totalBlocks) * 100) : 0;

  const renderHeatmap = (id, pal) => {
    const map = history[id] || {};
    return (
      <div className="overflow-x-auto pb-1">
        <div className="inline-flex gap-[5px]">
          {gridCols.map((col, ci) => (
            <div key={ci} className="flex flex-col gap-[5px]">
              {col.map(c => (
                <button
                  key={c.iso} type="button" disabled={c.isFuture} onClick={() => toggleCell(id, c.iso)}
                  title={`${c.label}: ${map[c.iso] ? 'Completed' : 'Not completed'}`}
                  className={`w-[11px] h-[11px] rounded-[3px] transition ${c.isFuture ? 'bg-slate-900/30 opacity-25' : map[c.iso] ? pal.on : pal.off} ${c.isToday ? 'ring-1 ring-white/70' : ''}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#09090d] text-slate-100 pb-28 font-sans">
      <header className="sticky top-0 z-40 bg-[#09090d]/90 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button onClick={() => setModal('about')} className="w-10 h-10 rounded-full bg-[#16161f] border border-slate-800 flex items-center justify-center text-slate-300 hover:text-white" title="More About Me">
              <Settings className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base font-bold text-white flex items-center gap-2">
                Chronos AI <span className="text-[10px] px-2 py-0.5 rounded bg-[#16161f] border border-slate-700">PRO</span>
              </h1>
              <p className="text-[11px] text-slate-400">HabitKit Heatmap • More About Me • Daily Journals</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setModal('about')} className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-[#16161f] text-indigo-300 border border-indigo-500/30">
              <UserCheck className="w-3.5 h-3.5" /> More About Me
            </button>
            <button onClick={() => setModal('key')} className="w-9 h-9 rounded-full bg-[#16161f] border border-slate-800 flex items-center justify-center text-slate-300" title="API Key">
              <Key className="w-4 h-4" />
            </button>
            {step === 5 && worksheet && (
              <button onClick={() => setModal('addTask')} className="w-10 h-10 rounded-full bg-indigo-500 hover:bg-indigo-400 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30" title="Add Habit Card">
                <Plus className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 pb-2.5 flex items-center justify-between gap-2 overflow-x-auto">
          {['1. Fixed Locks', '2. Bio-Rhythm', '3. Goals & About Me', '4. AI Roadmap', '5. Daily Tracker'].map((lbl, i) => {
            const n = i + 1, unlocked = n <= 3 || (n === 4 && roadmap) || (n === 5 && worksheet);
            return (
              <button key={n} disabled={!unlocked} onClick={() => unlocked && setStep(n)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition ${step === n ? 'bg-indigo-600 text-white' : unlocked ? 'bg-[#14141c] text-slate-300 border border-slate-800' : 'bg-[#111116] text-slate-600'}`}>
                {lbl}
              </button>
            );
          })}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 pt-6 space-y-6">
        {error && (
          <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
          </div>
        )}

        {step === 1 && (
          <section className="space-y-5">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Step 1: Unalterable Fixed Commitments ({fmtDur(stats.fixedMins)})</h2>
              <button onClick={() => setStep(2)} className="px-5 py-2 rounded-xl bg-indigo-600 text-xs font-semibold flex items-center gap-1.5">Next <ArrowRight className="w-4 h-4" /></button>
            </div>
            <div className="grid md:grid-cols-5 gap-5">
              <form onSubmit={e => { e.preventDefault(); if (!newFixed.title.trim()) return; setFixed([...fixed, { ...newFixed, id: `f_${Date.now()}` }]); setNewFixed({ ...newFixed, title: '' }); }} className="md:col-span-2 bg-[#14141c] border border-slate-800 rounded-3xl p-5 space-y-3">
                <h3 className="text-sm font-bold">Add Fixed Block</h3>
                <input required value={newFixed.title} onChange={e => setNewFixed({ ...newFixed, title: e.target.value })} placeholder="Work / Lecture / Commute" className="w-full px-3 py-2 rounded-xl bg-[#0c0c12] border border-slate-800 text-xs" />
                <div className="grid grid-cols-2 gap-2">
                  <input type="time" value={newFixed.startTime} onChange={e => setNewFixed({ ...newFixed, startTime: e.target.value })} className="px-3 py-2 rounded-xl bg-[#0c0c12] border border-slate-800 text-xs" />
                  <input type="time" value={newFixed.endTime} onChange={e => setNewFixed({ ...newFixed, endTime: e.target.value })} className="px-3 py-2 rounded-xl bg-[#0c0c12] border border-slate-800 text-xs" />
                </div>
                <button type="submit" className="w-full py-2.5 rounded-xl bg-indigo-600 text-xs font-semibold">Lock Commitment</button>
              </form>
              <div className="md:col-span-3 space-y-2.5">
                {fixed.map(f => (
                  <div key={f.id} className="p-4 rounded-2xl bg-[#14141c] border border-slate-800 flex justify-between items-center">
                    <div>
                      <span className="text-xs font-mono text-indigo-300 mr-3">{f.startTime} – {f.endTime}</span>
                      <strong className="text-sm">{f.title}</strong>
                    </div>
                    <button onClick={() => setFixed(fixed.filter(x => x.id !== f.id))} className="text-slate-500 hover:text-rose-400"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="space-y-5">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Step 2: Sleep, Chronotype & Nutrition</h2>
              <div className="flex gap-2">
                <button onClick={() => setStep(1)} className="px-4 py-2 rounded-xl bg-[#14141c] border border-slate-800 text-xs">Back</button>
                <button onClick={() => setStep(3)} className="px-5 py-2 rounded-xl bg-indigo-600 text-xs font-semibold flex items-center gap-1.5">Next <ArrowRight className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-5">
              <div className="bg-[#14141c] border border-slate-800 rounded-3xl p-5 space-y-3">
                <h3 className="text-sm font-bold">Sleep & Chronotype</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs text-slate-400">Wake Up</label><input type="time" value={bio.wakeUp} onChange={e => setBio({ ...bio, wakeUp: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-xl bg-[#0c0c12] border border-slate-800 text-xs" /></div>
                  <div><label className="text-xs text-slate-400">Sleep Target</label><input type="time" value={bio.sleepStart} onChange={e => setBio({ ...bio, sleepStart: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-xl bg-[#0c0c12] border border-slate-800 text-xs" /></div>
                </div>
                <select value={bio.chronotype} onChange={e => setBio({ ...bio, chronotype: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-[#0c0c12] border border-slate-800 text-xs">
                  <option>Morning Peak (Lark)</option><option>Balanced Mid-Day (Hummingbird)</option><option>Night Owl (Wolf)</option>
                </select>
              </div>
              <div className="bg-[#14141c] border border-slate-800 rounded-3xl p-5 space-y-2.5">
                <h3 className="text-sm font-bold">Meals & Fuel</h3>
                {bio.meals.map(m => (
                  <div key={m.id} className="flex items-center justify-between gap-2 bg-[#0c0c12] p-2.5 rounded-xl border border-slate-800 text-xs">
                    <span>{m.name}</span><span className="font-mono text-emerald-400">{m.time} ({m.duration}m)</span>
                    <button onClick={() => setBio({ ...bio, meals: bio.meals.filter(x => x.id !== m.id) })} className="text-slate-500 hover:text-rose-400"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
                <form onSubmit={e => { e.preventDefault(); if (!newMeal.name.trim()) return; setBio({ ...bio, meals: [...bio.meals, { ...newMeal, id: `m_${Date.now()}` }] }); setNewMeal({ ...newMeal, name: '' }); }} className="flex gap-2 pt-1">
                  <input placeholder="Add meal/snack..." value={newMeal.name} onChange={e => setNewMeal({ ...newMeal, name: e.target.value })} className="flex-1 px-3 py-1.5 rounded-xl bg-[#0c0c12] border border-slate-800 text-xs" />
                  <input type="time" value={newMeal.time} onChange={e => setNewMeal({ ...newMeal, time: e.target.value })} className="px-2 py-1.5 rounded-xl bg-[#0c0c12] border border-slate-800 text-xs" />
                  <button type="submit" className="px-3 py-1.5 rounded-xl bg-emerald-600 text-xs font-semibold">Add</button>
                </form>
              </div>
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-3">
              <div>
                <h2 className="text-xl font-bold">Step 3: Goals & “More About Me” Variables</h2>
                <p className="text-xs text-slate-400">Free pocket: {fmtDur(stats.free)} • Requested: {fmtDur(stats.req)}</p>
              </div>
              <button onClick={genRoadmap} className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-xs font-bold flex items-center gap-2 shadow-lg">
                <Sparkles className="w-4 h-4" /> Architect AI Roadmap
              </button>
            </div>

            <div className="grid md:grid-cols-5 gap-5">
              <form onSubmit={e => { e.preventDefault(); if (!newGoal.title.trim()) return; setGoalsData({ ...goalsData, goals: [...goalsData.goals, { ...newGoal, id: `g_${Date.now()}` }] }); setNewGoal({ ...newGoal, title: '', notes: '' }); }} className="md:col-span-2 bg-[#14141c] border border-slate-800 rounded-3xl p-5 space-y-3">
                <h3 className="text-sm font-bold">Add Goal / Habit</h3>
                <input required placeholder="e.g., Boxing / Daily Gym" value={newGoal.title} onChange={e => setNewGoal({ ...newGoal, title: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-[#0c0c12] border border-slate-800 text-xs" />
                <div className="grid grid-cols-2 gap-2">
                  <select value={newGoal.priority} onChange={e => setNewGoal({ ...newGoal, priority: e.target.value })} className="px-3 py-2 rounded-xl bg-[#0c0c12] border border-slate-800 text-xs"><option>High</option><option>Medium</option><option>Low</option></select>
                  <input type="number" value={newGoal.dailyMinutes} onChange={e => setNewGoal({ ...newGoal, dailyMinutes: Number(e.target.value) })} className="px-3 py-2 rounded-xl bg-[#0c0c12] border border-slate-800 text-xs" />
                </div>
                <input placeholder="Notes / preferred cue..." value={newGoal.notes} onChange={e => setNewGoal({ ...newGoal, notes: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-[#0c0c12] border border-slate-800 text-xs" />
                <button type="submit" className="w-full py-2 rounded-xl bg-rose-600 text-xs font-semibold">Add Goal</button>
              </form>
              <div className="md:col-span-3 space-y-2.5">
                {goalsData.goals.map(g => (
                  <div key={g.id} className="p-4 rounded-2xl bg-[#14141c] border border-slate-800 flex justify-between items-center">
                    <div>
                      <div className="text-sm font-bold">{g.title} <span className="text-xs font-mono text-indigo-300 ml-2">{g.dailyMinutes}m/day</span></div>
                      <div className="text-xs text-slate-400">{g.notes}</div>
                    </div>
                    <button onClick={() => setGoalsData({ ...goalsData, goals: goalsData.goals.filter(x => x.id !== g.id) })} className="text-slate-500 hover:text-rose-400"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            </div>

            {/* MORE ABOUT ME SECTION */}
            <div className="bg-[#14141c] border border-indigo-500/30 rounded-3xl p-5 space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-indigo-300">
                <UserCheck className="w-4 h-4" /> More About Me — Personal Variables That Alter Your Plan
              </div>
              <div className="grid md:grid-cols-3 gap-3">
                <input value={aboutMe.workEnvironment} onChange={e => setAboutMe({ ...aboutMe, workEnvironment: e.target.value })} placeholder="Work Environment" className="px-3 py-2 rounded-xl bg-[#0c0c12] border border-slate-800 text-xs" />
                <input value={aboutMe.energySlumpTime} onChange={e => setAboutMe({ ...aboutMe, energySlumpTime: e.target.value })} placeholder="Energy Dip Window" className="px-3 py-2 rounded-xl bg-[#0c0c12] border border-slate-800 text-xs" />
                <input value={aboutMe.focusStyle} onChange={e => setAboutMe({ ...aboutMe, focusStyle: e.target.value })} placeholder="Focus Style & Caffeine Cutoff" className="px-3 py-2 rounded-xl bg-[#0c0c12] border border-slate-800 text-xs" />
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <input value={aboutMe.personalConstraints} onChange={e => setAboutMe({ ...aboutMe, personalConstraints: e.target.value })} placeholder="Personal Constraints & Buffers" className="px-3 py-2 rounded-xl bg-[#0c0c12] border border-slate-800 text-xs" />
                <input value={aboutMe.stressTriggers} onChange={e => setAboutMe({ ...aboutMe, stressTriggers: e.target.value })} placeholder="Friction / Stress Triggers" className="px-3 py-2 rounded-xl bg-[#0c0c12] border border-slate-800 text-xs" />
              </div>
              <div className="flex flex-wrap gap-2">
                {(aboutMe.customVariables || []).map(cv => (
                  <span key={cv.id} className="px-3 py-1 rounded-xl bg-[#0c0c12] border border-indigo-500/30 text-xs flex items-center gap-1.5">
                    <strong className="text-indigo-300">{cv.label}:</strong> {cv.value}
                    <button onClick={() => setAboutMe({ ...aboutMe, customVariables: aboutMe.customVariables.filter(x => x.id !== cv.id) })}><X className="w-3 h-3 text-slate-500" /></button>
                  </span>
                ))}
              </div>
              <form onSubmit={e => { e.preventDefault(); if (!newVar.label.trim() || !newVar.value.trim()) return; setAboutMe({ ...aboutMe, customVariables: [...(aboutMe.customVariables || []), { id: `cv_${Date.now()}`, ...newVar }] }); setNewVar({ label: '', value: '' }); }} className="flex flex-wrap gap-2">
                <input placeholder="Variable name (e.g. Fasting, Weather)" value={newVar.label} onChange={e => setNewVar({ ...newVar, label: e.target.value })} className="px-3 py-1.5 rounded-xl bg-[#0c0c12] border border-slate-800 text-xs" />
                <input placeholder="How it alters the plan..." value={newVar.value} onChange={e => setNewVar({ ...newVar, value: e.target.value })} className="flex-1 px-3 py-1.5 rounded-xl bg-[#0c0c12] border border-slate-800 text-xs" />
                <button type="submit" className="px-4 py-1.5 rounded-xl bg-indigo-600 text-xs font-semibold">+ Add Variable</button>
              </form>
            </div>
          </section>
        )}

        {step === 4 && roadmap && (
          <section className="space-y-5">
            <div className="flex flex-wrap justify-between items-center gap-3">
              <h2 className="text-xl font-bold">Step 4: Calibrated AI Roadmap</h2>
              <button onClick={genWorksheet} className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold flex items-center gap-2">
                Launch Daily Habit Tracker <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="p-4 rounded-2xl bg-[#14141c] border border-slate-800"><strong className="text-indigo-400 block mb-1">Research</strong>{roadmap.researchSummary}</div>
              <div className="p-4 rounded-2xl bg-[#14141c] border border-slate-800"><strong className="text-amber-400 block mb-1">Chronotype</strong>{roadmap.chronotypeAdvice}</div>
              <div className="p-4 rounded-2xl bg-[#14141c] border border-slate-800"><strong className="text-purple-400 block mb-1">Framework</strong>{roadmap.scientificFramework}</div>
              <div className="p-4 rounded-2xl bg-[#14141c] border border-emerald-800/50"><strong className="text-emerald-400 block mb-1">More About Me Fit</strong>{roadmap.personalVariableAdaptations}</div>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {roadmap.phases?.map((p, i) => (
                <div key={i} className="p-5 rounded-3xl bg-[#14141c] border border-slate-800 space-y-2 text-xs">
                  <div className="text-indigo-400 font-bold">{p.phaseName} ({p.duration})</div>
                  <p className="text-slate-400">{p.focus}</p>
                  <ul className="space-y-1">{p.keyHabits?.map((h, j) => <li key={j}>• {h}</li>)}</ul>
                </div>
              ))}
            </div>
            <form onSubmit={refineRoadmap} className="flex gap-2">
              <input value={refineText} onChange={e => setRefineText(e.target.value)} placeholder="Ask Gemini to adjust anything in this roadmap..." className="flex-1 px-4 py-2.5 rounded-xl bg-[#14141c] border border-slate-800 text-xs" />
              <button type="submit" className="px-5 py-2.5 rounded-xl bg-indigo-600 text-xs font-semibold">Refine</button>
            </form>
          </section>
        )}

        {/* STEP 5: HABITKIT HEATMAP INTERFACE + EVERYDAY JOURNALS */}
        {step === 5 && worksheet && (
          <section className="space-y-6">
            {/* Category Filter Pills (Like Screenshot) */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 overflow-x-auto">
                <button onClick={() => setCatFilter('All')} className={`w-9 h-9 rounded-full flex items-center justify-center border ${catFilter === 'All' ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-[#16161f] text-slate-400 border-slate-800'}`}>
                  <ListChecks className="w-4 h-4" />
                </button>
                <span className="text-slate-700">•</span>
                {['Gym', 'Deep Work', 'Habit', 'Bio/Meal', 'Fixed'].map(c => (
                  <button key={c} onClick={() => setCatFilter(c)} className={`px-4 py-1.5 rounded-full text-xs font-semibold border ${catFilter === c ? 'bg-[#222230] text-white border-slate-600' : 'bg-[#14141c] text-slate-400 border-slate-800'}`}>
                    {c === 'Gym' ? 'Gym & Boxing' : c}
                  </button>
                ))}
              </div>
              <button onClick={() => setModal('recal')} className="px-3.5 py-1.5 rounded-full bg-rose-950/60 border border-rose-800 text-rose-200 text-xs font-semibold flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5" /> Recalibrate Day
              </button>
            </div>

            {/* Progress & Focus Timer Strip */}
            <div className="grid md:grid-cols-12 gap-4">
              <div className="md:col-span-5 p-4 rounded-3xl bg-[#14141c] border border-slate-800 space-y-2">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Today ({todayISO})</span>
                  <span className="text-emerald-400 font-bold">{doneToday}/{totalBlocks} Completed ({pct}%)</span>
                </div>
                <div className="text-sm font-bold text-white">“{worksheet.dailyMantra}”</div>
                <div className="h-2 rounded-full bg-[#09090d] overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-rose-500 via-indigo-500 to-emerald-400" style={{ width: `${pct}%` }} />
                </div>
              </div>
              <div className="md:col-span-7 p-4 rounded-3xl bg-[#14141c] border border-slate-800 flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs text-indigo-300 font-semibold">Focus Sprint Timer</div>
                  <div className="text-sm font-bold truncate max-w-xs">{timerTask}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-mono font-bold">{String(Math.floor(timerSec / 60)).padStart(2, '0')}:{String(timerSec % 60).padStart(2, '0')}</span>
                  <button onClick={() => setTimerOn(!timerOn)} className="p-2.5 rounded-xl bg-indigo-600 text-white">{timerOn ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}</button>
                  <button onClick={() => { setTimerOn(false); setTimerSec(1500); }} className="p-2.5 rounded-xl bg-[#0c0c12] border border-slate-800"><RotateCcw className="w-4 h-4" /></button>
                </div>
              </div>
            </div>

            {view === 'heatmap' && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  {(worksheet.coreHabits || []).map((h, i) => {
                    const pal = getPal(h, i), Icon = getIcon(h), done = !!history[h.id]?.[todayISO], streak = calcStreak(history[h.id]);
                    return (
                      <div key={h.id} className="p-5 rounded-[28px] bg-[#14141b] border border-slate-800/80 space-y-4 shadow-xl">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${pal.icon}`}><Icon className="w-6 h-6" /></div>
                            <div>
                              <h4 className="text-base font-bold text-white">{h.name}</h4>
                              <span className="text-xs text-slate-400">{h.triggerCue} • <strong className={pal.text}>{streak}d streak</strong></span>
                            </div>
                          </div>
                          <button onClick={() => toggleCell(h.id, todayISO)} className={`w-12 h-12 rounded-2xl border flex items-center justify-center transition ${done ? pal.check : 'bg-[#1d1d26] border-slate-700 text-slate-400'}`}>
                            <Check className="w-6 h-6" />
                          </button>
                        </div>
                        {renderHeatmap(h.id, pal)}
                      </div>
                    );
                  })}
                </div>

                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Daily Scheduled Tasks ({filteredSched.length})</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {filteredSched.map((b, i) => {
                    const pal = getPal(b, i + 1), Icon = getIcon(b), done = !!history[b.id]?.[todayISO], open = !!expanded[b.id], notes = blockNotes[b.id] || [];
                    return (
                      <div key={b.id} className="p-5 rounded-[28px] bg-[#14141b] border border-slate-800/80 space-y-4 shadow-xl">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 ${pal.icon}`}><Icon className="w-6 h-6" /></div>
                            <div className="min-w-0">
                              <span className="text-xs font-mono text-indigo-300">{b.startTime} – {b.endTime} • {b.category}</span>
                              <h4 className={`text-base font-bold truncate ${done ? 'line-through text-slate-500' : 'text-white'}`}>{b.title}</h4>
                            </div>
                          </div>
                          <button onClick={() => toggleCell(b.id, todayISO)} className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 transition ${done ? pal.check : 'bg-[#1d1d26] border-slate-700 text-slate-400'}`}>
                            <Check className="w-6 h-6" />
                          </button>
                        </div>
                        {renderHeatmap(b.id, pal)}
                        <div className="flex justify-between items-center pt-1 border-t border-slate-800/70 text-xs">
                          <button onClick={() => setExpanded(p => ({ ...p, [b.id]: !p[b.id] }))} className="text-slate-400 hover:text-white">
                            {open ? 'Hide Steps & Task Journal' : `Micro-Steps & Journal (${notes.length})`}
                          </button>
                          <button onClick={() => { setTimerTask(`${b.startTime} ${b.title}`); setTimerOn(true); }} className="px-2.5 py-1 rounded-lg bg-[#1d1d26] text-indigo-300">Focus</button>
                        </div>
                        {open && (
                          <div className="pt-2 border-t border-slate-800 space-y-2 text-xs">
                            {b.actionableMicroSteps?.map((s, si) => <div key={si} className="text-slate-300">• {s}</div>)}
                            <div className="flex gap-2 pt-1">
                              <input value={noteInput[b.id] || ''} onChange={e => setNoteInput(p => ({ ...p, [b.id]: e.target.value }))} placeholder="Add timestamped task note..." className="flex-1 px-3 py-1.5 rounded-xl bg-[#0c0c12] border border-slate-800" />
                              <button onClick={() => addBlockNote(b.id, b.title)} className="px-3 py-1.5 rounded-xl bg-indigo-600 font-semibold">Log</button>
                            </div>
                            {notes.map(n => <div key={n.id} className="p-2 rounded-xl bg-[#0c0c12] border border-slate-800"><span className="text-[10px] font-mono text-indigo-400 block">{n.stamp}</span>{n.text}</div>)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {view === 'timeline' && (
              <div className="space-y-2.5">
                {filteredSched.map((b, i) => {
                  const pal = getPal(b, i), done = !!history[b.id]?.[todayISO];
                  return (
                    <div key={b.id} className="p-4 rounded-2xl bg-[#14141c] border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button onClick={() => toggleCell(b.id, todayISO)} className={`w-8 h-8 rounded-xl border flex items-center justify-center ${done ? pal.check : 'bg-[#1d1d26] border-slate-700'}`}><Check className="w-4 h-4" /></button>
                        <div>
                          <span className="text-xs font-mono text-indigo-300">{b.startTime} – {b.endTime}</span>
                          <h4 className={`text-sm font-bold ${done ? 'line-through text-slate-500' : 'text-white'}`}>{b.title}</h4>
                        </div>
                      </div>
                      <span className="text-xs text-slate-400">{b.category}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* EVERYDAY JOURNALS WITH DATE STAMP & EDITING */}
            {(view === 'journals' || view === 'heatmap') && (
              <div className="pt-6 border-t border-slate-800 space-y-5">
                <div className="flex flex-wrap justify-between items-center gap-3">
                  <div>
                    <h3 className="text-lg font-bold flex items-center gap-2"><BookMarked className="w-5 h-5 text-indigo-400" /> Everyday Journals (Timestamped & Editable)</h3>
                    <p className="text-xs text-slate-400">Each journal entry saves the exact date stamp when written and can be edited anytime afterward.</p>
                  </div>
                  <button onClick={analyzeJournals} className="px-4 py-2 rounded-xl bg-indigo-600 text-xs font-semibold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> AI Analyze My Journals
                  </button>
                </div>

                {jInsight && (
                  <div className="grid md:grid-cols-4 gap-3 p-4 rounded-3xl bg-indigo-950/30 border border-indigo-500/40 text-xs">
                    <div><strong className="text-indigo-400 block">Pattern</strong>{jInsight.patternDetected}</div>
                    <div><strong className="text-emerald-400 block">Momentum</strong>{jInsight.praiseAndMomentum}</div>
                    <div><strong className="text-amber-400 block">Adjustment</strong>{jInsight.scheduleAdjustmentTip}</div>
                    <div><strong className="text-purple-400 block">Next Prompt</strong>{jInsight.nextJournalPrompt}</div>
                  </div>
                )}

                <div className="grid lg:grid-cols-12 gap-5">
                  <form onSubmit={addJournal} className="lg:col-span-5 bg-[#14141c] border border-slate-800 rounded-3xl p-5 space-y-3 h-fit">
                    <div className="flex justify-between text-xs"><strong className="text-white">Write New Journal Entry</strong><span className="font-mono text-indigo-300">{formatStamp(new Date())}</span></div>
                    <input value={jForm.title} onChange={e => setJForm({ ...jForm, title: e.target.value })} placeholder="Journal Title..." className="w-full px-3 py-2 rounded-xl bg-[#0c0c12] border border-slate-800 text-xs" />
                    <div className="grid grid-cols-2 gap-2">
                      <select value={jForm.promptType} onChange={e => setJForm({ ...jForm, promptType: e.target.value })} className="px-3 py-2 rounded-xl bg-[#0c0c12] border border-slate-800 text-xs">
                        <option>Daily Reflection</option><option>Morning Intention</option><option>Workout / Boxing Log</option><option>Evening Wins</option>
                      </select>
                      <select value={jForm.mood} onChange={e => setJForm({ ...jForm, mood: e.target.value })} className="px-3 py-2 rounded-xl bg-[#0c0c12] border border-slate-800 text-xs">
                        <option>Energized</option><option>Focused</option><option>Calm</option><option>Tired</option>
                      </select>
                    </div>
                    <textarea required rows={3} value={jForm.content} onChange={e => setJForm({ ...jForm, content: e.target.value })} placeholder="Write your daily journal, workout reflection, or plan adjustments..." className="w-full px-3 py-2 rounded-xl bg-[#0c0c12] border border-slate-800 text-xs" />
                    <input value={jForm.tagsInput} onChange={e => setJForm({ ...jForm, tagsInput: e.target.value })} placeholder="Tags: Boxing, Gym, DeepWork" className="w-full px-3 py-2 rounded-xl bg-[#0c0c12] border border-slate-800 text-xs" />
                    <button type="submit" className="w-full py-2.5 rounded-xl bg-indigo-600 text-xs font-semibold">Save Journal with Date Stamp</button>
                  </form>

                  <div className="lg:col-span-7 space-y-3">
                    {journals.map(j => (
                      <div key={j.id} className="p-4 rounded-3xl bg-[#14141c] border border-slate-800 space-y-2 text-xs">
                        {editJId !== j.id ? (
                          <>
                            <div className="flex flex-wrap justify-between items-center gap-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="px-2.5 py-0.5 rounded-full bg-indigo-950/60 border border-indigo-800 text-indigo-300 font-mono text-[11px]">Written: {j.journalDateLabel}</span>
                                {j.lastEditedLabel && <span className="px-2 py-0.5 rounded-full bg-amber-950/50 text-amber-300 font-mono text-[10px]">Edited: {j.lastEditedLabel}</span>}
                              </div>
                              <div className="flex gap-2">
                                <button onClick={() => { setEditJId(j.id); setEditJDraft({ title: j.title, content: j.content, mood: j.mood, tagsInput: (j.tags || []).join(', ') }); }} className="text-indigo-400 hover:underline flex items-center gap-1"><Edit3 className="w-3 h-3" /> Edit</button>
                                <button onClick={() => setJournals(journals.filter(x => x.id !== j.id))} className="text-slate-500 hover:text-rose-400"><Trash2 className="w-3.5 h-3.5" /></button>
                              </div>
                            </div>
                            <h4 className="text-sm font-bold text-white">{j.title}</h4>
                            <p className="text-slate-200 whitespace-pre-line">{j.content}</p>
                            <div className="text-[11px] text-slate-400">Mood: {j.mood} • {(j.tags || []).map(t => `#${t} `)}</div>
                          </>
                        ) : (
                          <div className="space-y-2">
                            <div className="text-[11px] font-mono text-indigo-300">Original Journal Date: {j.journalDateLabel}</div>
                            <input value={editJDraft.title} onChange={e => setEditJDraft({ ...editJDraft, title: e.target.value })} className="w-full px-3 py-1.5 rounded-xl bg-[#0c0c12] border border-slate-800" />
                            <textarea rows={3} value={editJDraft.content} onChange={e => setEditJDraft({ ...editJDraft, content: e.target.value })} className="w-full px-3 py-1.5 rounded-xl bg-[#0c0c12] border border-slate-800" />
                            <div className="flex justify-end gap-2">
                              <button onClick={() => setEditJId(null)} className="px-3 py-1 rounded-lg bg-slate-800">Cancel</button>
                              <button onClick={() => saveEditJournal(j.id)} className="px-3 py-1 rounded-lg bg-emerald-600 font-semibold">Save Changes</button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Floating Bottom Dock (Like Screenshot) */}
            <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40">
              <div className="flex items-center gap-2 p-1.5 rounded-full bg-[#181822]/95 border border-slate-700 shadow-2xl">
                {[
                  { id: 'heatmap', label: 'Heatmap', icon: LayoutGrid },
                  { id: 'timeline', label: 'Checklist', icon: CheckSquare },
                  { id: 'journals', label: `Journals (${journals.length})`, icon: FileText }
                ].map(t => {
                  const Icon = t.icon;
                  return (
                    <button key={t.id} onClick={() => setView(t.id)} className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold ${view === t.id ? 'bg-[#2a2a3a] text-white border border-slate-600' : 'text-slate-400'}`}>
                      <Icon className="w-4 h-4" /> <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        )}
      </main>

      {loading && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="max-w-sm w-full bg-[#14141c] border border-indigo-500/40 rounded-3xl p-6 text-center space-y-3">
            <Sparkles className="w-8 h-8 text-indigo-400 mx-auto animate-spin" />
            <div className="text-sm font-bold">Calibrating with Gemini...</div>
            <p className="text-xs text-slate-400">{loadingMsg}</p>
          </div>
        </div>
      )}

      {modal === 'key' && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <form onSubmit={e => { e.preventDefault(); try { localStorage.setItem(API_KEY_STORAGE, apiKey.trim()); } catch {} setModal(null); }} className="max-w-sm w-full bg-[#14141c] border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-sm font-bold">Gemini API Key</h3>
            <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="AIzaSy..." className="w-full px-3 py-2 rounded-xl bg-[#0c0c12] border border-slate-800 text-xs" />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setModal(null)} className="px-3 py-1.5 rounded-xl bg-slate-800 text-xs">Cancel</button>
              <button type="submit" className="px-4 py-1.5 rounded-xl bg-indigo-600 text-xs font-semibold">Save Key</button>
            </div>
          </form>
        </div>
      )}

      {modal === 'about' && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#14141c] border border-slate-800 rounded-3xl p-6 space-y-3">
            <h3 className="text-sm font-bold">More About Me — Plan Variables</h3>
            <input value={aboutMe.workEnvironment} onChange={e => setAboutMe({ ...aboutMe, workEnvironment: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-[#0c0c12] border border-slate-800 text-xs" />
            <input value={aboutMe.energySlumpTime} onChange={e => setAboutMe({ ...aboutMe, energySlumpTime: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-[#0c0c12] border border-slate-800 text-xs" />
            <textarea rows={2} value={aboutMe.personalConstraints} onChange={e => setAboutMe({ ...aboutMe, personalConstraints: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-[#0c0c12] border border-slate-800 text-xs" />
            <div className="flex justify-end gap-2">
              <button onClick={() => setModal(null)} className="px-4 py-1.5 rounded-xl bg-indigo-600 text-xs font-semibold">Done</button>
            </div>
          </div>
        </div>
      )}

      {modal === 'recal' && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <form onSubmit={recalibrateDay} className="max-w-sm w-full bg-[#14141c] border border-rose-800 rounded-3xl p-6 space-y-3">
            <h3 className="text-sm font-bold">Emergency Recalibrate</h3>
            <textarea required rows={3} value={recalText} onChange={e => setRecalText(e.target.value)} placeholder="What changed in your schedule today?" className="w-full px-3 py-2 rounded-xl bg-[#0c0c12] border border-slate-800 text-xs" />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setModal(null)} className="px-3 py-1.5 rounded-xl bg-slate-800 text-xs">Cancel</button>
              <button type="submit" className="px-4 py-1.5 rounded-xl bg-rose-600 text-xs font-semibold">Recalibrate</button>
            </div>
          </form>
        </div>
      )}

      {modal === 'addTask' && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <form onSubmit={e => {
            e.preventDefault(); if (!customTask.title.trim() || !worksheet) return;
            const id = `c_${Date.now()}`;
            setWorksheet({
              ...worksheet,
              coreHabits: [...(worksheet.coreHabits || []), { id, name: customTask.title, triggerCue: customTask.cue, durationMinutes: 45, category: customTask.category, customPalette: customTask.palette }]
            });
            setHistory(p => ({ ...p, [id]: seedHistory(id) })); setModal(null);
          }} className="max-w-sm w-full bg-[#14141c] border border-slate-800 rounded-3xl p-6 space-y-3">
            <h3 className="text-sm font-bold">Add Custom Habit Card</h3>
            <input required placeholder="e.g., Boxing / Daily Gym" value={customTask.title} onChange={e => setCustomTask({ ...customTask, title: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-[#0c0c12] border border-slate-800 text-xs" />
            <select value={customTask.palette} onChange={e => setCustomTask({ ...customTask, palette: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-[#0c0c12] border border-slate-800 text-xs">
              <option value="rose">Coral Rose</option><option value="emerald">Emerald Mint</option><option value="indigo">Electric Indigo</option><option value="amber">Solar Amber</option><option value="purple">Neon Violet</option>
            </select>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setModal(null)} className="px-3 py-1.5 rounded-xl bg-slate-800 text-xs">Cancel</button>
              <button type="submit" className="px-4 py-1.5 rounded-xl bg-indigo-600 text-xs font-semibold">Add Card</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}