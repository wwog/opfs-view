export const getLanguage = (ext: string) => {
  const extension = ext.startsWith(".") ? ext.substring(1) : ext;
  const languageMap: Record<string, string> = {
    js: "javascript",
    jsx: "javascript",
    ts: "typescript",
    tsx: "typescript",
    html: "html",
    css: "css",
    json: "json",
    md: "markdown",
    py: "python",
    java: "java",
    c: "c",
    cpp: "cpp",
    cs: "csharp",
    go: "go",
    php: "php",
    rb: "ruby",
    rs: "rust",
    swift: "swift",
    sh: "shell",
    yaml: "yaml",
    yml: "yaml",
    xml: "xml",
    sql: "sql",
    txt: "plaintext",
  };

  return languageMap[extension.toLowerCase()] || "plaintext";
};
