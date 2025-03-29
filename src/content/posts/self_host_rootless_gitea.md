---
title: 自部署 gitea（rootless）
description: 今天我们来自部署 gitea！
publishDate: 2025-03-06
createTime: 2025-03-06
categories: 
  - 一技之长
tags:
  - 运维
  - 职场
  - gitops
draft: false
hidden: false
---
这篇文章不仅仅关于gitea部署，而是关于如何在一个没有相关体系的公司部署gitea。前面碎碎念比较多，如果需要看部署过程可以直接跳到 `## 部署`的章节。

也许很难让人相信，我们公司是没有在用git做版本管理的，更难以相信的是可能整个行业都是如此。
## 前言
我是做生物信息学的，对大部分从业者来说行业有两个方向，一个方向以高校等科研团队为客户，提供科研服务，另一个方向是以医生-病患为客户，提供第三方医疗检测。大多数做生信的，都是从生物转过来的，也就是说收到的基础训练是生物方向的，我们会了解更多关于DNA、蛋白质、人体、代谢等等生物学概念和彼此的关系，而信息学——编程能力更多作为解决问题的工具，自学或者参加培训班是从业者编程能力的主要来源。

我是在研究生的时候自学的，我的导师是完全不懂生信，一开始跟着另一个组的师兄学习，对方也就给了我一个网站让我自学Python。再之后，我研究的课题更加困难了，被引荐到另一个组里专门做生信的小导师那学习，但对方仅仅告诉了一下她做生信课题一般分为三个文件夹，分别存放代码、输入和输出，并留下一句「你的那个课题应该没什么复杂的，最多就用到`for`循环」便什么都没再管。于是大部分的编程知识都是在一次次的debug中学习，根本谈不上代码规范，更加也谈不上工程化。

在毕业之后我辗转加入了一家小型企业，职位是生物信息工程师。我对自己并不自信，我希望能够在职场中学到如何规范地编写代码。至少，我们是推行代码规范的，我也在这里学习了一整套代码风格还有行事规范。我们这里使用的是非常原始的版本管理方式，将修改了的文件，加上日期`-YYYYMMDD`的后缀在此每个项目单独建立的`history`文件夹，并将更改内容记录到文件夹内的`更新记录.txt`。

这样原始的版本管理带来很多不方便的问题，同个项目不同文件的更新被割裂，项目改变与改变日志的割裂等等。而这样的方式一直存活到现在，也是因为它其实够用了。虽然有种种不便，但它够用，最多也就是要多费点心神去比较。最重要的是，作为团队的一员，推行一整套工作流程的改变，是会受到很大的阻力的。

最后，我还是下定决心去改变。并不是因为不得不改变，纯粹是因为我觉得这样子更好。在过去的一年我接触到很多软件工程相关的知识，它们其实是属于我的行业内，而又一直没有被行业重视的知识。我曾经花费很多精力和时间吐槽我的公司我的领导技术落后。最近我想要辞职，追求更优秀的平台，但我也认识到，一个员工的价值，在于他为整个团队乃至整个公司带来了多少收益。也许我确实在自己的好奇心和努力下认识到了比身边的人更多的知识（比各个dalao还是少很多），但是如何将知识转换为影响力，转化为竞争力才是最重要的。正好随着行业不景气和公司内斗，我所在的团队就只剩下三个人了，阻力很小。就是现在！
## 计划与行动
在部署gitea之前，我已经用git管理了我负责的多套软件几个月的时间了。其实仅仅版本管理的话，git本身就足够了，但是考虑到团队使用，有web界面并支持`issue`、`pull request`等功能的git server也是非常的香。选择了gitea，一是因为它技术成熟并拥有活跃的社区，意味着拥有详尽的文档和解决问题的途径，而是它足够轻量，可以在尽可能小的影响下部署，不影响现有业务。实际上，我们服务器的配置很高，稍微重一点的方案也应该是可以接受的， 但「够用就好」是第一要义。

至于为什么用rootless的方案，很简单，就是因为我没有root权限，而我的账号在docker组内。现在我有条件在不请示上级的前提下试行方案。这是很重要的一点，目前我对该方案还有很多不了解的地方，我也没有信心能够说服现在不懂技术的领导让我分出精力推行一个没有短期收益的项目。
## 部署
首先要装好docker。因为众所众知的原因，docker镜像国内一般是没办法拉取的。如果你有办法可以直接拉，我只能在个人电脑上拉取后想办法上传到服务器。

我是这么做的：
```sh
# local
docker pull gitea/gitea:1.23.4-rootless
docker save -o gitea-rootless.tar gitea/gitea:1.23.4-rootless
```
服务端操作参考[官方文档](https://docs.gitea.com/installation/install-with-docker-rootless)
```sh
# server
docker load -i gitea-rootless.tar
# 创建`gitea`及次级文件夹，获取自己的UID和GID
mkdir gitea/{data,config}
cd gitea
touch docker-compose.yml
id
# uid=1006(niuma) gid=1002(huozangchang)
```

```yml
# docker-compose.yml
version: "1"

services:
  server:
    image: gitea/gitea:1.23.4-rootless
    environment:
      - GITEA__database__DB_TYPE=mysql
      - GITEA__database__HOST=db:3306
      - GITEA__database__NAME=gitea
      - GITEA__database__USER=gitea
      - GITEA__database__PASSWD=gitea
    user: 1006:1002  ## 根据id的输出更改，使gitea可以读写用户创建目录
    restart: always
    volumes:
      - ./data:/var/lib/gitea
      - ./config:/etc/gitea
      - /etc/timezone:/etc/timezone:ro
      - /etc/localtime:/etc/localtime:ro
    ports:
      - "3000:3000"
      - "222:22"
    depends_on:
      - db

  db:
    image: mysql:latest
    restart: always
    environment:
      - MYSQL_ROOT_PASSWORD=gitea
      - MYSQL_USER=gitea
      - MYSQL_PASSWORD=gitea
      - MYSQL_DATABASE=gitea
    volumes:
      - ./mysql:/var/lib/mysql
```

最后只需要`docker compose up -d`就可以了。
## 后记
gitea的初始化很简单，进入`{ip}:3000`就可以打开web服务，更改公司名字，其他项保持默认，然后注册第一个账号，即成为管理员账号。

但gitea并不是个人用的，所以这个初始化的工作更多是如何初始化工作团队。

我首先在服务器上挑选了两个有在进行git管理的我负责的项目，一个是比较庞大的分析流程A，一个是我最近新建的astro文档项目B。然后将近期的业务需求以issue形式在A repo提出，并介绍给同事。负责处理该issue的同事问需要他做什么，我说不用，你先按原来流程改代码，git操作我来帮你做就好了。随后完成新建分支和拉取合并请求。完成了比较简单的一套流程后，同事自然好奇地问了相关的事宜。我掏出图图科普，又耐心解答了疑问，引导同事进入实操环节。
![git工作流.avif](https://image.linglilongyi.com/2025/03/git工作流.avif)
之后在几轮友好的review-commit后我合并了同事的提交，完成了最初的推广。

当然这后面还有很多工作：
- [ ] 用上订阅 or Webhook提醒
- [ ] 增加 CI/CD流程
- [ ] 规范化权限管理
- [ ] 完善工作流
- [ ] 整理成册汇报给领导

