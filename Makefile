INSTALL_PREFIX = "$(realpath .)/dist"
PLUGINS_INSTALL_PREFIX = "$(realpath .)/plugins"
PLUGIN_NAMES = bshuf bz2 jpeg lz4 lzf szf zfp zstd
PLUGINS = $(patsubst %, plugins/libH5Z%.so, $(HDF5_VERSIONS))

plugins: 
	emcmake cmake -DCMAKE_INSTALL_PREFIX=$(INSTALL_PREFIX) -S . -B build;
	cmake --build build;
	cmake --install build;

clean:
	rm -rf build;
	rm -rf dist;
	rm -rf plugins;
