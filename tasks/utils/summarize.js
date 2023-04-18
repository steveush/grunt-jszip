/**
 * Returns a function that summarizes the {@link Promise.allSettled} results of the "jszip" and "jsunzip" tasks.
 * @param {grunt} grunt - The instance of Grunt running the task.
 * @param {string} action - The type of action being summarized.
 * @param {grunt.task.AsyncResultCatcher} done - The function returned from calling the {@link grunt.task.ITask.async} method.
 * @returns {Summarizer}
 */
const summarize = ( grunt, action, done ) => {
    /**
     * A function that summarizes the results of the {@link Promise.allSettled} call within the "jszip" and "jsunzip" tasks.
     * @callback Summarizer
     * @param {PromiseSettledResult<void>[]} results
     */
    return results => {
        const summary = results.reduce( ( summary, result ) => {
            if ( result.status === 'fulfilled' ) {
                summary.succeeded += 1;
            } else {
                summary.failed = true;
                grunt.log.error( result.reason );
            }
            return summary;
        }, { succeeded: 0, failed: false } );

        if ( summary.succeeded > 0 ){
            grunt.log.ok( `${ summary.succeeded } zip ${ grunt.util.pluralize( summary.succeeded, 'file/files' ) } ${ action }.` );
        }
        done( !summary.failed );
    };
};

module.exports = summarize;