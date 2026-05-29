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

const NAVY  = "#1B3A6B";
const RED   = "#C8102E";
const GRAY  = "#555555";
const LGRAY = "#AAAAAA";

// 2019 NBA lottery: combinations out of 1000 per team rank (worst=1)
const NBA_ODDS = [140, 140, 140, 125, 105, 90, 75, 60, 45, 30, 20, 15, 10, 5];
const NBA_ODDS_PCT = NBA_ODDS.map(v => (v / 10).toFixed(1));

// ── Data ───────────────────────────────────────────────────────────────────────
let DATA = {};

async function loadAll() {
  const files = [
    "pick_values", "tanking_rates", "tau_distances",
    "draft_efficiency", "mixed_sweep", "playoff_value_sweep",
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
  // Mobile: square canvas capped at 360px
  const W = Math.min(container.clientWidth || 360, 360);
  const H = W;

  const svg = d3.select("#lottery-canvas")
    .append("svg")
    .attr("viewBox", `0 0 ${W} ${H}`)
    .attr("width", "100%")
    .attr("height", "100%");

  // True colors (shown in step 3)
  const TRUE_COLORS = NBA_ODDS.map((_, i) =>
    i < 3 ? RED : i < 7 ? NAVY : LGRAY
  );

  // Start all balls grey
  const totalBalls = 70;
  const balls = NBA_ODDS.map((combo, i) => ({
    rank: i + 1,
    balls: Math.max(1, Math.round(combo / 1000 * totalBalls)),
    pct: NBA_ODDS_PCT[i],
    combo,
    trueColor: TRUE_COLORS[i],
    label: i < 3 ? "Top 3" : i < 7 ? "Mid" : "Bottom",
  }));

  const r = Math.min(W, H) * 0.042;

  // Start balls above the canvas for a dramatic rain-in effect
  const nodes = [];
  balls.forEach(team => {
    for (let b = 0; b < team.balls; b++) {
      nodes.push({
        ...team,
        id: `${team.rank}-${b}`,
        x: r * 2 + Math.random() * (W - r * 4),
        y: -r * (3 + Math.random() * 5),   // above SVG top
      });
    }
  });

  const sim = d3.forceSimulation(nodes)
    .force("center", d3.forceCenter(W / 2, H / 2).strength(0.03))
    .force("y", d3.forceY(H * 0.52).strength(0.22))
    .force("collide", d3.forceCollide(r + 1.5).strength(0.9))
    .force("charge", d3.forceManyBody().strength(-3))
    .on("tick", ticked)
    .stop(); // Paused until user scrolls into section

  let simStarted = false;

  const circles = svg.selectAll("circle")
    .data(nodes)
    .join("circle")
    .attr("r", r)
    .attr("fill", "#CCCCCC")
    .attr("stroke", "#AAAAAA")
    .attr("stroke-width", 1.5)
    .attr("pointer-events", "none");

  // Info overlay for highlighted cluster
  const infoBox = svg.append("g").attr("id", "info-box").attr("opacity", 0);
  const infoRect = infoBox.append("rect").attr("rx", 8).attr("ry", 8)
    .attr("fill", NAVY).attr("opacity", 0.95);
  const infoText1 = infoBox.append("text")
    .attr("fill", "white").attr("font-size", 13).attr("font-weight", 700);
  const infoText2 = infoBox.append("text")
    .attr("fill", "rgba(255,255,255,0.7)").attr("font-size", 11);

  function ticked() {
    circles
      .attr("cx", d => d.x = Math.max(r, Math.min(W - r, d.x)))
      .attr("cy", d => d.y = Math.max(r, Math.min(H - r, d.y)));
  }

  function showClusterInfo(rank) {
    const teamNodes = nodes.filter(d => d.rank === rank);
    const cx = d3.mean(teamNodes, d => d.x);
    const cy = d3.mean(teamNodes, d => d.y);
    const msg1 = rank <= 3 ? `Rank #${rank} worst: 14.0% odds` : `Rank #${rank} worst`;
    const msg2 = `${balls[rank-1].combo} combinations, ${balls[rank-1].pct}% at pick #1`;
    const bw = Math.max(msg1.length, msg2.length) * 7.5 + 20;
    const bh = 52;
    const bx = Math.min(Math.max(cx - bw / 2, 5), W - bw - 5);
    const by = cy < H / 2 ? cy + r + 10 : cy - r - bh - 10;
    infoRect.attr("x", bx).attr("y", by).attr("width", bw).attr("height", bh);
    infoText1.attr("x", bx + 10).attr("y", by + 18).text(msg1);
    infoText2.attr("x", bx + 10).attr("y", by + 36).text(msg2);
    infoBox.transition().duration(200).attr("opacity", 1);
  }

  // Scrollama step handler
  window._updateLotteryStep = function(step) {
    infoBox.attr("opacity", 0);

    if (step === 0) {
      // Start fall animation the first time user scrolls into this section
      if (!simStarted) { simStarted = true; sim.alpha(0.8).restart(); }
      // All grey
      circles.transition().duration(600)
        .attr("fill", "#CCCCCC")
        .attr("stroke", "#AAAAAA")
        .attr("opacity", 1);
    } else if (step === 1) {
      // Highlight rank 14 (best of worst), dim others
      circles.transition().duration(600)
        .attr("fill", d => d.rank === 14 ? "#64B5F6" : "#CCCCCC")
        .attr("stroke", d => d.rank === 14 ? "#1565C0" : "#AAAAAA")
        .attr("opacity", d => d.rank === 14 ? 1 : 0.3);
      // Show info for rank 14
      setTimeout(() => {
        const teamNodes = nodes.filter(d => d.rank === 14);
        const cx = d3.mean(teamNodes, d => d.x);
        const cy = d3.mean(teamNodes, d => d.y);
        const bw = 220, bh = 52;
        const bx = Math.min(Math.max(cx - bw / 2, 5), W - bw - 5);
        const by = cy < H / 2 ? cy + r + 10 : cy - r - bh - 10;
        infoRect.attr("x", bx).attr("y", by).attr("width", bw).attr("height", bh);
        infoText1.attr("x", bx + 10).attr("y", by + 18).text("14th-worst team");
        infoText2.attr("x", bx + 10).attr("y", by + 36).text("5 combos, 0.5% odds at pick #1");
        infoBox.transition().duration(400).attr("opacity", 1);
      }, 700);
    } else if (step === 2) {
      // Highlight ranks 1-3 in red, dim others
      circles.transition().duration(600)
        .attr("fill", d => d.rank <= 3 ? RED : "#CCCCCC")
        .attr("stroke", d => d.rank <= 3 ? "#8B0000" : "#AAAAAA")
        .attr("opacity", d => d.rank <= 3 ? 1 : 0.25);
      setTimeout(() => {
        const teamNodes = nodes.filter(d => d.rank <= 3);
        const cx = d3.mean(teamNodes, d => d.x);
        const cy = d3.mean(teamNodes, d => d.y);
        const bw = 240, bh = 52;
        const bx = Math.min(Math.max(cx - bw / 2, 5), W - bw - 5);
        const by = cy < H / 2 ? cy + r + 10 : cy - r - bh - 10;
        infoRect.attr("x", bx).attr("y", by).attr("width", bw).attr("height", bh);
        infoText1.attr("x", bx + 10).attr("y", by + 18).text("3 worst teams: 14% each");
        infoText2.attr("x", bx + 10).attr("y", by + 36).text("140 combinations — the flat zone");
        infoBox.transition().duration(400).attr("opacity", 1);
      }, 700);
    } else if (step === 3) {
      // All true colors — re-enable physics if it was stopped
      sim.alpha(0.3).restart();
      infoBox.attr("opacity", 0);
      svg.selectAll(".tornado-label").remove();
      circles.transition().duration(800)
        .attr("r", r)
        .attr("fill", d => d.trueColor + "CC")
        .attr("stroke", d => d.trueColor)
        .attr("opacity", 1);
      // Mobile: tap to toggle info overlay
      circles.attr("pointer-events", "all")
        .on("click", function(event, d) {
          const currentOpacity = +infoBox.attr("opacity");
          if (currentOpacity > 0) {
            infoBox.attr("opacity", 0);
          } else {
            showClusterInfo(d.rank);
          }
        });
      document.getElementById("lottery-legend").innerHTML = `
        <span class="legend-chip" style="background:${RED}22;color:${RED};">Rank 1-3 (14% each)</span>
        <span class="legend-chip" style="background:${NAVY}22;color:${NAVY};">Rank 4-7 (declining)</span>
        <span class="legend-chip" style="background:#eee;color:#666;">Rank 8-14 (&lt;4%)</span>
      `;
    } else if (step === 4) {
      // Tornado: arrange balls in rows by rank (rank 1 at top, 14 at bottom)
      sim.stop();
      infoBox.attr("opacity", 0);
      circles.attr("pointer-events", "none").on("click", null);
      document.getElementById("lottery-legend").innerHTML = "";

      const rowH = H / 15;
      const rTornado = r * 0.78;
      const gap = rTornado * 2 + 2;

      // Build rank groups and compute target positions
      const rankGroups = {};
      nodes.forEach(n => { (rankGroups[n.rank] = rankGroups[n.rank] || []).push(n); });
      Object.entries(rankGroups).forEach(([rankStr, grp]) => {
        const rank = +rankStr;
        const targetY = r + (rank - 1) * rowH + rowH / 2;
        const totalW = grp.length * gap;
        grp.forEach((node, idx) => {
          node.tx = W / 2 - totalW / 2 + idx * gap + rTornado;
          node.ty = targetY;
        });
      });

      circles.transition().duration(1000).delay((d, i) => i * 10)
        .attr("r", rTornado)
        .attr("cx", d => d.tx)
        .attr("cy", d => d.ty)
        .attr("fill", d => d.trueColor + "CC")
        .attr("stroke", d => d.trueColor)
        .attr("opacity", 1);

      // Rank labels on right side
      svg.selectAll(".tornado-label").remove();
      balls.forEach(team => {
        const targetY = r + (team.rank - 1) * rowH + rowH / 2;
        const labelOdds = `${team.pct}%`;
        svg.append("text")
          .attr("class", "tornado-label")
          .attr("x", W - 4).attr("y", targetY + 4)
          .attr("text-anchor", "end")
          .attr("fill", team.rank <= 3 ? RED : team.rank <= 7 ? NAVY : LGRAY)
          .attr("font-size", 8.5).attr("font-weight", team.rank <= 3 ? 700 : 400)
          .attr("opacity", 0)
          .text(`#${team.rank} — ${labelOdds}`)
          .transition().delay(900).duration(400).attr("opacity", 1);
      });
    }
  };

  // Scrollama for lottery
  const scroller = scrollama();
  scroller.setup({
    step: "#lottery-steps .step",
    offset: 0.55,
  }).onStepEnter(({ element }) => {
    document.querySelectorAll("#lottery-steps .step").forEach(s => s.classList.remove("is-active"));
    element.classList.add("is-active");
    window._updateLotteryStep(+element.dataset.lotteryStep);
  });

}


// ── Section 3: Pick Value Chart (sticky, Scrollama) ───────────────────────────
// Mobile: player line overlay removed (unreadable at mobile widths)
function initPickValues() {
  const nba = DATA.nba2k_picks;
  if (!nba) return;

  const el = document.getElementById("pick-value-chart");
  const W = Math.min(el.clientWidth || 360, 460), H = 220;
  const m = { top: 24, right: 52, bottom: 36, left: 46 };
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
  // Right y-axis: simulation values
  const yR = d3.scaleLinear().domain([0, 100]).range([ih, 0]);

  // Left axis
  g.append("g").call(d3.axisLeft(yL).ticks(5))
    .selectAll("text").attr("fill", "rgba(255,255,255,0.6)").attr("font-size", 10);
  // Bottom axis — hidden initially, revealed at step 1
  const xAxisG = g.append("g").attr("transform", `translate(0,${ih})`);
  xAxisG.call(d3.axisBottom(x).tickFormat(d => `#${d}`));
  xAxisG.selectAll("text").attr("fill", "rgba(255,255,255,0.6)").attr("font-size", 10).attr("opacity", 0);
  g.selectAll(".domain,.tick line").attr("stroke", "rgba(255,255,255,0.2)");

  // Right axis (sim values — shown at step 6)
  const rightAxisG = g.append("g")
    .attr("transform", `translate(${iw},0)`).attr("opacity", 0);
  rightAxisG.call(d3.axisRight(yR).ticks(5))
    .selectAll("text").attr("fill", "rgba(245,158,11,0.8)").attr("font-size", 9);
  rightAxisG.selectAll(".domain,.tick line").attr("stroke", "rgba(245,158,11,0.3)");

  // Y-axis label
  svg.append("text")
    .attr("transform", `translate(11,${m.top + ih / 2}) rotate(-90)`)
    .attr("text-anchor", "middle")
    .attr("fill", "rgba(255,255,255,0.45)").attr("font-size", 9)
    .text("NBA 2K overall rating");

  // Metrics
  const metricsMap = {
    avg_peak:  nba.avg_peak,
    avg_first: nba.avg_first,
    avg_mean:  nba.avg_mean,
  };
  let currentMetric = "avg_peak";
  let lastHighlight = null;

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

  // Sim values dotted overlay line (hidden initially)
  const simLine = d3.line()
    .x((d, i) => x(i + 1) + x.bandwidth() / 2)
    .y(d => yR(d));

  const simPath = g.append("path")
    .datum(nba.sim_values)
    .attr("fill", "none")
    .attr("stroke", "#f59e0b")
    .attr("stroke-width", 2.5)
    .attr("stroke-dasharray", "5,3")
    .attr("opacity", 0)
    .attr("d", simLine);

  // Sim caption label (appears at step 6)
  const simLabel = g.append("text")
    .attr("x", x(14) + x.bandwidth() / 2)
    .attr("y", yR(3) - 8)
    .attr("text-anchor", "end")
    .attr("fill", "#f59e0b").attr("font-size", 8).attr("opacity", 0)
    .text("Our simulation values");

  // Card swap helper — updates primary card, hides secondary
  function swapCard(cardFile, playerLabel, pickNum) {
    const img = document.getElementById("card-img");
    const nameEl = document.getElementById("card-player-name");
    const badge = document.querySelector("#trading-card .card-badge");
    if (img) { img.src = `../images/player_cards/${cardFile}`; img.style.display = "block"; }
    const ph = document.getElementById("card-placeholder");
    if (ph) ph.style.display = "none";
    if (nameEl) nameEl.textContent = playerLabel;
    if (badge && pickNum !== undefined) badge.textContent = `#${pickNum} PICK`;
    const cardArea = document.getElementById("card-area");
    const card2 = document.getElementById("trading-card-2");
    if (card2) card2.style.display = "none";
    if (cardArea) cardArea.classList.remove("two-cards");
    if (cardArea) cardArea.style.display = "flex";
  }

  // Show two cards side by side (step 5: Bynum + Jefferson)
  function showTwoCards(c1File, c1Label, c1Pick, c2File, c2Label, c2Pick) {
    swapCard(c1File, c1Label, c1Pick);
    const cardArea = document.getElementById("card-area");
    const card2 = document.getElementById("trading-card-2");
    if (!card2) return;
    const img2 = document.getElementById("card-img-2");
    const name2 = document.getElementById("card-player-name-2");
    const badge2 = document.querySelector("#trading-card-2 .card-badge");
    if (img2) { img2.src = `../images/player_cards/${c2File}`; img2.style.display = "block"; }
    const ph2 = document.getElementById("card-placeholder-2");
    if (ph2) ph2.style.display = "none";
    if (name2) name2.textContent = c2Label;
    if (badge2 && c2Pick !== undefined) badge2.textContent = `#${c2Pick} PICK`;
    if (card2) card2.style.display = "block";
    if (cardArea) cardArea.classList.add("two-cards");
  }

  // Initialize with LeBron (step 0 starts here)
  swapCard("lebron.jpg", "LeBron James · 2003", 1);

  // Toggle buttons
  document.querySelectorAll(".chart-toggle-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".chart-toggle-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentMetric = btn.dataset.metric;
      updateBars(currentMetric, lastHighlight);
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

    if (step === 0) {
      // Single LeBron bar — pick 1 only visible
      swapCard("lebron.jpg", "LeBron James · 2003", 1);
      bars.transition().duration(400).attr("opacity", d => d.pick === 1 ? 1 : 0);
      xAxisG.selectAll("text").transition().duration(400).attr("opacity", 0);
      lastHighlight = null;
      updateBars(currentMetric, null);
      simPath.transition().duration(400).attr("opacity", 0);
      rightAxisG.transition().duration(400).attr("opacity", 0);
      simLabel.transition().duration(400).attr("opacity", 0);
      const cardArea = document.getElementById("card-area");
      if (cardArea) cardArea.style.display = "flex";
    } else if (step === 1) {
      // Reveal all 14 bars and x-axis labels
      swapCard("lebron.jpg", "LeBron James · 2003", 1);
      updateBars(currentMetric, null);
      bars.transition().duration(600).delay((d, i) => d.pick === 1 ? 0 : i * 35)
        .attr("opacity", 1);
      xAxisG.selectAll("text").transition().duration(600).delay(300).attr("opacity", 1);
      lastHighlight = null;
    } else if (step === 2) {
      // Hakeem card — no bar highlight, all bars visible
      swapCard("olajuwon.jpg", "Hakeem Olajuwon · 1984", 1);
      updateBars(currentMetric, null); lastHighlight = null;
    } else if (step === 3) {
      // Wembanyama card
      swapCard("wembanyama.jpg", "Victor Wembanyama · 2023", 1);
      updateBars(currentMetric, null); lastHighlight = null;
    } else if (step === 4) {
      // Curry — highlight pick 7 bar
      swapCard("curry.jpg", "Steph Curry · 2009", 7);
      lastHighlight = "curry";
      updateBars(currentMetric, "curry");
    } else if (step === 5) {
      // Bynum + Jefferson side by side
      showTwoCards("bynum.jpg", "Andrew Bynum · 2005", 10, "jefferson.jpg", "Richard Jefferson · 2001", 13);
      lastHighlight = "mid";
      updateBars(currentMetric, "mid");
    } else if (step === 6) {
      // Simulation overlay — hide cards
      const cardArea = document.getElementById("card-area");
      if (cardArea) cardArea.style.display = "none";
      lastHighlight = null;
      updateBars(currentMetric, null);
      simPath.transition().duration(800).attr("opacity", 1);
      rightAxisG.transition().duration(600).attr("opacity", 1);
      simLabel.transition().duration(600).attr("opacity", 1);
    }
  });
}

// ── Section 4: Balance Scale + Two Sliders ────────────────────────────────────
function initBalanceScale() {
  let PLAYOFF_VALUE = 200;
  let TOP_PICK_VALUE = 24;

  const svg = d3.select("#scale-svg");
  const W = 440, H = 340;
  const cx = W / 2, pivotY = 100;
  const armLen = 155;

  // Fulcrum
  svg.append("polygon")
    .attr("points", `${cx},${pivotY + 5} ${cx - 18},${pivotY + 46} ${cx + 18},${pivotY + 46}`)
    .attr("fill", NAVY).attr("opacity", 0.85);

  // Beam
  const beam = svg.append("line")
    .attr("stroke", NAVY).attr("stroke-width", 10)
    .attr("stroke-linecap", "round");

  // Left pan (playoffs)
  const leftG = svg.append("g");
  const leftChain = leftG.append("line").attr("stroke", LGRAY).attr("stroke-width", 2);
  const leftPan = leftG.append("ellipse").attr("rx", 44).attr("ry", 11)
    .attr("fill", "#E8EDF5").attr("stroke", NAVY).attr("stroke-width", 2);
  const leftLabel = leftG.append("text")
    .attr("text-anchor", "middle").attr("fill", NAVY)
    .attr("font-size", 10).attr("font-weight", 600);

  // Right pan (lottery)
  const rightG = svg.append("g");
  const rightChain = rightG.append("line").attr("stroke", LGRAY).attr("stroke-width", 2);
  const rightPan = rightG.append("ellipse").attr("rx", 44).attr("ry", 11)
    .attr("fill", "#E8EDF5").attr("stroke", RED).attr("stroke-width", 2);
  const rightLabel = rightG.append("text")
    .attr("text-anchor", "middle").attr("fill", RED)
    .attr("font-size", 10).attr("font-weight", 600);

  let lastAngle = 0;

  function update(pPct, pickVal) {
    const p = pPct / 100;
    const avgLotteryEV = (pickVal / 100) * 23.9;

    const valueCompete = p * PLAYOFF_VALUE + (1 - p) * avgLotteryEV;
    const valueTank    = p * 0.25 * PLAYOFF_VALUE + (1 - p * 0.25) * (avgLotteryEV * 1.4);
    const tanking      = valueTank > valueCompete;

    const rawAngle = ((valueTank - valueCompete) / PLAYOFF_VALUE) * 90;
    const angle = Math.max(-26, Math.min(26, rawAngle));
    const rad = (angle * Math.PI) / 180;

    const lx = cx - armLen * Math.cos(rad);
    const ly = pivotY - armLen * Math.sin(rad);
    const rx = cx + armLen * Math.cos(rad);
    const ry = pivotY + armLen * Math.sin(rad);
    const chainLen = 38;
    const lpanY = ly + chainLen;
    const rpanY = ry + chainLen;

    // Animate with overshoot if big direction change
    const dAngle = Math.abs(angle - lastAngle);
    const dur = dAngle > 10 ? 600 : 250;
    lastAngle = angle;

    beam.transition().duration(dur)
      .attr("x1", lx).attr("y1", ly).attr("x2", rx).attr("y2", ry);

    leftChain.transition().duration(dur)
      .attr("x1", lx).attr("y1", ly).attr("x2", lx).attr("y2", lpanY);
    leftPan.transition().duration(dur)
      .attr("cx", lx).attr("cy", lpanY)
      .attr("filter", tanking ? null : "url(#glow)");
    leftLabel.transition().duration(dur)
      .attr("x", lx).attr("y", lpanY + 20)
      .text(`Compete: ${valueCompete.toFixed(0)} pts`)
      .attr("fill", tanking ? LGRAY : NAVY);

    rightChain.transition().duration(dur)
      .attr("x1", rx).attr("y1", ry).attr("x2", rx).attr("y2", rpanY);
    rightPan.transition().duration(dur)
      .attr("cx", rx).attr("cy", rpanY)
      .attr("filter", tanking ? "url(#glow)" : null);
    rightLabel.transition().duration(dur)
      .attr("x", rx).attr("y", rpanY + 20)
      .text(`Lottery: ${valueTank.toFixed(0)} pts`)
      .attr("fill", tanking ? RED : LGRAY);

    // EU boxes
    document.getElementById("eu-compete-val").textContent = valueCompete.toFixed(1);
    document.getElementById("eu-tank-val").textContent = valueTank.toFixed(1);
    document.getElementById("eu-compete-box").classList.toggle("winning", !tanking);
    document.getElementById("eu-tank-box").classList.toggle("winning",  tanking);

    // Banner
    const banner = document.getElementById("tipping-banner");
    banner.classList.toggle("tanking",   tanking);
    banner.classList.toggle("competing", !tanking);
    banner.textContent = tanking
      ? `Tank. At ${pPct}% playoff odds, the lottery is worth more.`
      : `Compete. Playoff value (${valueCompete.toFixed(0)} pts) beats the lottery (${valueTank.toFixed(0)} pts).`;

    document.getElementById("prob-display").textContent = `${pPct}%`;
  }

  const probSlider = document.getElementById("prob-slider");
  const pickSlider = document.getElementById("pick-value-slider");

  function getValues() {
    return [+probSlider.value, +pickSlider.value];
  }

  probSlider.addEventListener("input", () => update(...getValues()));
  pickSlider.addEventListener("input", () => {
    const pv = +pickSlider.value;
    const label = pv >= 175 ? "Generational talent"
                : pv >= 130 ? "Strong draft class"
                : "Normal draft year";
    document.getElementById("pick-val-display").textContent = `${label} (pick #1 worth ${pv} pts)`;
    update(...getValues());
  });

  update(...getValues());
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

  // Mobile: tap dot to show tooltip, tap elsewhere to hide
  let tooltipVisible = false;

  if (traj.decisions && traj.decisions.length > 0) {
    dotGroup.selectAll(".decision-dot")
      .data(traj.decisions)
      .join("circle")
      .attr("class", "decision-dot")
      .attr("cx", d => x(d.total_games))
      .attr("cy", d => y(d.rank))
      .attr("r", 8) // slightly larger tap target on mobile
      .attr("fill", d => d.tanking ? RED : "#22c55e")
      .attr("stroke", "white").attr("stroke-width", 2)
      .attr("cursor", "pointer")
      .on("click", function(event, d) {
        event.stopPropagation();
        const decLabel = d.tanking
          ? `<span class="tt-effort tt-tanking">Tank</span>`
          : `<span class="tt-effort tt-competing">Compete</span>`;
        tooltip.innerHTML = `
          <div style="font-size:0.72rem;opacity:0.65;margin-bottom:0.25rem;">Game ${d.total_games} · ${d.wins}W–${d.losses}L · Rank #${d.rank}</div>
          ${decLabel}
          <div style="margin-top:0.3rem;opacity:0.85;font-size:0.78rem;font-style:italic;">${d.reasoning || "No reasoning logged."}</div>`;
        tooltip.classList.add("visible");
        tooltipVisible = true;
        // Position tooltip near top of viewport
        tooltip.style.left = "1rem";
        tooltip.style.top = "1rem";
        tooltip.style.maxWidth = "calc(100vw - 2rem)";
      });

    // Tap elsewhere to dismiss
    document.addEventListener("click", () => {
      if (tooltipVisible) {
        tooltip.classList.remove("visible");
        tooltipVisible = false;
      }
    });
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

    // Populate reasoning quote in step panel
    const quoteEl = document.getElementById(`traj-quote-${fi + 1}`);
    if (quoteEl) {
      const decisionBadge = fd.tanking
        ? `<span class="tt-effort tt-tanking" style="display:inline-block;padding:0.15rem 0.6rem;border-radius:4px;background:rgba(200,16,46,0.12);margin-bottom:0.5rem;">Tank</span>`
        : `<span class="tt-effort tt-competing" style="display:inline-block;padding:0.15rem 0.6rem;border-radius:4px;background:rgba(34,197,94,0.12);margin-bottom:0.5rem;">Compete</span>`;
      const playoffOdds = fd.rank <= 15 ? Math.max(0, Math.round((16 - fd.rank) * 7)) : 0;
      const summary = fd.tanking
        ? `Playoff odds ≈ ${playoffOdds}%. The lottery was worth more.`
        : `Still ${playoffOdds}% to reach the playoffs. Worth competing.`;
      quoteEl.innerHTML = `
        <div style="font-size:0.75rem;color:#888;margin-bottom:0.4rem;">Game ${fd.total_games} · ${fd.wins}W–${fd.losses}L · Rank #${fd.rank}</div>
        ${decisionBadge}
        <div style="font-size:0.82rem;color:#555;margin-bottom:0.5rem;">${summary}</div>
        <div style="font-size:0.8rem;line-height:1.5;color:#444;font-style:italic;">"${fd.reasoning || "No reasoning available."}"</div>`;
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

// ── Section 6: Reform Explorer ─────────────────────────────────────────────────
function initReformExplorer() {
  const tabs = document.querySelectorAll(".reform-tab");
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
    });
  });

  drawReformNBA();
  drawReformBilevel();
  drawReformCOLA();
  drawReformWL();
  drawReform321();
}

function svgReform(id) {
  const svg = d3.select(`#${id}`);
  svg.selectAll("*").remove();
  return svg;
}

function drawReformNBA() {
  const svg = svgReform("reform-diagram-nba");
  const W = 380, H = 260;
  const m = { top: 20, right: 20, bottom: 35, left: 48 };
  const iw = W - m.left - m.right, ih = H - m.top - m.bottom;
  const g = svg.append("g").attr("transform", `translate(${m.left},${m.top})`);

  const data = NBA_ODDS_PCT.map((p, i) => ({ rank: i + 1, pct: +p }));
  const x = d3.scaleBand().domain(data.map(d => d.rank)).range([0, iw]).padding(0.15);
  const y = d3.scaleLinear().domain([0, 16]).range([ih, 0]);

  g.append("g").attr("transform", `translate(0,${ih})`)
    .call(d3.axisBottom(x).tickFormat(d => `#${d}`))
    .selectAll("text").attr("fill", "rgba(255,255,255,0.5)").attr("font-size", 9);
  g.append("g").call(d3.axisLeft(y).ticks(4).tickFormat(d => `${d}%`))
    .selectAll("text").attr("fill", "rgba(255,255,255,0.5)").attr("font-size", 9);
  g.selectAll(".domain,.tick line").attr("stroke", "rgba(255,255,255,0.15)");

  g.selectAll("rect").data(data).join("rect")
    .attr("x", d => x(d.rank)).attr("y", d => y(d.pct))
    .attr("width", x.bandwidth()).attr("height", d => ih - y(d.pct))
    .attr("fill", d => d.rank <= 3 ? RED : d.rank <= 7 ? NAVY : "#666").attr("rx", 2);

  g.append("line")
    .attr("x1", x(1)).attr("y1", y(14))
    .attr("x2", x(3) + x.bandwidth()).attr("y2", y(14))
    .attr("stroke", "rgba(255,255,255,0.6)").attr("stroke-dasharray", "4,2").attr("stroke-width", 1.5);
  g.append("text")
    .attr("x", x(2) + x.bandwidth() / 2).attr("y", y(14) - 6)
    .attr("text-anchor", "middle").attr("fill", "rgba(255,255,255,0.7)").attr("font-size", 9)
    .text("14% flat zone");
}

function drawReformBilevel() {
  const svg = svgReform("reform-diagram-bilevel");
  const W = 380, H = 200;
  const m = { top: 30, right: 20, bottom: 20, left: 20 };
  const iw = W - m.left - m.right, ih = H - m.top - m.bottom;
  const g = svg.append("g").attr("transform", `translate(${m.left},${m.top})`);

  const barH = 28, barY = ih / 2 - barH / 2;
  const lockX = iw * (70 / 82);

  const defs = svg.append("defs");
  const grad = defs.append("linearGradient").attr("id", "bilevel-grad");
  grad.append("stop").attr("offset", "0%").attr("stop-color", "#2196F3").attr("stop-opacity", 0.7);
  grad.append("stop").attr("offset", "100%").attr("stop-color", "#2196F3").attr("stop-opacity", 0.9);

  g.append("rect").attr("x", 0).attr("y", barY)
    .attr("width", lockX).attr("height", barH)
    .attr("fill", "url(#bilevel-grad)").attr("rx", 4);
  g.append("rect").attr("x", lockX).attr("y", barY)
    .attr("width", iw - lockX).attr("height", barH)
    .attr("fill", "rgba(255,255,255,0.1)").attr("rx", 4);

  // Lock line
  g.append("line")
    .attr("x1", lockX).attr("y1", barY - 32)
    .attr("x2", lockX).attr("y2", barY + barH + 8)
    .attr("stroke", RED).attr("stroke-width", 2.5).attr("stroke-dasharray", "5,3");

  // Zone labels
  g.append("text")
    .attr("x", lockX / 2).attr("y", barY - 10)
    .attr("text-anchor", "middle").attr("fill", "#2196F3").attr("font-size", 10).attr("font-weight", 700)
    .text("Tanking can improve lottery position");

  g.append("text")
    .attr("x", lockX + 4).attr("y", barY - 20)
    .attr("text-anchor", "start").attr("fill", "rgba(255,255,255,0.5)").attr("font-size", 8.5)
    .text("No lottery");
  g.append("text")
    .attr("x", lockX + 4).attr("y", barY - 9)
    .attr("text-anchor", "start").attr("fill", "rgba(255,255,255,0.5)").attr("font-size", 8.5)
    .text("benefit");

  // Game labels
  const labelY = barY + barH + 18;
  g.append("text").attr("x", 0).attr("y", labelY)
    .attr("fill", "rgba(255,255,255,0.4)").attr("font-size", 9).text("Game 1");
  g.append("text").attr("x", lockX).attr("y", barY - 36)
    .attr("text-anchor", "middle").attr("fill", RED).attr("font-size", 9).attr("font-weight", 700)
    .text("Game 70 — lock");
  g.append("text").attr("x", iw).attr("y", labelY)
    .attr("text-anchor", "end").attr("fill", "rgba(255,255,255,0.4)").attr("font-size", 9).text("Game 82");
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
    .text("Win pick #N: spend N tickets. Here: win pick #3 in year 3 — spend all 3 tickets.");

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
  const grad = defs.append("linearGradient").attr("id", "wl-grad").attr("x1", "0").attr("x2", "1");
  grad.append("stop").attr("offset", "0%").attr("stop-color", "#FF9800").attr("stop-opacity", 0.7);
  grad.append("stop").attr("offset", "100%").attr("stop-color", "#FF9800").attr("stop-opacity", 0.1);

  const area = d3.area().x(d => x(d.game)).y0(ih).y1(d => y(d.w)).curve(d3.curveBasis);
  g.append("path").datum(areaData).attr("fill", "url(#wl-grad)").attr("d", area);

  const line = d3.line().x(d => x(d.game)).y(d => y(d.w)).curve(d3.curveBasis);
  g.append("path").datum(areaData)
    .attr("fill", "none").attr("stroke", "#FF9800").attr("stroke-width", 2.5).attr("d", line);

  [20, 40, 60].forEach(game => {
    const w = Math.pow(0.5, game / 20);
    g.append("line")
      .attr("x1", x(game)).attr("y1", ih)
      .attr("x2", x(game)).attr("y2", y(w))
      .attr("stroke", "rgba(255,255,255,0.3)").attr("stroke-dasharray", "3,3");
    g.append("text")
      .attr("x", x(game)).attr("y", y(w) - 8)
      .attr("text-anchor", "middle").attr("fill", "rgba(255,255,255,0.6)").attr("font-size", 9)
      .text(`${(w * 100).toFixed(0)}%`);
  });

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
}

function drawReform321() {
  const svg = svgReform("reform-diagram-321");
  const W = 380, H = 240;
  const g = svg.append("g").attr("transform", "translate(20,20)");
  const colW = 160, gap = 20;

  // Tier A
  g.append("rect").attr("x", 0).attr("y", 0).attr("width", colW).attr("height", 180)
    .attr("fill", "rgba(255,255,255,0.04)").attr("rx", 8);
  g.append("text").attr("x", colW / 2).attr("y", 24)
    .attr("text-anchor", "middle").attr("fill", RED).attr("font-size", 12).attr("font-weight", 700)
    .text("Tier A: Worst 3");
  g.append("text").attr("x", colW / 2).attr("y", 42)
    .attr("text-anchor", "middle").attr("fill", "rgba(255,255,255,0.5)").attr("font-size", 9)
    .text("2 lottery balls each");
  [0, 1].forEach(i => {
    g.append("circle").attr("cx", colW / 2 - 22 + i * 44).attr("cy", 110).attr("r", 22)
      .attr("fill", RED).attr("opacity", 0.8);
    g.append("text").attr("x", colW / 2 - 22 + i * 44).attr("y", 115)
      .attr("text-anchor", "middle").attr("fill", "white").attr("font-size", 14).attr("font-weight", 700)
      .text("2");
  });
  g.append("text").attr("x", colW / 2).attr("y", 152)
    .attr("text-anchor", "middle").attr("fill", "rgba(255,255,255,0.4)").attr("font-size", 9)
    .text("5.1% odds at pick #1");
  g.append("text").attr("x", colW / 2).attr("y", 200)
    .attr("text-anchor", "middle").attr("fill", RED).attr("font-size", 10).attr("font-weight", 700)
    .text("Fewer balls → worse odds");

  // Tier B
  const bx = colW + gap;
  g.append("rect").attr("x", bx).attr("y", 0).attr("width", colW).attr("height", 180)
    .attr("fill", "rgba(255,255,255,0.04)").attr("rx", 8);
  g.append("text").attr("x", bx + colW / 2).attr("y", 24)
    .attr("text-anchor", "middle").attr("fill", "#9C27B0").attr("font-size", 12).attr("font-weight", 700)
    .text("Tier B: 4th-14th");
  g.append("text").attr("x", bx + colW / 2).attr("y", 42)
    .attr("text-anchor", "middle").attr("fill", "rgba(255,255,255,0.5)").attr("font-size", 9)
    .text("3 lottery balls each");
  [-1, 0, 1].forEach(i => {
    g.append("circle").attr("cx", bx + colW / 2 + i * 36).attr("cy", 110).attr("r", 18)
      .attr("fill", "#9C27B0").attr("opacity", 0.8);
    g.append("text").attr("x", bx + colW / 2 + i * 36).attr("y", 115)
      .attr("text-anchor", "middle").attr("fill", "white").attr("font-size", 13).attr("font-weight", 700)
      .text("3");
  });
  g.append("text").attr("x", bx + colW / 2).attr("y", 152)
    .attr("text-anchor", "middle").attr("fill", "rgba(255,255,255,0.4)").attr("font-size", 9)
    .text("7.7% odds at pick #1");
  g.append("text").attr("x", bx + colW / 2).attr("y", 200)
    .attr("text-anchor", "middle").attr("fill", "#9C27B0").attr("font-size", 10).attr("font-weight", 700)
    .text("More balls → better odds");

  svg.append("text").attr("x", (colW * 2 + gap + 40) / 2).attr("y", 234)
    .attr("text-anchor", "middle").attr("fill", "rgba(255,255,255,0.6)").attr("font-size", 10)
    .text("Teams near the boundary compete to stay in Tier B");
}

// ── Section 7: Tanking Rate Scrollytelling ────────────────────────────────────
function initTankingRateScroll() {
  const tr = DATA.tanking_rates;
  if (!tr) return;

  const mechs = tr.mechanisms;
  const W = 480, H = 500;
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
        const val = tr[key][mechs.indexOf(mech)];
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

  // Tau dot plot (static)
  {
    const el = document.getElementById("tau-chart");
    const W = el.clientWidth || 360, H = 240;
    const svg = d3.select("#tau-chart")
      .append("svg").attr("viewBox", `0 0 ${W} ${H}`).attr("width", "100%").attr("height", H);
    const m = { top: 20, right: 20, bottom: 50, left: 55 };
    const iw = W - m.left - m.right, ih = H - m.top - m.bottom;
    const g = svg.append("g").attr("transform", `translate(${m.left},${m.top})`);

    const allVals = [...tau.rational_tau, ...tau.honest_tau];
    const extent = [d3.min(allVals) * 0.997, d3.max(allVals) * 1.003];
    const y = d3.scaleLinear().domain(extent).range([ih, 0]);
    const x = d3.scaleBand().domain(tau.mechanisms).range([0, iw]).padding(0.3);

    g.append("g").attr("transform", `translate(0,${ih})`)
      .call(d3.axisBottom(x).tickFormat(d => MECH_LABELS[d]))
      .selectAll("text").attr("fill", GRAY).attr("font-size", 9)
      .attr("transform", "rotate(-15)").attr("text-anchor", "end");
    g.append("g").call(d3.axisLeft(y).ticks(4).tickFormat(d3.format(".3f")))
      .selectAll("text").attr("fill", GRAY).attr("font-size", 10);
    g.selectAll(".domain,.tick line").attr("stroke", "#eee");

    tau.mechanisms.forEach((m2, i) => {
      const col = COLORS[m2];
      g.append("circle")
        .attr("cx", x(m2) + x.bandwidth() / 2).attr("cy", y(tau.rational_tau[i]))
        .attr("r", 9).attr("fill", col).attr("opacity", 0.85);
      g.append("text")
        .attr("x", x(m2) + x.bandwidth() / 2).attr("y", y(tau.rational_tau[i]) - 13)
        .attr("text-anchor", "middle").attr("fill", GRAY).attr("font-size", 10).attr("font-weight", 600)
        .text(tau.rational_tau[i].toFixed(3));
    });

    svg.append("text")
      .attr("transform", `translate(14,${m.top + ih / 2}) rotate(-90)`)
      .attr("text-anchor", "middle").attr("fill", GRAY).attr("font-size", 9)
      .text("Score (lower = better)");
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

    effY = d3.scaleBand().domain(eff.mechanisms).range([0, effIh]).padding(0.2);
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
    eff.mechanisms.forEach((m2, i) => {
      const val = data[i];
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
      if (explainerEl) explainerEl.textContent = "COLA rewards history, not this year's record. A team that was great for years and just fell apart this season hasn't accumulated many tickets yet. They could be the worst team in the league but still sit at the back of the lottery queue, behind franchises that have been bad longer. COLA struggles to quickly adapt to new information about which teams need help the most.";
    } else {
      if (titleEl) titleEl.textContent = "Average draft pick for the 8 weakest teams";
      if (explainerEl) explainerEl.textContent = "Lower is better: weak teams get earlier picks.";
    }
  });
}

// ── Section 9: LLM Chart (Scrollama) ─────────────────────────────────────────
function initLLMChart() {
  const llm = DATA.llm_by_mechanism;
  if (!llm) return;

  const mechs = llm.mechanisms;
  const W = 480, H = 500;
  const svg = d3.select("#llm-chart").attr("viewBox", `0 0 ${W} ${H}`);
  const m = { top: 40, right: 20, bottom: 60, left: 90 };
  const iw = W - m.left - m.right, ih = H - m.top - m.bottom;
  const g = svg.append("g").attr("transform", `translate(${m.left},${m.top})`);

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
  [{ k: "rational", c: NAVY, l: "Strategic teams" }, { k: "llm", c: "#6366f1", l: "AI (Claude Haiku)" }]
    .forEach(({ k, c, l }, i) => {
      legend.append("rect").attr("x", i * 170).attr("y", -8).attr("width", 12).attr("height", 12)
        .attr("fill", c).attr("rx", 2);
      legend.append("text").attr("x", i * 170 + 16).attr("y", 2).attr("fill", GRAY).attr("font-size", 11)
        .text(l);
    });

  let revealed = new Set();

  function updateLLM(activeMech) {
    revealed.add(activeMech);
    mechs.forEach((mech, mi) => {
      const isRevealed = revealed.has(mech);
      const isActive   = mech === activeMech;
      mechLabels.filter(d => d === mech).transition().duration(400)
        .attr("fill", isActive ? NAVY : isRevealed ? GRAY : LGRAY)
        .attr("font-weight", isActive ? 700 : 400);

      [{ key: "rational", color: COLORS[mech], offset: -14 },
       { key: "llm",      color: "#6366f1",    offset: 14  }]
        .forEach(({ key, color, offset }) => {
          const val = llm[key][mi];
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
  initTrajectory();
  initReformExplorer();
  initTankingRateScroll();
  initFairness();
  initLLMChart();
}

main();
