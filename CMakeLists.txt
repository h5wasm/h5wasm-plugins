cmake_policy(SET CMP0079 NEW)
cmake_minimum_required(VERSION 3.24)

project (H5WASM_PLUGINS C)

include(FetchContent)

set(base_path ${CMAKE_SOURCE_DIR})

set(CMAKE_BUILD_TYPE Release)
set(CMAKE_EXE_LINKER_FLAGS "${CMAKE_EXE_LINKER_FLAGS} -sNODERAWFS=1 -sFORCE_FILESYSTEM=1 --extern-pre-js=${base_path}/shebang.txt")
set(CMAKE_POSITION_INDEPENDENT_CODE ON CACHE BOOL "use -fPIC for all libs" FORCE)
message(STATUS "CMAKE_MODULE_PATH: ${CMAKE_MODULE_PATH}")
list(APPEND CMAKE_MODULE_PATH "${base_path}/dist")
message(STATUS "CMAKE_MODULE_PATH: ${CMAKE_MODULE_PATH}")

set (BASE_URL "https://github.com/usnistgov/libhdf5-wasm/releases/download/v0.6.0_4.0.23" CACHE STRING "")
# set (BASE_URL "$ENV{HOME}/dev/libhdf5-wasm" CACHE STRING "")

FetchContent_Declare(
  libhdf5-wasm
  URL ${BASE_URL}/HDF5-2.0.0-Emscripten.tar.gz
  URL_HASH SHA256=d4dc6719ef164679728d9a50d6a4d97c826f563e22a40c4dec63e485b29781be
)
if (NOT libhdf5-wasm_POPULATED)
  FetchContent_MakeAvailable(libhdf5-wasm)
endif()

set(HDF5_DIR ${libhdf5-wasm_SOURCE_DIR}/cmake)
find_package(HDF5 REQUIRED CONFIG)

# Create alias for hdf5::hdf5-static if it doesn't exist
if(NOT TARGET hdf5::hdf5-static)
  if(TARGET hdf5-static)
    add_library(hdf5::hdf5-static ALIAS hdf5-static)
    message(STATUS "Created alias hdf5::hdf5-static -> hdf5-static")
  else()
    message(WARNING "Neither hdf5::hdf5-static nor hdf5-static target found")
  endif()
endif()

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
  GIT_TAG  5d7fe9c156810c599537e53fb210d1f6a8481ed9
)
if(NOT h5pl_POPULATED)
  FetchContent_Populate(
    h5pl
  )
endif()

FetchContent_Declare(
  zlib
  GIT_REPOSITORY https://github.com/madler/zlib
  GIT_TAG v1.3.1
)
if(NOT zlib_POPULATED)
  FetchContent_MakeAvailable(zlib)
endif()

set (ZLIB_DIR ${zlib_SOURCE_DIR})
set (ZLIB_INCLUDE_DIR ${zlib_SOURCE_DIR} CACHE STRING "" FORCE)
set (ZLIB_LIBRARY ${zlib_BINARY_DIR}/libz.a CACHE STRING "" FORCE)
# Add zlib include directories globally so blosc and other deps can find both zlib.h and zconf.h
include_directories(${zlib_SOURCE_DIR} ${zlib_BINARY_DIR})
find_package(ZLIB REQUIRED)

# the SZF library uses pkg_search_module to find zstd... with older pkg-config
# it seems to need help finding it:
set(ENV{PKG_CONFIG_PATH} "${zstd_BINARY_DIR}/lib")
set (ZSTD_LIBRARY "${zstd_BINARY_DIR}/lib/libzstd.a")

# add presets for h5pl build
include(${h5pl_SOURCE_DIR}/config/CacheURLs.cmake)

set (PL_PACKAGE_NAME "PL")
set (TGZPATH ${h5pl_SOURCE_DIR}/libs)
# set (USE_SHARED_LIBS OFF CACHE BOOL "Use Shared Libraries" FORCE)

add_definitions(-DHAVE_ARPA_INET_H)
add_definitions(-DZSTD_SUPPORT)
# add_definitions(-DHAVE_UNISTD_H)
set (H5PL_ALLOW_EXTERNAL_SUPPORT "TGZ" CACHE STRING "Allow External Library Building (NO GIT TGZ)" FORCE)
option (BUILD_TESTS "testing" OFF)
option (ENABLE_BLOSC "blosc" ON)
set (BLOSC_ZLIB_USE_EXTERNAL OFF CACHE STRING "" FORCE)
option (ENABLE_BLOSC2 "blosc2" ON)
option (ENABLE_BSHUF "bshuf" ON)
option (ENABLE_BZIP2 "bzip2" ON)
option (ENABLE_JPEG "jpeg" ON)
set (ENABLE_LZ4 ON CACHE BOOL "" FORCE)
option (ENABLE_LZF "lzf" ON)
option (ENABLE_SZ "sz" OFF)
# SZ labelled as broken in community filters
# set (SZ_TGZ_NAME "SZ-2.1.12.5.tar.gz")
# set (SZ_PACKAGE_NAME "SZ")
# set (SZ_FIND_DEPS ON)
option (ENABLE_ZFP "zfp" ON)
option (ENABLE_ZSTD "zstd" ON)

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
build_shared_plugin(lz4 "libh5lz4.a;liblz4.a" "h5lz4;lz4_static" "")
build_shared_plugin(lzf "libh5lzf.a;liblzf.a" "h5lzf;lzf-static" "")
# build_shared_plugin(szf "libh5sz.a;libSZ.a" "h5sz;libzstd_static" "${ZLIB_LIBRARY};${ZSTD_LIBRARY}")
build_shared_plugin(zfp "libh5zfp.a;libzfp.a" "h5zfp;zfp" "")
build_shared_plugin(jpeg "libh5jpeg.a;libjpeg.a" "h5jpeg;jpeg-static" "")
build_shared_plugin(blosc "libh5blosc.a;libblosc.a" "h5blosc;blosc_static" "")
build_shared_plugin(blosc2 "libh5blosc2.a;libblosc2.a" "h5blosc2;blosc2_static" "")
build_shared_plugin(bitgroom "libh5bitgroom.a" "h5bitgroom" "")
build_shared_plugin(bitround "libh5bitround.a" "h5bitround" "")
