const index_url = import.meta.url;
export const base_url = index_url.replace(/\/index\.mjs$/, '');

export const plugin_names = [
    "bshuf",
    "blosc",
    "bz2",
    "lz4",
    "lzf",
    "szf",
    "zfp",
    "zstd",
]

export async function install_plugins(h5wasm, names=plugin_names, new_plugin_path=null) {
    if (new_plugin_path !== null) {
        h5wasm.Module.insert_plugin_search_path(new_plugin_path, 0);
    }
    const plugin_path = h5wasm.Module.get_plugin_search_paths()[0];
    h5wasm.FS.mkdirTree(plugin_path);


    for (const plugin_name of names) {
        const plugin_filename = `libH5Z${plugin_name}.so`;
        const r = await fetch(`${base_url}/plugins/${plugin_filename}`);
        const buf = await r.arrayBuffer();
        h5wasm.FS.writeFile(`${plugin_path}/${plugin_filename}`, new Uint8Array(buf));
    }
}

export function list_plugins(h5wasm) {
    const plugin_path = h5wasm.Module.get_plugin_search_paths()[0];
    return h5wasm.FS.readdir(plugin_path);
}

export function install_local_plugins(h5wasm) {
    const local_path = base_url.replace(/^file:\/\//, '');
    h5wasm.Module.insert_plugin_search_path(`${local_path}/plugins`, 0);
}