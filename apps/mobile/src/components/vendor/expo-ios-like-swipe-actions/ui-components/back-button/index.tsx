import { IHeaderActionControlProps } from "@/typings/ui.interfaces";
import React from "react";
import { HeaderActionButton } from "../header-action-button";

const BackButton: React.FC<IHeaderActionControlProps> = ({ onPress }) => {
  return (
    <HeaderActionButton
      accessibilityLabel="Go back"
      icon="chevron-back"
      onPress={onPress}
    />
  );
};

export { BackButton };
export default BackButton;
