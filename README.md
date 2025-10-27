
[![blosc](https://github.com/h5wasm/h5wasm-plugins/actions/workflows/test-blosc.yml/badge.svg)](https://github.com/h5wasm/h5wasm-plugins/actions/workflows/test-blosc.yml)
[![blosc2](https://github.com/h5wasm/h5wasm-plugins/actions/workflows/test-blosc2.yml/badge.svg)](https://github.com/h5wasm/h5wasm-plugins/actions/workflows/test-blosc2.yml)
[![bshuf](https://github.com/h5wasm/h5wasm-plugins/actions/workflows/test-bshuf.yml/badge.svg)](https://github.com/h5wasm/h5wasm-plugins/actions/workflows/test-bshuf.yml)
[![bz2](https://github.com/h5wasm/h5wasm-plugins/actions/workflows/test-bz2.yml/badge.svg)](https://github.com/h5wasm/h5wasm-plugins/actions/workflows/test-bz2.yml)
[![lz4](https://github.com/h5wasm/h5wasm-plugins/actions/workflows/test-lz4.yml/badge.svg)](https://github.com/h5wasm/h5wasm-plugins/actions/workflows/test-lz4.yml)
[![lzf](https://github.com/h5wasm/h5wasm-plugins/actions/workflows/test-lzf.yml/badge.svg)](https://github.com/h5wasm/h5wasm-plugins/actions/workflows/test-lzf.yml)
[![zfp](https://github.com/h5wasm/h5wasm-plugins/actions/workflows/test-zfp.yml/badge.svg)](https://github.com/h5wasm/h5wasm-plugins/actions/workflows/test-zfp.yml)
[![zstd](https://github.com/h5wasm/h5wasm-plugins/actions/workflows/test-zstd.yml/badge.svg)](https://github.com/h5wasm/h5wasm-plugins/actions/workflows/test-zstd.yml)
[![jpeg](https://github.com/h5wasm/h5wasm-plugins/actions/workflows/test-jpeg.yml/badge.svg)](https://github.com/h5wasm/h5wasm-plugins/actions/workflows/test-jpeg.yml)


# h5wasm-plugins

A collection of pre-compiled compression plugins to be used with [h5wasm](https://github.com/usnistgov/h5wasm)

These plugins can be used for reading and writing data (writing supported for all plugins as of version 0.2.0)

The plugins are built using sources fetched at build-time from https://github.com/HDFGroup/hdf5_plugins 
(if new plugins are desired, it is recommended to get them upstreamed to that repository so they can be built here)

_(h5wasm is a javascript/webassembly library for reading and writing HDF5 files from the browser or node.js or deno or...)_

## Installation
`npm install h5wasm-plugins`

(this will also install h5wasm >= 0.8.1)

## Included plugins
 - blosc
 - blosc2
 - bshuf
 - bz2
 - jpeg
 - lz4
 - lzf
 - zfp
 - zstd

(Note that `gzip` and `szip` filters are built-in to h5wasm and don't require a plugin)

## Usage: browser
The default export from h5wasm (which has a `Module` property defined, for accessing the C-module directly) should be passed to the functions defined here.

```js
import h5wasm from "h5wasm";
import { plugin_names, install_plugins } from "h5wasm-plugins";

const h5wasm_module = await h5wasm.ready;
// installs libH5Zzfp.so to default folder, /usr/local/hdf5/lib/plugin
install_plugins(h5wasm_module, ["zfp"]);

// Or, to install all plugins to new folder /tmp/h5plugins
// install_plugins(h5wasm_module, plugin_names, "/tmp/h5plugins");

// open existing file - see h5wasm docs for writing files to
// virtual Emscripten filesystem
const f = new h5wasm.File("my_zfp.h5", "r");
const data = f.get("zfp_data").value;
```

## Usage: writing a compressed dataset
```js
import h5wasm from "h5wasm";
import { plugin_names, install_plugins } from "h5wasm-plugins";

const h5wasm_module = await h5wasm.ready;
install_plugins(h5wasm_module, ["lz4"]);

const f = new h5wasm.File("my_lz4_data.h5", "w");
// make some repeating data, that is very compressible:
const data = [...new Array(100000)].map((_, i) => i % 64);
// have to specify chunks, shape, compression, compression_opts
const dset = f.create_dataset({
    data: data,
    dtype: '<f4', // 32-bit little-endian float
    shape: [100,1000],
    chunks: [10,100],
    compression: 32004, // lz4 id
    compression_opts: [
        0
    ]
});
f.close();

console.log(`File size: ${h5wasm_module.FS.stat("my_lz4_data.h5").size}`);
// File is only 45 kB

```

## Usage: server side (e.g. nodejs)
```js
const h5wasm = await import("h5wasm/node");
const h5wasm_plugins = await import("h5wasm-plugins");

const h5wasm_module = await h5wasm.ready;
// this inserts the node_modules/h5wasm-plugins/plugins path
// at the start of the HDF5 plugin search paths
h5wasm_plugins.install_local_plugins(h5wasm_module);

const f = new h5wasm.File('./test_zfp.h5', 'r');
// File {
//   path: '/',
//   file_id: 72057594037927936n,
//   type: 'Group',
//   filename: './test_zfp.h5',
//   mode: 'r'
// }

f.get('data').filters
// [
//   {
//     id: 32013,
//     name: 'H5Z-ZFP-1.1.0 (ZFP-0.5.5)',
//     cd_values: [ 89149712, 91252346, 146, 4293918720, 3767009280, 493487 ]
//   }
// ]

f.get('data').value 
// Float32Array(10) [
//   0, 1, 2, 3, 4,
//   5, 6, 7, 8, 9
// ]

h5wasm.Module.get_plugin_search_paths()
// [
//   '/home/bbm/dev/test_plugins/node_modules/h5wasm-plugins/plugins',
//   '/usr/local/hdf5/lib/plugin'
// ]
```

## Building from source
Dependencies:
 1. cmake >= 3.24
 2. make
 3. emscripten, preferably version 3.1.68

To build the plugins to the `plugins` folder locally, run:

```bash
make clean
make plugins
```

## Testing
```bash
npm install

python test/generate_default_cd_values.py
python test/make_testfiles.py
node test/make_testfiles.mjs

node test/test.mjs
```
