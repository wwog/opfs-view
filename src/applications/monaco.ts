import type { Application } from "../services/appService/types";
import { MonacoEditor } from "./monaco/component";
import * as monaco from "monaco-editor";
import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import jsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker";
import cssWorker from "monaco-editor/esm/vs/language/css/css.worker?worker";
import htmlWorker from "monaco-editor/esm/vs/language/html/html.worker?worker";
import tsWorker from "monaco-editor/esm/vs/language/typescript/ts.worker?worker";
import { basename } from "../utils/opfsPath";

// 配置Monaco的Web Worker
self.MonacoEnvironment = {
  getWorker(_: any, label: string) {
    if (label === "json") {
      return new jsonWorker();
    }
    if (label === "css" || label === "scss" || label === "less") {
      return new cssWorker();
    }
    if (label === "html" || label === "handlebars" || label === "razor") {
      return new htmlWorker();
    }
    if (label === "typescript" || label === "javascript") {
      return new tsWorker();
    }
    return new editorWorker();
  },
};

// 全局配置
monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true);
monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
  noSemanticValidation: false,
  noSyntaxValidation: false,
});

// // 避免 workers 的初始化竞争
// setTimeout(() => {
//   // 预热TypeScript worker
//   monaco.languages.typescript.getTypeScriptWorker();
// }, 100);

export const monacoApplication: Application = {
  id: "monaco",
  name: "Text Editor",
  icon: "📝",
  supportedFileTypes: ["*"],
  component: MonacoEditor,
  showName: (_: string, path: string) => basename(path),
};
