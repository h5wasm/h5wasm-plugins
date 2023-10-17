cmake_minimum_required(VERSION 3.24)
project (H5WASM_PLUGINS C)
include(FetchContent)

# get grandparent path
cmake_path(GET CMAKE_CURRENT_SOURCE_DIR PARENT_PATH base_path)
cmake_path(GET base_path PARENT_PATH base_path)

set(CMAKE_BUILD_TYPE Release)
set(CMAKE_EXE_LINKER_FLAGS_INIT "-sNODERAWFS=1 -sFORCE_FILESYSTEM=1 -sSINGLE_FILE=1 --extern-pre-js=${base_path}/shebang.txt" CACHE INTERNAL "")
# set(CMAKE_C_FLAGS_INIT "-sUSE_ZLIB=1" CACHE INTERNAL "")
set(CMAKE_POSITION_INDEPENDENT_CODE ON CACHE BOOL "use -fPIC for all libs" FORCE)
set(EMSCRIPTEN_LINK_FLAGS "-s WASM=1 -s SIDE_MODULE=2 -v")
message(STATUS "CMAKE_MODULE_PATH: ${CMAKE_MODULE_PATH}")
list(APPEND CMAKE_MODULE_PATH "${base_path}/dist")
message(STATUS "CMAKE_MODULE_PATH: ${CMAKE_MODULE_PATH}")


FetchContent_Declare(
  h5pl
  PATCH_COMMAND git apply --ignore-whitespace "${base_path}/h5pl.patch" || true
  # PATCH_COMMAND git apply --ignore-whitespace "${base_path}/h5pl.patch"
  GIT_REPOSITORY https://github.com/HDF_Group/hdf5_plugins
  GIT_TAG  b416b245c949b4cb5647b0fa19989a61f28a3edc
)
if(NOT h5pl_POPULATED)
  FetchContent_Populate(
    h5pl
  )
endif()
# include(${h5pl_SOURCE_DIR}/config/cmake/cacheinit.cmake)


set (HDF5_ROOT ${base_path}/dist)
set (ZLIB_ROOT ${base_path}/dist)
set (ZLIB_DIR ${base_path}/dist CACHE STRING "" FORCE)
set (ZLIB_INCLUDE_DIR ${ZLIB_DIR}/include CACHE STRING "" FORCE)
set (ZLIB_LIBRARY ${ZLIB_DIR}/lib/libz.a CACHE STRING "" FORCE)
include_directories(${ZLIB_INCLUDE_DIR})

message(STATUS "ZLIB_DIR: ${ZLIB_DIR}")
set (HDF5_DIR ${base_path}/dist/cmake)
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
set (ENABLE_BLOSC ON)
set (BLOSC_PACKAGE_NAME "BLOSC")
set (BLOSC_TGZ_NAME "c-blosc-1.21.5.tar.gz")
set (ENABLE_BSHUF ON)
set (BSHUF_TGZ_NAME "bitshuffle-0.5.1.tar.gz")
set (BSHUF_PACKAGE_NAME "BSHUF")
set (ENABLE_BZIP2 ON)
set (BZ2_TGZ_NAME "bzip2-bzip2-1.0.8.tar.gz")
set (BZ2_PACKAGE_NAME "BZ2")
set (ENABLE_JPEG ON)
set (JPEG_TGZ_NAME "jpegsrc.v9e.tar.gz")
set (JPEG_PACKAGE_NAME "JPEG")
set (ENABLE_LZ4 ON CACHE BOOL "" FORCE)
set (LZ4_TGZ_NAME "lz4-1.9.4.tar.gz")
set (LZ4_PACKAGE_NAME "LZ4")
set (ENABLE_LZF ON)
set (LZF_TGZ_NAME "liblzf-3.6.tar.gz")
set (LZF_PACKAGE_NAME "LZF")
set (ENABLE_SZ ON)
set (SZ_TGZ_NAME "SZ-2.1.12.5.tar.gz")
set (SZ_PACKAGE_NAME "SZ")
# set (SZ_FIND_DEPS ON)
set (ENABLE_ZFP ON)
set (ZFP_TGZ_NAME "zfp-1.0.0.tar.gz")
set (ZFP_PACKAGE_NAME "ZFP")
set (ENABLE_ZSTD ON)
set (ZSTD_TGZ_NAME "zstd-1.5.5.tar.gz")
set (ZSTD_PACKAGE_NAME "ZSTD")

# option(TGZPATH "where to get zipped libraries" ${h5pl_SOURCE_DIR}/libs)
# option(ENABLE_BLOSC "enable blosc" ON)
# option(ENABLE_BSHUF "enable bshuf" ON)
# option(ENABLE_BZIP2 "enable bzip2" ON)

# message(STATUS "LIBS: ${TGZPATH}")

add_subdirectory(${h5pl_SOURCE_DIR} ${h5pl_BINARY_DIR})

set(PLUGIN_DIR ${base_path}/plugins CACHE PATH "")
message(STATUS "PLUGIN_DIR: ${PLUGIN_DIR}")

function(build_shared_plugin base_name plugin_libs plugin_depends external_libs)
  list(TRANSFORM plugin_libs PREPEND ${h5pl_BINARY_DIR}/bin/)
  list(TRANSFORM external_libs PREPEND ${base_path}/dist/lib/)
  set(_plugin_name "libH5Z${base_name}.so")
  add_custom_target(h5${base_name}_shared ALL 
    COMMAND 
      ${CMAKE_C_COMPILER} -s SIDE_MODULE=1 ${plugin_libs} ${external_libs} -o ${_plugin_name}
    DEPENDS ${plugin_depends}
  )
  install(PROGRAMS ${CMAKE_CURRENT_BINARY_DIR}/${_plugin_name} DESTINATION ${PLUGIN_DIR})
endfunction()

build_shared_plugin(bz2 "libh5bz2.a;libbz2.a" "h5bz2;bz2-static" "")
build_shared_plugin(bshuf "libh5bshuf.a" "h5bshuf" "")
build_shared_plugin(zstd "libh5zstd.a;libzstd.a" "h5zstd;libzstd_static" "")
build_shared_plugin(lz4 "libh5lz4.a" "h5lz4" "")
build_shared_plugin(lzf "libh5lzf.a" "h5lzf;lzf-static" "")
build_shared_plugin(szf "libh5sz.a;libzstd.a" "h5sz;libzstd_static" "libz.a")
build_shared_plugin(zfp "libh5zfp.a;libzfp.a" "h5zfp;zfp" "")
build_shared_plugin(jpeg "libh5jpeg.a;libjpeg.a" "h5jpeg;jpeg-static" "")
build_shared_plugin(blosc "libh5blosc.a;libblosc.a" "h5blosc;blosc_static" "")
