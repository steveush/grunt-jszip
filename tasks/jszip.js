const JSZip = require( "jszip" );
const path = require( "path" );
const fs = require( "fs/promises" );
const chalk = require( "chalk" );
const summarize = require( "./utils/summarize" );

//region type-definitions

/**
 * The options for the "jszip" task.
 * @typedef {object} JSZipOptions
 * @property {string} [compression="DEFLATE"] - The compression method to use. Can be either "STORE" or "DEFLATE".
 * @property {number} [compressionLevel=9] - If compression is set to "STORE" this option is ignored otherwise any value between 1 (best speed) and 9 (best compression) is accepted.
 * @property {JSZipOptions~router} [router] - By default this method converts the given filepath to a relative path to the current working directory.
 */

/**
 * The router function takes the relative path and returns a zip path. Zip paths should always use forward-slash as a separator.
 * @callback JSZipOptions~router
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
     * @param {grunt.file.IFilesConfig} config
     * @param {JSZipOptions} options
     * @returns {Promise<void>}
     */
    async function zip( config, options ) {
        // first figure out the actual current working for the src files
        const cwd = config.cwd || process.cwd();

        // the destination does not use the cwd option so just resolve it
        const dest = path.resolve( config.dest );

        /**
         * Return an object containing the relative, routed and absolute paths given a {@link grunt.file.IFilesConfig.src} element.
         * @param {string} src - The src to generate paths for.
         * @param {boolean} isFile - True if the src points to a file.
         * @returns {{absolute: string, relative: string, routed: (string|null)}}
         */
        const paths = ( src, isFile ) => {
            const absolute = path.resolve( cwd, src );
            let relative = path.relative( cwd, absolute ).replaceAll( path.sep, "/" );
            if ( !isFile && !relative.endsWith( "/" ) ) relative += "/";
            return {
                absolute,
                relative,
                routed: options.router( relative, cwd, isFile )
            };
        };

        grunt.verbose.writeln( `Creating ${ chalk.cyan( config.dest ) }` );

        // get all folders from the config
        const folders = grunt.file.expand( {
            cwd: cwd,
            dot: config.dot,
            filter: "isDirectory"
        }, config.src );

        // get all files from the config
        const files = grunt.file.expand( {
            cwd: cwd,
            dot: config.dot,
            filter: "isFile"
        }, config.src );

        // create the zip
        const zip = new JSZip();

        for ( const folder of folders ) {
            const { relative, routed } = paths( folder, false );
            if ( !routed ) {
                grunt.verbose.writeln( `Skipped folder ${ chalk.yellow( relative ) }` );
                continue;
            }
            zip.folder( routed );
            if ( routed !== relative ) {
                grunt.verbose.writeln( `Added folder ${ chalk.cyan( relative ) } as ${ chalk.cyan( routed ) }` );
            } else {
                grunt.verbose.writeln( `Added folder ${ chalk.cyan( routed ) }` );
            }
        }

        for ( const file of files ) {
            const { absolute, relative, routed } = paths( file, true );
            if ( !routed ) {
                grunt.verbose.writeln( `Skipped file ${ chalk.yellow( relative ) }` );
                continue;
            }
            const input = await fs.readFile( absolute );
            zip.file( routed, input );
            if ( routed !== relative ) {
                grunt.verbose.writeln( `Added file ${ chalk.cyan( relative ) } as ${ chalk.cyan( routed ) }` );
            } else {
                grunt.verbose.writeln( `Added file ${ chalk.cyan( routed ) }` );
            }
        }

        // Make sure the destination directory exists
        grunt.file.mkdir( path.dirname( dest ) );

        // Write out the content
        const output = await zip.generateAsync( {
            type: 'nodebuffer',
            compression: options.compression,
            compressionOptions: { level: options.compressionLevel }
        } );
        await fs.writeFile( dest, output );
    }

    grunt.registerMultiTask( 'jszip', 'Zip files together.', function() {

        const done = this.async();
        const options = /** @type {JSZipOptions} */ this.options( {
            compression: "DEFLATE",
            compressionLevel: 9,
            router: ( relative, root, isFile ) => relative
        } );

        const zips = this.files.map( config => zip( config, options ) );
        Promise.allSettled( zips ).then( summarize( grunt, 'created', done ) );
    } );

};