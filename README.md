# grunt-jszip v0.0.1

> Grunts tasks for working with ZIP files.

Some basic tasks that wrap the [JSZip](https://github.com/Stuk/jszip) library to provide the ability to both zip and unzip files and folders.

## Getting Started

If you haven't used [Grunt](https://gruntjs.com/) before, be sure to check out the [Getting Started](https://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](https://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install @steveush/grunt-jszip --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('@steveush/grunt-jszip');
```

*This plugin was designed to work with Grunt 0.4.x. If you're still using grunt v0.3.x it's strongly recommended that [you upgrade](https://gruntjs.com/upgrading-from-0.3-to-0.4)*

## JSZip Task

_Run this task with the `grunt jszip` command._

Task targets, files and options may be specified according to the grunt [Configuring tasks](https://gruntjs.com/configuring-tasks) guide.

### Options

#### compression

Type: `String`  
Default: `"DEFLATE"`

Set the compression method used by JSZip. Can be either `"DEFLATE"` or `"STORE"`. See the [JSZip documentation](https://stuk.github.io/jszip/documentation/api_jszip/generate_async.html#compression-and-compressionoptions-options) for more information.

#### compressionLevel

Type: `Number`  
Default: `9`

Set the compression level to between 1 (best speed) and 9 (best compression). This is a shortcut for the JSZip `compressionOptions:{ level: number }` option. See the [JSZip documentation](https://stuk.github.io/jszip/documentation/api_jszip/generate_async.html#compression-and-compressionoptions-options) for more information.

#### router

Type: `Function(String, String, Boolean):String|NULL`  
Default: `( relative, root, isFile ) => relative`

A function that converts the relative file system path to a relative zip path. If `null` is returned the given path is not extracted.

### Example Usage

Given the file and folder structure below:

```text
target/
    .dot-dir/
        .dot-file
    sub-dir/
        another-file.txt
    some-file.txt
Gruntfile.js
package.json
```

#### Zip all files and folders in the target directory.

```js
"jszip": {
    "output.zip": [ "target/**/*" ]
}
```

The `output.zip` would contain:

```text
target/
    sub-dir/
        another-file.txt
    some-file.txt
```

You may notice that the folder `.dot-dir` and its child file `.dot-file` are missing from the output. To include files and folders starting with a period, you must set the Grunt `dot` option.

#### Zip all files and folders in the target directory including those starting with a period.

```js
"jszip": {
    generate: {
        dot: true,
        src: [ "target/**/*" ],
        dest: 'output.zip'
    }
}
```

The `output.zip` would contain:

```text
target/
    .dot-dir/
        .dot-file
    sub-dir/
        another-file.txt
    some-file.txt
```

#### Zip all files and folders in the target directory but do not include the target directory itself.

```js
"jszip": {
    generate: {
        cwd: "target", //; change the working directory for the src files
        src: [ "**/*" ],
        dest: "output.zip" // the dest path does not use the changed cwd
    }
}
```

The `output.zip` would contain:

```text
sub-dir/
    another-file.txt
some-file.txt
```

#### Zip all files and folders in the target directory but route some paths to a different location within the ZIP.

```js
"jszip": {
    generate: {
        cwd: "target", //; change the working directory for the src files
        src: [ "**/*" ],
        dest: 'output.zip',
        options: {
            router: ( relative, root, isFile ) => {
                // rename a file within the zip.
                if ( relative === 'some-file.txt' )
                    return 'changed.txt';

                // exclude a file entirely from the zip.
                if ( relative === '.dot-dir/.dot-file' )
                    return null;

                // move a file within the zip.
                if ( relative === 'sub-dir/another-file.txt' )
                    return 'moved/another-file.txt';

                // no changes
                return relative;
            }
        }
    }
}
```

The `output.zip` would contain:

```text
.dot-dir/
sub-dir/
moved/
    another-file.txt
changed.txt
```

If you also want to remove the now empty `.dot-dir` and `sub-dir` folders you would need to add in additional checks to the router function above.

```js
router: ( relative, root, isFile ) => {
    // rename a file within the zip.
    if ( relative === 'some-file.txt' )
        return 'changed.txt';

    // exclude a set of paths entirely from the zip.
    if ( [ 'sub-dir', '.dot-dir', '.dot-dir/.dot-file' ].includes( relative ) )
        return null;

    // move a file within the zip.
    if ( relative === 'sub-dir/another-file.txt' )
        return 'moved/another-file.txt';

    // no changes
    return relative;
}
```

The `output.zip` would then contain:

```text
moved/
    another-file.txt
changed.txt
```

## JSUnzip Task

### Options

#### checkCRC32

Type: `Boolean`  
Default: `true`

The checkCRC32 option will load every file, compute the CRC32 value and compare it against the saved value. With larger zip files, this option can have a significant performance cost.

#### router

Type: `Function(String, String, Boolean):String|NULL`  
Default: `( relative, root, isFile ) => relative`

A function that converts the relative zip path to a relative file system path. If `null` is returned the given path is not extracted.
