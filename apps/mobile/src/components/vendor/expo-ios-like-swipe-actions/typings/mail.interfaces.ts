import { ImageSourcePropType } from "react-native";

interface IMail {
  id: string;
  from: string;
  subject: string;
  preview: string;
  when: string;
  unread?: boolean;
  avatar: ImageSourcePropType;
  attachment?: boolean;
}

interface IMailRowProps {
  mail: IMail;
  onDelete: () => void;
  onToggleRead: () => void;
}

export { IMail, IMailRowProps };
