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

