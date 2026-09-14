[繁體中文](README.md) ｜ [简体中文](README.zh-CN.md) ｜ [English](README.en.md)

# ColorWalk · 色彩漫步

把散步变成颜色收集游戏：选择主题色与严格度，用相机记录沿途颜色，结束后保存色卡并查看档案。在线体验：https://color-walk-sable.vercel.app。

## 第一次使用

先安装 Node.js 22.12+ LTS，下载并解压仓库，在包含 package.json 的文件夹打开终端，然后依次执行：

```sh
npm ci
npm run dev
```

保持终端打开，在浏览器访问终端显示的地址。结束时在终端按 Ctrl+C。

初次使用先选主题、设置规则，再允许相机访问。localhost 可使用相机，公开部署需 HTTPS。照片使用浏览器本地存储；删除站点数据会丢失档案。可选 Supabase 配置用于统计，未配置时相关功能不可用；生产端权限需单独核验。README 的三语言入口不等于每个界面文本都完成了翻译测试。未经授权，请勿用于商业用途。

## 读代码或修改时看哪里

| 文件 | 作用 |
|---|---|
| `src/App.jsx` | 页面切换、行走流程与旧数据迁移 |
| `src/pages` | 各功能页面 |
| `src/utils/colorUtils.js` | 颜色匹配规则 |
| `src/utils/i18n.js` | 界面翻译 |
| `src/utils/storage.js` | 照片本地存储 |

## 修改后怎么检查

运行 `npm run lint` 执行已配置的类型检查，运行 `npm run build` 构建生产文件。通过检查不代表相机权限、数据恢复或所有页面都已实测。

## 详细参考

[原有说明](README.original.md) 保留历史细节和来源署名，语言保持原样。部分描述属于旧版本；有差异时以当前源码和本入口说明为准。
