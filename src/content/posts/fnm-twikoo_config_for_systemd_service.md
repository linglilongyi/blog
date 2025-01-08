---
title: fnm-twikoo手搓service实战
description: 我的第一次手搓systemd service，记录fnm-twikoo的配置过程。
published: 2025-01-07
createTime: 2025-01-07
updated: 
category: know-why
tags:
  - 后端
image: https://images.unsplash.com/photo-1452802447250-470a88ac82bc
draft: false
hidden: false
---
## Table of contents

## 简介
本博客用的评论系统方案是twikoo，在VPS上部署，fnm管理Node版本，bun作为包管理器。最后在将twikoo后台运行作为systemd service以开机启动+后台挂载时遇到一些问题。最终方案见文末 。

## 前情提要
[雨霖铃慢](linglilongyi.com)用的评论系统是twikoo，因为VPS还有空间加上其实不太熟悉SAAS，就把twikoo部署到VPS上了。又因为一丢丢洁癖，没有选择用docker，根据官网需要安装Node.js然后利用包管理器安装tkserver。本着有新用新的冲浪心态，用fnm来管理Node版本，用bun来做包管理器。

::github{repo="Schniz/fnm"}
::github{repo="oven-sh/bun"}

按官网教程很简单就运行上tkserver（twikoo后端，或者叫云函数），现在可以通过 `TWIKOO_PORT=12345 MONGDB_URL=mongdb://example.com tkserver`来自定义参数运行。
官网在下方给出了提示：
> 1. Linux 服务器可以用 `nohup tkserver >> tkserver.log 2>&1 &` 命令后台启动
> 2. 数据默认在 data 目录，请注意定期备份数据
> 3. 默认端口为8080，自定义端口使用可使用 `TWIKOO_PORT=1234 tkserver` 启动。
> 4. 配置systemctl服务配合`TWIKOO_PORT=1234 tkserver`设置开机启动

我之前还没有自己编写过systemctl服务，那肯定要试一试。systemctl服务，其实是systemd下的一部分功能，可以以service unit的形式定义一些系统服务。service unit存储在`/usr/lib/systemd/system`，我们新建一个`twikoo.service`，并把命令填入Service块填入即可——吗？运行失败！


## 案情剖析
### systemctl service常规错误大赏
我们先看看最开始的`twikoo.service`.
```txt
[Unit]
Description=Twikoo
After=nginx.service

[Service]
ExecStart=TWIKOO_PORT=12345 MONGDB_URL='mongdb://example.com' tkserver


[Install]
WantedBy=multi-user.target
```
> [!CAUTION]
`systemctl status twikoo` 报出`twikoo.service: Failed at step EXEC spawning TWIKOO_PORT=12345: No such file or directory`

在原来的命令中，可以分为两个部分，ENV的设置和执行命令。很明显，ExecStart只能也只应该运行命令。进一步查阅，env的设置在service unit中有专门的key，修改了一下配置。
```txt
[Service]
Enviorment=TWIKOO_PORT=12345
Enviorment=MONGDB_URL='mongdb://example.com' 
ExecStart=tkserver 
```
> [!CAUTION]
Failed at step EXEC spawning tkserver: No such file or directory

欧，我们用bun安装的tkserver放在了`~/.bun/bin`，在开机时这个并不在PATH中，所以我们要改成绝对路径
```txt
ExecStart=/home/user/.bun/bin/tkserver
```

此时，status中显示“/usr/bin/env: ‘node’: No such file or directory”。咦，我们应该已经用fnm安装了node才对。

### fnm带来的node环境缺失
首先要回顾一下fnm安装过程。我用的是fish shell，在用脚本安装fnm的时候会创建`~/.config/fish/conf.d/fnm.fish`并写入：
```sh
set FNM_PATH "/home/user/.local/share/fnm"
if [ -d "$FNM_PATH" ]
  set PATH "$FNM_PATH" $PATH
  fnm env | source
end
```
而`fnm env`在fish下输出的第一行为`set -gx PATH "/run/user/1000/fnm_multishells/120614_1736240982933/bin" $PATH;`,而Node.js就在这里。

也就是说在fish下，Node的环境在启动阶段配好了，但system启动的阶段没有这个环境。那只要将这个环境放到service里就可以啦。

```txt
[Service]
Enviorment=TWIKOO_PORT=12345
Enviorment=MONGDB_URL='mongdb://example.com'
Enviorment=PATH=$PATH:/run/user/1000/fnm_multishells/120614_1736240982933/bin
ExecStart=/home/user/.bun/bin/tkserver
```

姑且是能跑起来了，但我觉得不够优雅，想找别的方法来实现，同时也想将环境信息集成到一个单独的文件里，于是得到了我的最终方案。

## 最终方案
在issue里面找到和同样的疑问[How do you start fnm binaries as a systemd service?](https://github.com/Schniz/fnm/issues/1023)，这个方案相对来说也更优雅一点。
然后在家目录下建了twikoo文件夹存放数据、配置和日志。
```txt twoslash
[Unit]
Description=Twikoo
After=nginx.service

[Service]
User=user
WorkingDirectory=/home/user/twikoo
EnvironmentFile=/home/user/twikoo/.env
ExecStart=/home/user/.local/share/fnm/fnm exec --using=23 /home/user/.bun/bin/tkserver > $TWIKOO_LOG 2>&1
// @log: 我尝试过用$BUN_BIN引入变量代替/home/user/.bun/bin，但失败了；如果项目没有.node_version文件需要提供--using={version}

[Install]
WantedBy=multi-user.target
```

```sh
TWIKOO_PORT=54321
MONGODB_URI='mongdb://example.com'
TWOKOO_LOG=/home/user/twikoo/tkserver.log
```

最后再总结一些自搓service要注意的问题：
> [!NOTE]
> 1. Exec*中的运行命令应为绝对路径，也不可用环境变量组合路径
> 2. 等号两边无空格
> 3. 注意要运行的程序是否在PATH中