/**
 * Centralized team color utility for NBA and NFL teams
 * Maps team abbreviations and names to their official colors
 */

/**
 * NBA Team Colors by abbreviation
 */
const nbaTeamColors = {
  lal: "#552583", // Los Angeles Lakers - Purple
  bos: "#007A33", // Boston Celtics - Green
  gsw: "#1D428A", // Golden State Warriors - Blue
  mia: "#98002E", // Miami Heat - Red
  chi: "#CE1141", // Chicago Bulls - Red
  nyk: "#006BB6", // New York Knicks - Blue
  lac: "#C8102E", // LA Clippers - Red
  phx: "#1D1160", // Phoenix Suns - Purple
  dal: "#00538C", // Dallas Mavericks - Blue
  den: "#0E2240", // Denver Nuggets - Blue
  hou: "#CE1141", // Houston Rockets - Red
  mil: "#00471B", // Milwaukee Bucks - Green
  bkn: "#000000", // Brooklyn Nets - Black
  phi: "#006BB6", // Philadelphia 76ers - Blue
  por: "#E03A3E", // Portland Trail Blazers - Red
  sac: "#5A2D81", // Sacramento Kings - Purple
  sa: "#C4CED4", // San Antonio Spurs - Silver
  tor: "#CE1141", // Toronto Raptors - Red
  uta: "#002B5C", // Utah Jazz - Blue
  was: "#002B5C", // Washington Wizards - Blue
  atl: "#E03A3E", // Atlanta Hawks - Red
  cha: "#1D1160", // Charlotte Hornets - Purple
  cle: "#860038", // Cleveland Cavaliers - Red
  det: "#C8102E", // Detroit Pistons - Red
  ind: "#002D62", // Indiana Pacers - Blue
  mem: "#5D76A9", // Memphis Grizzlies - Blue
  min: "#0C2340", // Minnesota Timberwolves - Blue
  no: "#0C2340", // New Orleans Pelicans - Blue
  okc: "#007AC1", // Oklahoma City Thunder - Blue
  orl: "#0077C0", // Orlando Magic - Blue
};

/**
 * NFL Team Colors by abbreviation
 */
const nflTeamColors = {
  // AFC East
  ne: "#002244", // New England Patriots - Navy Blue
  nyj: "#125740", // New York Jets - Green
  buf: "#00338D", // Buffalo Bills - Royal Blue
  mia: "#008E97", // Miami Dolphins - Aqua

  // AFC North
  bal: "#241773", // Baltimore Ravens - Purple
  cin: "#FB4F14", // Cincinnati Bengals - Orange
  cle: "#311D00", // Cleveland Browns - Brown
  pit: "#FFB612", // Pittsburgh Steelers - Gold

  // AFC South
  hou: "#03202F", // Houston Texans - Deep Steel Blue
  ind: "#002C5F", // Indianapolis Colts - Blue
  jax: "#006778", // Jacksonville Jaguars - Teal
  ten: "#0C2340", // Tennessee Titans - Navy Blue

  // AFC West
  den: "#FB4F14", // Denver Broncos - Orange
  kc: "#E31837", // Kansas City Chiefs - Red
  lv: "#000000", // Las Vegas Raiders - Black
  lac: "#0080C6", // Los Angeles Chargers - Powder Blue

  // NFC East
  dal: "#003594", // Dallas Cowboys - Royal Blue
  nyg: "#0B2265", // New York Giants - Blue
  phi: "#004C54", // Philadelphia Eagles - Midnight Green
  was: "#773141", // Washington Commanders - Burgundy

  // NFC North
  chi: "#0B162A", // Chicago Bears - Navy Blue
  det: "#0076B6", // Detroit Lions - Honolulu Blue
  gb: "#203731", // Green Bay Packers - Dark Green
  min: "#4F2683", // Minnesota Vikings - Purple

  // NFC South
  atl: "#A71930", // Atlanta Falcons - Red
  car: "#0085CA", // Carolina Panthers - Blue
  no: "#D3BC8D", // New Orleans Saints - Gold
  tb: "#D50A0A", // Tampa Bay Buccaneers - Red

  // NFC West
  ari: "#97233F", // Arizona Cardinals - Cardinal Red
  lar: "#003594", // Los Angeles Rams - Royal Blue
  sf: "#AA0000", // San Francisco 49ers - Red
  sea: "#002244", // Seattle Seahawks - College Navy
};

/**
 * NBA Team name keyword matches
 */
const nbaNameMatches = [
  { keywords: ["lakers", "los angeles lakers"], color: "#552583" },
  { keywords: ["celtics", "boston"], color: "#007A33" },
  { keywords: ["warriors", "golden state"], color: "#1D428A" },
  { keywords: ["heat", "miami"], color: "#98002E" },
  { keywords: ["bulls", "chicago"], color: "#CE1141" },
  { keywords: ["knicks", "new york"], color: "#006BB6" },
];

/**
 * NFL Team name keyword matches
 */
const nflNameMatches = [
  { keywords: ["patriots", "new england"], color: "#002244" },
  { keywords: ["bengals", "cincinnati"], color: "#FB4F14" },
  { keywords: ["jets", "new york jets"], color: "#125740" },
  { keywords: ["bills", "buffalo"], color: "#00338D" },
  { keywords: ["dolphins", "miami"], color: "#008E97" },
  { keywords: ["ravens", "baltimore"], color: "#241773" },
  { keywords: ["browns", "cleveland"], color: "#311D00" },
  { keywords: ["steelers", "pittsburgh"], color: "#FFB612" },
  { keywords: ["texans", "houston"], color: "#03202F" },
  { keywords: ["colts", "indianapolis"], color: "#002C5F" },
  { keywords: ["jaguars", "jacksonville"], color: "#006778" },
  { keywords: ["titans", "tennessee"], color: "#0C2340" },
  { keywords: ["broncos", "denver"], color: "#FB4F14" },
  { keywords: ["chiefs", "kansas city"], color: "#E31837" },
  { keywords: ["raiders", "las vegas", "oakland"], color: "#000000" },
  { keywords: ["chargers", "los angeles chargers"], color: "#0080C6" },
  { keywords: ["cowboys", "dallas"], color: "#003594" },
  { keywords: ["giants", "new york giants"], color: "#0B2265" },
  { keywords: ["eagles", "philadelphia"], color: "#004C54" },
  { keywords: ["commanders", "washington", "redskins"], color: "#773141" },
  { keywords: ["bears", "chicago"], color: "#0B162A" },
  { keywords: ["lions", "detroit"], color: "#0076B6" },
  { keywords: ["packers", "green bay"], color: "#203731" },
  { keywords: ["vikings", "minnesota"], color: "#4F2683" },
  { keywords: ["falcons", "atlanta"], color: "#A71930" },
  { keywords: ["panthers", "carolina"], color: "#0085CA" },
  { keywords: ["saints", "new orleans"], color: "#D3BC8D" },
  { keywords: ["buccaneers", "tampa bay", "bucs"], color: "#D50A0A" },
  { keywords: ["cardinals", "arizona"], color: "#97233F" },
  { keywords: ["rams", "los angeles rams"], color: "#003594" },
  { keywords: ["49ers", "san francisco"], color: "#AA0000" },
  { keywords: ["seahawks", "seattle"], color: "#002244" },
];

/**
 * Get team color based on abbreviation or name
 * @param {string} abbreviation - Team abbreviation (e.g., 'lal', 'ne')
 * @param {string} teamName - Full team name
 * @param {string} sport - 'nba' or 'nfl' (auto-detected if not provided)
 * @returns {string} Hex color code for the team
 */
export function getTeamColor(abbreviation, teamName, sport = null) {
  if (!abbreviation && !teamName) return "#9333EA"; // Default purple

  const abbrev = (abbreviation || "").toLowerCase();
  const name = (teamName || "").toLowerCase();

  // Determine sport if not provided
  if (!sport) {
    // Try to detect sport from team name or abbreviation
    sport = detectSport(abbrev, name);
  }

  const teamColors = sport === 'nba' ? nbaTeamColors : nflTeamColors;
  const nameMatches = sport === 'nba' ? nbaNameMatches : nflNameMatches;

  // Try abbreviation first
  if (abbrev && teamColors[abbrev]) {
    return teamColors[abbrev];
  }

  // Try to match by team name keywords
  for (const match of nameMatches) {
    if (match.keywords.some((keyword) => name.includes(keyword))) {
      return match.color;
    }
  }

  // Default fallback
  return "#9333EA"; // Default purple
}

/**
 * Attempt to detect sport from team abbreviation or name
 * @param {string} abbreviation
 * @param {string} teamName
 * @returns {string} 'nba' or 'nfl'
 */
function detectSport(abbreviation, teamName) {
  const abbrev = (abbreviation || "").toLowerCase();
  const name = (teamName || "").toLowerCase();

  // Check NBA abbreviations
  if (abbrev && nbaTeamColors[abbrev]) {
    return 'nba';
  }

  // Check NFL abbreviations
  if (abbrev && nflTeamColors[abbrev]) {
    return 'nfl';
  }

  // Check team names for NBA keywords
  for (const match of nbaNameMatches) {
    if (match.keywords.some((keyword) => name.includes(keyword))) {
      return 'nba';
    }
  }

  // Check team names for NFL keywords
  for (const match of nflNameMatches) {
    if (match.keywords.some((keyword) => name.includes(keyword))) {
      return 'nfl';
    }
  }

  // Default to NFL (more teams)
  return 'nfl';
}

/**
 * Get all team colors for a specific sport
 * @param {string} sport - 'nba' or 'nfl'
 * @returns {object} Object mapping abbreviations to colors
 */
export function getAllTeamColors(sport = 'nfl') {
  return sport === 'nba' ? nbaTeamColors : nflTeamColors;
}
