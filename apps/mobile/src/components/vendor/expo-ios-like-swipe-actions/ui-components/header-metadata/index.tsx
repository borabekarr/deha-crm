import React from "react";
import { StyleSheet, Text } from "react-native";
import { useCustomFonts } from "@/hooks/use-fonts";
import { IHeaderMetadataProps } from "@/typings/ui.interfaces";

const HeaderMetadata: React.FC<IHeaderMetadataProps> = ({
  unreadCount,
}) => {
  const fontLoaded = useCustomFonts();

  return (
    <Text
      style={[
        styles.metadata,
        {
          fontFamily: fontLoaded ? "SfProMedium" : undefined,
        },
      ]}
      numberOfLines={1}
    >
      {`Primary · Updated Just Now - ${unreadCount} Unread`}
    </Text>
  );
};

HeaderMetadata.displayName = "HeaderMetadata";

const styles = StyleSheet.create({
  metadata: {
    marginTop: 2,
    fontSize: 15,
    lineHeight: 20,
    color: "#8E8E93",
  },
});

export { HeaderMetadata };
export default HeaderMetadata;
