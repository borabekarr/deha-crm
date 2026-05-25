import { MailAvatar } from "@/ui-components";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { IMailRowProps } from "../typings/mail.interfaces";
import { SwipeActions } from "./SwipeActions";

const MailRow: React.FC<IMailRowProps> = ({
  mail,
  onDelete,
  onToggleRead,
}: IMailRowProps): React.JSX.Element & React.ReactNode => {
  const unreadProgress = useSharedValue(mail.unread ? 1 : 0);

  React.useEffect(() => {
    unreadProgress.value = withTiming(mail.unread ? 1 : 0, {
      duration: 260,
      easing: Easing.bezier(0.22, 0.82, 0.18, 1),
    });
  }, [mail.unread, unreadProgress]);

  const handleMore = useCallback(() => {
    if (Platform.OS === "web") {
      window.alert(`More — ${mail.from}`);
    }
  }, [mail.from]);

  const handleFlag = React.useCallback(() => {
    if (Platform.OS === "web") {
      window.alert(`Flagged — ${mail.from}`);
    }
  }, [mail.from]);

  const unreadDotStyle = useAnimatedStyle(() => {
    return {
      opacity: unreadProgress.value,
      transform: [
        {
          scale: 0.7 + unreadProgress.value * 0.3,
        },
      ],
    };
  });

  return (
    <SwipeActions.Root
      actionWidth={74}
      fullSwipeEnabled
      fullSwipeExpansionOffset={124}
    >
      <SwipeActions.Main>
        <View style={styles.row}>
          <View style={styles.statusCol}>
            <Animated.View style={[styles.unreadDot, unreadDotStyle]} />
          </View>
          <MailAvatar source={mail.avatar} />
          <View style={styles.rowContent}>
            <View style={styles.rowFrame}>
              <View style={styles.primaryRow}>
                <View style={styles.copyCol}>
                  <Text
                    style={[
                      styles.from,
                      mail.unread ? styles.fromUnread : null,
                    ]}
                    numberOfLines={1}
                  >
                    {mail.from}
                  </Text>
                  <Text style={styles.subject} numberOfLines={1}>
                    {mail.subject}
                  </Text>
                  <Text style={styles.preview} numberOfLines={2}>
                    {mail.preview}
                  </Text>
                </View>
                <View style={styles.trailingCol}>
                  <View style={styles.trailingTop}>
                    <Text style={styles.when} numberOfLines={1}>
                      {mail.when}
                    </Text>
                    <Ionicons
                      name="chevron-forward"
                      size={19}
                      color="#C7C7CC"
                    />
                  </View>
                  {mail.attachment ?
                    <Ionicons
                      name="attach-outline"
                      size={17}
                      color="#C7C7CC"
                      style={styles.attachment}
                    />
                  : null}
                </View>
              </View>
            </View>
          </View>
        </View>
      </SwipeActions.Main>
      <SwipeActions.Container
        key="read"
        side="left"
        onPress={onToggleRead}
        style={styles.readAction}
      >
        <SwipeActions.Icon icon={mail.unread ? "mail-open" : "mail-unread"} />
        <SwipeActions.Title>
          {mail.unread ? "Read" : "Unread"}
        </SwipeActions.Title>
      </SwipeActions.Container>
      <SwipeActions.Container
        key="more"
        side="right"
        onPress={handleMore}
        style={styles.moreAction}
      >
        <SwipeActions.Icon icon="ellipsis-horizontal" />
        <SwipeActions.Title>More</SwipeActions.Title>
      </SwipeActions.Container>
      <SwipeActions.Container
        key="flag"
        side="right"
        onPress={handleFlag}
        style={styles.flagAction}
      >
        <SwipeActions.Icon icon="flag" />
        <SwipeActions.Title>Flag</SwipeActions.Title>
      </SwipeActions.Container>
      <SwipeActions.Container
        key="delete"
        side="right"
        destructive
        onPress={onDelete}
        style={styles.deleteAction}
      >
        <SwipeActions.Icon icon="trash" />
        <SwipeActions.Title>Trash</SwipeActions.Title>
      </SwipeActions.Container>
    </SwipeActions.Root>
  );
};

const MailRowMemo = React.memo(MailRow);
MailRowMemo.displayName = "MailRow";

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingLeft: 14,
    paddingRight: 16,
    paddingTop: 12,
    backgroundColor: "#FFFFFF",
  },
  statusCol: {
    width: 18,
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#0A84FF",
  },
  rowContent: {
    flex: 1,
    marginLeft: 6,
  },
  rowFrame: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(60,60,67,0.18)",
    minHeight: 74,
    paddingBottom: 11,
  },
  primaryRow: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  copyCol: {
    flex: 1,
    paddingRight: 10,
  },
  from: {
    fontSize: 17,
    fontWeight: "700",
    lineHeight: 22,
    color: "#000",
  },
  fromUnread: {
    fontWeight: "800",
  },
  subject: {
    marginTop: 0,
    fontSize: 15.5,
    lineHeight: 19,
    color: "#000",
  },
  preview: {
    marginTop: 4,
    fontSize: 14.5,
    color: "#8E8E93",
    lineHeight: 18,
  },
  trailingCol: {
    width: 88,
    minHeight: 62,
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingTop: 0,
  },
  trailingTop: {
    flexDirection: "row",
    alignItems: "center",
  },
  when: {
    fontSize: 16,
    lineHeight: 22,
    color: "#8E8E93",
    marginRight: 1,
  },
  attachment: {
    marginTop: 0,
  },
  readAction: {
    backgroundColor: "#007AFF",
  },
  moreAction: {
    backgroundColor: "#8E8E93",
  },
  flagAction: {
    backgroundColor: "#FF9500",
  },
  deleteAction: {
    backgroundColor: "#FF3B30",
  },
});

export { MailRowMemo as MailRow };
export default MailRowMemo;
