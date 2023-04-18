const JSZip = require( "jszip" );
const path = require( "path" );
const fs = require( "fs/promises" );
const chalk = require( "chalk" );
const summarize = require( "./utils/summarize" );

//region type-definitions

/**
 * The options for the "jsunzip" task.
 * @typedef {object} JSUnzipOptions
 * @property {boolean} [checkCRC32=true] - The checkCRC32 option will load every file, compute the CRC32 value and compare it against the saved value. With larger zip files, this option can have a significant performance cost.
 * @property {JSUnzipOptions~router} [router] - A function to modify the relative path of the file or folder being extracted.
 */

/**
 * The router function takes the relative path and returns a zip path. Zip paths should always use forward-slash as a separator.
 * @callback JSUnzipOptions~router
 * @param {string} relative - The relative path to route.
 * @param {string} [root] - The root directory for the relative paths.
 * @param {boolean} [isFile] - True if the relative path points to a file.
 * @returns {string|null} If `null` is returned the path is excluded from the resulting zip.
 * @example
 * "jszip": {
 *     options: {
 *         router: ( relative, root, isFile ) => {
 *             if ( relative === 'some-file.txt' ) return 'changed.txt';
 *             return relative;
 *         }
 *     }
 * }
 */

//endregion

module.exports = function( grunt ) {

    /**
     *
     * @param {IFilesConfig} config
     * @param {JSUnzipOptions} options
     * @returns {Promise<void>}
     */
    async function unzip( config, options ) {

        // first figure out the actual current working for the src files
        const cwd = config.cwd || process.cwd();

        // the destination does not use the cwd option so just resolve it
        const dest = path.resolve( config.dest );

        /**
         * Return an object containing the relative, routed and absolute paths given a {@link JSZip.files} key.
         * @param {string} key
         * @param {boolean} isFile
         * @returns {{relative: string, routed: (string|null), absolute: (string|null)}}
         */
        const paths = ( key, isFile ) => {
            const relative = !isFile && !key.endsWith( '/' ) ? key + '/' : key;
            const routed = options.router( relative, dest, isFile );
            return {
                relative,
                routed,
                absolute: !routed ? null : path.resolve( dest, routed )
            };
        };

        for ( const src of config.src ) {
            const file = path.resolve( cwd, src );
            if ( path.extname( file ) !== '.zip' ) {
                grunt.log.error( `Error ${ chalk.cyan( src ) } is not a ZIP file.` );
                continue;
            }
            grunt.verbose.writeln( `Extracting ${ chalk.cyan( src ) } to ${ chalk.cyan( config.dest ) }` );

            const input = await fs.readFile( file );

            const zip = await JSZip.loadAsync( input, { checkCRC32: options.checkCRC32 } );

            for ( const key of Object.keys( zip.files ) ) {
                const zipObject = zip.files[ key ];
                const type = zipObject.dir ? 'folder' : 'file';

                const { relative, absolute, routed } = paths( key, !zipObject.dir );

                if ( !routed || !absolute ) {
                    grunt.verbose.writeln( `Skipped ${ type } ${ chalk.yellow( relative ) }` );
                    continue;
                }

                if ( zipObject.dir ) {
                    grunt.file.mkdir( absolute );
                } else {
                    const output = await zipObject.async( "nodebuffer" );
                    grunt.file.mkdir( path.dirname( absolute ) );
                    await fs.writeFile( absolute, output, { mode: zipObject.unixPermissions } );
                }

                if ( routed !== relative ) {
                    grunt.verbose.writeln( `Created ${ type } ${ chalk.cyan( relative ) } as ${ chalk.cyan( routed ) }` );
                } else {
                    grunt.verbose.writeln( `Created ${ type } ${ chalk.cyan( routed ) }` );
                }
            }
        }
    }

    grunt.registerMultiTask( 'jsunzip', 'Unzip files into a folder.', function() {
        const done = this.async();
        const options = this.options( {
            checkCRC32: true,
            router: ( relative, root, isFile ) => relative
        } );
        const unzipped = this.files.map( config => unzip( config, options ) );
        Promise.allSettled( unzipped ).then( summarize( grunt, 'extracted', done ) );
    } );

};