import { FC } from "react";
import { MarqueeSelection } from "../MarqueeSelection";
import css from "./index.module.css";
import { useFileService } from "../../services/fileService/useFileService";
import { ArrayRender } from "../Common/ArrayRender";
import { Button } from "../Button";
import { DropWrapper } from "../DropWrapper";
import { If } from "../Common/If";
import { extname } from "../../utils/opfsPath";
import { List } from "../List";
import toast from "react-hot-toast";
import { StatusBar } from "./StatusBar";
import { useOpfsViewerStore } from "../../hooks/useOpfsViewerStore";
import { FileService } from "../../services/fileService/mod";
import { useAppService } from "../../services/appService/useAppService";

export const OpfsViewer: FC = () => {
  const { currentItems, canGoBack, fileService, currentPath } =
    useFileService();
  const { appService } = useAppService();
  const { setSelectItems } = useOpfsViewerStore();
  const openItem = (clickedItem: Element) => {
    const name = clickedItem.getAttribute("data-name")!;
    const kind = clickedItem.getAttribute("data-kind")!;
    const path = clickedItem.getAttribute("data-path")!;

    if (kind === "directory") {
      fileService.jumpRelative(name);
    } else if (kind === "file") {
      const ext = extname(name);
      if (FileService.ImageExt.includes(ext)) {
        const url = clickedItem.querySelector("img")!.src;
        window.open(url, "_blank", "popup=true");
      } else {
        appService.openFile(path);
      }
    } else {
      toast.error("Unsupported file type");
    }
  };

  const handleNewCreateFolder = () => {
    const folderName = prompt("Enter folder name");
    if (folderName) {
      fileService.mkdir(folderName);
    }
  };

  const handleNewFile = () => {
    const fileName = prompt("Enter file name");
    if (fileName) {
      fileService.createFile(fileName).catch((error) => {
        console.error("Error creating file:", error);
        toast.error("Failed to create file: " + error.message);
      });
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
      </div>
      <DropWrapper
        style={{
          width: "100%",
          height: "100%",
        }}
        onDrop={(fileSystemHandles) => {
          fileService.save(fileSystemHandles);
        }}
      >
        <MarqueeSelection
          className={css.viewContainer}
          selectedItemClassName={css.selected}
          onSelectedItemDoubleClick={openItem}
          onSelectedChange={(selectedItems) => {
            setSelectItems(selectedItems);
          }}
          contextMenuContent={(e, clicked, selectedItems) => {
            return (
              <If condition={clicked !== null}>
                <List>
                  <List.Item
                    onClick={() => {
                      openItem(clicked!);
                    }}
                  >
                    Open
                  </List.Item>
                  <List.Item
                    onClick={() => {
                      toast.promise(
                        fileService.remove(
                          selectedItems.map(
                            (item) => item.getAttribute("data-path")!
                          )
                        ),
                        {
                          loading: "Deleting...",
                          success: "Deleted",
                          error: "Failed to delete",
                        }
                      );
                    }}
                  >
                    Delete (<span>{selectedItems.length}</span> items)
                  </List.Item>
                  <List.Item
                    onClick={() => {
                      fileService.saveToDisk(
                        selectedItems.map(
                          (item) => item.getAttribute("data-path")!
                        )
                      );
                    }}
                  >
                    Save To Disk
                  </List.Item>
                </List>

                <If.Else>
                  <List>
                    <List.Item onClick={handleNewFile}>📄 New File</List.Item>
                    <List.Item onClick={handleNewCreateFolder}>
                      📁 New Folder
                    </List.Item>
                    <List.Item onClick={() => fileService.refresh()}>
                      🔄 Refresh
                    </List.Item>
                  </List>
                </If.Else>
              </If>
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
                  <div className={css.name}>
                    <div>{name}</div>
                    <If condition={item.subname !== undefined}>
                      <div>{item.subname}</div>
                    </If>
                  </div>
                </div>
              );
            }}
          />
        </MarqueeSelection>
      </DropWrapper>

      <StatusBar />
    </div>
  );
};
