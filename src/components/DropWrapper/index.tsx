import { FC, ReactNode, useState } from "react";

interface FileSystemFileHandleItem extends DataTransferItem {
  getAsFileSystemHandle(): Promise<FileSystemHandle | null>;
}

interface DropWrapperProps {
  children?: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onDrop?: (entries: FileSystemHandle[]) => void;
}

/**
 * The non-standard method getAsFileSystemHandle is used
 * @param props
 * @returns
 */
export const DropWrapper: FC<DropWrapperProps> = (props) => {
  const { children, className, style, onDrop } = props;
  const [dragging, setDragging] = useState(false);

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const { items } = e.dataTransfer;
    if (items.length === 0) {
      return;
    }

    const promises = Array.from(items).map((item) => {
      const p = (item as FileSystemFileHandleItem).getAsFileSystemHandle();
      return p;
    });
    const fileSystemHandles = (await Promise.all(promises)).filter(
      (v) => v !== null
    );
    onDrop?.(fileSystemHandles);
    setDragging(false);
  };

  return (
    <div
      className={className}
      style={{
        ...style,
        position: "relative",
      }}
      onDragEnter={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
    >
      {children}
      {dragging && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
          onDragOver={(e) => {
            e.preventDefault();
          }}
          onDragLeave={() => {
            setDragging(false);
          }}
          onDrop={handleDrop}
        ></div>
      )}
    </div>
  );
};
