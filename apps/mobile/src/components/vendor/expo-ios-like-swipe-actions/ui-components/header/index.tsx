import { useCustomFonts } from "@/hooks/use-fonts";
import { IHeaderProps } from "@/typings/ui.interfaces";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { BackButton } from "../back-button";
import { HeaderFilters } from "../header-filters";
import { HeaderMetadata } from "../header-metadata";
import { MoreButton } from "../more-button";

const Header: React.FC<IHeaderProps> = ({
  unreadCount,
  onBackPress,
  onMorePress,
}) => {
  const fontLoaded = useCustomFonts();

  return (
    <View style={styles.header}>
      <View style={styles.controlsRow}>
        <BackButton onPress={onBackPress} />
        <MoreButton onPress={onMorePress} />
      </View>
      <View style={styles.content}>
        <Text
          style={[
            styles.headerTitle,
            {
              fontFamily: fontLoaded ? "SfProBold" : undefined,
            },
          ]}
        >
          Inbox
        </Text>
        <HeaderMetadata unreadCount={unreadCount} />
        <HeaderFilters />
      </View>
    </View>
  );
};

Header.displayName = "Header";

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 18,
    backgroundColor: "#FFFFFF",
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  content: {
    marginTop: 32,
  },
  headerTitle: {
    fontSize: 35,
    lineHeight: 40,
    color: "#000",
  },
});

export { Header };
export default Header;
