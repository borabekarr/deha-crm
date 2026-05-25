import { FloatingComposer, Header } from "@/ui-components";
import React, { useCallback, useState } from "react";
import {
  FlatList,
  I18nManager,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
  Easing,
  FadeIn,
  FadeOutLeft,
  LinearTransition,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { MailRow } from "../components/MailRow";
import { SwipeActions } from "../components/SwipeActions";
import { INITIAL_MAIL } from "../constants";
import { IMail } from "../typings/mail.interfaces";
I18nManager.allowRTL(false);

export default function Index() {
  const listEase = React.useMemo(() => {
    return Easing.bezier(0.2, 0.8, 0.2, 1);
  }, []);

  const [mails, setMails] = useState(INITIAL_MAIL);
  const unreadCount = mails.filter((mail) => mail.unread).length;

  const remove = useCallback((id: string) => {
    setMails((prev) => prev.filter((mail) => mail.id !== id));
  }, []);

  const toggleRead = useCallback((id: string) => {
    setMails((prev) =>
      prev.map((mail) =>
        mail.id === id ? { ...mail, unread: !mail.unread } : mail,
      ),
    );
  }, []);

  const renderItem = useCallback(
    ({ item, index }: { item: IMail; index: number }) => {
      const staggerDelay = Math.min(index, 7) * 14;
      const layoutTransition = LinearTransition.delay(staggerDelay)
        .duration(320)
        .easing(listEase);

      return (
        <Animated.View
          entering={FadeIn.duration(200)
            .delay(Math.floor(staggerDelay * 0.5))
            .easing(listEase)}
          exiting={FadeOutLeft.duration(200).easing(listEase)}
          layout={layoutTransition}
        >
          <MailRow
            mail={item}
            onDelete={() => remove(item.id)}
            onToggleRead={() => toggleRead(item.id)}
          />
        </Animated.View>
      );
    },
    [listEase, remove, toggleRead],
  );

  const renderEmpty = useCallback(() => {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>Inbox zero</Text>
        <Text style={styles.emptyBody}>
          Nothing left. Pull down to refresh.
        </Text>
      </View>
    );
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar hidden />
      <SafeAreaView style={styles.root} edges={["top"]}>
        <SwipeActions.Provider>
          <Header
            unreadCount={unreadCount}
            onBackPress={() => {
              if (Platform.OS === "web") {
                window.alert("Back");
              }
            }}
            onMorePress={() => {
              if (Platform.OS === "web") {
                window.alert("More");
              }
            }}
          />
          <FlatList
            data={mails}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator
            ListEmptyComponent={renderEmpty}
            removeClippedSubviews={false}
          />
          <FloatingComposer
            onMenuPress={() => {
              if (Platform.OS === "web") {
                window.alert("Menu");
              }
            }}
            onSearchPress={() => {
              if (Platform.OS === "web") {
                window.alert("Search");
              }
            }}
            onVoicePress={() => {
              if (Platform.OS === "web") {
                window.alert("Voice");
              }
            }}
            onComposePress={() => {
              if (Platform.OS === "web") {
                window.alert("Compose");
              }
            }}
          />
        </SwipeActions.Provider>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  list: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  listContent: {
    paddingBottom: 132,
  },
  empty: {
    padding: 48,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000",
  },
  emptyBody: {
    marginTop: 6,
    fontSize: 14,
    color: "#8E8E93",
  },
});
