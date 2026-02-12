---
title: Chezmoi 实践：跨平台 dotfile 管理
date: 2025-07-02
categories:
- config
tags:
- config
---
之前一直使用 github 裸仓库 管理 dotfile 的同步，最近在处理服务器同步冲突时，不小心 `clean -fd` 把 `home` 目录清了干净。痛定思痛，来尝试下用 Chezmoi 管理。
[参考文章](https://ivonblog.com/posts/chezmoi-manage-dotfiles/)
## 0x00 安装
### 1. mac

```bash
brew install chezmoi

# 验证安装成功
chezmoi --version
```

### 2. Debian 服务器
直接下载 二进制文件
```bash
sh -c "$(curl -fsLS get.chezmoi.io)"
```
安装完成后同样通过 `chezmoi --version` 验证。

## 0x01 初始化
```bash
chezmoi init
```
会创建文件夹 `~/.local/share/chezmoi/`，这是 chezmoi 的本地存储目录。

## 0x02 管理dotfiles

```bash
# 添加 dotfiles
chezmoi add ~/.hyper.js
#...
```
添加之后会将文件备份到 `~/.local/share/chezmoi/`

`chezmoi managed` 可以列出所有已添加的文件：
```bash
$ chezmoi managed
.hyper.js
.config/fish/config.fish
...
```

## 0x03 同步到 git
```
# 进入存储目录
cd .local/share/chezmoi/
# 或者
chezmoi cd

# 同步(提前把库创建好)
git remote add origin https://github.com/{用户名}/dotfiles.git
git branch -M main
git add ./
git commit -m 'sync'
git push origin main
```
## 0x04 自动 push 更新
配置 chezmoi
`~/.config/chezmoi/chezmoi.toml`
添加：
```
[git]
    autoCommit = true
    autoPush = true

```
## 0x05 基本使用（类似 git）
#### 1. 修改本地文件后添加到 chezmoi 存储库
`chezmoi status` 查看修改状态，我这里是修改了 `home` 目录的文件：
```bash
$ chezmoi status
 M .hyper.js
```

想要将本地修改应用到 chezmoi 库，只需再 `add` 下：
```bash
chezmoi add ~/.hyper.js
```

如果配置了 `autoPush` 但还没设置上游分支，添加文件时可能会报错：
```
error: failed to run "git push": ...
hint: git push --set-upstream origin main
```

手动在 chezmoi 库目录下 `~/.local/share/chezmoi/` 运行一下提示的命令就可以了：
```bash
git push --set-upstream origin main
```
之后就可以正常同步了。

#### 2. 修改存储库文件应用到本地
通过 `chezmoi edit` 编缉 chezmoi 库的文件，之后通过 `chezmoi apply` 应用到本地：

```bash
chezmoi edit ~/.hyper.js    # 注意这里的文件名是你本地的文件名，不是 chezmoi 存储库中的名称
chezmoi apply -v
```

## 0x06 多端同步
### 1. 拉取 github 配置并应用到本地
```bash
chezmoi init username  # 如果你的github库名叫dotfiles，不是的话下面url这种:
chezmoi init https://user@github.com/user/dotfiles.git
chezmoi apply -v # 应用配置
```

### 2. github 文件修改后同步到本地
```bash
chezmoi update
```
这个命令会做两件事：
1. 拉取：从 GitHub（你配置的远程仓库）获取最新的源状态。
2. 应用：将获取到的更改应用到你的当前系统中（即更新你的 dotfiles）。

更多参考[官方文档](https://www.chezmoi.io/reference/commands/init/)
