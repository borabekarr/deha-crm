import {
  memo,
  type ComponentProps,
  type FC,
  type FunctionComponent,
  type JSX,
  type ReactElement,
  type ReactNode,
} from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { TabIcon } from "../../components/tab-icon";
import type { IPopupRenderContext } from "../typings/motion-tabs";
import {
  HOME_ITEMS,
  NOTIFICATION_ITEMS,
  SEARCH_OPTIONS,
} from "../utils/constants";
import { popupBodyStyles as styles } from "../utils/popup-body-styles";

const HomePopupBody: FC<IPopupRenderContext> &
  FunctionComponent<IPopupRenderContext> = memo<
  IPopupRenderContext & ComponentProps<typeof HomePopupBody>
>(
  ({
    colors,
  }: IPopupRenderContext & ComponentProps<typeof HomePopupBody>):
    | (ReactNode & ReactElement & JSX.Element)
    | null => {
    return (
      <View style={[styles.menuPad, { minWidth: 240 }]}>
        {HOME_ITEMS.map((item) => (
          <Pressable
            key={item.text}
            style={({ pressed }) => [
              styles.menuRow,
              { backgroundColor: pressed ? colors.hover : "transparent" },
            ]}
          >
            <TabIcon name={item.icon} size={20} color={colors.muted} />
            <Text style={[styles.menuText, { color: colors.foreground }]}>
              {item.text}
            </Text>
          </Pressable>
        ))}
      </View>
    );
  },
);

const SearchPopupBody: FC<IPopupRenderContext> &
  FunctionComponent<IPopupRenderContext> = memo<
  IPopupRenderContext & ComponentProps<typeof SearchPopupBody>
>(
  ({
    colors,
  }: IPopupRenderContext & ComponentProps<typeof SearchPopupBody>):
    | (ReactNode & ReactElement & JSX.Element)
    | null => {
    return (
      <View style={[styles.menuPad, { minWidth: 280 }]}>
        <View
          style={[
            styles.searchInput,
            { backgroundColor: colors.input, borderColor: colors.border },
          ]}
        >
          <TabIcon name="search" size={16} color={colors.muted} />
          <TextInput
            placeholder="Search anything..."
            placeholderTextColor={colors.muted}
            style={[styles.searchText, { color: colors.foreground }]}
          />
        </View>
        <View style={styles.searchRow}>
          {SEARCH_OPTIONS.map((item) => (
            <Pressable
              key={item.text}
              style={({ pressed }) => [
                styles.chip,
                {
                  backgroundColor: pressed ? colors.hover : colors.input,
                  borderColor: colors.border,
                },
              ]}
            >
              <TabIcon name={item.icon} size={14} color={colors.muted} />
              <Text style={[styles.menuText, { color: colors.foreground }]}>
                {item.text}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    );
  },
);

const ProfilePopupBody: FC<IPopupRenderContext> &
  FunctionComponent<IPopupRenderContext> = ({
  colors,
}: IPopupRenderContext & ComponentProps<typeof ProfilePopupBody>):
  | (ReactNode & ReactElement & JSX.Element)
  | null => {
  return (
    <View style={[styles.menuPad, { minWidth: 240 }]}>
      {NOTIFICATION_ITEMS.map((item) => (
        <Pressable
          key={item.text}
          style={({ pressed }) => [
            styles.menuRow,
            { backgroundColor: pressed ? colors.hover : "transparent" },
          ]}
        >
          <TabIcon name={item.icon} size={20} color={colors.muted} />
          <Text style={[styles.menuText, { color: colors.foreground }]}>
            {item.text}
          </Text>
        </Pressable>
      ))}
    </View>
  );
};

const PopupBody: FC<IPopupRenderContext> &
  FunctionComponent<IPopupRenderContext> = (
  context: IPopupRenderContext & ComponentProps<typeof PopupBody>,
): (ReactNode & ReactElement & JSX.Element) | null => {
  if (context.route.name === "index") return <HomePopupBody {...context} />;
  if (context.route.name === "search") return <SearchPopupBody {...context} />;
  return <ProfilePopupBody {...context} />;
};

export { PopupBody };
