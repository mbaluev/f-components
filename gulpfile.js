var gulp = require('gulp');
var autoprefixer = require('gulp-autoprefixer');
var cleanCss = require('gulp-clean-css');
var concat = require('gulp-concat');
var less = require('gulp-less');
var minify = require('gulp-minify');
var path = require('path');
var rename = require('gulp-rename');
var sourcemaps = require('gulp-sourcemaps');
var url = require('gulp-css-url-adjuster');
var browserSync = require('browser-sync').create();
var headerComment = require('gulp-header-comment');

var config = {
    paths: {
        less: './src/less/**/*.less',
        js: './src/js/**/*.js',
        img: './src/less/**/*.{jpg,png,svg,ico}',
        html: './public/*.html'
    },
    output: {
        jsName: 'fs.js',
        cssName: 'fs.css',
        path: './public/',
        img: './public/app/media/',
        js: './public/app/libs/monostyle/',
        css: './public/app/libs/monostyle/',
        imgFolderPrefix: '/app/media/'
    },
    third: {
        js: [],
        css: [],
        jsName: 'fs.third.js',
        cssName: 'fs.third.css'
    }
};

gulp.task('default', ['server', 'less']);

/* server */
gulp.task('server', function(){
    browserSync.init({
        server: {
            baseDir: config.output.path
        },
        open: 'local',
        browser: ['google chrome', 'chrome']
    });

    gulp.watch(config.paths.less, ['less']);
    gulp.watch(config.paths.js, ['js']);
    gulp.watch(config.paths.html).on('change', browserSync.reload);
});

/* components */
gulp.task('build', ['less', 'js' /*, 'img'*/ ]);
gulp.task('less', function(){
    gulp.src(config.paths.less)
        .pipe(sourcemaps.init())
        .pipe(less())
        .pipe(concat(config.output.cssName))
        .pipe(url({ prepend: config.output.imgFolderPrefix }))
        .pipe(autoprefixer())
        .pipe(sourcemaps.write())
        .pipe(headerComment('Created by mbaluev at <%= moment().format("YYYY.MM.DD") %>'))
        .pipe(gulp.dest(config.output.css))
        .pipe(browserSync.stream());

    gulp.src(config.paths.less)
        .pipe(less())
        .pipe(concat(config.output.cssName))
        .pipe(url({ prepend: config.output.imgFolderPrefix }))
        .pipe(autoprefixer())
        .pipe(cleanCss())
        .pipe(rename({suffix: '.min'}))
        .pipe(headerComment('Created by mbaluev at <%= moment().format("YYYY.MM.DD") %>'))
        .pipe(gulp.dest(config.output.css))
        .pipe(browserSync.stream());
});
gulp.task('js', function(){
    return gulp.src(config.paths.js)
        .pipe(concat(config.output.jsName))
        .pipe(minify({
            ext: {
                src:'.js',
                min:'.min.js'
            }
        }))
        .pipe(headerComment('Created by mbaluev at <%= moment().format("YYYY.MM.DD") %>'))
        .pipe(gulp.dest(config.output.js))
        .pipe(browserSync.stream());
});
gulp.task('img', function(){
    return gulp.src(config.paths.img)
        .pipe(rename({dirname:''}))
        .pipe(gulp.dest(config.output.img));
});

/* third */
gulp.task('third', function(){
    gulp.src(config.third.css)
        .pipe(concat(config.third.cssName))
        .pipe(autoprefixer())
        .pipe(gulp.dest(config.output.css));

    gulp.src(config.third.css)
        .pipe(concat(config.third.cssName))
        .pipe(autoprefixer())
        .pipe(cleanCss({ debug: true, compatibility: 'ie8' }, function(details) {
            console.log(details.name + ': ' + details.stats.originalSize);
            console.log(details.name + ': ' + details.stats.minifiedSize);
        }))
        .pipe(rename({suffix: '.min'}))
        .pipe(gulp.dest(config.output.css));

    gulp.src(config.third.js)
        .pipe(concat(config.third.jsName))
        .pipe(minify({
            ext: {
                src:'.js',
                min:'.min.js'
            }
        }))
        .pipe(gulp.dest(config.output.js));
});
