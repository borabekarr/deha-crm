import { Ionicons } from "@expo/vector-icons";

interface IHeaderActionButtonProps {
  onPress?: () => void;
  icon: keyof typeof Ionicons.glyphMap;
  accessibilityLabel: string;
}

interface IHeaderActionControlProps {
  onPress?: () => void;
}

interface IHeaderProps {
  unreadCount: number;
  onBackPress?: () => void;
  onMorePress?: () => void;
}

interface IHeaderMetadataProps {
  unreadCount: number;
}

interface IHeaderFiltersProps {
  onChange?: (index: number) => void;
}

interface IFloatingComposerProps {
  onMenuPress?: () => void;
  onSearchPress?: () => void;
  onVoicePress?: () => void;
  onComposePress?: () => void;
}

interface IFloatingComposerSearchProps {
  onPress?: () => void;
  onVoicePress?: () => void;
}

export {
  IFloatingComposerProps,
  IFloatingComposerSearchProps,
  IHeaderActionButtonProps,
  IHeaderActionControlProps,
  IHeaderFiltersProps,
  IHeaderMetadataProps,
  IHeaderProps,
};
