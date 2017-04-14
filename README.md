## 准备开发环境

	```
	1. 安装nodejs

	2. 安装好node之后执行 `npm install -g cnpm`安装cnpm

	3. 执行`cnpm install`

	```

## h5-stub 目录

	目录为h5项目的模版，当项目开始时，可以参考该目录开发方式。

	本目录包含如下基础模块:

	```
	1. 缩放布局方案（一套设计，一套前端代码适应所有移动设备）, 包含sass基础模块(css/_fn.scss)及js(js/flexui.js)

	2. 基于gulp的自动化构建任务，包含sass预编译，js压缩，文件变化时浏览器自动刷新

	```
	如项目有其他需求，自行修改gulpfile.js添加任务

## 如何使用

	cd本目录下执行`gulp`或者`gulp help`查看使用帮助

	sass 开发参考 _fn.scss ，先将设计图宽度 配置到 $designWidth ， 在开发过程中 toUnit 这个 sass函数，值为实际PX宽度

## 注意事项
	
	npm install 的时候有可能会报node-sass 错误，可以执行
	```
	npm install node-saas
	```
	先安装gulp-sass的依赖模块 sass，其余错误请自行google、百度。