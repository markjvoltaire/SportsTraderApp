const normalizeTeamName = (value) =>
  value
    ? value
        .toString()
        .toUpperCase()
        .replace(/[^A-Z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
    : "";

const NFL_TEAM_COLORS = [
  {
    color: "#97233F",
    aliases: ["ARIZONA CARDINALS", "ARIZONA", "CARDINALS", "ARI"],
  },
  {
    color: "#A71930",
    aliases: ["ATLANTA FALCONS", "ATLANTA", "FALCONS", "ATL"],
  },
  {
    color: "#241773",
    aliases: ["BALTIMORE RAVENS", "BALTIMORE", "RAVENS", "BAL"],
  },
  {
    color: "#00338D",
    aliases: ["BUFFALO BILLS", "BUFFALO", "BILLS", "BUF"],
  },
  {
    color: "#0085CA",
    aliases: ["CAROLINA PANTHERS", "CAROLINA", "PANTHERS", "CAR"],
  },
  {
    color: "#0B162A",
    aliases: ["CHICAGO BEARS", "CHICAGO", "BEARS", "CHI"],
  },
  {
    color: "#FB4F14",
    aliases: ["CINCINNATI BENGALS", "CINCINNATI", "BENGALS", "CIN", "CINCY"],
  },
  {
    color: "#311D00",
    aliases: ["CLEVELAND BROWNS", "CLEVELAND", "BROWNS", "CLE"],
  },
  {
    color: "#041E42",
    aliases: ["DALLAS COWBOYS", "DALLAS", "COWBOYS", "DAL"],
  },
  {
    color: "#FB4F14",
    aliases: ["DENVER BRONCOS", "DENVER", "BRONCOS", "DEN"],
  },
  {
    color: "#0076B6",
    aliases: ["DETROIT LIONS", "DETROIT", "LIONS", "DET"],
  },
  {
    color: "#203731",
    aliases: ["GREEN BAY PACKERS", "GREEN BAY", "PACKERS", "GB", "GBP"],
  },
  {
    color: "#03202F",
    aliases: ["HOUSTON TEXANS", "HOUSTON", "TEXANS", "HOU"],
  },
  {
    color: "#002C5F",
    aliases: ["INDIANAPOLIS COLTS", "INDIANAPOLIS", "COLTS", "IND"],
  },
  {
    color: "#006778",
    aliases: ["JACKSONVILLE JAGUARS", "JACKSONVILLE", "JAGUARS", "JAGS", "JAX"],
  },
  {
    color: "#E31837",
    aliases: ["KANSAS CITY CHIEFS", "KANSAS CITY", "CHIEFS", "KC"],
  },
  {
    color: "#000000",
    aliases: [
      "LAS VEGAS RAIDERS",
      "VEGAS RAIDERS",
      "RAIDERS",
      "LAS VEGAS",
      "LV",
      "LVR",
      "OAKLAND RAIDERS",
    ],
  },
  {
    color: "#0080C6",
    aliases: [
      "LOS ANGELES CHARGERS",
      "LA CHARGERS",
      "CHARGERS",
      "LAC",
      "SAN DIEGO CHARGERS",
    ],
  },
  {
    color: "#003594",
    aliases: [
      "LOS ANGELES RAMS",
      "LA RAMS",
      "RAMS",
      "LAR",
      "ST LOUIS RAMS",
      "ST. LOUIS RAMS",
    ],
  },
  {
    color: "#008E97",
    aliases: ["MIAMI DOLPHINS", "MIAMI", "DOLPHINS", "MIA"],
  },
  {
    color: "#4F2683",
    aliases: ["MINNESOTA VIKINGS", "MINNESOTA", "VIKINGS", "MIN"],
  },
  {
    color: "#002244",
    aliases: ["NEW ENGLAND PATRIOTS", "NEW ENGLAND", "PATRIOTS", "NE"],
  },
  {
    color: "#D3BC8D",
    aliases: ["NEW ORLEANS SAINTS", "NEW ORLEANS", "SAINTS", "NO", "NOP"],
  },
  {
    color: "#0B2265",
    aliases: [
      "NEW YORK GIANTS",
      "NY GIANTS",
      "GIANTS",
      "NYG",
      "NEW YORK FOOTBALL GIANTS",
    ],
  },
  {
    color: "#125740",
    aliases: ["NEW YORK JETS", "NY JETS", "JETS", "NYJ"],
  },
  {
    color: "#004C54",
    aliases: ["PHILADELPHIA EAGLES", "PHILADELPHIA", "EAGLES", "PHI"],
  },
  {
    color: "#FFB612",
    aliases: ["PITTSBURGH STEELERS", "PITTSBURGH", "STEELERS", "PIT"],
  },
  {
    color: "#AA0000",
    aliases: ["SAN FRANCISCO 49ERS", "SAN FRANCISCO", "49ERS", "NINERS", "SF"],
  },
  {
    color: "#69BE28",
    aliases: ["SEATTLE SEAHAWKS", "SEATTLE", "SEAHAWKS", "SEA"],
  },
  {
    color: "#D50A0A",
    aliases: ["TAMPA BAY BUCCANEERS", "TAMPA BAY", "BUCCANEERS", "BUCS", "TB"],
  },
  {
    color: "#4B92DB",
    aliases: ["TENNESSEE TITANS", "TENNESSEE", "TITANS", "TEN"],
  },
  {
    color: "#5A1414",
    aliases: ["WASHINGTON COMMANDERS", "WASHINGTON", "COMMANDERS", "WAS", "WSH"],
  },
];

export const getNFLTeamColor = (nameOrAbbreviation) => {
  const normalized = normalizeTeamName(nameOrAbbreviation);
  if (!normalized) return null;

  for (const team of NFL_TEAM_COLORS) {
    for (const alias of team.aliases) {
      if (
        normalized === alias ||
        normalized.includes(alias) ||
        normalized.split(" ").includes(alias)
      ) {
        return team.color;
      }
    }
  }

  return null;
};

export const NFL_COLORS = NFL_TEAM_COLORS;

const NBA_TEAM_COLORS = [
  {
    color: "#E03A3E",
    aliases: ["ATLANTA HAWKS", "ATLANTA", "HAWKS", "ATL"],
  },
  {
    color: "#007A33",
    aliases: ["BOSTON CELTICS", "BOSTON", "CELTICS", "BOS"],
  },
  {
    color: "#000000",
    aliases: ["BROOKLYN NETS", "BROOKLYN", "NETS", "BKN"],
  },
  {
    color: "#00788C",
    aliases: ["CHARLOTTE HORNETS", "CHARLOTTE", "HORNETS", "CHA"],
  },
  {
    color: "#CE1141",
    aliases: ["CHICAGO BULLS", "CHICAGO", "BULLS", "CHI"],
  },
  {
    color: "#6F263D",
    aliases: ["CLEVELAND CAVALIERS", "CLEVELAND", "CAVALIERS", "CAVS", "CLE"],
  },
  {
    color: "#00538C",
    aliases: ["DALLAS MAVERICKS", "DALLAS", "MAVERICKS", "MAVS", "DAL"],
  },
  {
    color: "#0E2240",
    aliases: ["DENVER NUGGETS", "DENVER", "NUGGETS", "DEN"],
  },
  {
    color: "#C8102E",
    aliases: ["DETROIT PISTONS", "DETROIT", "PISTONS", "DET"],
  },
  {
    color: "#1D428A",
    aliases: ["GOLDEN STATE WARRIORS", "GOLDEN STATE", "WARRIORS", "GSW"],
  },
  {
    color: "#CE1141",
    aliases: ["HOUSTON ROCKETS", "HOUSTON", "ROCKETS", "HOU"],
  },
  {
    color: "#002D62",
    aliases: ["INDIANA PACERS", "INDIANA", "PACERS", "IND"],
  },
  {
    color: "#C8102E",
    aliases: [
      "LOS ANGELES CLIPPERS",
      "LA CLIPPERS",
      "CLIPPERS",
      "LAC",
      "LOS ANGELES C",
    ],
  },
  {
    color: "#552583",
    aliases: [
      "LOS ANGELES LAKERS",
      "LA LAKERS",
      "LAKERS",
      "LAL",
      "LOS ANGELES L",
    ],
  },
  {
    color: "#5D76A9",
    aliases: ["MEMPHIS GRIZZLIES", "MEMPHIS", "GRIZZLIES", "GRIZZ", "MEM"],
  },
  {
    color: "#98002E",
    aliases: ["MIAMI HEAT", "MIAMI", "HEAT", "MIA"],
  },
  {
    color: "#00471B",
    aliases: ["MILWAUKEE BUCKS", "MILWAUKEE", "BUCKS", "MIL"],
  },
  {
    color: "#0C2340",
    aliases: ["MINNESOTA TIMBERWOLVES", "MINNESOTA", "TIMBERWOLVES", "WOLVES", "MIN"],
  },
  {
    color: "#0C2340",
    aliases: ["NEW ORLEANS PELICANS", "NEW ORLEANS", "PELICANS", "NOP", "NO"],
  },
  {
    color: "#006BB6",
    aliases: ["NEW YORK KNICKS", "NEW YORK", "KNICKS", "NYK"],
  },
  {
    color: "#007AC1",
    aliases: ["OKLAHOMA CITY THUNDER", "OKLAHOMA CITY", "THUNDER", "OKC"],
  },
  {
    color: "#0077C0",
    aliases: ["ORLANDO MAGIC", "ORLANDO", "MAGIC", "ORL"],
  },
  {
    color: "#006BB6",
    aliases: ["PHILADELPHIA 76ERS", "PHILADELPHIA", "SIXERS", "76ERS", "PHI"],
  },
  {
    color: "#E56020",
    aliases: ["PHOENIX SUNS", "PHOENIX", "SUNS", "PHX"],
  },
  {
    color: "#E03A3E",
    aliases: ["PORTLAND TRAIL BLAZERS", "PORTLAND", "BLAZERS", "POR"],
  },
  {
    color: "#5A2D81",
    aliases: ["SACRAMENTO KINGS", "SACRAMENTO", "KINGS", "SAC"],
  },
  {
    color: "#000000",
    aliases: ["SAN ANTONIO SPURS", "SAN ANTONIO", "SPURS", "SAS", "SA"],
  },
  {
    color: "#CE1141",
    aliases: ["TORONTO RAPTORS", "TORONTO", "RAPTORS", "TOR"],
  },
  {
    color: "#002B5C",
    aliases: ["UTAH JAZZ", "UTAH", "JAZZ", "UTA"],
  },
  {
    color: "#002B5C",
    aliases: ["WASHINGTON WIZARDS", "WASHINGTON", "WIZARDS", "WAS", "WSH"],
  },
];

export const getNBATeamColor = (nameOrAbbreviation) => {
  const normalized = normalizeTeamName(nameOrAbbreviation);
  if (!normalized) return null;

  for (const team of NBA_TEAM_COLORS) {
    for (const alias of team.aliases) {
      if (
        normalized === alias ||
        normalized.includes(alias) ||
        normalized.split(" ").includes(alias)
      ) {
        return team.color;
      }
    }
  }

  return null;
};

export const NBA_COLORS = NBA_TEAM_COLORS;

const NHL_TEAM_COLORS = [
  { color: "#F47A38", aliases: ["ANAHEIM DUCKS", "ANAHEIM", "DUCKS", "ANA"] },
  { color: "#8C2633", aliases: ["ARIZONA COYOTES", "ARIZONA", "COYOTES", "ARI"] },
  { color: "#000000", aliases: ["BOSTON BRUINS", "BOSTON", "BRUINS", "BOS"] },
  { color: "#002654", aliases: ["BUFFALO SABRES", "BUFFALO", "SABRES", "BUF"] },
  { color: "#C8102E", aliases: ["CALGARY FLAMES", "CALGARY", "FLAMES", "CGY"] },
  { color: "#CC0000", aliases: ["CAROLINA HURRICANES", "CAROLINA", "HURRICANES", "CAR"] },
  { color: "#CF0A2C", aliases: ["CHICAGO BLACKHAWKS", "CHICAGO", "BLACKHAWKS", "CHI"] },
  { color: "#6F263D", aliases: ["COLORADO AVALANCHE", "COLORADO", "AVALANCHE", "COL"] },
  { color: "#002654", aliases: ["COLUMBUS BLUE JACKETS", "COLUMBUS", "BLUE JACKETS", "CBJ"] },
  { color: "#006847", aliases: ["DALLAS STARS", "DALLAS", "STARS", "DAL"] },
  { color: "#CE1126", aliases: ["DETROIT RED WINGS", "DETROIT", "RED WINGS", "DET"] },
  { color: "#041E42", aliases: ["EDMONTON OILERS", "EDMONTON", "OILERS", "EDM"] },
  { color: "#C8102E", aliases: ["FLORIDA PANTHERS", "FLORIDA", "PANTHERS", "FLA"] },
  { color: "#000000", aliases: ["LOS ANGELES KINGS", "LA KINGS", "KINGS", "LA", "LAK"] },
  { color: "#024930", aliases: ["MINNESOTA WILD", "MINNESOTA", "WILD", "MIN"] },
  { color: "#AF1E2D", aliases: ["MONTREAL CANADIENS", "MONTREAL", "CANADIENS", "HABS", "MTL"] },
  { color: "#FFB81C", aliases: ["NASHVILLE PREDATORS", "NASHVILLE", "PREDATORS", "PREDS", "NSH"] },
  { color: "#CE1126", aliases: ["NEW JERSEY DEVILS", "NEW JERSEY", "DEVILS", "NJD", "NJ"] },
  { color: "#00539B", aliases: ["NEW YORK ISLANDERS", "NY ISLANDERS", "ISLANDERS", "NYI"] },
  { color: "#0038A8", aliases: ["NEW YORK RANGERS", "NY RANGERS", "RANGERS", "NYR"] },
  { color: "#C52032", aliases: ["OTTAWA SENATORS", "OTTAWA", "SENATORS", "SENS", "OTT"] },
  { color: "#F74902", aliases: ["PHILADELPHIA FLYERS", "PHILADELPHIA", "FLYERS", "PHI"] },
  { color: "#000000", aliases: ["PITTSBURGH PENGUINS", "PITTSBURGH", "PENGUINS", "PENS", "PIT"] },
  { color: "#006D75", aliases: ["SAN JOSE SHARKS", "SAN JOSE", "SHARKS", "SJS", "SJ"] },
  { color: "#001628", aliases: ["SEATTLE KRAKEN", "SEATTLE", "KRAKEN", "SEA"] },
  { color: "#002F87", aliases: ["ST LOUIS BLUES", "ST. LOUIS BLUES", "ST LOUIS", "ST. LOUIS", "BLUES", "STL"] },
  { color: "#002868", aliases: ["TAMPA BAY LIGHTNING", "TAMPA BAY", "LIGHTNING", "TBL", "TB"] },
  { color: "#00205B", aliases: ["TORONTO MAPLE LEAFS", "TORONTO", "MAPLE LEAFS", "LEAFS", "TOR"] },
  { color: "#00205B", aliases: ["VANCOUVER CANUCKS", "VANCOUVER", "CANUCKS", "VAN"] },
  { color: "#B4975A", aliases: ["VEGAS GOLDEN KNIGHTS", "VEGAS", "GOLDEN KNIGHTS", "VGK", "LV"] },
  { color: "#C8102E", aliases: ["WASHINGTON CAPITALS", "WASHINGTON", "CAPITALS", "CAPS", "WSH", "WAS"] },
  { color: "#041E42", aliases: ["WINNIPEG JETS", "WINNIPEG", "JETS", "WPG"] },
];

export const getNHLTeamColor = (nameOrAbbreviation) => {
  const normalized = normalizeTeamName(nameOrAbbreviation);
  if (!normalized) return null;

  for (const team of NHL_TEAM_COLORS) {
    for (const alias of team.aliases) {
      if (
        normalized === alias ||
        normalized.includes(alias) ||
        normalized.split(" ").includes(alias)
      ) {
        return team.color;
      }
    }
  }

  return null;
};

export const NHL_COLORS = NHL_TEAM_COLORS;

const NCAAB_TEAM_COLORS = [
  { color: "#9E1B32", aliases: ["ALABAMA CRIMSON TIDE", "ALABAMA", "CRIMSON TIDE", "BAMA", "ALA"] },
  { color: "#002855", aliases: ["ARIZONA WILDCATS", "ARIZONA", "WILDCATS", "ARIZ"] },
  { color: "#9D2235", aliases: ["ARKANSAS RAZORBACKS", "ARKANSAS", "RAZORBACKS", "HOGS", "ARK"] },
  { color: "#003366", aliases: ["AUBURN TIGERS", "AUBURN", "TIGERS", "AUB"] },
  { color: "#861F41", aliases: ["BAYLOR BEARS", "BAYLOR", "BEARS", "BAY"] },
  { color: "#003087", aliases: ["DUKE BLUE DEVILS", "DUKE", "BLUE DEVILS", "DUK"] },
  { color: "#FA4616", aliases: ["FLORIDA GATORS", "FLORIDA", "GATORS", "FLA"] },
  { color: "#0021A5", aliases: ["FLORIDA STATE SEMINOLES", "FLORIDA STATE", "SEMINOLES", "FSU"] },
  { color: "#BA0C2F", aliases: ["GEORGIA BULLDOGS", "GEORGIA", "BULLDOGS", "UGA"] },
  { color: "#B3A369", aliases: ["GEORGIA TECH YELLOW JACKETS", "GEORGIA TECH", "YELLOW JACKETS", "GT"] },
  { color: "#024B87", aliases: ["GONZAGA BULLDOGS", "GONZAGA", "BULLDOGS", "ZAGS", "GONZ"] },
  { color: "#0051BA", aliases: ["KANSAS JAYHAWKS", "KANSAS", "JAYHAWKS", "KU", "KAN"] },
  { color: "#0033A0", aliases: ["KENTUCKY WILDCATS", "KENTUCKY", "WILDCATS", "UK", "UK"] },
  { color: "#461D7C", aliases: ["LSU TIGERS", "LSU", "TIGERS", "LOUISIANA STATE"] },
  { color: "#00274C", aliases: ["MICHIGAN WOLVERINES", "MICHIGAN", "WOLVERINES", "MICH"] },
  { color: "#18453B", aliases: ["MICHIGAN STATE SPARTANS", "MICHIGAN STATE", "SPARTANS", "MSU"] },
  { color: "#7A001D", aliases: ["MARQUETTE GOLDEN EAGLES", "MARQUETTE", "GOLDEN EAGLES", "MARQ"] },
  { color: "#00264C", aliases: ["NORTH CAROLINA TAR HEELS", "NORTH CAROLINA", "TAR HEELS", "UNC", "CAROLINA"] },
  { color: "#7BAFD4", aliases: ["NORTH CAROLINA STATE WOLFPACK", "NC STATE", "WOLFPACK", "NCSU"] },
  { color: "#0C2340", aliases: ["NOTRE DAME FIGHTING IRISH", "NOTRE DAME", "FIGHTING IRISH", "IRISH", "ND"] },
  { color: "#BD3039", aliases: ["OHIO STATE BUCKEYES", "OHIO STATE", "BUCKEYES", "OSU"] },
  { color: "#BB0000", aliases: ["OKLAHOMA SOONERS", "OKLAHOMA", "SOONERS", "OU"] },
  { color: "#154733", aliases: ["OREGON DUCKS", "OREGON", "DUCKS", "ORE"] },
  { color: "#00265D", aliases: ["PENN STATE NITTANY LIONS", "PENN STATE", "NITTANY LIONS", "PSU"] },
  { color: "#003366", aliases: ["PURDUE BOILERMAKERS", "PURDUE", "BOILERMAKERS", "PUR"] },
  { color: "#C99700", aliases: ["SAINT MARYS GAELS", "SAINT MARYS", "SAINT MARY", "GAELS", "SMC"] },
  { color: "#8B0000", aliases: ["SOUTH CAROLINA GAMECOCKS", "SOUTH CAROLINA", "GAMECOCKS", "SC"] },
  { color: "#73000A", aliases: ["TENNESSEE VOLUNTEERS", "TENNESSEE", "VOLUNTEERS", "VOLS", "TENN"] },
  { color: "#BF5700", aliases: ["TEXAS LONGHORNS", "TEXAS", "LONGHORNS", "TEX"] },
  { color: "#2D68C4", aliases: ["UCLA BRUINS", "UCLA", "BRUINS"] },
  { color: "#000E2D", aliases: ["UCONN HUSKIES", "UCONN", "CONNECTICUT", "HUSKIES", "CONN"] },
  { color: "#003366", aliases: ["VILLANOVA WILDCATS", "VILLANOVA", "WILDCATS", "NOVA", "VILL"] },
  { color: "#232D4B", aliases: ["VIRGINIA CAVALIERS", "VIRGINIA", "CAVALIERS", "UVA", "UVA"] },
  { color: "#F2A900", aliases: ["VIRGINIA TECH HOKIES", "VIRGINIA TECH", "HOKIES", "VT"] },
  { color: "#4B2E83", aliases: ["WASHINGTON HUSKIES", "WASHINGTON", "HUSKIES", "WASH"] },
  { color: "#C5050C", aliases: ["WISCONSIN BADGERS", "WISCONSIN", "BADGERS", "WIS"] },
  { color: "#512D6D", aliases: ["XAVIER MUSKETEERS", "XAVIER", "MUSKETEERS", "XAV"] },
  { color: "#003366", aliases: ["CREIGHTON BLUEJAYS", "CREIGHTON", "BLUEJAYS", "BLUE JAYS", "CREI"] },
  { color: "#003366", aliases: ["HOUSTON COUGARS", "HOUSTON", "COUGARS", "HOU"] },
  { color: "#E31937", aliases: ["ILLINOIS FIGHTING ILLINI", "ILLINOIS", "FIGHTING ILLINI", "ILLINI", "ILL"] },
  { color: "#002F6C", aliases: ["INDIANA HOOSIERS", "INDIANA", "HOOSIERS", "IND"] },
  { color: "#000000", aliases: ["IOWA HAWKEYES", "IOWA", "HAWKEYES", "IOWA"] },
  { color: "#003366", aliases: ["LOUISVILLE CARDINALS", "LOUISVILLE", "CARDINALS", "LOU"] },
  { color: "#CE1126", aliases: ["MIAMI HURRICANES", "MIAMI", "HURRICANES", "CANES", "MIA"] },
  { color: "#7D3C98", aliases: ["SYRACUSE ORANGE", "SYRACUSE", "ORANGE", "CUSE", "SYR"] },
  { color: "#500000", aliases: ["TEXAS A&M AGGIES", "TEXAS A&M", "TEXAS AM", "AGGIES", "A&M", "TAMU"] },
  { color: "#8B2942", aliases: ["USC TROJANS", "USC", "TROJANS", "SOUTHERN CAL", "SOUTHERN CALIFORNIA"] },
  { color: "#003366", aliases: ["WEST VIRGINIA MOUNTAINEERS", "WEST VIRGINIA", "MOUNTAINEERS", "WVU"] },
];

export const getNCAABTeamColor = (nameOrAbbreviation) => {
  const normalized = normalizeTeamName(nameOrAbbreviation);
  if (!normalized) return null;

  for (const team of NCAAB_TEAM_COLORS) {
    for (const alias of team.aliases) {
      if (
        normalized === alias ||
        normalized.includes(alias) ||
        normalized.split(" ").includes(alias)
      ) {
        return team.color;
      }
    }
  }

  return null;
};

export const NCAAB_COLORS = NCAAB_TEAM_COLORS;

const EPL_TEAM_COLORS = [
  { color: "#EF0107", aliases: ["ARSENAL", "GUNNERS", "ARS"] },
  { color: "#670E36", aliases: ["ASTON VILLA", "VILLA", "AVL", "VILLA"] },
  { color: "#DA291C", aliases: ["BOURNEMOUTH", "CHERRIES", "BOU", "AFC BOURNEMOUTH"] },
  { color: "#FBB800", aliases: ["BRENTFORD", "BEES", "BRE"] },
  { color: "#0057B8", aliases: ["BRIGHTON", "BRIGHTON AND HOVE ALBION", "SEAGULLS", "BHA"] },
  { color: "#003DA5", aliases: ["CHELSEA", "BLUES", "CHE"] },
  { color: "#C4122E", aliases: ["CRYSTAL PALACE", "PALACE", "EAGLES", "CRY"] },
  { color: "#003399", aliases: ["EVERTON", "TOFFEES", "EVE"] },
  { color: "#000000", aliases: ["FULHAM", "COTTAGERS", "FUL"] },
  { color: "#003090", aliases: ["IPSWICH TOWN", "IPSWICH", "TOWN", "BLUES", "IPS"] },
  { color: "#003090", aliases: ["LEICESTER CITY", "LEICESTER", "FOXES", "LEI"] },
  { color: "#C8102E", aliases: ["LIVERPOOL", "REDS", "LIV"] },
  { color: "#6CABDA", aliases: ["MANCHESTER CITY", "MAN CITY", "CITY", "CITIZENS", "MCI"] },
  { color: "#DA291C", aliases: ["MANCHESTER UNITED", "MAN UNITED", "MAN UTD", "UNITED", "RED DEVILS", "MUN"] },
  { color: "#241F20", aliases: ["NEWCASTLE UNITED", "NEWCASTLE", "MAGPIES", "TOON", "NEW"] },
  { color: "#DD0000", aliases: ["NOTTINGHAM FOREST", "NOTTINGHAM", "FOREST", "NFO"] },
  { color: "#D71920", aliases: ["SOUTHAMPTON", "SAINTS", "SOU"] },
  { color: "#132257", aliases: ["TOTTENHAM", "TOTTENHAM HOTSPUR", "SPURS", "TOT"] },
  { color: "#7A263A", aliases: ["WEST HAM UNITED", "WEST HAM", "HAMMERS", "WHU"] },
  { color: "#FDB913", aliases: ["WOLVERHAMPTON", "WOLVES", "WOLVERHAMPTON WANDERERS", "WOL"] },
  { color: "#EB172B", aliases: ["SUNDERLAND", "BLACK CATS", "SUN"] },
];

export const getEPLTeamColor = (nameOrAbbreviation) => {
  const normalized = normalizeTeamName(nameOrAbbreviation);
  if (!normalized) return null;

  for (const team of EPL_TEAM_COLORS) {
    for (const alias of team.aliases) {
      if (
        normalized === alias ||
        normalized.includes(alias) ||
        normalized.split(" ").includes(alias)
      ) {
        return team.color;
      }
    }
  }

  return null;
};

export const EPL_COLORS = EPL_TEAM_COLORS;

