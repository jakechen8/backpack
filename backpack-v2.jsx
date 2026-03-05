import { useState, useEffect, useRef } from "react";
import {
  Check, ChevronRight, Search, X, Bell, Shield, Eye,
  ExternalLink, Package, MapPin, Zap, Sun, ArrowRight,
  Inbox, Users, FileText, CreditCard, Calendar, Clock,
  Shirt, DollarSign, Send, Plus, AlertCircle, Sparkles
} from "lucide-react";

/*
 * BACKPACK v2 — Radical Calm
 *
 * Design philosophy:
 *   • One screen answers everything
 *   • White space > decoration
 *   • Typography does the heavy lifting
 *   • Color is meaning, not decoration
 *   • Every element earns its pixel
 */

// ─── TOKENS ──────────────────────────────────────────────────
const COLORS = {
  maya:  { bg: "#F3F0FF", text: "#6D28D9", dot: "#8B5CF6", subtle: "#DDD6FE" },
  ethan: { bg: "#EFF6FF", text: "#1D4ED8", dot: "#3B82F6", subtle: "#BFDBFE" },
};

// ─── DATE HELPERS ─────────────────────────────────────────────
// P2 FIX (#8): All dates computed relative to today, never hardcoded.
const TODAY = new Date();
const fmt = (d) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
const fmtDay = (d) => d.toLocaleDateString("en-US", { weekday: "short" });
const addDays = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };
const TODAY_STR = fmt(TODAY);
const TOMORROW_STR = fmt(addDays(TODAY, 1));
const dayOffset = (n) => fmt(addDays(TODAY, n));
const dayName = (n) => fmtDay(addDays(TODAY, n));

// ─── DATA ────────────────────────────────────────────────────
const KIDS = [
  { id: "maya",  name: "Maya",  detail: "3rd · Mrs. Rodriguez", color: COLORS.maya },
  { id: "ethan", name: "Ethan", detail: "5th · Mr. Patterson",  color: COLORS.ethan },
];

const CHECKLIST = {
  maya: [
    { id: 1, text: "Library book — Matilda",           done: false, why: `Mrs. Rodriguez, ${dayOffset(-5)}`, tag: "bring",  urgent: false, confidence: 0.92 },
    { id: 2, text: "PE shoes",                         done: true,  why: "Weekly schedule",                  tag: "bring",  urgent: false, confidence: 0.95 },
    { id: 3, text: "Permission slip — Science Museum",  done: false, why: `Newsletter, ${dayOffset(-4)}`,    tag: "sign",   urgent: true,  confidence: 0.88 },
    { id: 4, text: "Spirit shirt (school colors day)",  done: false, why: `PTA newsletter, ${dayOffset(-8)}`, tag: "wear",  urgent: false, confidence: 0.78 },
    { id: 5, text: "Field trip fee — $10",              done: false, why: `ParentSquare, ${dayOffset(-3)}`,  tag: "pay",    urgent: true,  confidence: 0.97 },
  ],
  ethan: [
    { id: 6, text: "Sign & return math test",    done: false, why: `Mr. Patterson, ${dayOffset(-2)}`,  tag: "sign",  urgent: true,  confidence: 0.90 },
    { id: 7, text: "Poster board for project",   done: false, why: `Canvas, ${dayOffset(-6)}`,          tag: "bring", urgent: false, confidence: 0.85 },
    { id: 8, text: "Water bottle",               done: true,  why: "Coach Davis",                       tag: "bring", urgent: false, confidence: 0.70 },
    { id: 9, text: "Reload lunch balance — $15", done: false, why: "Infinite Campus alert",             tag: "pay",   urgent: false, confidence: 0.99 },
  ],
};

const TIMELINE = {
  maya: [
    { time: "8:00",  label: "Drop-off" },
    { time: "10:30", label: "Science Museum Trip", highlight: true },
    { time: "2:15",  label: "Early release", alert: true },
    { time: "3:00",  label: "Soccer · Field B" },
  ],
  ethan: [
    { time: "8:00",  label: "Drop-off" },
    { time: "1:00",  label: "Math test review" },
    { time: "2:15",  label: "Early release", alert: true },
    { time: "4:00",  label: "Basketball tryouts · Gym", highlight: true },
  ],
};

const MESSAGES = [
  { id: "m1", from: "Mrs. Rodriguez",     time: "9:15 AM",   subject: "Spirit Day + Library Books",               child: "maya",  unread: true,  facts: ["Wear spirit shirt tomorrow", "Library book due Wednesday"] },
  { id: "m2", from: "Lincoln Elementary",  time: "8:00 AM",   subject: `Early Release — ${fmtDay(TODAY)} ${TODAY_STR}`, child: "both", unread: true, facts: ["Dismissal at 2:15 PM"] },
  { id: "m3", from: "Mr. Patterson",       time: "Yesterday", subject: "Math Test + Conference Sign-Up",           child: "ethan", unread: false, facts: ["Sign math test, return tomorrow", `RSVP conference by ${dayOffset(5)}`] },
  { id: "m4", from: "PTA Lincoln",         time: dayOffset(-5), subject: "Spring Fair Volunteers Needed",          child: "both",  unread: false, facts: [`Volunteer signup — Spring Fair ${dayOffset(17)}`] },
  { id: "m5", from: "Coach Davis",         time: dayOffset(-2), subject: "Basketball Tryouts Schedule Change",     child: "ethan", unread: false, facts: ["Tryouts moved to 4 PM Wed"] },
  { id: "m6", from: "ParentSquare",        time: dayOffset(-3), subject: "Payment: Science Museum Trip",           child: "maya",  unread: false, facts: [`$10 due ${TODAY_STR}`] },
];

const FILES = [
  { id: "f1", name: "Science Museum Permission Slip", child: "maya",  from: "Newsletter",    needsSign: true  },
  { id: "f2", name: "Basketball Tryout Waiver",       child: "ethan", from: "Coach Davis",    needsSign: true  },
  { id: "f3", name: "Spring Fair Volunteer Form",     child: "both",  from: "PTA",            needsSign: false },
  { id: "f4", name: "March Lunch Menu",               child: "both",  from: "District",       needsSign: false },
  { id: "f5", name: "3rd Grade Field Trip Details",   child: "maya",  from: "Mrs. Rodriguez", needsSign: false },
  { id: "f6", name: "Picture Day Order Form",         child: "both",  from: "Flyer",          needsSign: false },
];

// ─── SMALL PARTS ─────────────────────────────────────────────

const Dot = ({ color, size = 8 }) => (
  <span className="inline-block rounded-full flex-shrink-0" style={{ width: size, height: size, backgroundColor: color }} />
);

const ChildPill = ({ kid, active, onClick }) => (
  <button onClick={onClick}
    className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all"
    style={active
      ? { backgroundColor: kid.color.bg, color: kid.color.text }
      : { backgroundColor: "transparent", color: "#94A3B8" }
    }>
    <Dot color={active ? kid.color.dot : "#CBD5E1"} />
    {kid.name}
  </button>
);

const TagIcon = ({ tag }) => {
  const map = { bring: Package, sign: FileText, pay: DollarSign, wear: Shirt, rsvp: Calendar, reply: Send };
  const Icon = map[tag] || Zap;
  return <Icon size={14} />;
};

// ─── MAIN ────────────────────────────────────────────────────

export default function Backpack() {
  const [tab, setTab] = useState("today");
  const [kid, setKid] = useState("all");
  const [items, setItems] = useState(CHECKLIST);
  const [openMsg, setOpenMsg] = useState(null);
  const [ask, setAsk] = useState("");
  const [answer, setAnswer] = useState(null);
  const [showSource, setShowSource] = useState({});

  // Toggle a checklist item
  const toggle = (childId, itemId) => {
    setItems(prev => ({
      ...prev,
      [childId]: prev[childId].map(i => i.id === itemId ? { ...i, done: !i.done } : i),
    }));
  };

  // Ask Backpack
  const handleAsk = () => {
    if (!ask.trim()) return;
    const q = ask.toLowerCase();
    if (q.includes("maya") && (q.includes("tomorrow") || q.includes("need"))) {
      setAnswer({ text: "Maya needs her library book (Matilda), PE shoes, and the signed Science Museum permission slip. It's Spirit Day — school colors shirt. $10 field trip fee is also due.", from: `Mrs. Rodriguez email + Newsletter + ParentSquare` });
    } else if (q.includes("early release")) {
      setAnswer({ text: `${fmtDay(TODAY)} ${TODAY_STR} is early release. Dismissal at 2:15 PM for all grades.`, from: "District calendar + Lincoln Elementary email" });
    } else if (q.includes("money") || q.includes("owe") || q.includes("pay")) {
      setAnswer({ text: "Two things: $10 for Maya's Science Museum trip (due today), and Ethan's lunch balance needs ~$15.", from: "ParentSquare + Infinite Campus" });
    } else {
      setAnswer({ text: 'I found related info across your school messages. Try being more specific — like "What does Ethan need?" or "When is picture day?"', from: "6 connected sources" });
    }
  };

  // Compute readiness
  const readiness = (childId) => {
    const list = items[childId];
    const done = list.filter(i => i.done).length;
    return { done, total: list.length, allDone: done === list.length };
  };

  const visibleKids = kid === "all" ? KIDS : KIDS.filter(k => k.id === kid);

  const tabs = [
    { id: "today",    label: "Today",    icon: Sun },
    { id: "messages", label: "Messages", icon: Inbox, count: MESSAGES.filter(m => m.unread).length },
    { id: "files",    label: "Files",    icon: FileText, count: FILES.filter(f => f.needsSign).length },
    { id: "family",   label: "Family",   icon: Users },
  ];

  return (
    <div className="min-h-screen bg-stone-50" style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>

      {/* ── HEADER ── */}
      <header className="bg-white border-b border-stone-200/60">
        <div className="max-w-3xl mx-auto px-6">
          {/* Top row */}
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-stone-900 flex items-center justify-center">
                <Package size={15} className="text-white" />
              </div>
              <span className="text-base font-semibold text-stone-900 tracking-tight">Backpack</span>
            </div>

            <div className="flex items-center gap-3">
              {/* Kid toggle */}
              <div className="flex items-center gap-0.5 bg-stone-100 rounded-full p-0.5">
                <button onClick={() => setKid("all")}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${kid === "all" ? "bg-white text-stone-900 shadow-sm" : "text-stone-400"}`}>
                  All
                </button>
                {KIDS.map(k => <ChildPill key={k.id} kid={k} active={kid === k.id} onClick={() => setKid(k.id)} />)}
              </div>
              <button className="relative w-9 h-9 flex items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 transition">
                <Bell size={17} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <nav className="flex gap-6 -mb-px">
            {tabs.map(t => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button key={t.id} onClick={() => { setTab(t.id); setOpenMsg(null); }}
                  className={`flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-all ${active ? "border-stone-900 text-stone-900" : "border-transparent text-stone-400 hover:text-stone-600"}`}>
                  <Icon size={15} />
                  {t.label}
                  {t.count > 0 && (
                    <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${active ? "bg-stone-900 text-white" : "bg-stone-200 text-stone-500"}`}>
                      {t.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* ── CONTENT ── */}
      <main className="max-w-3xl mx-auto px-6 py-8">

        {/* ═══════════ TODAY ═══════════ */}
        {tab === "today" && (
          <div className="space-y-10">

            {/* Ask bar */}
            <div className="relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" />
              <input
                type="text"
                value={ask}
                onChange={e => { setAsk(e.target.value); setAnswer(null); }}
                onKeyDown={e => e.key === "Enter" && handleAsk()}
                placeholder={'Ask anything — "What does Maya need tomorrow?"'}
                className="w-full pl-12 pr-12 py-4 bg-white border border-stone-200 rounded-2xl text-sm text-stone-800 placeholder:text-stone-300 focus:outline-none focus:border-stone-400 transition shadow-sm"
              />
              {ask && (
                <button onClick={handleAsk} className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-stone-900 text-white rounded-xl flex items-center justify-center hover:bg-stone-700 transition">
                  <ArrowRight size={14} />
                </button>
              )}
            </div>

            {/* Answer */}
            {answer && (
              <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm -mt-4">
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-lg bg-stone-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Sparkles size={13} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-stone-700 leading-relaxed">{answer.text}</p>
                    <p className="text-xs text-stone-400 mt-2 flex items-center gap-1">
                      <Eye size={10} /> {answer.from}
                    </p>
                  </div>
                  <button onClick={() => setAnswer(null)} className="text-stone-300 hover:text-stone-500 self-start">
                    <X size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Per-kid sections */}
            {visibleKids.map(child => {
              const r = readiness(child.id);
              const list = items[child.id];
              const tl = TIMELINE[child.id];
              return (
                <section key={child.id}>
                  {/* Child header */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-base font-bold"
                        style={{ backgroundColor: child.color.bg, color: child.color.text }}>
                        {child.name[0]}
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-stone-900">{child.name}</h2>
                        <p className="text-xs text-stone-400">{child.detail}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {r.allDone ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-sm font-medium">
                          <Check size={14} /> All set
                        </span>
                      ) : (
                        <span className="text-sm text-stone-400">
                          <span className="text-stone-800 font-semibold">{r.total - r.done}</span> things left
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Checklist */}
                  <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm divide-y divide-stone-100">
                    {[...list].sort((a, b) => a.done - b.done || b.urgent - a.urgent).map(item => (
                      <div key={item.id} className="flex items-start gap-3.5 px-5 py-4 group">
                        {/* Checkbox */}
                        <button onClick={() => toggle(child.id, item.id)}
                          className={`w-5 h-5 mt-0.5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${item.done ? "border-emerald-500 bg-emerald-500" : "border-stone-300 hover:border-stone-400"}`}>
                          {item.done && <Check size={12} className="text-white" />}
                        </button>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm leading-snug ${item.done ? "line-through text-stone-400" : "text-stone-800"}`}>
                              {item.text}
                            </span>
                            {item.urgent && !item.done && (
                              <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-red-500" />
                            )}
                          </div>

                          {/* Source + confidence — Trust Ledger */}
                          <div className="flex items-center gap-2 mt-1">
                            <button
                              onClick={() => setShowSource(p => ({ ...p, [item.id]: !p[item.id] }))}
                              className="text-xs text-stone-300 hover:text-stone-500 flex items-center gap-1 transition">
                              <Eye size={10} />
                              {showSource[item.id] ? item.why : "Source"}
                            </button>
                            {item.confidence != null && (
                              <span className="flex items-center gap-1" title={`Extraction confidence: ${Math.round(item.confidence * 100)}%`}>
                                <span className="block w-8 h-1 rounded-full bg-stone-200 overflow-hidden">
                                  <span className="block h-full rounded-full transition-all"
                                    style={{
                                      width: `${item.confidence * 100}%`,
                                      backgroundColor: item.confidence >= 0.85 ? "#22C55E" : item.confidence >= 0.7 ? "#F59E0B" : "#EF4444"
                                    }} />
                                </span>
                                <span className="text-[10px] text-stone-300">{Math.round(item.confidence * 100)}%</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Quick action */}
                        {!item.done && (item.tag === "pay" || item.tag === "sign") && (
                          <button className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all bg-stone-900 text-white hover:bg-stone-700">
                            {item.tag === "pay" ? "Pay" : "Sign"}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Timeline */}
                  <div className="mt-5 flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                    {tl.map((evt, i) => (
                      <div key={i}
                        className={`flex-shrink-0 px-4 py-3 rounded-xl text-sm transition-all ${
                          evt.alert
                            ? "bg-red-50 text-red-700 border border-red-200"
                            : evt.highlight
                              ? "border border-stone-200 bg-white text-stone-800 shadow-sm"
                              : "bg-stone-100 text-stone-500"
                        }`}>
                        <span className="font-mono text-xs opacity-60">{evt.time}</span>
                        <span className="ml-2 font-medium">{evt.label}</span>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        {/* ═══════════ MESSAGES ═══════════ */}
        {tab === "messages" && (
          <div className="space-y-3">
            {openMsg ? (
              /* Detail view */
              <div>
                <button onClick={() => setOpenMsg(null)} className="text-sm text-stone-400 hover:text-stone-600 mb-4 flex items-center gap-1 transition">
                  ← Back
                </button>
                <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm p-6">
                  <div className="flex items-center gap-2 mb-1">
                    {openMsg.child !== "both"
                      ? <Dot color={COLORS[openMsg.child].dot} />
                      : <div className="flex gap-0.5">{KIDS.map(k => <Dot key={k.id} color={k.color.dot} size={6} />)}</div>
                    }
                    <span className="text-xs text-stone-400">{openMsg.time}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-stone-900 mb-1">{openMsg.subject}</h3>
                  <p className="text-sm text-stone-500 mb-6">From {openMsg.from}</p>

                  {/* Extracted facts */}
                  <div className="border-t border-stone-100 pt-5">
                    <p className="text-xs font-medium text-stone-400 mb-3 flex items-center gap-1.5">
                      <Sparkles size={12} /> Extracted from this message
                    </p>
                    <div className="space-y-2">
                      {openMsg.facts.map((fact, i) => (
                        <div key={i} className="flex items-center justify-between p-3.5 bg-stone-50 rounded-xl">
                          <span className="text-sm text-stone-700">{fact}</span>
                          <button className="px-3 py-1.5 bg-stone-900 text-white text-xs font-semibold rounded-lg hover:bg-stone-700 transition">
                            Add to Today
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* List view */
              <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm divide-y divide-stone-100 overflow-hidden">
                {MESSAGES.filter(m => kid === "all" || m.child === kid || m.child === "both").map(msg => (
                  <button key={msg.id} onClick={() => setOpenMsg(msg)}
                    className="w-full text-left px-5 py-4 hover:bg-stone-50 transition flex items-start gap-4">
                    {/* Unread indicator */}
                    <div className="mt-2 flex-shrink-0">
                      {msg.unread
                        ? <span className="block w-2 h-2 rounded-full bg-blue-500" />
                        : <span className="block w-2 h-2" />
                      }
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm ${msg.unread ? "font-semibold text-stone-900" : "text-stone-600"}`}>
                          {msg.from}
                        </span>
                        <span className="text-xs text-stone-300 flex-shrink-0">{msg.time}</span>
                      </div>
                      <p className={`text-sm mt-0.5 truncate ${msg.unread ? "text-stone-700" : "text-stone-400"}`}>
                        {msg.subject}
                      </p>
                      {msg.facts.length > 0 && (
                        <p className="text-xs text-stone-300 mt-1.5 flex items-center gap-1">
                          <Sparkles size={10} /> {msg.facts.length} item{msg.facts.length > 1 ? "s" : ""} extracted
                        </p>
                      )}
                    </div>

                    {/* Child dots */}
                    <div className="flex gap-1 flex-shrink-0 mt-1.5">
                      {msg.child === "both"
                        ? KIDS.map(k => <Dot key={k.id} color={k.color.dot} size={7} />)
                        : <Dot color={COLORS[msg.child]?.dot || "#CBD5E1"} size={7} />
                      }
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══════════ FILES ═══════════ */}
        {tab === "files" && (
          <div className="space-y-3">
            {/* Needs signature section */}
            {FILES.filter(f => f.needsSign).length > 0 && (
              <div className="mb-6">
                <p className="text-xs font-medium text-stone-400 mb-3">Needs your signature</p>
                <div className="space-y-2">
                  {FILES.filter(f => f.needsSign).filter(f => kid === "all" || f.child === kid || f.child === "both").map(file => (
                    <div key={file.id} className="flex items-center justify-between px-5 py-4 bg-white rounded-2xl border border-amber-200 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
                          <FileText size={16} className="text-amber-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-stone-800">{file.name}</p>
                          <p className="text-xs text-stone-400">From {file.from}</p>
                        </div>
                      </div>
                      <button className="px-4 py-2 bg-stone-900 text-white text-xs font-semibold rounded-lg hover:bg-stone-700 transition">
                        Sign
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All files */}
            <p className="text-xs font-medium text-stone-400 mb-3">All files</p>
            <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm divide-y divide-stone-100 overflow-hidden">
              {FILES.filter(f => !f.needsSign).filter(f => kid === "all" || f.child === kid || f.child === "both").map(file => (
                <div key={file.id} className="flex items-center gap-3 px-5 py-4">
                  <div className="w-9 h-9 rounded-xl bg-stone-100 flex items-center justify-center flex-shrink-0">
                    <FileText size={16} className="text-stone-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-stone-700 truncate">{file.name}</p>
                    <p className="text-xs text-stone-300">From {file.from}</p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    {file.child === "both"
                      ? KIDS.map(k => <Dot key={k.id} color={k.color.dot} size={6} />)
                      : <Dot color={COLORS[file.child]?.dot || "#CBD5E1"} size={6} />
                    }
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══════════ FAMILY ═══════════ */}
        {tab === "family" && (
          <div className="space-y-8">
            {/* Kids */}
            <section>
              <p className="text-xs font-medium text-stone-400 mb-3">Children</p>
              <div className="space-y-2">
                {KIDS.map(k => (
                  <div key={k.id} className="flex items-center gap-4 px-5 py-4 bg-white rounded-2xl border border-stone-200/60 shadow-sm">
                    <div className="w-11 h-11 rounded-full flex items-center justify-center text-base font-bold"
                      style={{ backgroundColor: k.color.bg, color: k.color.text }}>
                      {k.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-stone-800">{k.name}</p>
                      <p className="text-xs text-stone-400">{k.detail}</p>
                    </div>
                  </div>
                ))}
                <button className="w-full flex items-center justify-center gap-2 px-5 py-4 rounded-2xl border-2 border-dashed border-stone-200 text-stone-400 hover:border-stone-300 hover:text-stone-500 transition text-sm font-medium">
                  <Plus size={16} /> Add child
                </button>
              </div>
            </section>

            {/* People */}
            <section>
              <p className="text-xs font-medium text-stone-400 mb-3">Family & caregivers</p>
              <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm divide-y divide-stone-100 overflow-hidden">
                {[
                  { name: "You", role: "Full access", active: true },
                  { name: "Alex Chen", role: "Co-parent · Full access", active: true },
                  { name: "Grandma Linda", role: "View only · Invited", active: false },
                ].map((p, i) => (
                  <div key={i} className="flex items-center justify-between px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center text-xs font-bold text-stone-500">
                        {p.name.split(" ").map(w => w[0]).join("")}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-stone-700">{p.name}</p>
                        <p className="text-xs text-stone-400">{p.role}</p>
                      </div>
                    </div>
                    <Dot color={p.active ? "#22C55E" : "#FBBF24"} />
                  </div>
                ))}
              </div>
              <button className="w-full flex items-center justify-center gap-2 px-5 py-4 mt-2 rounded-2xl border-2 border-dashed border-stone-200 text-stone-400 hover:border-stone-300 hover:text-stone-500 transition text-sm font-medium">
                <Plus size={16} /> Invite someone
              </button>
            </section>

            {/* Sources */}
            <section>
              <p className="text-xs font-medium text-stone-400 mb-3">Connected sources</p>
              <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm divide-y divide-stone-100 overflow-hidden">
                {[
                  { name: "Gmail", detail: "chen.family@gmail.com", on: true },
                  { name: "ParentSquare", detail: "Lincoln Elementary", on: true },
                  { name: "Infinite Campus", detail: "Grades & attendance", on: true },
                  { name: "Canvas LMS", detail: "Not connected", on: false },
                ].map((s, i) => (
                  <div key={i} className="flex items-center justify-between px-5 py-4">
                    <div>
                      <p className="text-sm font-medium text-stone-700">{s.name}</p>
                      <p className="text-xs text-stone-400">{s.detail}</p>
                    </div>
                    {s.on ? (
                      <span className="text-xs text-emerald-600 font-medium">Connected</span>
                    ) : (
                      <button className="px-3 py-1.5 bg-stone-900 text-white text-xs font-semibold rounded-lg hover:bg-stone-700 transition">
                        Connect
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Privacy — P2 FIX (#9): Claims match implemented controls */}
            <div className="bg-stone-900 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <Shield size={16} className="text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">Privacy & Data Controls</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <Check size={14} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-stone-400">Encrypted in transit (TLS) and at rest (AES-256). OAuth tokens stored in server-only collections, never exposed to clients.</p>
                </div>
                <div className="flex items-start gap-2">
                  <Check size={14} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-stone-400">Your data is never sold or shared with advertisers.</p>
                </div>
                <div className="flex items-start gap-2">
                  <Check size={14} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-stone-400">Role-based access: viewers can check off items but cannot modify deadlines or family settings.</p>
                </div>
                <div className="flex items-start gap-2">
                  <Check size={14} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-stone-400">Immutable audit log tracks all data access and changes.</p>
                </div>
                <div className="flex gap-2 mt-4">
                  <button className="px-4 py-2 bg-white/10 text-white text-xs font-semibold rounded-lg hover:bg-white/20 transition">
                    Export All Data
                  </button>
                  <button className="px-4 py-2 bg-red-500/20 text-red-300 text-xs font-semibold rounded-lg hover:bg-red-500/30 transition">
                    Delete All Data
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── FOOTER ── */}
      <footer className="border-t border-stone-200/60 bg-white mt-12">
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center justify-between">
          <span className="text-xs text-stone-300">Backpack — Everything school, in one place.</span>
          <div className="flex gap-4 text-xs text-stone-300">
            <a href="#" className="hover:text-stone-500 transition">Privacy</a>
            <a href="#" className="hover:text-stone-500 transition">Help</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
