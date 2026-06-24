# 豪斯助手原型 - 启动指南

## 如何启动

### 1. 打开终端

在 `Prototype` 文件夹所在目录打开终端（PowerShell），或使用 VS Code 终端。

### 2. 进入项目目录

```powershell
cd g:\VibeCoding\HouseAss\Prototype
```

### 3. 启动开发服务器

```powershell
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force
npm run dev
```

启动成功后，浏览器访问终端输出的地址，例如：

```
http://localhost:5173/
```

### 4. 停止服务器

在终端中按 `Ctrl + C` 即可停止。

---

## 常见问题

### 提示 "无法加载 npm.ps1"

运行以下命令后再执行 `npm run dev`：

```powershell
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force
```

### 端口被占用

如果提示端口被占用，Vite 会自动尝试下一个端口，关注终端输出的正确地址即可。

### 依赖缺失

如果首次启动报错缺少依赖，先安装：

```powershell
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force
npm install
```

---

## 项目文件位置

```
g:\VibeCoding\HouseAss\Prototype\   ← 原型项目根目录
g:\VibeCoding\HouseAss\PRD\         ← 产品文档（本文件所在目录）
```