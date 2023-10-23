INSTALL_PREFIX = "$(realpath .)/dist"
PLUGINS_INSTALL_PREFIX = "$(realpath .)/plugins"
HDF5_VERSION = 1.14.2
ZLIB_LIBRARY = $(INSTALL_PREFIX)/lib/libz.a
SZIP_LIBRARY = $(INSTALL_PREFIX)/lib/libsz.a
HDF5_LIBRARY = $(INSTALL_PREFIX)/lib/libhdf5.a

all: PLUGINS

$(HDF5_LIBRARY): $(ZLIB_LIBRARY) $(SZIP_LIBRARY)
	mkdir -p build;
	emcmake cmake -DHDF5_VERSION=$(HDF5_VERSION) -DCMAKE_INSTALL_PREFIX=$(INSTALL_PREFIX) -S cmake/libhdf5 -B build/libhdf5;
	cmake --build build/libhdf5 -j8;
	cmake --install build/libhdf5;

$(ZLIB_LIBRARY):
	mkdir -p build;
	emcmake cmake -DCMAKE_INSTALL_PREFIX=$(INSTALL_PREFIX) -S cmake/libz -B build/libz;
	cmake --build build/libz;
	cmake --install build/libz;

zlib: $(ZLIB_LIBRARY)

$(SZIP_LIBRARY):
	mkdir -p build;
	emcmake cmake -DCMAKE_INSTALL_PREFIX=$(INSTALL_PREFIX) -S cmake/libaec -B build/libaec;
	cmake --build build/libaec -j8;
	cmake --install build/libaec;

szip: $(SZIP_LIBRARY)

PLUGINS: $(HDF5_LIBRARY)
	emcmake cmake -DCMAKE_INSTALL_PREFIX=$(INSTALL_PREFIX) -S cmake/h5pl -B build/h5pl;
	cmake --build build/h5pl;
	cmake --install build/h5pl;

clean:
	rm -rf build
	rm -rf dist
