import { FC } from "react";
import { MarqueeSelection } from "../MarqueeSelection";
import css from "./index.module.css";
import { useFileService } from "../../fileService/useFileService";
import { ArrayRender } from "../Common/ArrayRender";
import { Button } from "../Button";
import { DropWrapper } from "../DropWrapper";
import { If } from "../Common/If";
import { extname } from "../../utils/opfsPath";

export const OpfsViewer: FC = () => {
  const { currentItems, canGoBack, fileService, currentPath } =
    useFileService();
  const openItem = (clickedItem: Element) => {
    const name = clickedItem.getAttribute("data-name")!;
    const kind = clickedItem.getAttribute("data-kind")!;
    if (kind === "directory") {
      fileService.jumpRelative(name);
    }
  };

  const handleNewCreateFolder = () => {
    const folderName = prompt("Enter folder name");
    if (folderName) {
      fileService.mkdir(folderName);
    }
  };

  return (
    <div className={css.container}>
      <div className={css.actions}>
        <div className={css.path}>
          <Button
            disabled={!canGoBack}
            onClick={() => {
              fileService.jumpRelative("..");
            }}
          >
            Back
          </Button>

          <div>{currentPath}</div>
        </div>
        <div>
          <div
            style={{
              display: "flex",
              gap: "8px",
            }}
          >
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                fileService.refresh();
              }}
              icon="🔄"
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleNewCreateFolder}
              icon="📂"
            >
              New Folder
            </Button>
          </div>
        </div>
      </div>
      <DropWrapper
        style={{
          width: "100%",
          height: "100%",
        }}
        onDrop={(fileSystemHandles) => {
          fileService.upload(fileSystemHandles);
        }}
      >
        <MarqueeSelection
          className={css.viewContainer}
          selectedItemClassName={css.selected}
          onSelectedItemDoubleClick={openItem}
          contextMenuContent={(e, clickItem, selectedItems) => {
            return (
              <div>
                <ul>
                  {selectedItems.map((item) => {
                    const path = item.getAttribute("data-path")!;
                    const name = item.getAttribute("data-name")!;
                    return <li key={path}>{name}</li>;
                  })}
                </ul>
              </div>
            );
          }}
        >
          <ArrayRender
            items={currentItems}
            renderItem={(item) => {
              const isDirectory = item.kind === "directory";
              const name = item.name;
              return (
                <div
                  key={item.path}
                  title={name}
                  className={css.item}
                  data-kind={item.kind}
                  data-name={name}
                  data-path={item.path}
                >
                  <div className={css.icon}>
                    <If condition={isDirectory}>
                      📁
                      <If.ElseIf condition={extname(name) === ".png"}>
                        <img src={item.url} alt={`pic ${name}`} />
                      </If.ElseIf>
                      <If.Else>📄</If.Else>
                    </If>
                  </div>
                  <div className={css.name}>{name}</div>
                </div>
              );
            }}
          />
        </MarqueeSelection>
      </DropWrapper>
    </div>
  );
};
