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

```c
git init --bare ~/.cfg
```

​​

配置alias(别名)，指定git目录和工作空间

我这里用的 是 fish shell， 编辑 fish 配置文件(~/.config/fish/config.fish​)

```c
function config
    /usr/bin/git --git-dir=$HOME/.cfg/ --work-tree=$HOME $argv
end
```

bash 如下

```c
echo "alias config='/usr/bin/git --git-dir=$HOME/.cfg/ --work-tree=$HOME'" >> $HOME/.bashrc
```

配置不显示未追踪的文件

```c
config config --local status.showUntrackedFiles no
```

如果没有配置，则会一直提示 Untracked files;

![08b3606f203c9bf32b50046f06cf449c](https://attachment.tos-s3-cn-beijing.volces.com/2025/07/08b3606f203c9bf32b50046f06cf449c.png)

之后就可以向 repo 中添加配置文件了

```bash
⋊> ~ config add nvim                 
⋊> ~ config commit -m "Add nvim config"                                                                                                                                              04:58:31                                                                                                                                  04:57:56
```

注意要在父目录下 add 文件夹，

![37f1902fa15abce34635e92fa9e87c4f](https://attachment.tos-s3-cn-beijing.volces.com/2025/07/37f1902fa15abce34635e92fa9e87c4f.png)

不清楚为什么，这么 add 只添加了一个连接

```bash
config add ~/.config/nvim 
```

​​

创建一个新 repo

![54302965ec49e104c72b009c8760acbf](https://attachment.tos-s3-cn-beijing.volces.com/2025/07/54302965ec49e104c72b009c8760acbf.png)

根据提示的命令建立连接

![a640fdb7f21bba87342741a2b8b36268](https://attachment.tos-s3-cn-beijing.volces.com/2025/07/a640fdb7f21bba87342741a2b8b36268.png)

```c
⋊> ~ config remote add origin https://github.com/ch4m1gn0n/dotfiles.git                                                                                                              04:56:43
⋊> ~ config branch -M main                                                                                                                                                           04:57:04
⋊> ~ config push -u origin main
```

# 从 git 同步配置

```bash
echo ".cfg" >> .gitignore
```

​.gitignore​ 文件是一个 Git 仓库中的配置文件，用于指定哪些文件或目录应该被 Git 忽略，不纳入版本控制中。当您将文件添加到 .gitignore​ 中时，Git 将忽略这些文件的更改和提交。

```bash
git clone --bare <git-repo-url> $HOME/.cfg
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