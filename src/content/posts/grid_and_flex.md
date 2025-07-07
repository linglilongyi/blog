---
title: 【CSS】grid和flex视图
description: 本文简单介绍了网页中通过css实现grid和flex两种视图的基本知识和示例。
publishDate: 2025-06-28T02:25:00
createTime: 2025-06-26
categories:
  - 一技之长
tags:
  - CSS
draft: false
hidden: false
---
## 1.前言
obsidian插件year-glance的作者希望将原来的行列布局改成grid，能更好响应窗口大小的变化，但分身乏术，于是我便接下这次的[pr](https://github.com/Moyf/yearly-glance/pull/61)。我粗略学习了一下grid和flex两种布局类型，顺便写（水）一篇博客叭。

## 2.网页布局
首先网页是什么？网页是在**HTML**中的元素按照**CSS**中的规则被浏览器渲染出来，如果其中有需要交互的逻辑会涉及到**JavaScript**。今天我们的话题只涉及到布局，所以就是元件与其样式，只涉及**HTML**和**CSS**。当没有CSS的时候，元素按照默认的样式，以从上到下的形式排布。
```html
<!DOCTYPE html>
<html>
<body>
<!-- 父元素 -->
<div class="container">
  <!-- 子元素 -->
  <div>1</div>
  <div>2</div>
  <div>3</div>  
  <div>4</div>
  <div>5</div>
  <div>6</div>  
  <div>7</div>
  <div>8</div>
</div>

</body>
</html>
```
上面的就是最简单的HTML，一个HTML元素由开始标签和结束标签包裹。而在一个元素内部的元素就会成为子元素，相应在外面的就是父元素。class可以为元素添加类型，之后就可以针对类型编写样式。那上面的例子里，我们在页面中创建了一个类型为container的块，里面包裹了8个子元素块，他们按行排列。我们可以利用`.container > div`来选中容器内的子块并赋予样式。
![](https://image.linglilongyi.com/2025/06/grid_and_flex-1751016323481.webp)
## grid
但这个网页空间的利用率就低了。我们希望能够简单地将这些块在空间上妥善排布。那么我们就要在style片段中插入一下css代码：
```css
.container {
  display: grid;  /* 启用网格样式 */
  grid-template-columns: auto auto auto; /* 控制子元素排布的方式，三列，根据内容自动获取宽度 */
  padding: 10px;  /* 缩进 */
  gap: 5px; /* 间隔 */
}
```

采用 Grid 布局的元素，称为 Grid 容器（grid container），简称"容器"。它的所有子元素自动成为容器成员，称为 Grid 项目（grid item），简称"项目"。

![](https://image.linglilongyi.com/2025/06/grid_and_flex-1751016813967.webp)
容器项目按我们所描述的要求排布，通过改变窗口大小可以看到项目宽度跟随容器宽度改变。如果我们改变项目元素内容，加长一点，可以看到auto会导致项目宽度并不一致。如果想要固定项目的宽度，我们可以使用 `grid-template-columns: 15px 15px 30px;` 绝对宽度控制。而若希望项目根据容器动态调整，我们可以使用 `grid-template-columns: 1fr 1fr 3fr;` 来控制各列所占比例，如果3fr的块比例并没有1fr的3倍，那就代表还有别的属性控制了宽度，可以再自行排查。

那如果我们想一行把八个块均分到网格内，需要重复写八次吗？`grid-template-columns: repeat(8,1fr);` 可以简单地实现重复的设置。但是现在css中的布局并不够语义化，就是说代码与渲染结果间的联系不够直观，这会增加编码的心智负担。我们可以给子元素也加上类型，并给网格元素加上名字。
```html
<!DOCTYPE html>
<html>
<head>
<style>
.item1 { grid-area: header; }
.item2 { grid-area: menu; }
.item3 { grid-area: main; }
.item4 { grid-area: right; }
.item5 { grid-area: footer; }
.container {
  display: grid;
  grid-template: 
    'header header header header'
    'menu main main right'
    'footer footer footer footer' ;
  padding: 10px;
  gap: 5px; 
}
.container > div {
  background-color: #f1f1f1;
  border: 1px solid black;
  padding: 10px;
  font-size: 30px;
  text-align: center;
}
</style>
</head>
<body>
<div class="container">
  <div class="item1">Header</div>
  <div class="item2">Menu</div>
  <div class="item3">Main</div>  
  <div class="item4">Right</div>
  <div class="item5">Footer</div>
</div>

</body>
</html>

```
我们首先跳过style的部分，看网页的内容。我们给每个项目都加上了itemx的类型。然后在style的一开始，利用grid-area我们将项目与网格区域的id绑定，或者说我们将子块变成了活字印刷中的字块。然后我们在`grid-template`中放置字块。注意网格的各行需要等宽，如果希望某些格子要空缺，可以使用未绑定的id填充，比如blank。最后我们渲染出来的就是很熟悉的三列式网页，是很经典的网页布局。
![](https://image.linglilongyi.com/2025/06/grid_and_flex-1751018079223.webp)

## flex
flex布局可以翻译为弹性布局，意思就是子元素在父元素内根据父元素的形状弹性改变。与网格grid最大的区别是，flex是一维的，在行或列上弹性分布。

采用 Flex 布局的元素，称为 Flex 容器（flex container），简称"容器"。它的所有子元素自动成为容器成员，称为 Flex 项目（flex item），简称"项目"。

![](https://image.linglilongyi.com/2025/06/grid_and_flex-1751034799001.webp)
容器默认存在两根轴：水平的主轴（main axis）和垂直的交叉轴（cross axis）。主轴的开始位置（与边框的交叉点）叫做`main start`，结束位置叫做`main end`；交叉轴的开始位置叫做`cross start`，结束位置叫做`cross end`。项目默认沿主轴排列。单个项目占据的主轴空间叫做`main size`，占据的交叉轴空间叫做`cross size`。所以根据这些值就可以将项目精确的放置于容器各个位置。

接下来我们也用flex布局来实现三列式的网页，并且在小屏设备中变为一列。

```HTML
<!DOCTYPE html>
<html>
<head>
<style>
.HolyGrail {
  display: flex;
  min-height: 100vh;
  flex-direction: column;  /* 网页主体以纵向为主轴，内容从上到下依次排布*/
}
/* 内容主体包含侧栏、文章和右侧栏 */
@media (max-width: 768px) {
  .container {
    flex-direction: column; 
    /* 当界面宽度小于768px时，可以认为是手机平板端，此时也以纵向为轴层叠项目*/
    flex: 1;
  }
  .sidebar,
  .content,
  .right {
    flex: auto;
  }
}

.container {
  display: flex;
  /* PC端则默认横向轴，并列排布项目 */
  flex: 1;
  padding: 10px;
  gap: 5px; 
}
.container > div {
  background-color: #f1f1f1;
  border: 1px solid black;
  padding: 10px;
  font-size: 30px;
}

.right .sidebar {
	flex: 0 0 12em;
}

.content {
  flex: 1;
}

header,footer{
  background-color: #f1f1f1;
  border: 1px solid black;
  padding: 10px;
  font-size: 30px;
</style>
</head>
<body class=HolyGrail >
 <header>Header</header>
 <div class="container">
  <div class="sidebar">sidebar</div>
  <div class="content">Main</div>  
  <div class="right">Right</div>
 </div>
 <footer>Footer</footer>

</body>
</html>
```

![](https://image.linglilongyi.com/2025/06/grid_and_flex-1751048259145.webp)



本文用到的截图都是来自于w3schools的文档及其在线playground。关于grid和flex其余的属性可以翻查文档，两者也可以组合起来做成更加灵活美观的界面~