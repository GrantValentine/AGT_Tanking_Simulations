// main.js — NBA Tanking Visual Essay (Mobile version)

// ── Constants ──────────────────────────────────────────────────────────────────
const COLORS = {
  nba_lottery:            "#E63946",
  bilevel:                "#2196F3",
  cola:                   "#4CAF50",
  weighted_loss_exp_hl20: "#FF9800",
  nba_321_lottery:        "#9C27B0",
};

const MECH_LABELS = {
  nba_lottery:            "NBA Lottery",
  bilevel:                "Bilevel",
  cola:                   "COLA",
  weighted_loss_exp_hl20: "Weighted Loss",
  nba_321_lottery:        "NBA 3-2-1",
};

const MECH_ORDER = ["nba_lottery", "bilevel", "weighted_loss_exp_hl20", "nba_321_lottery", "cola"];

const NAVY  = "#1B3A6B";
const RED   = "#C8102E";
const GRAY  = "#555555";
const LGRAY = "#AAAAAA";

// ── Player card configs ────────────────────────────────────────────
const PLAYER_CONFIGS = {
  lebron:     { img: "lebron.png",     name: "LeBron James",      team: "Cleveland Cavaliers",  year: 2003, pick: 1,  tc: "#2e1215", ta: "#8e1f2a",
    back: { ppg: 27.1, rpg: 7.5, apg: 7.4, accolades: ["4× NBA Champion", "4× MVP", "4× Finals MVP", "2× Olympic Gold", "20× All-Star"] } },
  hakeem:     { img: "hakeem.png",     name: "Hakeem Olajuwon",   team: "Houston Rockets",      year: 1984, pick: 1,  tc: "#241010", ta: "#9b1e1e",
    back: { ppg: 21.8, rpg: 11.1, apg: 2.5, accolades: ["2× NBA Champion", "2× Finals MVP", "1× MVP", "1× DPOY", "12× All-Star"] } },
  wembanyama: { img: "wembanyama.png", name: "Victor Wembanyama", team: "San Antonio Spurs",    year: 2023, pick: 1,  tc: "#131519", ta: "#4a5268",
    back: { ppg: 24.0, rpg: 10.6, apg: 3.9, accolades: ["2024 DPOY", "2024 All-Star", "2024 All-NBA First Team", "2024 Rookie of the Year"] } },
  curry:      { img: "curry.png",      name: "Steph Curry",       team: "Golden State Warriors", year: 2009, pick: 7,  tc: "#0d1928", ta: "#1a4a94",
    back: { ppg: 24.8, rpg: 4.7, apg: 6.3, accolades: ["4× NBA Champion", "2× MVP (unanimous 2016)", "2× Finals MVP", "Olympic Gold (2024)", "10× All-Star"] } },
  bynum:      { img: "bynum.png",      name: "Andrew Bynum",      team: "Los Angeles Lakers",   year: 2005, pick: 10, tc: "#5b3f18", ta: "#8a5f00",
    back: { ppg: 11.5, rpg: 7.9, apg: 0.8, accolades: ["2× NBA Champion (2009, 2010)", "2012 All-Star", "All-Rookie 2nd Team (2006)"] } },
  jefferson:  { img: "jefferson.png",  name: "Richard Jefferson", team: "New Jersey Nets",      year: 2001, pick: 13, tc: "#0c1218", ta: "#1e3558",
    back: { ppg: 13.0, rpg: 4.3, apg: 2.1, accolades: ["1× NBA Champion (2016)", "Olympic Bronze (2004)", "All-Rookie 2nd Team (2002)", "10 NBA seasons"] } },
};

const TEAM_LOGOS = {
  "Cleveland Cavaliers":   "cleveland_cavaliers-logo_brandlogos.net_a6yew-removebg-preview.png",
  "Houston Rockets":       "rockets-removebg-preview.png",
  "San Antonio Spurs":     "san-antonio-spurs-logo-vector-removebg-preview.png",
  "Golden State Warriors": "golden_state_warriors_2010-2019-logo_brandlogos.net_6spin-removebg-preview.png",
  "Los Angeles Lakers":    "los_angeles_lakers-logo-removebg-preview.png",
  "New Jersey Nets":       "brooklyn_nets_2012-2024-logo_brandlogos.net_b9jtf-removebg-preview.png",
};

function _seededTilt(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return Math.round(((h >>> 0) % 300) - 150) / 100;
}

function _hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function _buildBackFace(cardEl, cfg) {
  const backEl = cardEl.querySelector(".pc-back");
  if (!backEl || !cfg.back) return;
  const { ppg, rpg, apg, accolades } = cfg.back;
  backEl.innerHTML = `
    <div class="pc-back-inner">
      <div class="pc-back-player-name">${cfg.name.toUpperCase()}</div>
      <div class="pc-back-context">${cfg.team} · ${cfg.year} · Pick #${cfg.pick}</div>
      <div class="pc-back-divider"></div>
      <div class="pc-back-section-label">Career Averages</div>
      <div class="pc-back-stats-row">
        <div class="pc-back-stat"><span class="pc-back-stat-val">${ppg}</span><span class="pc-back-stat-lbl">PPG</span></div>
        <div class="pc-back-stat"><span class="pc-back-stat-val">${rpg}</span><span class="pc-back-stat-lbl">RPG</span></div>
        <div class="pc-back-stat"><span class="pc-back-stat-val">${apg}</span><span class="pc-back-stat-lbl">APG</span></div>
      </div>
      <div class="pc-back-divider"></div>
      <div class="pc-back-section-label">Accolades</div>
      <ul class="pc-back-accolades">
        ${accolades.map(a => `<li>${a}</li>`).join("")}
      </ul>
      <div class="pc-back-hint">Tap to flip back</div>
    </div>`;
}

function _applyCard(cardEl, wrapEl, cfg) {
  cardEl.style.setProperty("--tc", cfg.tc);
  cardEl.style.setProperty("--ta", cfg.ta);
  cardEl.style.setProperty("--glow-color", _hexToRgba(cfg.ta, 0.42));
  cardEl.style.setProperty("--tc-glow",    _hexToRgba(cfg.ta, 0.22));
  cardEl.style.setProperty("--ta-40",      _hexToRgba(cfg.ta, 0.40));
  cardEl.classList.remove("flipped");
  wrapEl.style.transform = `rotate(${_seededTilt(cfg.name)}deg)`;
  const imgSrc = `../images/player_cards/${cfg.img}?v=2`;
  console.log(`[player-card] loading: ${imgSrc}`);
  const photoEl = cardEl.querySelector(".pc-photo");
  photoEl.style.background = "none";
  photoEl.style.border = "none";
  photoEl.src = imgSrc;
  const spotEl = cardEl.querySelector(".pc-spotlight");
  if (spotEl) spotEl.style.background =
    `radial-gradient(ellipse 85% 75% at 50% 38%, var(--tc-glow) 0%, transparent 65%)`;
  const logoEl = cardEl.querySelector(".pc-logo");
  if (logoEl) {
    const logoFile = TEAM_LOGOS[cfg.team];
    if (logoFile) {
      logoEl.src = `../images/team_logos/${logoFile}`;
      logoEl.style.display = "";
      logoEl.style.filter = cfg.team === "New Jersey Nets" ? "brightness(0) invert(1)" : "";
    } else {
      console.warn(`[player-card] no logo for team: ${cfg.team}`);
      logoEl.style.display = "none";
      logoEl.style.filter = "";
    }
  }
  wrapEl.querySelector(".pc-badge").textContent = `#${cfg.pick} PICK`;
  cardEl.querySelector(".pc-name").textContent = cfg.name.toUpperCase();
  cardEl.querySelector(".pc-meta").textContent = `${cfg.team.toUpperCase()} · ${cfg.year}`;
  _buildBackFace(cardEl, cfg);
  cardEl.onclick = () => cardEl.classList.toggle("flipped");
}

// 2019 NBA lottery: combinations out of 1000 per team rank (worst=1)
const NBA_ODDS = [140, 140, 140, 125, 105, 90, 75, 60, 45, 30, 20, 15, 10, 5];
const NBA_ODDS_PCT = NBA_ODDS.map(v => (v / 10).toFixed(1));

// ── Data ───────────────────────────────────────────────────────────────────────
let DATA = {};

async function loadAll() {
  const files = [
    "pick_values", "tanking_rates", "tau_distances",
    "draft_efficiency", "tanking_timing", "pick_distribution",
    "llm_by_mechanism", "season_trajectory", "nba2k_picks",
  ];
  const results = await Promise.all(
    files.map(f => fetch(`../data/${f}.json`).then(r => r.json()))
  );
  files.forEach((f, i) => { DATA[f] = results[i]; });
}

// ── Utility ────────────────────────────────────────────────────────────────────
function pct(v) { return `${(v * 100).toFixed(1)}%`; }

// ── Section 2: Lottery (Scrollama) ─────────────────────────────────────────────
function initLottery() {
  const container = document.getElementById("lottery-canvas");
  const W = Math.min(container.clientWidth || 360, 360);
  const H = Math.round(W * 0.75);

  const svg = d3.select("#lottery-canvas")
    .append("svg")
    .attr("viewBox", `0 0 ${W} ${H}`)
    .attr("width", "100%")
    .attr("height", "100%");

  const TIER = NBA_ODDS.map((_, i) => i < 3 ? RED : i < 7 ? NAVY : LGRAY);
  const NSQUARES = NBA_ODDS.map(c => c / 5);

  const ballR = W * 0.060;
  const ballData = NBA_ODDS.map((combo, i) => ({
    id: i, combo,
    nbaRank: 30 - i,
    color: TIER[i],
    x: W * 0.5 + (Math.random() - 0.5) * W * 0.35,
    y: H * 0.48 + (Math.random() - 0.5) * H * 0.35,
    vx: 0, vy: 0,
  }));

  let currentState = -1;
  let _pickedBalls = new Set();

  const sim = d3.forceSimulation(ballData)
    .force("center", d3.forceCenter(W * 0.5, H * 0.48).strength(0.25))
    .force("collide", d3.forceCollide(ballR + 0.5).strength(0.92).iterations(5))
    .force("charge", d3.forceManyBody().strength(-1))
    .alphaDecay(0.05).alphaTarget(0)
    .stop();

  // Pre-warm: settle positions before first render so balls never appear overlapping
  for (let i = 0; i < 200; i++) sim.tick();
  sim.alphaDecay(0.008).alphaTarget(0.04);

  const ballCircles = svg.selectAll(".l-ball")
    .data(ballData).join("circle")
    .attr("class", "l-ball")
    .attr("r", ballR)
    .attr("fill", "#D8D8D8").attr("stroke", "#BBBBBB").attr("stroke-width", 1.5)
    .attr("cx", d => d.x).attr("cy", d => d.y)
    .attr("pointer-events", "none");

  sim.on("tick", () => {
    if (currentState === 0) {
      ballCircles
        .attr("cx", d => d.x = Math.max(ballR + 4, Math.min(W - ballR - 4, d.x)))
        .attr("cy", d => d.y = Math.max(ballR + 4, Math.min(H - ballR - 4, d.y)));
    }
  });

  const ballNums = svg.selectAll(".l-bnum")
    .data(ballData).join("text")
    .attr("class", "l-bnum")
    .attr("text-anchor", "middle").attr("dominant-baseline", "middle")
    .attr("fill", "#222").attr("font-weight", 700)
    .attr("font-size", ballR * 0.80).attr("opacity", 0)
    .attr("pointer-events", "none")
    .attr("x", d => d.x).attr("y", d => d.y);

  const annoText = svg.append("text").attr("class", "l-anno")
    .attr("text-anchor", "middle")
    .attr("fill", "#888").attr("font-size", Math.max(9, Math.round(W * 0.026)))
    .attr("font-weight", 600).attr("opacity", 0).attr("x", W / 2);

  const SQ   = Math.max(8, Math.round(W * 0.025));
  const GAP  = Math.max(2, Math.round(SQ * 0.20));
  const CELL = SQ + GAP;
  const SQ3   = Math.round(SQ * 0.75);
  const GAP3  = Math.max(1, Math.round(SQ3 * 0.15));
  const CELL3 = SQ3 + GAP3;

  const squareData = [];
  NBA_ODDS.forEach((_, ti) => {
    for (let s = 0; s < NSQUARES[ti]; s++)
      squareData.push({ id: squareData.length, ti, color: TIER[ti] });
  });

  const GCOLS = 20;
  const GW = GCOLS * CELL, GX0 = (W - GW) / 2, GY0 = (H - 10 * CELL) / 2 - 8;
  squareData.forEach((sq, i) => {
    sq.gx = GX0 + (i % GCOLS) * CELL;
    sq.gy = GY0 + Math.floor(i / GCOLS) * CELL;
  });

  const FROW_H = Math.round(H * 0.064);
  const FY0 = Math.max(6, (H - 14 * FROW_H) / 2 - 18);
  const tcnt = new Array(14).fill(0);
  squareData.forEach(sq => {
    const tc = tcnt[sq.ti]++;
    sq.fx = Math.round(W / 2 - (NSQUARES[sq.ti] * CELL) / 2 + tc * CELL);
    sq.fy = Math.round(FY0 + sq.ti * FROW_H);
  });
  const tcnt3 = new Array(14).fill(0);
  squareData.forEach(sq => {
    const tc3 = tcnt3[sq.ti]++;
    sq.fx3 = Math.round(W / 2 - (NSQUARES[sq.ti] * CELL3) / 2 + tc3 * CELL3);
    sq.fy3 = sq.fy;
  });

  // Top-right corner of the grid: balls converge here before squares fan out
  const comboTarget = { x: GX0 + 19 * CELL, y: GY0 };

  const squareRects = svg.selectAll(".l-sq")
    .data(squareData).join("rect")
    .attr("class", "l-sq")
    .attr("width", SQ).attr("height", SQ).attr("rx", 1.5)
    .attr("fill", d => d.color).attr("opacity", 0)
    .attr("x", d => d.gx).attr("y", d => d.gy);

  const sqCap = svg.append("text").attr("class", "l-sq-cap")
    .attr("text-anchor", "middle")
    .attr("fill", "#AAAAAA").attr("font-size", Math.max(8, Math.round(W * 0.020)))
    .attr("opacity", 0)
    .attr("x", W / 2).attr("y", GY0 + 10 * CELL + 14);

  // Hover/touch tooltip for squares (active in steps 2 and 3)
  const sqTooltip = svg.append("text").attr("class", "l-sq-tip")
    .attr("text-anchor", "middle")
    .attr("fill", GRAY).attr("font-size", Math.max(8, Math.round(W * 0.019)))
    .attr("font-weight", 600).attr("opacity", 0)
    .attr("x", W / 2).attr("y", GY0 - 8);

  squareRects
    .on("pointerover", function(event, d) {
      if (currentState < 2) return;
      sqTooltip.text(`Rank #${30 - d.ti}: ${NBA_ODDS_PCT[d.ti]}% chance at pick #1`).attr("opacity", 1);
    })
    .on("pointerout", function() { sqTooltip.attr("opacity", 0); });

  // Legend for steps 2 and 3 — evenly spaced by computed item widths
  const legRowY = H - 26;
  const legendG = svg.append("g").attr("class", "l-legend").attr("opacity", 0);
  const legFontSz = Math.max(13, Math.round(W * 0.034));
  const legBoxSz = 18;
  const legItems = [
    { color: RED,   label: "Worst 3 teams" },
    { color: NAVY,  label: "Ranks 4-7" },
    { color: LGRAY, label: "Ranks 8-14" },
  ];
  const legItemWidths = legItems.map(d => legBoxSz + 4 + d.label.length * legFontSz * 0.58);
  const legGap = Math.max(6, (W - 8 - legItemWidths.reduce((a, b) => a + b, 0)) / (legItems.length - 1));
  let curLegX = 4;
  legItems.forEach((item, li) => {
    legendG.append("rect").attr("x", curLegX).attr("y", legRowY)
      .attr("width", legBoxSz).attr("height", legBoxSz).attr("fill", item.color).attr("rx", 2);
    legendG.append("text").attr("x", curLegX + legBoxSz + 4).attr("y", legRowY + 13)
      .attr("fill", GRAY).attr("font-size", legFontSz)
      .text(item.label);
    curLegX += legItemWidths[li] + legGap;
  });

  let rankLblTimer = null;

  function showState(step) {
    currentState = step;
    clearTimeout(rankLblTimer);

    if (step === 0) {
      ballData.forEach(d => { d.vx = 0; d.vy = 0; });
      sim.alphaTarget(0.04).restart();
      ballCircles.transition().duration(500)
        .attr("r", ballR).attr("fill", "#D8D8D8").attr("stroke", "#BBBBBB").attr("opacity", 1);
      ballNums.transition().duration(300).attr("opacity", 0);
      squareRects.transition().duration(400).attr("opacity", 0);
      sqCap.transition().duration(300).attr("opacity", 0);
      annoText.transition().duration(300).attr("opacity", 0);
      legendG.transition().duration(300).attr("opacity", 0);
      sqTooltip.attr("opacity", 0);
      svg.selectAll(".l-rank-lbl").transition().duration(300).attr("opacity", 0).remove();

    } else if (step === 1) {
      sim.alphaTarget(0).stop();
      squareRects.transition().duration(300).attr("opacity", 0);
      sqCap.transition().duration(300).attr("opacity", 0);
      legendG.transition().duration(300).attr("opacity", 0);
      sqTooltip.attr("opacity", 0);
      svg.selectAll(".l-rank-lbl").remove();

      const picked = d3.shuffle([0,1,2,3,4,5,6,7,8,9,10,11,12,13]).slice(0, 4);
      const pSet   = new Set(picked);
      _pickedBalls = pSet;
      // Numbers in random (non-sorted) order
      const nums   = d3.shuffle([1,2,3,4,5,6,7,8,9,10,11,12,13,14]).slice(0, 4);

      const spacing = ballR * 2.55;
      const row4X0  = W / 2 - spacing * 1.5;
      const row4Y   = H * 0.41;

      const tx = ballData.map((_, i) => { const pi = picked.indexOf(i); return pi >= 0 ? row4X0 + pi * spacing : ballData[i].x; });
      const ty = ballData.map((_, i) => pSet.has(i) ? row4Y : ballData[i].y);

      ballCircles.transition().duration(700).delay((d, i) => pSet.has(i) ? 0 : 80)
        .attr("cx", (d, i) => { d.x = tx[i]; return tx[i]; })
        .attr("cy", (d, i) => { d.y = ty[i]; return ty[i]; })
        .attr("r",       (d, i) => pSet.has(i) ? ballR * 1.44 : ballR * 0.78)
        .attr("fill",    (d, i) => pSet.has(i) ? "#EEEEEE" : "#D0D0D0")
        .attr("stroke",  (d, i) => pSet.has(i) ? "#888888" : "#C0C0C0")
        .attr("opacity", (d, i) => pSet.has(i) ? 1 : 0.14);

      ballNums.transition().duration(400).delay(700)
        .attr("x", (d, i) => tx[i]).attr("y", (d, i) => ty[i] + 1)
        .attr("font-size", (d, i) => pSet.has(i) ? ballR * 0.88 : ballR * 0.70)
        .attr("opacity", (d, i) => pSet.has(i) ? 1 : 0)
        .text((d, i) => { const pi = picked.indexOf(i); return pi >= 0 ? nums[pi] : ""; });

      annoText.attr("x", W / 2).attr("y", row4Y + ballR * 2.2)
        .text("1 of 1,001 possible combinations")
        .transition().delay(1000).duration(400).attr("opacity", 1);

    } else if (step === 2) {
      sim.stop();
      annoText.transition().duration(200).attr("opacity", 0);
      sqTooltip.attr("opacity", 0);
      svg.selectAll(".l-rank-lbl").remove();

      // Picked balls shrink together and converge to top-right corner of grid
      const comboDur = 500;
      ballCircles
        .transition().duration(comboDur)
        .attr("cx", (d, i) => _pickedBalls.has(i) ? comboTarget.x + SQ / 2 : ballData[i].x)
        .attr("cy", (d, i) => _pickedBalls.has(i) ? comboTarget.y + SQ / 2 : ballData[i].y)
        .attr("r",  (d, i) => _pickedBalls.has(i) ? SQ * 0.55 : ballR * 0.4)
        .attr("opacity", (d, i) => _pickedBalls.has(i) ? 0.85 : 0)
        .transition().duration(250)
        .attr("opacity", 0);
      ballNums.transition().duration(200).attr("opacity", 0);

      // Squares fan out from that same corner
      squareRects
        .attr("x", comboTarget.x).attr("y", comboTarget.y)
        .attr("width", SQ).attr("height", SQ)
        .attr("opacity", 0).attr("fill", d => d.color)
        .transition().duration(320).delay((d, i) => comboDur + 80 + i * 6.5)
        .attr("x", d => d.gx).attr("y", d => d.gy).attr("opacity", 0.88);

      sqCap.text("Each square = 5 combinations · 0.5% chance at pick #1")
        .transition().delay(comboDur + 200 * 6.5 + 500).duration(500).attr("opacity", 1);

      legendG.transition().delay(comboDur + 100).duration(500).attr("opacity", 1);

    } else if (step === 3) {
      sim.stop();
      ballCircles.transition().duration(300).attr("opacity", 0);
      ballNums.transition().duration(300).attr("opacity", 0);
      annoText.transition().duration(300).attr("opacity", 0);
      sqCap.transition().duration(300).attr("opacity", 0);
      sqTooltip.attr("opacity", 0);
      legendG.transition().duration(400).attr("opacity", 1);

      squareRects.interrupt()
        .attr("x", d => d.gx).attr("y", d => d.gy)
        .attr("width", SQ).attr("height", SQ)
        .attr("opacity", 0).attr("fill", d => d.color)
        .transition().duration(620).delay((d, i) => i * 3.2)
        .attr("x", d => d.fx3).attr("y", d => d.fy3)
        .attr("width", SQ3).attr("height", SQ3)
        .attr("opacity", 0.88);

      rankLblTimer = setTimeout(() => {
        svg.selectAll(".l-rank-lbl").remove();
        NSQUARES.forEach((nSq, ti) => {
          const lx = Math.round(W / 2 + (nSq * CELL3) / 2 + 4);
          const ly = Math.round(FY0 + ti * FROW_H + SQ3 / 2 + 3);
          svg.append("text").attr("class", "l-rank-lbl")
            .attr("x", lx).attr("y", ly)
            .attr("fill", TIER[ti])
            .attr("font-size", Math.max(8, Math.round(W * 0.022)))
            .attr("font-weight", ti < 3 ? 700 : 400)
            .attr("opacity", 0)
            .text(`#${30 - ti}: ${NBA_ODDS_PCT[ti]}%`)
            .transition().duration(300).attr("opacity", 1);
        });
      }, 900);
    }
  }

  const scroller = scrollama();
  scroller.setup({
    step: "#lottery-steps .step",
    offset: 0.5,
  }).onStepEnter(({ element }) => {
    document.querySelectorAll("#lottery-steps .step").forEach(s => s.classList.remove("is-active"));
    element.classList.add("is-active");
    showState(+element.dataset.lotteryStep);
  });

}


// ── Section 3: Pick Value Chart (sticky, Scrollama) ───────────────────────────
// Mobile: player line overlay removed (unreadable at mobile widths)
function initPickValues() {
  const nba = DATA.nba2k_picks;
  if (!nba) return;

  const el = document.getElementById("pick-value-chart");
  const W = Math.min(el.clientWidth || 360, 460), H = 240;
  const m = { top: 16, right: 16, bottom: 52, left: 36 };
  const iw = W - m.left - m.right;
  const ih = H - m.top - m.bottom;

  const svg = d3.select("#pick-value-chart")
    .append("svg")
    .attr("viewBox", `0 0 ${W} ${H}`)
    .attr("width", "100%")
    .attr("height", H);

  const g = svg.append("g").attr("transform", `translate(${m.left},${m.top})`);

  const x = d3.scaleBand().domain(nba.picks).range([0, iw]).padding(0.18);

  // Left y-axis: NBA2K ratings (floor at 70)
  const yL = d3.scaleLinear().domain([70, 100]).range([ih, 0]);
  // Sim values scale (same vertical space, 0–100)
  const yR = d3.scaleLinear().domain([0, 100]).range([ih, 0]);

  // Left axis (2K ratings, shown steps 0-5)
  const lAxisG = g.append("g").call(d3.axisLeft(yL).ticks(5));
  lAxisG.selectAll("text").attr("fill", "rgba(255,255,255,0.6)").attr("font-size", 10);
  // Bottom axis — hidden initially, revealed at step 1
  const xAxisG = g.append("g").attr("transform", `translate(0,${ih})`);
  xAxisG.call(d3.axisBottom(x).tickFormat(d => `#${d}`));
  xAxisG.selectAll("text")
    .attr("fill", "rgba(255,255,255,0.6)")
    .attr("font-size", 10)
    .attr("opacity", 0)
    .attr("transform", "rotate(-45)")
    .attr("text-anchor", "end")
    .attr("dx", "-0.4em")
    .attr("dy", "0.3em");
  g.selectAll(".domain,.tick line").attr("stroke", "rgba(255,255,255,0.2)");

  // Left axis for sim values (replaces 2K axis at step 6)
  const simLeftAxisG = g.append("g").attr("opacity", 0);
  simLeftAxisG.call(d3.axisLeft(yR).ticks(5))
    .selectAll("text").attr("fill", "rgba(255,255,255,0.6)").attr("font-size", 9);
  simLeftAxisG.selectAll(".domain,.tick line").attr("stroke", "rgba(255,255,255,0.2)");

  // Y-axis label (text swaps at step 6)
  const lAxisLabel = svg.append("text")
    .attr("transform", `translate(9,${m.top + ih / 2}) rotate(-90)`)
    .attr("text-anchor", "middle")
    .attr("fill", "rgba(255,255,255,0.45)").attr("font-size", 9)
    .text("NBA 2K overall rating");

  // SVG defs: gradient for sim area fill
  const defs = svg.append("defs");
  const simGrad = defs.append("linearGradient")
    .attr("id", "sim-area-grad-m").attr("x1", "0").attr("x2", "0").attr("y1", "0").attr("y2", "1");
  simGrad.append("stop").attr("offset", "0%").attr("stop-color", "#f59e0b").attr("stop-opacity", 0.45);
  simGrad.append("stop").attr("offset", "100%").attr("stop-color", "#f59e0b").attr("stop-opacity", 0.03);

  // Metrics
  const metricsMap = {
    avg_peak:  nba.avg_peak,
    avg_first: nba.avg_first,
    avg_mean:  nba.avg_mean,
  };
  let currentMetric = "avg_peak";
  let lastHighlight = null;
  let currentPrizeStep = -1;

  function applyLeBronBar() {
    const lebron = nba.key_players.find(p => p.year === 2003 && p.pick === 1);
    if (!lebron) return;
    const val = currentMetric === "avg_first" ? lebron.first_rating : lebron.peak_rating;
    if (!val) return;
    bars.filter(d => d.pick === 1)
      .transition().duration(400)
      .attr("y", yL(val))
      .attr("height", ih - yL(val));
  }

  function getMobileStatData(step, metric) {
    const pa = metric === "avg_first" ? nba.avg_first : metric === "avg_mean" ? nba.avg_mean : nba.avg_peak;
    const pickAvg = idx => Math.round(pa[idx] ?? 0);
    const mName = metric === "avg_first" ? "first season rating" : metric === "avg_mean" ? "career avg" : "peak NBA 2K rating";
    if (step <= 1) {
      const kp = nba.key_players.find(p => p.year === 2003 && p.pick === 1);
      const val = metric === "avg_first" ? (kp?.first_rating ?? pickAvg(0)) : (kp?.peak_rating ?? pickAvg(0));
      return { value: val, label: mName, compare: `expected for pick #1: ${pickAvg(0)}`, color: PLAYER_CONFIGS.lebron.ta };
    }
    if (step === 2) {
      return { value: pickAvg(0), label: `25yr avg ${mName}`, compare: null, color: PLAYER_CONFIGS.hakeem.ta };
    }
    if (step === 3) {
      const kp = nba.key_players.find(p => p.year === 2023 && p.pick === 1);
      const val = kp ? (metric === "avg_first" ? (kp.first_rating ?? pickAvg(0)) : metric === "avg_mean" ? (kp.mean_rating ?? pickAvg(0)) : (kp.peak_rating ?? pickAvg(0))) : pickAvg(0);
      return { value: val, label: mName, compare: `expected for pick #1: ${pickAvg(0)}`, color: PLAYER_CONFIGS.wembanyama.ta };
    }
    if (step === 4) {
      const kp = nba.key_players.find(p => p.year === 2009 && p.pick === 7);
      const val = kp ? (metric === "avg_first" ? (kp.first_rating ?? pickAvg(6)) : metric === "avg_mean" ? (kp.mean_rating ?? pickAvg(6)) : (kp.peak_rating ?? pickAvg(6))) : pickAvg(6);
      return { value: val, label: mName, compare: `expected for pick #7: ${pickAvg(6)}`, color: PLAYER_CONFIGS.curry.ta };
    }
    if (step === 5) {
      const avg = Math.round((pickAvg(9) + pickAvg(12)) / 2);
      return { value: avg, label: `avg ${mName}, picks 10-13`, compare: `pick #10: ${pickAvg(9)}, pick #13: ${pickAvg(12)}`, color: PLAYER_CONFIGS.bynum.ta };
    }
    return null;
  }

  function showCardStatView() {
    const slotCard  = document.getElementById("card-stat-view");
    const slotChart = document.getElementById("pick-value-chart");
    if (slotCard)  { slotCard.style.opacity  = "1"; slotCard.style.pointerEvents  = ""; }
    if (slotChart) { slotChart.style.opacity = "0"; slotChart.style.pointerEvents = "none"; }
  }

  function showChartView() {
    const slotCard  = document.getElementById("card-stat-view");
    const slotChart = document.getElementById("pick-value-chart");
    if (slotCard)  { slotCard.style.opacity  = "0"; slotCard.style.pointerEvents  = "none"; }
    if (slotChart) { slotChart.style.opacity = "1"; slotChart.style.pointerEvents = ""; }
  }

  function showTwoCardStats() {
    const dispEl = document.getElementById("mobile-stat-display");
    const twoEl  = document.getElementById("two-card-stats");
    if (dispEl) dispEl.style.display = "none";
    if (!twoEl) return;
    twoEl.style.display = "flex";

    const kpBynum = nba.key_players.find(p => p.year === 2005 && p.pick === 10);
    const kpJeff  = nba.key_players.find(p => p.year === 2001 && p.pick === 13);
    const getR = kp => {
      if (!kp) return "—";
      if (currentMetric === "avg_peak")  return kp.peak_rating  ?? "—";
      if (currentMetric === "avg_first") return kp.first_rating ?? "—";
      if (currentMetric === "avg_mean")  return kp.mean_rating  ?? "—";
      return "—";
    };
    const mLabel = currentMetric === "avg_first" ? "first season 2K"
                 : currentMetric === "avg_peak"  ? "peak 2K"
                 : currentMetric === "avg_mean"  ? "career avg 2K" : "—";
    const $ = id => document.getElementById(id);
    if ($("tcs-rating-1")) $("tcs-rating-1").textContent = getR(kpBynum);
    if ($("tcs-metric-1")) $("tcs-metric-1").textContent = mLabel;
    if ($("tcs-career-1")) $("tcs-career-1").textContent =
      `${PLAYER_CONFIGS.bynum.back.ppg} PPG · ${PLAYER_CONFIGS.bynum.back.rpg} RPG`;
    if ($("tcs-rating-2")) $("tcs-rating-2").textContent = getR(kpJeff);
    if ($("tcs-metric-2")) $("tcs-metric-2").textContent = mLabel;
    if ($("tcs-career-2")) $("tcs-career-2").textContent =
      `${PLAYER_CONFIGS.jefferson.back.ppg} PPG · ${PLAYER_CONFIGS.jefferson.back.rpg} RPG`;
  }

  function updateMobileStatDisplay(step, animate) {
    const twoEl  = document.getElementById("two-card-stats");
    if (twoEl) twoEl.style.display = "none";
    const dispEl = document.getElementById("mobile-stat-display");
    if (!dispEl) return;
    const numEl = dispEl.querySelector(".mobile-stat-number");
    const lblEl = dispEl.querySelector(".mobile-stat-label");
    const cmpEl = dispEl.querySelector(".mobile-stat-compare");
    const cfg = getMobileStatData(step, currentMetric);
    if (!cfg) return;
    const doUpdate = () => {
      if (numEl) { numEl.textContent = cfg.value ?? "--"; numEl.style.color = cfg.color || ""; }
      if (lblEl) lblEl.textContent = cfg.label;
      if (cmpEl) { cmpEl.textContent = cfg.compare ?? ""; cmpEl.style.display = cfg.compare ? "" : "none"; }
    };
    showCardStatView();
    if (animate && numEl) {
      numEl.style.opacity = "0";
      setTimeout(() => { doUpdate(); numEl.style.opacity = "1"; }, 75);
    } else {
      doUpdate();
    }
  }

  function showSimChart() {
    showChartView();
  }

  // Bars — initialized at correct heights, only pick 1 visible initially
  const bars = g.selectAll(".nba-bar")
    .data(nba.picks.map((p, i) => ({ pick: p, i })))
    .join("rect")
    .attr("class", "nba-bar")
    .attr("x", d => x(d.pick))
    .attr("width", x.bandwidth())
    .attr("y", d => yL((nba.avg_peak[d.i] ?? 70)))
    .attr("height", d => ih - yL((nba.avg_peak[d.i] ?? 70)))
    .attr("rx", 2)
    .attr("fill", d => d.pick === 1 ? RED : d.pick <= 3 ? "#ff6b6b" : "rgba(255,255,255,0.3)")
    .attr("opacity", d => d.pick === 1 ? 1 : 0);

  function barColor(pick, highlight) {
    if (highlight === "curry" && pick === 7)  return "#22c55e";
    if (highlight === "mid"   && pick >= 10 && pick <= 13) return "#f59e0b";
    return pick === 1 ? RED : pick <= 3 ? "#ff6b6b" : "rgba(255,255,255,0.3)";
  }

  function updateBars(metric, highlight) {
    const vals = metricsMap[metric];
    bars.transition().duration(600).delay((d, i) => i * 30)
      .attr("y", d => yL(vals[d.i] ?? 70))
      .attr("height", d => ih - yL(vals[d.i] ?? 70))
      .attr("fill", d => barColor(d.pick, highlight));
  }

  // Sim values — solid area chart (hidden until step 6)
  const simXPos = (d, i) => x(i + 1) + x.bandwidth() / 2;
  const simLine = d3.line().x(simXPos).y(d => yR(d)).curve(d3.curveCatmullRom);
  const simAreaFn = d3.area().x(simXPos).y0(ih).y1(d => yR(d)).curve(d3.curveCatmullRom);

  const simAreaPath = g.append("path")
    .datum(nba.sim_values)
    .attr("fill", "url(#sim-area-grad-m)")
    .attr("opacity", 0)
    .attr("d", simAreaFn);

  const simPath = g.append("path")
    .datum(nba.sim_values)
    .attr("fill", "none")
    .attr("stroke", "#f59e0b")
    .attr("stroke-width", 2.5)
    .attr("opacity", 0)
    .attr("d", simLine);

  // Sim caption label (appears at step 6)
  const simLabel = g.append("text")
    .attr("x", iw - 4)
    .attr("y", 14)
    .attr("text-anchor", "end")
    .attr("fill", "#f59e0b").attr("font-size", 8).attr("opacity", 0)
    .text("Our simulation values");

  // Swap to a single player card
  function swapCard(playerKey, pickOverride) {
    const cfg = PLAYER_CONFIGS[playerKey];
    if (!cfg) return;
    const useCfg = pickOverride !== undefined ? Object.assign({}, cfg, { pick: pickOverride }) : cfg;
    const wrap1 = document.getElementById("pc-wrap-1");
    const card1 = document.getElementById("player-card-1");
    const wrap2 = document.getElementById("pc-wrap-2");
    if (!wrap1 || !card1) return;
    _applyCard(card1, wrap1, useCfg);
    wrap1.style.transform = `rotate(${_seededTilt(useCfg.name)}deg)`;
    wrap1.style.margin = "";
    if (wrap2) { wrap2.style.display = "none"; wrap2.style.margin = ""; }
    const cardArea = document.getElementById("card-area");
    if (cardArea) cardArea.classList.remove("two-cards");
  }

  // Show two cards side by side (step 5: Bynum + Jefferson)
  function showTwoCards(p1Key, p1Pick, p2Key, p2Pick) {
    const c1 = PLAYER_CONFIGS[p1Key], c2 = PLAYER_CONFIGS[p2Key];
    if (!c1 || !c2) return;
    const wrap1 = document.getElementById("pc-wrap-1"), card1 = document.getElementById("player-card-1");
    const wrap2 = document.getElementById("pc-wrap-2"), card2 = document.getElementById("player-card-2");
    if (!wrap1 || !card1 || !wrap2 || !card2) return;
    _applyCard(card1, wrap1, Object.assign({}, c1, { pick: p1Pick }));
    _applyCard(card2, wrap2, Object.assign({}, c2, { pick: p2Pick }));
    const SCALE = 0.75;
    const mOff = Math.round(140 * (1 - SCALE) / 2);
    wrap1.style.transform = `rotate(${_seededTilt(c1.name)}deg) scale(${SCALE})`;
    wrap1.style.margin = `0 -${mOff}px`;
    wrap2.style.display = "inline-block";
    wrap2.style.transform = `rotate(${_seededTilt(c2.name)}deg) scale(${SCALE})`;
    wrap2.style.margin = `0 -${mOff}px`;
    const cardArea = document.getElementById("card-area");
    if (cardArea) { cardArea.classList.add("two-cards"); cardArea.style.display = "flex"; }
  }

  // Initialize with LeBron (step 0 starts here)
  swapCard("lebron");
  updateMobileStatDisplay(0);

  // Toggle buttons
  document.querySelectorAll(".chart-toggle-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".chart-toggle-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentMetric = btn.dataset.metric;
      updateBars(currentMetric, lastHighlight);
      if (currentPrizeStep === 0) applyLeBronBar();
      if (currentPrizeStep === 5) showTwoCardStats();
      else if (currentPrizeStep === 2) {
        const dispEl = document.getElementById("mobile-stat-display");
        const twoEl  = document.getElementById("two-card-stats");
        if (dispEl) dispEl.style.display = "none";
        if (twoEl)  twoEl.style.display  = "none";
      }
      else if (currentPrizeStep !== 6 && currentPrizeStep !== 1) updateMobileStatDisplay(currentPrizeStep, true);
    });
  });

  // Scrollama
  // Steps: 0=LeBron single bar | 1=all bars | 2=Hakeem | 3=Wembanyama | 4=Curry | 5=Bynum+Jefferson | 6=Sim
  const scroller = scrollama();
  scroller.setup({
    step: "#prize-steps .step",
    offset: 0.55,
  }).onStepEnter(({ element }) => {
    document.querySelectorAll("#prize-steps .step").forEach(s => s.classList.remove("is-active"));
    element.classList.add("is-active");
    const step = +element.dataset.prizeStep;
    currentPrizeStep = step;

    if (step === 0) {
      swapCard("lebron");
      bars.transition().duration(400).attr("opacity", d => d.pick === 1 ? 1 : 0);
      xAxisG.selectAll("text").transition().duration(400).attr("opacity", 0);
      lastHighlight = null;
      updateBars(currentMetric, null);
      applyLeBronBar();
      simPath.transition().duration(400).attr("opacity", 0);
      simAreaPath.transition().duration(400).attr("opacity", 0);
      simLabel.transition().duration(400).attr("opacity", 0);
      lAxisG.transition().duration(400).attr("opacity", 1);
      simLeftAxisG.transition().duration(400).attr("opacity", 0);
      lAxisLabel.text("NBA 2K overall rating").transition().duration(400).attr("opacity", 1);
      updateMobileStatDisplay(0);
    } else if (step === 1) {
      showSimChart();
      swapCard("lebron");
      lastHighlight = null;
      lAxisG.transition().duration(400).attr("opacity", 1);
      simLeftAxisG.transition().duration(400).attr("opacity", 0);
      lAxisLabel.text("NBA 2K overall rating").transition().duration(400).attr("opacity", 1);
      simPath.transition().duration(400).attr("opacity", 0);
      simAreaPath.transition().duration(400).attr("opacity", 0);
      simLabel.transition().duration(400).attr("opacity", 0);
      const avg = nba[currentMetric];
      bars.transition().duration(600).delay((d, i) => d.pick === 1 ? 0 : i * 35)
        .attr("opacity", 1)
        .attr("y", d => yL(avg[d.i] ?? 70))
        .attr("height", d => ih - yL(avg[d.i] ?? 70))
        .attr("fill", d => barColor(d.pick, null));
      xAxisG.selectAll("text").transition().duration(600).delay(300).attr("opacity", 1);
    } else if (step === 2) {
      showCardStatView();
      const dispEl2 = document.getElementById("mobile-stat-display");
      const twoEl2  = document.getElementById("two-card-stats");
      if (dispEl2) dispEl2.style.display = "none";
      if (twoEl2)  twoEl2.style.display  = "none";
      swapCard("hakeem");
      updateBars(currentMetric, null); lastHighlight = null;
    } else if (step === 3) {
      swapCard("wembanyama");
      updateMobileStatDisplay(3);
      updateBars(currentMetric, null); lastHighlight = null;
    } else if (step === 4) {
      swapCard("curry");
      lastHighlight = "curry";
      updateMobileStatDisplay(4);
      updateBars(currentMetric, "curry");
    } else if (step === 5) {
      showCardStatView();
      showTwoCards("bynum", 10, "jefferson", 13);
      showTwoCardStats();
      lastHighlight = "mid";
      updateBars(currentMetric, "mid");
    } else if (step === 6) {
      lastHighlight = null;
      bars.transition().duration(600).attr("opacity", 0);
      xAxisG.selectAll("text").transition().duration(400).attr("opacity", 0);
      lAxisG.transition().duration(400).attr("opacity", 0);
      lAxisLabel.text("Simulation value");
      simLeftAxisG.transition().duration(600).attr("opacity", 1);
      showSimChart();
      simAreaPath.transition().duration(800).attr("opacity", 1);
      simPath.transition().duration(800).attr("opacity", 1);
      simLabel.transition().duration(600).attr("opacity", 1);
    }
  });
}

// ── Section 4: Balance Scale + Two Sliders ────────────────────────────────────
function initBalanceScale() {
  const PLAYOFF_VALUE = 200;
  const ARM_LEN = 140, LEFT_X = 100, RIGHT_X = 380, BASE_Y = 148;

  const beamRot   = document.getElementById("scale-beam-rot");
  const leftAsm   = document.getElementById("scale-left-asm");
  const rightAsm  = document.getElementById("scale-right-asm");
  const leftLiq   = document.getElementById("left-liquid");
  const rightLiq  = document.getElementById("right-liquid");
  const leftNum   = document.getElementById("left-num");
  const rightNum  = document.getElementById("right-num");
  const verdict   = document.getElementById("balance-verdict");
  const probSlider  = document.getElementById("prob-slider");
  const pickSlider  = document.getElementById("pick-value-slider");

  beamRot.style.transformOrigin = "0px 0px";
  beamRot.style.transform  = "rotate(0deg)";
  leftAsm.style.transform  = `translate(${LEFT_X}px, ${BASE_Y}px)`;
  rightAsm.style.transform = `translate(${RIGHT_X}px, ${BASE_Y}px)`;
  leftAsm.getBoundingClientRect();

  const EASE = "transform 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)";
  beamRot.style.transition  = EASE;
  leftAsm.style.transition  = EASE;
  rightAsm.style.transition = EASE;

  let phase = 0;
  let lFill = 30, rFill = 45, lFillTgt = 30, rFillTgt = 45;
  let lVal = 0, rVal = 0, lValTgt = 0, rValTgt = 0;
  let lastSide = null;

  function valueToFillY(v) {
    return 62 - (Math.min(v, 120) / 120) * 60;
  }

  function liquidPath(fillY, ph) {
    const lx = -50 + (14/60) * fillY;
    const rx = 50 - (14/60) * fillY;
    const waveAmp = Math.min(3.5, fillY * 0.5);
    const steps = 20;
    let d = `M ${lx.toFixed(1)},${(fillY + waveAmp * Math.sin(ph)).toFixed(1)}`;
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const x = lx + (rx - lx) * t;
      const y = fillY + waveAmp * Math.sin(t * 1.3 * Math.PI + ph);
      d += ` L ${x.toFixed(1)},${y.toFixed(1)}`;
    }
    d += ` L 36,60 Q 0,68 -36,60 L ${lx.toFixed(1)},${fillY.toFixed(1)} Z`;
    return d;
  }

  function animLoop() {
    phase += 0.025;
    lFill += (lFillTgt - lFill) * 0.07;
    rFill += (rFillTgt - rFill) * 0.07;
    lVal  += (lValTgt  - lVal)  * 0.1;
    rVal  += (rValTgt  - rVal)  * 0.1;
    leftLiq.setAttribute("d",  liquidPath(lFill,  phase));
    rightLiq.setAttribute("d", liquidPath(rFill, -phase - 1.0));
    leftNum.textContent  = Math.round(lVal);
    rightNum.textContent = Math.round(rVal);
    requestAnimationFrame(animLoop);
  }

  function update(pPct, pickVal) {
    const p = pPct / 100;
    const avgLotteryEV = (pickVal / 100) * 23.9;
    const vC = p * PLAYOFF_VALUE + (1 - p) * avgLotteryEV;
    const vT = p * 0.25 * PLAYOFF_VALUE + (1 - p * 0.25) * (avgLotteryEV * 1.4);
    const tanking = vT > vC;

    const angle = Math.max(-18, Math.min(18, ((vT - vC) / PLAYOFF_VALUE) * 75));
    const dy = ARM_LEN * Math.sin(angle * Math.PI / 180);

    beamRot.style.transform  = `rotate(${angle}deg)`;
    leftAsm.style.transform  = `translate(${LEFT_X}px, ${BASE_Y - dy}px)`;
    rightAsm.style.transform = `translate(${RIGHT_X}px, ${BASE_Y + dy}px)`;

    lFillTgt = valueToFillY(vC);
    rFillTgt = valueToFillY(vT);
    lValTgt  = vC;
    rValTgt  = vT;

    const side = tanking ? "tank" : "compete";
    const html = tanking
      ? `<strong>Tank.</strong> At these odds, lottery beats competing.`
      : `<strong>Compete.</strong> Playoffs beats the expected lottery value.`;
    if (side !== lastSide) {
      lastSide = side;
      verdict.classList.add("fading");
      setTimeout(() => {
        verdict.className = `balance-verdict ${tanking ? "tanking" : "competing"}`;
        verdict.innerHTML = html;
        verdict.classList.remove("fading");
      }, 250);
    } else {
      verdict.innerHTML = html;
    }

    document.getElementById("eu-compete-val").textContent = vC.toFixed(1);
    document.getElementById("eu-tank-val").textContent    = vT.toFixed(1);
    document.getElementById("eu-compete-box").classList.toggle("winning", !tanking);
    document.getElementById("eu-tank-box").classList.toggle("winning",  tanking);

    document.getElementById("prob-display").textContent = `${pPct}%`;
    const probFill = (pPct / 50) * 100;
    probSlider.style.background =
      `linear-gradient(to right, #1a2e52 ${probFill}%, #e0e0e0 ${probFill}%)`;
    const pickFill = ((pickVal - 100) / 100) * 100;
    pickSlider.style.background =
      `linear-gradient(to right, #1a2e52 ${pickFill}%, #e0e0e0 ${pickFill}%)`;
  }

  probSlider.addEventListener("input", () => update(+probSlider.value, +pickSlider.value));
  pickSlider.addEventListener("input", () => {
    const pv = +pickSlider.value;
    const label = pv >= 175 ? "Generational talent"
                : pv >= 130 ? "Strong draft class"
                : "Normal draft year";
    document.getElementById("pick-val-display").textContent = `${label} (pick #1 worth ${pv} pts)`;
    update(+probSlider.value, pv);
  });

  animLoop();
  update(+probSlider.value, +pickSlider.value);
}

// ── Section 5: Season Trajectory (Scrollama) ──────────────────────────────────
// Mobile: H=220, click tooltip instead of mouseover
function initTrajectory() {
  const traj = DATA.season_trajectory;
  if (!traj || !traj.snapshots || traj.snapshots.length === 0) return;

  const el = document.getElementById("trajectory-chart");
  const W = el.clientWidth || 360;
  const H = 220; // Fixed shorter height for mobile

  const svg = d3.select("#trajectory-chart")
    .append("svg")
    .attr("viewBox", `0 0 ${W} ${H}`)
    .attr("width", "100%")
    .attr("height", H);

  const m = { top: 16, right: 24, bottom: 38, left: 46 };
  const iw = W - m.left - m.right;
  const ih = H - m.top - m.bottom;
  const g = svg.append("g").attr("transform", `translate(${m.left},${m.top})`);

  const x = d3.scaleLinear().domain([0, 82]).range([0, iw]);
  const y = d3.scaleLinear().domain([1, 30]).range([0, ih]);

  // Grid
  g.append("g").attr("class", "grid")
    .call(d3.axisLeft(y).ticks(5).tickSize(-iw).tickFormat(""))
    .select(".domain").remove();
  g.selectAll(".grid .tick line").attr("stroke", "#eee").attr("stroke-dasharray", "3,3");

  // Axes
  g.append("g").attr("transform", `translate(0,${ih})`)
    .call(d3.axisBottom(x).ticks(6).tickFormat(d => d))
    .selectAll("text").attr("fill", GRAY).attr("font-size", 9);
  g.append("g")
    .call(d3.axisLeft(y).ticks(5)
      .tickFormat(d => d === 1 ? "#1" : d === 16 ? "#16" : `#${d}`))
    .selectAll("text").attr("fill", GRAY).attr("font-size", 9);
  g.selectAll(".domain,.tick line").attr("stroke", "#ddd");

  svg.append("text")
    .attr("x", m.left + iw / 2).attr("y", H - 2)
    .attr("text-anchor", "middle").attr("fill", GRAY).attr("font-size", 10)
    .text("Games played");

  // Playoff cutoff
  g.append("line")
    .attr("x1", 0).attr("y1", y(16))
    .attr("x2", iw).attr("y2", y(16))
    .attr("stroke", RED).attr("stroke-width", 1.5)
    .attr("stroke-dasharray", "6,4").attr("opacity", 0.7);
  g.append("text")
    .attr("x", iw - 4).attr("y", y(16) - 4)
    .attr("text-anchor", "end").attr("fill", RED)
    .attr("font-size", 9).attr("font-weight", 700)
    .text("Playoff cutoff");

  // Rank line
  const line = d3.line()
    .x(d => x(d.total_games))
    .y(d => y(d.rank))
    .curve(d3.curveCatmullRom.alpha(0.5));

  g.append("path")
    .datum(traj.snapshots)
    .attr("fill", "none")
    .attr("stroke", NAVY)
    .attr("stroke-width", 2.5)
    .attr("opacity", 0.7)
    .attr("d", line);

  const area = d3.area()
    .x(d => x(d.total_games))
    .y0(ih).y1(d => y(d.rank))
    .curve(d3.curveCatmullRom.alpha(0.5));

  g.append("path")
    .datum(traj.snapshots)
    .attr("fill", NAVY).attr("opacity", 0.06)
    .attr("d", area);

  // Title
  g.append("text")
    .attr("x", iw / 2).attr("y", -4)
    .attr("text-anchor", "middle")
    .attr("fill", NAVY).attr("font-size", 11).attr("font-weight", 700)
    .text(`${traj.team_name || "Team"}: One Season`);

  // Decision dots group (hidden initially)
  const dotGroup = g.append("g").attr("opacity", 0);
  const tooltip = document.getElementById("traj-tooltip");

  function cleanReasoning(text) {
    if (!text) return "";
    const cleaned = text
      .replace(/\s*"?\w+ \(e=[\d.]+,?\s*EU=[\d.]+\)"?\.?/gi, "")
      .replace(/\s*From <[^>]+>\.?/gi, "")
      .replace(/\s*From https?:\/\/\S+\.?/gi, "")
      .replace(/^\s*["']|["']\s*$/g, "")
      .trim();
    if (cleaned) return cleaned;
    const m = text.match(/(\w+)\s*\(e=([\d.]+),?\s*EU=([\d.]+)\)/i);
    if (m) {
      const action = m[1].toLowerCase() === "tank" ? "tank" : "compete";
      return `Agent decision: ${action} at effort e=${m[2]}. Expected utility EU=${m[3]}.`;
    }
    return "";
  }

  // Mobile: tap dot to show tooltip, tap elsewhere to hide
  let tooltipVisible = false;

  if (traj.decisions && traj.decisions.length > 0) {
    dotGroup.selectAll(".decision-dot")
      .data(traj.decisions)
      .join("circle")
      .attr("class", "decision-dot")
      .attr("cx", d => x(d.total_games))
      .attr("cy", d => y(d.rank))
      .attr("r", 8)
      .attr("fill", d => d.tanking ? RED : "#22c55e")
      .attr("stroke", "white").attr("stroke-width", 2)
      .attr("cursor", "pointer")
      .on("click", function(event, d) {
        event.stopPropagation();
        const decBadge = d.tanking
          ? `<span class="tt-effort tt-tanking" style="display:inline-block;padding:0.15rem 0.6rem;border-radius:4px;background:rgba(200,16,46,0.15);">↓ Tank</span>`
          : `<span class="tt-effort tt-competing" style="display:inline-block;padding:0.15rem 0.6rem;border-radius:4px;background:rgba(34,197,94,0.15);">↑ Compete</span>`;
        const cleanedReason = cleanReasoning(d.reasoning);
        tooltip.innerHTML = `
          <div style="display:flex;align-items:baseline;justify-content:space-between;gap:1rem;margin-bottom:0.15rem;">
            <span style="font-size:0.95rem;font-weight:700;">Game ${d.total_games}</span>
            <span style="font-size:0.7rem;background:rgba(255,255,255,0.15);padding:0.1rem 0.45rem;border-radius:4px;">${d.wins}W – ${d.losses}L</span>
          </div>
          <div style="font-size:0.68rem;opacity:0.5;margin-bottom:0.45rem;">Rank #${d.rank} in standings</div>
          ${decBadge}
          ${cleanedReason ? `<div style="margin-top:0.45rem;font-size:0.77rem;line-height:1.55;opacity:0.85;border-top:1px solid rgba(255,255,255,0.12);padding-top:0.4rem;">${cleanedReason}</div>` : ""}`;
        tooltip.classList.add("visible");
        tooltipVisible = true;
        tooltip.style.left = "1rem";
        tooltip.style.top = "1rem";
        tooltip.style.maxWidth = "calc(100vw - 2rem)";
      });

    document.addEventListener("click", () => {
      if (tooltipVisible) { tooltip.classList.remove("visible"); tooltipVisible = false; }
    });
    document.addEventListener("scroll", () => {
      if (tooltipVisible) { tooltip.classList.remove("visible"); tooltipVisible = false; }
    }, { passive: true });
  }

  // Featured decision markers (shown one at a time)
  const featured = traj.featured_decisions || [];
  const featuredDots = [];

  featured.forEach((fd, fi) => {
    const dot = g.append("circle")
      .attr("cx", x(fd.total_games))
      .attr("cy", y(fd.rank))
      .attr("r", 11)
      .attr("fill", fd.tanking ? RED : "#22c55e")
      .attr("stroke", "white").attr("stroke-width", 3)
      .attr("opacity", 0);
    featuredDots.push(dot);

    const quoteEl = document.getElementById(`traj-quote-${fi + 1}`);
    if (quoteEl) {
      const isTanking = fd.tanking;
      const decBadge = isTanking
        ? `<span style="display:inline-block;padding:0.15rem 0.65rem;border-radius:4px;background:rgba(200,16,46,0.08);font-size:0.8rem;font-weight:700;font-style:normal;color:#9f1239;margin-bottom:0.5rem;">↓ Tank</span>`
        : `<span style="display:inline-block;padding:0.15rem 0.65rem;border-radius:4px;background:rgba(34,197,94,0.08);font-size:0.8rem;font-weight:700;font-style:normal;color:#166534;margin-bottom:0.5rem;">↑ Compete</span>`;
      const gamesLeft = 82 - fd.total_games;
      const fractionLeft = gamesLeft / 82;
      const PLAYOFF_SPOTS = 16, TOTAL_TEAMS = 30;
      let playoffOddsRaw;
      if (fd.rank <= PLAYOFF_SPOTS) {
        playoffOddsRaw = Math.min(99, Math.round(50 + (PLAYOFF_SPOTS - fd.rank + 0.5) / PLAYOFF_SPOTS * 50));
      } else {
        const deficit = fd.rank - PLAYOFF_SPOTS;
        playoffOddsRaw = Math.max(0, Math.round((1 - deficit / (TOTAL_TEAMS - PLAYOFF_SPOTS)) * fractionLeft * 55));
      }
      const playoffOdds = playoffOddsRaw <= 0
        ? '~0%'
        : `${Math.max(1, Math.round(playoffOddsRaw * 0.3))}–${Math.round(playoffOddsRaw * 0.65)}%`;
      const cleanedReason = cleanReasoning(fd.reasoning);
      quoteEl.innerHTML = `
        <div style="display:flex;gap:1rem;align-items:baseline;margin-bottom:0.35rem;font-style:normal;">
          <span style="font-size:1rem;font-weight:700;color:#1B3A6B;">Game ${fd.total_games}</span>
          <span style="font-size:0.72rem;color:#555;">${fd.wins}W – ${fd.losses}L · Rank #${fd.rank}</span>
        </div>
        ${decBadge}
        <div style="font-size:0.85rem;color:#444;line-height:1.5;margin-bottom:${cleanedReason ? "0.5rem" : "0"};font-style:normal;">
          ${isTanking ? `Playoff odds: ${playoffOdds}. Lottery upside outweighs the slim playoff chance.` : `Playoff odds: ${playoffOdds}. Still worth competing.`}
        </div>
        ${cleanedReason ? `<div style="font-size:0.82rem;line-height:1.55;color:#333;font-style:italic;border-left:3px solid ${isTanking ? "#9f1239" : "#166534"};padding-left:0.6rem;">${cleanedReason}</div>` : ""}`;
    }
  });

  // Scrollama for trajectory
  const scroller = scrollama();
  scroller.setup({
    step: "#trajectory-steps .step",
    offset: 0.55,
  }).onStepEnter(({ element }) => {
    document.querySelectorAll("#trajectory-steps .step").forEach(s => s.classList.remove("is-active"));
    element.classList.add("is-active");
    const step = +element.dataset.trajStep;

    if (step === 0) {
      // Hide all dots
      dotGroup.attr("opacity", 0);
      featuredDots.forEach(d => d.attr("opacity", 0));
    } else if (step >= 1 && step <= 3) {
      // Show featured dot for this step
      dotGroup.attr("opacity", 0);
      featuredDots.forEach((d, i) => {
        d.transition().duration(500)
          .attr("opacity", i < step ? 1 : 0);
      });
    } else if (step === 4) {
      // Show all dots
      featuredDots.forEach(d => d.attr("opacity", 0));
      dotGroup.transition().duration(600).attr("opacity", 1);
    }
  });
}

// ── COLA Pudding Walkthrough ──────────────────────────────────────────────────
const COLA_PUD_STEPS = [
  {
    headline: "Your team missed the playoffs. Again.",
    prose: "Right now, a worse record means better lottery odds. Tanking is mathematically rational. COLA was designed to close that door entirely. Follow this team across three seasons, in two parallel universes.",
    tank:   { tickets: 0, record: null },
    honest: { tickets: 0, record: null },
    mid: null, isFinal: false,
  },
  {
    headline: "Season one ends. Twice.",
    prose: "Universe A: 20–62. Universe B: 38–44. In both, they missed the playoffs. COLA opens the ticket window. It doesn't ask how you got here. Did you miss the playoffs? Yes. Three tickets. Each.",
    tank:   { tickets: 3, record: "20–62" },
    honest: { tickets: 3, record: "38–44" },
    mid: "+3 each · record irrelevant", isFinal: false,
  },
  {
    headline: "Season two. Same math.",
    prose: "18–64 in one universe. 36–46 in the other. Neither made the playoffs. Three more tickets added to each pile, as if neither record happened. Under COLA, neither record did.",
    tank:   { tickets: 6, record: "18–64" },
    honest: { tickets: 6, record: "36–46" },
    mid: "+3 more each", isFinal: false,
  },
  {
    headline: "Three seasons. One number.",
    prose: "Nine tickets. Both of them. Three years, 150 engineered losses. The same lottery equity as the team that competed every night. That's not a side effect of COLA. That's the proof of concept.",
    tank:   { tickets: 9, record: "16–66" },
    honest: { tickets: 9, record: "34–48" },
    mid: null, isFinal: true,
  },
];

const COLA_PUD_MAX = 9;
let _colaP = 0;

function colaPudRender(step) {
  const s = COLA_PUD_STEPS[step];
  const isDormant = step === 0;
  const isLast = step === COLA_PUD_STEPS.length - 1;

  const stepEl = document.getElementById("cola-p-step");
  if (stepEl) {
    stepEl.classList.add("fading");
    setTimeout(() => {
      const h = document.getElementById("cola-p-headline");
      const p = document.getElementById("cola-p-prose");
      if (h) h.textContent = s.headline;
      if (p) p.textContent = s.prose;
      stepEl.classList.remove("fading");
    }, 200);
  }

  // Dormant state — ghost the chart on step 0
  const chart = document.querySelector(".cola-p-chart");
  if (chart) chart.classList.toggle("cola-p-chart-dormant", isDormant);

  // Bar widths
  const pct = isDormant ? 0 : (s.tank.tickets / COLA_PUD_MAX) * 100;
  const ft = document.getElementById("cola-fill-tank");
  const fh = document.getElementById("cola-fill-honest");
  if (ft) ft.style.width = pct + "%";
  if (fh) fh.style.width = pct + "%";

  const ct = document.getElementById("cola-count-tank");
  const ch = document.getElementById("cola-count-honest");
  if (ct) ct.textContent = !isDormant && s.tank.tickets > 0 ? s.tank.tickets : "";
  if (ch) ch.textContent = !isDormant && s.honest.tickets > 0 ? s.honest.tickets : "";

  const zt = document.getElementById("cola-zero-tank");
  const zh = document.getElementById("cola-zero-honest");
  if (zt) zt.style.display = (!isDormant && s.tank.tickets === 0) ? "flex" : "none";
  if (zh) zh.style.display = (!isDormant && s.honest.tickets === 0) ? "flex" : "none";

  const rt = document.getElementById("cola-rec-tank");
  const rh = document.getElementById("cola-rec-honest");
  if (rt) rt.textContent = isDormant ? "" : (s.tank.record || "");
  if (rh) rh.textContent = isDormant ? "" : (s.honest.record || "");

  const mid = document.getElementById("cola-p-mid");
  if (mid) {
    if (s.isFinal) {
      mid.innerHTML = `<div class="cola-p-mid-line cola-p-mid-line-tank"></div>
        <span class="cola-p-mid-convergence">same tickets · tanking bought nothing</span>
        <div class="cola-p-mid-line cola-p-mid-line-honest"></div>`;
    } else if (s.mid) {
      mid.innerHTML = `<div class="cola-p-mid-bracket"></div>
        <span class="cola-p-mid-label">${s.mid}</span>`;
    } else {
      mid.innerHTML = "";
    }
  }

  // Reference card opacity — active only on final step
  const ref = document.querySelector(".cola-p-ref");
  if (ref) ref.style.opacity = isLast ? "0.88" : "0.3";

  document.querySelectorAll(".cola-p-dot").forEach((d, i) => {
    d.classList.toggle("active", i === step);
    d.style.width      = i === step ? "26px" : "8px";
    d.style.background = i === step ? "white" : "rgba(255,255,255,0.22)";
  });

  const counter = document.getElementById("cola-p-counter");
  const prev = document.getElementById("cola-p-prev");
  const next = document.getElementById("cola-p-next");
  if (counter) counter.textContent = `${step + 1} of ${COLA_PUD_STEPS.length}`;
  if (prev) prev.disabled = step === 0;
  if (next) {
    if (isLast) {
      next.disabled = true;
      next.textContent = "Done ✓";
      next.className = "cola-p-nav-btn cola-p-nav-done";
    } else if (step === 0) {
      next.disabled = false;
      next.textContent = "See how it works →";
      next.className = "cola-p-nav-btn cola-p-nav-cta";
    } else {
      next.disabled = false;
      next.textContent = "Next →";
      next.className = "cola-p-nav-btn cola-p-nav-next";
    }
  }
}

function colaPudStep(delta) {
  _colaP = Math.max(0, Math.min(COLA_PUD_STEPS.length - 1, _colaP + delta));
  colaPudRender(_colaP);
}

function colaPudGo(step) {
  _colaP = step;
  colaPudRender(_colaP);
}

window.colaPudStep = colaPudStep;
window.colaPudGo   = colaPudGo;

// ── Section 6: Reform Explorer ─────────────────────────────────────────────────
function initReformExplorer() {
  const tabs = document.querySelectorAll(".reform-tab");
  const panel = document.querySelector(".reform-panel");

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const reform = tab.dataset.reform;
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      document.querySelectorAll(".reform-description").forEach(d => {
        d.classList.toggle("active", d.dataset.reform === reform);
      });
      document.querySelectorAll(".reform-diagram").forEach(d => {
        d.classList.toggle("active", d.dataset.reform === reform);
      });
      if (panel) panel.classList.toggle("cola-active", reform === "cola");
      if (reform === "bilevel" && _playBilevel) _playBilevel();
      if (reform === "321" && _autoPlay321) _autoPlay321();
    });
  });

  drawReformNBA();
  drawReformBilevel();
  drawReformCOLA();
  drawReformWL();
  drawReform321();
  colaPudRender(0);
}

function svgReform(id) {
  const svg = d3.select(`#${id}`);
  svg.selectAll("*").remove();
  return svg;
}

function drawReformNBA() {
  const svg = svgReform("reform-diagram-nba");
  const W = 380, H = 260;
  const NSQUARES = NBA_ODDS.map(c => c / 5);
  const TIER = NBA_ODDS.map((_, i) => i < 3 ? RED : i < 7 ? NAVY : LGRAY);
  const SQ = 9, GAP = 2, CELL = SQ + GAP;
  const FROW_H = 14, FY0 = 20;

  svg.append("text").attr("x", W / 2).attr("y", 12)
    .attr("text-anchor", "middle").attr("fill", "rgba(255,255,255,0.35)").attr("font-size", 9)
    .text("Each box = 5 combinations = 0.5% chance at pick #1. Hover a row.");

  const tip = svg.append("text").attr("text-anchor", "middle")
    .attr("fill", "rgba(255,255,255,0.9)").attr("font-size", 9.5).attr("font-weight", 700)
    .attr("x", W / 2).attr("y", H - 26).attr("opacity", 0);

  NBA_ODDS.forEach((_, ti) => {
    const n = NSQUARES[ti];
    const color = TIER[ti];
    const gy = FY0 + ti * FROW_H;
    const rowX = Math.round((W - n * CELL) / 2);

    svg.append("text")
      .attr("x", rowX - 4).attr("y", gy + 8)
      .attr("text-anchor", "end").attr("fill", color).attr("font-size", 8).attr("opacity", 0.7)
      .text(`#${30 - ti}`);

    for (let s = 0; s < n; s++) {
      svg.append("rect").datum({ ti })
        .attr("class", "r-sq")
        .attr("x", rowX + s * CELL).attr("y", gy)
        .attr("width", SQ).attr("height", SQ - 1)
        .attr("fill", color).attr("rx", 1.5).attr("pointer-events", "none");
    }

    svg.append("rect")
      .attr("x", rowX).attr("y", gy - 1)
      .attr("width", n * CELL).attr("height", SQ + 2)
      .attr("fill", "transparent")
      .on("pointerover", function() {
        tip.text(`Team #${30 - ti}: ${NBA_ODDS_PCT[ti]}% chance at pick #1`).attr("opacity", 1);
        svg.selectAll(".r-sq").attr("opacity", d => d.ti === ti ? 1 : 0.18);
      })
      .on("pointerout", function() {
        tip.attr("opacity", 0);
        svg.selectAll(".r-sq").attr("opacity", 1);
      });
  });

  const legY = H - 18;
  const legItems = [
    { color: RED,   label: "Worst 3 (14% each)" },
    { color: NAVY,  label: "Ranks 4–7" },
    { color: LGRAY, label: "Ranks 8–14" },
  ];
  let lx = 4;
  legItems.forEach(item => {
    svg.append("rect").attr("x", lx).attr("y", legY).attr("width", 9).attr("height", 9)
      .attr("fill", item.color).attr("rx", 1.5);
    svg.append("text").attr("x", lx + 12).attr("y", legY + 8)
      .attr("fill", "rgba(255,255,255,0.42)").attr("font-size", 9).text(item.label);
    lx += 12 + item.label.length * 5.5 + 10;
  });
}

let _playBilevel = null;

function drawReformBilevel() {
  const svg = svgReform("reform-diagram-bilevel");
  const W = 380, H = 200;
  const iw = W - 40;
  const lockFrac = 70 / 82;
  const lockX = iw * lockFrac;
  const barH = 28, barY = 80;
  const TOTAL_MS = 2400;

  const g = svg.append("g").attr("transform", "translate(20,0)");

  g.append("text").attr("x", lockX / 2).attr("y", barY - 20)
    .attr("text-anchor", "middle").attr("fill", RED).attr("font-size", 9).attr("font-weight", 700)
    .text("incentive to tank");

  const redBar = g.append("rect")
    .attr("x", 0).attr("y", barY).attr("width", iw).attr("height", barH)
    .attr("fill", RED).attr("opacity", 0.72).attr("rx", 4);

  const grayZone = g.append("rect")
    .attr("x", iw).attr("y", barY).attr("width", 0).attr("height", barH)
    .attr("fill", "#4a5068").attr("opacity", 0.9).attr("rx", 4);

  const lockLine = g.append("line")
    .attr("x1", lockX).attr("y1", barY - 14)
    .attr("x2", lockX).attr("y2", barY + barH + 6)
    .attr("stroke", "rgba(255,255,255,0.22)").attr("stroke-dasharray", "3,2").attr("stroke-width", 1)
    .attr("opacity", 0);

  const lockLabel = g.append("text")
    .attr("x", iw / 2).attr("y", barY + barH + 18)
    .attr("text-anchor", "middle").attr("fill", "rgba(255,255,255,0.5)")
    .attr("font-size", 8).attr("opacity", 0)
    .text("standings lock: losing does nothing after here");

  const lblY = barY + barH + 32;
  g.append("text").attr("x", 0).attr("y", lblY)
    .attr("fill", "rgba(255,255,255,0.35)").attr("font-size", 9).text("G1");
  g.append("text").attr("x", lockX).attr("y", lblY)
    .attr("text-anchor", "middle").attr("fill", "rgba(255,255,255,0.35)").attr("font-size", 9).text("G70");
  g.append("text").attr("x", iw).attr("y", lblY)
    .attr("text-anchor", "end").attr("fill", "rgba(255,255,255,0.35)").attr("font-size", 9).text("G82");

  const replayG = svg.append("g")
    .attr("transform", `translate(${W / 2},${H - 10})`)
    .style("cursor", "pointer");
  replayG.append("rect").attr("x", -28).attr("y", -11).attr("width", 56).attr("height", 14)
    .attr("fill", "rgba(255,255,255,0.07)").attr("rx", 6);
  replayG.append("text").attr("text-anchor", "middle").attr("dy", "0.35em")
    .attr("fill", "rgba(255,255,255,0.42)").attr("font-size", 9).text("↺ replay");

  let _tid = null;
  function play() {
    if (_tid) { clearTimeout(_tid); _tid = null; }
    redBar.interrupt().attr("width", iw);
    grayZone.interrupt().attr("x", iw).attr("width", 0);
    lockLine.interrupt().attr("opacity", 0);
    lockLabel.interrupt().attr("opacity", 0);
    redBar.transition().duration(TOTAL_MS).ease(d3.easeLinear).attr("width", lockX);
    grayZone.transition().duration(TOTAL_MS).ease(d3.easeLinear)
      .attr("x", lockX).attr("width", iw - lockX);
    _tid = setTimeout(() => {
      lockLine.transition().duration(300).attr("opacity", 1);
      lockLabel.transition().duration(500).attr("opacity", 1);
      _tid = null;
    }, TOTAL_MS);
  }

  replayG.on("click", play);
  _playBilevel = play;
  play();
}

function drawReformCOLA() {
  const svg = svgReform("reform-diagram-cola");
  const W = 380, H = 260;
  const years = 5;
  const m = { top: 42, right: 20, bottom: 44, left: 20 };
  const iw = W - m.left - m.right, ih = H - m.top - m.bottom;
  const g = svg.append("g").attr("transform", `translate(${m.left},${m.top})`);

  svg.append("text")
    .attr("x", m.left).attr("y", 12)
    .attr("fill", "rgba(255,255,255,0.55)").attr("font-size", 9)
    .text("Each year you miss playoffs earns 1 ticket. More tickets = better lottery odds.");
  svg.append("text")
    .attr("x", m.left).attr("y", 24)
    .attr("fill", "rgba(255,255,255,0.55)").attr("font-size", 9)
    .text("Win pick #N: spend N tickets. Here: win pick #3 in year 3. Spend all 3 tickets.");

  const yearW = iw / years;
  const maxTickets = 5;
  const tickH = ih / (maxTickets + 1);

  for (let yr = 1; yr <= years; yr++) {
    const gx = (yr - 1) * yearW + yearW * 0.1;
    const gw = yearW * 0.8;
    const displayTickets = yr <= 2 ? yr : yr === 3 ? 0 : yr - 3;

    for (let t = 0; t < Math.min(displayTickets, maxTickets); t++) {
      g.append("rect")
        .attr("x", gx).attr("y", ih - (t + 1) * tickH)
        .attr("width", gw).attr("height", tickH - 3)
        .attr("fill", "#4CAF50").attr("opacity", 0.4 + t * 0.12)
        .attr("rx", 3);
    }

    g.append("text")
      .attr("x", gx + gw / 2).attr("y", ih + 14)
      .attr("text-anchor", "middle").attr("fill", "rgba(255,255,255,0.5)").attr("font-size", 10)
      .text(`Yr ${yr}`);

    if (displayTickets > 0) {
      g.append("text")
        .attr("x", gx + gw / 2).attr("y", ih - displayTickets * tickH - 6)
        .attr("text-anchor", "middle").attr("fill", "#4CAF50").attr("font-size", 11).attr("font-weight", 700)
        .text(`${displayTickets}`);
    }

    if (yr === 3) {
      g.append("text")
        .attr("x", gx + gw / 2).attr("y", ih - tickH * 0.3)
        .attr("text-anchor", "middle").attr("fill", "rgba(255,255,255,0.4)").attr("font-size", 8)
        .text("0 tickets");
      g.append("text")
        .attr("x", gx + gw / 2).attr("y", 2)
        .attr("text-anchor", "middle").attr("fill", RED).attr("font-size", 8)
        .text("Got pick #3");
      g.append("text")
        .attr("x", gx + gw / 2).attr("y", 12)
        .attr("text-anchor", "middle").attr("fill", RED).attr("font-size", 8)
        .text("paid 3 tickets");
    }
  }

  const legX = m.left + iw - 140;
  g.append("rect")
    .attr("x", legX).attr("y", -18)
    .attr("width", 10).attr("height", 10)
    .attr("fill", "#4CAF50").attr("opacity", 0.6).attr("rx", 2);
  g.append("text")
    .attr("x", legX + 14).attr("y", -9)
    .attr("fill", "rgba(255,255,255,0.5)").attr("font-size", 9)
    .text("= 1 year missed playoffs");

  svg.append("text")
    .attr("x", m.left).attr("y", H - 4)
    .attr("fill", "rgba(255,255,255,0.4)").attr("font-size", 8)
    .text("Make playoffs: tickets freeze. They carry over when you miss again.");
}

function drawReformWL() {
  const svg = svgReform("reform-diagram-wl");
  const W = 380, H = 240;
  const m = { top: 20, right: 20, bottom: 35, left: 50 };
  const iw = W - m.left - m.right, ih = H - m.top - m.bottom;
  const g = svg.append("g").attr("transform", `translate(${m.left},${m.top})`);

  const games = d3.range(1, 83);
  const areaData = games.map(game => ({ game, w: Math.pow(0.5, game / 20) }));

  const x = d3.scaleLinear().domain([1, 82]).range([0, iw]);
  const y = d3.scaleLinear().domain([0, 1.05]).range([ih, 0]);

  const defs = svg.append("defs");
  const grad = defs.append("linearGradient").attr("id", "wl-grad-m").attr("x1", "0").attr("x2", "1");
  grad.append("stop").attr("offset", "0%").attr("stop-color", "#FF9800").attr("stop-opacity", 0.7);
  grad.append("stop").attr("offset", "100%").attr("stop-color", "#FF9800").attr("stop-opacity", 0.1);

  const area = d3.area().x(d => x(d.game)).y0(ih).y1(d => y(d.w)).curve(d3.curveBasis);
  g.append("path").datum(areaData).attr("fill", "url(#wl-grad-m)").attr("d", area);

  const line = d3.line().x(d => x(d.game)).y(d => y(d.w)).curve(d3.curveBasis);
  g.append("path").datum(areaData)
    .attr("fill", "none").attr("stroke", "#FF9800").attr("stroke-width", 2.5).attr("d", line);

  g.append("g").attr("transform", `translate(0,${ih})`)
    .call(d3.axisBottom(x).ticks(5).tickFormat(d => `G${d}`))
    .selectAll("text").attr("fill", "rgba(255,255,255,0.5)").attr("font-size", 9);
  g.append("g").call(d3.axisLeft(y).ticks(4).tickFormat(d3.format(".0%")))
    .selectAll("text").attr("fill", "rgba(255,255,255,0.5)").attr("font-size", 9);
  g.selectAll(".domain,.tick line").attr("stroke", "rgba(255,255,255,0.15)");

  svg.append("text")
    .attr("transform", `translate(14,${m.top + ih / 2}) rotate(-90)`)
    .attr("text-anchor", "middle").attr("fill", "rgba(255,255,255,0.4)").attr("font-size", 10)
    .text("Loss value vs game 1");

  // Pulsing prompt dot at game 20
  const promptGame = 20;
  const promptY20 = y(Math.pow(0.5, promptGame / 20));
  const promptX20 = x(promptGame);
  const promptRing = g.append("circle").attr("class", "wl-prompt")
    .attr("cx", promptX20).attr("cy", promptY20).attr("r", 5)
    .attr("fill", "none").attr("stroke", "#FF9800").attr("stroke-width", 1.5)
    .attr("opacity", 0.85).attr("pointer-events", "none");
  const promptDot = g.append("circle").attr("class", "wl-prompt")
    .attr("cx", promptX20).attr("cy", promptY20).attr("r", 4.5)
    .attr("fill", "#FF9800").attr("stroke", "white").attr("stroke-width", 1.5)
    .attr("pointer-events", "none");
  const promptLabel = g.append("text").attr("class", "wl-prompt")
    .attr("x", promptX20 + 8).attr("y", promptY20 - 9)
    .attr("fill", "rgba(255,255,255,0.6)").attr("font-size", 8)
    .attr("pointer-events", "none").text("drag to explore");
  (function pulseRing() {
    promptRing.attr("r", 5).attr("opacity", 0.85)
      .transition().duration(950).ease(d3.easeQuadOut)
      .attr("r", 15).attr("opacity", 0)
      .on("end", pulseRing);
  })();
  let _promptActive = true;
  function dismissPrompt() {
    if (!_promptActive) return;
    _promptActive = false;
    g.selectAll(".wl-prompt").interrupt().transition().duration(180).attr("opacity", 0).remove();
  }

  // Crosshair scrubber
  const crossLine = g.append("line")
    .attr("y1", 0).attr("y2", ih)
    .attr("stroke", "rgba(255,255,255,0.35)").attr("stroke-width", 1).attr("stroke-dasharray", "3,2")
    .attr("opacity", 0).attr("pointer-events", "none");
  const crossDot = g.append("circle").attr("r", 4)
    .attr("fill", "#FF9800").attr("stroke", "white").attr("stroke-width", 1.5)
    .attr("opacity", 0).attr("pointer-events", "none");
  const scrubLabel = svg.append("text")
    .attr("x", m.left + iw / 2).attr("y", H - 4)
    .attr("text-anchor", "middle").attr("fill", "rgba(255,255,255,0.85)").attr("font-size", 9).attr("font-weight", 600)
    .attr("opacity", 0);
  const hintText = svg.append("text")
    .attr("x", m.left + iw / 2).attr("y", H - 4)
    .attr("text-anchor", "middle").attr("fill", "rgba(255,255,255,0.3)").attr("font-size", 9)
    .text("← drag to compare game values →");

  g.append("rect")
    .attr("x", 0).attr("y", 0).attr("width", iw).attr("height", ih)
    .attr("fill", "transparent")
    .on("pointermove", function(event) {
      dismissPrompt();
      const [mx] = d3.pointer(event);
      const gameN = Math.max(1, Math.min(82, Math.round(x.invert(mx))));
      const w = Math.pow(0.5, gameN / 20);
      crossLine.attr("x1", x(gameN)).attr("x2", x(gameN)).attr("opacity", 1);
      crossDot.attr("cx", x(gameN)).attr("cy", y(w)).attr("opacity", 1);
      scrubLabel.text(`A loss in game ${gameN} is worth ${(w * 100).toFixed(1)}% of a game 1 loss`).attr("opacity", 1);
      hintText.attr("opacity", 0);
    })
    .on("pointerleave", function() {
      crossLine.attr("opacity", 0);
      crossDot.attr("opacity", 0);
      scrubLabel.attr("opacity", 0);
      hintText.attr("opacity", 1);
    });
}

let _autoPlay321 = null;

function drawReform321() {
  const svg = svgReform("reform-diagram-321");
  const W = 380, H = 318;
  const NSQUARES_CUR = [...NBA_ODDS.map(c => c / 5), 0, 0]; // teams 15–16 not in current lottery
  const BALLS_321 = [2,2,2, 3,3,3,3,3,3,3, 2,2,2,2, 1,1]; // 37 total
  const TOTAL_321 = 37;
  const NSQUARES_321 = BALLS_321.map(b => Math.round(b / TOTAL_321 * 200));
  const TIER = BALLS_321.map((_, i) => i < 3 ? RED : i < 10 ? NAVY : i < 14 ? RED : LGRAY);
  const N_TEAMS_321 = 16;
  const SQ = 9, GAP = 2, CELL = SQ + GAP;
  const FROW_H = 14, FY0 = 20;

  let mode = "current";
  let _autoTid = null;

  svg.append("text").attr("x", W / 2).attr("y", 12)
    .attr("text-anchor", "middle").attr("fill", "rgba(255,255,255,0.35)").attr("font-size", 9)
    .text("Each box = 0.5% chance at pick #1. Tap a row. Toggle to compare.");

  const tip = svg.append("text").attr("text-anchor", "middle")
    .attr("fill", "rgba(255,255,255,0.9)").attr("font-size", 9.5).attr("font-weight", 700)
    .attr("x", W / 2).attr("y", H - 52).attr("opacity", 0);

  Array.from({length: N_TEAMS_321}, (_, ti) => ti).forEach(ti => {
    const nCur = NSQUARES_CUR[ti];
    const n321 = NSQUARES_321[ti];
    const nMax = Math.max(nCur, n321);
    const color = TIER[ti];
    const gy = FY0 + ti * FROW_H;
    const rowX321 = Math.round((W - n321 * CELL) / 2);
    const rowXCur = nCur > 0 ? Math.round((W - nCur * CELL) / 2) : rowX321;

    // Rank label at fixed x — does not move when boxes shift
    svg.append("text")
      .datum({ opCur: ti < 14 ? 0.9 : 0 })
      .attr("class", "r-rnk-321")
      .attr("x", 24).attr("y", gy + 8)
      .attr("text-anchor", "end").attr("fill", LGRAY).attr("font-size", 10)
      .attr("opacity", ti < 14 ? 0.9 : 0)
      .text(`#${30 - ti}`);

    for (let s = 0; s < nMax; s++) {
      const isInCur = s < nCur;
      const isIn321 = s < n321;
      const xCur = isInCur ? rowXCur + s * CELL : rowXCur + nCur * CELL;
      const x321 = isIn321 ? rowX321 + s * CELL : rowX321 + n321 * CELL;
      svg.append("rect").datum({ ti, s, isInCur, isIn321, xCur, x321 })
        .attr("class", "r-sq-321")
        .attr("x", isInCur ? xCur : x321).attr("y", gy)
        .attr("width", SQ).attr("height", SQ - 1)
        .attr("fill", color).attr("rx", 1.5)
        .attr("opacity", isInCur ? 1 : 0)
        .attr("pointer-events", "none");
    }

    svg.append("rect")
      .attr("x", Math.min(rowXCur, rowX321)).attr("y", gy - 1)
      .attr("width", Math.max(nCur, n321) * CELL).attr("height", SQ + 2)
      .attr("fill", "transparent")
      .on("pointerover", function() {
        const pct = mode === "current"
          ? `${ti < NBA_ODDS.length ? NBA_ODDS_PCT[ti] : "0.0"}%`
          : `${(BALLS_321[ti] / TOTAL_321 * 100).toFixed(1)}%`;
        tip.text(`Team #${30 - ti}: ${pct} chance at pick #1`).attr("opacity", 1);
        svg.selectAll(".r-sq-321").attr("opacity", function(d) {
          const vis = mode === "current" ? d.isInCur : d.isIn321;
          return vis ? (d.ti === ti ? 1 : 0.18) : 0;
        });
      })
      .on("pointerout", function() {
        tip.attr("opacity", 0);
        svg.selectAll(".r-sq-321")
          .attr("opacity", d => (mode === "current" ? d.isInCur : d.isIn321) ? 1 : 0);
      });
  });

  function applyMode(newMode, dur) {
    mode = newMode;
    svg.selectAll(".r-sq-321").transition().duration(dur)
      .attr("opacity", d => (mode === "current" ? d.isInCur : d.isIn321) ? 1 : 0)
      .attr("x", d => mode === "current" ? d.xCur : d.x321);
    svg.selectAll(".r-rnk-321").transition().duration(dur)
      .attr("opacity", d => mode === "current" ? d.opCur : 0.9);
    toggleLabel.text(mode === "321" ? "← Back to current rules" : "Switch to 3-2-1 proposal →");
    const subtitleEl = document.getElementById("reform-321-subtitle");
    if (subtitleEl) subtitleEl.textContent = mode === "321" ? "3-2-1 proposal, starting 2027" : "current rules, 2026";
    const revealEl = document.getElementById("reform-321-reveal");
    if (revealEl && mode === "current") revealEl.style.opacity = "0";
  }

  const toggleG = svg.append("g")
    .attr("transform", `translate(${W / 2},${H - 36})`)
    .style("cursor", "pointer");
  toggleG.append("rect")
    .attr("x", -80).attr("y", -10).attr("width", 160).attr("height", 18)
    .attr("fill", "rgba(255,255,255,0.09)").attr("rx", 8);
  const toggleLabel = toggleG.append("text")
    .attr("text-anchor", "middle").attr("dy", "0.35em")
    .attr("fill", "rgba(255,255,255,0.65)").attr("font-size", 9)
    .text("Switch to 3-2-1 proposal →");

  toggleG.on("click", function() {
    if (_autoTid) { clearTimeout(_autoTid); _autoTid = null; }
    applyMode(mode === "current" ? "321" : "current", 420);
  });

  _autoPlay321 = function() {
    if (_hasPlayed321) return;
    _hasPlayed321 = true;
    _autoTid = setTimeout(() => {
      applyMode("321", 800);
      setTimeout(() => {
        const revealEl = document.getElementById("reform-321-reveal");
        if (revealEl) revealEl.style.opacity = "1";
      }, 800);
      _autoTid = null;
    }, 1500);
  };

  const legY = H - 18;
  const legItems = [
    { color: RED,   label: "5.4%: ranks 1–3, 11–14" },
    { color: NAVY,  label: "8.1%: ranks 4–10" },
    { color: LGRAY, label: "2.7%: ranks 15–16" },
  ];
  let lx = 4;
  legItems.forEach(item => {
    svg.append("rect").attr("x", lx).attr("y", legY).attr("width", 9).attr("height", 9)
      .attr("fill", item.color).attr("rx", 1.5);
    svg.append("text").attr("x", lx + 12).attr("y", legY + 8)
      .attr("fill", "rgba(255,255,255,0.42)").attr("font-size", 9).text(item.label);
    lx += 12 + item.label.length * 5.5 + 10;
  });
}

// ── Section 7: Tanking Rate Scrollytelling ────────────────────────────────────
function initTankingRateScroll() {
  const tr = DATA.tanking_rates;
  if (!tr) return;

  const mechs = MECH_ORDER;
  const W = 480, H = 350;
  const svg = d3.select("#tanking-rate-chart").attr("viewBox", `0 0 ${W} ${H}`);
  const m = { top: 40, right: 20, bottom: 60, left: 90 };
  const iw = W - m.left - m.right, ih = H - m.top - m.bottom;
  const g = svg.append("g").attr("transform", `translate(${m.left},${m.top})`);

  const groupKeys = ["rational"];
  const subW = 36, subGap = 0;

  const x = d3.scaleBand().domain(mechs).range([0, iw]).padding(0.25);
  const maxVal = d3.max(tr.rational) * 1.25;
  const y = d3.scaleLinear().domain([0, Math.max(0.10, maxVal)]).range([ih, 0]);

  g.append("g").call(d3.axisLeft(y).ticks(5).tickFormat(d3.format(".0%")))
    .selectAll("text").attr("fill", GRAY).attr("font-size", 11);
  g.selectAll(".domain,.tick line").attr("stroke", "#ddd");

  const mechLabels = g.selectAll(".mech-label")
    .data(mechs).join("text")
    .attr("class", "mech-label")
    .attr("x", d => x(d) + x.bandwidth() / 2)
    .attr("y", ih + 18).attr("text-anchor", "middle")
    .attr("fill", LGRAY).attr("font-size", 11)
    .text(d => MECH_LABELS[d]);

  g.append("g").call(d3.axisLeft(y).ticks(5).tickSize(-iw).tickFormat(""))
    .selectAll("line").attr("stroke", "#eee");
  g.select(".grid .domain").remove();

  let revealed = new Set();

  function updateChart(activeMech) {
    revealed.add(activeMech);
    mechs.forEach(mech => {
      const isRevealed = revealed.has(mech);
      const isActive   = mech === activeMech;

      mechLabels.filter(d => d === mech).transition().duration(400)
        .attr("fill", isActive ? NAVY : isRevealed ? GRAY : LGRAY)
        .attr("font-weight", isActive ? 700 : 400);

      groupKeys.forEach((key, ki) => {
        const val = tr[key][tr.mechanisms.indexOf(mech)];
        const bx  = x(mech) + ki * (subW + subGap) - (groupKeys.length * (subW + subGap)) / 2 + x.bandwidth() / 2;
        const col = key === "rational" ? COLORS[mech] : NAVY;
        const opacity = isActive ? 1 : isRevealed ? 0.5 : 0;

        g.selectAll(`.bar-${mech}-${key}`)
          .data([val]).join(
            enter => enter.append("rect")
              .attr("class", `bar-${mech}-${key}`)
              .attr("x", bx).attr("width", subW)
              .attr("y", ih).attr("height", 0)
              .attr("fill", col).attr("rx", 3).attr("opacity", 0),
            update => update
          )
          .transition().duration(500)
          .attr("y", y(val)).attr("height", ih - y(val)).attr("opacity", opacity);
      });
    });
  }

  const scroller = scrollama();
  scroller.setup({
    step: "#tanking-steps .step",
    offset: 0.55,
  }).onStepEnter(({ element }) => {
    document.querySelectorAll("#tanking-steps .step").forEach(s => s.classList.remove("is-active"));
    element.classList.add("is-active");
    updateChart(element.dataset.mech);
  });

  updateChart(mechs[0]);
}

// ── Section 8: Draft Fairness ──────────────────────────────────────────────────
function initFairness() {
  const tau = DATA.tau_distances;
  const eff = DATA.draft_efficiency;
  if (!tau || !eff) return;

  // Tau dot plot — two-phase zoom animation (wide → tight domain on viewport entry)
  {
    const el = document.getElementById("tau-chart");
    const W = el.clientWidth || 360, H = 260;
    const svg = d3.select("#tau-chart")
      .append("svg").attr("viewBox", `0 0 ${W} ${H}`).attr("width", "100%").attr("height", H);
    const m = { top: 30, right: 20, bottom: 50, left: 60 };
    const iw = W - m.left - m.right, ih = H - m.top - m.bottom;
    const g = svg.append("g").attr("transform", `translate(${m.left},${m.top})`);

    const allVals = [...tau.rational_tau, ...tau.honest_tau];
    const tightDomain = [d3.min(allVals) * 0.997, d3.max(allVals) * 1.003];
    const wideDomain  = [0, d3.max(allVals) * 1.15];

    const y = d3.scaleLinear().domain(wideDomain).range([ih, 0]);
    const x = d3.scaleBand().domain(MECH_ORDER).range([0, iw]).padding(0.3);

    g.append("g").attr("transform", `translate(0,${ih})`)
      .call(d3.axisBottom(x).tickFormat(d => MECH_LABELS[d]))
      .selectAll("text").attr("fill", GRAY).attr("font-size", 9)
      .attr("transform", "rotate(-15)").attr("text-anchor", "end");
    const yAxisG = g.append("g").call(d3.axisLeft(y).ticks(5).tickFormat(d3.format(".3f")));
    yAxisG.selectAll("text").attr("fill", GRAY).attr("font-size", 10);
    g.selectAll(".domain,.tick line").attr("stroke", "#eee");

    // Phase 1: shaded band
    const bandTop    = y(tightDomain[1]);
    const bandBottom = y(tightDomain[0]);
    const bandRect = g.append("rect").attr("class", "tau-band")
      .attr("x", -8).attr("width", iw + 16)
      .attr("y", bandTop).attr("height", bandBottom - bandTop)
      .attr("fill", "#2196F3").attr("opacity", 0.08).attr("rx", 3);
    const bandLabel = g.append("text").attr("class", "tau-band-label")
      .attr("x", iw / 2).attr("y", bandTop - 6)
      .attr("text-anchor", "middle").attr("fill", "#2196F3")
      .attr("font-size", 9).attr("font-weight", 600)
      .text("All mechanisms cluster in this tight band");

    const dots = MECH_ORDER.map(m2 => {
      const i = tau.mechanisms.indexOf(m2);
      const col = COLORS[m2];
      const cx = x(m2) + x.bandwidth() / 2;
      const cy = y(tau.rational_tau[i]);
      const circle = g.append("circle")
        .attr("cx", cx).attr("cy", cy)
        .attr("r", 9).attr("fill", col).attr("opacity", 0.85);
      const label = g.append("text")
        .attr("x", cx).attr("y", cy - 13)
        .attr("text-anchor", "middle").attr("fill", GRAY)
        .attr("font-size", 10).attr("font-weight", 600)
        .text(tau.rational_tau[i].toFixed(3));
      return { circle, label, val: tau.rational_tau[i] };
    });

    svg.append("text")
      .attr("transform", `translate(14,${m.top + ih / 2}) rotate(-90)`)
      .attr("text-anchor", "middle").attr("fill", GRAY).attr("font-size", 9)
      .text("Score (lower = better)");

    // Phase 2: zoom on viewport entry
    let zoomed = false;
    const observer = new IntersectionObserver(entries => {
      if (zoomed || !entries[0].isIntersecting) return;
      zoomed = true;
      observer.disconnect();
      setTimeout(() => {
        y.domain(tightDomain);
        yAxisG.transition().duration(900)
          .call(d3.axisLeft(y).ticks(4).tickFormat(d3.format(".3f")));
        yAxisG.selectAll("text").attr("fill", GRAY).attr("font-size", 10);
        dots.forEach(({ circle, label, val }) => {
          const newCy = y(val);
          circle.transition().duration(900).attr("cy", newCy);
          label.transition().duration(900).attr("y", newCy - 13);
        });
        bandRect.transition().duration(600).attr("opacity", 0);
        bandLabel.transition().duration(600).attr("opacity", 0);
      }, 1200);
    }, { threshold: 0.5 });
    observer.observe(el);
  }

  // Efficiency chart (Scrollama-driven)
  let effSvg = null;
  let effG = null;
  let effX = null, effY = null;
  let effIw = 0, effIh = 0;

  function buildEfficiencyChart() {
    const el = document.getElementById("efficiency-chart");
    const W = el.clientWidth || 360, H = 240;
    effSvg = d3.select("#efficiency-chart")
      .append("svg").attr("viewBox", `0 0 ${W} ${H}`).attr("width", "100%").attr("height", H);
    const m = { top: 20, right: 40, bottom: 35, left: 90 };
    effIw = W - m.left - m.right; effIh = H - m.top - m.bottom;
    effG = effSvg.append("g").attr("transform", `translate(${m.left},${m.top})`);

    effY = d3.scaleBand().domain(MECH_ORDER).range([0, effIh]).padding(0.2);
    const maxPick = Math.max(d3.max(eff.bottom_quartile), d3.max(eff.bottom_3)) * 1.08;
    effX = d3.scaleLinear().domain([1, maxPick]).range([0, effIw]);

    effG.append("g").call(d3.axisLeft(effY).tickFormat(d => MECH_LABELS[d]))
      .selectAll("text").attr("fill", GRAY).attr("font-size", 9);
    effG.append("g").attr("transform", `translate(0,${effIh})`)
      .call(d3.axisBottom(effX).ticks(4).tickFormat(d => `#${d}`))
      .selectAll("text").attr("fill", GRAY).attr("font-size", 9);
    effG.selectAll(".domain,.tick line").attr("stroke", "#eee");

    effSvg.append("text")
      .attr("x", 90 + effIw / 2).attr("y", 20 + effIh + 28)
      .attr("text-anchor", "middle").attr("fill", GRAY).attr("font-size", 9)
      .text("Average draft pick number");

    drawEfficiencyBars("quartile");
  }

  function drawEfficiencyBars(view) {
    const data = view === "bottom3" ? eff.bottom_3 : eff.bottom_quartile;
    MECH_ORDER.forEach((m2, i) => {
      const val = data[eff.mechanisms.indexOf(m2)];
      const col = COLORS[m2];

      effG.selectAll(`.eff-bar-${m2}`)
        .data([val]).join(
          enter => enter.append("rect")
            .attr("class", `eff-bar-${m2}`)
            .attr("y", effY(m2)).attr("height", effY.bandwidth())
            .attr("x", 0).attr("width", 0)
            .attr("fill", col).attr("rx", 3),
          update => update
        )
        .transition().delay((d, i2) => i * 60).duration(600)
        .attr("width", effX(val));

      effG.selectAll(`.eff-label-${m2}`)
        .data([val]).join(
          enter => enter.append("text")
            .attr("class", `eff-label-${m2}`)
            .attr("y", effY(m2) + effY.bandwidth() / 2)
            .attr("dominant-baseline", "middle")
            .attr("fill", GRAY).attr("font-size", 10).attr("font-weight", 600),
          update => update
        )
        .transition().delay(i * 60).duration(600)
        .attr("x", effX(val) + 5)
        .text(val != null ? val.toFixed(2) : "");
    });
  }

  buildEfficiencyChart();

  const scroller = scrollama();
  scroller.setup({
    step: "#fairness-steps .step",
    offset: 0.55,
  }).onStepEnter(({ element }) => {
    document.querySelectorAll("#fairness-steps .step").forEach(s => s.classList.remove("is-active"));
    element.classList.add("is-active");
    const view = element.dataset.fairnessView;
    drawEfficiencyBars(view);

    const titleEl = document.getElementById("efficiency-chart-title");
    const explainerEl = document.getElementById("efficiency-explainer");
    if (view === "bottom3") {
      if (titleEl) titleEl.textContent = "Average draft pick for the 3 weakest teams";
      if (explainerEl) explainerEl.textContent = "Lower is better: weak teams get earlier picks.";
    } else {
      if (titleEl) titleEl.textContent = "Average draft pick for the 8 weakest teams";
      if (explainerEl) explainerEl.textContent = "Lower is better: weak teams get earlier picks.";
    }
  });
}

// Tanking Timing Chart: sequential auto-reveal, one line at a time
function initTankingTimingChart() {
  const d = DATA.tanking_timing;
  if (!d) return;
  const el = document.getElementById("tanking-timing-chart");
  if (!el) return;

  const REVEAL = ["nba_lottery", "bilevel", "weighted_loss_exp_hl20", "cola"];
  const FG = "rgba(255,255,255,0.58)";
  const GRIDC = "rgba(255,255,255,0.07)";
  const PILL_BG = "rgba(26,32,53,0.85)";

  const W = Math.max(el.clientWidth || 320, 280), H = 300;
  const m = { top: 28, right: 16, bottom: 66, left: 46 };
  const iw = W - m.left - m.right, ih = H - m.top - m.bottom;

  const svg = d3.select("#tanking-timing-chart")
    .append("svg")
    .attr("viewBox", `0 0 ${W} ${H}`)
    .attr("width", "100%")
    .attr("height", H);

  const g = svg.append("g").attr("transform", `translate(${m.left},${m.top})`);

  const maxRate = d3.max(REVEAL.flatMap(mech => d.rates[mech]));
  const yTop = maxRate * 1.22;
  const x = d3.scaleLinear().domain([0, 82]).range([0, iw]);
  const y = d3.scaleLinear().domain([0, yTop]).range([ih, 0]);

  // Neutral reference band from 0 to 3%
  g.append("rect")
    .attr("x", 0).attr("y", y(0.03))
    .attr("width", iw).attr("height", y(0) - y(0.03))
    .attr("fill", "rgba(255,255,255,0.05)");

  // Gridlines
  g.append("g").call(d3.axisLeft(y).ticks(4).tickSize(-iw).tickFormat(""))
    .selectAll("line").attr("stroke", GRIDC);

  // X axis
  const xAx = g.append("g").attr("transform", `translate(0,${ih})`);
  xAx.call(d3.axisBottom(x).tickValues([10,20,30,40,50,60,70,80]).tickFormat(v => `G${v}`));
  xAx.selectAll("text").attr("fill", FG).attr("font-size", 9);
  xAx.selectAll(".domain,.tick line").attr("stroke", "rgba(255,255,255,0.2)");

  // Y axis
  const yAx = g.append("g");
  yAx.call(d3.axisLeft(y).ticks(4).tickFormat(d3.format(".0%")));
  yAx.selectAll("text").attr("fill", FG).attr("font-size", 9);
  yAx.selectAll(".domain,.tick line").attr("stroke", "rgba(255,255,255,0.2)");

  // Axis labels
  svg.append("text").attr("x", m.left + iw / 2).attr("y", H - 34)
    .attr("text-anchor", "middle").attr("fill", FG).attr("font-size", 10)
    .text("Game number");
  svg.append("text")
    .attr("transform", `translate(12,${m.top + ih / 2}) rotate(-90)`)
    .attr("text-anchor", "middle").attr("fill", FG).attr("font-size", 11)
    .text("Tanking rate");

  const line = d3.line()
    .x((_, i) => x(d.buckets[i]))
    .y(v => y(v))
    .curve(d3.curveMonotoneX);

  // Paths, hidden at start — bilevel uses curveLinear + synthetic G69/G70 for a sharp visual cutoff
  const bilBuckets = [5, 15, 25, 35, 45, 55, 65, 69, 70, 75, 80];
  const bilRates = [
    d.rates.bilevel[0], d.rates.bilevel[1], d.rates.bilevel[2], d.rates.bilevel[3],
    d.rates.bilevel[4], d.rates.bilevel[5], d.rates.bilevel[6], d.rates.bilevel[6], 0, 0, 0,
  ];
  const bilLine = d3.line().x((_, i) => x(bilBuckets[i])).y(v => y(v)).curve(d3.curveLinear);

  const paths = {};
  REVEAL.forEach(mech => {
    if (mech === "bilevel") {
      paths.bilevel = g.append("path").datum(bilRates)
        .attr("fill", "none").attr("stroke", COLORS.bilevel)
        .attr("stroke-width", 2.2).attr("opacity", 0).attr("d", bilLine);
    } else {
      paths[mech] = g.append("path").datum(d.rates[mech])
        .attr("fill", "none").attr("stroke", COLORS[mech])
        .attr("stroke-width", 2.2).attr("opacity", 0).attr("d", line);
    }
  });

  // Pill helper: appends text lines into host, inserts backdrop rect, returns pill bbox
  function makePill(host, cx, cy, lines, color, anchor) {
    const PAD = { x: 7, y: 4 };
    const lineH = 13;
    const n = lines.length;
    lines.forEach((l, i) => {
      host.append("text")
        .attr("x", cx).attr("y", cy + (i - (n - 1) / 2) * lineH)
        .attr("dy", "0.35em").attr("text-anchor", anchor)
        .attr("fill", "white")
        .attr("font-size", l.size || 10).attr("font-weight", l.bold ? 700 : 400)
        .text(l.text);
    });
    const bb = host.node().getBBox();
    host.insert("rect", ":first-child")
      .attr("x", bb.x - PAD.x).attr("y", bb.y - PAD.y)
      .attr("width", bb.width + PAD.x * 2).attr("height", bb.height + PAD.y * 2)
      .attr("rx", 7).attr("fill", PILL_BG)
      .attr("stroke", color).attr("stroke-width", 1);
    return host.node().getBBox();
  }

  // NBA Lottery: pill end-anchored near G73, inside chart
  const nbaAnn = g.append("g").attr("opacity", 0);
  const nba_px = x(73), nba_py = y(d.rates.nba_lottery[7]);
  makePill(nbaAnn, nba_px, nba_py,
    [{text: "NBA Lottery", bold: true}, {text: "tanking peaks as"}, {text: "playoff elimination"}],
    COLORS.nba_lottery, "end");

  // Bilevel: lock line at G70, pill at G68, "standings lock" muted at bottom of line
  const bilAnn = g.append("g").attr("opacity", 0);
  const x70 = x(70);
  bilAnn.append("line")
    .attr("x1", x70).attr("x2", x70).attr("y1", 0).attr("y2", ih)
    .attr("stroke", COLORS.bilevel).attr("stroke-width", 1.2)
    .attr("stroke-dasharray", "3 3").attr("opacity", 0.75);
  bilAnn.append("text").attr("x", x70 - 4).attr("y", ih - 7)
    .attr("text-anchor", "end").attr("fill", "rgba(255,255,255,0.32)").attr("font-size", 7.5)
    .text("standings lock");
  const bilPill = bilAnn.append("g");
  makePill(bilPill, x(63), y(d.rates.bilevel[6]) - 7,
    [{text: "Bilevel", bold: true, size: 11}, {text: "cuts off instantly", size: 11}],
    COLORS.bilevel, "end");

  // Weighted Loss: pill at G40
  const wlAnn = g.append("g").attr("opacity", 0);
  const wlPill = wlAnn.append("g");
  const wl_rate_mid = (d.rates.weighted_loss_exp_hl20[3] + d.rates.weighted_loss_exp_hl20[4]) / 2;
  makePill(wlPill, x(40), y(wl_rate_mid) - 20,
    [{text: "Weighted Loss", bold: true}, {text: "each loss worth less."}, {text: "No moment to game around."}],
    COLORS.weighted_loss_exp_hl20, "middle");

  // COLA: pill in upper-left corner to avoid overlap with WL, vertical dashed leader to flat zero line
  const colaAnn = g.append("g").attr("opacity", 0);
  const colaPill = colaAnn.append("g");
  const colaBB = makePill(colaPill, 5, 42,
    [{text: "COLA", bold: true, size: 11}, {text: "no ticket effect.", size: 10}, {text: "Nothing to gain all season.", size: 10}],
    COLORS.cola, "start");
  const cola_leader_x = x(15);
  colaAnn.append("line")
    .attr("x1", cola_leader_x).attr("x2", cola_leader_x)
    .attr("y1", colaBB.y + colaBB.height).attr("y2", ih - 2)
    .attr("stroke", COLORS.cola).attr("stroke-width", 1)
    .attr("stroke-dasharray", "2 2").attr("opacity", 0.5);
  colaAnn.append("line")
    .attr("x1", cola_leader_x - 7).attr("x2", cola_leader_x + 7).attr("y1", ih).attr("y2", ih)
    .attr("stroke", COLORS.cola).attr("stroke-width", 1.5).attr("opacity", 0.6);

  const annotations = [nbaAnn, bilAnn, wlAnn, colaAnn];

  // Concluding footer
  const conclusion = svg.append("text")
    .attr("x", m.left + iw / 2).attr("y", H - 14)
    .attr("text-anchor", "middle")
    .attr("fill", "rgba(255,255,255,0.42)")
    .attr("font-size", 11).attr("font-style", "italic")
    .attr("opacity", 0)
    .text("Rules shift when teams tank. COLA cuts the incentive the most.");

  // Each annotation fades in immediately after its line finishes, before the next line begins
  let played = false;
  function playSequence() {
    if (played) return;
    played = true;
    const DRAW = 900, ANN = 450, CYCLE = DRAW + ANN;
    REVEAL.forEach((mech, i) => {
      const p = paths[mech];
      const ann = annotations[i];
      setTimeout(() => {
        const len = p.node().getTotalLength();
        p.attr("stroke-dasharray", `${len} ${len}`)
          .attr("stroke-dashoffset", len)
          .attr("opacity", 1)
          .transition().duration(DRAW).ease(d3.easeLinear)
          .attr("stroke-dashoffset", 0);
      }, i * CYCLE);
      setTimeout(() => ann.transition().duration(ANN).attr("opacity", 1),
        i * CYCLE + DRAW);
    });
    const allDone = REVEAL.length * CYCLE;
    setTimeout(() => conclusion.transition().duration(700).attr("opacity", 1),
      allDone + 300);
  }

  const obs = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) { playSequence(); obs.disconnect(); }
  }, { threshold: 0.3 });
  obs.observe(el);
}

// ── Pick Distribution Heatmap ─────────────────────────────────────────────────
function initPickDistributionChart() {
  const d = DATA.pick_distribution;
  if (!d) return;
  const el = document.getElementById("pick-distribution-chart");
  if (!el) return;

  // Single navy intensity scale, row-normalized. Judgment communicated via row label pills only.
  // Distributions proportionally rebucketed from original [Pick1, Picks2-3, Picks4-7, Picks8-14].
  const NAVY     = "#1B3A6B";
  const BADGE_BG = "#1B3A6B";

  const W = Math.max(el.clientWidth || 320, 280);
  const rowH = 40;  // ~30% reduction from prior 56px
  const labelW = 88, rightPad = 8;
  const colW = Math.floor((W - labelW - rightPad) / MECH_ORDER.length);
  const headerH = 40;
  const nRows = d.pick_ranges.length;
  const totalH = headerH + nRows * rowH;

  const svg = d3.select("#pick-distribution-chart")
    .append("svg").attr("viewBox", `0 0 ${W} ${totalH}`)
    .attr("width", "100%").attr("height", totalH);

  const ROW_SUBLABELS = ["franchise", "lottery upside", "contributors", "role players"];
  const ROW_PILL_TEXT = ["want dark here", "want dark here", "want light here", "want light here"];
  const ROW_PILL_TC   = ["#2d7a50", "#2d7a50", "#9e3e3e", "#9e3e3e"];
  const ROW_PILL_BG   = ["#e8f5ee", "#e8f5ee", "#faeaea", "#faeaea"];

  const rowMaxVals = d.pick_ranges.map((_, ri) =>
    d3.max(MECH_ORDER.map(mech => d.distributions[mech][ri]))
  );

  function cellColor(ri, val) {
    const t = rowMaxVals[ri] > 0 ? val / rowMaxVals[ri] : 0;
    return d3.interpolateRgb("#f0f2f5", NAVY)(t);
  }

  const CELL_CONTEXT = [
    (pct) => pct >= 10
      ? `About 1 in ${Math.round(100 / pct)} seasons, the weakest teams land the top pick.`
      : `The weakest teams get the top pick only ${pct}% of the time.`,
    (pct) => pct >= 25
      ? `Weak teams land a top-4 pick roughly 1 in ${Math.round(100 / pct)} seasons.`
      : `A top-4 pick lands with weak teams in only ${pct}% of seasons.`,
    (pct) => pct >= 35
      ? `More than a third of the time, weak teams land in the middle of the lottery.`
      : `Weak teams land picks 5 to 9 in about ${pct}% of seasons.`,
    (pct) => pct >= 35
      ? `Nearly half the time, the weakest teams end up at the bottom of the lottery.`
      : `Weak teams land picks 10 to 14 in ${pct}% of seasons despite struggling.`,
  ];

  const BADGE_TOOLTIP = "Early-season losses count more under Weighted Loss, so truly weak teams that struggle from game one accumulate the most lottery value. This gives them a slight edge at the top pick despite the mechanism not being designed for redistribution.";

  const HEATMAP_TIPS = {
    nba_lottery:            "Worse records get more lottery balls, so tanking concentrates picks at the bottom of the lottery rather than the top.",
    bilevel:                "Standings lock at game 70, which reduces late-season tanking but leaves the early-season incentive intact.",
    weighted_loss_exp_hl20: "Early losses count more than late ones, so teams that tank from the start accumulate an advantage over honest late-season losers.",
    nba_321_lottery:        "The bottom three teams get fewer balls than teams ranked 4 through 14, which reduces extreme tanking but creates a bubble incentive.",
    cola:                   "All non-playoff teams earn equal tickets regardless of record, so weak teams build advantage through multi-year accumulation rather than single-season losing.",
  };

  const cellRects  = [];
  const cellColors = [];
  const cellTexts  = [];
  const wlColIdx   = MECH_ORDER.indexOf("weighted_loss_exp_hl20");
  let   wlBadgeGroup = null;

  const tipEl = document.createElement("div");
  tipEl.style.cssText = "position:fixed;background:rgba(10,10,20,0.92);color:white;font-size:11px;padding:7px 9px;border-radius:6px;box-shadow:0 4px 12px rgba(0,0,0,0.5);max-width:200px;pointer-events:none;opacity:0;transition:opacity 100ms ease;z-index:1000;line-height:1.5;";
  document.body.appendChild(tipEl);

  function showTip(html, svgCx, svgCy) {
    const bb = svg.node().getBoundingClientRect();
    const left = Math.min(Math.max(4, bb.left + svgCx * (bb.width / W) - 100), window.innerWidth - 214);
    tipEl.innerHTML = html;
    tipEl.style.left = left + "px";
    tipEl.style.top  = (bb.top + svgCy * (bb.height / totalH) + 5) + "px";
    tipEl.style.opacity = "1";
  }
  const hideTip = () => { tipEl.style.opacity = "0"; };

  // Column headers with subtle bottom accent border
  MECH_ORDER.forEach((mech, ci) => {
    const hx = labelW + ci * colW;
    svg.append("text")
      .attr("x", hx + colW / 2)
      .attr("y", headerH - 6)
      .attr("text-anchor", "middle")
      .attr("fill", COLORS[mech]).attr("font-size", 8).attr("font-weight", 700)
      .text(MECH_LABELS[mech]);

    svg.append("line")
      .attr("x1", hx + 2).attr("x2", hx + colW - 2)
      .attr("y1", headerH - 1).attr("y2", headerH - 1)
      .attr("stroke", COLORS[mech]).attr("stroke-width", 1).attr("opacity", 0.5);

    cellRects.push([]);
    cellColors.push([]);
    cellTexts.push([]);
  });

  // Row labels (three elements: main, descriptor, judgment pill) + cells
  d.pick_ranges.forEach((label, ri) => {
    const cellY = headerH + ri * rowH;

    svg.append("text")
      .attr("x", labelW - 6).attr("y", cellY + 8)
      .attr("text-anchor", "end").attr("dominant-baseline", "middle")
      .attr("fill", "#111111").attr("font-size", 10).attr("font-weight", 700)
      .text(label);
    svg.append("text")
      .attr("x", labelW - 6).attr("y", cellY + 19)
      .attr("text-anchor", "end").attr("dominant-baseline", "middle")
      .attr("fill", "#555555").attr("font-size", 8).attr("font-style", "italic")
      .text(ROW_SUBLABELS[ri]);

    // Judgment pill
    const pillG = svg.append("g");
    const pillTxt = pillG.append("text")
      .attr("x", labelW - 6).attr("y", cellY + 30)
      .attr("text-anchor", "end").attr("dominant-baseline", "middle")
      .attr("fill", ROW_PILL_TC[ri]).attr("font-size", 8)
      .text(ROW_PILL_TEXT[ri]);
    const pbb = pillTxt.node().getBBox();
    pillG.insert("rect", "text")
      .attr("x", pbb.x - 3).attr("y", pbb.y - 2)
      .attr("width", pbb.width + 6).attr("height", pbb.height + 4)
      .attr("rx", 2).attr("fill", ROW_PILL_BG[ri]);

    MECH_ORDER.forEach((mech, ci) => {
      const val   = d.distributions[mech][ri];
      const cellX = labelW + ci * colW;
      const pct   = Math.round(val * 100);
      const color = cellColor(ri, val);
      const tNorm = rowMaxVals[ri] > 0 ? val / rowMaxVals[ri] : 0;

      const cellSel = svg.append("rect")
        .attr("x", cellX + 2).attr("y", cellY + 2)
        .attr("width", colW - 4).attr("height", rowH - 4)
        .attr("rx", 3)
        .style("fill", "#f0f2f5")
        .style("transition", "fill 400ms ease")
        .on("mouseenter", () => showTip(
          `<span style="font-size:14px;font-weight:700">${pct}% of the time.</span><br>${CELL_CONTEXT[ri](pct)}`,
          cellX + colW / 2, cellY + rowH
        ))
        .on("mouseleave", hideTip);

      const textSel = svg.append("text")
        .attr("x", cellX + colW / 2).attr("y", cellY + rowH / 2)
        .attr("text-anchor", "middle").attr("dominant-baseline", "middle")
        .attr("fill", tNorm > 0.75 ? "white" : "#333")
        .attr("font-size", 13).attr("font-weight", 700)
        .style("opacity", "0")
        .style("transition", "opacity 300ms ease")
        .style("pointer-events", "none")
        .text(`${pct}%`);

      cellRects[ci].push(cellSel.node());
      cellColors[ci].push(color);
      cellTexts[ci].push(textSel.node());

      // WL Pick 1 badge: small navy dot indicator (cells too narrow for text badge)
      if (ri === 0 && mech === "weighted_loss_exp_hl20") {
        const bg = svg.append("g")
          .style("opacity", "0")
          .style("transition", "opacity 300ms ease")
          .on("mouseenter", () => showTip(
            `<span style="font-size:12px;font-weight:700">Why Weighted Loss leads:</span><br>${BADGE_TOOLTIP}`,
            cellX + colW / 2, cellY + rowH
          ))
          .on("mouseleave", hideTip);

        bg.append("circle")
          .attr("cx", cellX + colW - 5)
          .attr("cy", cellY + 5)
          .attr("r", 3)
          .attr("fill", BADGE_BG);

        wlBadgeGroup = bg.node();
      }
    });
  });

  // Column header overlays for highlight and mechanism tooltip
  MECH_ORDER.forEach((mech, ci) => {
    const hx = labelW + ci * colW;
    svg.append("rect")
      .attr("x", hx).attr("y", 0)
      .attr("width", colW).attr("height", headerH)
      .attr("fill", "transparent")
      .on("mouseenter", function() {
        showTip(HEATMAP_TIPS[mech], hx + colW / 2, headerH);
        cellRects[ci].forEach(r => { r.style.stroke = COLORS[mech]; r.style.strokeWidth = "1px"; });
      })
      .on("mouseleave", function() {
        hideTip();
        cellRects[ci].forEach(r => { r.style.stroke = ""; r.style.strokeWidth = ""; });
      });
  });

  // Summary caption (legend removed; judgment communicated via row label pills)
  const summaryEl = document.createElement("p");
  summaryEl.textContent = "Every mechanism sends the weakest teams to the bottom of the draft more often than the top. The gap between mechanisms is real but smaller than you might hope.";
  summaryEl.style.cssText = "margin-top:0.45rem;font-size:0.75rem;color:#555555;text-align:center;font-style:italic;letter-spacing:0.02em;opacity:0;transition:opacity 0.6s ease;";
  el.appendChild(summaryEl);

  // Scroll-triggered animation
  let animated = false;
  const observer = new IntersectionObserver((entries) => {
    if (animated || !entries[0].isIntersecting) return;
    animated = true;
    observer.disconnect();

    MECH_ORDER.forEach((_, ci) => {
      d.pick_ranges.forEach((__, ri) => {
        const delay = ci * 200 + ri * 80;
        setTimeout(() => {
          cellRects[ci][ri].style.fill = cellColors[ci][ri];
          cellTexts[ci][ri].style.opacity = "1";
          if (ci === wlColIdx && ri === 0 && wlBadgeGroup) {
            setTimeout(() => { wlBadgeGroup.style.opacity = "1"; }, 450);
          }
        }, delay);
      });
    });

    const totalDelay = (MECH_ORDER.length - 1) * 200 + (nRows - 1) * 80 + 400 + 300;
    setTimeout(() => { summaryEl.style.opacity = "1"; }, totalDelay);
  }, { threshold: 0.3 });

  observer.observe(el);
}

// ── Reform Scorecard ──────────────────────────────────────────────────────────
function initReformScorecard() {
  const tr = DATA.tanking_rates;
  const tau = DATA.tau_distances;
  const eff = DATA.draft_efficiency;
  if (!tr || !tau || !eff) return;
  const el = document.getElementById("reform-scorecard");
  if (!el) return;

  const mechs = MECH_ORDER;
  const metrics = [
    { key: "tanking",    label: "Tanking rate",  vals: tr.rational,       src: tr.mechanisms,  fmt: d3.format(".1%"), lowerBetter: true },
    { key: "tau",        label: "Fairness (τ)",   vals: tau.rational_tau,  src: tau.mechanisms, fmt: d => d.toFixed(3), lowerBetter: true },
    { key: "efficiency", label: "Draft eff.",     vals: eff.bottom_quartile, src: eff.mechanisms, fmt: d => `#${d.toFixed(1)}`, lowerBetter: true },
  ];

  function cellColor(metricIdx, mechKey) {
    const { vals, lowerBetter } = metrics[metricIdx];
    const mn = d3.min(vals), mx = d3.max(vals);
    const v = vals[metrics[metricIdx].src.indexOf(mechKey)];
    const norm = (v - mn) / (mx - mn || 1);
    const t = lowerBetter ? 1 - norm : norm;
    return d3.interpolate("#d4edda", "#f8d7da")(1 - t);
  }

  const table = document.createElement("table");
  table.style.cssText = "width:100%;border-collapse:collapse;font-size:0.78rem;";

  const thead = table.createTHead();
  const hrow = thead.insertRow();
  ["Mechanism", ...metrics.map(m => m.label)].forEach((h, i) => {
    const th = document.createElement("th");
    th.textContent = h;
    th.style.cssText = `padding:0.4rem 0.5rem;text-align:${i===0?"left":"center"};font-weight:600;color:#555;border-bottom:2px solid #ddd;font-size:0.7rem;text-transform:uppercase;letter-spacing:0.04em;`;
    hrow.appendChild(th);
  });

  const tbody = table.createTBody();
  mechs.forEach((mech, mi) => {
    const row = tbody.insertRow();
    const nameCell = row.insertCell();
    nameCell.style.cssText = "padding:0.4rem 0.5rem;font-weight:600;border-bottom:1px solid #eee;font-size:0.75rem;";
    const dot = document.createElement("span");
    dot.style.cssText = `display:inline-block;width:8px;height:8px;border-radius:50%;background:${COLORS[mech]};margin-right:0.35rem;vertical-align:middle;`;
    nameCell.appendChild(dot);
    nameCell.appendChild(document.createTextNode(MECH_LABELS[mech]));
    metrics.forEach((metric, metricIdx) => {
      const cell = row.insertCell();
      const di = metric.src.indexOf(mech);
      cell.style.cssText = `padding:0.4rem 0.5rem;text-align:center;border-bottom:1px solid #eee;background:${cellColor(metricIdx, mech)};font-size:0.75rem;`;
      cell.textContent = metric.fmt(metric.vals[di]);
    });
  });

  el.appendChild(table);
  const caption = document.createElement("p");
  caption.style.cssText = "font-size:0.72rem;color:#999;margin-top:0.4rem;";
  caption.textContent = "Green = better. All values from 1,000-game simulations.";
  el.appendChild(caption);
}

// ── Section 9: LLM Chart (Scrollama) ─────────────────────────────────────────
function initLLMChart() {
  const llm = DATA.llm_by_mechanism;
  if (!llm) return;

  const mechs = MECH_ORDER;
  const W = 480, H = 500;
  const svg = d3.select("#llm-chart").attr("viewBox", `0 0 ${W} ${H}`);
  const m = { top: 40, right: 20, bottom: 60, left: 90 };
  const iw = W - m.left - m.right, ih = H - m.top - m.bottom;
  const g = svg.append("g").attr("transform", `translate(${m.left},${m.top})`);

  // Hatch patterns: one per mechanism (for AI bars) + one for legend swatch
  const defs = svg.append("defs");
  mechs.forEach(mech => {
    const pat = defs.append("pattern")
      .attr("id", `hatch-llm-${mech}-m`)
      .attr("patternUnits", "userSpaceOnUse")
      .attr("width", 5).attr("height", 5)
      .attr("patternTransform", "rotate(45)");
    pat.append("rect").attr("width", 5).attr("height", 5)
      .attr("fill", COLORS[mech]).attr("fill-opacity", 0.18);
    pat.append("line").attr("x1", 0).attr("y1", 0).attr("x2", 0).attr("y2", 5)
      .attr("stroke", COLORS[mech]).attr("stroke-width", 2);
  });
  const legPat = defs.append("pattern")
    .attr("id", "hatch-llm-legend-m")
    .attr("patternUnits", "userSpaceOnUse")
    .attr("width", 5).attr("height", 5)
    .attr("patternTransform", "rotate(45)");
  legPat.append("rect").attr("width", 5).attr("height", 5)
    .attr("fill", NAVY).attr("fill-opacity", 0.18);
  legPat.append("line").attr("x1", 0).attr("y1", 0).attr("x2", 0).attr("y2", 5)
    .attr("stroke", NAVY).attr("stroke-width", 2);

  const maxVal = d3.max([...llm.rational, ...llm.llm]) * 1.2;
  const x = d3.scaleBand().domain(mechs).range([0, iw]).padding(0.25);
  const y = d3.scaleLinear().domain([0, Math.max(0.12, maxVal)]).range([ih, 0]);

  g.append("g").call(d3.axisLeft(y).ticks(5).tickFormat(d3.format(".0%")))
    .selectAll("text").attr("fill", GRAY).attr("font-size", 11);
  g.selectAll(".domain,.tick line").attr("stroke", "#ddd");

  g.append("g").call(d3.axisLeft(y).ticks(5).tickSize(-iw).tickFormat(""))
    .selectAll("line").attr("stroke", "#eee");

  const mechLabels = g.selectAll(".llm-mech-label")
    .data(mechs).join("text")
    .attr("class", "llm-mech-label")
    .attr("x", d => x(d) + x.bandwidth() / 2)
    .attr("y", ih + 18).attr("text-anchor", "middle")
    .attr("fill", LGRAY).attr("font-size", 11)
    .text(d => MECH_LABELS[d]);

  const legend = svg.append("g").attr("transform", `translate(${m.left},${H - 16})`);
  legend.append("rect").attr("x", 0).attr("y", -8).attr("width", 12).attr("height", 12)
    .attr("fill", NAVY).attr("rx", 2);
  legend.append("text").attr("x", 16).attr("y", 2).attr("fill", GRAY).attr("font-size", 11)
    .text("Strategic teams");
  legend.append("rect").attr("x", 170).attr("y", -8).attr("width", 12).attr("height", 12)
    .attr("fill", "url(#hatch-llm-legend-m)").attr("rx", 2)
    .attr("stroke", NAVY).attr("stroke-width", 1);
  legend.append("text").attr("x", 186).attr("y", 2).attr("fill", GRAY).attr("font-size", 11)
    .text("AI (Claude Haiku)");

  let revealed = new Set();

  function updateLLM(activeMech) {
    revealed.add(activeMech);
    mechs.forEach((mech, mi) => {
      const isRevealed = revealed.has(mech);
      const isActive   = mech === activeMech;
      mechLabels.filter(d => d === mech).transition().duration(400)
        .attr("fill", isActive ? NAVY : isRevealed ? GRAY : LGRAY)
        .attr("font-weight", isActive ? 700 : 400);

      [{ key: "rational", color: COLORS[mech],                        offset: -14 },
       { key: "llm",      color: `url(#hatch-llm-${mech}-m)`,        offset: 14  }]
        .forEach(({ key, color, offset }) => {
          const val = llm[key][llm.mechanisms.indexOf(mech)];
          const bx  = x(mech) + x.bandwidth() / 2 + offset - 11;
          const opacity = isActive ? 1 : isRevealed ? 0.4 : 0;
          g.selectAll(`.llm-bar-${mech}-${key}`)
            .data([val]).join(
              enter => enter.append("rect")
                .attr("class", `llm-bar-${mech}-${key}`)
                .attr("x", bx).attr("width", 22)
                .attr("y", ih).attr("height", 0).attr("rx", 3)
                .attr("fill", color).attr("opacity", 0),
              update => update
            )
            .transition().duration(500)
            .attr("y", y(val)).attr("height", ih - y(val)).attr("opacity", opacity);
        });
    });
  }

  const scroller = scrollama();
  scroller.setup({
    step: "#llm-steps .step",
    offset: 0.55,
  }).onStepEnter(({ element }) => {
    document.querySelectorAll("#llm-steps .step").forEach(s => s.classList.remove("is-active"));
    element.classList.add("is-active");
    updateLLM(element.dataset.llmMech);
  });

  updateLLM(mechs[0]);
}

// ── Main ───────────────────────────────────────────────────────────────────────
async function main() {
  try {
    await loadAll();
  } catch (err) {
    console.error("Data load failed:", err);
    document.body.insertAdjacentHTML("afterbegin",
      `<div style="background:#fde8ea;color:#c00;padding:1rem;text-align:center;font-weight:600;">
        Could not load data. Run: <code>python -m http.server 8080</code> in the essay/ folder,
        then open <a href="http://localhost:8080">http://localhost:8080</a>
      </div>`);
    return;
  }

  initLottery();
  initPickValues();
  initBalanceScale();
  initTankingTimingChart();
  initPickDistributionChart();
  initTrajectory();
  initReformExplorer();
  initTankingRateScroll();
  initFairness();
  initLLMChart();
}

main();
