import { StyleSheet, Text, View, TouchableOpacity, useColorScheme } from "react-native";
import React, { useMemo, memo, useState, useEffect, useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import MarketLineChart from "./MarketLineChart";
import { formatCurrency } from "../../utils/formatters";
import { getNFLTeamColor, getNBATeamColor, getNHLTeamColor, getNCAABTeamColor, getEPLTeamColor } from "../../constants/teamColors";
import BasketballIcon from "../ui/BasketballIcon";
import IceHockeyIcon from "../ui/IceHockeyIcon";
import SoccerIcon from "../ui/SoccerIcon";

const DARK = {
  cardBorder: "rgba(255, 255, 255, 0.08)",
  title: "#FFFFFF",
  subtitle: "rgba(255, 255, 255, 0.6)",
  teamName: "#FFFFFF",
  pillBorder: "rgba(255, 255, 255, 0.25)",
  pillText: "#FFFFFF",
  ticker: "rgba(255, 255, 255, 0.7)",
};
const LIGHT = {
  cardBorder: "rgba(0, 0, 0, 0.10)",
  title: "#111827",
  subtitle: "#6B7280",
  teamName: "#111827",
  pillBorder: "rgba(0, 0, 0, 0.15)",
  pillText: "#111827",
  ticker: "#6B7280",
};

function parseDate(raw) {
  if (!raw) return null;
  if (typeof raw === "number") return new Date(raw * (raw < 1e12 ? 1000 : 1));
  const normalized = String(raw).replace(" ", "T").replace(/\+00$/, "+00:00");
  return new Date(normalized);
}

function getEventStartDate(event) {
  const ts =
    event?.polymarket?.gameStartTime ??
    event?.polymarket?.startDate ??
    event?.markets?.[0]?.closeTime ??
    event?.openTime ??
    event?.closeTime ??
    event?.date;
  if (!ts) return null;
  const d = parseDate(ts);
  return d && !Number.isNaN(d.getTime()) ? d : null;
}

function formatCountdown(diffMs) {
  if (diffMs <= 0) return null;
  const totalSec = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSec / 86400);
  const hrs = Math.floor((totalSec % 86400) / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  const pad = (n) => String(n).padStart(2, "0");

  if (days > 0) return `${days}d ${hrs}h ${pad(mins)}m`;
  if (hrs > 0) return `${hrs}h ${pad(mins)}m ${pad(secs)}s`;
  return `${mins}m ${pad(secs)}s`;
}

function useCountdown(eventDate) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!eventDate) return;
    const diff = eventDate.getTime() - Date.now();
    if (diff < -14400000) return; // don't tick for events started >4h ago
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [eventDate]);

  if (!eventDate) return { label: "—", isLive: false };
  const diff = eventDate.getTime() - now;
  if (diff <= 0) return { label: "LIVE", isLive: true };
  return { label: formatCountdown(diff), isLive: false };
}

function Market({
  title = "Will Houston win at Charlotte?",
  value,
  chartData,
  selected = false,
  event,
  sportSlug,
}) {
  const scheme = useColorScheme();
  const t = scheme === "light" ? LIGHT : DARK;
  const volumeDisplay = useMemo(() => {
    if (value !== undefined && value !== null) return value;
    if (!event) return "—";
    const kalshiVol = Number(event.volume ?? event.volume24hr ?? event.totalVolume ?? 0);
    const polyVol = Number(event.polymarket?.volume ?? 0);
    const total = (Number.isFinite(kalshiVol) ? kalshiVol : 0) + (Number.isFinite(polyVol) ? polyVol : 0);
    return formatCurrency(total);
  }, [event, value]);

  const teamsAndPrices = useMemo(() => {
    if (!event?.markets?.length) return null;
    let awayName = "Away";
    let homeName = "Home";
    if (event.markets.length >= 2) {
      homeName = event.markets[0]?.yesSubTitle ?? homeName;
      awayName = event.markets[1]?.yesSubTitle ?? awayName;
    }
    if (event.title) {
      const atMatch = event.title.match(/(.+?)\s+at\s+(.+)/i);
      if (atMatch) {
        awayName = atMatch[1].trim();
        homeName = atMatch[2].trim();
      } else {
        const vsMatch = event.title.match(/(.+?)\s+vs\.?\s+(.+)/i);
        if (vsMatch) {
          awayName = vsMatch[1].trim();
          homeName = vsMatch[2].trim();
        }
      }
    }
    const abbr = (name) =>
      name.replace(/\s/g, "").substring(0, 3).toUpperCase() || "—";
    const m0 = event.markets[0];
    const m1 = event.markets[1];
    const pct = (m) => {
      if (!m) return 0;
      const bid = parseFloat(m.yesBid);
      const ask = parseFloat(m.yesAsk);
      const b = Number.isFinite(bid) ? bid : 0;
      const a = Number.isFinite(ask) ? ask : 0;
      const val = b && a ? (b + a) / 2 : b || a;
      return Math.round(val * 100);
    };
    const sub = (m) => (m?.yesSubTitle ?? m?.noSubTitle ?? "").trim();
    const matchesTeam = (subStr, teamName) =>
      subStr && teamName && (subStr === teamName || teamName.includes(subStr) || subStr.includes(teamName));
    const m0Sub = sub(m0);
    const m1Sub = sub(m1);
    const m0MatchesHome = matchesTeam(m0Sub, homeName);
    const m1MatchesHome = matchesTeam(m1Sub, homeName);
    const priceHome =
      m0MatchesHome && !m1MatchesHome ? pct(m0) : m1MatchesHome && !m0MatchesHome ? pct(m1) : pct(m0);
    const priceAway =
      m0MatchesHome && !m1MatchesHome ? pct(m1) : m1MatchesHome && !m0MatchesHome ? pct(m0) : pct(m1);
    const hints = [
      event?.competition,
      event?.league,
      event?.sport,
      event?.ticker,
      event?.seriesTicker,
    ]
      .filter(Boolean)
      .join(" ");
    const isNFL = /nfl|KXNFL/i.test(hints);
    const isNBA = /nba|KXNBAGAME/i.test(hints);
    const isNHL = /nhl|KXNHL/i.test(hints);
    const isNCAAB = /ncaab|ncaa|college\s*basketball|march\s*madness|KXNCAAB/i.test(hints);
    const isEPL = /epl|premier\s*league|english\s*premier|EPL|KXEPL|soccer|football\s*premier/i.test(hints);
    const homeAbbr = abbr(homeName);
    const awayAbbr = abbr(awayName);
    let awayColor = "#EF4444";
    let homeColor = "#3B82F6";
    if (isNFL) {
      awayColor = getNFLTeamColor(awayName) || getNFLTeamColor(awayAbbr) || awayColor;
      homeColor = getNFLTeamColor(homeName) || getNFLTeamColor(homeAbbr) || homeColor;
    }
    if (isNBA) {
      awayColor = getNBATeamColor(awayName) || getNBATeamColor(awayAbbr) || awayColor;
      homeColor = getNBATeamColor(homeName) || getNBATeamColor(homeAbbr) || homeColor;
    }
    if (isNHL) {
      awayColor = getNHLTeamColor(awayName) || getNHLTeamColor(awayAbbr) || awayColor;
      homeColor = getNHLTeamColor(homeName) || getNHLTeamColor(homeAbbr) || homeColor;
    }
    if (isNCAAB) {
      awayColor = getNCAABTeamColor(awayName) || getNCAABTeamColor(awayAbbr) || awayColor;
      homeColor = getNCAABTeamColor(homeName) || getNCAABTeamColor(homeAbbr) || homeColor;
    }
    if (isEPL) {
      awayColor = getEPLTeamColor(awayName) || getEPLTeamColor(awayAbbr) || awayColor;
      homeColor = getEPLTeamColor(homeName) || getEPLTeamColor(homeAbbr) || homeColor;
    }
    const pmRecords = event?.polymarket?.teamRecords ?? {};
    const awayRecord =
      pmRecords[awayName] ??
      event?.markets?.[1]?.record ??
      event?.markets?.[1]?.teamRecord ??
      null;
    const homeRecord =
      pmRecords[homeName] ??
      event?.markets?.[0]?.record ??
      event?.markets?.[0]?.teamRecord ??
      null;
    return {
      awayName,
      homeName,
      awayAbbr,
      homeAbbr,
      priceAway,
      priceHome,
      awayColor,
      homeColor,
      awayRecord,
      homeRecord,
      isNBA,
      isNHL,
      isNCAAB,
      isEPL,
    };
  }, [event]);

  const showBasketballIcon = teamsAndPrices?.isNBA || teamsAndPrices?.isNCAAB || sportSlug === "nba" || sportSlug === "ncaab";
  const showHockeyIcon = teamsAndPrices?.isNHL || sportSlug === "nhl";
  const showSoccerIcon = teamsAndPrices?.isEPL || sportSlug === "epl" || sportSlug === "soccer";
  const SportIcon = showBasketballIcon ? BasketballIcon : showHockeyIcon ? IceHockeyIcon : showSoccerIcon ? SoccerIcon : null;

  const eventStartDate = useMemo(() => getEventStartDate(event), [event]);
  const { label: countdownLabel, isLive } = useCountdown(eventStartDate);
  const navigation = useNavigation();

  const onPress = () => {
    if (event) navigation.navigate("Chart", { event });
  };

  return (
    <TouchableOpacity
      style={[styles.container, { borderColor: t.cardBorder }, selected && styles.containerSelected]}
      onPress={onPress}
      activeOpacity={0.85}
    >

      <Text style={[styles.title, { color: t.title }]} numberOfLines={1}>{title}</Text>
      <View style={styles.header}>
    
        <View style={styles.headerSub}>
          {isLive ? (
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          ) : (
            <Text style={[styles.subtitle, { color: t.subtitle }]}>{countdownLabel}</Text>
          )}
          <Text style={[styles.subtitle, { color: t.subtitle }]}>{volumeDisplay} Vol.</Text>
        </View>
      </View>

      {teamsAndPrices ? (
        <View style={styles.teamRows}>
          <View style={styles.teamRow}>
            <View style={styles.teamInfo}>
              {SportIcon ? (
                <View style={styles.teamNameRow}>
                  <View style={{ bottom: 0 }}>
                  <SportIcon
                    size={24}
                    bottom={5}
                    bgColor={teamsAndPrices.homeColor}
                    iconColor="white"
                  />
                  </View>
                  <View>
                    <Text style={[styles.teamName, { color: t.teamName }]} numberOfLines={1}>
                      {teamsAndPrices.homeName}
                    </Text>
                    {/* {teamsAndPrices.homeRecord ? (
                      <Text style={[styles.teamRecord, { color: t.subtitle }]}>
                        {teamsAndPrices.homeRecord}
                      </Text>
                    ) : null} */}
                  </View>
                </View>
              ) : (
                <>
                  <Text style={[styles.teamName, { color: t.teamName }]} numberOfLines={1}>
                    {teamsAndPrices.homeName}
                  </Text>
                  {/* {teamsAndPrices.homeRecord ? (
                    <Text style={[styles.teamRecord, { color: t.subtitle }]}>
                      {teamsAndPrices.homeRecord}
                    </Text>
                  ) : null} */}
                </>
              )}
            </View>
            <TouchableOpacity
              style={[styles.percentButton, { borderColor: t.pillBorder }]}
              onPress={(e) => {
                e?.stopPropagation?.();
                if (event) navigation.navigate("Chart", { event });
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.percentButtonText, { color: t.pillText }]}>
                {teamsAndPrices.priceHome}%
              </Text>
            </TouchableOpacity>
          </View>
          

          <View style={{top: 20}}>

          <View style={styles.teamRow}>
            <View style={styles.teamInfo}>
              {SportIcon ? (
                <View style={styles.teamNameRow}>
                  <View style={{ bottom: 0 }}>
                  <SportIcon
                    size={24}
                    bgColor={teamsAndPrices.awayColor}
                    iconColor="white"
                  />
                  </View>
                  <View>
                    <Text style={[styles.teamName, { color: t.teamName }]} numberOfLines={1}>
                      {teamsAndPrices.awayName}
                    </Text>
                    {/* {teamsAndPrices.awayRecord ? (
                      <Text style={[styles.teamRecord, { color: t.subtitle }]}>
                        {teamsAndPrices.awayRecord}
                      </Text>
                    ) : null} */}
                  </View>
                </View>
              ) : (
                <>
                  <Text style={[styles.teamName, { color: t.teamName }]} numberOfLines={1}>
                    {teamsAndPrices.awayName}
                  </Text>
                  {/* {teamsAndPrices.awayRecord ? (
                    <Text style={[styles.teamRecord, { color: t.subtitle }]}>
                      {teamsAndPrices.awayRecord}
                    </Text>
                  ) : null} */}
                </>
              )}
            </View>
            <TouchableOpacity
              style={[styles.percentButton, { borderColor: t.pillBorder }]}
              onPress={(e) => {
                e?.stopPropagation?.();
                if (event) navigation.navigate("Chart", { event });
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.percentButtonText, { color: t.pillText }]}>
                {teamsAndPrices.priceAway}%
              </Text>
            </TouchableOpacity>
          </View>

            
          </View>
        </View>
      ) : (
        <View style={styles.volumeOnly}>
          <Text style={[styles.ticker, { color: t.ticker }]}>Volume: {volumeDisplay}</Text>
        </View>
      )}

      {selected && <View style={styles.indicator} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    marginHorizontal: 10,
    marginVertical: 8,
    padding: 14,
    position: "relative",
    borderWidth: 1,
  },
  containerSelected: {
    borderRightWidth: 3,
    borderRightColor: "#3B82F6",
  },
  header: {
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  headerSub: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
    marginBottom: 10,
    top: 5,
  },
  subtitle: {
    fontSize: 12,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#EF4444",
    marginRight: 5,
  },
  liveText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#EF4444",
    letterSpacing: 0.5,
  },
  teamRows: {
    marginBottom: 12,
  },
  teamRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  teamInfo: {
    flex: 1,
  },
  teamNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  teamName: {
    fontSize: 15,
    fontWeight: "700",
  },
  teamRecord: {
    fontSize: 12,
    marginTop: 2,
  },
  percentButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 80,
    minWidth: 56,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  percentButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },
  volumeOnly: {
    marginBottom: 8,
  },
  ticker: {
    fontSize: 12,
  },
  indicator: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: "#3B82F6",
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
});

export default memo(Market);
