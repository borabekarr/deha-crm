import React from "react";
import { View } from "react-native";
import {
  ISwipeActionsMainComponent,
  ISwipeActionsMainProps,
} from "../typings/swipe.interfaces";

const SwipeActionsMainBase: React.FC<ISwipeActionsMainProps> = ({
  children,
  style,
}) => {
  return <View style={style}>{children}</View>;
};

const SwipeActionsMain = React.memo(SwipeActionsMainBase) as
  ISwipeActionsMainComponent;

SwipeActionsMain.slot = "main";
SwipeActionsMain.displayName = "SwipeActionsMain";

export { SwipeActionsMain };
export default SwipeActionsMain;
