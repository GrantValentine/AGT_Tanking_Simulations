"""
Export aggregated data from tanking_sim.db to JSON files for the visual essay.
Run: python export_essay_data.py
Output: essay/data/*.json
"""

import json
import math
import sqlite3
from pathlib import Path

DB_PATH = Path("tanking_sim.db")
OUT_DIR = Path("essay/data")
OUT_DIR.mkdir(parents=True, exist_ok=True)

# ── Run IDs ────────────────────────────────────────────────────────────────────

RATIONAL_RUNS = {
    "nba_lottery":            "nba_lottery_rational_8c11ac3f",
    "bilevel":                "bilevel_rational_3feb71d2",
    "cola":                   "cola_rational_2d65e52d",
    "weighted_loss_exp_hl20": "weighted_loss_exp_hl20_rational_58f128e9",
    "nba_321_lottery":        "nba_321_lottery_rational_67a0392d",
}
HONEST_RUNS = {
    "nba_lottery":            "nba_lottery_honest_f9f55233",
    "bilevel":                "bilevel_honest_192a6c28",
    "cola":                   "cola_honest_2d85b14f",
    "weighted_loss_exp_hl20": "weighted_loss_exp_hl20_honest_9ca2e02f",
    "nba_321_lottery":        "nba_321_lottery_honest_a7d23d4d",
}
LLM_RUNS = {
    "nba_lottery":            "nba_lottery_llm5_f10ee203",
    "bilevel":                "bilevel_llm5_2edfce68",
    "cola":                   "cola_llm5_820a1b5a",
    "weighted_loss_exp_hl20": "weighted_loss_exp_hl20_llm5_76e463d6",
    "nba_321_lottery":        "nba_321_lottery_llm5_8666d8df",
}
MIXED_RUNS = {
    0:  "nba_lottery_mixed_0rational_1e0c57",
    1:  "nba_lottery_mixed_1rational_a9d7ab",
    5:  "nba_lottery_mixed_5rational_1de479",
    15: "nba_lottery_mixed_15rational_e4d95b",
    30: "nba_lottery_mixed_30rational_f8fef1",
}
PV_RUNS = {
    50:  "nba_lottery_pv50_5c9351",
    100: "nba_lottery_pv100_8955c9",
    150: "nba_lottery_pv150_5e65d4",
    200: "nba_lottery_pv200_9f4ccc",
    300: "nba_lottery_pv300_1a46d7",
}

MECH_ORDER = ["nba_lottery", "bilevel", "cola", "weighted_loss_exp_hl20", "nba_321_lottery"]
MECH_LABELS = {
    "nba_lottery":            "NBA Lottery",
    "bilevel":                "Bilevel",
    "cola":                   "COLA",
    "weighted_loss_exp_hl20": "Weighted Loss",
    "nba_321_lottery":        "NBA 3-2-1",
}

PICK_VALUES = {1:100, 2:65, 3:45, 4:30, 5:22, 6:17, 7:13, 8:10, 9:8, 10:7, 11:6, 12:5, 13:4, 14:3}


# ── Helpers ────────────────────────────────────────────────────────────────────

def tanking_rate(conn: sqlite3.Connection, run_id: str) -> float:
    row = conn.execute(
        "SELECT AVG(CASE WHEN effort_chosen < 0.5 THEN 1.0 ELSE 0.0 END) "
        "FROM agent_decisions WHERE run_id=?",
        (run_id,)
    ).fetchone()
    return round(row[0] or 0.0, 4)


def kendall_tau(order_a: list, order_b: list) -> float:
    n = len(order_a)
    pos_b = {v: i for i, v in enumerate(order_b)}
    discordant = sum(
        1 for i in range(n) for j in range(i+1, n)
        if pos_b[order_a[i]] > pos_b[order_a[j]]
    )
    pairs = n * (n - 1) // 2
    return discordant / pairs if pairs else 0.0


def avg_tau(conn: sqlite3.Connection, run_id: str) -> float:
    seasons = [r[0] for r in conn.execute(
        "SELECT DISTINCT season FROM skill_history WHERE run_id=? ORDER BY season",
        (run_id,)
    ).fetchall()]
    taus = []
    for season in seasons:
        skills = conn.execute(
            "SELECT team_id, true_skill FROM skill_history WHERE run_id=? AND season=?",
            (run_id, season)
        ).fetchall()
        wins = conn.execute(
            "SELECT team_id, final_rank FROM draft_results WHERE run_id=? AND season=? ORDER BY final_rank",
            (run_id, season)
        ).fetchall()
        if not skills or not wins:
            continue
        true_order = [r[0] for r in sorted(skills, key=lambda r: r[1], reverse=True)]
        wins_order = [r[0] for r in wins]
        taus.append(kendall_tau(true_order, wins_order))
    return round(sum(taus) / len(taus), 4) if taus else float("nan")


def draft_efficiency(conn: sqlite3.Connection, run_id: str) -> dict:
    """Avg draft pick for bottom skill quartile and bottom 3 teams."""
    seasons = [r[0] for r in conn.execute(
        "SELECT DISTINCT season FROM skill_history WHERE run_id=? ORDER BY season",
        (run_id,)
    ).fetchall()]
    q1_picks, b3_picks = [], []
    for season in seasons:
        skills = conn.execute(
            "SELECT team_id, true_skill FROM skill_history WHERE run_id=? AND season=?",
            (run_id, season)
        ).fetchall()
        # Only count lottery picks (non-playoff teams, picks 1-14)
        picks_map = {r[0]: r[1] for r in conn.execute(
            "SELECT team_id, draft_pick FROM draft_results WHERE run_id=? AND season=? AND made_playoffs=0",
            (run_id, season)
        ).fetchall()}
        if not skills or not picks_map:
            continue
        sorted_by_skill = sorted(skills, key=lambda r: r[1])  # worst skill first
        n = len(sorted_by_skill)
        n_q1 = max(1, n // 4)
        for tid, _ in sorted_by_skill[:n_q1]:
            if tid in picks_map:
                q1_picks.append(picks_map[tid])
        for tid, _ in sorted_by_skill[:3]:
            if tid in picks_map:
                b3_picks.append(picks_map[tid])
    return {
        "bottom_quartile": round(sum(q1_picks)/len(q1_picks), 2) if q1_picks else None,
        "bottom_3":        round(sum(b3_picks)/len(b3_picks), 2)  if b3_picks else None,
    }


# ── Exporters ──────────────────────────────────────────────────────────────────

def export_pick_values():
    out = {
        "picks":  list(PICK_VALUES.keys()),
        "values": list(PICK_VALUES.values()),
        "avg_lottery_ev": round(sum(PICK_VALUES.values()) / len(PICK_VALUES), 1),
    }
    (OUT_DIR / "pick_values.json").write_text(json.dumps(out, indent=2))
    print("[ok] pick_values.json")


def export_tanking_rates(conn):
    out = {
        "mechanisms": MECH_ORDER,
        "labels":     [MECH_LABELS[m] for m in MECH_ORDER],
        "rational":   [tanking_rate(conn, RATIONAL_RUNS[m]) for m in MECH_ORDER],
        "honest":     [tanking_rate(conn, HONEST_RUNS[m])   for m in MECH_ORDER],
        "llm":        [tanking_rate(conn, LLM_RUNS[m])      for m in MECH_ORDER],
    }
    (OUT_DIR / "tanking_rates.json").write_text(json.dumps(out, indent=2))
    print("[ok] tanking_rates.json  rational:", out["rational"])


def export_tau_distances(conn):
    out = {
        "mechanisms":   MECH_ORDER,
        "labels":       [MECH_LABELS[m] for m in MECH_ORDER],
        "rational_tau": [avg_tau(conn, RATIONAL_RUNS[m]) for m in MECH_ORDER],
        "honest_tau":   [avg_tau(conn, HONEST_RUNS[m])   for m in MECH_ORDER],
    }
    (OUT_DIR / "tau_distances.json").write_text(json.dumps(out, indent=2))
    print("[ok] tau_distances.json  rational:", out["rational_tau"])


def export_draft_efficiency_data(conn):
    out = {"mechanisms": MECH_ORDER, "labels": [MECH_LABELS[m] for m in MECH_ORDER]}
    for key in ("bottom_quartile", "bottom_3"):
        out[key] = [draft_efficiency(conn, RATIONAL_RUNS[m])[key] for m in MECH_ORDER]
    (OUT_DIR / "draft_efficiency.json").write_text(json.dumps(out, indent=2))
    print("[ok] draft_efficiency.json  bottom_q:", out["bottom_quartile"])


def export_mixed_sweep(conn):
    ns = sorted(MIXED_RUNS.keys())
    out = {
        "n_rational":   ns,
        "tanking_rates": [tanking_rate(conn, MIXED_RUNS[n]) for n in ns],
    }
    (OUT_DIR / "mixed_sweep.json").write_text(json.dumps(out, indent=2))
    print("[ok] mixed_sweep.json", out["tanking_rates"])


def export_pv_sweep(conn):
    vs = sorted(PV_RUNS.keys())
    out = {
        "playoff_values": vs,
        "tanking_rates":  [tanking_rate(conn, PV_RUNS[v]) for v in vs],
    }
    (OUT_DIR / "playoff_value_sweep.json").write_text(json.dumps(out, indent=2))
    print("[ok] playoff_value_sweep.json", out["tanking_rates"])


def export_llm_by_mechanism(conn):
    out = {
        "mechanisms": MECH_ORDER,
        "labels":     [MECH_LABELS[m] for m in MECH_ORDER],
        "rational":   [tanking_rate(conn, RATIONAL_RUNS[m]) for m in MECH_ORDER],
        "llm":        [tanking_rate(conn, LLM_RUNS[m])      for m in MECH_ORDER],
    }
    (OUT_DIR / "llm_by_mechanism.json").write_text(json.dumps(out, indent=2))
    print("[ok] llm_by_mechanism.json  llm:", out["llm"])


def export_season_trajectory(conn):
    """Find a team in the NBA lottery rational run that starts competitive,
    falls into lottery range, and makes tanking decisions late-season."""
    run_id = RATIONAL_RUNS["nba_lottery"]

    # Find team+season with: first checkpoint effort=1, later checkpoint effort=0
    # and at least 3 tanking decisions
    candidates = conn.execute("""
        SELECT team_id, season, COUNT(*) as n_tank
        FROM agent_decisions
        WHERE run_id=? AND effort_chosen < 0.5
        GROUP BY team_id, season
        HAVING n_tank >= 3
        ORDER BY n_tank DESC
        LIMIT 20
    """, (run_id,)).fetchall()

    best = None
    best_score = -1

    for team_id, season, n_tank in candidates:
        decisions = conn.execute("""
            SELECT games_completed, effort_chosen, reasoning
            FROM agent_decisions
            WHERE run_id=? AND team_id=? AND season=?
            ORDER BY games_completed
        """, (run_id, team_id, season)).fetchall()

        if not decisions:
            continue

        # Score: prefer teams that started with high effort then switched to tanking
        first_effort = decisions[0][1]
        last_effort  = decisions[-1][1]
        if first_effort >= 0.75 and last_effort < 0.5:
            score = n_tank + (1 if first_effort == 1.0 else 0)
            if score > best_score:
                best_score = score
                best = (team_id, season)

    if best is None and candidates:
        best = (candidates[0][0], candidates[0][1])

    if best is None:
        print("[warn] No good trajectory team found — writing empty season_trajectory.json")
        (OUT_DIR / "season_trajectory.json").write_text(json.dumps({}))
        return

    team_id, season = best

    # Get team name
    team_name = conn.execute(
        "SELECT name FROM teams WHERE run_id=? AND team_id=?", (run_id, team_id)
    ).fetchone()
    team_name = team_name[0] if team_name else f"Team {team_id}"

    # Get standings snapshots (rank over time)
    snaps = conn.execute("""
        SELECT after_game, rank, wins, losses
        FROM standings_snapshots
        WHERE run_id=? AND season=? AND team_id=?
        ORDER BY after_game
    """, (run_id, season, team_id)).fetchall()

    # Get decisions with reasoning — deduplicate by games_completed,
    # keeping the last decision in each per-team-game block
    raw_decisions = conn.execute("""
        SELECT games_completed, effort_chosen, reasoning, wins, losses, rank
        FROM agent_decisions
        WHERE run_id=? AND team_id=? AND season=?
        ORDER BY games_completed, checkpoint
    """, (run_id, team_id, season)).fetchall()

    # Keep one decision per unique games_completed (the last one in that block)
    seen = {}
    for row in raw_decisions:
        seen[row[0]] = row
    decisions = list(seen.values())

    # Deduplicate snapshots too
    snap_seen = {}
    for row in snaps:
        snap_seen[row[0]] = row
    snaps = list(snap_seen.values())

    # Build decision list using wins+losses as shared x-axis
    dec_list = [
        {
            "games_completed": r[0],
            "total_games":     r[3] + r[4],   # wins + losses = common x-axis
            "effort":          round(r[1], 2),
            "reasoning":       r[2][:400] if r[2] else "",
            "wins":            r[3],
            "losses":          r[4],
            "rank":            r[5],
            "tanking":         r[1] < 0.5,
        }
        for r in decisions
    ]

    # Featured decisions: pick the ones closest to 25%, 50%, 75% of the season
    def closest_to(target_game, dec_list):
        return min(dec_list, key=lambda d: abs(d["total_games"] - target_game))

    max_games = max(d["total_games"] for d in dec_list) if dec_list else 82
    featured = [
        closest_to(round(max_games * 0.25), dec_list),
        closest_to(round(max_games * 0.50), dec_list),
        closest_to(round(max_games * 0.75), dec_list),
    ]

    out = {
        "team_name":         team_name,
        "season":            season,
        "snapshots": [
            {"rank": r[1], "wins": r[2], "losses": r[3],
             "total_games": r[2] + r[3]}
            for r in snaps
        ],
        "decisions":         dec_list,
        "featured_decisions": featured,
    }

    (OUT_DIR / "season_trajectory.json").write_text(
        json.dumps(out, indent=2, ensure_ascii=False)
    )
    print(f"[ok] season_trajectory.json  team={team_name}, season={season}, "
          f"decisions={len(decisions)}, snapshots={len(snaps)}, "
          f"featured at games {[f['total_games'] for f in featured]}")


def export_nba2k_picks():
    import csv

    CSV_PATH = Path("data/NBA2K/nba_draft_2k_ratings.csv")

    KEY_PLAYER_CARDS = {
        (2003, 1):  "lebron.jpg",
        (2023, 1):  "wembanyama.jpg",
        (2012, 1):  "davis.jpg",
        (2015, 1):  "towns.jpg",
        (2009, 7):  "curry.jpg",
        (2005, 10): "bynum.jpg",
        (2001, 13): "jefferson.jpg",
    }

    def parse_version(v):
        try:
            return int(v.replace("NBA 2K", "").strip())
        except ValueError:
            return 0

    # Group rows by (Updated draft year, Updated draft pick) -> player with list of (version, rating)
    players = {}
    with open(CSV_PATH, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            if int(row["draft_round"]) != 1 or int(row["Updated draft pick"]) > 14:
                continue
            key = (int(row["Updated draft year"]), int(row["Updated draft pick"]))
            if key not in players:
                players[key] = {"name": row["player_name"], "ratings": []}
            players[key]["ratings"].append((parse_version(row["nba2k_version"]), int(row["overall_rating"])))

    # Per-player stats
    player_stats = {}
    for (year, pick), info in players.items():
        ratings = sorted(info["ratings"], key=lambda x: x[0])
        vals = [r for _, r in ratings]
        player_stats[(year, pick)] = {
            "name":  info["name"],
            "peak":  max(vals),
            "first": ratings[0][1],
            "avg":   round(sum(vals) / len(vals), 1),
        }

    # Aggregate by pick position 1-14
    picks = list(range(1, 15))
    buckets = {p: {"peaks": [], "firsts": [], "avgs": []} for p in picks}
    for (year, pick), s in player_stats.items():
        if pick in buckets:
            buckets[pick]["peaks"].append(s["peak"])
            buckets[pick]["firsts"].append(s["first"])
            buckets[pick]["avgs"].append(s["avg"])

    def safe_avg(lst):
        return round(sum(lst) / len(lst), 1) if lst else None

    avg_peak  = [safe_avg(buckets[p]["peaks"])  for p in picks]
    avg_first = [safe_avg(buckets[p]["firsts"]) for p in picks]
    avg_mean  = [safe_avg(buckets[p]["avgs"])   for p in picks]

    # Key players
    key_players = []
    for (year, pick), card in KEY_PLAYER_CARDS.items():
        if (year, pick) in player_stats:
            s = player_stats[(year, pick)]
            key_players.append({
                "pick": pick, "year": year, "name": s["name"],
                "peak_rating": s["peak"], "first_rating": s["first"],
                "card": card,
            })
    key_players.sort(key=lambda x: (x["pick"], x["year"]))

    # Hakeem hardcoded (pre-dates dataset)
    key_players.insert(0, {
        "pick": 1, "year": 1984, "name": "Hakeem Olajuwon",
        "peak_rating": None, "first_rating": None,
        "card": "olajuwon.jpg", "note": "1984 — 2x NBA Champion",
    })

    out = {
        "picks":      picks,
        "avg_peak":   avg_peak,
        "avg_first":  avg_first,
        "avg_mean":   avg_mean,
        "sim_values": [100, 65, 45, 30, 22, 17, 13, 10, 8, 7, 6, 5, 4, 3],
        "key_players": key_players,
    }
    (OUT_DIR / "nba2k_picks.json").write_text(json.dumps(out, indent=2))
    print(f"[ok] nba2k_picks.json  avg_peak picks 1-5: {avg_peak[:5]}")


# ── Main ───────────────────────────────────────────────────────────────────────

def main():
    print(f"Connecting to {DB_PATH} ...")
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    export_pick_values()
    export_tanking_rates(conn)
    export_tau_distances(conn)
    export_draft_efficiency_data(conn)
    export_mixed_sweep(conn)
    export_pv_sweep(conn)
    export_llm_by_mechanism(conn)
    export_season_trajectory(conn)
    export_nba2k_picks()

    conn.close()
    print(f"\nAll files written to {OUT_DIR}/")


if __name__ == "__main__":
    main()
