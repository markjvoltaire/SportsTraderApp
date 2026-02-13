import React, { useRef, useEffect, useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  useColorScheme, 
  Pressable, 
  Image, 
  Animated,
  Dimensions 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';


const { width, height } = Dimensions.get('window');
const GAP = 12;
const HORIZONTAL_PADDING = 12;
const COLUMN_WIDTH = (width - (HORIZONTAL_PADDING * 2) - GAP) / 2;

// Background images data - using images from assets/welcomescreen
const backgroundRectangles = [
  { id: 1, image: require('../assets/welcomescreen/IMG_7191.png'), height: 280 },
  { id: 2, image: require('../assets/welcomescreen/IMG_7194.png'), height: 200 },
  { id: 3, image: require('../assets/welcomescreen/IMG_7199.png'), height: 320 },
  { id: 4, image: require('../assets/welcomescreen/IMG_7200.png'), height: 240 },
  { id: 5, image: require('../assets/welcomescreen/IMG_7201.png'), height: 180 },
  { id: 6, image: require('../assets/welcomescreen/IMG_7202.png'), height: 300 },
];

export default function WelcomeScreen() {
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const logoSource = require('../assets/LogoWhiteTransparent.png');
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const gradientFadeAnim = useRef(new Animated.Value(0)).current;
  const gradientSlideAnim = useRef(new Animated.Value(50)).current;
  const logoFadeAnim = useRef(new Animated.Value(0)).current;
  const logoSlideAnim = useRef(new Animated.Value(10)).current;
  const textFadeAnim = useRef(new Animated.Value(0)).current;
  const textSlideAnim = useRef(new Animated.Value(10)).current;
  const buttonFadeAnim = useRef(new Animated.Value(0)).current;
  const buttonSlideAnim = useRef(new Animated.Value(10)).current;
  const scrollAnim = useRef(new Animated.Value(0)).current;
  const [gradientReady, setGradientReady] = useState(false);
  const [gridReady, setGridReady] = useState(false);

  // Split rectangles into two columns
  const leftColumn = [];
  const rightColumn = [];
  
  backgroundRectangles.forEach((rect, index) => {
    if (index % 2 === 0) {
      leftColumn.push(rect);
    } else {
      rightColumn.push(rect);
    }
  });

// Duplicate columns to show each image five times
const DUPLICATE_SETS = 5;
const leftColumnDuplicated = [...leftColumn, ...leftColumn, ...leftColumn, ...leftColumn, ...leftColumn];
const rightColumnDuplicated = [...rightColumn, ...rightColumn, ...rightColumn, ...rightColumn, ...rightColumn];

  useEffect(() => {
    // Infinite scroll animation - continuously scroll without stopping
    const singleSetHeight = leftColumnDuplicated.reduce((sum, rect) => sum + rect.height + GAP, 0);
    const baseDuration = 20000;
    
    // Create a truly infinite scroll by looping through one set and resetting seamlessly
    const createInfiniteScroll = () => {
      const scrollAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(scrollAnim, {
            toValue: -singleSetHeight,
            duration: baseDuration * DUPLICATE_SETS, // longer loop, same speed
            useNativeDriver: true,
          }),
          Animated.timing(scrollAnim, {
            toValue: 0,
            duration: 0, // Instant reset (seamless because we have duplicates)
            useNativeDriver: true,
          }),
        ]),
        { iterations: -1 } // Infinite iterations - never stops
      );
      return scrollAnimation;
    };
    
    const scrollAnimation = createInfiniteScroll();
    scrollAnimation.start();
    
    return () => {
      scrollAnimation.stop();
    };
  }, []);

  useEffect(() => {
    if (!gradientReady) {
      return;
    }

    gradientFadeAnim.setValue(0);
    gradientSlideAnim.setValue(50);
    Animated.parallel([
      Animated.timing(gradientFadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(gradientSlideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setGridReady(true);
    });
  }, [gradientReady, gradientFadeAnim, gradientSlideAnim]);

  useEffect(() => {
    if (!gridReady) {
      return;
    }

    fadeAnim.setValue(0);
    slideAnim.setValue(50);
    logoFadeAnim.setValue(0);
    logoSlideAnim.setValue(10);
    textFadeAnim.setValue(0);
    textSlideAnim.setValue(10);
    buttonFadeAnim.setValue(0);
    buttonSlideAnim.setValue(10);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(logoFadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(logoSlideAnim, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(textFadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(textSlideAnim, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(buttonFadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(buttonSlideAnim, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();
  }, [gridReady, fadeAnim, slideAnim, logoFadeAnim, logoSlideAnim, textFadeAnim, textSlideAnim, buttonFadeAnim, buttonSlideAnim]);

  const renderBackgroundColumn = (columnData, columnIndex) => {
    const totalHeight = columnData.reduce((sum, rect) => sum + rect.height + GAP, 0);
    
    return (
      <Animated.View
        key={columnIndex}
        style={[
          styles.backgroundColumn,
          {
            transform: [{ translateY: scrollAnim }],
          },
        ]}
      >
        {columnData.map((rect, index) => (
          <View
            key={`${columnIndex}-${rect.id}-${index}`}
            style={[
              styles.backgroundRectangle,
              { 
                height: rect.height,
     
              },
            ]}
          >
            <Image
              source={rect.image}
              style={styles.backgroundImage}
              resizeMode="cover"
            />
          </View>
        ))}
      </Animated.View>
    );
  };

  return (
    <SafeAreaView 
      style={[
        styles.container, 
        isDarkMode ? styles.darkContainer : styles.lightContainer
      ]}
      edges={['top', 'bottom']}
    >
      <StatusBar style={isDarkMode ? 'light' : 'dark'} translucent />
      {/* Animated Background */}
      <View style={styles.backgroundContainer} pointerEvents="none">
        {gridReady && (
          <Animated.View
            style={[
              styles.backgroundGrid,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {renderBackgroundColumn(leftColumnDuplicated, 0)}
            {renderBackgroundColumn(rightColumnDuplicated, 1)}
          </Animated.View>
        )}
        <Animated.Image
          source={require('../assets/gradient3.png')}
          style={{
            width: '100%',
            height: '100%',
            position: 'absolute',
            top: 20,
            opacity: gradientFadeAnim,
            transform: [{ translateY: gradientSlideAnim }],
          }}
          onLoad={() => setGradientReady(true)}
          resizeMode="cover"
        />
        
   
      </View>

      <View style={styles.content}>
        <View style={styles.centerSection}>
          <Animated.Image
            source={logoSource}
            style={[
              styles.logo,
              {
                opacity: logoFadeAnim,
                transform: [{ translateY: logoSlideAnim }],
              },
            ]}
            resizeMode="contain"
          />
          <Animated.Text
            style={[
              styles.headline,
              styles.darkText,
              {
                opacity: textFadeAnim,
                transform: [{ translateY: textSlideAnim }],
              },
            ]}
          >
          Trade Your Fandom.
          </Animated.Text>
        </View>
        <Animated.View
          style={[
            styles.buttonSection,
            {
              opacity: buttonFadeAnim,
              transform: [{ translateY: buttonSlideAnim }],
            },
          ]}
        >
          <Pressable
            onPress={() => navigation.navigate('Login')}
            style={[
              styles.getStartedButton,
              isDarkMode ? styles.getStartedButtonDark : styles.getStartedButtonLight,
            ]}
          >
            <Text
              style={[
                styles.getStartedText,
                isDarkMode ? styles.getStartedTextDark : styles.getStartedTextLight,
              ]}
            >
              Get Started
            </Text>
          </Pressable>
     
        </Animated.View>
      </View>
    
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  darkContainer: {
    backgroundColor: '#000',
  },
  lightContainer: {
    backgroundColor: '#fff',
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  backgroundGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: 12,
  },
  backgroundColumn: {
    width: COLUMN_WIDTH,
    gap: GAP,
  },
  backgroundRectangle: {
    width: '100%',
    marginBottom: GAP,
    borderRadius: 16,
    overflow: 'hidden',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 60,
    paddingBottom: 60,
    justifyContent: 'space-between',
    zIndex: 1,
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  logo: {
    width: 80,
    height: 80,
    top: 50,
  },
  headline: {
    fontSize: 42,
    fontWeight: '700',
    letterSpacing: -1,
    textAlign: 'center',
    lineHeight: 48,
    top: 90,
  },
  buttonSection: {
    width: '100%',
  },
  getStartedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 32,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  getStartedButtonDark: {
    backgroundColor: 'white',
  },
  getStartedButtonLight: {
    backgroundColor: 'white',
  },
  getStartedText: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
    color: '#000',
  },
  getStartedTextDark: {
    color: '#000',
  },
  getStartedTextLight: {
    color: '#000',
  },
  restoreButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 40,
    marginTop: 16,
  },
  restoreText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  darkText: {
    color: '#fff',
  },
  lightText: {
    color: '#000',
  },
  mutedDarkText: {
    color: '#a1a1aa',
  },
  mutedLightText: {
    color: '#6b7280',
  },
});
