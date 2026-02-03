import {
  StyleSheet,
  View,
  Animated,
  PanResponder,
  Easing,
  Text,
} from "react-native";
import React, { useEffect, useRef, useState } from "react";
import { Colors, Spacing, Typography } from "../../constants/theme";
import API_BASE_URL from "../../config/api";

const DEFAULT_HEADLINES = [
  "Lakers beat Warriors 120-115",
  "Chiefs advance to Super Bowl",
  "Yankees sign star pitcher",
  "Heat win in overtime thriller",
  "Cowboys dominate division rivals",
  "Celtics extend winning streak",
  "Packers clinch playoff berth",
  "Dodgers trade for All-Star",
];

export default function Ticker({ items }) {
  const [tickerItems, setTickerItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If items are provided as props, use them directly
    if (items) {
      setTickerItems(items);
      setLoading(false);
      return;
    }

    // Fetch NFL futures data
    const fetchNFLData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/futures/nfl`);
        const data = await response.json();

        console.log('data', data)

        console.log("NFL Futures Data:", data);
        
        if (data.events && data.events.length > 0) {
          // Collect all markets from all events where percentage > 0
          const allMarkets = [];
          
          data.events.forEach(event => {
            if (event.markets && event.markets.length > 0) {
              event.markets.forEach(market => {
                if (market.yesBid) {
                  const price = Math.round(parseFloat(market.yesBid) * 100);
                  // Only include markets with percentage > 0
                  if (price > 0) {
                    allMarkets.push({
                      eventTitle: event.title,
                      marketTitle: market.yesSubTitle,
                      price: price,
                    });
                  }
                }
              });
            }
          });
          
          // Format for display
          const formattedItems = allMarkets.map(market => 
            `${market.eventTitle}: ${market.marketTitle} ${market.price}%`
          );
          
          setTickerItems(formattedItems);
        }
      } catch (error) {
        console.error('Error fetching NFL data:', error);
        setTickerItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNFLData();
  }, [items]);

  const displayItems = items || tickerItems;
  const tickerAnim = useRef(new Animated.Value(0)).current;
  const tickerAnimationRef = useRef(null);
  const dragStartValue = useRef(0);
  const isDragging = useRef(false);

  // 1. DIMENSIONS (Must be consistent for the math to work)
  const ITEM_WIDTH = 320;
  const ITEM_MARGIN = Spacing.xl;
  const TICKER_BOX_WIDTH = ITEM_WIDTH + ITEM_MARGIN;
  const SINGLE_SET_WIDTH = displayItems.length * TICKER_BOX_WIDTH;

  // Speed control: pixels per millisecond (lower = slower)
  const SPEED = 0.04;

  const normalizePosition = (value) => {
    // Normalize to range (-SINGLE_SET_WIDTH, 0]
    if (value > 0) {
      // Positive value (dragged backward) - convert to equivalent negative position
      // Use modulo to wrap it to the negative range
      const mod = value % SINGLE_SET_WIDTH;
      if (mod === 0) {
        return 0;
      }
      return mod - SINGLE_SET_WIDTH;
    } else if (value <= -SINGLE_SET_WIDTH) {
      // Too far negative - wrap around to the valid range
      const mod =
        ((value % SINGLE_SET_WIDTH) + SINGLE_SET_WIDTH) % SINGLE_SET_WIDTH;
      if (mod === 0) {
        return 0;
      }
      return mod - SINGLE_SET_WIDTH;
    }
    // Already in valid range
    return value;
  };

  const startTicker = (startValue) => {
    // Stop any current animation
    if (tickerAnimationRef.current) {
      tickerAnimationRef.current.stop();
      tickerAnimationRef.current = null;
    }

    // Normalize the start position
    const normalizedStart = normalizePosition(startValue);
    tickerAnim.setValue(normalizedStart);

    // Calculate duration based on the distance remaining in this loop
    // If normalizedStart is 0, we want to go the full distance
    const targetValue = -SINGLE_SET_WIDTH;
    const distanceToGo = Math.abs(targetValue - normalizedStart);

    // Ensure we have a valid distance (should always be > 0 unless already at target)
    if (distanceToGo < 1) {
      // Already at target, snap to 0 and restart
      tickerAnim.setValue(0);
      startTicker(0);
      return;
    }

    const duration = Math.max(100, distanceToGo / SPEED);

    tickerAnimationRef.current = Animated.timing(tickerAnim, {
      toValue: targetValue,
      duration: duration,
      easing: Easing.linear,
      useNativeDriver: true,
    });

    tickerAnimationRef.current.start(({ finished }) => {
      if (finished && tickerAnimationRef.current) {
        // When one set finishes, snap back to 0 and loop
        tickerAnim.setValue(0);
        startTicker(0);
      }
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        // Stop animation and capture current position
        isDragging.current = true;
        tickerAnimationRef.current?.stop();
        tickerAnim.stopAnimation((value) => {
          dragStartValue.current = value;
        });
      },
      onPanResponderMove: (evt, gestureState) => {
        if (isDragging.current) {
          // Update position based on drag
          const newValue = dragStartValue.current + gestureState.dx;
          tickerAnim.setValue(newValue);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (isDragging.current) {
          // Get final position after drag
          const finalValue = dragStartValue.current + gestureState.dx;
          isDragging.current = false;
          // Resume animation from final position
          startTicker(finalValue);
        }
      },
    })
  ).current;

  useEffect(() => {
    if (!loading && displayItems.length > 0) {
      startTicker(0);
    }
    return () => tickerAnimationRef.current?.stop();
  }, [displayItems, loading]);

  // Skeleton loader animation
  const skeletonAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (loading) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(skeletonAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(skeletonAnim, {
            toValue: 0,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    }
  }, [loading, skeletonAnim]);

  const skeletonOpacity = skeletonAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  // Show skeleton loader while loading
  if (loading) {
    return (
      <View style={styles.tickerContainer}>
        <View style={styles.tickerContent}>
          {[...Array(5)].map((_, index) => (
            <View key={index} style={[styles.tickerBox, { width: 320 }]}>
              <Animated.View
                style={[
                  styles.skeletonItem,
                  { opacity: skeletonOpacity },
                ]}
              />
            </View>
          ))}
        </View>
      </View>
    );
  }

  // Don't render anything if no items
  if (displayItems.length === 0) {
    return null;
  }

  return (
    <View style={styles.tickerContainer} {...panResponder.panHandlers}>
      <Animated.View
        style={[
          styles.tickerContent,
          {
            width: SINGLE_SET_WIDTH * 2, // Ensure container fits both sets
            transform: [{ translateX: tickerAnim }],
          },
        ]}
      >
        {/* Render two copies of the data side-by-side */}
        {displayItems.concat(displayItems).map((item, index) => (
          <View key={index} style={[styles.tickerBox]}>
            <Text style={styles.tickerText} numberOfLines={1}>
              {item}
            </Text>
          </View>
        ))}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  tickerContainer: {
    height: 20,
    marginBottom: 10,
    bottom: 5,
    overflow: "hidden",
    justifyContent: "center",
  },
  tickerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  tickerBox: {
    marginRight: Spacing.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  tickerText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  skeletonItem: {
    height: 14,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 4,
    width: "80%",
  },
});
