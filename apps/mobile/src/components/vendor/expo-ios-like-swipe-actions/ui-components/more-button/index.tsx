import React from "react";
import { IHeaderActionControlProps } from "@/typings/ui.interfaces";
import { HeaderActionButton } from "../header-action-button";

const MoreButton: React.FC<IHeaderActionControlProps> = ({
  onPress,
}) => {
  return (
    <HeaderActionButton
      accessibilityLabel="More actions"
      icon="ellipsis-horizontal"
      onPress={onPress}
    />
  );
};

MoreButton.displayName = "MoreButton";

export { MoreButton };
export default MoreButton;
