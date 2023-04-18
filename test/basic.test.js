const fs = require( "fs/promises");
const runTask = require( "./utils/runTask" );
const comparer = require( "dir-compare" );

test( 'jszip:basic', () => {

    return runTask( 'jszip', 'basic' ).then( () => {
        return Promise.all( [
            fs.stat( './test/expected/zips/basic.zip' ),
            fs.stat( './test/received/zips/basic.zip' )
        ] ).then( ( [ expected, received ] ) => {
            expect( expected.mode ).toBe( received.mode );
            expect( expected.size ).toBe( received.size );
        } );
    } );

} );

test( 'jsunzip:basic', () => {
    return runTask( 'jsunzip', 'basic' ).then( () => {
        return comparer.compare( './test/expected/files/basic', './test/received/files/basic', {
            compareContent: true
        } ).then( result => {
            expect( result.differences ).toBe( 0 );
        } );
    } );
} );