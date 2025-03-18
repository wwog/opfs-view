import { useRef, type FC } from "react";
import type { ApplicationProps } from "../../services/appService/types";
import { useOnce } from "../../hooks/useOnce";
import { initEditor, saveModelToOpfs } from "./monacoOpfs";
import * as monaco from "monaco-editor";

export const MonacoEditor: FC<ApplicationProps> = (props) => {
  const { filePath, extName } = props;
  const editorWrapperRef = useRef<HTMLDivElement>(null);
  const editorInstanceRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(
    null
  );

  useOnce(() => {
    console.log("MonacoEditor Will Open File:", { extName, filePath });

    initEditor(editorWrapperRef.current!, filePath, extName).then((editor) => {
      editorInstanceRef.current = editor;
    });

    return () => {
      if (editorInstanceRef.current) {
        editorInstanceRef.current.dispose();
        editorInstanceRef.current = null;
      }
    };
  }, [extName, filePath]);

  const handleSave = async () => {
    try {
      if (editorInstanceRef.current) {
        await saveModelToOpfs(filePath, editorInstanceRef.current!.getModel()!);
        console.log("File saved successfully");
      }
    } catch (error) {
      console.error("Error saving file:", error);
    }
  };

  return (
    <div
      data-path={filePath}
      style={{ width: "100%", height: "100%" }}
      ref={editorWrapperRef}
      onKeyDown={(e) => {
        const ctrlOrMeta = e.ctrlKey || e.metaKey;
        if (ctrlOrMeta && e.key === "s") {
          e.preventDefault();
          handleSave();
        }
      }}
    ></div>
  );
};
