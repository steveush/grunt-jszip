const fs = require( "fs/promises");
const runTask = require( "./utils/runTask" );
const comparer = require( "dir-compare" );

test( 'jszip:dot', () => {

    return runTask( 'jszip', 'dot' ).then( () => {
        return Promise.all( [
            fs.stat( './test/expected/zips/dot.zip' ),
            fs.stat( './test/received/zips/dot.zip' )
        ] ).then( ( [ expected, received ] ) => {
            expect( expected.mode ).toBe( received.mode );
            expect( expected.size ).toBe( received.size );
        } );
    } );

} );

test( 'jsunzip:dot', () => {
    return runTask( 'jsunzip', 'dot' ).then( () => {
        return comparer.compare( './test/expected/files/dot', './test/received/files/dot', {
            compareContent: true
        } ).then( result => {
            expect( result.differences ).toBe( 0 );
        } );
    } );
} );