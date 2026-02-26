import { StyleSheet, Text, View, TouchableOpacity, useColorScheme } from "react-native";
import React, { useMemo, memo, useState, useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import { formatCurrency } from "../../utils/formatters";
import { getNFLTeamColor, getNBATeamColor, getEPLTeamColor } from "../../constants/teamColors";
import SoccerIcon from "../ui/SoccerIcon";

const DARK = {
  cardBorder: "rgba(255, 255, 255, 0.08)",
  title: "#FFFFFF",
  subtitle: "rgba(255, 255, 255, 0.6)",
  outcomeLabel: "#FFFFFF",
  pillBorder: "rgba(255, 255, 255, 0.25)",
  pillText: "#FFFFFF",
  ticker: "rgba(255, 255, 255, 0.7)",
};
const LIGHT = {
  cardBorder: "rgba(0, 0, 0, 0.10)",
  title: "#111827",
  subtitle: "#6B7280",
  outcomeLabel: "#111827",
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
    if (diff < -14400000) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [eventDate]);

  if (!eventDate) return { label: "—", isLive: false };
  const diff = eventDate.getTime() - now;
  if (diff <= 0) return { label: "LIVE", isLive: true };
  return { label: formatCountdown(diff), isLive: false };
}

function pctFromMarket(m) {
  if (!m) return null;
  const bid = parseFloat(m.yesBid);
  const ask = parseFloat(m.yesAsk);
  const b = Number.isFinite(bid) ? bid : 0;
  const a = Number.isFinite(ask) ? ask : 0;
  const val = b && a ? (b + a) / 2 : b || a;
  return val > 0 ? Math.round(val * 100) : null;
}

function EventMarket({ event, title, value, sportSlug }) {
  const scheme = useColorScheme();
  const t = scheme === "light" ? LIGHT : DARK;
  const navigation = useNavigation();

  const isEPL = useMemo(() => {
    const hints = [
      event?.competition,
      event?.league,
      event?.sport,
      event?.seriesTicker,
      event?.ticker,
    ]
      .filter(Boolean)
      .join(" ");
    return /epl|premier\s*league|english\s*premier|EPL|KXEPL|soccer|football\s*premier/i.test(hints) || sportSlug === "epl" || sportSlug === "soccer";
  }, [event?.competition, event?.league, event?.sport, event?.seriesTicker, event?.ticker, sportSlug]);

  const model = useMemo(() => {
    if (!event) return null;
    const rawTitle = title ?? event.title ?? event.question ?? event.name ?? "—";
    const kalshiVol = Number(value ?? event.volume ?? event.volume24hr ?? event.totalVolume ?? 0);
    const polyVol = Number(event.polymarket?.volume ?? 0);
    const volume = (Number.isFinite(kalshiVol) ? kalshiVol : 0) + (Number.isFinite(polyVol) ? polyVol : 0);
    const markets = Array.isArray(event.markets) ? event.markets : [];
    const outcomes = markets
      .map((m) => {
        const label = m?.yesSubTitle ?? m?.noSubTitle ?? m?.title ?? m?.question ?? "—";
        const pct = pctFromMarket(m);
        return { label, pct };
      })
      .filter((o) => o.pct != null && o.pct >= 0)
      .sort((a, b) => (b.pct ?? 0) - (a.pct ?? 0))
      .slice(0, 5);
    return { title: rawTitle, volume, outcomes };
  }, [event, title, value]);

  const eventStartDate = useMemo(() => getEventStartDate(event), [event]);
  const { label: countdownLabel, isLive } = useCountdown(eventStartDate);

  const getColorForLabel = (label, index) => {
    const hints = [
      event?.competition,
      event?.seriesTicker,
      event?.ticker,
      event?.league,
      event?.sport,
    ]
      .filter(Boolean)
      .join(" ");
    const isNFL = /nfl|KXNFL/i.test(hints);
    const isNBA = /nba|KXNBA/i.test(hints);
    const isEPLHints = /epl|premier\s*league|english\s*premier|EPL|KXEPL|soccer|football\s*premier/i.test(hints) || sportSlug === "epl" || sportSlug === "soccer";
    if (isNFL) return getNFLTeamColor(label) || getNFLTeamColor(label?.split(" ")[0]);
    if (isNBA) return getNBATeamColor(label) || getNBATeamColor(label?.split(" ")[0]);
    if (isEPLHints) return getEPLTeamColor(label) || getEPLTeamColor(label?.split(" ")[0]);
    const defaults = ["#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6"];
    return defaults[index % defaults.length];
  };

  if (!model) return null;

  const onPress = () => {
    if (event) navigation.navigate("Chart", { event });
  };

  return (
    <TouchableOpacity
      style={[styles.container, { borderColor: t.cardBorder }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: t.title }]} numberOfLines={2}>
          {model.title}
        </Text>
      </View>
      <View style={styles.headerSub}>
        {isLive ? (
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        ) : (
          <Text style={[styles.eventDate, { color: t.subtitle }]}>{countdownLabel}</Text>
        )}
        <Text style={[styles.volumeText, { color: t.subtitle }]}>{formatCurrency(model.volume)} Vol.</Text>
      </View>
      {model.outcomes.length > 0 ? (
        <View style={styles.outcomes}>
          {model.outcomes.map((outcome, idx) => {
            const teamColor = getColorForLabel(outcome.label, idx);
            const isTie = /^tie$/i.test(String(outcome.label).trim());
            const showSoccerIcon = isEPL && !isTie && teamColor;
            return (
              <View key={idx} style={styles.outcomeRow}>
                <View style={styles.outcomeLabelRow}>
                  {showSoccerIcon ? (
                    <SoccerIcon
                      size={22}
                      bgColor={teamColor}
                      iconColor="white"
                    />
                  ) : null}
                  <Text style={[styles.outcomeLabel, { color: t.outcomeLabel }]} numberOfLines={1}>
                    {outcome.label}
                  </Text>
                </View>
                <View
                  style={[
                    styles.percentPill,
                    { borderColor: t.pillBorder },
                    showSoccerIcon && teamColor ? { backgroundColor: teamColor, borderColor: teamColor } : undefined,
                  ]}
                >
                  <Text
                    style={[
                      styles.percentPillText,
                      { color: showSoccerIcon && teamColor ? "#FFFFFF" : t.pillText },
                    ]}
                  >
                    {outcome.pct}%
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      ) : (
        <View style={styles.volumeOnly}>
          <Text style={[styles.ticker, { color: t.ticker }]}>Volume: {formatCurrency(model.volume)}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    marginHorizontal: 10,
    marginVertical: 8,
    padding: 14,
    borderWidth: 1,
  },
  header: {
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  headerSub: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  eventDate: {
    fontSize: 12,
  },
  volumeText: {
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
  outcomes: {
    gap: 10,
  },
  outcomeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  outcomeLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
    gap: 8,
  },
  outcomeLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
  },
  percentPill: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 80,
    minWidth: 56,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  percentPillText: {
    fontSize: 14,
    fontWeight: "700",
  },
  volumeOnly: {
    marginBottom: 8,
  },
  ticker: {
    fontSize: 12,
  },
});

export default memo(EventMarket);
