import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Spacing, Typography, BorderRadius } from "../../constants/theme";

export default function SpreadTable({
  spreadEvent,
  awayTeam,
  homeTeam,
  displayPctAway,
  displayPctHome,
  colors = {},
}) {
  if (!spreadEvent || spreadEvent.markets?.length < 2) return null;

  const {
    primaryText = "#FFFFFF",
    tertiaryText = "#9CA3AF",
    iconButtonBg = "rgba(255,255,255,0.06)",
    iconButtonBorder = "rgba(255,255,255,0.08)",
  } = colors;

  const rows = [
    {
      team: awayTeam?.code ?? "—",
      pct: displayPctAway ?? 0,
      spreadMarket: spreadEvent.markets[1],
    },
    {
      team: homeTeam?.code ?? "—",
      pct: displayPctHome ?? 0,
      spreadMarket: spreadEvent.markets[0],
    },
  ];

  return (
    <View
      style={[
        styles.section,
        { backgroundColor: iconButtonBg, borderColor: iconButtonBorder },
      ]}
    >
      <View style={styles.table}>
        <View
          style={[
            styles.tableRow,
            styles.tableHeader,
            { borderColor: iconButtonBorder },
          ]}
        >
          <Text style={[styles.headerTeam, { color: tertiaryText }]}>Team</Text>
          <Text style={[styles.headerCell, { color: tertiaryText }]}>Winner</Text>
          <Text style={[styles.headerCell, { color: tertiaryText }]}>Spread</Text>
        </View>
        {rows.map((row, i) => {
          const raw =
            row.spreadMarket?.yesSubTitle ??
            row.spreadMarket?.subTitle ??
            row.spreadMarket?.title ??
            "";
          const numMatch = raw.match(/([+-]?\d+\.?\d*)/);
          const spreadVal = numMatch ? numMatch[1] : "—";
          return (
            <View
              key={row.team + i}
              style={[styles.tableRow, { borderColor: iconButtonBorder }]}
            >
              <Text style={[styles.teamCode, { color: primaryText }]}>
                {row.team}
              </Text>
              <View
                style={[styles.pill, { borderColor: iconButtonBorder }]}
              >
                <Text style={[styles.pillText, { color: primaryText }]}>
                  {row.pct}%
                </Text>
              </View>
              <View
                style={[styles.pill, { borderColor: iconButtonBorder }]}
              >
                <Text style={[styles.pillText, { color: primaryText }]}>
                  {spreadVal}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  table: {
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    gap: Spacing.sm,
  },
  tableHeader: {
    paddingBottom: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  headerTeam: {
    ...Typography.caption,
    fontSize: 12,
    fontWeight: "600",
    width: 56,
  },
  headerCell: {
    ...Typography.caption,
    fontSize: 12,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
  },
  teamCode: {
    ...Typography.body,
    fontSize: 15,
    fontWeight: "800",
    width: 56,
    letterSpacing: 0.5,
  },
  pill: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  pillText: {
    ...Typography.body,
    fontSize: 14,
    fontWeight: "700",
  },
});
