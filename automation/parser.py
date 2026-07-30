import pdfplumber
import re
import sys

NAME_FIXES = {
    "Haidet": "Haider",
    "Arooj": "Urooj",
    "Umer": "Omer",
}

def fix_name(name):
    return NAME_FIXES.get(name, name)

def parse_match(pdf_path):
    with pdfplumber.open(pdf_path) as pdf:
        full_text = ""
        for page in pdf.pages:
            full_text += page.extract_text() + "\n"

    lines = full_text.split("\n")

    batting = []
    bowling = {}
    team_totals = {}  # "Team H" -> total runs, "Team T" -> total runs

    current_team = None

    for line in lines:
        line = line.strip()

        if "1st Innings (Batting)" in line:
            if "Team H" in line:
                current_team = "Team H"
            elif "Team T" in line:
                current_team = "Team T"
            continue

        # capture total runs: "Total 2 wickets, 0.3 overs 4"
        total_match = re.match(r"^Total\s+\d+\s+wickets?,\s+[\d.]+\s+overs\s+(\d+)$", line)
        if total_match and current_team:
            team_totals[current_team] = int(total_match.group(1))
            continue

        if line.startswith("Name R B") or line.startswith("Extras") or line.startswith("Total") or line.startswith("Fall of Wickets"):
            continue

        did_not_bat_match = re.match(r"^([A-Za-z]+) did not bat$", line)
        if did_not_bat_match:
            name = fix_name(did_not_bat_match.group(1))
            batting.append({"name": name, "runs": 0, "out": False, "played": False, "team": current_team})
            continue

        batting_match = re.match(r"^([A-Za-z]+)\s+(.*?)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+([\d.]+)$", line)
        if batting_match and current_team:
            name = fix_name(batting_match.group(1))
            dismissal_text = batting_match.group(2)
            runs = int(batting_match.group(3))
            fours = int(batting_match.group(5))
            sixes = int(batting_match.group(6))
            is_not_out = "not out" in dismissal_text

            batting.append({
                "name": name,
                "runs": runs,
                "fours": fours,
                "sixes": sixes,
                "out": not is_not_out,
                "played": True,
                "team": current_team
            })
            continue

        over_match = re.match(r"^(\d+)\s+(\d+)\s+(\d+)\s+([A-Za-z]+)\s", line)
        if over_match:
            runs_in_over = int(over_match.group(2))
            wickets_in_over = int(over_match.group(3))
            bowler = fix_name(over_match.group(4))

            if bowler not in bowling:
                bowling[bowler] = {"runs": 0, "wickets": 0, "overs": 0}

            bowling[bowler]["runs"] += runs_in_over
            bowling[bowler]["wickets"] += wickets_in_over
            bowling[bowler]["overs"] += 1
            continue

    return {"batting": batting, "bowling": bowling, "team_totals": team_totals}


if __name__ == "__main__":
    pdf_path = sys.argv[1]
    result = parse_match(pdf_path)

    print("=== BATTING ===")
    for b in result["batting"]:
        print(b)

    print("\n=== BOWLING ===")
    for name, stats in result["bowling"].items():
        print(name, stats)

    print("\n=== TEAM TOTALS ===")
    print(result["team_totals"])