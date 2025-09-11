const h5wasm = await import("h5wasm/node");
const h5wasm_plugins = await import("../index.mjs");

const h5wasm_module = await h5wasm.ready;
// this inserts the node_modules/h5wasm-plugins/plugins path
// at the start of the HDF5 plugin search paths
h5wasm_plugins.install_local_plugins(h5wasm_module);

import * as fs from 'fs';
import { argv } from 'process';

const { FS } = await h5wasm.ready;

const test_filenames = argv.length > 2 ? [`test_${argv[2]}.h5`] : fs.readdirSync('./test/test_files');

const tolerance = 1e-20;
function validate_data(data) {
    return data.every((v, i) => (Math.abs(v - i) < tolerance));
}

function validate_jpeg_data(data) {
    // JPEG is lossy, so we can't expect exact matches.
    // But we can check that the values are in the expected range.
    return data.every((v, i) => (v >= 0 && v <= 255));
}

const exclude_filters = [
//    'blosc2', // no plugin built for this
//    'bshuf', // hard to debug error
//    'jpeg', // no writer, for now,
    'sz3', // no plugin yet (only sz)
    'sperr', // no plugin yet
    'fcidecomp', // not included in plugins yet
];

const results = Object.fromEntries(test_filenames.map(f => [f, {'valid': false, 'error': null, 'skipped': false}]));

for (let test_filename of test_filenames) {
    await new Promise(resolve => setTimeout(resolve, 100));

    FS.writeFile(test_filename, fs.readFileSync(`./test/test_files/${test_filename}`));
    console.log(`testing: ${test_filename}`);
    const f = new h5wasm.File(test_filename, 'r');
    const dset = f.get('data');
    const filter_name = dset.attrs['filter'].value;
    if (exclude_filters.includes(filter_name)) {
        console.log(`skipping excluded filter: ${filter_name}`);
        results[test_filename]['skipped'] = true;
        continue;
    }
    console.log(filter_name)
    try {
        const data = dset.value;
        const valid = filter_name === 'jpeg' ? validate_jpeg_data(data) : validate_data(data);
        console.log(`${filter_name}: ${valid ? 'valid' : 'invalid'}`, dset.filters);
        if (!valid) {
            results[test_filename]['valid'] = false;
            results[test_filename]['error'] = 'data validation failed';
        }
        else {
            results[test_filename]['valid'] = true;
        }
    }
    catch (e) {
        console.log(`${filter_name}: failed.`, dset.value);
        results[test_filename]['error'] = e;
        results[test_filename]['valid'] = false;
    }
    f.close();
}

if (Object.entries(results).some(([k, v]) => !v.skipped && !v.valid)) {
    console.log('Some tests failed:');
    for (let [k, v] of Object.entries(results)) {
        if (!v.skipped && !v.valid) {
            console.log(`  ${k}: ${v.error}`);
        }
    }
    process.exit(1);
}