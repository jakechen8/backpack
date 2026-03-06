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
  { slug: "stop-missing-school-deadlines", title: "How to Stop Missing School Deadlines (Without Losing Your Mind)", excerpt: "You check three apps, two email threads, and a crumpled flyer in a backpack. Sound familiar? There is a better way.", date: "March 2026", readTime: "4 min" },
  { slug: "school-email-overload", title: "School Email Overload Is Real — Here's What to Do About It", excerpt: "The average school parent receives 47 school-related emails per week. Most contain buried action items that are easy to miss.", date: "March 2026", readTime: "5 min" },
  { slug: "co-parenting-school-logistics", title: "Co-Parenting School Logistics Without the Group Chat Chaos", excerpt: "When two households need the same information about picture day, permission slips, and early release schedules.", date: "February 2026", readTime: "3 min" },
  { slug: "why-school-apps-dont-work", title: "Why School Apps Fail Parents (And What Would Actually Help)", excerpt: "ParentSquare, ClassDojo, Remind, Seesaw, Infinite Campus, Canvas. Parents don't need another app. They need one plan.", date: "February 2026", readTime: "6 min" },
];

// ─── HELPERS ──────────────────────────────────────────────────
const TAG_STYLE = {
  wear:  { label: "Wear",  color: "#7C3AED", bg: "#F5F3FF" },
  bring: { label: "Bring", color: "#D97706", bg: "#FFFBEB" },
  sign:  { label: "Sign",  color: "#DC2626", bg: "#FEF2F2" },
  pay:   { label: "Pay",   color: "#059669", bg: "#ECFDF5" },
  event: { label: "Event", color: "#2563EB", bg: "#EFF6FF" },
};

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
  const [allItems, setAllItems] = useState([]);
  const [emails, setEmails] = useState([]);
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

  // Children detected from items
  const children = useMemo(() => {
    const set = new Set(allItems.map(i => i.child).filter(Boolean));
    return [...set];
  }, [allItems]);

  // Pick a sample email to simulate
  const sampleIndex = useRef(0);

  const handlePasteSample = () => {
    const sample = SAMPLE_EMAILS[sampleIndex.current % SAMPLE_EMAILS.length];
    setInputText(`From: ${sample.from}\nSubject: ${sample.subject}\n\n${sample.body}`);
    sampleIndex.current++;
  };

  const handleExtract = () => {
    if (!inputText.trim()) return;
    setExtracting(true);

    // Find which sample this matches (or use the first)
    const matchedSample = SAMPLE_EMAILS.find(s => inputText.includes(s.from)) || SAMPLE_EMAILS[0];

    // Check for duplicates
    const existingTexts = new Set(allItems.map(i => i.text.toLowerCase()));
    const newItems = matchedSample.items.filter(i => !existingTexts.has(i.text.toLowerCase()));

    if (newItems.length === 0 && matchedSample.items.length > 0) {
      // Duplicate email detected
      setTimeout(() => {
        setExtracting(false);
        setEmails(prev => [...prev, { ...matchedSample, duplicate: true, addedAt: new Date() }]);
        setInputText("");
        setShowInput(false);
      }, 800);
      return;
    }

    // Animate items appearing
    let i = 0;
    const interval = setInterval(() => {
      if (i < newItems.length) {
        setAllItems(prev => [...prev, { ...newItems[i], id: genId(), done: false }]);
        i++;
      } else {
        clearInterval(interval);
        setExtracting(false);
        setEmails(prev => [...prev, { ...matchedSample, addedAt: new Date() }]);
        setInputText("");
        setShowInput(false);
      }
    }, 200);
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

  const doneCount = allItems.filter(i => i.done).length;
  const totalCount = allItems.length;
  const pendingCount = totalCount - doneCount;

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

      {/* ── Child Filter ── */}
      {children.length > 0 && (
        <div className="flex gap-1.5 mb-6">
          <button onClick={() => setChildFilter(null)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${!childFilter ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-500 hover:bg-stone-200"}`}>
            All kids
          </button>
          {children.map(c => {
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
            placeholder="Paste a newsletter, teacher email, or announcement..."
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
                      {!item.child && children.length > 0 && editingChild !== item.id && (
                        <button onClick={() => setEditingChild(item.id)} className="text-[10px] text-stone-300 hover:text-stone-500 transition flex items-center gap-0.5">
                          <UserPlus size={8} /> Assign
                        </button>
                      )}
                      {editingChild === item.id && (
                        <span className="flex gap-1">
                          {children.map(c => {
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
  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <div className="mb-10">
        <h1 className="text-2xl font-bold text-stone-900">Blog</h1>
        <p className="text-sm text-stone-400 mt-1">Tips for surviving school logistics, and product updates.</p>
      </div>
      <div className="space-y-4">
        {BLOG_POSTS.map((post, i) => (
          <article key={i} className="p-6 bg-white rounded-2xl border border-stone-100 hover:border-stone-200 transition cursor-pointer group">
            <div className="flex items-center gap-2 text-xs text-stone-400 mb-2"><span>{post.date}</span><span className="w-1 h-1 rounded-full bg-stone-300" /><span>{post.readTime} read</span></div>
            <h2 className="text-lg font-semibold text-stone-900 mb-2 group-hover:text-stone-700 transition leading-snug">{post.title}</h2>
            <p className="text-sm text-stone-400 leading-relaxed">{post.excerpt}</p>
            <div className="mt-3 flex items-center gap-1 text-xs font-medium text-stone-400 group-hover:text-stone-600 transition">Read more <ChevronRight size={12} /></div>
          </article>
        ))}
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
