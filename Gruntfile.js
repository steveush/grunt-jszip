const path = require( "path" );
module.exports = function( grunt ) {

    grunt.loadNpmTasks( 'grunt-contrib-clean' );
    grunt.loadTasks( './tasks' );

    grunt.initConfig( {
        "clean": {
            "test-output": [ "./test/received" ]
        },
        "jszip": {
            basic: {
                cwd: "./test/expected/files/basic/",
                src: [ "**/*" ],
                dest: "./test/received/zips/basic.zip"
            },
            dot: {
                dot: true,
                cwd: "./test/expected/files/dot/",
                src: [ "**/*" ],
                dest: "./test/received/zips/dot.zip"
            },
            routed: {
                cwd: "./test/expected/files/basic/",
                src: [ "**/*" ],
                dest: "./test/received/zips/routed.zip",
                options: {
                    router: ( relative, cwd ) => {
                        switch ( relative ) {
                            case "one.js":
                                return "one_changed.js";
                            case "one.php":
                                return null;
                            case "sub/two.php":
                                return "moved/two.php";
                            default:
                                return relative;
                        }
                    }
                }
            }
        },
        "jsunzip": {
            basic: {
                src: [ "./test/expected/zips/basic.zip" ],
                dest: "./test/received/files/basic"
            },
            dot: {
                src: [ "./test/expected/zips/dot.zip" ],
                dest: "./test/received/files/dot"
            },
            routed: {
                src: [ "./test/expected/zips/basic.zip" ],
                dest: "./test/received/files/routed",
                options: {
                    router: ( relative, dest ) => {
                        switch ( relative ) {
                            case "one.js":
                                return "one_changed.js";
                            case "one.php":
                                return null;
                            case "sub/two.php":
                                return "moved/two.php";
                            default:
                                return relative;
                        }
                    }
                }
            }
        }
    } );

    grunt.registerTask( 'default', [ 'jszip', 'jsunzip' ] );

};