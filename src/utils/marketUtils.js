/**
 * Utility functions for market data processing
 */

import { formatPercent } from "./formatters";

export function getFriendlyOutcomeLabels(game) {
  const outcomes = Array.isArray(game?.outcomes) ? game.outcomes : [];
  if (outcomes.length >= 2) {
    return { yesLabel: outcomes[0], noLabel: outcomes[1] };
  }
  const question = game?.question;
  if (
    typeof question === "string" &&
    question.toLowerCase().startsWith("will ")
  ) {
    const cleaned = question.replace(/^Will\s+/i, "").replace(/\?$/, "");
    return {
      yesLabel: cleaned,
      noLabel: `Not ${cleaned}`,
    };
  }
  return { yesLabel: "Yes", noLabel: "No" };
}

export function getMarketLean(yesPrice, noPrice, yesLabel, noLabel) {
  const hasYes = typeof yesPrice === "number";
  const hasNo = typeof noPrice === "number";

  if (!hasYes && !hasNo) {
    return {
      label: "No trades yet",
      percent: null,
    };
  }

  const isYesFavorite = (yesPrice ?? 0) >= (noPrice ?? 0);
  const topLabel = isYesFavorite ? yesLabel : noLabel;
  const topPrice = isYesFavorite ? yesPrice : noPrice;

  return {
    label: topLabel,
    percent: typeof topPrice === "number" ? formatPercent(topPrice) : null,
  };
}

export function filterGames(games, query) {
  if (!query) return games;
  return games.filter((game) => matchesQuery(game, query));
}

export function matchesQuery(game, query) {
  if (!query) return true;
  const parts = [
    game?.question,
    game?.slug,
    game?.sport,
    ...(Array.isArray(game?.outcomes) ? game.outcomes : []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return parts.includes(query);
}














