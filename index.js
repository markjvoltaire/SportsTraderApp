// Buffer must be first — some deps (Privy/Solana) use it before other polyfills run
const { Buffer } = require('buffer');
global.Buffer = Buffer;

// Import required polyfills
import 'fast-text-encoding';
import 'react-native-get-random-values';
import '@ethersproject/shims';

import "react-native-gesture-handler";
import "react-native-reanimated";
import { registerRootComponent } from "expo";

import App from "./App";

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
