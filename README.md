## 准备开发环境

```shell
1. 安装nodejs

2. 执行`npm install`
```

## h5-stub 目录

目录为h5项目的模版，当项目开始时，可以参考该目录开发方式。

本目录包含如下基础模块:

1. 缩放布局方案（一套设计，一套前端代码适应所有移动设备）, 包含sass基础模块(css/_fn.scss)及js(js/flexui.js)

2. 基于gulp的自动化构建任务，包含sass预编译，js压缩，文件变化时浏览器自动刷新
   如项目有其他需求，自行修改gulpfile.js添加任务

## 如何使用

cd本目录下执行`gulp`或者`gulp help`查看使用帮助

sass 开发参考 _fn.scss ，先将设计图宽度 配置到 $designWidth ， 在开发过程中 toUnit 这个 sass函数，值为实际PX宽度

边框 border 依然使用px 不使用rem

新建项目就在此目录下新建新的文件夹作为新的目录，这样开发的时候就可以使用如下命令开发

```shell
1. gulp start --src [folder name] 
```

使用如下命令打包：

```shell
1. gulp release --src [folder name] --src [folder name]
```

特别注意，

如果使用的JS和CSS在打包的时候加载在页面中
在html中使用引入js和css时，使用 <!-- import(**/**/*.{js,html}) --> 的方式进行引入
如果依然使用正常的方式进入js则使用 <!-- link(**/**/*.{js,html}) --> 的方式进行引入 或者正常引入

## 注意事项

1. npm install 的时候有可能会报node-sass 错误，可以执行

 ```shell
 npm install node-saas
 ```

 先安装gulp-sass的依赖模块 sass，其余错误请自行google、百度。

2. 如果使用npm install  安装失败，可以使用yarn安装，或者使用淘宝的镜像
 ```shell
 npm config set registry https://registry.npm.taobao.org
 ```

 或者使用cnpm
 ```shell
 npm install -g cnpm --registry=https://registry.npm.taobao.org
 cnpm  install
 ```
 ​