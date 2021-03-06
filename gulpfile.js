'use strict';

var gulp = require('gulp'),
		less = require('gulp-less'),
		cssnano = require('gulp-cssnano'),
		autoprefixer = require('gulp-autoprefixer'),
		cached = require('gulp-cached'),
		gutil = require('gulp-util'),
		rename = require('gulp-rename'),
		browserSync = require("browser-sync"),
		reload = browserSync.reload,
		plumber = require('gulp-plumber'),
		prettify = require('gulp-prettify'),
		pug = require('gulp-pug'),
		imagemin = require('gulp-imagemin'),
		pngquant = require('imagemin-pngquant'),
		jpegoptim = require('imagemin-jpegoptim'),
		spritesmith = require('gulp.spritesmith'),
		buffer = require('vinyl-buffer'),
		uglify = require('gulp-uglify'),
		gulpFilter = require('gulp-filter'),
		concat = require('gulp-concat'),
		rigger = require('gulp-rigger'),
		flatten = require('gulp-flatten'),
		del = require('del'),
		svgstore = require('gulp-svgstore'),
		svgmin = require('gulp-svgmin'),
		cheerio = require('gulp-cheerio'),
		runSequence = require('run-sequence').use(gulp);

var path = {
	src: {
		less: 'src/less/style.less',
		pug: 'src/pug/**/[^_]*.pug',
		img: ['src/img/**/*.*', '!src/img/sprite/*.*'],
		pngSprite: 'src/img/sprite/**/*.png',
		js: 'src/js/**/*.js',
		fonts: 'src/fonts/**/*',
		svgSprite: 'src/img/svg-sprite/**/*.svg'
	},
	build: {
		styles: 'dist/css',
		html: 'dist/',
		img: 'dist/img',
		pngSprite: 'dist/img',
		pngSpriteCSS: 'src/less/components',
		js: 'dist/js',
		fonts: 'dist/fonts',
		clean: 'dist/**/*',
		svgSprite: 'dist/img/svg',
	},
	watch: {
		less: 'src/less/**/*.less',
		pug: 'src/pug/**/*.pug',
		img: ['src/img/**/*.*', '!src/img/sprite/*.*'],
		pngSprite: 'src/img/sprite/**/*.png',
		js: 'src/js/**/*.*',
		fonts: 'src/fonts/**/*',
		svgSprite: 'src/img/svg-sprite/**/*.svg',
	}
};

var autoprefixerBrowsers = ['last 3 versions', '> 1%', 'Firefox ESR'];

var browserSyncConfig = {
	server: './dist',
	baseDir: './dist',
	tunnel: false,
	host: 'localhost',
	port: 9000,
	injectChanges: true,
	delay: 100,
	logPrefix: 'project'
};

// SVG sprite
gulp.task('svg-sprite', function () {
	return gulp.src(path.src.svgSprite)
		.pipe(plumber(function(error) {
			gutil.log(gutil.colors.red(error.message));
			this.emit('end');
		}))
		.pipe(svgmin())
		.pipe(svgstore())
		.pipe(cheerio({
			run: function ($, file) {
				$('svg').addClass('hide');
				$('[fill]').removeAttr('fill');
			},
			parserOptions: { xmlMode: true }
		}))
		.pipe(cached('svg-sprite'))
		.pipe(gulp.dest(path.build.svgSprite))
		.pipe(reload({stream: true}));
});

// LESS
gulp.task('less', function () {
	gulp.src(path.src.less)
		.pipe(plumber(function(error) {
			gutil.log(gutil.colors.red(error.message));
			this.emit('end');
		}))
		.pipe(less())
		.pipe(autoprefixer(autoprefixerBrowsers))
		.pipe(cssnano({ minifyFontValues: false, discardUnused: false }))
		.pipe(rename({ suffix: '.min' }))
		.pipe(cached('less'))
		.pipe(gulp.dest(path.build.styles))
		.pipe(reload({stream: true}));
});

// PUG
gulp.task('pug', function() {
	return gulp.src(path.src.pug)
		.pipe(plumber(function(error) {
			gutil.log(gutil.colors.red(error.message));
			this.emit('end');
		}))
		.pipe(pug({
			pretty: true
		}))
		.pipe(prettify({indent_size: 2}))
		.pipe(cached('pug'))
		.pipe(gulp.dest(path.build.html))
		.pipe(reload({stream: true}));
});

// IMAGES
gulp.task('img', function () {
	return gulp.src(path.src.img)
		.pipe(plumber(function(error) {
			gutil.log(gutil.colors.red(error.message));
			this.emit('end');
		}))
		.pipe(imagemin({
			progressive: true,
			optimizationLevel: 3,
			use: [pngquant(),jpegoptim({max: 80})],
			interlaced: true
		}))
		.pipe(cached('img'))
		.pipe(gulp.dest(path.build.img))
		.pipe(reload({stream: true}));
});

// PNG SPRITES
gulp.task('png-sprite', function () {
	var spriteData =
		gulp.src(path.src.pngSprite)
			.pipe(spritesmith({
				padding: 1,
				imgName: 'sprite.png',
				cssName: '_sprite-position.less',
				imgPath: '../img/sprite.png',
				cssFormat: 'less',
				cssTemplate: 'template.mustache',
				cssVarMap: function(sprite) {
						sprite.name = 's-' + sprite.name
					}
				}));
		spriteData.img
			.pipe(plumber(function(error) {
				gutil.log(gutil.colors.red(error.message));
				this.emit('end');
			}))
			.pipe(buffer())
			.pipe(imagemin({
				progressive: true,
				optimizationLevel: 5,
				use: [pngquant()],
				interlaced: true
			}))
			.pipe(gulp.dest(path.build.pngSprite))
			.pipe(reload({stream: true}));
		spriteData.css
			.pipe(plumber(function(error) {
				gutil.log(gutil.colors.red(error.message));
				this.emit('end');
			}))
			.pipe(gulp.dest(path.build.pngSpriteCSS))
			.pipe(reload({stream: true}));
});

// JS
gulp.task('js', function () {
	return gulp.src(path.src.js)
		.pipe(plumber(function(error) {
			gutil.log(gutil.colors.red(error.message));
			this.emit('end');
		}))
		.pipe(rigger())
		.pipe(rename({ suffix: '.min' }))
		.pipe(uglify())
		.pipe(flatten())
		.pipe(cached('js'))
		.pipe(gulp.dest(path.build.js))
		.pipe(reload({stream: true}));
});

// FONTS
gulp.task('fonts', function() {
	return gulp.src(path.src.fonts)
		.pipe(plumber(function(error) {
			gutil.log(gutil.colors.red(error.message));
			this.emit('end');
		}))
		.pipe(gulp.dest(path.build.fonts))
		.pipe(reload({stream: true}));
});

// CLEAN
gulp.task('clean', function () {
	return del(path.build.clean);
});

// WEB SERVER
gulp.task('webserver', function () {
	browserSync(browserSyncConfig);
});

// WATCH
gulp.task('watch', ['webserver'],function() {
	gulp.watch(path.watch.less, ['less']);
	gulp.watch(path.watch.pug, ['pug']);
	gulp.watch(path.watch.img, ['img']);
	gulp.watch(path.watch.pngSprite, ['png-sprite']);
	gulp.watch(path.watch.js, ['js']);
	gulp.watch(path.watch.fonts, ['fonts']);
	gulp.watch(path.watch.svgSprite, ['svg-sprite','pug']);
});

// BUILD
gulp.task('build', function(callback) {
	runSequence(
		'clean',
		'svg-sprite',
		'img',
		['js',
		'pug',
		'png-sprite',
		'fonts',
		'less'],
		callback)
});

// DEFAULT
gulp.task('default', ['build','watch'], function() {});