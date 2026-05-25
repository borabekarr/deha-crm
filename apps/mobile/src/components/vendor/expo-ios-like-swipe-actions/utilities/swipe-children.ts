import React from "react";
import {
  ISwipeAction,
  ISwipeActionsContainerProps,
  ISwipeActionsMainProps,
  ISwipeActionsParsedChildren,
  ISwipeSlotComponent,
} from "../typings/swipe.interfaces";

function getElementSlot(child: React.ReactElement) {
  const component = child.type as ISwipeSlotComponent;
  return component.slot;
}

function getActionFromElement(
  child: React.ReactElement<ISwipeActionsContainerProps>,
  index: number,
): ISwipeAction {
  const side = child.props.side ?? "right";

  return {
    key: child.key ? String(child.key) : `${side}-${index}`,
    side,
    children: React.cloneElement(child, { style: undefined }),
    onPress: child.props.onPress,
    destructive: child.props.destructive,
    style: child.props.style,
  };
}

function getSwipeChildren(children: React.ReactNode): ISwipeActionsParsedChildren {
  const mainChildren: React.ReactNode[] = [];
  const actions: ISwipeAction[] = [];

  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) {
      mainChildren.push(child);
      return;
    }

    const slot = getElementSlot(child);

    if (slot === "container") {
      actions.push(
        getActionFromElement(
          child as React.ReactElement<ISwipeActionsContainerProps>,
          actions.length,
        ),
      );
      return;
    }

    if (slot === "main") {
      const main = child as React.ReactElement<ISwipeActionsMainProps>;
      mainChildren.push(main);
      return;
    }

    mainChildren.push(child);
  });

  return {
    mainChildren,
    leftActions: actions.filter((action) => action.side === "left"),
    rightActions: actions.filter((action) => action.side === "right"),
  };
}

export { getSwipeChildren };
