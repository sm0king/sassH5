var gulp = require("gulp")
	, gutil = require("gulp-util")

	, del = require("del")
	, sass = require("gulp-sass")
	, uglify = require('gulp-uglify')
	, rename = require("gulp-rename")
	, htmlmin = require('gulp-htmlmin')

	, browserSync = require("browser-sync").create()
	, reload = browserSync.reload

	, sequence = require("run-sequence")
	, plumber = require("gulp-plumber")
	, watch = require("gulp-watch")

	, through2 = require("through2")
	, path = require("path")
	, fs = require("fs");


// #############################################
// # init params

// 收集参数
var cwd = process.cwd();
var cmdargs = process.argv.slice(2);
var cmdname = cmdargs.shift();
var cmdopts = {};
var srcpath = "./src";
var distpath = "./dist";
var devpath = "./dev"

while (cmdargs.length) {
	var key = cmdargs.shift().slice(2);
	var val = cmdargs.shift();
	cmdopts[key] = key === "src" || key === "dist" ? normalizePath(val) : val;
}

// 参数配置
var release = cmdname === "release";
// var reloadTimer = null;
var devport = 5678;
var paths = {
	src: path.join(__dirname, srcpath),
	dev: path.join(__dirname, devpath),
	dist: path.join(__dirname, distpath)
}
var hotcached = {};
var cpFile = [];

function normalizePath(url) {
	if (url.charAt(0) === "/") {
		return path.normalize(url);
	}
	return path.normalize(path.join(cwd, url));
}

function setOptions(cmd, cmdopts) {
	if (cmd === "start") {
		paths.src = cmdopts.src ? path.join(cmdopts.src, srcpath) : paths.src;
		paths.dev = cmdopts.src ? path.join(cmdopts.src, devpath) : paths.dev;
	} else if (release) {
		paths.src = cmdopts.src ? path.join(cmdopts.src, srcpath) : paths.src;
		paths.dist = cmdopts.dist ? path.join(cmdopts.dist, distpath) : paths.dist;
	}
}

function showUsage() {
	console.log("Usage:\n");
	console.log("     gulp                   显示帮助");
	console.log("     gulp help              显示帮助 , 更多开发帮助，请查看README文件。");
	console.log("     gulp start --src src   在--src目录下自动化开发调试环境");
	console.log("     gulp release --src src --dist dist 构建--src线上版本到--dist目录\n");
}

// #############################################
// # default tasks

// # clean path
gulp.task("clean:dist", function () {
	return del([paths.dist]);
});
// # clean dev
gulp.task("clean:dev", function () {
	return del([paths.dev]);
});

// # 编译css
gulp.task("sass", function() {
	var base = paths.src;
	var dest = paths.dev;
	return gulp.src(base + "/**/*.scss", {base: base})
		.pipe(plumber())
		.pipe(sass({
			precision: 2,
			outputStyle: release ? "compressed" : "expanded",
			sourceComments: release ? false : true
		})
		.on("error", sass.logError))
		.pipe(gulp.dest(dest));
});

// # 压缩js
gulp.task("uglify", function() {
	var base = paths.src;
	var dest = paths.dist;
	return gulp.src(base + "/**/*.js", {base: base})
		.pipe(uglify())
		.pipe(gulp.dest(dest));
});
// # 复制静态资源
gulp.task("copy:dist", function() {
	var base = paths.src;
	var dest = release ? paths.dist : paths.dev;
	var ccfile = [base + "/*.ico","!" + base + "/**/*.scss"];
	if (release) {
		ccfile = ccfile.concat(cpFile);
		ccfile.push(base+"/**/*.{png,gif,jpg,mp3}");
	}else{
		ccfile.push(base + "/**/*");
	}
	return gulp.src(ccfile, {base: base})
		.pipe(gulp.dest(dest));
});


// # 将相关资源写入html
gulp.task("import", function() {
	var base = paths.src;
	var dest = release ? paths.dist : paths.dev;

	var options = {
        removeComments: release, // 清除HTML注释
        collapseWhitespace: release, // 压缩HTML
        minifyJS: release, // 压缩页面JS
        minifyCSS: release // 压缩页面CSS
    };

	function hotreload(dest) {
		var importTpl = '<$0 filepath="$1"$3>$2</$0>';
		var linkTpl = '<$0 $1="$2"$3></$0>';
		var rimport = /<!--\s+(import|link)\((.+?)\)\s+-->/g;
		// var stats = isRelease ? require("./release.stats.json") : {};
		var has = {};
		return through2.obj(function(file, enc, cb) {
			var raw = file.contents.toString();
			raw = raw.replace(rimport, function(a, t, src) {
				var abs = path.join(dest, src);
				var rel = path.relative(dest, abs).replace(/\\/g, "/");
				var ext = path.parse(src).ext;
				var url = src;
				url = url;
				var map = [];
				if (!release) {
					t = "link";
				}
				if (t === "import") {
					map = [
						ext === ".svg" ? "p" : ext === ".js" ? "script" : "style",
						url,
						has[abs] || (has[abs] = fs.readFileSync(abs, "utf-8")),
						ext === ".svg" ? ' style="display:none"' : ''
					];
					hotcached[src] = src;
				} else {
					cpFile.push(abs);
					map = [
						ext === ".js" ? "script" : "link",
						ext === ".js" ? "src" : "href",
						url,
						ext === ".css" ? ' rel="stylesheet"' : ""
					];
				}
				return (t === "import" ? importTpl : linkTpl).replace(/\$(\d+)/g, function(a, i) {
					return map[i];
				});
			});
			file.contents = new Buffer(raw);
			this.push(file);
			cb();
		});
	}

	return gulp.src([
			base + "/*.html",
		], {base: base})
		.pipe(plumber())
		.pipe(through2.obj(function(file, enc, cb) {
			var url = file.path.replace(base, "");
			url = url.replace(/\\/g, "/");
			hotcached[url] = url;
			this.push(file);
			cb();
		}))
		.on("error", console.log)
		.pipe(hotreload(base))
		.pipe(htmlmin(options))
		.pipe(gulp.dest(dest));
});

// # serv & watch
gulp.task("server", function() {
	var rebuildTimer = null;
	var reloadTimer = null;
	var rebuildTasks = [];
	// start server
	browserSync.init({
		ui: false,
		notify: false,
		port: devport,
		server: {
			baseDir: paths.dev
		}
	});

	// # watch src资源, 调用相关任务预处理
	watch(paths.src + "/**/*", function(obj) {
		var url = obj.path.replace(/\\/g, "/");
		var absurl = url;
		url = path.relative(paths.src, url);
		// scss
		if (/\.scss$/.test(url)) {
			pushTask("sass");
		}

		// copy 静态资源
		if (/\.html$|(?:img|js)\/.*?\.(?:html|js|png|svg|jpg|gif|mp3)$/.test(url)) {
			cpFile.push(absurl);
			pushTask("copy:dist");
		}
		if (hotcached) {
			for (var p in hotcached) {
				if (absurl.indexOf(p) > 0) {
					pushTask("import");
					break;
				}
			}
		}
		// 输出文件名
		if (rebuildTasks.length) {
			console.log("[change file] " + url);
			rebuild();
		}
	});

	function pushTask(name) {
		if (rebuildTasks.indexOf(name) === -1) {
			rebuildTasks.push(name);
		}
	}

	function rebuild() {
		if (rebuildTimer) {
			clearTimeout(rebuildTimer);
		}
		rebuildTimer = setTimeout(function() {
			var tasks = rebuildTasks.slice(0);
			rebuildTasks = [];
			if (tasks.length) {
				sequence.apply(null, tasks);
			}
		}, 500);
	}

	// # 限制浏览器刷新频率
	watch(paths.dev + "/**/*", function() {
		if (reloadTimer) {
			clearTimeout(reloadTimer);
		}
		reloadTimer = setTimeout(reload, 1000);
	});
});


// #############################################
// # public task

gulp.task("default", showUsage);
gulp.task("help", showUsage);

gulp.task("start", function(cb) {
	setOptions("start", cmdopts);
	sequence("clean:dev",["sass", "copy:dist"],"import", "server", cb);
});

gulp.task("release", function(cb) {
	setOptions("release", cmdopts);
	sequence("clean:dist", ["sass", "uglify"], "import", "copy:dist", cb);
});