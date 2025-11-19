/**
 * Orderbook utility functions for fetching and transforming Polymarket orderbook data
 */

/**
 * Fetch orderbook data from Polymarket CLOB API
 * @param {string} tokenId - The token ID from game.polymarket.tokens.yes or .no
 * @returns {Promise<Object>} Orderbook data with bids and asks
 */
export async function fetchOrderbook(tokenId) {
  try {
    const response = await fetch(
      `https://clob.polymarket.com/book?token_id=${tokenId}`
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch orderbook: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching orderbook:", error);
    throw error;
  }
}

/**
 * Transform orderbook data into cumulative depth format for charting
 * @param {Array} bids - Array of {price: string, size: string}
 * @param {Array} asks - Array of {price: string, size: string}
 * @returns {Object} Formatted data with bidsDepth and asksDepth arrays
 */
export function transformOrderbookToDepth(bids, asks) {
  if (!bids || !Array.isArray(bids) || bids.length === 0) {
    bids = [];
  }
  if (!asks || !Array.isArray(asks) || asks.length === 0) {
    asks = [];
  }

  // Sort bids descending (highest price first) and asks ascending (lowest price first)
  const sortedBids = [...bids]
    .map((b) => ({ price: parseFloat(b.price), size: parseFloat(b.size) }))
    .sort((a, b) => b.price - a.price);

  const sortedAsks = [...asks]
    .map((a) => ({ price: parseFloat(a.price), size: parseFloat(a.size) }))
    .sort((a, b) => a.price - b.price);

  // Calculate cumulative depth for bids (from highest price down)
  let cumulativeBids = 0;
  const bidsDepth = sortedBids.map((bid) => {
    cumulativeBids += bid.size;
    return {
      x: bid.price,
      y: cumulativeBids,
      size: bid.size,
    };
  });

  // Calculate cumulative depth for asks (from lowest price up)
  let cumulativeAsks = 0;
  const asksDepth = sortedAsks.map((ask) => {
    cumulativeAsks += ask.size;
    return {
      x: ask.price,
      y: cumulativeAsks,
      size: ask.size,
    };
  });

  return {
    bidsDepth,
    asksDepth,
    bestBid: sortedBids[0]?.price || 0,
    bestAsk: sortedAsks[0]?.price || 1,
  };
}

