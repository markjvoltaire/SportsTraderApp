import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Colors, Spacing, Typography } from "../../constants/theme";
import { formatPercent, formatPrice, formatSharePrice } from "../../utils/formatters";

export default function OutcomeColumn({
  label,
  description,
  price,
  bid,
  color,
  align = "flex-start",
  helper,
}) {
  const sharePrice = formatSharePrice(price);
  const percent = formatPercent(price);

  return (
    <View style={[styles.container, { alignItems: align }]}>
      <Text style={[styles.label, { color }]}>{label}</Text>
      {description ? (
        <Text style={styles.description}>{description}</Text>
      ) : null}
      <Text style={styles.price}>{sharePrice}</Text>
      <Text style={styles.subline}>{percent} implied odds</Text>
      <Text style={styles.bid}>Best bid {formatPrice(bid)}</Text>
      {helper ? <Text style={styles.helper}>{helper}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  label: {
    ...Typography.caption,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontWeight: "600",
  },
  description: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
    marginBottom: Spacing.xs,
  },
  price: {
    fontSize: 32,
    fontWeight: "700",
    color: Colors.textPrimary,
    lineHeight: 36,
    marginVertical: Spacing.xs,
  },
  subline: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  bid: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  helper: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
    fontSize: 11,
  },
});

