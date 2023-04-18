const fs = require( "fs/promises");
const runTask = require( "./utils/runTask" );
const comparer = require( "dir-compare" );

test( 'jszip:routed', () => {

    return runTask( 'jszip', 'routed' ).then( () => {
        return Promise.all( [
            fs.stat( './test/expected/zips/routed.zip' ),
            fs.stat( './test/received/zips/routed.zip' )
        ] ).then( ( [ expected, received ] ) => {
            expect( expected.mode ).toBe( received.mode );
            expect( expected.size ).toBe( received.size );
        } );
    } );

} );

test( 'jsunzip:routed', () => {
    return runTask( 'jsunzip', 'routed' ).then( () => {
        return comparer.compare( './test/expected/files/routed', './test/received/files/routed', {
            compareContent: true
        } ).then( result => {
            expect( result.differences ).toBe( 0 );
        } );
    } );
} );