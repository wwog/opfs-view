import { useRef, useState, useEffect } from "react";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";

export const MonacoEditor = () => {
  const [editor, setEditor] =
    useState<monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoEl = useRef(null);

  useEffect(() => {
    if (monacoEl) {
      setEditor((editor) => {
        if (editor) return editor;

        return monaco.editor.create(monacoEl.current!, {
          value: ["SELECT * FROM users"].join("\n"),
          language: "sql",
        });
      });
    }

    return () => editor?.dispose();
  }, [monacoEl.current]);

  return <div ref={monacoEl} style={{ width: "100%", height: "100%" }}></div>;
};
