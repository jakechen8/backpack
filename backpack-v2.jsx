import { useState, useEffect, useRef, useMemo } from "react";
import {
  Check, ArrowRight, Mail, Sparkles, ChevronRight, Eye,
  Package, Shield, Clock, Users, Zap, Menu, X, Star,
  Calendar, Share2, Copy, ChevronLeft, Trash2, Plus,
  UserPlus, Filter, Sun, Sunrise
} from "lucide-react";

/*
 * BACKPACK v4 — The Accumulating Brain
 *
 * Landing page: untouched (it's great)
 * App: completely rebuilt with:
 *   1. Multi-email memory (paste many emails, items accumulate)
 *   2. Week-at-a-glance strip
 *   3. Multi-child tagging (tap to assign)
 *   4. Share plan as text (copy to clipboard for co-parent)
 *   5. "Tomorrow" one-tap filter
 *   6. Email history sidebar
 *   7. Smart duplicate detection
 *   8. Manual quick-add items
 *
 * Design: same radical calm. Features revealed progressively.
 */

// ─── SAMPLE EMAILS ────────────────────────────────────────────
const SAMPLE_EMAILS = [
  {
    id: "s1",
    from: "Mrs. Rodriguez",
    subject: "This Week — Spirit Day, Library Books & Field Trip",
    body: `Hi Lincoln families!

A few reminders for this week:

1. Tomorrow is Spirit Day — please wear your school colors shirt!

2. Library books are due back by Wednesday. Maya, please remember to bring Matilda.

3. The Science Museum field trip is this Friday. Permission slips AND the $10 fee are due by Thursday. You can pay online or send cash/check.

4. Early release Wednesday at 2:15 PM (instead of 3:15).

5. Picture Day is next Monday! Order forms went home last week.

Mrs. Rodriguez, 3rd Grade`,
    items: [
      { text: "Wear school colors shirt", tag: "wear", day: 1, source: "Mrs. Rodriguez" },
      { text: "Return library book (Matilda)", tag: "bring", day: 3, source: "Mrs. Rodriguez", child: "Maya" },
      { text: "Sign permission slip — Science Museum", tag: "sign", day: 4, source: "Mrs. Rodriguez" },
      { text: "Pay $10 field trip fee", tag: "pay", day: 4, source: "Mrs. Rodriguez" },
      { text: "Early release 2:15 PM", tag: "event", day: 3, source: "Mrs. Rodriguez" },
      { text: "Picture Day — bring order form", tag: "event", day: 8, source: "Mrs. Rodriguez" },
    ],
  },
  {
    id: "s2",
    from: "Mr. Patterson",
    subject: "5th Grade — Math Test & Conference Sign-Up",
    body: `Hello 5th grade parents,

Math tests are coming home today — please sign and return by Wednesday.

Also, parent-teacher conferences are open for sign-up. Please RSVP by Friday at lincoln.edu/conferences. Slots fill fast!

Ethan did great on his science project. Keep up the good work!

Mr. Patterson, 5th Grade`,
    items: [
      { text: "Sign & return math test", tag: "sign", day: 3, source: "Mr. Patterson", child: "Ethan" },
      { text: "RSVP parent-teacher conference", tag: "sign", day: 5, source: "Mr. Patterson", child: "Ethan" },
    ],
  },
  {
    id: "s3",
    from: "Coach Davis",
    subject: "Basketball Practice Change + Gear Reminder",
    body: `Hi basketball families,

Practice this week is moved to Thursday at 4:00 PM in the main gym (not Tuesday).

Please make sure your child brings their basketball shoes and a water bottle. We also need a parent volunteer to help with equipment — reply to this email if you can help.

Coach Davis`,
    items: [
      { text: "Basketball practice — Thursday 4 PM (moved)", tag: "event", day: 4, source: "Coach Davis", child: "Ethan" },
      { text: "Bring basketball shoes + water bottle", tag: "bring", day: 4, source: "Coach Davis", child: "Ethan" },
      { text: "Volunteer for equipment help (reply Coach Davis)", tag: "sign", day: 4, source: "Coach Davis" },
    ],
  },
];

const BLOG_POSTS = [
  { slug: "stop-missing-school-deadlines", category: "Playbook", title: "How to Stop Missing School Deadlines (Without Losing Your Mind)", excerpt: "You check three apps, two email threads, and a crumpled flyer in a backpack. Sound familiar? There is a better way.", date: "March 2026", readTime: "4 min" },
  { slug: "school-email-overload", category: "Playbook", title: "School Email Overload Is Real — Here's What to Do About It", excerpt: "The average school parent receives 47 school-related emails per week. Most contain buried action items that are easy to miss.", date: "March 2026", readTime: "5 min" },
  { slug: "launchpad-morning-routine", category: "Workflow", title: "The 7-Minute Morning Launchpad That Prevents 90% of School Chaos", excerpt: "A practical sequence: identify risk, clear top 3 actions, send one co-parent handoff, and leave with confidence.", date: "March 2026", readTime: "6 min" },
  { slug: "focus-sprint-method", category: "Workflow", title: "Focus Sprint: One-Task-at-a-Time for Busy Parents", excerpt: "When your brain is overloaded, sequencing beats motivation. This is the exact sprint method we use in Backpack.", date: "March 2026", readTime: "4 min" },
  { slug: "co-parenting-school-logistics", category: "Co-Parenting", title: "Co-Parenting School Logistics Without the Group Chat Chaos", excerpt: "When two households need the same information about picture day, permission slips, and early release schedules.", date: "February 2026", readTime: "3 min" },
  { slug: "text-templates-coparent", category: "Co-Parenting", title: "12 Co-Parent Text Templates for School Logistics", excerpt: "Prewritten handoff messages that reduce friction, avoid blame, and make action items explicit.", date: "February 2026", readTime: "7 min" },
  { slug: "why-school-apps-dont-work", category: "Product", title: "Why School Apps Fail Parents (And What Would Actually Help)", excerpt: "ParentSquare, ClassDojo, Remind, Seesaw, Infinite Campus, Canvas. Parents don't need another app. They need one plan.", date: "February 2026", readTime: "6 min" },
  { slug: "decision-fatigue-and-parenting-ops", category: "Research", title: "Decision Fatigue and Family Operations: What the Data Actually Says", excerpt: "When decisions are sequenced and batched, completion rates rise. Here's how to apply that to school logistics.", date: "January 2026", readTime: "8 min" },
];

const BUILD_QUEUE = [
  { title: "Auto-calendar conflict detection", status: "Now", detail: "Detect contradictory times across email, calendar, and app notices before parents are impacted." },
  { title: "One-tap payment + signature flow", status: "Now", detail: "Batch all sign and pay actions by due date so parents can clear them in a single session." },
  { title: "School-specific intelligence packs", status: "Next", detail: "Learn each school's language and convert vague reminders into concrete action plans." },
  { title: "Late-night panic mode", status: "Next", detail: "Generate a 2-minute emergency plan when it's already late and tomorrow is unclear." },
  { title: "Predictive readiness score by child", status: "Later", detail: "Forecast tomorrow's likely misses and notify parents before problems surface." },
];

// ─── HELPERS ──────────────────────────────────────────────────
const TAG_STYLE = {
  wear:  { label: "Wear",  color: "#7C3AED", bg: "#F5F3FF" },
  bring: { label: "Bring", color: "#D97706", bg: "#FFFBEB" },
  sign:  { label: "Sign",  color: "#DC2626", bg: "#FEF2F2" },
  pay:   { label: "Pay",   color: "#059669", bg: "#ECFDF5" },
  event: { label: "Event", color: "#2563EB", bg: "#EFF6FF" },
};

const TAG_PRIORITY = { pay: 5, sign: 5, event: 4, bring: 3, wear: 2 };
const TAG_MINUTES = { pay: 3, sign: 2, event: 1, bring: 4, wear: 1 };
const AUTOPILOT_MODES = [
  { id: "school-run", label: "School run", hint: "Next 12h" },
  { id: "tonight-reset", label: "Tonight reset", hint: "Set tomorrow up" },
  { id: "weekend-plan", label: "Weekend plan", hint: "Future prep" },
];

const CHILD_COLORS = {
  Maya:  { dot: "#8B5CF6", bg: "#F5F3FF", text: "#6D28D9" },
  Ethan: { dot: "#3B82F6", bg: "#EFF6FF", text: "#1D4ED8" },
};

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const today = new Date();
const getWeekDay = (offset) => {
  const d = new Date(today);
  d.setDate(d.getDate() + offset);
  return { short: DAYS[d.getDay() === 0 ? 6 : d.getDay() - 1], date: d.getDate(), offset, full: d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }) };
};
// Build a Mon-Fri week starting from today
const thisWeek = [0, 1, 2, 3, 4, 5, 6].map(getWeekDay);

let _id = 100;
const genId = () => ++_id;

const STORAGE_KEY = "backpack_mvp_state_v2";
const DEFAULT_CHILDREN = ["Maya", "Ethan"];
const WEEKDAY_INDEX = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6,
};
const MONTH_PATTERN = "(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)";
const ACTION_KEYWORDS = /\b(bring|wear|sign|return|pay|fee|due|submit|rsvp|reply|volunteer|pack|send|complete|attend|picture day|early release|practice|meeting|conference|waiver|permission|register)\b/i;
const IGNORE_LINE = /\b(hello|hi\b|good morning|good afternoon|thanks|thank you|keep up the good work|best,|sincerely)\b/i;

const toTitleCase = (value) => value
  .trim()
  .toLowerCase()
  .split(/\s+/)
  .map((part) => (part ? `${part[0].toUpperCase()}${part.slice(1)}` : ""))
  .join(" ");

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeItemText = (text) => {
  const cleaned = text
    .replace(/^[-*•]\s*/, "")
    .replace(/^\d+[\).\-\:]\s*/, "")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.replace(/[.;,:]+$/, "");
};

const extractSourceName = (rawText) => {
  const fromMatch = rawText.match(/^\s*from:\s*(.+)$/im);
  if (fromMatch?.[1]) {
    return fromMatch[1].replace(/<[^>]+>/g, "").split(",")[0].trim();
  }
  const signatureMatch = rawText.match(/\n\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s*(?:,|\n|$)/);
  if (signatureMatch?.[1]) return signatureMatch[1].trim();
  return "School email";
};

const extractSubjectLine = (rawText) => {
  const subjectMatch = rawText.match(/^\s*subject:\s*(.+)$/im);
  if (subjectMatch?.[1]) return subjectMatch[1].trim();
  const firstLine = rawText.split("\n").map((line) => line.trim()).find((line) => line.length > 0);
  return firstLine ? firstLine.slice(0, 90) : "School update";
};

const dayOffsetFromWeekday = (dayName, isNextWeek) => {
  const target = WEEKDAY_INDEX[dayName.toLowerCase()];
  if (target === undefined) return null;
  const current = new Date().getDay();
  let delta = (target - current + 7) % 7;
  if (delta === 0) delta = 7;
  if (isNextWeek) delta += 7;
  return Math.min(6, Math.max(0, delta));
};

const detectDayOffset = (text) => {
  const value = text.toLowerCase();
  if (value.includes("today")) return 0;
  if (value.includes("tomorrow")) return 1;

  const weekdayMatch = value.match(/\b(next\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/);
  if (weekdayMatch) {
    const dayOffset = dayOffsetFromWeekday(weekdayMatch[2], Boolean(weekdayMatch[1]));
    if (dayOffset !== null) return dayOffset;
  }

  const dateRegex = new RegExp(`\\b${MONTH_PATTERN}\\s+\\d{1,2}\\b`, "i");
  const dateMatch = value.match(dateRegex);
  if (dateMatch?.[0]) {
    const candidate = new Date(`${dateMatch[0]}, ${new Date().getFullYear()}`);
    if (!Number.isNaN(candidate.getTime())) {
      const delta = Math.ceil((candidate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return Math.min(6, Math.max(0, delta));
    }
  }

  return 1;
};

const classifyTag = (text) => {
  const value = text.toLowerCase();
  if (/\b(pay|payment|fee|balance|cash|check|money|\$\d+)/i.test(value)) return "pay";
  if (/\b(sign|signature|permission|waiver|rsvp|reply|volunteer|form|submit|register)\b/i.test(value)) return "sign";
  if (/\b(wear|shirt|uniform|colors day|costume)\b/i.test(value)) return "wear";
  if (/\b(early release|practice|meeting|conference|event|picture day|dismissal|schedule|at\s+\d{1,2}(:\d{2})?\s*(am|pm)?)\b/i.test(value)) return "event";
  return "bring";
};

const detectChildName = (text, children) => {
  for (const child of children) {
    if (new RegExp(`\\b${escapeRegExp(child)}\\b`, "i").test(text)) return child;
  }
  return null;
};

const scoreCandidate = (line) => {
  if (!line || line.length < 8) return 0;
  if (IGNORE_LINE.test(line) && !ACTION_KEYWORDS.test(line)) return 0;
  let score = 0;
  if (ACTION_KEYWORDS.test(line)) score += 2;
  if (/\b(today|tomorrow|next|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i.test(line)) score += 1;
  if (/\$\d+|\bdue\b|\bat\s+\d{1,2}(:\d{2})?\s*(am|pm)\b/i.test(line)) score += 1;
  if (/\b(remember|please)\b/i.test(line)) score += 1;
  return score;
};

const extractActionLines = (rawText) => {
  const lines = rawText
    .split("\n")
    .map((line) => normalizeItemText(line))
    .filter(Boolean);
  const candidates = [];

  lines.forEach((line) => {
    if (/^(from|to|subject|sent):/i.test(line)) return;
    const segments = line.length > 120
      ? line.split(/(?<=[.!?])\s+/).map((segment) => normalizeItemText(segment)).filter(Boolean)
      : [line];
    segments.forEach((segment) => {
      if (scoreCandidate(segment) >= 2) candidates.push(segment);
    });
  });

  return candidates;
};

const extractItemsFromEmail = (rawText, children, fallbackSource) => {
  const source = extractSourceName(rawText) || fallbackSource || "School email";
  const candidates = extractActionLines(rawText);
  const seen = new Set();
  return candidates
    .map((line) => {
      const text = normalizeItemText(line);
      if (!text) return null;
      const dedupeKey = text.toLowerCase();
      if (seen.has(dedupeKey)) return null;
      seen.add(dedupeKey);
      return {
        id: genId(),
        text,
        tag: classifyTag(text),
        day: detectDayOffset(text),
        source,
        child: detectChildName(text, children),
        done: false,
      };
    })
    .filter(Boolean)
    .slice(0, 14);
};

const loadSavedAppState = () => {
  if (typeof window === "undefined") {
    return { items: [], emails: [], familyChildren: DEFAULT_CHILDREN };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { items: [], emails: [], familyChildren: DEFAULT_CHILDREN };
    const parsed = JSON.parse(raw);
    return {
      items: Array.isArray(parsed.items) ? parsed.items : [],
      emails: Array.isArray(parsed.emails) ? parsed.emails : [],
      familyChildren: Array.isArray(parsed.familyChildren) && parsed.familyChildren.length > 0
        ? parsed.familyChildren
        : DEFAULT_CHILDREN,
    };
  } catch {
    return { items: [], emails: [], familyChildren: DEFAULT_CHILDREN };
  }
};

// ─── MAIN APP ─────────────────────────────────────────────────
export default function Backpack() {
  const [page, setPage] = useState("home");
  const [mobileMenu, setMobileMenu] = useState(false);
  const go = (p) => { setPage(p); setMobileMenu(false); window.scrollTo(0, 0); };

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
      {/* ══════════ NAV ══════════ */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg border-b border-stone-100">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between h-14">
          <button onClick={() => go("home")} className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-stone-900 flex items-center justify-center">
              <Package size={13} className="text-white" />
            </div>
            <span className="text-sm font-semibold text-stone-900 tracking-tight">Backpack</span>
          </button>
          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => go("home")} className="text-sm text-stone-500 hover:text-stone-900 transition">Home</button>
            <button onClick={() => go("app")} className="text-sm text-stone-500 hover:text-stone-900 transition">Try It</button>
            <button onClick={() => go("blog")} className="text-sm text-stone-500 hover:text-stone-900 transition">Blog</button>
            <button onClick={() => go("app")} className="px-4 py-2 bg-stone-900 text-white text-sm font-medium rounded-lg hover:bg-stone-700 transition">
              Get Started
            </button>
          </div>
          <button onClick={() => setMobileMenu(!mobileMenu)} className="md:hidden p-2 text-stone-500">
            {mobileMenu ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        {mobileMenu && (
          <div className="md:hidden bg-white border-t border-stone-100 px-6 py-4 space-y-3">
            <button onClick={() => go("home")} className="block w-full text-left text-sm text-stone-700 py-2">Home</button>
            <button onClick={() => go("app")} className="block w-full text-left text-sm text-stone-700 py-2">Try It</button>
            <button onClick={() => go("blog")} className="block w-full text-left text-sm text-stone-700 py-2">Blog</button>
          </div>
        )}
      </nav>

      <div className="pt-14">
        {page === "home" && <HomePage onTryIt={() => go("app")} onBlog={() => go("blog")} />}
        {page === "app" && <AppPage />}
        {page === "blog" && <BlogPage />}
      </div>

      {/* ══════════ FOOTER ══════════ */}
      <footer className="border-t border-stone-100 mt-24">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-md bg-stone-900 flex items-center justify-center"><Package size={11} className="text-white" /></div>
                <span className="text-sm font-semibold text-stone-900">Backpack</span>
              </div>
              <p className="text-xs text-stone-400 leading-relaxed">Everything school, in one place.</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-stone-900 mb-3">Product</p>
              <button onClick={() => go("app")} className="block text-xs text-stone-400 hover:text-stone-600 transition">Try the Demo</button>
            </div>
            <div>
              <p className="text-xs font-semibold text-stone-900 mb-3">Resources</p>
              <button onClick={() => go("blog")} className="block text-xs text-stone-400 hover:text-stone-600 transition">Blog</button>
            </div>
            <div>
              <p className="text-xs font-semibold text-stone-900 mb-3">Legal</p>
              <p className="text-xs text-stone-400">Privacy Policy</p>
              <p className="text-xs text-stone-400">Terms of Service</p>
            </div>
          </div>
          <div className="border-t border-stone-100 mt-8 pt-6 flex items-center justify-between">
            <p className="text-xs text-stone-300">&copy; 2026 Backpack.</p>
            <div className="flex items-center gap-1.5">
              <Shield size={12} className="text-stone-300" />
              <p className="text-xs text-stone-300">Your data is never sold.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}


// ══════════════════════════════════════════════════════════════
// HOME PAGE (unchanged — it's great)
// ══════════════════════════════════════════════════════════════
function HomePage({ onTryIt, onBlog }) {
  const [demoState, setDemoState] = useState("idle");
  const [demoItems, setDemoItems] = useState([]);
  const [demoText, setDemoText] = useState("");
  const textRef = useRef(null);
  const sampleEmail = SAMPLE_EMAILS[0];
  const sampleItems = sampleEmail.items;

  const runDemo = () => {
    setDemoState("typing"); setDemoItems([]); setDemoText("");
    let i = 0;
    const full = `From: ${sampleEmail.from}\nSubject: ${sampleEmail.subject}\n\n${sampleEmail.body}`;
    const typeInterval = setInterval(() => {
      if (i < full.length) {
        const chunk = Math.min(8, full.length - i);
        setDemoText(full.substring(0, i + chunk)); i += chunk;
        if (textRef.current) textRef.current.scrollTop = textRef.current.scrollHeight;
      } else {
        clearInterval(typeInterval); setDemoState("extracting");
        let j = 0;
        const itemInterval = setInterval(() => {
          if (j < sampleItems.length) { setDemoItems(prev => [...prev, sampleItems[j]]); j++; }
          else { clearInterval(itemInterval); setDemoState("done"); }
        }, 300);
      }
    }, 12);
  };

  return (
    <div>
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 md:pt-28 md:pb-24">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full mb-6">
            <Sparkles size={12} className="text-amber-600" />
            <span className="text-xs font-medium text-amber-700">AI-powered school organizer for parents</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-stone-900 leading-[1.1] tracking-tight">
            School emails in.<br /><span className="text-stone-400">Your plan out.</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-stone-500 leading-relaxed max-w-lg">
            Forward a school email. Backpack reads it and tells you exactly what your kid needs — what to bring, sign, pay, and when.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <button onClick={onTryIt} className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-stone-900 text-white text-sm font-medium rounded-xl hover:bg-stone-700 transition shadow-lg shadow-stone-200">
              Try it free <ArrowRight size={16} />
            </button>
            <button onClick={runDemo} className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-stone-700 text-sm font-medium rounded-xl border border-stone-200 hover:bg-stone-50 transition">
              Watch the demo
            </button>
          </div>
        </div>
      </section>

      {/* Live Demo */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="bg-stone-50 rounded-3xl border border-stone-200 overflow-hidden p-4 md:p-8">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3"><Mail size={14} className="text-stone-400" /><span className="text-xs font-medium text-stone-400">SCHOOL EMAIL</span></div>
              <div ref={textRef} className="bg-white rounded-2xl border border-stone-200 p-5 h-80 overflow-y-auto text-sm text-stone-600 leading-relaxed font-mono whitespace-pre-wrap">
                {demoState === "idle" ? (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <Mail size={32} className="text-stone-200 mb-3" />
                    <p className="text-stone-400 font-sans text-sm">Paste a school email here</p>
                    <button onClick={runDemo} className="mt-4 px-4 py-2 bg-stone-900 text-white text-xs font-sans font-medium rounded-lg hover:bg-stone-700 transition">Run demo</button>
                  </div>
                ) : <span>{demoText}<span className="animate-pulse">|</span></span>}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={14} className="text-amber-500" /><span className="text-xs font-medium text-stone-400">BACKPACK EXTRACTS</span>
                {demoState === "extracting" && <span className="text-xs text-amber-500 animate-pulse">Reading...</span>}
              </div>
              <div className="bg-white rounded-2xl border border-stone-200 p-5 h-80 overflow-y-auto">
                {demoItems.length === 0 && demoState !== "extracting" ? (
                  <div className="h-full flex flex-col items-center justify-center"><div className="w-12 h-12 rounded-2xl bg-stone-50 flex items-center justify-center mb-3"><Check size={20} className="text-stone-200" /></div><p className="text-stone-300 text-sm">Your action items appear here</p></div>
                ) : (
                  <div className="space-y-2">
                    {demoItems.map((item, i) => { const tag = TAG_STYLE[item.tag] || TAG_STYLE.event; return (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-xl border border-stone-100" style={{ animation: "fadeIn .3s ease-out" }}>
                        <div className="w-5 h-5 mt-0.5 rounded-md border-2 border-stone-200 flex-shrink-0" />
                        <div className="flex-1"><p className="text-sm text-stone-800">{item.text}</p><div className="flex items-center gap-2 mt-1"><span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ color: tag.color, backgroundColor: tag.bg }}>{tag.label}</span>{item.child && <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ color: CHILD_COLORS[item.child]?.text || "#666", backgroundColor: CHILD_COLORS[item.child]?.bg || "#f5f5f5" }}>{item.child}</span>}</div></div>
                      </div>
                    ); })}
                    {demoState === "done" && <div className="mt-4 p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-center"><p className="text-sm text-emerald-700 font-medium">{sampleItems.length} action items found</p></div>}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }`}</style>
      </section>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <h2 className="text-2xl md:text-3xl font-bold text-stone-900 text-center mb-4">Three steps. Zero stress.</h2>
        <p className="text-center text-stone-400 mb-12 max-w-md mx-auto">No app to install at school. Works with any school, any district, today.</p>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: Mail, title: "Forward the email", desc: "Forward any school email to your unique Backpack address. Or paste it." },
            { icon: Sparkles, title: "AI reads it", desc: "Extracts dates, action items, things to bring, payments due, and schedule changes." },
            { icon: Check, title: "Check it off", desc: "See what each kid needs. Check things off. Share with your co-parent." },
          ].map((s, i) => (
            <div key={i} className="text-center">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-stone-50 border border-stone-100 flex items-center justify-center mb-4"><s.icon size={22} className="text-stone-700" /></div>
              <h3 className="text-base font-semibold text-stone-900 mb-2">{s.title}</h3>
              <p className="text-sm text-stone-400 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pain points */}
      <section className="bg-stone-50 border-y border-stone-100">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <h2 className="text-2xl md:text-3xl font-bold text-stone-900 text-center mb-12">Sound familiar?</h2>
          <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto">
            {["You missed picture day because the flyer was buried in a newsletter","Your kid needed a poster board and you found out at 9 PM","You paid the field trip fee twice because two apps sent reminders","Your co-parent asked what time early release is — and you didn't know either","You have 4 school apps installed and still feel behind","You dread opening your email on Sunday night"].map((p, i) => (
              <div key={i} className="flex items-start gap-3 p-4 bg-white rounded-xl border border-stone-100"><p className="text-sm text-stone-600">{p}</p></div>
            ))}
          </div>
          <div className="text-center mt-10"><button onClick={onTryIt} className="inline-flex items-center gap-2 px-6 py-3 bg-stone-900 text-white text-sm font-medium rounded-xl hover:bg-stone-700 transition">Try Backpack free <ArrowRight size={14} /></button></div>
        </div>
      </section>

      {/* Privacy */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <div className="max-w-2xl mx-auto text-center">
          <Shield size={28} className="mx-auto text-stone-300 mb-4" />
          <h2 className="text-2xl md:text-3xl font-bold text-stone-900 mb-4">Privacy is the product.</h2>
          <p className="text-stone-400 mb-8 leading-relaxed">We handle information about your kids. No ads, no data selling, no creepy tracking.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[{ label: "Encrypted", sub: "In transit + at rest" },{ label: "No ads", sub: "Ever" },{ label: "Your data", sub: "Export or delete anytime" },{ label: "Compliant", sub: "FERPA & COPPA aware" }].map((t, i) => (
              <div key={i} className="p-4 bg-stone-50 rounded-xl"><p className="text-sm font-semibold text-stone-800">{t.label}</p><p className="text-xs text-stone-400 mt-0.5">{t.sub}</p></div>
            ))}
          </div>
        </div>
      </section>

      {/* Blog preview */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="flex items-center justify-between mb-8"><h2 className="text-2xl font-bold text-stone-900">From the blog</h2><button onClick={onBlog} className="text-sm text-stone-400 hover:text-stone-600 flex items-center gap-1 transition">All posts <ChevronRight size={14} /></button></div>
        <div className="grid md:grid-cols-2 gap-4">
          {BLOG_POSTS.slice(0, 2).map((post, i) => (
            <article key={i} className="p-6 bg-stone-50 rounded-2xl border border-stone-100 hover:border-stone-200 transition cursor-pointer group">
              <div className="flex items-center gap-2 text-xs text-stone-400 mb-3"><span>{post.date}</span><span className="w-1 h-1 rounded-full bg-stone-300" /><span>{post.readTime} read</span></div>
              <h3 className="text-base font-semibold text-stone-900 mb-2 group-hover:text-stone-700 transition leading-snug">{post.title}</h3>
              <p className="text-sm text-stone-400 leading-relaxed">{post.excerpt}</p>
            </article>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="bg-stone-900 rounded-3xl p-10 md:p-16 text-center">
          <h2 className="text-2xl md:text-4xl font-bold text-white mb-4">Know what your kid needs.<br />In 10 seconds.</h2>
          <p className="text-stone-400 mb-8 max-w-md mx-auto">Stop digging through emails. Start your morning knowing exactly what to pack, sign, and pay.</p>
          <button onClick={onTryIt} className="inline-flex items-center gap-2 px-8 py-4 bg-white text-stone-900 text-sm font-semibold rounded-xl hover:bg-stone-100 transition">Get started free <ArrowRight size={16} /></button>
        </div>
      </section>
    </div>
  );
}


// ══════════════════════════════════════════════════════════════
// APP PAGE — The Real Product
// ══════════════════════════════════════════════════════════════
function AppPage() {
  const initialState = useMemo(() => loadSavedAppState(), []);
  const [allItems, setAllItems] = useState(initialState.items);
  const [emails, setEmails] = useState(initialState.emails);
  const [inputText, setInputText] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [showInput, setShowInput] = useState(true);
  const [dayFilter, setDayFilter] = useState(null); // null = all, number = day offset
  const [childFilter, setChildFilter] = useState(null);
  const [showSource, setShowSource] = useState({});
  const [copied, setCopied] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickText, setQuickText] = useState("");
  const [quickTag, setQuickTag] = useState("bring");
  const [quickDay, setQuickDay] = useState(1);
  const [editingChild, setEditingChild] = useState(null);
  const [sprintMode, setSprintMode] = useState(false);
  const [sprintQueue, setSprintQueue] = useState([]);
  const [sprintStep, setSprintStep] = useState(0);
  const [handoffCopied, setHandoffCopied] = useState(false);
  const [autopilotMode, setAutopilotMode] = useState("school-run");
  const [autopilotCopied, setAutopilotCopied] = useState(false);
  const [childPingCopied, setChildPingCopied] = useState("");
  const [familyChildren, setFamilyChildren] = useState(initialState.familyChildren);
  const [childDraft, setChildDraft] = useState("");
  const [extractStatus, setExtractStatus] = useState("");

  // Children detected from items
  const allChildren = useMemo(() => {
    const set = new Set([...familyChildren, ...allItems.map(i => i.child).filter(Boolean)]);
    return [...set];
  }, [familyChildren, allItems]);

  // Pick a sample email to simulate
  const sampleIndex = useRef(0);

  const handleInstantSetup = () => {
    const seen = new Set();
    const seededItems = [];
    const seededEmails = [];
    SAMPLE_EMAILS.forEach((sample) => {
      const uniqueItems = sample.items
        .filter((item) => {
          const key = item.text.toLowerCase();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .map((item) => ({ ...item, id: genId(), done: false }));
      seededItems.push(...uniqueItems);
      seededEmails.push({ ...sample, addedAt: new Date() });
    });
    setAllItems(seededItems);
    setEmails(seededEmails);
    setShowInput(false);
    setDayFilter(null);
    setChildFilter(null);
    setExtractStatus("Loaded a full sample week. You can now replace with your real emails.");
  };

  const handlePasteSample = () => {
    const sample = SAMPLE_EMAILS[sampleIndex.current % SAMPLE_EMAILS.length];
    setInputText(`From: ${sample.from}\nSubject: ${sample.subject}\n\n${sample.body}`);
    sampleIndex.current++;
    setExtractStatus("");
  };

  const handleExtract = () => {
    if (!inputText.trim()) return;
    setExtracting(true);
    setExtractStatus("");

    const source = extractSourceName(inputText);
    const subject = extractSubjectLine(inputText);
    const extractedItems = extractItemsFromEmail(inputText, allChildren, source);
    const existingTexts = new Set(allItems.map((item) => item.text.toLowerCase()));
    const newItems = extractedItems.filter((item) => !existingTexts.has(item.text.toLowerCase()));

    if (extractedItems.length === 0) {
      setTimeout(() => {
        setExtracting(false);
        setExtractStatus("No clear action items detected. Try pasting the full message with bullets or due dates.");
      }, 400);
      return;
    }

    if (newItems.length === 0) {
      setTimeout(() => {
        setExtracting(false);
        setEmails((prev) => [...prev, {
          id: `email-${Date.now()}`,
          from: source,
          subject,
          items: extractedItems,
          duplicate: true,
          addedAt: new Date(),
        }]);
        setInputText("");
        setShowInput(false);
        setExtractStatus("Duplicate detected. No new items were added.");
      }, 500);
      return;
    }

    let i = 0;
    const interval = setInterval(() => {
      if (i < newItems.length) {
        setAllItems((prev) => [...prev, newItems[i]]);
        i++;
      } else {
        clearInterval(interval);
        setExtracting(false);
        setEmails((prev) => [...prev, {
          id: `email-${Date.now()}`,
          from: source,
          subject,
          items: extractedItems,
          addedAt: new Date(),
        }]);
        setInputText("");
        setShowInput(false);
        setExtractStatus(`Added ${newItems.length} new action item${newItems.length === 1 ? "" : "s"} from this email.`);
      }
    }, 200);
  };

  const addChildName = () => {
    const normalized = toTitleCase(childDraft);
    if (!normalized) return;
    if (allChildren.some((child) => child.toLowerCase() === normalized.toLowerCase())) {
      setChildDraft("");
      return;
    }
    setFamilyChildren((prev) => [...prev, normalized]);
    setChildDraft("");
  };

  const removeChildName = (name) => {
    setFamilyChildren((prev) => prev.filter((child) => child !== name));
    setAllItems((prev) => prev.map((item) => (item.child === name ? { ...item, child: null } : item)));
    if (childFilter === name) setChildFilter(null);
  };

  const handleQuickAdd = () => {
    if (!quickText.trim()) return;
    setAllItems(prev => [...prev, { id: genId(), text: quickText, tag: quickTag, day: quickDay, source: "You", done: false, child: null }]);
    setQuickText("");
    setShowQuickAdd(false);
  };

  const toggle = (id) => setAllItems(prev => prev.map(i => i.id === id ? { ...i, done: !i.done } : i));
  const removeItem = (id) => setAllItems(prev => prev.filter(i => i.id !== id));
  const assignChild = (id, child) => {
    setAllItems(prev => prev.map(i => i.id === id ? { ...i, child: i.child === child ? null : child } : i));
    setEditingChild(null);
  };

  // Filter items
  const filteredItems = useMemo(() => {
    let result = allItems;
    if (dayFilter !== null) result = result.filter(i => i.day === dayFilter);
    if (childFilter) result = result.filter(i => i.child === childFilter || !i.child);
    return [...result].sort((a, b) => a.done - b.done || a.day - b.day || b.tag.localeCompare(a.tag));
  }, [allItems, dayFilter, childFilter]);

  // Week summary
  const weekData = useMemo(() => {
    return thisWeek.map(d => ({
      ...d,
      count: allItems.filter(i => i.day === d.offset && !i.done).length,
      hasUrgent: allItems.some(i => i.day === d.offset && !i.done && (i.tag === "sign" || i.tag === "pay")),
    }));
  }, [allItems]);

  const pendingItems = useMemo(() => allItems.filter(i => !i.done), [allItems]);
  const totalCount = allItems.length;
  const pendingCount = pendingItems.length;
  const doneCount = totalCount - pendingCount;

  const getDayLabel = (offset) => {
    const day = thisWeek.find((d) => d.offset === offset);
    return day ? `${day.short} ${day.date}` : "Later";
  };

  const rankedPendingItems = useMemo(() => {
    const score = (item) => {
      const tagScore = (TAG_PRIORITY[item.tag] || 1) * 10;
      const dayScore = item.day === 0 ? 35 : item.day === 1 ? 24 : item.day <= 3 ? 14 : 6;
      const childScore = item.child ? 4 : 0;
      return tagScore + dayScore + childScore;
    };
    return [...pendingItems].sort((a, b) => score(b) - score(a) || a.day - b.day);
  }, [pendingItems]);

  const launchpadItems = rankedPendingItems.slice(0, 5);
  const launchpadNow = launchpadItems.slice(0, 3);
  const launchpadMinutes = launchpadNow.reduce((sum, item) => sum + (TAG_MINUTES[item.tag] || 2), 0);

  const autopilotItems = useMemo(() => {
    if (autopilotMode === "school-run") {
      return rankedPendingItems
        .filter((item) => item.day <= 1 || item.tag === "sign" || item.tag === "pay")
        .slice(0, 4);
    }
    if (autopilotMode === "tonight-reset") {
      return rankedPendingItems
        .filter((item) => item.day <= 2 || item.tag === "bring" || item.tag === "wear")
        .slice(0, 4);
    }
    return rankedPendingItems
      .filter((item) => item.day >= 2)
      .slice(0, 4);
  }, [rankedPendingItems, autopilotMode]);

  const autopilotMinutes = autopilotItems.reduce((sum, item) => sum + (TAG_MINUTES[item.tag] || 2), 0);

  const actionBatches = useMemo(() => {
    const batches = {};
    pendingItems.forEach((item) => {
      if (!(item.tag === "sign" || item.tag === "pay")) return;
      const key = `${item.source || "Unknown"}::${item.day}`;
      if (!batches[key]) {
        batches[key] = { key, source: item.source || "Unknown source", day: item.day, items: [] };
      }
      batches[key].items.push(item);
    });
    return Object.values(batches)
      .map((batch) => ({ ...batch, minutes: Math.max(2, batch.items.length * 2) }))
      .sort((a, b) => a.day - b.day || b.items.length - a.items.length)
      .slice(0, 3);
  }, [pendingItems]);

  const riskItems = useMemo(() => {
    return rankedPendingItems
      .filter((item) => item.day <= 1 || (item.day <= 2 && (item.tag === "sign" || item.tag === "pay")))
      .slice(0, 3);
  }, [rankedPendingItems]);

  const riskScore = totalCount === 0
    ? 0
    : Math.min(100, Math.round((riskItems.length / 3) * 60 + (pendingCount / totalCount) * 40));
  const riskTone = riskScore >= 70
    ? { text: "High risk of missed details", bar: "bg-red-500", chip: "text-red-600 bg-red-50 border-red-100" }
    : riskScore >= 40
      ? { text: "Moderate risk this week", bar: "bg-amber-500", chip: "text-amber-600 bg-amber-50 border-amber-100" }
      : { text: "Low risk, under control", bar: "bg-emerald-500", chip: "text-emerald-600 bg-emerald-50 border-emerald-100" };

  const sprintCurrent = useMemo(() => {
    if (!sprintMode || sprintQueue.length === 0) return null;
    for (let i = sprintStep; i < sprintQueue.length; i += 1) {
      const item = allItems.find((entry) => entry.id === sprintQueue[i] && !entry.done);
      if (item) return { item, queueIndex: i };
    }
    for (let i = 0; i < sprintStep; i += 1) {
      const item = allItems.find((entry) => entry.id === sprintQueue[i] && !entry.done);
      if (item) return { item, queueIndex: i };
    }
    return null;
  }, [sprintMode, sprintQueue, sprintStep, allItems]);

  const sprintCompleted = useMemo(() => {
    return sprintQueue.filter((id) => allItems.find((entry) => entry.id === id)?.done).length;
  }, [sprintQueue, allItems]);

  useEffect(() => {
    if (!sprintMode || sprintQueue.length === 0) return;
    const hasRemaining = sprintQueue.some((id) => allItems.some((item) => item.id === id && !item.done));
    if (!hasRemaining) {
      setSprintMode(false);
      setSprintQueue([]);
      setSprintStep(0);
    }
  }, [sprintMode, sprintQueue, allItems]);

  const startSprint = () => {
    if (launchpadItems.length === 0) return;
    setSprintQueue(launchpadItems.map((item) => item.id));
    setSprintStep(0);
    setSprintMode(true);
  };

  const completeSprintStep = () => {
    if (!sprintCurrent) return;
    setAllItems((prev) => prev.map((item) => (
      item.id === sprintCurrent.item.id ? { ...item, done: true } : item
    )));
    setSprintStep(sprintCurrent.queueIndex + 1);
  };

  const skipSprintStep = () => {
    if (!sprintCurrent) return;
    setSprintStep(sprintCurrent.queueIndex + 1);
  };

  const handoffDraft = useMemo(() => {
    const dayString = new Date().toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    if (pendingItems.length === 0) {
      return `Backpack update (${dayString})\n\nEverything is done. We're clear for the week.`;
    }
    const topActions = launchpadNow.map((item, idx) => (
      `${idx + 1}) ${item.text}${item.child ? ` (${item.child})` : ""} — ${getDayLabel(item.day)}`
    ));
    const eventHeadsUp = rankedPendingItems
      .filter((item) => item.tag === "event" && item.day <= 3)
      .slice(0, 2)
      .map((item) => `- ${item.text}${item.child ? ` (${item.child})` : ""} — ${getDayLabel(item.day)}`);
    return [
      `Backpack update (${dayString})`,
      "",
      "Top next actions:",
      ...topActions,
      ...(eventHeadsUp.length > 0 ? ["", "Heads-up events:", ...eventHeadsUp] : []),
    ].join("\n");
  }, [pendingItems, launchpadNow, rankedPendingItems]);

  const copyHandoff = () => {
    navigator.clipboard?.writeText(handoffDraft);
    setHandoffCopied(true);
    setTimeout(() => setHandoffCopied(false), 2000);
  };

  const runAutopilotFlow = () => {
    if (autopilotItems.length === 0) return;
    setSprintQueue(autopilotItems.map((item) => item.id));
    setSprintStep(0);
    setSprintMode(true);
  };

  const startBatchSprint = (batch) => {
    if (!batch || batch.items.length === 0) return;
    setSprintQueue(batch.items.map((item) => item.id));
    setSprintStep(0);
    setSprintMode(true);
  };

  const autopilotDraft = useMemo(() => {
    const modeName = AUTOPILOT_MODES.find((mode) => mode.id === autopilotMode)?.label || "Autopilot";
    const lines = autopilotItems.map((item, idx) => (
      `${idx + 1}) ${item.text}${item.child ? ` (${item.child})` : ""} — ${getDayLabel(item.day)}`
    ));
    return [
      `Backpack ${modeName} plan`,
      "",
      ...(lines.length > 0 ? lines : ["No urgent actions in this mode."]),
    ].join("\n");
  }, [autopilotMode, autopilotItems]);

  const copyAutopilotPlan = () => {
    navigator.clipboard?.writeText(autopilotDraft);
    setAutopilotCopied(true);
    setTimeout(() => setAutopilotCopied(false), 2000);
  };

  const childPings = useMemo(() => {
    return allChildren
      .map((child) => {
        const childItems = rankedPendingItems.filter((item) => item.child === child && item.day <= 1).slice(0, 3);
        if (childItems.length === 0) return null;
        const reminder = `Reminder for ${child}: ${childItems.map((item) => item.text).join("; ")}.`;
        return { child, reminder, count: childItems.length };
      })
      .filter(Boolean);
  }, [allChildren, rankedPendingItems]);

  const copyChildPing = (ping) => {
    navigator.clipboard?.writeText(ping.reminder);
    setChildPingCopied(ping.child);
    setTimeout(() => setChildPingCopied(""), 2000);
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        items: allItems,
        emails,
        familyChildren,
      }),
    );
  }, [allItems, emails, familyChildren]);

  // Copy plan to clipboard
  const copyPlan = () => {
    const header = `Backpack Plan — ${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}`;
    const lines = allItems.filter(i => !i.done).map(i => {
      const tag = TAG_STYLE[i.tag]?.label || "";
      const child = i.child ? ` (${i.child})` : "";
      const day = thisWeek.find(d => d.offset === i.day);
      return `${i.done ? "✓" : "☐"} [${tag}] ${i.text}${child} — ${day?.full || ""}`;
    }).join("\n");
    navigator.clipboard?.writeText(`${header}\n\n${lines}\n\nSent from Backpack`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Your Backpack</h1>
          {totalCount > 0 && (
            <p className="text-sm text-stone-400 mt-0.5">
              {pendingCount === 0 ? "All done! You're all set." : `${pendingCount} thing${pendingCount !== 1 ? "s" : ""} left this week`}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {totalCount > 0 && (
            <button onClick={copyPlan} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition ${copied ? "bg-emerald-50 text-emerald-700" : "bg-stone-100 text-stone-500 hover:bg-stone-200"}`}>
              {copied ? <><Check size={12} /> Copied!</> : <><Share2 size={12} /> Share plan</>}
            </button>
          )}
          <button onClick={() => setShowInput(!showInput)} className="flex items-center gap-1.5 px-3 py-2 bg-stone-900 text-white rounded-lg text-xs font-medium hover:bg-stone-700 transition">
            <Plus size={12} /> Add email
          </button>
        </div>
      </div>

      {totalCount === 0 && !extracting && (
        <div className="mb-6 p-5 bg-gradient-to-br from-emerald-50 via-white to-sky-50 rounded-2xl border border-emerald-100">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <Sparkles size={15} className="text-emerald-700" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-stone-900">Want instant value? Load a realistic week in one tap.</p>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                See Launchpad, risk radar, and coparent handoff immediately.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={handleInstantSetup}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-stone-900 text-white text-xs font-semibold rounded-lg hover:bg-stone-700 transition"
                >
                  Load instant week <ArrowRight size={12} />
                </button>
                <button
                  onClick={handlePasteSample}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-white text-stone-600 text-xs font-medium rounded-lg border border-stone-200 hover:bg-stone-50 transition"
                >
                  Paste one sample email
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 p-4 bg-white rounded-2xl border border-stone-200">
        <div className="flex items-center justify-between gap-2 mb-3">
          <p className="text-xs font-semibold text-stone-700 tracking-wide">FAMILY ROSTER</p>
          <p className="text-[11px] text-stone-400">Used to auto-assign extracted items</p>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {allChildren.map((child) => (
            <span
              key={child}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-stone-100 text-stone-600"
            >
              {child}
              {familyChildren.includes(child) && (
                <button
                  onClick={() => removeChildName(child)}
                  className="text-stone-400 hover:text-stone-700 transition"
                  aria-label={`Remove ${child}`}
                >
                  <X size={10} />
                </button>
              )}
            </span>
          ))}
          {allChildren.length === 0 && <span className="text-xs text-stone-300">No children yet</span>}
        </div>
        <div className="flex gap-2">
          <input
            value={childDraft}
            onChange={(e) => setChildDraft(e.target.value)}
            placeholder="Add child name"
            className="flex-1 px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm text-stone-700 placeholder:text-stone-300 focus:outline-none focus:border-stone-400 transition"
            onKeyDown={(e) => e.key === "Enter" && addChildName()}
          />
          <button
            onClick={addChildName}
            className="px-3 py-2 bg-stone-900 text-white text-xs font-semibold rounded-lg hover:bg-stone-700 transition"
          >
            Add
          </button>
        </div>
      </div>

      {/* ── Week Strip ── */}
      {totalCount > 0 && (
        <div className="flex gap-1.5 mb-6 overflow-x-auto pb-1">
          <button onClick={() => setDayFilter(null)}
            className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-medium transition ${dayFilter === null ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-500 hover:bg-stone-200"}`}>
            All
          </button>
          {weekData.map(d => (
            <button key={d.offset} onClick={() => setDayFilter(dayFilter === d.offset ? null : d.offset)}
              className={`flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-xl text-xs font-medium transition min-w-[3rem] ${
                dayFilter === d.offset ? "bg-stone-900 text-white"
                : d.count > 0 ? "bg-stone-100 text-stone-700 hover:bg-stone-200"
                : "bg-stone-50 text-stone-300"
              }`}>
              <span className="text-[10px] opacity-70">{d.short}</span>
              <span className="text-sm font-semibold">{d.date}</span>
              {d.count > 0 && (
                <span className={`mt-0.5 w-1.5 h-1.5 rounded-full ${d.hasUrgent ? "bg-red-400" : dayFilter === d.offset ? "bg-white" : "bg-stone-400"}`} />
              )}
            </button>
          ))}
        </div>
      )}

      {/* ── Launchpad ── */}
      {totalCount > 0 && pendingCount > 0 && (
        <div className="mb-6 space-y-3">
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
            <div className="p-4 border-b border-stone-100 bg-gradient-to-r from-amber-50 via-orange-50 to-rose-50">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Sunrise size={14} className="text-amber-600" />
                    <p className="text-xs font-semibold text-amber-700 tracking-wide">MORNING LAUNCHPAD</p>
                  </div>
                  <p className="text-sm font-semibold text-stone-900 leading-tight">
                    Do these next {launchpadNow.length} actions to calm your week in about {launchpadMinutes} min
                  </p>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-1 rounded-full border ${riskTone.chip}`}>
                  Risk {riskScore}%
                </span>
              </div>
            </div>
            <div className="p-4 grid md:grid-cols-[1.5fr_1fr] gap-4">
              <div>
                <div className="space-y-2.5">
                  {launchpadNow.map((item, idx) => {
                    const tag = TAG_STYLE[item.tag] || TAG_STYLE.event;
                    return (
                      <div key={item.id} className="flex items-start gap-3 p-2.5 rounded-xl bg-stone-50 border border-stone-100">
                        <span className="w-5 h-5 rounded-full bg-white border border-stone-200 text-[10px] font-bold text-stone-500 flex items-center justify-center mt-0.5">
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm text-stone-800 leading-snug">{item.text}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ color: tag.color, backgroundColor: tag.bg }}>
                              {tag.label}
                            </span>
                            <span className="text-[10px] text-stone-400">{getDayLabel(item.day)}</span>
                            {item.child && <span className="text-[10px] text-stone-400">· {item.child}</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={startSprint}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-stone-900 text-white text-xs font-semibold rounded-lg hover:bg-stone-700 transition"
                  >
                    <Zap size={12} /> Start focus sprint
                  </button>
                  <button
                    onClick={copyHandoff}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition ${
                      handoffCopied ? "bg-emerald-50 text-emerald-700" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                    }`}
                  >
                    {handoffCopied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy co-parent handoff</>}
                  </button>
                </div>
              </div>
              <div className="bg-stone-50 rounded-xl border border-stone-100 p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-stone-700">Risk radar</span>
                  <span className="text-xs text-stone-400">{riskTone.text}</span>
                </div>
                <div className="h-2 rounded-full bg-stone-200 overflow-hidden mb-3">
                  <div className={`h-full ${riskTone.bar}`} style={{ width: `${riskScore}%` }} />
                </div>
                <div className="space-y-1.5">
                  {riskItems.length > 0 ? (
                    riskItems.map((item) => (
                      <p key={item.id} className="text-xs text-stone-600 leading-snug">• {item.text}</p>
                    ))
                  ) : (
                    <p className="text-xs text-stone-400">No high-risk items detected.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {sprintMode && (
            <div className="bg-stone-900 rounded-2xl p-4 text-white">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-amber-300" />
                  <p className="text-xs font-semibold text-amber-100 tracking-wide">FOCUS SPRINT</p>
                </div>
                <button onClick={() => setSprintMode(false)} className="text-xs text-stone-300 hover:text-white transition">
                  Exit
                </button>
              </div>
              {sprintCurrent ? (
                <>
                  <p className="text-sm font-semibold leading-snug">{sprintCurrent.item.text}</p>
                  <p className="text-xs text-stone-300 mt-1">
                    Step {Math.min(sprintCompleted + 1, sprintQueue.length)} of {sprintQueue.length} · {getDayLabel(sprintCurrent.item.day)}
                  </p>
                  <div className="h-1.5 bg-white/15 rounded-full mt-3 overflow-hidden">
                    <div className="h-full bg-amber-300" style={{ width: `${sprintQueue.length > 0 ? (sprintCompleted / sprintQueue.length) * 100 : 0}%` }} />
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button onClick={completeSprintStep} className="px-3 py-2 bg-white text-stone-900 text-xs font-semibold rounded-lg hover:bg-stone-100 transition">
                      Done and next
                    </button>
                    <button onClick={skipSprintStep} className="px-3 py-2 bg-white/10 text-white text-xs font-medium rounded-lg hover:bg-white/20 transition">
                      Skip
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-sm text-emerald-200 font-medium">Sprint complete. You cleared the priority queue.</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Autopilot + Batch Ops ── */}
      {totalCount > 0 && pendingCount > 0 && (
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl border border-stone-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sun size={13} className="text-amber-600" />
              <p className="text-xs font-semibold text-stone-700 tracking-wide">AUTOPILOT MODES</p>
            </div>
            <div className="flex gap-1.5 flex-wrap mb-3">
              {AUTOPILOT_MODES.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setAutopilotMode(mode.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition ${
                    autopilotMode === mode.id
                      ? "bg-stone-900 text-white"
                      : "bg-stone-100 text-stone-500 hover:bg-stone-200"
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-stone-400 mb-2">
              {AUTOPILOT_MODES.find((mode) => mode.id === autopilotMode)?.hint} · {autopilotItems.length} actions · {autopilotMinutes} min
            </p>
            <div className="space-y-1.5">
              {autopilotItems.length > 0 ? (
                autopilotItems.map((item) => (
                  <div key={item.id} className="p-2 rounded-lg bg-stone-50 border border-stone-100">
                    <p className="text-xs text-stone-700 leading-snug">{item.text}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-stone-400">No actions in this mode right now.</p>
              )}
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={runAutopilotFlow}
                disabled={autopilotItems.length === 0}
                className="px-3 py-2 bg-stone-900 text-white text-xs font-semibold rounded-lg hover:bg-stone-700 disabled:bg-stone-200 disabled:text-stone-400 transition"
              >
                Run flow
              </button>
              <button
                onClick={copyAutopilotPlan}
                className={`px-3 py-2 text-xs font-semibold rounded-lg transition ${
                  autopilotCopied ? "bg-emerald-50 text-emerald-700" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
              >
                {autopilotCopied ? "Copied" : "Copy plan"}
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="bg-white rounded-2xl border border-stone-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Filter size={13} className="text-sky-600" />
                <p className="text-xs font-semibold text-stone-700 tracking-wide">SMART BATCHES</p>
              </div>
              <div className="space-y-2">
                {actionBatches.length > 0 ? (
                  actionBatches.map((batch) => (
                    <div key={batch.key} className="p-2.5 rounded-lg bg-sky-50/50 border border-sky-100">
                      <p className="text-xs font-medium text-stone-700">
                        {batch.items.length} actions from {batch.source}
                      </p>
                      <p className="text-[11px] text-stone-400 mt-0.5">{getDayLabel(batch.day)} · ~{batch.minutes} min</p>
                      <button
                        onClick={() => startBatchSprint(batch)}
                        className="mt-2 px-2.5 py-1.5 bg-white text-stone-700 text-[11px] font-semibold rounded-md border border-stone-200 hover:bg-stone-50 transition"
                      >
                        Start batch
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-stone-400">No sign/pay batches available.</p>
                )}
              </div>
            </div>

            {childPings.length > 0 && (
              <div className="bg-white rounded-2xl border border-stone-200 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Users size={13} className="text-violet-600" />
                  <p className="text-xs font-semibold text-stone-700 tracking-wide">CHILD PING DRAFTS</p>
                </div>
                <div className="space-y-2">
                  {childPings.map((ping) => (
                    <div key={ping.child} className="p-2.5 rounded-lg bg-violet-50/40 border border-violet-100">
                      <p className="text-xs text-stone-700">{ping.reminder}</p>
                      <button
                        onClick={() => copyChildPing(ping)}
                        className={`mt-2 px-2.5 py-1.5 text-[11px] font-semibold rounded-md transition ${
                          childPingCopied === ping.child
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-50"
                        }`}
                      >
                        {childPingCopied === ping.child ? "Copied" : `Copy ${ping.child} reminder`}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Child Filter ── */}
      {allChildren.length > 0 && (
        <div className="flex gap-1.5 mb-6">
          <button onClick={() => setChildFilter(null)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${!childFilter ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-500 hover:bg-stone-200"}`}>
            All kids
          </button>
          {allChildren.map(c => {
            const clr = CHILD_COLORS[c] || { dot: "#888", bg: "#f5f5f5", text: "#333" };
            return (
              <button key={c} onClick={() => setChildFilter(childFilter === c ? null : c)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition"
                style={childFilter === c ? { backgroundColor: clr.bg, color: clr.text } : { backgroundColor: "#f5f5f4", color: "#78716c" }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: clr.dot }} />
                {c}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Email Input (collapsible) ── */}
      {showInput && (
        <div className="mb-8 bg-stone-50 rounded-2xl border border-stone-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-stone-400">PASTE SCHOOL EMAIL</label>
            <button onClick={handlePasteSample} className="text-xs text-stone-400 hover:text-stone-600 underline transition">
              Try sample email
            </button>
          </div>
          <textarea
            value={inputText} onChange={e => setInputText(e.target.value)}
            placeholder="Paste any real newsletter, teacher email, or announcement..."
            className="w-full h-32 p-4 bg-white border border-stone-200 rounded-xl text-sm text-stone-700 placeholder:text-stone-300 focus:outline-none focus:border-stone-400 resize-none transition"
          />
          <div className="flex gap-2 mt-3">
            <button onClick={handleExtract} disabled={!inputText.trim() || extracting}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 ${inputText.trim() && !extracting ? "bg-stone-900 text-white hover:bg-stone-700" : "bg-stone-200 text-stone-400 cursor-not-allowed"}`}>
              {extracting ? <><Sparkles size={14} className="animate-spin" /> Reading...</> : <><Sparkles size={14} /> Extract items</>}
            </button>
            {totalCount > 0 && (
              <button onClick={() => setShowInput(false)} className="px-4 py-2.5 rounded-xl text-sm text-stone-400 hover:bg-stone-200 transition">Cancel</button>
            )}
          </div>
          {emails.some(e => e.duplicate) && (
            <p className="text-xs text-amber-600 mt-2 flex items-center gap-1"><Sparkles size={10} /> Duplicate email detected — only new items are added.</p>
          )}
        </div>
      )}

      {extractStatus && (
        <div className={`mb-6 p-3 rounded-xl border text-xs ${
          extractStatus.toLowerCase().includes("no clear") || extractStatus.toLowerCase().includes("duplicate")
            ? "bg-amber-50 border-amber-200 text-amber-700"
            : "bg-emerald-50 border-emerald-200 text-emerald-700"
        }`}>
          {extractStatus}
        </div>
      )}

      {/* ── Quick Add ── */}
      {totalCount > 0 && !showQuickAdd && !showInput && (
        <button onClick={() => setShowQuickAdd(true)}
          className="w-full mb-6 py-2.5 rounded-xl border-2 border-dashed border-stone-200 text-stone-400 hover:border-stone-300 hover:text-stone-500 text-sm font-medium transition flex items-center justify-center gap-1.5">
          <Plus size={14} /> Add item manually
        </button>
      )}
      {showQuickAdd && (
        <div className="mb-6 bg-white rounded-2xl border border-stone-200 p-4">
          <input value={quickText} onChange={e => setQuickText(e.target.value)} placeholder="What needs to happen?"
            className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-700 placeholder:text-stone-300 focus:outline-none focus:border-stone-400 transition mb-3"
            onKeyDown={e => e.key === "Enter" && handleQuickAdd()} autoFocus />
          <div className="flex items-center gap-2 flex-wrap">
            {Object.entries(TAG_STYLE).map(([key, val]) => (
              <button key={key} onClick={() => setQuickTag(key)}
                className="text-[10px] font-semibold px-2 py-1 rounded-lg transition"
                style={quickTag === key ? { color: val.color, backgroundColor: val.bg, boxShadow: `0 0 0 1.5px ${val.color}33` } : { color: "#a8a29e", backgroundColor: "#fafaf9" }}>
                {val.label}
              </button>
            ))}
            <span className="text-stone-200">|</span>
            <select value={quickDay} onChange={e => setQuickDay(Number(e.target.value))} className="text-xs bg-stone-50 border border-stone-200 rounded-lg px-2 py-1 text-stone-600">
              {thisWeek.map(d => <option key={d.offset} value={d.offset}>{d.short} {d.date}</option>)}
            </select>
            <div className="flex-1" />
            <button onClick={() => setShowQuickAdd(false)} className="text-xs text-stone-400 hover:text-stone-600 transition">Cancel</button>
            <button onClick={handleQuickAdd} disabled={!quickText.trim()} className="text-xs font-semibold px-3 py-1.5 bg-stone-900 text-white rounded-lg hover:bg-stone-700 disabled:bg-stone-200 disabled:text-stone-400 transition">Add</button>
          </div>
        </div>
      )}

      {/* ── Items List ── */}
      {filteredItems.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-stone-400">
              {dayFilter !== null ? thisWeek.find(d => d.offset === dayFilter)?.full : "This week"} {childFilter ? `· ${childFilter}` : ""}
            </span>
            <span className="text-xs text-stone-300">{filteredItems.filter(i => !i.done).length} pending</span>
          </div>
          <div className="bg-white rounded-2xl border border-stone-200 divide-y divide-stone-100 overflow-hidden">
            {filteredItems.map(item => {
              const tag = TAG_STYLE[item.tag] || TAG_STYLE.event;
              const clr = item.child ? (CHILD_COLORS[item.child] || { dot: "#888", bg: "#f5f5f5", text: "#333" }) : null;
              const dayLabel = thisWeek.find(d => d.offset === item.day);
              return (
                <div key={item.id} className="flex items-start gap-3 px-4 py-3 group" style={{ animation: "fadeIn .3s ease-out" }}>
                  <button onClick={() => toggle(item.id)}
                    className={`w-5 h-5 mt-0.5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${item.done ? "border-emerald-500 bg-emerald-500" : "border-stone-300 hover:border-stone-400"}`}>
                    {item.done && <Check size={12} className="text-white" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${item.done ? "line-through text-stone-400" : "text-stone-800"}`}>{item.text}</p>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ color: tag.color, backgroundColor: tag.bg }}>{tag.label}</span>
                      {dayFilter === null && dayLabel && <span className="text-[10px] text-stone-400">{dayLabel.short} {dayLabel.date}</span>}
                      {clr && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ color: clr.text, backgroundColor: clr.bg }}>{item.child}</span>
                      )}
                      {!item.child && allChildren.length > 0 && editingChild !== item.id && (
                        <button onClick={() => setEditingChild(item.id)} className="text-[10px] text-stone-300 hover:text-stone-500 transition flex items-center gap-0.5">
                          <UserPlus size={8} /> Assign
                        </button>
                      )}
                      {editingChild === item.id && (
                        <span className="flex gap-1">
                          {allChildren.map(c => {
                            const cc = CHILD_COLORS[c] || { dot: "#888", bg: "#f5f5f5", text: "#333" };
                            return <button key={c} onClick={() => assignChild(item.id, c)} className="text-[10px] font-medium px-1.5 py-0.5 rounded-full transition hover:opacity-80" style={{ color: cc.text, backgroundColor: cc.bg }}>{c}</button>;
                          })}
                          <button onClick={() => setEditingChild(null)} className="text-[10px] text-stone-300 hover:text-stone-500 ml-1">x</button>
                        </span>
                      )}
                      <button onClick={() => setShowSource(p => ({ ...p, [item.id]: !p[item.id] }))} className="text-[10px] text-stone-300 hover:text-stone-500 flex items-center gap-0.5 transition">
                        <Eye size={8} />{showSource[item.id] ? item.source : "Source"}
                      </button>
                    </div>
                  </div>
                  <button onClick={() => removeItem(item.id)} className="opacity-0 group-hover:opacity-100 p-1 text-stone-300 hover:text-red-400 transition"><Trash2 size={12} /></button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Empty State ── */}
      {allItems.length === 0 && !extracting && (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-stone-50 flex items-center justify-center mb-4"><Package size={24} className="text-stone-200" /></div>
          <p className="text-sm text-stone-400 mb-1">Your backpack is empty</p>
          <p className="text-xs text-stone-300">Paste a school email above to get started</p>
        </div>
      )}

      {/* ── All-Done State ── */}
      {totalCount > 0 && pendingCount === 0 && (
        <div className="text-center py-8 mb-8">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 flex items-center justify-center mb-3">
            <Check size={24} className="text-emerald-500" />
          </div>
          <p className="text-base font-semibold text-stone-900">You're all set!</p>
          <p className="text-sm text-stone-400 mt-1">Everything is checked off. Enjoy your week.</p>
        </div>
      )}

      {/* ── Email History ── */}
      {emails.length > 0 && (
        <div className="mt-8">
          <p className="text-xs font-medium text-stone-400 mb-3">Emails processed ({emails.length})</p>
          <div className="space-y-2">
            {emails.map((e, i) => (
              <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${e.duplicate ? "bg-amber-50/50 border-amber-100" : "bg-stone-50 border-stone-100"}`}>
                <Mail size={14} className="text-stone-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-stone-700 truncate">{e.subject}</p>
                  <p className="text-xs text-stone-400">From {e.from}{e.duplicate ? " · Duplicate — no new items" : ` · ${e.items.length} items extracted`}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Gmail Teaser ── */}
      <div className="mt-8 p-5 bg-stone-50 rounded-2xl border border-stone-100">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-stone-200 flex items-center justify-center flex-shrink-0"><Mail size={16} className="text-stone-500" /></div>
          <div>
            <p className="text-sm font-medium text-stone-700">Connect Gmail (coming soon)</p>
            <p className="text-xs text-stone-400 mt-0.5 leading-relaxed">Automatically import school emails — no more pasting. We will only read emails from senders you approve.</p>
          </div>
        </div>
      </div>

      <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }`}</style>
    </div>
  );
}


// ══════════════════════════════════════════════════════════════
// BLOG PAGE
// ══════════════════════════════════════════════════════════════
function BlogPage() {
  const [categoryFilter, setCategoryFilter] = useState("All");
  const categories = useMemo(() => ["All", ...new Set(BLOG_POSTS.map((post) => post.category))], []);
  const filteredPosts = useMemo(
    () => (categoryFilter === "All" ? BLOG_POSTS : BLOG_POSTS.filter((post) => post.category === categoryFilter)),
    [categoryFilter],
  );

  const featuredPost = filteredPosts[0];
  const remainingPosts = filteredPosts.slice(1);
  const parentTodo = [
    "Run Morning Launchpad before checking inbox.",
    "Clear one Smart Batch (all sign/pay actions at once).",
    "Send one co-parent handoff before 8 PM.",
    "Use Focus Sprint for top 3 items only.",
  ];

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-stone-900">Backpack Journal</h1>
        <p className="text-sm text-stone-400 mt-1">Practical systems for calmer school logistics. No fluff.</p>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-6">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setCategoryFilter(category)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              categoryFilter === category ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-500 hover:bg-stone-200"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {featuredPost && (
        <article className="p-6 bg-gradient-to-br from-stone-900 to-stone-800 rounded-3xl mb-6">
          <div className="flex items-center gap-2 text-xs text-stone-300 mb-3">
            <span className="px-2 py-0.5 rounded-full bg-white/10 text-white">{featuredPost.category}</span>
            <span>{featuredPost.date}</span>
            <span className="w-1 h-1 rounded-full bg-stone-500" />
            <span>{featuredPost.readTime} read</span>
          </div>
          <h2 className="text-2xl font-bold text-white leading-tight">{featuredPost.title}</h2>
          <p className="text-sm text-stone-300 mt-3 max-w-2xl leading-relaxed">{featuredPost.excerpt}</p>
          <button className="mt-4 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white text-stone-900 text-xs font-semibold hover:bg-stone-100 transition">
            Read playbook <ArrowRight size={12} />
          </button>
        </article>
      )}

      <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr] gap-4">
        <div className="space-y-3">
          {remainingPosts.map((post, i) => (
            <article key={i} className="p-5 bg-white rounded-2xl border border-stone-100 hover:border-stone-200 transition cursor-pointer group">
              <div className="flex items-center gap-2 text-[11px] text-stone-400 mb-2">
                <span>{post.category}</span>
                <span className="w-1 h-1 rounded-full bg-stone-300" />
                <span>{post.date}</span>
                <span className="w-1 h-1 rounded-full bg-stone-300" />
                <span>{post.readTime}</span>
              </div>
              <h3 className="text-base font-semibold text-stone-900 mb-2 group-hover:text-stone-700 transition leading-snug">{post.title}</h3>
              <p className="text-sm text-stone-400 leading-relaxed">{post.excerpt}</p>
              <div className="mt-3 flex items-center gap-1 text-xs font-medium text-stone-400 group-hover:text-stone-600 transition">
                Read more <ChevronRight size={12} />
              </div>
            </article>
          ))}
        </div>

        <div className="space-y-3">
          <section className="p-5 bg-white rounded-2xl border border-stone-100">
            <div className="flex items-center gap-2 mb-3">
              <Zap size={14} className="text-amber-600" />
              <h3 className="text-sm font-semibold text-stone-900">Shipping Next</h3>
            </div>
            <div className="space-y-2">
              {BUILD_QUEUE.map((item) => (
                <div key={item.title} className="p-2.5 bg-stone-50 rounded-xl border border-stone-100">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium text-stone-700">{item.title}</p>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                      item.status === "Now" ? "bg-emerald-100 text-emerald-700" : item.status === "Next" ? "bg-amber-100 text-amber-700" : "bg-stone-200 text-stone-600"
                    }`}>
                      {item.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-400 mt-1 leading-relaxed">{item.detail}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="p-5 bg-white rounded-2xl border border-stone-100">
            <div className="flex items-center gap-2 mb-3">
              <Calendar size={14} className="text-sky-600" />
              <h3 className="text-sm font-semibold text-stone-900">Things To Do This Week</h3>
            </div>
            <div className="space-y-1.5">
              {parentTodo.map((item) => (
                <p key={item} className="text-xs text-stone-600 leading-snug">• {item}</p>
              ))}
            </div>
          </section>
        </div>
      </div>

      <div className="mt-12 p-6 bg-stone-50 rounded-2xl border border-stone-100 text-center">
        <h3 className="text-base font-semibold text-stone-900 mb-2">Get school tips in your inbox</h3>
        <p className="text-sm text-stone-400 mb-4">One email per week. Practical tips for managing school logistics.</p>
        <div className="flex gap-2 max-w-sm mx-auto">
          <input type="email" placeholder="you@email.com" className="flex-1 px-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm text-stone-700 placeholder:text-stone-300 focus:outline-none focus:border-stone-400 transition" />
          <button className="px-5 py-2.5 bg-stone-900 text-white text-sm font-medium rounded-xl hover:bg-stone-700 transition">Subscribe</button>
        </div>
      </div>
    </div>
  );
}
