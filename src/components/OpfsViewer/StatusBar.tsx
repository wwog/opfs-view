import { FC } from "react";
import { useOpfsViewerStore } from "../../hooks/useOpfsViewerStore";
import css from "./statusBar.module.css";
import { If } from "../Common/If";
import { useFileService } from "../../hooks/useFileService";

export const StatusBar: FC = () => {
  const { currentItems, usage } = useFileService();
  const { selectItems } = useOpfsViewerStore();

  const right = 100 - (10 + usage.percent * 0.9);

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
          <div
            className={css.percent}
            style={{
              right: `${right}%`,
            }}
          ></div>
          {usage.usageStr} / {usage.quotaStr}{" "}
          <span
            style={{
              fontStyle: "italic",
              fontSize: "0.8em",
            }}
          >
            ({usage.percent}%)
          </span>
        </div>
      </div>
    </div>
  );
};
