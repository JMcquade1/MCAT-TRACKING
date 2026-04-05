import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarDays, Brain, BookOpen, Target, Zap, CheckCircle2, BarChart3 } from "lucide-react";

const STORAGE_KEY = "mcat-tracker-may20";

const startDate = new Date("2026-04-05T00:00:00");
const endDate = new Date("2026-05-20T23:59:59");

const weekdayTemplate = [
  { id: "ps", label: "P/S review (45 min)", category: "P/S" },
  { id: "cars", label: "CARS practice (3–4 passages)", category: "CARS" },
  { id: "targeted", label: "Targeted practice (40–60 min)", category: "Practice" },
  { id: "review", label: "Deep review of misses", category: "Review" },
];

const lightFridayTemplate = [
  { id: "ps", label: "P/S review (30–45 min)", category: "P/S" },
  { id: "cars", label: "CARS practice (3 passages)", category: "CARS" },
  { id: "errorlog", label: "Error log review", category: "Review" },
];

const staminaTemplate = [
  { id: "carsblock", label: "Timed CARS block (4 passages)", category: "Stamina" },
  { id: "break", label: "10-minute break", category: "Stamina" },
  { id: "psblock", label: "Timed P/S block (40 questions)", category: "Stamina" },
  { id: "review", label: "Review fatigue and misread patterns", category: "Review" },
];

const fullLengthWeeks = new Set([2, 4, 6]);

function formatDateLocal(date) {
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function daysBetween(a, b) {
  return Math.ceil((b - a) / (1000 * 60 * 60 * 24));
}

function getWeekNumber(date) {
  return Math.floor((date - startDate) / (1000 * 60 * 60 * 24 * 7)) + 1;
}

function buildPlan() {
  const dates = [];
  const cursor = new Date(startDate);

  while (cursor <= endDate) {
    const day = cursor.getDay();
    const week = getWeekNumber(cursor);
    const iso = cursor.toISOString().slice(0, 10);

    let title = "";
    let tasks = [];
    let note = "";

    if (day >= 1 && day <= 4) {
      title = "Weekday study block";
      tasks = [...weekdayTemplate];
      if (day === 2 || day === 4) {
        tasks = [...tasks, ...staminaTemplate];
        note = "Stamina day: train the CARS → P/S fatigue transition.";
      }
    } else if (day === 5) {
      title = "Light Friday";
      tasks = [...lightFridayTemplate];
      note = "Keep momentum without burning out.";
    } else if (day === 6) {
      if (fullLengthWeeks.has(week)) {
        title = "Full-length exam day";
        tasks = [
          { id: "fl", label: "Take full-length under real timing", category: "Exam" },
          { id: "food", label: "Use test-day food and breaks", category: "Exam" },
          { id: "brief", label: "Write quick post-exam notes", category: "Review" },
        ];
        note = "Simulate the real exam as closely as possible.";
      } else {
        title = "Heavy section practice";
        tasks = [
          { id: "backtoback", label: "2 sections back-to-back", category: "Stamina" },
          { id: "review", label: "Deep review of misses", category: "Review" },
          { id: "ps", label: "Short P/S reinforcement", category: "P/S" },
        ];
        note = "Build endurance without a full-length.";
      }
    } else {
      title = "Review and repair Sunday";
      tasks = [
        { id: "reviewall", label: "Review the week's misses", category: "Review" },
        { id: "ps", label: "P/S reinforcement", category: "P/S" },
        { id: "cars", label: "2–3 CARS passages", category: "CARS" },
        { id: "weakness", label: "Patch weakest topic", category: "Practice" },
      ];
      note = "Find the patterns: misreads, timing, fatigue, or content gaps.";
    }

    dates.push({
      iso,
      dateLabel: formatDateLocal(cursor),
      dayName: cursor.toLocaleDateString(undefined, { weekday: "long" }),
      week,
      title,
      note,
      tasks: tasks.map((t, idx) => ({ ...t, uid: `${iso}-${t.id}-${idx}` })),
    });

    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}

const plan = buildPlan();

function defaultState() {
  const completion = {};
  const notes = {};
  plan.forEach((day) => {
    day.tasks.forEach((task) => {
      completion[task.uid] = false;
    });
    notes[day.iso] = "";
  });
  return { completion, notes, scores: [], customNote: "" };
}

export default function MCATTrackerWebsite() {
  const testDate = new Date("2026-05-22T08:00:00");
  const [state, setState] = useState(defaultState);
  const [selectedDate, setSelectedDate] = useState(plan[0].iso);
  const [scoreInput, setScoreInput] = useState({ date: "", cp: "", cars: "", bb: "", ps: "" });
  const [timers, setTimers] = useState({ ps: 45 * 60, cars: 40 * 60, practice: 60 * 60 });
  const [running, setRunning] = useState({ ps: false, cars: false, practice: false });
  const [psCram, setPsCram] = useState([
    { term: "Positive reinforcement", detail: "Add a rewarding stimulus to increase a behavior." },
    { term: "Negative reinforcement", detail: "Remove an unpleasant stimulus to increase a behavior." },
    { term: "Positive punishment", detail: "Add an unpleasant stimulus to decrease a behavior." },
    { term: "Negative punishment", detail: "Remove a rewarding stimulus to decrease a behavior." },
    { term: "Episodic memory", detail: "Memory for personal experiences and events." },
    { term: "Semantic memory", detail: "Memory for facts and general knowledge." },
    { term: "Procedural memory", detail: "Memory for skills and actions." },
    { term: "Fundamental attribution error", detail: "Overemphasizing personality and underestimating situation when judging others." },
    { term: "Self-serving bias", detail: "Taking credit for success and blaming outside factors for failure." },
    { term: "Actor-observer bias", detail: "Explaining your own behavior situationally, but others’ behavior dispositionally." },
    { term: "Cognitive dissonance", detail: "Discomfort from holding inconsistent beliefs or beliefs that clash with actions." },
    { term: "Social loafing", detail: "Reduced effort when working in a group." },
    { term: "Groupthink", detail: "Poor group decisions caused by pressure for harmony and consensus." },
    { term: "Independent variable", detail: "What the researcher changes or manipulates." },
    { term: "Dependent variable", detail: "What is measured as the outcome." },
    { term: "Validity", detail: "Whether a study measures what it claims to measure." },
    { term: "Reliability", detail: "Whether a measure is consistent and reproducible." },
    { term: "Cross-sectional study", detail: "Compares different groups at one point in time." },
    { term: "Longitudinal study", detail: "Follows the same group over time." },
    { term: "Social constructionism", detail: "How groups and societies shape what people see as real or meaningful." }
  ]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setState({ ...defaultState(), ...parsed });
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimers((prev) => {
        const next = { ...prev };
        Object.keys(prev).forEach((key) => {
          if (running[key] && prev[key] > 0) next[key] = prev[key] - 1;
        });
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [running]);

  const today = new Date();
  const selectedDay = plan.find((d) => d.iso === selectedDate) || plan[0];
  const totalTasks = Object.keys(state.completion).length;
  const completedTasks = Object.values(state.completion).filter(Boolean).length;
  const progress = Math.round((completedTasks / totalTasks) * 100);
  const daysLeft = Math.max(0, daysBetween(today, endDate));
  const daysToTest = Math.max(0, daysBetween(today, testDate));

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = Math.floor(seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const toggleTimer = (key) => setRunning((prev) => ({ ...prev, [key]: !prev[key] }));
  const resetTimer = (key, value) => {
    setRunning((prev) => ({ ...prev, [key]: false }));
    setTimers((prev) => ({ ...prev, [key]: value }));
  };

  const weekGroups = useMemo(() => {
    const groups = {};
    for (const day of plan) {
      if (!groups[day.week]) groups[day.week] = [];
      groups[day.week].push(day);
    }
    return groups;
  }, []);

  const categoryStats = useMemo(() => {
    const counts = {};
    const done = {};
    plan.forEach((day) => {
      day.tasks.forEach((task) => {
        counts[task.category] = (counts[task.category] || 0) + 1;
        done[task.category] = (done[task.category] || 0) + (state.completion[task.uid] ? 1 : 0);
      });
    });
    return Object.keys(counts).map((key) => ({
      category: key,
      done: done[key] || 0,
      total: counts[key],
      pct: Math.round(((done[key] || 0) / counts[key]) * 100),
    }));
  }, [state.completion]);

  const toggleTask = (uid) => {
    setState((prev) => ({
      ...prev,
      completion: { ...prev.completion, [uid]: !prev.completion[uid] },
    }));
  };

  const updateNote = (iso, value) => {
    setState((prev) => ({
      ...prev,
      notes: { ...prev.notes, [iso]: value },
    }));
  };

  const addScore = () => {
    const { date, cp, cars, bb, ps } = scoreInput;
    if (!date || !cp || !cars || !bb || !ps) return;
    const total = Number(cp) + Number(cars) + Number(bb) + Number(ps);
    const next = [...state.scores, { date, cp: Number(cp), cars: Number(cars), bb: Number(bb), ps: Number(ps), total }]
      .sort((a, b) => a.date.localeCompare(b.date));
    setState((prev) => ({ ...prev, scores: next }));
    setScoreInput({ date: "", cp: "", cars: "", bb: "", ps: "" });
  };

  const removeScore = (date) => {
    setState((prev) => ({ ...prev, scores: prev.scores.filter((s) => s.date !== date) }));
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="rounded-2xl shadow-sm md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <CalendarDays className="h-6 w-6" />
                MCAT Tracker to May 20
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-slate-600">
                Built around your plan: daily P/S, daily CARS, targeted practice, stamina blocks, and strategic full-lengths.
              </p>
              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span>Overall completion</span>
                  <span className="font-semibold">{progress}%</span>
                </div>
                <Progress value={progress} />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Target className="h-5 w-5" />
                <div>
                  <p className="text-sm text-slate-500">Days to May 20 plan end</p>
                  <p className="text-3xl font-bold">{daysLeft}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CalendarDays className="h-5 w-5" />
                <div>
                  <p className="text-sm text-slate-500">Countdown to May 22 test day</p>
                  <p className="text-3xl font-bold">{daysToTest}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5" />
                <div>
                  <p className="text-sm text-slate-500">Tasks completed</p>
                  <p className="text-3xl font-bold">{completedTasks}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="plan" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 rounded-2xl">
            <TabsTrigger value="plan">Daily Plan</TabsTrigger>
            <TabsTrigger value="weeks">Weekly View</TabsTrigger>
            <TabsTrigger value="scores">Score Tracker</TabsTrigger>
            <TabsTrigger value="timers">Timers</TabsTrigger>
            <TabsTrigger value="pscram">P/S Cram</TabsTrigger>
            <TabsTrigger value="focus">Focus Areas</TabsTrigger>
          </TabsList>

          <TabsContent value="plan" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
              <Card className="rounded-2xl shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Choose a day</CardTitle>
                </CardHeader>
                <CardContent className="max-h-[640px] space-y-2 overflow-auto pr-2">
                  {plan.map((day) => {
                    const doneCount = day.tasks.filter((t) => state.completion[t.uid]).length;
                    const donePct = Math.round((doneCount / day.tasks.length) * 100);
                    return (
                      <button
                        key={day.iso}
                        onClick={() => setSelectedDate(day.iso)}
                        className={`w-full rounded-2xl border p-3 text-left transition ${
                          selectedDate === day.iso ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white hover:bg-slate-100"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-semibold">{day.dayName}</div>
                            <div className={`text-xs ${selectedDate === day.iso ? "text-slate-300" : "text-slate-500"}`}>{day.dateLabel}</div>
                          </div>
                          <Badge variant="secondary">{donePct}%</Badge>
                        </div>
                        <div className={`mt-2 text-xs ${selectedDate === day.iso ? "text-slate-300" : "text-slate-600"}`}>{day.title}</div>
                      </button>
                    );
                  })}
                </CardContent>
              </Card>

              <Card className="rounded-2xl shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-xl">
                    <span>{selectedDay.dayName} · {selectedDay.dateLabel}</span>
                    <Badge>Week {selectedDay.week}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div>
                    <h3 className="text-lg font-semibold">{selectedDay.title}</h3>
                    <p className="mt-1 text-sm text-slate-600">{selectedDay.note}</p>
                  </div>

                  <div className="space-y-3">
                    {selectedDay.tasks.map((task) => (
                      <div key={task.uid} className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4">
                        <Checkbox checked={state.completion[task.uid]} onCheckedChange={() => toggleTask(task.uid)} />
                        <div className="flex-1">
                          <p className={`font-medium ${state.completion[task.uid] ? "line-through text-slate-400" : "text-slate-800"}`}>
                            {task.label}
                          </p>
                          <p className="text-xs text-slate-500">{task.category}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Notes for this day</label>
                    <Textarea
                      value={state.notes[selectedDay.iso] || ""}
                      onChange={(e) => updateNote(selectedDay.iso, e.target.value)}
                      placeholder="Write what you missed, what felt hard, timing issues, or what to fix tomorrow."
                      className="min-h-[140px] rounded-2xl"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="weeks" className="space-y-6">
            <div className="grid gap-4 xl:grid-cols-2">
              {Object.entries(weekGroups).map(([week, days]) => {
                const completed = days.flatMap((d) => d.tasks).filter((t) => state.completion[t.uid]).length;
                const total = days.flatMap((d) => d.tasks).length;
                const pct = Math.round((completed / total) * 100);
                return (
                  <Card key={week} className="rounded-2xl shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>Week {week}</span>
                        <Badge>{pct}% complete</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Progress value={pct} />
                      <div className="grid gap-2">
                        {days.map((day) => (
                          <div key={day.iso} className="rounded-xl border border-slate-200 p-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">{day.dayName}</p>
                                <p className="text-xs text-slate-500">{day.dateLabel}</p>
                              </div>
                              <Button variant="outline" size="sm" onClick={() => setSelectedDate(day.iso)}>Open</Button>
                            </div>
                            <p className="mt-2 text-sm text-slate-600">{day.title}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="scores" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
              <Card className="rounded-2xl shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg"><BarChart3 className="h-5 w-5" /> Add full-length score</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Input type="date" value={scoreInput.date} onChange={(e) => setScoreInput({ ...scoreInput, date: e.target.value })} />
                  <div className="grid grid-cols-2 gap-3">
                    <Input placeholder="C/P" value={scoreInput.cp} onChange={(e) => setScoreInput({ ...scoreInput, cp: e.target.value })} />
                    <Input placeholder="CARS" value={scoreInput.cars} onChange={(e) => setScoreInput({ ...scoreInput, cars: e.target.value })} />
                    <Input placeholder="B/B" value={scoreInput.bb} onChange={(e) => setScoreInput({ ...scoreInput, bb: e.target.value })} />
                    <Input placeholder="P/S" value={scoreInput.ps} onChange={(e) => setScoreInput({ ...scoreInput, ps: e.target.value })} />
                  </div>
                  <Button className="w-full rounded-2xl" onClick={addScore}>Save score</Button>
                </CardContent>
              </Card>

              <Card className="rounded-2xl shadow-sm">
                <CardHeader>
                  <CardTitle>Saved score history</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {state.scores.length === 0 && <p className="text-sm text-slate-500">No scores added yet.</p>}
                    {state.scores.map((s) => (
                      <div key={s.date} className="flex items-center justify-between rounded-2xl border border-slate-200 p-4">
                        <div>
                          <p className="font-semibold">{s.date} · Total {s.total}</p>
                          <p className="text-sm text-slate-600">C/P {s.cp} · CARS {s.cars} · B/B {s.bb} · P/S {s.ps}</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => removeScore(s.date)}>Remove</Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="timers" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-3">
              {[
                { key: "ps", label: "P/S Review", defaultValue: 45 * 60 },
                { key: "cars", label: "CARS Block", defaultValue: 40 * 60 },
                { key: "practice", label: "Targeted Practice", defaultValue: 60 * 60 },
              ].map((timer) => (
                <Card key={timer.key} className="rounded-2xl shadow-sm">
                  <CardHeader>
                    <CardTitle>{timer.label}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-center">
                    <div className="text-5xl font-bold tracking-tight">{formatTimer(timers[timer.key])}</div>
                    <div className="flex justify-center gap-2">
                      <Button className="rounded-2xl" onClick={() => toggleTimer(timer.key)}>
                        {running[timer.key] ? "Pause" : "Start"}
                      </Button>
                      <Button variant="outline" className="rounded-2xl" onClick={() => resetTimer(timer.key, timer.defaultValue)}>
                        Reset
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="pscram" className="space-y-6">
            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Brain className="h-5 w-5" /> High-yield P/S cram tab</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {psCram.map((item) => (
                  <div key={item.term} className="rounded-2xl border border-slate-200 p-4">
                    <p className="font-semibold">{item.term}</p>
                    <p className="mt-1 text-sm text-slate-600">{item.detail}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="focus" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="rounded-2xl shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Brain className="h-5 w-5" /> Focus checklist</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-slate-700">
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <h3 className="font-semibold">P/S priority</h3>
                    <p className="mt-1">Conditioning, memory, social psychology, and research methods every day. Aim for instant recognition.</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <h3 className="font-semibold">CARS shortcut</h3>
                    <p className="mt-1">After each passage: write one-sentence main idea and label tone as support, criticize, or neutral.</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <h3 className="font-semibold">Misread prevention</h3>
                    <p className="mt-1">Before answering: What are they actually asking? Before clicking: Does this answer directly match that question?</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <h3 className="font-semibold">Stamina</h3>
                    <p className="mt-1">Twice weekly, train the CARS → P/S transition to reduce fatigue-based score drops.</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Zap className="h-5 w-5" /> Category progress</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {categoryStats.map((item) => (
                    <div key={item.category} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>{item.category}</span>
                        <span>{item.done}/{item.total}</span>
                      </div>
                      <Progress value={item.pct} />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5" /> Quick reminders</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {[
                  "Review matters more than volume.",
                  "Do P/S and CARS every day.",
                  "Trust the most supported CARS answer.",
                  "Fix one timing leak at a time."
                ].map((text) => (
                  <div key={text} className="rounded-2xl border border-slate-200 p-4 text-sm text-slate-700">{text}</div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
