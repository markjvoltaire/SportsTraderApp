import { StyleSheet, Text, View } from "react-native";
import React from "react";
import { useRoute } from "@react-navigation/native";

export default function MarketDetailScreen() {
  const route = useRoute();
  const game = route.params?.game;

  console.log("game", game);
  return (
    <View>
      <Text>MarketDetailScreen</Text>
    </View>
  );
}

const styles = StyleSheet.create({});
