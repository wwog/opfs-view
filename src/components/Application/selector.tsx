import { FC, type ReactNode } from "react";
import { useAppService } from "../../services/appService/useAppService";
import { Close } from "../Icons";

interface SelectorItemProps {
  children?: ReactNode;
  active?: boolean;
}
export const SelectorItem: FC<SelectorItemProps> = (props) => {
  const { active, children } = props;
  return (
    <div className={"selector-item" + (active ? " item-active" : "")}>
      <div className="item-content">
        <div>{children}</div>

        <Close className="item-close" />
      </div>
    </div>
  );
};

export const ApplicationSelector: FC = () => {
  const { opened } = useAppService();
  return (
    <div className="app-selector">
      <SelectorItem>index.tsx</SelectorItem>
      <SelectorItem active={true}>index.css</SelectorItem>
      <SelectorItem>typescript.tsx</SelectorItem>
      <SelectorItem>golang.tsx</SelectorItem>
      <SelectorItem>application.tsx</SelectorItem>
      <SelectorItem>useAppService.ts</SelectorItem>
    </div>
  );
};
