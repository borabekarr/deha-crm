import type {
  ComponentProps,
  FC,
  FunctionComponent,
  JSX,
  ReactElement,
  ReactNode,
} from "react";
import type { IPopupRenderContext } from "../typings/motion-tabs";
import { HomePopupBody } from "./home-popup-body";
import { ProfilePopupBody } from "./profile-popup-body";
import { SearchPopupBody } from "./search-popup-body";

const ExamplePopupBody: FC<IPopupRenderContext> &
  FunctionComponent<IPopupRenderContext> = (
  context: IPopupRenderContext & ComponentProps<typeof ExamplePopupBody>,
): (ReactNode & ReactElement & JSX.Element) | null => {
  if (context.route.name === "search") return <SearchPopupBody {...context} />;
  if (context.route.name === "profile")
    return <ProfilePopupBody {...context} />;
  return <HomePopupBody {...context} />;
};

export { ExamplePopupBody };
