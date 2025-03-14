import { FC, ReactNode } from "react";
import { useOpfsViewerStore } from "../../hooks/useOpfsViewerStore";
import css from "./statusBar.module.css";
import { If } from "../Common/If";
import { useFileService } from "../../fileService/useFileService";

interface StatusBarProps {
  children?: ReactNode;
}
export const StatusBar: FC<StatusBarProps> = (props) => {
  const { currentItems, usage } = useFileService();
  const { selectItems } = useOpfsViewerStore();
  return (
    <div className={css.container}>
      <div className={css.topWrapper}>
        <div className={css.selectedItems}>
          <If condition={selectItems.length > 0}>
            {selectItems.length} items selected (total {currentItems.length}{" "}
            items)
            <If.Else>{currentItems.length} items</If.Else>
          </If>
        </div>

        <div className={css.usage}>
          Usage: {usage.usage} ({usage.usageStr}) / {usage.quota} (
          {usage.quotaStr})
        </div>
      </div>

      <div className={css.botWrapper}>Percent:{usage.percent}</div>
    </div>
  );
};
