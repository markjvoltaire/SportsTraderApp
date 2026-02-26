import React from "react";
import { View, Image, StyleSheet } from "react-native";

const BasketballIcon = ({
  size = 50,
  bgColor = "#e61e2a",
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
        source={require("../../../assets/images/basketball.png")}
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

export default BasketballIcon;
