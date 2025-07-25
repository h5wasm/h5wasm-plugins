cmake_policy(SET CMP0079 NEW)
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

set (BASE_URL "https://github.com/usnistgov/libhdf5-wasm/releases/download/v0.4.6_3.1.68" CACHE STRING "")
# set (BASE_URL "$ENV{HOME}/dev/libhdf5-wasm" CACHE STRING "")

FetchContent_Declare(
  libhdf5-wasm
  URL ${BASE_URL}/HDF5-1.14.6-Emscripten.tar.gz
  URL_HASH SHA256=0c5de36a3c81e3854e57593c55274d89a43db3f8a7bbe6a0d9d5c560e9c222b1
)
if (NOT libhdf5-wasm_POPULATED)
  FetchContent_MakeAvailable(libhdf5-wasm)
endif()

set(HDF5_DIR ${libhdf5-wasm_SOURCE_DIR}/cmake)
find_package(HDF5 REQUIRED CONFIG)

FetchContent_Declare(
  zstd
  GIT_REPOSITORY https://github.com/facebook/zstd
  SOURCE_SUBDIR  build/cmake
  GIT_TAG v1.5.6
)

set(ZSTD_BUILD_TESTS OFF CACHE INTERNAL "")
set(ZSTD_MULTITHREAD_SUPPORT OFF CACHE INTERNAL "")
set(ZSTD_BUILD_PROGRAMS OFF CACHE INTERNAL "")
set(ZSTD_BUILD_TESTS OFF CACHE INTERNAL "")
set(ZSTD_BUILD_SHARED OFF CACHE INTERNAL "")
set(ZSTD_BUILD_STATIC ON CACHE INTERNAL "")

FetchContent_GetProperties(zstd)
if(NOT zstd_POPULATED)
  FetchContent_Populate(zstd)
  add_subdirectory(${zstd_SOURCE_DIR}/build/cmake ${zstd_BINARY_DIR} EXCLUDE_FROM_ALL)
  include_directories(${zstd_SOURCE_DIR}/lib)
endif()

FetchContent_Declare(
  h5pl
  PATCH_COMMAND git apply --ignore-whitespace "${base_path}/h5pl.patch" || true
  # PATCH_COMMAND git apply --ignore-whitespace "${base_path}/h5pl.patch"
  GIT_REPOSITORY https://github.com/HDFGroup/hdf5_plugins
  GIT_TAG  hdf5-1.14.6
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

# the SZF library uses pkg_search_module to find zstd... with older pkg-config
# it seems to need help finding it:
set(ENV{PKG_CONFIG_PATH} "${zstd_BINARY_DIR}/lib")
set (ZSTD_LIBRARY "${zstd_BINARY_DIR}/lib/libzstd.a")

find_package(HDF5 REQUIRED CONFIG)
find_package(ZLIB REQUIRED MODULE)
# message(STATUS "ZLIB_FOUND: ${ZLIB_FOUND}, ${ZLIB_DIR}")

set (PL_PACKAGE_NAME "PL")
set (TGZPATH ${h5pl_SOURCE_DIR}/libs)
# set (USE_SHARED_LIBS OFF CACHE BOOL "Use Shared Libraries" FORCE)

# set (BUILD_LZ4_LIBRARY_SOURCE OFF CACHE BOOL "build the lz4 library within the plugin" FORCE)
add_definitions(-DHAVE_ARPA_INET_H)
add_definitions(-DZSTD_SUPPORT)
# add_definitions(-DHAVE_UNISTD_H)
set (H5PL_ALLOW_EXTERNAL_SUPPORT "TGZ" CACHE STRING "Allow External Library Building (NO GIT TGZ)" FORCE)
# set (H5PL_BUILD_TESTING OFF CACHE STRING "" FORCE)
option (BUILD_TESTS "testing" OFF)
option (ENABLE_BLOSC "blosc" ON)
# set (HDF_ENABLE_BLOSC_SUPPORT ON CACHE STRING "" FORCE)
set (BLOSC_ZLIB_USE_EXTERNAL OFF CACHE STRING "" FORCE)
set (BLOSC_TGZ_NAME "c-blosc-1.21.6.tar.gz")
set (BLOSC_PACKAGE_NAME "BLOSC")
# set (HDF_ENABLE_BLOSC2_SUPPORT ON CACHE STRING "" FORCE)
option (ENABLE_BLOSC2 "blosc2" ON)
set (BLOSC2_TGZ_NAME "c-blosc2-2.15.2.tar.gz")
set (BLOSC2_PACKAGE_NAME "BLOSC2")
option (ENABLE_BSHUF "bshuf" ON)
set (BSHUF_TGZ_NAME "bitshuffle-0.5.2.tar.gz")
set (BSHUF_PACKAGE_NAME "BSHUF")
option (ENABLE_BZIP2 "bzip2" ON)
set (BZ2_TGZ_NAME "bzip2-bzip2-1.0.8.tar.gz")
set (BZ2_PACKAGE_NAME "BZ2")
option (ENABLE_JPEG "jpeg" ON)
# set (JPEG_USE_EXTERNAL OFF CACHE STRING "" FORCE)
set (JPEG_TGZ_NAME "jpegsrc.v9e.tar.gz")
set (JPEG_PACKAGE_NAME "JPEG")
set (ENABLE_LZ4 ON CACHE BOOL "" FORCE)
set (LZ4_TGZ_NAME "lz4-1.10.0.tar.gz")
set (LZ4_PACKAGE_NAME "LZ4")
option (ENABLE_LZF "lzf" ON)
set (LZF_TGZ_NAME "liblzf-3.6.tar.gz")
set (LZF_PACKAGE_NAME "LZF")
option (ENABLE_SZ "sz" OFF)
# SZ labelled as broken in community filters
# set (SZ_TGZ_NAME "SZ-2.1.12.5.tar.gz")
# set (SZ_PACKAGE_NAME "SZ")
# set (SZ_FIND_DEPS ON)
option (ENABLE_ZFP "zfp" ON)
set (ZFP_TGZ_NAME "zfp-1.0.1.tar.gz")
set (ZFP_PACKAGE_NAME "ZFP")
option (ENABLE_ZSTD "zstd" ON)
set (ZSTD_TGZ_NAME "zstd-1.5.6.tar.gz")
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
      ${CMAKE_C_COMPILER} -sSIDE_MODULE=1 -sWASM_BIGINT -sSUPPORT_LONGJMP=emscripten ${plugin_libs} ${external_libs} -o ${_plugin_name}
    DEPENDS ${plugin_depends}
  )
  install(PROGRAMS ${CMAKE_CURRENT_BINARY_DIR}/${_plugin_name} DESTINATION ${PLUGIN_DIR})
endfunction()

build_shared_plugin(bz2 "libh5bz2.a;libbz2.a" "h5bz2;bz2-static" "")
build_shared_plugin(bshuf "libh5bshuf.a" "h5bshuf;libzstd_static" "${ZSTD_LIBRARY}")
build_shared_plugin(zstd "libh5zstd.a" "h5zstd;libzstd_static" "${ZSTD_LIBRARY}")
build_shared_plugin(lz4 "libh5lz4.a" "h5lz4" "")
build_shared_plugin(lzf "libh5lzf.a;liblzf.a" "h5lzf;lzf-static" "")
# build_shared_plugin(szf "libh5sz.a;libSZ.a" "h5sz;libzstd_static" "${ZLIB_LIBRARY};${ZSTD_LIBRARY}")
build_shared_plugin(zfp "libh5zfp.a;libzfp.a" "h5zfp;zfp" "")
build_shared_plugin(jpeg "libh5jpeg.a;libjpeg.a" "h5jpeg;jpeg-static" "")
build_shared_plugin(blosc "libh5blosc.a;libblosc.a" "h5blosc;blosc_static" "")
build_shared_plugin(blosc2 "libh5blosc2.a;libblosc2.a" "h5blosc2;blosc2_static" "")
