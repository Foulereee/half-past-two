# 凌晨两点半 · 阿里云 ESA 部署说明

适用项目：`Foulereee/half-past-two`，版本 1.1.0。文档核对日期：2026 年 10 月 24 日。

本文将 GitHub 仓库接入 **阿里云边缘安全加速 ESA → 函数和 Pages**。代码已准备好，阿里云控制台中的账号授权、开通和正式发布需要在你的阿里云账号内完成。

## 1. 准备好这三个入口

- 项目源码：<https://github.com/Foulereee/half-past-two>，目前为私有仓库，登录 `Foulereee` 后查看。
- 本地文件：`D:\esa\trae`。
- ESA 控制台：<https://esa.console.aliyun.com/>。

本产品不需要数据库、模型 API Key、第三方字体或图片服务。边缘函数负责提供写作提示，灵感正文保存在用户自己的浏览器。

本地可以先验证：

```powershell
cd D:\esa\trae
npm run check
npm run build
```

预期检查输出 `PASS`，并生成 `dist` 目录。

## 2. 从 GitHub 导入项目

1. 登录阿里云，进入 **ESA 控制台**。
2. 在左侧找到 **边缘计算和 AI → 函数和 Pages**。
3. 根据账号提示开通函数和 Pages 服务。服务是否可用、套餐和计费以你的控制台为准。
4. 点击 **创建**，选择 **导入 GitHub 仓库**。
5. 点击 **添加 GitHub 账号**，登录 `Foulereee`，完成 ESA 应用授权。授权范围需要包含 `half-past-two` 仓库。
6. 回到 ESA，在仓库搜索框输入 `half-past-two`，选中 `Foulereee/half-past-two`，点击下一步。

**私有仓库可能不会自动出现在初始列表里，需要输入仓库名称搜索。** 如果搜不到，检查 GitHub → Settings → Applications 中 ESA 对这个仓库的访问权限，再回控制台刷新。此行为见[阿里云 GitHub 导入说明](https://help.aliyun.com/zh/edge-security-acceleration/esa/user-guide/connect-pages-to-github)。

## 3. 填写构建信息

项目根目录已有 `esa.jsonc`，主要设置已随代码提供：

- **项目名**：`half-past-two`。
- **生产分支**：`main`。
- **根目录**：仓库根目录 `/`；不要填本机的 `D:\esa\trae`。
- **安装命令**：留空，项目没有需要安装的运行依赖。
- **构建命令**：`npm run build`。
- **静态资源目录**：`./dist`。
- **函数文件路径**：`./functions/index.js`。
- **Node.js 版本**：代码需要 20 或更高版本，选择控制台支持的符合条件版本。
- **环境变量**：本版本无需设置。

根目录配置的内容为：

```json
{
  "name": "half-past-two",
  "description": "凌晨两点半 · 深夜灵感日历",
  "entry": "./functions/index.js",
  "installCommand": "",
  "buildCommand": "npm run build",
  "assets": {
    "directory": "./dist",
    "notFoundStrategy": "singlePageApplication"
  }
}
```

`esa.jsonc` 的配置优先于对应控制台选项。后续要改构建命令或路径，应修改该文件并推送仓库。配置中的 `name` 会指向同名 ESA 项目；账号下已有同名的其他项目时，先把它改成一个独立名称。[官方构建与路由说明](https://help.aliyun.com/zh/edge-security-acceleration/esa/user-guide/build-pages)

确认后点击 **开始部署**。等待构建和发布成功，不需要租用 ECS，也不需要在边缘函数中运行 Node.js HTTP 服务。

## 4. 打开测试链接

发布成功后，从 ESA 控制台复制完整的测试访问链接。

官方文档说明：公共测试域名用于测试，访问需要 token 鉴权，token 有效期为 60 分钟。请保留控制台生成链接的鉴权参数；链接过期后，在控制台重新获取。不要把临时 token 写进源码、说明文件或 Git 提交。[测试域名说明](https://help.aliyun.com/zh/edge-security-acceleration/esa/user-guide/connect-pages-to-github)

如果首页能打开而接口被拒绝，先确认测试链接是否过期、请求是否需要相同的测试鉴权参数。前端会向同域 `/api/prompt` 转交页面地址中的 `token` 参数；正式自定义域名不需要这项测试参数。

## 5. 验证页面与边缘函数

先体验这几个操作：

1. 输入一句话并按 Enter，今天的日期中应出现灵感。
2. 刷新页面，记录应保留。
3. 点击日期，再点击灵感，检查叠层便签能打开、保存、收藏。
4. 写一条草稿后关闭窗口，点“继续草稿”检查恢复。
5. 点“备份”导出 JSON，再导入，条目不应重复增长。
6. 手机浏览器打开，检查记录入口、导航和备份按钮。

再检查边缘接口。**能打开页面不代表边缘函数已经成功部署**，写作提示存在离线回退，应查看实际响应。

在没有临时测试鉴权限制的正式域名上，使用 PowerShell：

```powershell
$esaUrl = 'https://你的正式域名'
Invoke-RestMethod -Uri "$esaUrl/api/health"
Invoke-RestMethod -Uri "$esaUrl/api/prompt"
```

健康接口应返回：

```json
{
  "ok": true,
  "app": "half-past-two",
  "version": "1.1.0",
  "storage": "browser-local"
}
```

提示接口应包含非空 `prompt`，并且 `source` 为 `esa-edge`。也可在浏览器开发者工具的 Network 中点击页面“借一点灵感”，检查 `/api/prompt` 的 JSON 响应。

开启 SPA 回退后，直接在地址栏访问 `/api/health` 属于导航请求，可能得到首页 HTML。请用上面的 `Invoke-RestMethod`、fetch 或 Network 验证 API；这是 ESA 的导航回退规则。[官方路由说明](https://help.aliyun.com/zh/edge-security-acceleration/esa/user-guide/build-pages)

## 6. 绑定长期使用的自定义域名

正式使用建议绑定自己的域名：

1. 确认域名对应的 ESA 站点已可用，按要求完成套餐开通与 NS 或 CNAME 接入。
2. 进入本项目，打开 **域名** 页签。
3. 在 **域名绑定** 中点击 **添加域名**，例如 `ideas.你的域名.com`。
4. 按控制台提示完成域名、DNS 和 HTTPS 状态检查。
5. 用新域名重新执行第 5 节的验证。

本项目是完整网站，使用“域名绑定”便于将整站交给该项目。域名绑定的前提和入口以[官方域名配置说明](https://help.aliyun.com/zh/edge-security-acceleration/esa/user-guide/trigger)为准。涉及已有站点时，选择专用子域名，避免覆盖正在使用的业务入口。

## 7. 把本地灵感搬到新网址

代码部署不会搬运浏览器里已有的私人灵感。请按以下步骤迁移：

1. 在原地址（例如 `http://127.0.0.1:4173`）打开产品。
2. 点 **备份 → 导出全部灵感**，下载 JSON。
3. 在新的正式网址打开产品。
4. 点 **备份 → 导入备份文件**，选择 JSON。
5. 检查灵感、收藏和草稿；确认后再关闭旧页面。

新网址会有自己的独立存储。多个设备之间需要手动导入导出，本版本没有账号登录和云端同步。网站部署上线后，记录仍保存在访问者各自的浏览器里。

## 8. 后续更新代码

在 `D:\esa\trae` 修改代码，先检查和构建，再提交：

```powershell
cd D:\esa\trae
npm run check
npm run build
git add public functions scripts esa.jsonc package.json README.md 使用说明.md 阿里云ESA部署说明.md docs .gitignore github-repository.json
git commit -m "Update midnight inspiration calendar"
git push origin main
```

GitHub 与 ESA 关联后，生产分支更新会触发构建部署。进入 ESA 查看本次构建日志和部署状态，成功后刷新页面验证。`dist` 不需要提交，云端会重新生成。[Git 工作流说明](https://help.aliyun.com/zh/edge-security-acceleration/esa/user-guide/what-is-functions-and-pages/)

遇到需要回退的情况，可在 ESA 的部署记录中按控制台提供的版本功能处理；或使用 `git revert` 撤回有问题的代码提交并再次推送。回退代码不会恢复已清除的浏览器灵感，数据恢复依赖备份。

## 9. 常见问题

**仓库找不到**：先确认 GitHub 登录的是 `Foulereee`；私有仓库需要搜索名称，并确保 ESA 应用获得访问权限。

**构建找不到 package.json**：根目录应选择仓库根 `/`；该仓库没有额外的项目子目录。

**构建成功却没有页面**：检查 `assets.directory` 是否为 `./dist`，以及构建日志是否执行了 `npm run build`。

**提示功能可用，但没有 source: esa-edge**：可能使用了本地回退。检查函数入口、同域请求和测试鉴权，不要只凭页面文案判断 API 已发布。

**测试链接 401 或 403**：从控制台重新获取带有效鉴权信息的链接；长期使用请配置正式域名。

**自定义域名打不开**：检查 ESA 站点可用状态、域名绑定、DNS 和 HTTPS 状态。

**换网址后记录没了**：这是不同来源的独立存储，回到原地址导出，再在新地址导入。

**直接上传 dist 能不能用**：可以运行静态前端，提示语使用离线回退；这不会同时上传 `functions/index.js`。需要完整 Pages + 函数能力时，使用本文的 GitHub 导入方式。

## 官方资料

- [从 GitHub 导入 Pages](https://help.aliyun.com/zh/edge-security-acceleration/esa/user-guide/connect-pages-to-github)
- [Pages 构建和路由](https://help.aliyun.com/zh/edge-security-acceleration/esa/user-guide/build-pages)
- [域名配置](https://help.aliyun.com/zh/edge-security-acceleration/esa/user-guide/trigger)
- [ESA 函数 Fetch API](https://help.aliyun.com/zh/edge-security-acceleration/esa/user-guide/fetch-1)

当前交付包含源码、构建产物、预览图和部署说明；没有代替你在阿里云执行开通、付费或正式发布。
