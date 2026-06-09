import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Constants ────────────────────────────────────────────────────────────────
const MAX_TICKETS = 9;   // 3 seasons × α
const BAR_SCALE   = 0.65; // bars fill to 65% max width

const C_TANK   = "#c05c5c"; // muted red   — tank track
const C_HONEST = "#4a7fa5"; // steel blue  — plays-hard track
const C_MERGE  = "#4d9e8b"; // sage green  — convergence callout
const C_BG     = "#0d1726"; // dark navy   — background

const FONT = "'Inter','Helvetica Neue',system-ui,-apple-system,sans-serif";

// ─── Scenario (3 steps) ───────────────────────────────────────────────────────
const STEPS = [
  {
    headline: "Your team missed the playoffs. Again.",
    prose: [
      "Somewhere in the standings sits a team that's been bad for years. Under today's draft lottery, their front office has quietly noticed that losing more games improves their odds at the top pick. Tanking is rational.",
      "COLA was designed to close that door. Follow this team across three seasons — in two parallel universes.",
    ],
    tank:     { tickets: 0, record: null },
    honest:   { tickets: 0, record: null },
    midLabel: null,
    isFinal:  false,
  },
  {
    headline: "The season ends. Twice.",
    prose: [
      "Universe A: your team went 20–62. Universe B: they competed every night and went 38–44. In both, they missed the playoffs.",
      "COLA opens the ticket window. It doesn't ask how you got here — it asks one question: did you miss the playoffs? Yes. Three tickets. Each.",
    ],
    tank:     { tickets: 3, record: "20–62" },
    honest:   { tickets: 3, record: "38–44" },
    midLabel: "+3 each · record irrelevant",
    isFinal:  false,
  },
  {
    headline: "Three seasons. One number.",
    prose: [
      "Nine tickets. Both of them. The team that engineered 150 losses across three years holds exactly the same lottery equity as the team that competed until the final week.",
      "That's not a side effect of COLA. That's the proof of concept.",
    ],
    tank:     { tickets: 9, record: "16–66" },
    honest:   { tickets: 9, record: "34–48" },
    midLabel: null,
    isFinal:  true,
  },
];

const DEDUCTIONS = [
  { pick: "Pick #1",    cost: "Full reset", sub: "back to 0",         accent: true },
  { pick: "Pick #2",    cost: "−75%",       sub: "keep a quarter" },
  { pick: "Pick #3",    cost: "−50%",       sub: "keep half" },
  { pick: "Pick #4",    cost: "−25%",       sub: "keep three-quarters" },
  { pick: "Picks 5–14", cost: "No cost",    sub: "keep everything",   dim: true },
];

// ─── Bar ──────────────────────────────────────────────────────────────────────
function TicketBar({ data, color, label, dormant }) {
  const { tickets, record } = data;
  const pct = (tickets / MAX_TICKETS) * BAR_SCALE * 100;

  if (dormant) {
    return (
      <div style={{ opacity: 0.12 }}>
        <div style={{
          height: 10, width: 70, borderRadius: 4,
          background: color, marginBottom: 10, opacity: 0.6,
        }} />
        <div style={{
          height: 54, borderRadius: 8,
          background: "rgba(255,255,255,0.18)",
        }} />
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
        <span style={{
          color, fontFamily: FONT, fontSize: 11, fontWeight: 800,
          letterSpacing: "0.13em", textTransform: "uppercase",
        }}>
          {label}
        </span>
        {record && (
          <span style={{ color: "rgba(255,255,255,0.38)", fontSize: 12, fontFamily: FONT }}>
            {record}
          </span>
        )}
      </div>

      <div style={{
        position: "relative", height: 54,
        borderRadius: 8, background: "rgba(255,255,255,0.08)",
        overflow: "hidden",
      }}>
        <motion.div
          initial={{ width: "0%" }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: "absolute", top: 0, bottom: 0, left: 0,
            background: color, borderRadius: 8,
            display: "flex", alignItems: "center", justifyContent: "flex-end",
          }}
        >
          <AnimatePresence mode="wait">
            {tickets > 0 && (
              <motion.span
                key={tickets}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { delay: 0.52, duration: 0.22 } }}
                exit={{ opacity: 0, transition: { duration: 0.12 } }}
                style={{
                  color: "white", fontFamily: FONT,
                  fontWeight: 900, fontSize: 26,
                  lineHeight: 1, paddingRight: 14,
                  textShadow: "0 1px 4px rgba(0,0,0,0.3)",
                }}
              >
                {tickets}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}

// ─── Mid section between bars ─────────────────────────────────────────────────
function MidSection({ midLabel, isFinal, stepIndex }) {
  return (
    <div style={{ minHeight: 52, display: "flex", alignItems: "center", padding: "4px 0" }}>
      <AnimatePresence mode="wait">
        {isFinal ? (
          <motion.div
            key="convergence"
            initial={{ opacity: 0, scale: 0.82 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
            transition={{ delay: 0.9, duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
            style={{ display: "flex", alignItems: "center", gap: 16, width: "100%" }}
          >
            <div style={{ flex: 1, height: 1.5, borderRadius: 1, background: `${C_TANK}80` }} />
            <span style={{
              background: C_MERGE, color: "white", fontFamily: FONT,
              fontSize: 11, fontWeight: 800,
              letterSpacing: "0.08em", textTransform: "uppercase",
              padding: "6px 16px", borderRadius: 99, whiteSpace: "nowrap",
            }}>
              same tickets · tanking bought nothing
            </span>
            <div style={{ flex: 1, height: 1.5, borderRadius: 1, background: `${C_HONEST}80` }} />
          </motion.div>
        ) : midLabel ? (
          <motion.div
            key={`mid-${stepIndex}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.25 } }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
            style={{ display: "flex", alignItems: "center", gap: 12, width: "100%" }}
          >
            {/* ] bracket spanning both tracks */}
            <div style={{
              width: 14, alignSelf: "stretch",
              borderRight: "1.5px solid rgba(255,255,255,0.22)",
              borderTop: "1.5px solid rgba(255,255,255,0.22)",
              borderBottom: "1.5px solid rgba(255,255,255,0.22)",
              borderRadius: "0 5px 5px 0",
              flexShrink: 0,
            }} />
            <span style={{
              color: "rgba(255,255,255,0.45)", fontFamily: FONT,
              fontSize: 11, fontWeight: 700,
              letterSpacing: "0.1em", textTransform: "uppercase",
              whiteSpace: "nowrap",
            }}>
              {midLabel}
            </span>
          </motion.div>
        ) : (
          <motion.div key="empty" style={{ width: "100%" }} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Reference card ───────────────────────────────────────────────────────────
function ReferenceCard({ step }) {
  const isActive = step === 2;
  return (
    <div style={{
      marginTop: 48, paddingTop: 24,
      borderTop: "1px solid rgba(255,255,255,0.08)",
      opacity: isActive ? 0.88 : 0.3,
      transition: "opacity 0.5s ease",
    }}>
      <p style={{
        fontFamily: FONT, fontSize: 10, fontWeight: 800,
        letterSpacing: "0.16em", textTransform: "uppercase",
        color: "rgba(255,255,255,0.4)", marginBottom: 4,
      }}>
        For reference — cost of winning a top pick
      </p>
      <p style={{
        fontFamily: FONT, fontSize: 13, lineHeight: 1.6,
        color: "rgba(255,255,255,0.35)", maxWidth: 420, marginBottom: 16,
      }}>
        Landing a top pick resets your ticket count. The better the pick, the steeper the cost.
      </p>

      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        {DEDUCTIONS.map(({ pick, cost, sub, accent, dim }) => (
          <div key={pick} style={{
            display: "flex", alignItems: "center",
            justifyContent: "space-between",
            padding: "7px 0",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            opacity: dim ? 0.4 : 1,
          }}>
            <span style={{
              fontFamily: "'SF Mono','Fira Code','Fira Mono',monospace",
              fontSize: 12, fontWeight: 600,
              color: accent ? "#f87171" : "rgba(255,255,255,0.6)",
            }}>
              {pick}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <span style={{
                fontFamily: FONT, fontSize: 13, fontWeight: 700,
                color: accent ? "#f87171" : "rgba(255,255,255,0.75)",
              }}>
                {cost}
              </span>
              <span style={{
                fontFamily: FONT, fontSize: 11,
                color: "rgba(255,255,255,0.3)",
                minWidth: 110, textAlign: "right",
              }}>
                {sub}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function COLAExplainer() {
  const [step, setStep] = useState(0);
  const cur = STEPS[step];
  const isDormant = step === 0;
  const isLast = step === STEPS.length - 1;

  return (
    <div style={{
      maxWidth: 680, margin: "0 auto",
      padding: "64px 24px 80px",
      fontFamily: FONT,
      color: "white",
      background: C_BG,
    }}>

      {/* Header */}
      <header style={{ marginBottom: 56 }}>
        <p style={{
          fontSize: 11, fontWeight: 800, letterSpacing: "0.16em",
          textTransform: "uppercase", color: "rgba(255,255,255,0.35)", margin: "0 0 16px",
        }}>
          Mechanism · COLA
        </p>
        <h1 style={{
          fontSize: "clamp(2rem, 5vw, 3.2rem)",
          fontWeight: 900, lineHeight: 1.08,
          letterSpacing: "-0.03em",
          margin: "0 0 20px", color: "white",
        }}>
          Your record<br />
          doesn't matter.<br />
          <span style={{ color: "rgba(255,255,255,0.28)" }}>That's the point.</span>
        </h1>
        <p style={{
          fontSize: 17, lineHeight: 1.8,
          color: "rgba(255,255,255,0.55)", maxWidth: 500, margin: "0 0 14px",
        }}>
          The Competitive Order Lottery Algorithm gives non-playoff teams tickets for{" "}
          <em>missing</em> the playoffs — not for <em>losing</em> games.
          One team, two universes, three seasons.
        </p>
        <p style={{
          fontSize: 15, lineHeight: 1.7,
          color: "rgba(255,255,255,0.35)", maxWidth: 500, margin: 0,
          fontStyle: "italic",
        }}>
          Right now, a worse record means better lottery odds — tanking is mathematically rational.
          COLA cuts that link entirely.
        </p>
      </header>

      {/* Step pill nav */}
      <div style={{ display: "flex", gap: 8, marginBottom: 40 }}>
        {STEPS.map((_, i) => (
          <button
            key={i}
            onClick={() => setStep(i)}
            aria-label={`Step ${i + 1}`}
            style={{
              height: 8, borderRadius: 4, border: "none",
              cursor: "pointer", padding: 0,
              transition: "all 0.3s ease",
              width: i === step ? 28 : 8,
              background: i === step ? "white" : "rgba(255,255,255,0.2)",
            }}
          />
        ))}
      </div>

      {/* Step text — crossfades on step change */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          style={{ marginBottom: 36 }}
        >
          <h2 style={{
            fontSize: 22, fontWeight: 800, lineHeight: 1.3,
            letterSpacing: "-0.02em", margin: "0 0 14px", color: "white",
          }}>
            {cur.headline}
          </h2>
          {cur.prose.map((p, i) => (
            <p key={i} style={{
              fontSize: 15.5, lineHeight: 1.8,
              color: "rgba(255,255,255,0.5)",
              margin: i < cur.prose.length - 1 ? "0 0 12px" : 0,
            }}>
              {p}
            </p>
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Chart — key forces remount when dormant→active to trigger entry animation */}
      <div style={{ marginBottom: 28 }}>
        <TicketBar
          key={`tank-${isDormant}`}
          data={cur.tank} color={C_TANK} label="Tanks" dormant={isDormant}
        />
        <MidSection midLabel={cur.midLabel} isFinal={cur.isFinal} stepIndex={step} />
        <TicketBar
          key={`honest-${isDormant}`}
          data={cur.honest} color={C_HONEST} label="Plays hard" dormant={isDormant}
        />
      </div>

      {/* Ticket dot accumulator */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 36 }}>
        {Array.from({ length: MAX_TICKETS }).map((_, i) => (
          <motion.div
            key={i}
            animate={{
              background: i < cur.tank.tickets
                ? "rgba(255,255,255,0.55)"
                : "rgba(255,255,255,0.1)",
            }}
            transition={{ duration: 0.35, delay: i * 0.04 }}
            style={{ width: 7, height: 7, borderRadius: "50%" }}
          />
        ))}
        {!isDormant && (
          <span style={{
            fontSize: 12, color: "rgba(255,255,255,0.3)",
            marginLeft: 4, fontFamily: FONT,
          }}>
            {cur.tank.tickets} ticket{cur.tank.tickets !== 1 ? "s" : ""} so far
          </span>
        )}
      </div>

      {/* Navigation */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.08)",
      }}>
        <button
          onClick={() => setStep(s => Math.max(0, s - 1))}
          disabled={step === 0}
          style={{
            fontFamily: FONT, background: "none", border: "none",
            fontSize: 14, fontWeight: 600,
            color: step === 0 ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.5)",
            cursor: step === 0 ? "default" : "pointer",
            padding: "8px 0", transition: "color 0.2s",
          }}
        >
          ← Back
        </button>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", fontFamily: FONT }}>
          {step + 1} of {STEPS.length}
        </span>

        {isLast ? (
          <span style={{
            fontFamily: FONT, fontSize: 14, fontWeight: 700,
            color: C_MERGE, padding: "8px 0",
          }}>
            Done ✓
          </span>
        ) : step === 0 ? (
          <motion.button
            onClick={() => setStep(1)}
            animate={{
              boxShadow: [
                "0 0 0 0px rgba(77,158,139,0.5)",
                "0 0 0 8px rgba(77,158,139,0)",
              ],
            }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
            style={{
              fontFamily: FONT, border: "none", cursor: "pointer",
              background: C_MERGE, color: "white",
              fontSize: 15, fontWeight: 800,
              padding: "11px 26px", borderRadius: 8,
            }}
          >
            See how it works →
          </motion.button>
        ) : (
          <button
            onClick={() => setStep(s => Math.min(STEPS.length - 1, s + 1))}
            style={{
              fontFamily: FONT, background: "none", border: "none",
              fontSize: 14, fontWeight: 700, color: "white",
              cursor: "pointer", padding: "8px 0", transition: "color 0.2s",
            }}
          >
            Next →
          </button>
        )}
      </div>

      {/* Reference card — dims until final step */}
      <ReferenceCard step={step} />
    </div>
  );
}
