import json

def load_json(path):
    with open(path, "r") as f:
        return json.load(f)

def save_json(path, data):
    with open(path, "w") as f:
        json.dump(data, f, indent=2)

def update_players(parsed, players_path="data/players.json"):
    players = load_json(players_path)
    players_by_name = {p["name"]: p for p in players}

    # ---- Batting updates ----
    for entry in parsed["batting"]:
        name = entry["name"]
        if name not in players_by_name:
            print(f"WARNING: {name} not found in players.json, skipping")
            continue

        player = players_by_name[name]
        player["matches"] += 1

        if entry["played"]:
            runs = entry["runs"]
            player["runs"] += runs
            player["fours"] += entry["fours"]
            player["sixes"] += entry["sixes"]

            if 50 <= runs < 100:
                player["fifties"] += 1
            elif runs >= 100:
                player["hundreds"] += 1

            # update highest score (compare numeric part, ignore the * for not-out)
            score_str = f"{runs}{'*' if not entry['out'] else ''}"
            current_highest = player["highest"]
            current_highest_num = int(current_highest.replace("*", "")) if current_highest else 0
            if runs > current_highest_num or (runs == current_highest_num and not entry["out"]):
                player["highest"] = score_str

            # update recent innings (keep last 5, newest first)
            player["recentInnings"].insert(0, score_str)
            player["recentInnings"] = player["recentInnings"][:5]

    # ---- Bowling updates ----
    for name, bowl in parsed["bowling"].items():
        if name not in players_by_name:
            print(f"WARNING: {name} not found in players.json, skipping")
            continue

        player = players_by_name[name]
        player["wickets"] += bowl["wickets"]

        # update best bowling figures (more wickets wins; if tied, fewer runs wins)
        current_best = player["bestBowling"]
        current_w, current_r = map(int, current_best.split("/"))
        new_w, new_r = bowl["wickets"], bowl["runs"]

        if new_w > current_w or (new_w == current_w and new_r < current_r):
            player["bestBowling"] = f"{new_w}/{new_r}"

    save_json(players_path, players)
    print("players.json updated successfully.")


if __name__ == "__main__":
    import sys
    from parser import parse_match

    pdf_path = sys.argv[1]
    parsed = parse_match(pdf_path)
    update_players(parsed)