import React from "react";
import EventCard from "../market/EventCard";
import GameCard from "../market/GameCard";

/**
 * TrendingCard: Renders based on event market count.
 * - More than 2 markets → EventCard (multi-outcome event)
 * - 2 or fewer markets → GameCard (binary / two-team matchup)
 */
export default function TrendingCard({ event, competitionFallback }) {
  const marketCount = event?.markets?.length ?? 0;
  const useEventCardStyle = marketCount > 2;

  if (useEventCardStyle) {
    return <EventCard event={event} />;
  }

  return (
    <GameCard
      event={event}
      competitionFallback={competitionFallback}
    />
  );
}
