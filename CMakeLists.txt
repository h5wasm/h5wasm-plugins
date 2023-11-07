cmake_minimum_required(VERSION 3.24)
project (H5WASM_PLUGINS C)
include(FetchContent)

set(base_path ${CMAKE_SOURCE_DIR})

set(CMAKE_BUILD_TYPE Release)
set(CMAKE_EXE_LINKER_FLAGS "${CMAKE_EXE_LINKER_FLAGS} -sNODERAWFS=1 -sFORCE_FILESYSTEM=1 --extern-pre-js=${base_path}/shebang.txt")
# set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -sWASM_BIGINT -v")
# set(CMAKE_C_FLAGS_INIT "-sUSE_ZLIB=1" CACHE INTERNAL "")
set(CMAKE_POSITION_INDEPENDENT_CODE ON CACHE BOOL "use -fPIC for all libs" FORCE)
message(STATUS "CMAKE_MODULE_PATH: ${CMAKE_MODULE_PATH}")
list(APPEND CMAKE_MODULE_PATH "${base_path}/dist")
message(STATUS "CMAKE_MODULE_PATH: ${CMAKE_MODULE_PATH}")

set (BASE_URL "https://github.com/usnistgov/libhdf5-wasm/releases/download/v0.4.2_3.1.43" CACHE STRING "")
# set (BASE_URL "$ENV{HOME}/dev/libhdf5-wasm" CACHE STRING "")

FetchContent_Declare(
  libhdf5-wasm
  URL ${BASE_URL}/HDF5-1.14.2-Emscripten.tar.gz
  URL_HASH SHA256=af86c8fc16d07b37a3c7f17bd16895379f63f779796fb3db46758d67d5f8384e
)
if (NOT libhdf5-wasm_POPULATED)
  FetchContent_MakeAvailable(libhdf5-wasm)
endif()

set(HDF5_DIR ${libhdf5-wasm_SOURCE_DIR}/cmake)
find_package(HDF5 REQUIRED CONFIG)

FetchContent_Declare(
  h5pl
  PATCH_COMMAND git apply --ignore-whitespace "${base_path}/h5pl.patch" || true
  # PATCH_COMMAND git apply --ignore-whitespace "${base_path}/h5pl.patch"
  GIT_REPOSITORY https://github.com/HDFGroup/hdf5_plugins
  GIT_TAG  b416b245c949b4cb5647b0fa19989a61f28a3edc
)
if(NOT h5pl_POPULATED)
  FetchContent_Populate(
    h5pl
  )
endif()
# include(${h5pl_SOURCE_DIR}/config/cmake/cacheinit.cmake)

set(ZLIB_DIR ${libhdf5-wasm_SOURCE_DIR})
set(ZLIB_ROOT ${libhdf5-wasm_SOURCE_DIR})
set (ZLIB_INCLUDE_DIR ${ZLIB_DIR}/include CACHE STRING "" FORCE)
set (ZLIB_LIBRARY ${ZLIB_DIR}/lib/libz.a CACHE STRING "" FORCE)
message(STATUS "ZLIB_DIR: ${ZLIB_DIR}")

find_package(HDF5 REQUIRED CONFIG)
find_package(ZLIB REQUIRED MODULE)
# message(STATUS "ZLIB_FOUND: ${ZLIB_FOUND}, ${ZLIB_DIR}")

set (PL_PACKAGE_NAME "PL")
set (TGZPATH ${h5pl_SOURCE_DIR}/libs)
# set (USE_SHARED_LIBS OFF CACHE BOOL "Use Shared Libraries" FORCE)

# set (BUILD_LZ4_LIBRARY_SOURCE OFF CACHE BOOL "build the lz4 library within the plugin" FORCE)
add_definitions(-DHAVE_ARPA_INET_H)
# add_definitions(-DHAVE_UNISTD_H)
set (H5PL_ALLOW_EXTERNAL_SUPPORT "TGZ" CACHE STRING "Allow External Library Building (NO GIT TGZ)" FORCE)
option (ENABLE_BLOSC "blosc" ON)
set (BLOSC_PACKAGE_NAME "BLOSC")
set (BLOSC_TGZ_NAME "c-blosc-1.21.5.tar.gz")
option (ENABLE_BSHUF "bshuf" ON)
set (BSHUF_TGZ_NAME "bitshuffle-0.5.1.tar.gz")
set (BSHUF_PACKAGE_NAME "BSHUF")
option (ENABLE_BZIP2 "bzip2" ON)
set (BZ2_TGZ_NAME "bzip2-bzip2-1.0.8.tar.gz")
set (BZ2_PACKAGE_NAME "BZ2")
option (ENABLE_JPEG "jpeg" ON)
set (JPEG_TGZ_NAME "jpegsrc.v9e.tar.gz")
set (JPEG_PACKAGE_NAME "JPEG")
set (ENABLE_LZ4 ON CACHE BOOL "" FORCE)
set (LZ4_TGZ_NAME "lz4-1.9.4.tar.gz")
set (LZ4_PACKAGE_NAME "LZ4")
option (ENABLE_LZF "lzf" ON)
set (LZF_TGZ_NAME "liblzf-3.6.tar.gz")
set (LZF_PACKAGE_NAME "LZF")
option (ENABLE_SZ "sz" ON)
set (SZ_TGZ_NAME "SZ-2.1.12.5.tar.gz")
set (SZ_PACKAGE_NAME "SZ")
# set (SZ_FIND_DEPS ON)
option (ENABLE_ZFP "zfp" ON)
set (ZFP_TGZ_NAME "zfp-1.0.0.tar.gz")
set (ZFP_PACKAGE_NAME "ZFP")
option (ENABLE_ZSTD "zstd" ON)
set (ZSTD_TGZ_NAME "zstd-1.5.5.tar.gz")
set (ZSTD_PACKAGE_NAME "ZSTD")

# option(TGZPATH "where to get zipped libraries" ${h5pl_SOURCE_DIR}/libs)
add_subdirectory(${h5pl_SOURCE_DIR} ${h5pl_BINARY_DIR})

set(PLUGIN_DIR ${base_path}/plugins CACHE PATH "")
message(STATUS "PLUGIN_DIR: ${PLUGIN_DIR}")

function(build_shared_plugin base_name plugin_libs plugin_depends external_libs)
  list(TRANSFORM plugin_libs PREPEND ${h5pl_BINARY_DIR}/bin/)
  # list(TRANSFORM external_libs PREPEND ${base_path}/dist/lib/)
  set(_plugin_name "libH5Z${base_name}.so")
  add_custom_target(h5${base_name}_shared ALL 
    COMMAND 
      ${CMAKE_C_COMPILER} -sSIDE_MODULE=1 -sWASM_BIGINT ${plugin_libs} ${external_libs} -o ${_plugin_name}
    DEPENDS ${plugin_depends}
  )
  install(PROGRAMS ${CMAKE_CURRENT_BINARY_DIR}/${_plugin_name} DESTINATION ${PLUGIN_DIR})
endfunction()

build_shared_plugin(bz2 "libh5bz2.a;libbz2.a" "h5bz2;bz2-static" "")
build_shared_plugin(bshuf "libh5bshuf.a" "h5bshuf" "")
build_shared_plugin(zstd "libh5zstd.a;libzstd.a" "h5zstd;libzstd_static" "")
build_shared_plugin(lz4 "libh5lz4.a" "h5lz4" "")
build_shared_plugin(lzf "libh5lzf.a;liblzf.a" "h5lzf;SZ;lzf-static" "")
build_shared_plugin(szf "libh5sz.a;libSZ.a;libzstd.a" "h5sz;libzstd_static" "${ZLIB_LIBRARY}")
build_shared_plugin(zfp "libh5zfp.a;libzfp.a" "h5zfp;zfp" "")
# build_shared_plugin(jpeg "libh5jpeg.a;libjpeg.a" "h5jpeg;jpeg-static" "")
build_shared_plugin(blosc "libh5blosc.a;libblosc.a" "h5blosc;blosc_static" "")
