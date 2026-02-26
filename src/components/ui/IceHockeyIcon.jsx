import React from "react";
import { View, Image, StyleSheet } from "react-native";

const IceHockeyIcon = ({
  size = 50,
  bgColor = "#111827",
  iconColor = "white",
}) => {
  const iconSize = size * 1.0;
  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bgColor,
        },
      ]}
    >
      <Image
        source={require("../../../assets/images/iceHockey.png")}
        style={[
          styles.image,
          {
            width: iconSize,
            height: iconSize,
            tintColor: iconColor,
          },
        ]}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
});

export default IceHockeyIcon;
