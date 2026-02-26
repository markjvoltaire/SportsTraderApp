import { StyleSheet, Text, View, Image, useColorScheme } from 'react-native'
import React from 'react'

const logoWhite = require('../../../assets/images/whiteTrade.png')
const logoBlack = require('../../../assets/images/blackTrade.png')
const discordWhite = require('../../../assets/images/discord.png')
const discordBlack = require('../../../assets/images/DiscordBlack.png')

export default function Header() {
  const isDark = useColorScheme() !== 'light'

  return (
    <View style={styles.container}>
        <View style={styles.leftContainer}>
            <Image source={isDark ? logoWhite : logoBlack} style={styles.logo} />
            <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#111827' }]}>Scoretrade</Text>
        </View>
        <View style={styles.rightContainer}>
            <Image source={isDark ? discordWhite : discordBlack} style={styles.discord} />
        </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    marginBottom: 16,
  },
  logo: {
    width: 20,
    height: 20,
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  discord: {
    width: 28,
    height: 28,
    marginRight: 10,
    aspectRatio: 1,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 10,
  },
})