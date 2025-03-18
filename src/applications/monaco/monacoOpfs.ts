import * as monaco from "monaco-editor";
import { readTextFile, writeFile } from "@happy-js/happy-opfs";
import { getLanguage } from "./utils";

(function ensureMonacoIsInitialized() {
  if (!monaco.languages.typescript) {
    console.warn(
      "TypeScript language not registered initially, attempting to initialize"
    );
    monaco.languages.register({
      id: "typescript",
      extensions: [".ts", ".tsx"],
    });
  }
})();

export async function saveModelToOpfs(
  filePath: string,
  model: monaco.editor.ITextModel
): Promise<void> {
  const content = model.getValue();

  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  await writeFile(filePath, data, {
    create: true,
  });
}

async function createModelFromOpfsFile(
  filePath: string,
  language: string
): Promise<monaco.editor.ITextModel> {
  const text = (await readTextFile(filePath)).unwrap();

  // use filePath as the unique URI for the model
  const uri = monaco.Uri.parse(`file://${filePath}`);

  // check if a model with the same URI already exists
  const existingModel = monaco.editor.getModel(uri);
  if (existingModel) {
    existingModel.setValue(text);
    return existingModel;
  }

  // Create a new model
  const model = monaco.editor.createModel(text, language, uri);
  return model;
}

export async function initEditor(
  element: HTMLElement,
  filePath: string,
  extName: string
) {
  const language = getLanguage(extName);

  if ([".jsx", ".tsx", ".js", ".ts"].includes(extName)) {
    if (!monaco.languages.typescript) {
      console.error("TypeScript language service not available!");
    } else {
      monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
        allowJs: true,
        jsx: extName.endsWith("x")
          ? monaco.languages.typescript.JsxEmit.ReactJSX
          : undefined,
        target: monaco.languages.typescript.ScriptTarget.ESNext,
        moduleResolution:
          monaco.languages.typescript.ModuleResolutionKind.NodeJs,
        module: monaco.languages.typescript.ModuleKind.ESNext,
        allowSyntheticDefaultImports: true,
        esModuleInterop: true,
      });

      monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: false,
        noSyntaxValidation: false,
      });
    }
  }

  const monacoIns = monaco.editor.create(element, {
    language: language,
    autoClosingQuotes: "always",
    automaticLayout: true,
    theme: "vs",
    fontSize: 14,
    fontFamily: "Fira Code, monospace",
    fontLigatures: true,
  });

  const model = await createModelFromOpfsFile(filePath, language);
  monacoIns.setModel(model);
  return monacoIns;
}
