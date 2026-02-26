import { StyleSheet, View, FlatList, Text, RefreshControl, InteractionManager, useColorScheme, Animated } from 'react-native'
import React, { useEffect, useState, useRef, useCallback, memo } from 'react'
import API_BASE_URL from '../../config/api'
import Market from './Market'
import EventMarket from './EventMarket'

const SKELETON_CARD_COUNT = 5

function MarketSkeletonCard({ pulseAnim, isDark }) {
  const base = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
  return (
    <View style={[skeletonStyles.card, { borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }]}>
      <Animated.View
        style={[
          skeletonStyles.titleBar,
          { backgroundColor: base },
          { opacity: pulseAnim },
        ]}
      />
      <View style={skeletonStyles.headerSub}>
        <Animated.View style={[skeletonStyles.subBar, { backgroundColor: base }, { opacity: pulseAnim }]} />
        <Animated.View style={[skeletonStyles.volBar, { backgroundColor: base }, { opacity: pulseAnim }]} />
      </View>
      {[1, 2, 3].map((i) => (
        <View key={i} style={skeletonStyles.outcomeRow}>
          <Animated.View style={[skeletonStyles.labelBar, { backgroundColor: base }, { opacity: pulseAnim }]} />
          <Animated.View style={[skeletonStyles.pillBar, { backgroundColor: base }, { opacity: pulseAnim }]} />
        </View>
      ))}
    </View>
  )
}

function MarketListSkeleton({ isDark }) {
  const pulse = useRef(new Animated.Value(0.5)).current
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.85, duration: 600, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 600, useNativeDriver: true }),
      ])
    )
    anim.start()
    return () => anim.stop()
  }, [pulse])
  return (
    <View style={skeletonStyles.list}>
      {Array.from({ length: SKELETON_CARD_COUNT }).map((_, i) => (
        <MarketSkeletonCard key={i} pulseAnim={pulse} isDark={isDark} />
      ))}
    </View>
  )
}

function normalizeEventsList(data) {
  if (!data) return []
  if (Array.isArray(data)) return data
  if (Array.isArray(data.events)) return data.events
  if (Array.isArray(data.data)) return data.data
  if (Array.isArray(data.currentEvents)) return data.currentEvents
  return []
}

function parseDate(raw) {
  if (!raw) return null
  if (typeof raw === 'number') return new Date(raw * (raw < 1e12 ? 1000 : 1))
  const normalized = String(raw).replace(' ', 'T').replace(/\+00$/, '+00:00')
  return new Date(normalized)
}

function getEventStartDate(event) {
  const ts =
    event?.polymarket?.gameStartTime ??
    event?.polymarket?.startDate ??
    event?.markets?.[0]?.closeTime ??
    event?.openTime ??
    event?.closeTime ??
    event?.date
  if (!ts) return null
  const d = parseDate(ts)
  return d && !Number.isNaN(d.getTime()) ? d : null
}

function sortByTime(events) {
  const now = Date.now()
  return [...events].sort((a, b) => {
    const aDate = getEventStartDate(a)
    const bDate = getEventStartDate(b)
    const aMs = aDate ? aDate.getTime() : Infinity
    const bMs = bDate ? bDate.getTime() : Infinity
    const aLive = aMs <= now
    const bLive = bMs <= now

    if (aLive && !bLive) return -1
    if (!aLive && bLive) return 1
    if (aLive && bLive) return aMs - bMs
    return aMs - bMs
  })
}

function MarketList({ sportSlug = 'nba', fetchUrl }) {
  const scheme = useColorScheme()
  const isDark = scheme !== 'light'
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const cacheRef = useRef(new Map())

  const url = fetchUrl != null && fetchUrl !== '' ? fetchUrl : `${API_BASE_URL}/api/games/${sportSlug}`
  const cacheKey = url
  const listData = cacheRef.current.get(cacheKey) ?? events

  const fetchGames = useCallback(async (forceRefresh = false) => {
    if (forceRefresh) {
      setRefreshing(true)
      cacheRef.current.delete(cacheKey)
    } else if (cacheRef.current.has(cacheKey)) {
      setEvents(cacheRef.current.get(cacheKey))
      setLoading(false)
      return
    } else {
      setLoading(true)
      setEvents([])
    }
    try {
      const response = await fetch(url)
      const data = await response.json()
      const raw = normalizeEventsList(data)
      const list = sortByTime(raw)
      cacheRef.current.set(cacheKey, list)
      setEvents(list)
    } catch (err) {
      console.error('Failed to fetch list:', err)
      setEvents([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [url, cacheKey])

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      fetchGames(false)
    })
    return () => task.cancel()
  }, [cacheKey, fetchGames])

  const onRefresh = useCallback(() => {
    fetchGames(true)
  }, [fetchGames])

  const isGameMarket = useCallback((event) => {
    const title = event?.title ?? ''
    const hasGamePattern = /\s+at\s+/i.test(title) || /\s+vs\.?\s+/i.test(title)
    const hasTwoMarkets = event?.markets?.length === 2
    return hasTwoMarkets && hasGamePattern
  }, [])

  const renderItem = useCallback(({ item }) => {
    if (isGameMarket(item)) {
      return (
        <Market
          event={item}
          title={item?.title ?? '—'}
          ticker={item?.ticker ?? item?.id ?? '—'}
          chartData={item?.chartData ?? item?.markets?.[0]?.chartData}
          selected={false}
          sportSlug={sportSlug}
        />
      )
    }
    return (
      <EventMarket
        event={item}
        title={item?.title ?? '—'}
        sportSlug={sportSlug}
      />
    )
  }, [isGameMarket, sportSlug])

  const keyExtractor = useCallback((item) => item?.id ?? item?.ticker ?? String(item?.title ?? Math.random()), [])

  const listEmptyComponent = useCallback(
    () =>
      loading ? (
        <MarketListSkeleton isDark={isDark} />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: isDark ? 'rgba(255, 255, 255, 0.6)' : '#6B7280' }]}>
            There are no active markets at the moment
          </Text>
        </View>
      ),
    [loading, isDark]
  )

  return (
    <View style={styles.container}>
      <FlatList
        data={listData}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={listData.length === 0 ? styles.listContentEmpty : styles.listContent}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={5}
        ListEmptyComponent={listEmptyComponent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={isDark ? "rgba(255, 255, 255, 0.7)" : "#6B7280"}
          />
        }
      />
    </View>
  )
}

const BOTTOM_TAB_HEIGHT = 70

const skeletonStyles = StyleSheet.create({
  list: {
    flexGrow: 1,
    paddingVertical: 8,
    paddingBottom: BOTTOM_TAB_HEIGHT,
  },
  card: {
    borderRadius: 12,
    marginHorizontal: 10,
    marginVertical: 8,
    padding: 14,
    borderWidth: 1,
  },
  titleBar: {
    height: 20,
    borderRadius: 4,
    width: '85%',
    marginBottom: 10,
  },
  headerSub: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  subBar: {
    height: 12,
    borderRadius: 4,
    width: 72,
  },
  volBar: {
    height: 12,
    borderRadius: 4,
    width: 64,
  },
  outcomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  labelBar: {
    height: 16,
    borderRadius: 4,
    flex: 1,
    marginRight: 12,
  },
  pillBar: {
    height: 36,
    borderRadius: 80,
    minWidth: 56,
  },
})

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: {
    paddingVertical: 8,
    paddingBottom: BOTTOM_TAB_HEIGHT,
  },
  listContentEmpty: {
    flexGrow: 1,
    paddingVertical: 8,
    paddingBottom: BOTTOM_TAB_HEIGHT,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
})

export default memo(MarketList)
