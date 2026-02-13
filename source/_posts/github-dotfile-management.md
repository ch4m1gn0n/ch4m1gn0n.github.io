---
title: github：跨平台 dotfile 管理
date: 2025-07-02
categories:
- config
tags:
- config
---
参考文章：[How to Store Dotfiles - A Bare Git Repository | Atlassian Git Tutorial](https://www.atlassian.com/git/tutorials/dotfiles)

# 将配置同步到git

创建一个 bare repository

[bare repo 详解](https://cloud.tencent.com/developer/article/1825910)

```bash
git init --bare ~/.cfg
```

配置alias(别名)，指定git目录和工作空间

我这里用的 是 fish shell， 编辑 fish 配置文件(~/.config/fish/config.fish​)

```bash
function config
    /usr/bin/git --git-dir=$HOME/.cfg/ --work-tree=$HOME $argv
end
```

bash 如下

```bash
echo "alias config='/usr/bin/git --git-dir=$HOME/.cfg/ --work-tree=$HOME'" >> $HOME/.bashrc
```

配置不显示未追踪的文件

```bash
config config --local status.showUntrackedFiles no
```

如果没有配置，`config status` 会一直提示大量 Untracked files：
```
On branch main
Untracked files:
  (use "git add <file>..." to include in what will be committed)
        .cache/
        .local/
        ...
```

之后就可以向 repo 中添加配置文件了

```bash
config add nvim
config commit -m "Add nvim config"
```

注意要在父目录下 add 文件夹，不要使用绝对路径 `config add ~/.config/nvim`，否则可能只会添加一个链接而非完整目录。

创建一个新 GitHub repo（命名为 `dotfiles` 或其他），然后根据提示建立连接：

```bash
config remote add origin https://github.com/ch4m1gn0n/dotfiles.git
config branch -M main
config push -u origin main
```

# 从 git 同步配置

```bash
echo ".cfg" >> .gitignore
```

​.gitignore​ 文件是一个 Git 仓库中的配置文件，用于指定哪些文件或目录应该被 Git 忽略，不纳入版本控制中。当您将文件添加到 .gitignore​ 中时，Git 将忽略这些文件的更改和提交。

```bash
git clone --bare <git-repo-url> $HOME/.cfg
```

```bash
/usr/bin/git --git-dir=$HOME/.cfg/ --work-tree=$HOME checkout
```

可能遇到的问题

```bash
error: The following untracked working tree files would be overwritten by checkout:
    .bashrc
    .gitignore
Please move or remove them before you can switch branches.
Aborting
```

因为已经有些配置文件存在了，提示将会被覆盖，备份删除上面提示的文件就可以了

shell 脚本：

```bash
#!/bin/bash
git clone --bare https://bitbucket.org/durdn/cfg.git $HOME/.cfg
function config {
   /usr/bin/git --git-dir=$HOME/.cfg/ --work-tree=$HOME $@
}
mkdir -p .config-backup
config checkout
if [ $? = 0 ]; then
  echo "Checked out config.";
  else
    echo "Backing up pre-existing dot files.";
    config checkout 2>&1 | egrep "\s+\." | awk {'print $1'} | xargs -I{} mv {} .config-backup/{}
fi;
config checkout
config config status.showUntrackedFiles no
```
