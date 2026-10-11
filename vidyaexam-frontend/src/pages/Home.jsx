import { useRef, useState } from "react";
import {
  Landmark,
  Briefcase,
  Zap,
  Timer,
  Layers,
  BarChart3,
  MonitorSmartphone,
  ArrowRight,
  TrendingUp,
  Target,
  Check,
  X,
  BookOpen,
  ChevronDown,
} from "lucide-react";
import { routes } from "../shared/config/siteConfig";
import { useReveal } from "../shared/hooks/useReveal";
import { useParallax } from "../shared/hooks/useParallax";
import "../styles/variables.css";
import "../styles/home.css";

const marquee = [
  { icon: Layers, text: "Structured Practice" },
  { icon: Timer, text: "Timed Mock Tests" },
  { icon: BookOpen, text: "Topic-wise Revision" },
  { icon: BarChart3, text: "Performance Review" },
  { icon: MonitorSmartphone, text: "Flexible Device Access" },
];

const approach = [
  {
    t: "Practice with direction",
    d: "Work through questions with a clearer purpose. Focus on the topics you want to strengthen instead of approaching every session without a plan.",
  },
  {
    t: "Understand your attempts",
    d: "Review your answers, notice recurring mistakes, and pay attention to the areas that deserve more attention.",
  },
  {
    t: "Return with a plan",
    d: "Use what you learn from each attempt to decide what to revise and what to practise next.",
  },
];

const cycle = [
  {
    t: "Practice",
    d: "Attempt questions and challenge yourself with focused or timed sessions.",
  },
  {
    t: "Review",
    d: "Look back at your responses and understand which areas need attention.",
  },
  {
    t: "Revise",
    d: "Return to important concepts and questions that deserve another look.",
  },
  {
    t: "Repeat",
    d: "Begin your next session with a more deliberate approach.",
  },
];

const principles = [
  {
    t: "Start with a clear objective",
    d: "Choose one topic, skill, or question type for your session. A specific goal makes it easier to decide what to practise.",
  },
  {
    t: "Practise before you feel completely ready",
    d: "Use practice questions to discover what you understand and which concepts need another pass.",
  },
  {
    t: "Review the reasoning behind your answers",
    d: "Do not stop at whether an answer was correct. Consider the method, assumptions, and steps involved in reaching it.",
  },
  {
    t: "Plan your next revision",
    d: "Finish each session by identifying a few concrete areas to revisit. Use that list to give your next session a clear direction.",
  },
];

const steps = [
  {
    t: "Choose your preparation path",
    d: "Start with the category that matches your current goal.",
  },
  {
    t: "Begin practising",
    d: "Work through questions or start a timed mock test when that option is available.",
  },
  {
    t: "Review the attempt",
    d: "Use the available results and feedback to understand your performance.",
  },
  {
    t: "Decide what comes next",
    d: "Identify the topics you want to strengthen and return for another focused session.",
  },
];

const without = [
  "Moving between topics without a defined objective.",
  "Repeating questions without examining mistakes.",
  "Losing track of which areas need further practice.",
  "Completing sessions without deciding what to do next.",
];
const withRoutine = [
  "Setting a specific goal for each practice session.",
  "Reviewing answers and reasoning.",
  "Prioritizing areas that need more attention.",
  "Ending a session with a clear revision objective.",
];

const roadmap = [
  {
    t: "Understand the exam format",
    d: "Learn the sections, question types and timing.",
  },
  {
    t: "Practise foundational topics",
    d: "Build comfort with the basics, one topic at a time.",
  },
  {
    t: "Attempt timed question sets",
    d: "Get used to working within a time limit.",
  },
  {
    t: "Review errors and difficult questions",
    d: "Look for patterns in what went wrong.",
  },
  {
    t: "Revisit weaker areas",
    d: "Return to topics that need more attention.",
  },
  {
    t: "Continue practising and reviewing",
    d: "Repeat the cycle with a clearer plan each time.",
  },
];

const faqs = [
  {
    q: "What is VidyaExam?",
    a: "VidyaExam is an exam preparation platform designed to bring structured practice, mock examinations, quizzes, and performance review into one focused learning experience, depending on the features available in the application.",
  },
  {
    q: "Who can use VidyaExam?",
    a: "It is intended for learners preparing for competitive examinations, placement assessments, and focused question-based practice.",
  },
  {
    q: "How can I start preparing?",
    a: "Begin by exploring the available exam categories, selecting a suitable preparation path, and using the practice options available to you.",
  },
  {
    q: "Why should I attempt timed mock tests?",
    a: "Timed practice can help you become more aware of how you use time across questions and how you approach an examination under a defined limit.",
  },
  {
    q: "How can I improve after a practice session?",
    a: "Review your responses, understand the reasoning behind difficult questions, and choose specific topics or concepts to revisit.",
  },
  {
    q: "Can I use VidyaExam on mobile?",
    a: "The website provides a responsive interface across mobile, tablet, and desktop. Any device-specific functionality is described only where it is supported.",
  },
];

const options = ["40 km/h", "50 km/h", "60 km/h", "70 km/h"];

function QGrid({ total, done, wide }) {
  return (
    <div
      className={`hm-qgrid${wide ? " hm-qgrid--wide" : ""}`}
      aria-hidden="true">
      {Array.from({ length: total }, (_, n) => (
        <b key={n} className={n < done ? "done" : n === done ? "cur" : ""} />
      ))}
    </div>
  );
}

function Faq({ items }) {
  const [open, setOpen] = useState(0);
  return (
    <ul className="hm-faq">
      {items.map((f, i) => {
        const isOpen = open === i;
        return (
          <li key={f.q} className={isOpen ? "is-open" : ""}>
            <h3>
              <button
                type="button"
                id={`faq-q-${i}`}
                aria-expanded={isOpen}
                aria-controls={`faq-a-${i}`}
                onClick={() => setOpen(isOpen ? -1 : i)}>
                <span>{f.q}</span>
                <ChevronDown size={20} aria-hidden="true" />
              </button>
            </h3>
            <div
              id={`faq-a-${i}`}
              role="region"
              aria-labelledby={`faq-q-${i}`}
              className="hm-faq-a">
              <div>
                <p>{f.a}</p>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function BgWord({ children, speed, className = "" }) {
  return (
    <span
      className={`hm-bgword ${className}`}
      data-speed={speed}
      aria-hidden="true">
      {children}
    </span>
  );
}

export default function HomePage() {
  const rootRef = useRef(null);
  useReveal(rootRef);
  useParallax(rootRef);

  return (
    <div ref={rootRef} className="home" id="top">
      <main>
        {/* 1 — Hero */}
        <section className="hm-hero" aria-labelledby="hero-title">
          <div className="hm-hero-bg" aria-hidden="true">
            <span className="hm-orb hm-orb--a" data-speed="0.08" />
            <span className="hm-orb hm-orb--b" data-speed="-0.05" />
          </div>
          <BgWord speed="0.06" className="hm-bgword--hero">
            PREPARE
          </BgWord>
          <div className="hm-container hm-hero-grid">
            <div>
              <p className="hm-eyebrow hm-in" style={{ "--i": 0 }}>
                <Target size={14} aria-hidden="true" /> A more structured way to
                prepare
              </p>
              <h1 id="hero-title" className="hm-in" style={{ "--i": 1 }}>
                Your preparation deserves{" "}
                <span className="hm-accent">
                  <em>more than guesswork.</em>
                </span>
              </h1>
              <p className="hm-lead hm-in" style={{ "--i": 2 }}>
                Prepare for competitive exams and placement assessments with a
                focused practice experience. Work through questions, challenge
                yourself with timed mock tests, and use every review to plan
                your next step.
              </p>
              <div className="hm-cta-row hm-in" style={{ "--i": 3 }}>
                <a
                  className="hm-btn hm-btn--primary hm-btn--lg"
                  href={routes.exams}>
                  Explore Exams <ArrowRight size={18} aria-hidden="true" />
                </a>
                <a
                  className="hm-btn hm-btn--outline hm-btn--lg"
                  href="#features">
                  Discover the Platform
                </a>
              </div>
              <p className="hm-note hm-in" style={{ "--i": 4 }}>
                Choose your path. Practice with purpose. Learn from every
                attempt.
              </p>
            </div>

            <div
              className="hm-hero-visual hm-in"
              style={{ "--i": 2 }}
              role="img"
              aria-label="Illustration of an exam interface with a sample question, timer, progress and preparation summary">
              <div className="hm-app" data-speed="0.03">
                <div className="hm-app-bar">
                  <i />
                  <i />
                  <i />
                  <span>Sample mock test · illustrative</span>
                </div>
                <div className="hm-app-body">
                  <div>
                    <small>Question 7 of 20 · Sample</small>
                    <p className="hm-q">
                      A train covers 120 km in 2 hours. What is its average
                      speed?
                    </p>
                    <ul className="hm-opts">
                      {options.map((o, n) => (
                        <li key={o} className={n === 2 ? "sel" : ""}>
                          <b>{"ABCD"[n]}</b>
                          {o}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="hm-app-side">
                    <span className="hm-timer">
                      <Timer size={14} /> 24:10
                    </span>
                    <QGrid total={12} done={6} />
                  </div>
                </div>
              </div>
              <div className="hm-float hm-float--a" data-speed="-0.06">
                <small>Accuracy (sample)</small>
                <div className="hm-bar">
                  <span style={{ "--w": "72%" }} />
                </div>
              </div>
              <div className="hm-float hm-float--b" data-speed="0.07">
                <TrendingUp size={16} aria-hidden="true" /> 3 topics to revisit{" "}
                <em>(sample)</em>
              </div>
            </div>
          </div>
        </section>

        {/* 2 — Capability marquee */}
        <section className="hm-marquee" aria-label="Platform capabilities">
          <div className="hm-marquee-track">
            {[0, 1].map((k) => (
              <ul
                key={k}
                className="hm-marquee-set"
                aria-hidden={k === 1 ? "true" : undefined}>
                {marquee.map(({ icon: Icon, text }) => (
                  <li key={text}>
                    <Icon size={18} aria-hidden="true" />
                    {text}
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </section>

        {/* 3 — Approach */}
        <section
          className="hm-section"
          id="approach"
          aria-labelledby="approach-title">
          <BgWord speed="0.05" className="hm-bgword--right">
            LEARN
          </BgWord>
          <div className="hm-container hm-approach">
            <div className="hm-approach-left reveal" data-reveal>
              <span className="hm-bignum" aria-hidden="true">
                01
              </span>
              <p className="hm-eyebrow">A better preparation routine</p>
              <h2 id="approach-title">
                Studying more is not always the same as{" "}
                <span className="hm-accent">
                  <em>preparing better.</em>
                </span>
              </h2>
              <p className="hm-lead">
                Preparation becomes more purposeful when you know what to
                practise, give yourself the right conditions to attempt
                questions, and take time to understand your performance.
              </p>
            </div>
            <ol className="hm-blocks">
              {approach.map(({ t, d }, i) => (
                <li key={t} className="reveal" data-reveal style={{ "--i": i }}>
                  <span className="hm-block-n" aria-hidden="true">
                    0{i + 1}
                  </span>
                  <div>
                    <h3>{t}</h3>
                    <p>{d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* 4 — Paths */}
        <section
          className="hm-section hm-section--surface"
          id="exams"
          aria-labelledby="cat-title">
          <div className="hm-container">
            <div className="hm-head reveal" data-reveal>
              <p className="hm-eyebrow">Find your direction</p>
              <h2 id="cat-title">
                Different goals. One focused place to practise.
              </h2>
              <p className="hm-lead">
                Start with the kind of preparation that matches your next
                milestone.
              </p>
            </div>
            <div className="hm-paths">
              <article className="hm-path hm-path--gov reveal" data-reveal>
                <span className="hm-chip">
                  <Landmark size={22} aria-hidden="true" />
                </span>
                <h3>Government Exam Preparation</h3>
                <p>
                  Build a consistent preparation routine for competitive
                  government examinations. Practise relevant question types,
                  strengthen topic familiarity, and use timed attempts to
                  develop a better sense of exam pacing.
                </p>
                <ul className="hm-tags">
                  <li>Topic-wise Practice</li>
                  <li>Timed Mock Tests</li>
                  <li>Question Revision</li>
                </ul>
                <a className="hm-link" href={routes.exams}>
                  Explore Government Exam Practice{" "}
                  <ArrowRight size={16} aria-hidden="true" />
                </a>
              </article>
              <article
                className="hm-path hm-path--place reveal"
                data-reveal
                style={{ "--i": 1 }}>
                <span className="hm-path-n" aria-hidden="true">
                  02
                </span>
                <span className="hm-chip">
                  <Briefcase size={22} aria-hidden="true" />
                </span>
                <h3>Placement Preparation</h3>
                <p>
                  Prepare for campus placements and off-campus assessments by
                  practising aptitude, logical reasoning, quantitative
                  questions, and technical fundamentals relevant to your
                  preparation goals.
                </p>
                <ul className="hm-tags">
                  <li>Quantitative Aptitude</li>
                  <li>Logical Reasoning</li>
                  <li>Technical Practice</li>
                </ul>
                <a className="hm-link" href={routes.exams}>
                  Explore Placement Preparation{" "}
                  <ArrowRight size={16} aria-hidden="true" />
                </a>
              </article>
              <article
                className="hm-path hm-path--quiz reveal"
                data-reveal
                style={{ "--i": 2 }}>
                <span className="hm-chip">
                  <Zap size={22} aria-hidden="true" />
                </span>
                <h3>Practice Quizzes</h3>
                <p>
                  Use focused question sets for short study sessions, topic
                  revision, and quick practice between longer mock examinations.
                </p>
                <ul className="hm-tags">
                  <li>Focused Question Sets</li>
                  <li>Quick Revision</li>
                  <li>Topic Practice</li>
                </ul>
                <a className="hm-link" href={routes.exams}>
                  Explore Practice Options{" "}
                  <ArrowRight size={16} aria-hidden="true" />
                </a>
              </article>
            </div>
          </div>
        </section>

        {/* 5 — Navy statement */}
        <section
          className="hm-section hm-section--navy"
          aria-labelledby="statement-title">
          <BgWord speed="-0.06" className="hm-bgword--right hm-bgword--dark">
            FOCUS
          </BgWord>
          <span
            className="hm-ring hm-ring--1"
            aria-hidden="true"
            data-speed="0.05"
          />
          <div className="hm-container">
            <div className="hm-head reveal" data-reveal>
              <p className="hm-eyebrow hm-eyebrow--dark">Our approach</p>
              <h2 id="statement-title">
                Every attempt can{" "}
                <span className="hm-accent-light">
                  <em>teach you something.</em>
                </span>
              </h2>
              <p className="hm-lead">
                A practice session is more than a set of answers. It is an
                opportunity to understand your approach, identify where you need
                more work, and return with a clearer plan.
              </p>
            </div>
            <ol className="hm-seq">
              {cycle.map(({ t, d }, i) => (
                <li key={t} className="reveal" data-reveal style={{ "--i": i }}>
                  <span className="hm-seq-n" aria-hidden="true">
                    0{i + 1}
                  </span>
                  <h3>{t}</h3>
                  <p>{d}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* 6 — Features */}
        <section
          className="hm-section"
          id="features"
          aria-labelledby="why-title">
          <div className="hm-container">
            <div className="hm-head reveal" data-reveal>
              <p className="hm-eyebrow">The practice toolkit</p>
              <h2 id="why-title">
                A more considered way to prepare for the questions ahead.
              </h2>
              <p className="hm-lead">
                Build a practice routine around focused attempts, realistic
                timing, meaningful review, and consistent revision.
              </p>
            </div>
            <div className="hm-bento">
              <article className="hm-tile hm-tile--lead reveal" data-reveal>
                <h3>Timed Mock Tests</h3>
                <p>
                  Practise within a defined time limit to develop awareness of
                  pacing, question selection, and the time you spend on
                  individual problems.
                </p>
                <div className="hm-mini" aria-hidden="true">
                  <span className="hm-timer">
                    <Timer size={14} /> 42:15
                  </span>
                  <div className="hm-bar">
                    <span style={{ "--w": "58%" }} />
                  </div>
                  <QGrid total={20} done={11} wide />
                </div>
              </article>
              <article
                className="hm-tile reveal"
                data-reveal
                style={{ "--i": 1 }}>
                <h3>Topic-based Practice</h3>
                <p>
                  Focus on individual topics and question types. Use shorter
                  sessions to strengthen specific areas before moving to broader
                  practice.
                </p>
                <ul className="hm-mini hm-mini-list" aria-hidden="true">
                  {[
                    ["Percentages", 80],
                    ["Ratios", 55],
                    ["Time & Work", 30],
                  ].map(([n, w]) => (
                    <li key={n}>
                      <span>{n}</span>
                      <div className="hm-bar">
                        <span style={{ "--w": `${w}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
              </article>
              <article
                className="hm-tile reveal"
                data-reveal
                style={{ "--i": 2 }}>
                <h3>Performance Review</h3>
                <p>
                  Review sample results and question-level progress to
                  understand how an attempt went and decide which areas deserve
                  more attention.
                </p>
                <div className="hm-chart hm-mini" aria-hidden="true">
                  {[62, 78, 45, 88, 70].map((h, n) => (
                    <span key={n} style={{ "--h": `${h}%` }} />
                  ))}
                </div>
                <small className="hm-sample">Illustrative sample</small>
              </article>
              <article
                className="hm-tile reveal"
                data-reveal
                style={{ "--i": 3 }}>
                <h3>Focused Revision</h3>
                <p>
                  Return to questions and concepts that need another look
                  instead of treating every revision session as a completely new
                  start.
                </p>
                <ul className="hm-mini hm-status" aria-hidden="true">
                  <li className="warn">Q12 · Revisit</li>
                  <li className="ok">Q07 · Reviewed</li>
                  <li>Q19 · New</li>
                </ul>
              </article>
              <article
                className="hm-tile reveal"
                data-reveal
                style={{ "--i": 4 }}>
                <h3>Placement-oriented Practice</h3>
                <p>
                  Build familiarity with aptitude, quantitative reasoning,
                  logical reasoning, and technical practice relevant to
                  placement preparation.
                </p>
                <ul className="hm-tags hm-mini" aria-hidden="true">
                  <li>Quantitative</li>
                  <li>Logical Reasoning</li>
                  <li>Verbal</li>
                  <li>Technical</li>
                </ul>
              </article>
              <article
                className="hm-tile hm-tile--wide reveal"
                data-reveal
                style={{ "--i": 5 }}>
                <div>
                  <h3>Responsive Learning Experience</h3>
                  <p>
                    Use a consistent interface across desktop, tablet, and
                    mobile so your practice sessions can fit different study
                    environments.
                  </p>
                </div>
                <div className="hm-devices" aria-hidden="true">
                  <div className="hm-laptop">
                    <span />
                    <span />
                  </div>
                  <div className="hm-phone">
                    <span />
                    <span />
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* 7 — Product showcase */}
        <section
          className="hm-section hm-section--surface"
          id="showcase"
          aria-labelledby="prev-title">
          <div className="hm-container">
            <div className="hm-head reveal" data-reveal>
              <p className="hm-eyebrow">Product experience</p>
              <h2 id="prev-title">
                A practice workspace designed to keep you focused.
              </h2>
              <p className="hm-lead">
                From the first question to the final review, a clear interface
                helps you concentrate on the work in front of you.
              </p>
            </div>
            <div data-speed="-0.02">
              <div className="hm-browser reveal" data-reveal>
                <div className="hm-app-bar">
                  <i />
                  <i />
                  <i />
                  <span>Illustrative preview · sample session</span>
                </div>
                <div className="hm-dash">
                  <aside>
                    <p className="hm-label">Question navigator</p>
                    <QGrid total={30} done={14} wide />
                    <ul className="hm-legend">
                      <li>
                        <i className="done" />
                        Answered
                      </li>
                      <li>
                        <i className="cur" />
                        Current
                      </li>
                      <li>
                        <i />
                        Not answered
                      </li>
                    </ul>
                  </aside>
                  <div>
                    <div className="hm-dash-top">
                      <span className="hm-pill">Sample aptitude mock test</span>
                      <span className="hm-timer">
                        <Timer size={14} aria-hidden="true" /> 42:15 left
                      </span>
                    </div>
                    <p className="hm-label">Question 15 of 30 · Sample</p>
                    <p className="hm-q">
                      Which of the following numbers is a prime number?
                    </p>
                    <ul className="hm-opts">
                      {["21", "27", "29", "33"].map((o, n) => (
                        <li key={o} className={n === 2 ? "sel" : ""}>
                          <b>
                            {n === 2 ? (
                              <Check size={14} aria-hidden="true" />
                            ) : (
                              "ABCD"[n]
                            )}
                          </b>
                          {o}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <aside>
                    <p className="hm-label">Progress · 14 of 30 answered</p>
                    <div className="hm-bar hm-bar--big">
                      <span style={{ "--w": "47%" }} />
                    </div>
                    <p className="hm-label">Review panel (sample)</p>
                    <ul className="hm-counts">
                      <li>
                        <b>14</b>Answered
                      </li>
                      <li>
                        <b>2</b>Marked
                      </li>
                      <li>
                        <b>16</b>Remaining
                      </li>
                    </ul>
                    <p className="hm-label">Topic performance (sample)</p>
                    {[
                      ["Quantitative", 72],
                      ["Reasoning", 58],
                      ["Verbal", 81],
                    ].map(([n, w]) => (
                      <div key={n} className="hm-perf">
                        <span>{n}</span>
                        <div className="hm-bar">
                          <span style={{ "--w": `${w}%` }} />
                        </div>
                      </div>
                    ))}
                  </aside>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 8 — Study guide */}
        <section
          className="hm-section"
          id="guide"
          aria-labelledby="guide-title">
          <BgWord speed="0.05" className="hm-bgword--left">
            PROGRESS
          </BgWord>
          <div className="hm-container hm-guide">
            <div className="hm-guide-left reveal" data-reveal>
              <p className="hm-eyebrow">Build a consistent routine</p>
              <h2 id="guide-title">
                Make each study session{" "}
                <span className="hm-accent">
                  <em>count.</em>
                </span>
              </h2>
              <p className="hm-lead">
                A useful preparation routine combines focused practice, careful
                review, and time to revisit concepts that need attention.
              </p>
            </div>
            <ol className="hm-principles">
              {principles.map(({ t, d }, i) => (
                <li key={t} className="reveal" data-reveal style={{ "--i": i }}>
                  <span className="hm-principle-n" aria-hidden="true">
                    {i + 1}
                  </span>
                  <div>
                    <h3>{t}</h3>
                    <p>{d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* 9 — How it works */}
        <section
          className="hm-section hm-section--teal"
          id="how"
          aria-labelledby="how-title">
          <BgWord speed="-0.05" className="hm-bgword--outline hm-bgword--right">
            PRACTICE
          </BgWord>
          <div className="hm-container">
            <div className="hm-head reveal" data-reveal>
              <p className="hm-eyebrow">How it works</p>
              <h2 id="how-title">
                From choosing an exam to planning your next attempt.
              </h2>
            </div>
            <ol className="hm-steps">
              {steps.map(({ t, d }, i) => (
                <li key={t} className="reveal" data-reveal style={{ "--i": i }}>
                  <span className="hm-step-node">{i + 1}</span>
                  <h3>{t}</h3>
                  <p>{d}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* 10 — Structured vs unstructured */}
        <section
          className="hm-section"
          id="structure"
          aria-labelledby="struct-title">
          <div className="hm-container">
            <div className="hm-head reveal" data-reveal>
              <p className="hm-eyebrow">Why structure matters</p>
              <h2 id="struct-title">
                Replace unfocused repetition with{" "}
                <span className="hm-accent">
                  <em>intentional practice.</em>
                </span>
              </h2>
              <p className="hm-lead">
                These are common study habits and recommended approaches, not
                guarantees of any result.
              </p>
            </div>
            <div className="hm-compare">
              <div
                className="hm-compare-col hm-compare-col--without reveal"
                data-reveal>
                <h3>Without a clear routine</h3>
                <ul>
                  {without.map((t) => (
                    <li key={t}>
                      <X size={18} aria-hidden="true" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
              <div
                className="hm-compare-col hm-compare-col--with reveal"
                data-reveal
                style={{ "--i": 1 }}>
                <h3>With a structured routine</h3>
                <ul>
                  {withRoutine.map((t) => (
                    <li key={t}>
                      <Check size={18} aria-hidden="true" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* 11 — Roadmap */}
        <section
          className="hm-section hm-section--surface"
          id="roadmap"
          aria-labelledby="road-title">
          <div className="hm-container">
            <div className="hm-head reveal" data-reveal>
              <p className="hm-eyebrow">Preparation roadmap</p>
              <h2 id="road-title">Build a routine you can return to.</h2>
              <p className="hm-lead">
                Preparation does not have to be perfect every day. A clear next
                step can help you maintain direction and make better use of each
                session. This is a suggested framework, not a fixed schedule.
              </p>
            </div>
            <ol className="hm-road">
              {roadmap.map(({ t, d }, i) => (
                <li key={t} className="reveal" data-reveal style={{ "--i": i }}>
                  <span className="hm-road-node">{i + 1}</span>
                  <h3>{t}</h3>
                  <p>{d}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* 12 — FAQ */}
        <section className="hm-section" id="faq" aria-labelledby="faq-title">
          <div className="hm-container hm-faq-grid">
            <div className="reveal" data-reveal>
              <p className="hm-eyebrow">Questions</p>
              <h2 id="faq-title">Frequently asked questions</h2>
              <p className="hm-lead">
                Straightforward answers about getting started with VidyaExam.
              </p>
            </div>
            <div className="reveal" data-reveal>
              <Faq items={faqs} />
            </div>
          </div>
        </section>

        {/* 13 — Final CTA */}
        <section
          className="hm-section hm-section--cta"
          aria-labelledby="cta-title">
          <div className="hm-container">
            <div className="hm-cta reveal" data-reveal>
              <BgWord speed="0.04" className="hm-bgword--cta">
                YOUR FUTURE
              </BgWord>
              <span
                className="hm-ring hm-ring--1"
                aria-hidden="true"
                data-speed="0.05"
              />
              <span
                className="hm-ring hm-ring--2"
                aria-hidden="true"
                data-speed="-0.04"
              />
              <h2 id="cta-title">
                Your next focused attempt{" "}
                <span className="hm-accent-light">
                  <em>starts here.</em>
                </span>
              </h2>
              <p>
                Choose your preparation path, practise with purpose, and use
                what you learn from each attempt to plan the next one.
              </p>
              <div className="hm-cta-row hm-cta-row--center">
                <a
                  className="hm-btn hm-btn--light hm-btn--lg"
                  href={routes.register}>
                  Get Started <ArrowRight size={18} aria-hidden="true" />
                </a>
                <a
                  className="hm-btn hm-btn--ghost-light hm-btn--lg"
                  href={routes.exams}>
                  Explore Exams
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
