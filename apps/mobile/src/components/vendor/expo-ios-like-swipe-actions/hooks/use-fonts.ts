import { useFonts } from "expo-font";

const useCustomFonts = () => {
  const [fontsLoaded] = useFonts({
    SfProMedium: require("@/assets/fonts/SFPRODISPLAYMEDIUM.otf"),
    SfProBold: require("@/assets/fonts/SFPRODISPLAYBOLD.otf"),
    SfProRegular: require("@/assets/fonts/SFPRODISPLAYREGULAR.otf"),
    SfRoundedPro: require("@/assets/fonts/SF-Pro-Rounded-Regular.otf"),
  });

  return fontsLoaded;
};

export { useCustomFonts };
