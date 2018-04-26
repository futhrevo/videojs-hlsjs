'use strict';

module.exports = function (grunt) {
  require('load-grunt-tasks')(grunt);

  let pkg = grunt.file.readJSON('package.json');

  grunt.initConfig({
    pkg: Object.assign(pkg, {
      nameWithoutNamespace: pkg.name.replace(/^@\w+\//, ''),
      src: './src',
      dist: './dist',
      build: './build',
      archiveFileSuffix: '-' + pkg.version + '-' + grunt.template.today('yyyymmdd')
    }),
    banner: '/**!\n' +
            ' * <%= pkg.name %>\n' +
            ' * @version <%= pkg.version %>\n' +
            ' * @copyright <%= grunt.template.today("yyyy") %> <%= pkg.author.name %> <<%= pkg.author.url %>>\n' +
            ' * @license <%= pkg.license %>\n' +
            ' */',
    // https://github.com/gruntjs/grunt-contrib-clean
    clean: {
      dist: {
        src: ['<%= pkg.dist %>']
      }
    },

    // https://github.com/jmreidy/grunt-browserify
    browserify: {
      options: {
        banner: '<%= banner %>',
        plugin: ['browserify-derequire'],
        transform: [
          // https://github.com/babel/babelify
          ['babelify', {
            sourceMapsAbsolute: true,
          }],
          // https://github.com/thlorenz/browserify-shim
          ['browserify-shim'],
        ]
      },
      debug: {
        options: {
          browserifyOptions: {
            debug: true,
          }
        },
        files: {
          '<%= pkg.dist %>/<%= pkg.nameWithoutNamespace %>.js': ['<%= pkg.src %>/<%= pkg.nameWithoutNamespace %>.js']
        }
      },
      release: {
        options: {
          browserifyOptions: {}
        },
        files: {
          '<%= pkg.dist %>/<%= pkg.nameWithoutNamespace %>.js': ['<%= pkg.src %>/<%= pkg.nameWithoutNamespace %>.js']
        }
      }
    },

    // https://github.com/gruntjs/grunt-contrib-uglify
    uglify: {
      options: {
        preserveComments: false,
        screwIE8: false,
        banner: '<%= banner %>',
      },
      dist: {
        files: {
          '<%= pkg.dist %>/<%= pkg.nameWithoutNamespace %>.min.js': '<%= pkg.dist %>/<%= pkg.nameWithoutNamespace %>.js'
        }
      }
    },

    eslint: {
      pkg: ['<%= pkg.src %>/**/*.js']
    },

    watch: {
      scripts: {
        files: [
          'Gruntfile.js',
          '<%= pkg.src %>/**/*.js'
        ],
        tasks: ['browserify', 'eslint']
      }
    },

    // https://www.browsersync.io/docs/options
    browserSync: {
      examples: {
        bsFiles: {
          src: ['examples/*.html', 'dist/**/*.js']
        },
        options: {
          server: ['./'],
          startPath: 'examples/index.html',
          ghostMode: false,
          watchTask: true,
        }
      }
    }
  });

  grunt.registerTask('build', function (/*target*/) {
    grunt.task.run([
      'clean',
      'browserify:release',
      'uglify',
    ]);
  });

  grunt.registerTask('debug', function (/*target*/) {
    grunt.task.run([
      'clean',
      'browserify:debug',
      'browserSync:examples',
      'watch',
    ]);
  });
};
