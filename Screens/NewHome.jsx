import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  useColorScheme,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import Header from '../src/components/ui/Header'
import MarketList from '../src/components/market/MarketList'
import Ticker from '../src/components/ui/Ticker'
import API_BASE_URL from '../src/config/api'

const THEMES = {
  dark: {
    bg: '#000000',
    tabBorder: 'rgba(255, 255, 255, 0.1)',
    tabLabel: 'rgba(255, 255, 255, 0.7)',
    tabLabelActive: '#FFFFFF',
    indicator: '#FFFFFF',
  },
  light: {
    bg: '#FFFFFF',
    tabBorder: 'rgba(0, 0, 0, 0.08)',
    tabLabel: '#6B7280',
    tabLabelActive: '#111827',
    indicator: '#111827',
  },
}

const { width: SCREEN_WIDTH } = Dimensions.get('window')

const SPORT_CATEGORIES = [
  { slug: 'nba', label: 'NBA' },
  { slug: 'nfl', label: 'NFL' },
  { slug: 'mlb', label: 'MLB' },
  { slug: 'nhl', label: 'NHL' },
  { slug: 'MMA', label: 'MMA' },
  { slug: 'boxing', label: 'Boxing' },
  { slug: 'epl', label: 'EPL' },
  { slug: 'ncaamb', label: 'NCAAM' },
  { slug: 'ncaaf', label: 'NCAAF' },
]

// Map carousel slug to API competition name (from /api/sports-filters filtersBySports)
const SLUG_TO_COMPETITION = {
  nba: 'Pro Basketball (M)',
  nfl: 'Pro Football',
  mlb: 'Pro Baseball',
  nhl: 'Pro Hockey',
  MMA: 'UFC',
  boxing: 'Boxing',
  epl: 'EPL',
  ncaamb: 'College Basketball (M)',
  ncaaf: 'College Football',
}

function getScopesForSlug(sportsFilters, slug) {
  if (!sportsFilters?.filtersBySports) return []
  const competitionName = SLUG_TO_COMPETITION[slug]
  if (!competitionName) return []
  for (const sportData of Object.values(sportsFilters.filtersBySports)) {
    const comp = sportData.competitions?.[competitionName]
    if (comp?.scopes?.length) return comp.scopes
  }
  return []
}

function buildScopeApiUrl(baseUrl, slug, scope) {
  const s = encodeURIComponent(scope || 'Games')
  return `${baseUrl}/api/v1/sports/${slug}/events?scope=${s}`
}

export default function NewHome() {
  const scheme = useColorScheme()
  const t = scheme === 'light' ? THEMES.light : THEMES.dark
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [selectedScope, setSelectedScope] = useState('Games')
  const [sportsFilters, setSportsFilters] = useState(null)
  const pagerRef = useRef(null)

  // Animated sliding underline for category tabs
  const tabLayouts = useRef({})
  const indicatorX = useRef(new Animated.Value(0)).current
  const indicatorW = useRef(new Animated.Value(0)).current

  const animateIndicator = useCallback((index) => {
    const layout = tabLayouts.current[index]
    if (!layout) return
    Animated.parallel([
      Animated.spring(indicatorX, { toValue: layout.x, useNativeDriver: false, friction: 8, tension: 80 }),
      Animated.spring(indicatorW, { toValue: layout.width, useNativeDriver: false, friction: 8, tension: 80 }),
    ]).start()
  }, [indicatorX, indicatorW])

  useEffect(() => {
    animateIndicator(selectedIndex)
  }, [selectedIndex, animateIndicator])

  useEffect(() => {
    let cancelled = false
    fetch(`${API_BASE_URL}/api/sports-filters`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setSportsFilters(data)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  const activeScopes = useMemo(() => {
    const slug = SPORT_CATEGORIES[selectedIndex]?.slug
    return slug ? getScopesForSlug(sportsFilters, slug) : []
  }, [sportsFilters, selectedIndex])

  const fetchUrlForSport = useCallback(
    (slug) => buildScopeApiUrl(API_BASE_URL, slug, selectedScope),
    [selectedScope]
  )

  const setScopeToFirstForIndex = useCallback(() => {
    setSelectedScope('Games')
  }, [])

  useEffect(() => {
    if (activeScopes.length > 0 && selectedScope === null) {
      setSelectedScope(activeScopes[0])
    }
  }, [activeScopes, selectedScope])

  const onSelectCategory = useCallback((index) => {
    setSelectedIndex(index)
    setScopeToFirstForIndex(index)
    pagerRef.current?.scrollTo({
      x: index * SCREEN_WIDTH,
      animated: true,
    })
  }, [setScopeToFirstForIndex])

  const onMomentumScrollEnd = useCallback((e) => {
    const x = e.nativeEvent.contentOffset.x
    const index = Math.round(x / SCREEN_WIDTH)
    const clamped = Math.max(0, Math.min(index, SPORT_CATEGORIES.length - 1))
    setSelectedIndex(clamped)
    setScopeToFirstForIndex(clamped)
  }, [setScopeToFirstForIndex])

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: t.bg }]}>
      <Header />
      <Ticker />
      <View style={[styles.carouselWrapper, { borderBottomColor: t.tabBorder }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.carouselContent}
        >
          {SPORT_CATEGORIES.map((cat, index) => {
            const isSelected = selectedIndex === index
            return (
              <TouchableOpacity
                key={cat.slug}
                style={styles.categoryTab}
                onPress={() => onSelectCategory(index)}
                activeOpacity={0.7}
                onLayout={(e) => {
                  const { x, width } = e.nativeEvent.layout
                  tabLayouts.current[index] = { x, width }
                  if (index === selectedIndex) animateIndicator(index)
                }}
              >
                <Text style={[styles.categoryLabel, { color: isSelected ? t.tabLabelActive : t.tabLabel }]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            )
          })}
          <Animated.View
            style={[
              styles.tabIndicator,
              { left: indicatorX, width: indicatorW, backgroundColor: t.indicator },
            ]}
          />
        </ScrollView>
      </View>
      {/* Scopes carousel hidden — always fetch "Games" */}
      <ScrollView
        ref={pagerRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumScrollEnd}
        keyboardShouldPersistTaps="handled"
        bounces={false}
        style={styles.pager}
        contentContainerStyle={styles.pagerContent}
      >
        {SPORT_CATEGORIES.map((cat, index) => {
          const isNearby = Math.abs(index - selectedIndex) <= 1
          return (
            <View key={cat.slug} style={[styles.page, { width: SCREEN_WIDTH }]}>
              {isNearby ? (
                <MarketList
                  sportSlug={cat.slug}
                  fetchUrl={fetchUrlForSport(cat.slug)}
                />
              ) : null}
            </View>
          )
        })}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  carouselWrapper: {
    borderBottomWidth: 1,
  },
  carouselContent: {
    paddingHorizontal: 16,
  },
  categoryTab: {
    marginRight: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    height: 2,
    borderRadius: 1,
  },
  pager: {
    flex: 1,
  },
  pagerContent: {},
  page: {
    flex: 1,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
})
