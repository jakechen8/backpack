import { useState, useEffect, useRef } from "react";
import {
  Check, ArrowRight, Mail, Sparkles, ChevronRight, Eye,
  Package, Shield, Clock, Users, Zap, Menu, X, Star
} from "lucide-react";

/*
 * BACKPACK — Ship-ready v3
 *
 * Three experiences in one:
 *   1. Landing page (marketing, SEO, the demo IS the CTA)
 *   2. App (radically simple: paste email → get checklist)
 *   3. Blog index (SEO scaffold)
 *
 * Design: warm, confident, zero clutter.
 * Wedge: Forward one email. Get a plan. That's it.
 */

// ─── SAMPLE EMAIL (for the live demo) ─────────────────────────
const SAMPLE_EMAIL = `From: Mrs. Rodriguez <rodriguez@lincoln.edu>
Subject: This Week — Spirit Day, Library Books & Field Trip Reminder

Hi Lincoln families!

A few reminders for this week:

1. Tomorrow is Spirit Day — please wear your school colors shirt!

2. Library books are due back by Wednesday. Maya, please remember to bring Matilda.

3. The Science Museum field trip is this Friday. Permission slips AND the $10 fee are due by Thursday. You can pay online at lincoln.edu/pay or send cash/check.

4. Early release Wednesday at 2:15 PM (instead of 3:15).

5. Don't forget — Picture Day is next Monday! Order forms went home last week.

Have a great week!
Mrs. Rodriguez
3rd Grade, Lincoln Elementary`;

// What the AI "extracts" from the sample
const EXTRACTED_ITEMS = [
  { id: 1, text: "Wear school colors shirt", tag: "wear", date: "Tomorrow", done: false, source: "Mrs. Rodriguez" },
  { id: 2, text: "Return library book (Matilda)", tag: "bring", date: "Wednesday", done: false, source: "Mrs. Rodriguez" },
  { id: 3, text: "Sign permission slip — Science Museum", tag: "sign", date: "Thursday", done: false, source: "Mrs. Rodriguez" },
  { id: 4, text: "Pay $10 field trip fee", tag: "pay", date: "Thursday", done: false, source: "Mrs. Rodriguez" },
  { id: 5, text: "Early release at 2:15 PM", tag: "event", date: "Wednesday", done: false, source: "Mrs. Rodriguez" },
  { id: 6, text: "Picture Day — order forms", tag: "event", date: "Next Monday", done: false, source: "Mrs. Rodriguez" },
];

const BLOG_POSTS = [
  { slug: "stop-missing-school-deadlines", title: "How to Stop Missing School Deadlines (Without Losing Your Mind)", excerpt: "You check three apps, two email threads, and a crumpled flyer in a backpack. Sound familiar? There is a better way.", date: "March 2026", readTime: "4 min" },
  { slug: "school-email-overload", title: "School Email Overload Is Real — Here's What to Do About It", excerpt: "The average school parent receives 47 school-related emails per week. Most contain buried action items that are easy to miss.", date: "March 2026", readTime: "5 min" },
  { slug: "co-parenting-school-logistics", title: "Co-Parenting School Logistics Without the Group Chat Chaos", excerpt: "When two households need the same information about picture day, permission slips, and early release schedules.", date: "February 2026", readTime: "3 min" },
  { slug: "why-school-apps-dont-work", title: "Why School Apps Fail Parents (And What Would Actually Help)", excerpt: "ParentSquare, ClassDojo, Remind, Seesaw, Infinite Campus, Canvas. Parents don't need another app. They need one plan.", date: "February 2026", readTime: "6 min" },
];

// ─── TAG STYLES ───────────────────────────────────────────────
const TAG_STYLE = {
  wear:  { label: "Wear",  color: "#7C3AED", bg: "#F5F3FF" },
  bring: { label: "Bring", color: "#D97706", bg: "#FFFBEB" },
  sign:  { label: "Sign",  color: "#DC2626", bg: "#FEF2F2" },
  pay:   { label: "Pay",   color: "#059669", bg: "#ECFDF5" },
  event: { label: "Event", color: "#2563EB", bg: "#EFF6FF" },
};

// ─── MAIN APP ─────────────────────────────────────────────────
export default function Backpack() {
  const [page, setPage] = useState("home");
  const [mobileMenu, setMobileMenu] = useState(false);

  // Navigate
  const go = (p) => { setPage(p); setMobileMenu(false); window.scrollTo(0, 0); };

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>

      {/* ══════════ GLOBAL NAV ══════════ */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg border-b border-stone-100">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between h-14">
          <button onClick={() => go("home")} className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-stone-900 flex items-center justify-center">
              <Package size={13} className="text-white" />
            </div>
            <span className="text-sm font-semibold text-stone-900 tracking-tight">Backpack</span>
          </button>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => go("home")} className="text-sm text-stone-500 hover:text-stone-900 transition">Home</button>
            <button onClick={() => go("app")} className="text-sm text-stone-500 hover:text-stone-900 transition">Try It</button>
            <button onClick={() => go("blog")} className="text-sm text-stone-500 hover:text-stone-900 transition">Blog</button>
            <button onClick={() => go("app")} className="px-4 py-2 bg-stone-900 text-white text-sm font-medium rounded-lg hover:bg-stone-700 transition">
              Get Started
            </button>
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setMobileMenu(!mobileMenu)} className="md:hidden p-2 text-stone-500">
            {mobileMenu ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenu && (
          <div className="md:hidden bg-white border-t border-stone-100 px-6 py-4 space-y-3">
            <button onClick={() => go("home")} className="block w-full text-left text-sm text-stone-700 py-2">Home</button>
            <button onClick={() => go("app")} className="block w-full text-left text-sm text-stone-700 py-2">Try It</button>
            <button onClick={() => go("blog")} className="block w-full text-left text-sm text-stone-700 py-2">Blog</button>
            <button onClick={() => go("app")} className="w-full py-2.5 bg-stone-900 text-white text-sm font-medium rounded-lg">
              Get Started
            </button>
          </div>
        )}
      </nav>

      <div className="pt-14">
        {page === "home" && <HomePage onTryIt={() => go("app")} onBlog={() => go("blog")} />}
        {page === "app" && <AppPage />}
        {page === "blog" && <BlogPage onBack={() => go("home")} />}
      </div>

      {/* ══════════ FOOTER ══════════ */}
      <footer className="border-t border-stone-100 mt-24">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-md bg-stone-900 flex items-center justify-center">
                  <Package size={11} className="text-white" />
                </div>
                <span className="text-sm font-semibold text-stone-900">Backpack</span>
              </div>
              <p className="text-xs text-stone-400 leading-relaxed">Everything school, in one place. No more digging through emails, apps, and flyers.</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-stone-900 mb-3">Product</p>
              <div className="space-y-2">
                <button onClick={() => go("app")} className="block text-xs text-stone-400 hover:text-stone-600 transition">Try the Demo</button>
                <p className="text-xs text-stone-400">Pricing (coming soon)</p>
                <p className="text-xs text-stone-400">Changelog</p>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-stone-900 mb-3">Resources</p>
              <div className="space-y-2">
                <button onClick={() => go("blog")} className="block text-xs text-stone-400 hover:text-stone-600 transition">Blog</button>
                <p className="text-xs text-stone-400">Help Center</p>
                <p className="text-xs text-stone-400">API Docs</p>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-stone-900 mb-3">Legal</p>
              <div className="space-y-2">
                <p className="text-xs text-stone-400">Privacy Policy</p>
                <p className="text-xs text-stone-400">Terms of Service</p>
                <p className="text-xs text-stone-400">FERPA Compliance</p>
              </div>
            </div>
          </div>
          <div className="border-t border-stone-100 mt-8 pt-6 flex items-center justify-between">
            <p className="text-xs text-stone-300">&copy; 2026 Backpack. All rights reserved.</p>
            <div className="flex items-center gap-1.5">
              <Shield size={12} className="text-stone-300" />
              <p className="text-xs text-stone-300">Your data is never sold. Ever.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}


// ══════════════════════════════════════════════════════════════
// HOME PAGE
// ══════════════════════════════════════════════════════════════

function HomePage({ onTryIt, onBlog }) {
  const [demoState, setDemoState] = useState("idle"); // idle → typing → extracting → done
  const [demoItems, setDemoItems] = useState([]);
  const [demoText, setDemoText] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const textRef = useRef(null);

  // Auto-demo: type out the email, then extract
  const runDemo = () => {
    setDemoState("typing");
    setDemoItems([]);
    setDemoText("");
    let i = 0;
    const lines = SAMPLE_EMAIL.split("\n");
    const fullText = SAMPLE_EMAIL;

    const typeInterval = setInterval(() => {
      if (i < fullText.length) {
        const chunk = Math.min(8, fullText.length - i);
        setDemoText(fullText.substring(0, i + chunk));
        i += chunk;
        if (textRef.current) {
          textRef.current.scrollTop = textRef.current.scrollHeight;
        }
      } else {
        clearInterval(typeInterval);
        setDemoState("extracting");
        // Show items one by one
        let j = 0;
        const itemInterval = setInterval(() => {
          if (j < EXTRACTED_ITEMS.length) {
            setDemoItems(prev => [...prev, EXTRACTED_ITEMS[j]]);
            j++;
          } else {
            clearInterval(itemInterval);
            setDemoState("done");
          }
        }, 300);
      }
    }, 12);
  };

  return (
    <div>
      {/* ── HERO ── */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 md:pt-28 md:pb-24">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full mb-6">
            <Sparkles size={12} className="text-amber-600" />
            <span className="text-xs font-medium text-amber-700">AI-powered school organizer for parents</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-stone-900 leading-[1.1] tracking-tight">
            School emails in.<br />
            <span className="text-stone-400">Your plan out.</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-stone-500 leading-relaxed max-w-lg">
            Forward a school email. Backpack reads it and tells you exactly what your kid needs — what to bring, sign, pay, and when.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <button onClick={onTryIt}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-stone-900 text-white text-sm font-medium rounded-xl hover:bg-stone-700 transition shadow-lg shadow-stone-200">
              Try it free <ArrowRight size={16} />
            </button>
            <button onClick={runDemo}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-stone-700 text-sm font-medium rounded-xl border border-stone-200 hover:bg-stone-50 transition">
              Watch the demo
            </button>
          </div>
        </div>
      </section>

      {/* ── LIVE DEMO ── */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="bg-stone-50 rounded-3xl border border-stone-200 overflow-hidden">
          <div className="p-4 md:p-8">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Email input side */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Mail size={14} className="text-stone-400" />
                  <span className="text-xs font-medium text-stone-400">SCHOOL EMAIL</span>
                </div>
                <div ref={textRef}
                  className="bg-white rounded-2xl border border-stone-200 p-5 h-80 overflow-y-auto text-sm text-stone-600 leading-relaxed font-mono whitespace-pre-wrap">
                  {demoState === "idle" ? (
                    <div className="h-full flex flex-col items-center justify-center text-center">
                      <Mail size={32} className="text-stone-200 mb-3" />
                      <p className="text-stone-400 font-sans text-sm">Paste a school email here</p>
                      <p className="text-stone-300 font-sans text-xs mt-1">or click "Watch the demo" above</p>
                      <button onClick={runDemo}
                        className="mt-4 px-4 py-2 bg-stone-900 text-white text-xs font-sans font-medium rounded-lg hover:bg-stone-700 transition">
                        Run demo
                      </button>
                    </div>
                  ) : (
                    <span>{demoText}<span className="animate-pulse">|</span></span>
                  )}
                </div>
              </div>

              {/* Extracted side */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles size={14} className="text-amber-500" />
                  <span className="text-xs font-medium text-stone-400">BACKPACK EXTRACTS</span>
                  {demoState === "extracting" && (
                    <span className="text-xs text-amber-500 animate-pulse">Reading...</span>
                  )}
                </div>
                <div className="bg-white rounded-2xl border border-stone-200 p-5 h-80 overflow-y-auto">
                  {demoItems.length === 0 && demoState !== "extracting" ? (
                    <div className="h-full flex flex-col items-center justify-center text-center">
                      <div className="w-12 h-12 rounded-2xl bg-stone-50 flex items-center justify-center mb-3">
                        <Check size={20} className="text-stone-200" />
                      </div>
                      <p className="text-stone-300 text-sm">Your action items appear here</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {demoItems.map((item, i) => {
                        const tag = TAG_STYLE[item.tag] || TAG_STYLE.event;
                        return (
                          <div key={item.id}
                            className="flex items-start gap-3 p-3 rounded-xl border border-stone-100 animate-in"
                            style={{ animation: "fadeSlideIn 0.3s ease-out" }}>
                            <div className="w-5 h-5 mt-0.5 rounded-md border-2 border-stone-200 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-stone-800">{item.text}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                                  style={{ color: tag.color, backgroundColor: tag.bg }}>
                                  {tag.label}
                                </span>
                                <span className="text-[10px] text-stone-400">{item.date}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {demoState === "done" && (
                        <div className="mt-4 p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
                          <p className="text-sm text-emerald-700 font-medium">6 action items found</p>
                          <p className="text-xs text-emerald-600 mt-0.5">From 1 email in 3 seconds</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        <style>{`
          @keyframes fadeSlideIn {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <h2 className="text-2xl md:text-3xl font-bold text-stone-900 text-center mb-4">
          Three steps. Zero stress.
        </h2>
        <p className="text-center text-stone-400 mb-12 max-w-md mx-auto">
          No app to install at school. No integration to configure. Works with any school, any district, today.
        </p>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { step: "1", icon: Mail, title: "Forward the email", desc: "Forward any school email to your unique Backpack address. Or paste it. Or connect Gmail." },
            { step: "2", icon: Sparkles, title: "AI reads it for you", desc: "Backpack extracts dates, action items, things to bring, payments due, and schedule changes." },
            { step: "3", icon: Check, title: "Check it off", desc: "Open your daily plan. See what each kid needs. Check things off. Share with your co-parent." },
          ].map((s, i) => (
            <div key={i} className="text-center">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-stone-50 border border-stone-100 flex items-center justify-center mb-4">
                <s.icon size={22} className="text-stone-700" />
              </div>
              <h3 className="text-base font-semibold text-stone-900 mb-2">{s.title}</h3>
              <p className="text-sm text-stone-400 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── PAIN POINTS ── */}
      <section className="bg-stone-50 border-y border-stone-100">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <h2 className="text-2xl md:text-3xl font-bold text-stone-900 text-center mb-4">
            Sound familiar?
          </h2>
          <p className="text-center text-stone-400 mb-12 max-w-md mx-auto">
            Every parent with school-age kids lives this chaos.
          </p>
          <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto">
            {[
              "You missed picture day because the flyer was buried in a newsletter",
              "Your kid needed a poster board and you found out at 9 PM",
              "You paid the field trip fee twice because two apps sent reminders",
              "Your co-parent asked you what time early release is — and you didn't know either",
              "You have 4 school apps installed and still feel behind",
              "You dread opening your email on Sunday night",
            ].map((pain, i) => (
              <div key={i} className="flex items-start gap-3 p-4 bg-white rounded-xl border border-stone-100">
                <span className="text-lg mt-0.5">{"😩"}</span>
                <p className="text-sm text-stone-600">{pain}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <button onClick={onTryIt}
              className="inline-flex items-center gap-2 px-6 py-3 bg-stone-900 text-white text-sm font-medium rounded-xl hover:bg-stone-700 transition">
              Try Backpack free <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </section>

      {/* ── TRUST & PRIVACY ── */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <div className="max-w-2xl mx-auto text-center">
          <Shield size={28} className="mx-auto text-stone-300 mb-4" />
          <h2 className="text-2xl md:text-3xl font-bold text-stone-900 mb-4">
            Privacy is the product.
          </h2>
          <p className="text-stone-400 mb-8 leading-relaxed">
            We handle information about your kids. We take that seriously. No ads, no data selling, no creepy tracking. Your data is encrypted, exportable, and deletable at any time.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Encrypted", sub: "In transit + at rest" },
              { label: "No ads", sub: "Ever" },
              { label: "Your data", sub: "Export or delete anytime" },
              { label: "Compliant", sub: "FERPA & COPPA aware" },
            ].map((t, i) => (
              <div key={i} className="p-4 bg-stone-50 rounded-xl">
                <p className="text-sm font-semibold text-stone-800">{t.label}</p>
                <p className="text-xs text-stone-400 mt-0.5">{t.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BLOG PREVIEW ── */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-stone-900">From the blog</h2>
          <button onClick={onBlog} className="text-sm text-stone-400 hover:text-stone-600 flex items-center gap-1 transition">
            All posts <ChevronRight size={14} />
          </button>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {BLOG_POSTS.slice(0, 2).map((post, i) => (
            <article key={i} className="p-6 bg-stone-50 rounded-2xl border border-stone-100 hover:border-stone-200 transition cursor-pointer group">
              <div className="flex items-center gap-2 text-xs text-stone-400 mb-3">
                <span>{post.date}</span>
                <span className="w-1 h-1 rounded-full bg-stone-300" />
                <span>{post.readTime} read</span>
              </div>
              <h3 className="text-base font-semibold text-stone-900 mb-2 group-hover:text-stone-700 transition leading-snug">{post.title}</h3>
              <p className="text-sm text-stone-400 leading-relaxed">{post.excerpt}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="bg-stone-900 rounded-3xl p-10 md:p-16 text-center">
          <h2 className="text-2xl md:text-4xl font-bold text-white mb-4">
            Know what your kid needs.<br />In 10 seconds.
          </h2>
          <p className="text-stone-400 mb-8 max-w-md mx-auto">
            Stop digging through emails. Start your morning knowing exactly what to pack, sign, and pay.
          </p>
          <button onClick={onTryIt}
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-stone-900 text-sm font-semibold rounded-xl hover:bg-stone-100 transition">
            Get started — it's free <ArrowRight size={16} />
          </button>
        </div>
      </section>
    </div>
  );
}


// ══════════════════════════════════════════════════════════════
// APP PAGE — the actual product
// ══════════════════════════════════════════════════════════════

function AppPage() {
  const [inputText, setInputText] = useState("");
  const [items, setItems] = useState([]);
  const [extracting, setExtracting] = useState(false);
  const [showSource, setShowSource] = useState({});
  const [history, setHistory] = useState([]);

  const handleExtract = () => {
    if (!inputText.trim()) return;
    setExtracting(true);
    setItems([]);

    // Simulate extraction with delay
    let i = 0;
    const interval = setInterval(() => {
      if (i < EXTRACTED_ITEMS.length) {
        setItems(prev => [...prev, { ...EXTRACTED_ITEMS[i], id: Date.now() + i }]);
        i++;
      } else {
        clearInterval(interval);
        setExtracting(false);
      }
    }, 250);
  };

  const handlePasteSample = () => {
    setInputText(SAMPLE_EMAIL);
  };

  const toggle = (id) => {
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, done: !item.done } : item
    ));
  };

  const doneCount = items.filter(i => i.done).length;
  const totalCount = items.length;

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-900">Your Backpack</h1>
        <p className="text-sm text-stone-400 mt-1">Paste a school email below. We will pull out what matters.</p>
      </div>

      {/* Email Input */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-stone-400">PASTE SCHOOL EMAIL</label>
          <button onClick={handlePasteSample} className="text-xs text-stone-400 hover:text-stone-600 underline transition">
            Use sample email
          </button>
        </div>
        <textarea
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          placeholder="Paste a newsletter, teacher email, or school announcement here..."
          className="w-full h-40 p-4 bg-stone-50 border border-stone-200 rounded-2xl text-sm text-stone-700 placeholder:text-stone-300 focus:outline-none focus:border-stone-400 resize-none transition"
        />
        <button
          onClick={handleExtract}
          disabled={!inputText.trim() || extracting}
          className={`mt-3 w-full py-3 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 ${
            inputText.trim() && !extracting
              ? "bg-stone-900 text-white hover:bg-stone-700"
              : "bg-stone-100 text-stone-300 cursor-not-allowed"
          }`}>
          {extracting ? (
            <><Sparkles size={14} className="animate-spin" /> Reading email...</>
          ) : (
            <><Sparkles size={14} /> Extract action items</>
          )}
        </button>
      </div>

      {/* Extracted Items */}
      {items.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-stone-900">Your plan</h2>
              <span className="text-xs text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">
                {doneCount}/{totalCount}
              </span>
            </div>
            {totalCount > 0 && doneCount === totalCount && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                <Check size={12} /> All done
              </span>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 divide-y divide-stone-100 overflow-hidden">
            {items.map(item => {
              const tag = TAG_STYLE[item.tag] || TAG_STYLE.event;
              return (
                <div key={item.id} className="flex items-start gap-3 px-4 py-3.5"
                  style={{ animation: "fadeSlideIn 0.3s ease-out" }}>
                  <button onClick={() => toggle(item.id)}
                    className={`w-5 h-5 mt-0.5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      item.done ? "border-emerald-500 bg-emerald-500" : "border-stone-300 hover:border-stone-400"
                    }`}>
                    {item.done && <Check size={12} className="text-white" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${item.done ? "line-through text-stone-400" : "text-stone-800"}`}>
                      {item.text}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                        style={{ color: tag.color, backgroundColor: tag.bg }}>
                        {tag.label}
                      </span>
                      <span className="text-[10px] text-stone-400">{item.date}</span>
                      <button
                        onClick={() => setShowSource(p => ({ ...p, [item.id]: !p[item.id] }))}
                        className="text-[10px] text-stone-300 hover:text-stone-500 flex items-center gap-0.5 transition">
                        <Eye size={8} />
                        {showSource[item.id] ? item.source : "Source"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <style>{`
            @keyframes fadeSlideIn {
              from { opacity: 0; transform: translateY(8px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>
        </div>
      )}

      {/* Empty state */}
      {items.length === 0 && !extracting && (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-stone-50 flex items-center justify-center mb-4">
            <Package size={24} className="text-stone-200" />
          </div>
          <p className="text-sm text-stone-400 mb-1">No items yet</p>
          <p className="text-xs text-stone-300">Paste a school email above to get started</p>
        </div>
      )}

      {/* How it works for real */}
      <div className="mt-12 p-6 bg-stone-50 rounded-2xl border border-stone-100">
        <h3 className="text-sm font-semibold text-stone-700 mb-3">How to use Backpack</h3>
        <div className="space-y-3">
          {[
            { emoji: "1.", text: "Copy a school email, newsletter, or teacher message" },
            { emoji: "2.", text: "Paste it in the box above" },
            { emoji: "3.", text: "Backpack extracts action items — things to bring, sign, pay, and dates" },
            { emoji: "4.", text: "Check items off as you go" },
          ].map((s, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="text-xs font-bold text-stone-400 mt-0.5 w-4">{s.emoji}</span>
              <p className="text-sm text-stone-500">{s.text}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-xs text-amber-700">
            <strong>Coming soon:</strong> Connect your Gmail to automatically import school emails. No more pasting.
          </p>
        </div>
      </div>
    </div>
  );
}


// ══════════════════════════════════════════════════════════════
// BLOG PAGE
// ══════════════════════════════════════════════════════════════

function BlogPage({ onBack }) {
  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <div className="mb-10">
        <h1 className="text-2xl font-bold text-stone-900">Blog</h1>
        <p className="text-sm text-stone-400 mt-1">
          Tips for surviving school logistics, and product updates.
        </p>
      </div>

      <div className="space-y-4">
        {BLOG_POSTS.map((post, i) => (
          <article key={i}
            className="p-6 bg-white rounded-2xl border border-stone-100 hover:border-stone-200 transition cursor-pointer group">
            <div className="flex items-center gap-2 text-xs text-stone-400 mb-2">
              <span>{post.date}</span>
              <span className="w-1 h-1 rounded-full bg-stone-300" />
              <span>{post.readTime} read</span>
            </div>
            <h2 className="text-lg font-semibold text-stone-900 mb-2 group-hover:text-stone-700 transition leading-snug">
              {post.title}
            </h2>
            <p className="text-sm text-stone-400 leading-relaxed">{post.excerpt}</p>
            <div className="mt-3 flex items-center gap-1 text-xs font-medium text-stone-400 group-hover:text-stone-600 transition">
              Read more <ChevronRight size={12} />
            </div>
          </article>
        ))}
      </div>

      {/* SEO content / newsletter signup */}
      <div className="mt-12 p-6 bg-stone-50 rounded-2xl border border-stone-100 text-center">
        <h3 className="text-base font-semibold text-stone-900 mb-2">Get school tips in your inbox</h3>
        <p className="text-sm text-stone-400 mb-4">
          One email per week. Practical tips for managing school logistics.
        </p>
        <div className="flex gap-2 max-w-sm mx-auto">
          <input
            type="email"
            placeholder="you@email.com"
            className="flex-1 px-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm text-stone-700 placeholder:text-stone-300 focus:outline-none focus:border-stone-400 transition"
          />
          <button className="px-5 py-2.5 bg-stone-900 text-white text-sm font-medium rounded-xl hover:bg-stone-700 transition">
            Subscribe
          </button>
        </div>
      </div>
    </div>
  );
}
