chrome.devtools.panels.create(
  "BrowserDisk", // 面板名称
  "128.png", // 图标路径（需要提供一个图标文件）
  "index.html", // 面板内容页面
  (panel) => {
    // 在面板加载完成后执行的代码
    console.log("Panel loaded");
    panel.onShown.addListener(() => {
      console.log("Panel shown");
      // 这里可以执行一些初始化操作
    });
  }
);
