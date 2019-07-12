const gulp = require('gulp')
const pug = require('gulp-pug')
const pugbem = require('gulp-pugbem')
const babel = require('gulp-babel')
const uglify = require('gulp-uglify')
const remember = require('gulp-remember')
const prettyHtml = require('gulp-pretty-html')
const sass = require('gulp-sass')
const autoprefixer = require('gulp-autoprefixer')
const csscomb = require('gulp-csscomb')
const cleanCSS = require('gulp-clean-css')
const gulpIf = require('gulp-if')
const concat = require('gulp-concat')
const flatmap = require('gulp-flatmap')
const merge2 = require('merge2')
const multipipe = require('multipipe')
const browserSync = require('browser-sync').create()
const svgSprite = require('gulp-svg-sprites')
const del = require('del')
let mode = 'development'
let newLine


function components() {
  return gulp.src([
    'src/pages/helpers/**/*.pug',
    'src/components/**/*.pug'
  ], { since: gulp.lastRun(components) })
    .pipe(remember('components'))
}

function pages() {
  return gulp.src(mode === 'production' ? ['src/pages/*.pug', 'src/pages/final/**/*.pug'] : 
      'src/pages/*.pug', { since: gulp.lastRun(pages) })
    .pipe(remember('pages'))
    .pipe(flatmap(function(stream, file) {
      return merge2(components(), stream)
        .pipe(concat({ path: file.path, base: file.base }))
    }))
    .pipe(pug({ pretty: true, plugins: [pugbem] }))
    .pipe(gulpIf(mode === 'production', prettyHtml({
      indent_size: 2,
      inline: ['b','big','br','em','i','small','span','strong','sub','sup'],
      extra_liners: ['header','main','footer', 'script', '/body']
    })))
    .pipe(gulp.dest(file => {
      const basename = file.basename.replace('.inc.', '.')
      if(basename !== file.basename) {
        file.basename = basename
        file.extname = '.php'
        return '/home/neo/public_html/includes'
      }
      file.extname = '.php'
      return '/home/neo/public_html/pages'
    }))
}

function styles() {
  return gulp.src([
    'node_modules/normalize.css/normalize.css',
    'src/styles/helpers/variables.scss',
    'src/styles/helpers/mixins.scss',
    'src/styles/typography/fonts.scss',
    'src/components/**/*.scss',
    'src/styles/main.scss'
  ], { since: gulp.lastRun(styles) })
    .pipe(remember('styles'))
    .pipe(gulpIf('*.scss', multipipe(
      concat('main.scss', { newLine }),
      sass(),
      gulpIf(mode === 'production', multipipe(
        autoprefixer(),
        csscomb()
      ))
    )))
    .pipe(concat('main.css'))
    .pipe(gulpIf(mode === 'production', cleanCSS()))
    .pipe(gulp.dest('/home/neo/public_html/dist'))
}

function scripts() {
  return gulp.src([
    'node_modules/jquery/dist/jquery.min.js',
    'src/components/**/*.js',
    'src/scripts/main.js'
  ], { since: gulp.lastRun(scripts) })
    .pipe(remember('scripts'))
    .pipe(gulpIf(mode === 'production', gulpIf(file => !file.path.includes('/node_modules/'),
      multipipe(
        babel({ presets: ['@babel/env'], sourceType: 'unambiguous' }),
        uglify()
    ))))
    .pipe(concat('main.js', { newLine }))
    .pipe(gulp.dest('/home/neo/public_html/dist'))
}

function symbols(done) {
  return gulp.src('src/symbols/**/*.svg')
    .pipe(svgSprite({
      mode: 'symbols',
      preview: false,
      svg: { symbols: 'main.svg' }
    }))
    .pipe(gulp.dest('/home/neo/public_html/dist'))
}

function serve(done) {
  browserSync.init({
    proxy: 'http://test/',
    notify: false,
    open: false
  })
  done()
}

function reload(done) {
  browserSync.reload()
  done()
}

function clean() {
  return del('/home/neo/public_html/**', { force: true })
}

function copy(done) {
  gulp.src('src/assets/*/*.*').pipe(gulp.dest('/home/neo/public_html/dist'))
  gulp.src('src/assets/*.*').pipe(gulp.dest('/home/neo/public_html'))
  gulp.src('src/assets/.htaccess').pipe(gulp.dest('/home/neo/public_html'))
  done()
}

function public(done) {
  mode = 'production'
  newLine = '';
  done()
}

function watch() {
  gulp.watch(mode === 'production' ?
    [
      'src/pages/helpers/**/*.pug',
      'src/components/**/*.pug',
      'src/pages/final/**/*.pug',
      'src/pages/*.pug'
    ] :
    [
      'src/pages/helpers/**/*.pug',
      'src/components/**/*.pug',
      'src/pages/*.pug'
    ], gulp.series(pages, reload))
  gulp.watch('src/**/*.scss', gulp.series(styles, reload))
  gulp.watch('src/**/*.js', gulp.series(scripts, reload))
  gulp.watch('src/symbols/**/*.svg', gulp.series(symbols, reload))
  gulp.watch('src/assets/**/*', gulp.series(copy, reload))
}

const dev = gulp.series(clean, copy, pages, styles, scripts, symbols, serve, watch)
const build = gulp.series(public, dev)

gulp.task('default', dev)
gulp.task('build', build)