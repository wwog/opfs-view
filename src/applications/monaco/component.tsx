import { useRef, type FC } from "react";
import type { ApplicationProps } from "../../services/appService/types";
import { readTextFile } from "@happy-js/happy-opfs";
import * as monaco from "monaco-editor";
import { useOnce } from "../../hooks/useOnce";
import { getLanguage } from "./utils";

export const MonacoEditor: FC<ApplicationProps> = (props) => {
  const { filePath, extName } = props;
  const editorRef = useRef(null);

  useOnce(() => {
    console.log("MonacoEditor Will Open File:", { extName, filePath });

    readTextFile(filePath)
      .then((data) => {
        return data.unwrap();
      })
      .then((str) => {
        monaco.editor.create(editorRef.current!, {
          value: str,
          language: getLanguage(extName),
          autoClosingQuotes: "always",
          automaticLayout: true, // 自动调整布局
          theme: "vs", // 可以选择 'vs', 'vs-dark', 或 'hc-black'
        });
        if ([".jsx", ".tsx", ".js", ".ts"].includes(extName)) {
          monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
            allowJs: true,
            jsx: extName.endsWith("x")
              ? monaco.languages.typescript.JsxEmit.ReactJSX
              : undefined,
            target: monaco.languages.typescript.ScriptTarget.ESNext,
          });
        }
      });
  }, [extName, filePath]);

  return <div style={{ width: "100%", height: "100%" }} ref={editorRef}></div>;
};
