import { SwipeActionIcon } from "./SwipeActionIcon";
import { SwipeActionTitle } from "./SwipeActionTitle";
import { SwipeActionsProvider } from "../context/swipe-actions-context";
import { SwipeActionsContainer } from "./SwipeActionsContainer";
import { SwipeActionsMain } from "./SwipeActionsMain";
import { SwipeActionsRoot } from "./SwipeActionsRoot";

const SwipeActions = {
  Provider: SwipeActionsProvider,
  Root: SwipeActionsRoot,
  Main: SwipeActionsMain,
  Container: SwipeActionsContainer,
  Icon: SwipeActionIcon,
  Title: SwipeActionTitle,
};

export { SwipeActions };
export default SwipeActions;
