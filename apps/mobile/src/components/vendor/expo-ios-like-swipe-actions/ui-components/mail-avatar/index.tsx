import { Image } from "expo-image";
import React from "react";
import { ImageSourcePropType, StyleSheet, View } from "react-native";

interface IMailAvatarProps {
  source: ImageSourcePropType;
}

const MailAvatar: React.FC<IMailAvatarProps> = ({ source }) => {
  return (
    <View style={styles.avatarShell}>
      <Image source={source} style={styles.avatar} contentFit="cover" />
    </View>
  );
};

MailAvatar.displayName = "MailAvatar";

const styles = StyleSheet.create({
  avatarShell: {
    width: 54,
    paddingTop: 1,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#E7E8ED",
  },
});

export { MailAvatar };
export default MailAvatar;
