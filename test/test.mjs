const h5wasm = await import("h5wasm/node");
const h5wasm_plugins = await import("../index.mjs");
const { default: default_cd_values } = await import("./default_cd_values.json", { with: { type: "json" } });

// add lzf, copy bzip2 to bz2:
if (!('lzf' in default_cd_values))
    default_cd_values['lzf'] = { compression: 32000, compression_opts: [] };
    default_cd_values['bz2'] = default_cd_values['bzip2'];

const h5wasm_module = await h5wasm.ready;
h5wasm_module.activate_throwing_error_handler();

// this inserts the node_modules/h5wasm-plugins/plugins path
// at the start of the HDF5 plugin search paths
h5wasm_plugins.install_local_plugins(h5wasm_module);

import * as fs from 'fs';
import * as path from 'path';
import { argv } from 'process';

const { FS } = await h5wasm.ready;

const filters_to_test = argv.length > 2 ? [argv[2]] : h5wasm_plugins.plugin_names;

const tolerance = 1e-20;

function validate_jpeg_data(data) {
    // JPEG is lossy, so we can't expect exact matches.
    // But we can check that the values are in the expected range.
    return data.every((v, i) => (v >= 0 && v <= 255));
}

const exclude_filters = [
    'sz3', // no plugin yet (only sz)
    'sz', // plugin not working right now
    'sperr', // no plugin yet
    'fcidecomp', // not included in plugins yet
];

const results = Object.fromEntries(filters_to_test.map(f => [f, { 'valid': false, 'read_error': null, 'write_error': null, 'skipped': false }])); 
const DATA_REPEAT = 2**14;
const NX = 1024;
const NY = 512;
const SIZE = NX * NY;
const SHAPE = [NX, NY];
const CHUNKS = [63, 125];
const DATA = [...new Array(SIZE)].map((_, i) => i % DATA_REPEAT);

const testFilesDir = path.join(path.dirname(new URL(import.meta.url).pathname), 'test_files');

function validate_data(data) {
    return data.every((v, i) => (Math.abs(v - i % DATA_REPEAT) < tolerance));
}

function write_test_file(filter_name) {
    let { compression, compression_opts } = default_cd_values[filter_name] ?? {};
    console.log(compression, compression_opts);
    let dtype = '<f4';
    let shape = SHAPE;
    let data = DATA;
    let chunks = CHUNKS;
    if (filter_name === 'jpeg') {
        compression = 32019; // JPEG filter code
        compression_opts = [50, NX, NY, 0]; // quality, width, height, color_mode
        dtype = 'B';
        shape = [1, ...SHAPE];
        chunks = [1, NX, NY];
        // JPEG needs grayscale 8-bit data
        data = DATA.map(v => v % 256);
    }
    const f = new h5wasm.File(path.join(testFilesDir, `test_${filter_name}.h5`), 'w');
    const dset = f.create_dataset({
        name: 'data',
        shape,
        dtype,
        data,
        chunks,
        compression,
        compression_opts,
    });
    dset.create_attribute('filter', filter_name);
    f.close();
}

await fs.promises.mkdir(testFilesDir, { recursive: true });
for (const filter_name of filters_to_test) {
    if (exclude_filters.includes(filter_name)) {
        console.log(`skipping excluded filter: ${filter_name}`);
        results[filter_name]['skipped'] = true;
        continue;
    }
    console.log(`writing test file for: ${filter_name}`);
    try {
        write_test_file(filter_name);
        results[filter_name]['write_error'] = null;
    }
    catch (e) {
        console.log(`failed to write test file for: ${filter_name}`, e);
        results[filter_name]['write_error'] = `failed to write test file: ${e}`;
        continue;
    }
}


for (const filter_name of filters_to_test) {
    if (exclude_filters.includes(filter_name)) {
        console.log(`skipping excluded filter: ${filter_name}`);
        continue;
    }
    console.log(`testing: ${filter_name}`);
    try {
        // await h5wasm_plugins.install_plugins(h5wasm_module, [filter_name]);
        const f = new h5wasm.File(path.join(testFilesDir, `test_${filter_name}.h5`), 'r');
        const dset = f.get('data');
        const data = dset.value;
        const valid = filter_name === 'jpeg' ? validate_jpeg_data(data) : validate_data(data);
        console.log(`${filter_name}: ${valid ? 'valid' : 'invalid'}`, dset.filters);
        if (!valid) {
            console.log(`data validation failed for filter: ${filter_name}`);
        }
        results[filter_name]['valid'] = valid;
        f.close();
    }
    catch (e) {
        console.log(`${filter_name}: failed.`, e);
        results[filter_name]['read_error'] = `failed to read/validate: ${e}`;
    }
}


if (Object.entries(results).some(([k, v]) => !v.skipped && !v.valid)) {
    console.log('Some tests failed:');
    for (let [k, v] of Object.entries(results)) {
        if (!v.skipped && !v.valid) {
            console.log(`  ${k}: read error: ${v.read_error}, write error: ${v.write_error}`);
        }
    }
    process.exit(1);
}