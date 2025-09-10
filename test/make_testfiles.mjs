import * as h5wasm from 'h5wasm/node';
const module = await h5wasm.ready;

import { install_plugins, plugin_names, install_local_plugins } from '../index.mjs';
await install_local_plugins(module);

const TEST_PATH = './test/test_files';

if (module.FS.analyzePath(TEST_PATH).exists) {
  console.log("test_files directory exists");
} else {
  module.FS.mkdir(TEST_PATH);
  console.log("Created test_files directory");
}

function make_jpeg(quality= 100) {
  const NX = 1024;
  const NY = 512;
  const NUM_IMAGES = 10;
  const SIZE = (NX * NY * NUM_IMAGES);
  const SHAPE = [NUM_IMAGES, NY, NX];
  const CHUNKSHAPE = [1, NY, NX];
  const DATA = [...new Array(SIZE)].map((_, i) => i % 256);
  console.log(DATA.slice(0, 100));

  const cd_values = [
    quality,  /* JPEG quality factor (1-100) */
    NX,       /* Number of columns */
    NY,       /* Number of rows */
    0,        /* Color mode (0=Mono, 1=RGB) */
  ];
  
  const f = new h5wasm.File("./test/test_files/test_jpeg.h5", "w");
  const dset = f.create_dataset({
    name: "data",
    data: DATA,
    shape: SHAPE,
    dtype: "B",
    chunks: CHUNKSHAPE,
    compression: 32019,
    compression_opts: cd_values
  });
  dset.create_attribute("filter", "jpeg");
  f.close()
}

function make_bz2(level=2) {
  // const f_in = new h5wasm.File("./test/test_files/test_bzip2.h5", "r");
  // console.log(f_in.get("data").value);
  // f_in.close();


  const data = [...new Array(20)].map((_, i) => i);
  const cd_values = [level];
  const chunks = [data.length];
  const name = "data";

  const f = new h5wasm.File("./test/test_files/test_bz2.h5", "w");
  const dset = f.create_dataset({
    name,
    data,
    dtype: "<f4",
    chunks,
    compression: 307,
    compression_opts: cd_values
  });
  dset.create_attribute("filter", "bz2");
  f.close()
}

make_bz2();
make_jpeg();
