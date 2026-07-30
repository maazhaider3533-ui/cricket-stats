/* for tailwind css use this in html files ---> <script src="https://cdn.tailwindcss.com"></script>*/
// ---------- Players list page ----------
async function loadPlayersList(){
    const container = document.getElementById("playersContainer");
    if (!container) return; // not on players.html, skip

    const res = await fetch("data/players.json");
    const players = await res.json();

    // sort by runs, highest first (matches your rankings order)
    players.sort((a, b) => b.runs - a.runs);

    players.forEach(player => {
        const link = document.createElement("a");
        link.href = `player.html?id=${player.id}`;

        link.innerHTML = `
            <div class="card">
                <h3>${player.name}</h3>
                <p><strong>Runs:</strong>${player.runs}</p>
                <p><strong>Wickets:</strong>${player.wickets}</p>
            </div>
        `;

        container.appendChild(link);
    });
}

// ---------- Player profile page ----------
async function loadPlayerProfile(){
    const heroHeading = document.querySelector(".hero h2");
    const profileSection = document.querySelector(".player-profile");
    if (!profileSection) return; // not on player.html, skip

    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    const res = await fetch("data/players.json");
    const players = await res.json();
    const player = players.find(p => p.id === id);

    if (!player){
        heroHeading.textContent = "Player not found";
        return;
    }

    heroHeading.textContent = player.name;

    profileSection.innerHTML = `
        <div class="card">
            <h3>Career Summary</h3>
            <div class="stat-row"><span>Matches</span><span>${player.matches}</span></div>
            <div class="stat-row"><span>Runs</span><span>${player.runs}</span></div>
            <div class="stat-row"><span>Highest</span><span>${player.highest}</span></div>
        </div>

        <div class="card">
            <h3>Batting Statistics</h3>
            <div class="stat-row"><span>4s</span><span>${player.fours}</span></div>
            <div class="stat-row"><span>6s</span><span>${player.sixes}</span></div>
            <div class="stat-row"><span>50s</span><span>${player.fifties}</span></div>
            <div class="stat-row"><span>100s</span><span>${player.hundreds}</span></div>
        </div>

        <div class="card">
            <h3>Bowling Statistics</h3>
            <div class="stat-row"><span>Wickets</span><span>${player.wickets}</span></div>
            <div class="stat-row"><span>Best Bowling</span><span>${player.bestBowling}</span></div>
        </div>

        <div class="card">
            <h3>Recent Innings</h3>
            <div class="innings">
                ${player.recentInnings.map(score => `<span>${score}</span>`).join("")}
            </div>
        </div>
    `;
}


// ---------- Rankings page ----------
async function loadRankings(){
    const battingList = document.getElementById("battingRankings");
    const bowlingList = document.getElementById("bowlingRankings");
    if (!battingList || !bowlingList) return; // not on rankings.html, skip

    const res = await fetch("data/players.json");
    const players = await res.json();

    // Batting: sort by runs, descending
    const byRuns = [...players].sort((a, b) => b.runs - a.runs);
    battingList.innerHTML = byRuns.map((player, index) => `
        <li>
            <span class="rank-pos">${index + 1}</span>
            <span class="rank-name">${player.name}</span>
            <span class="rank-stat">${player.runs}</span>
        </li>
    `).join("");

    // Bowling: sort by wickets, descending
    const byWickets = [...players].sort((a, b) => b.wickets - a.wickets);
    bowlingList.innerHTML = byWickets.map((player, index) => `
        <li>
            <span class="rank-pos">${index + 1}</span>
            <span class="rank-name">${player.name}</span>
            <span class="rank-stat">${player.wickets}</span>
        </li>
    `).join("");
}
// ---------- Homepage cards ----------
async function loadHomepage(){
    const latestMatchCard = document.querySelector(".cards .card"); // first card = Latest Match
    if (!document.querySelector(".hero") || !latestMatchCard || !document.title.includes("Cricket Stats")) return;

    // Only run on index.html — check for the specific card structure
    const cards = document.querySelectorAll(".cards .card");
    if (cards.length < 3) return; // not the homepage layout

    const [playersRes, matchesRes] = await Promise.all([
        fetch("data/players.json"),
        fetch("data/matches.json")
    ]);
    const players = await playersRes.json();
    const matchData = await matchesRes.json();

    // Top Run Scorer
    const topScorer = [...players].sort((a, b) => b.runs - a.runs)[0];
    cards[1].innerHTML = `
        <h3>Top Run Scorer</h3>
        <p>${topScorer.name}</p>
        <p>${topScorer.runs}</p>
    `;

    // Top Wicket Taker
    const topWicketTaker = [...players].sort((a, b) => b.wickets - a.wickets)[0];
    cards[2].innerHTML = `
        <h3>Top Wicket Taker</h3>
        <p>${topWicketTaker.name}</p>
        <p>${topWicketTaker.wickets}</p>
    `;

   // Latest Match
    cards[0].innerHTML = `
    <h3>Latest Match</h3>
    <p>${matchData.latestMatch.teams}</p>
    <p><strong>Winner:</strong>${matchData.latestMatch.winner}</p>
    `;
}
// ---------- Matches page ----------
async function loadMatchesPage(){
    const teamTScore = document.getElementById("teamTScore");
    const teamHScore = document.getElementById("teamHScore");
    const archiveContainer = document.getElementById("archiveContainer");
    if (!teamTScore || !archiveContainer) return; // not on matches.html, skip

    const res = await fetch("data/matches.json");
    const data = await res.json();

    // Head to head
    teamTScore.textContent = data.headToHead.teamT;
    teamHScore.textContent = data.headToHead.teamH;

    // Group matches by year
    const byYear = {};
    data.matches.forEach(match => {
        if (!byYear[match.year]) byYear[match.year] = [];
        byYear[match.year].push(match);
    });

    // Render newest year first
    const years = Object.keys(byYear).sort((a, b) => b - a);

    archiveContainer.innerHTML = years.map(year => `
        <div class="year-block">
            <h3>${year}</h3>
            <div class="match-list">
                ${byYear[year].map(match => `
                    <a href="${match.pdf}" target="_blank" class="match-item">
                        <span>📄 Match ${match.matchNumber}</span>
                    </a>
                `).join("")}
            </div>
        </div>
    `).join("");
}
document.addEventListener("DOMContentLoaded", () => {
    loadPlayersList();
    loadPlayerProfile();
    loadRankings();
    loadHomepage();
    loadMatchesPage();
});