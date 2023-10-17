cmake_minimum_required(VERSION 3.24)
project (H5WASM_PLUGINS C)
include(FetchContent)

set(CMAKE_BUILD_TYPE Release)
set(CMAKE_EXE_LINKER_FLAGS_INIT "-sNODERAWFS=1 -sFORCE_FILESYSTEM=1 -sSINGLE_FILE=1 --extern-pre-js=${CMAKE_SOURCE_DIR}/shebang.txt" CACHE INTERNAL "")
set(CMAKE_INSTALL_PREFIX "${CMAKE_CURRENT_BINARY_DIR}/plugins" CACHE STRING "local install folder" FORCE)
set(EMSCRIPTEN_LINK_FLAGS "-s WASM=1 -s SIDE_MODULE=2 -v")

FetchContent_Declare(
  zlib
  URL http://zlib.net/fossils/zlib-1.3.tar.gz
  URL_HASH  SHA256=ff0ba4c292013dbc27530b3a81e1f9a813cd39de01ca5e0f8bf355702efa593e
  OVERRIDE_FIND_PACKAGE
)
FetchContent_MakeAvailable(zlib)

find_package(ZLIB CONFIG REQUIRED)
message(STATUS "ZLIB_FOUND: ${ZLIB_FOUND}, ${zlib_SOURCE_DIR}")

FetchContent_Declare(
  hdf5
  URL https://github.com/HDFGroup/hdf5/archive/refs/tags/hdf5-1_12_2.tar.gz
  URL_HASH SHA256=1ca14cadff7bc4b61826eee591da1a330f44c107db66c9510ee95df3b2bc5f78
  OVERRIDE_FIND_PACKAGE
)
FetchContent_Populate(hdf5)

set(HDF5_ALLOW_EXTERNAL_SUPPORT "NO")
set (BUILD_SHARED_LIBS OFF CACHE BOOL "" FORCE)
option(BUILD_SHARED_LIBS "Build shared libs" OFF)
option(HDF5_BUILD_EXAMPLES "Build Examples" OFF)
option(HDF5_BUILD_TOOLS "Build Tools" ON)
option(HDF5_BUILD_UTILS "Build Utils" OFF)
option(HDF5_BUILD_CPP_LIB "Build CPP libraries" ON)
option(HDF5_ENABLE_Z_LIB_SUPPORT "Enable ZLIB" ON)
option(HDF5_ENABLE_SZIP_SUPPORT "Enable SZIP" OFF)
option (HDF5_ENABLE_SZIP_ENCODING "Use SZip Encoding" OFF)
option(SZIP_USE_EXTERNAL "needs to be off" 0)
option(ZLIB_USE_EXTERNAL "needs to be off" 0)

set (BUILD_TESTING OFF CACHE BOOL "Do not build tests by default" FORCE)
set(H5_HAVE_GETPWUID OFF)
set(H5_HAVE_SIGNAL OFF)

set(CMAKE_BUILD_TYPE RELEASE)

add_subdirectory(${hdf5_SOURCE_DIR} ${hdf5_BINARY_DIR})


# set(HDF5_DIR /Users/bbm/mambaforge/envs/h5wasm)

FetchContent_Declare(
  h5pl
  PATCH_COMMAND git apply --ignore-whitespace "${CMAKE_CURRENT_LIST_DIR}/h5pl.patch" || true
  GIT_REPOSITORY https://github.com/HDFGroup/hdf5_plugins
  GIT_TAG 1.14.0
)
if(NOT h5pl_POPULATED)
  FetchContent_Populate(
    h5pl
  )
endif()
# include(${h5pl_SOURCE_DIR}/config/cmake/cacheinit.cmake)

# set (ZLIB_TGZ_URL "http://zlib.net/fossils/zlib-1.3.tar.gz" CACHE STRING "Use ZLib from compressed file" FORCE)
# set (ZLIB_PACKAGE_NAME "zlib" CACHE STRING "Name of ZLIB package" FORCE)
set (PL_PACKAGE_NAME "PL")
set (TGZPATH ${h5pl_SOURCE_DIR}/libs)
# set (USE_SHARED_LIBS OFF CACHE BOOL "Use Shared Libraries" FORCE)

# set (BUILD_LZ4_LIBRARY_SOURCE OFF CACHE BOOL "build the lz4 library within the plugin" FORCE)
add_definitions(-DHAVE_ARPA_INET_H)
set (H5PL_ALLOW_EXTERNAL_SUPPORT "TGZ" CACHE STRING "Allow External Library Building (NO GIT TGZ)" FORCE)
set (ENABLE_BLOSC ON)
set (BLOSC_PACKAGE_NAME "BLOSC")
set (BLOSC_TGZ_NAME "c-blosc.tar.gz")
set (ENABLE_BSHUF ON)
set (BSHUF_PACKAGE_NAME "BSHUF")
set (ENABLE_BZIP2 ON)
set (BZ2_TGZ_NAME "BZ2.tar.gz")
set (BZ2_PACKAGE_NAME "BZ2")
set (ENABLE_JPEG ON)
set (JPEG_TGZ_NAME JPEG.tar.gz)
set (JPEG_PACKAGE_NAME "JPEG")
set (ENABLE_LZ4 ON)
set (LZ4_TGZ_NAME "lz4.tar.gz")
set (LZ4_PACKAGE_NAME "LZ4")
set (ENABLE_LZF ON)
set (LZF_TGZ_NAME "lzf.tar.gz")
set (LZF_PACKAGE_NAME "LZF")
set (ENABLE_SZ ON)
set (SZ_TGZ_NAME "szf.tar.gz")
set (SZ_PACKAGE_NAME "SZ")
set (SZ_FIND_DEPS ON)
set (ENABLE_ZFP ON)
set (ZFP_TGZ_NAME "zfp.tar.gz")
set (ZFP_PACKAGE_NAME "ZFP")
set (ENABLE_ZSTD ON)
set (ZSTD_TGZ_NAME "zstd.tar.gz")
set (ZSTD_PACKAGE_NAME "ZSTD")

# option(TGZPATH "where to get zipped libraries" ${h5pl_SOURCE_DIR}/libs)
# option(ENABLE_BLOSC "enable blosc" ON)
# option(ENABLE_BSHUF "enable bshuf" ON)
# option(ENABLE_BZIP2 "enable bzip2" ON)

# message(STATUS "LIBS: ${TGZPATH}")

add_subdirectory(${h5pl_SOURCE_DIR} ${h5pl_BINARY_DIR})

set(PLUGIN_DIR ${CMAKE_CURRENT_BINARY_DIR}/plugins CACHE PATH "")
message(STATUS "PLUGIN_DIR: ${PLUGIN_DIR}")

function(build_shared_plugin base_name plugin_libs plugin_depends)
  list(TRANSFORM plugin_libs PREPEND ${h5pl_BINARY_DIR}/bin/)
  set(_plugin_name "libH5Z${base_name}.so")
  add_custom_target(h5${base_name}_shared ALL 
    COMMAND 
      ${CMAKE_C_COMPILER} -s SIDE_MODULE=1 ${plugin_libs} -o ${_plugin_name}
    DEPENDS ${plugin_depends}
  )
  install(PROGRAMS ${CMAKE_CURRENT_BINARY_DIR}/${_plugin_name} DESTINATION ${PLUGIN_DIR})
endfunction()

build_shared_plugin(bz2 "libh5bz2.a;libbz2.a" "h5bz2;BZ2")
build_shared_plugin(bshuf "libh5bshuf.a" "h5bshuf")
build_shared_plugin(zstd "libh5zstd.a;libzstd.a" "h5zstd;ZSTD")
build_shared_plugin(lz4 "libh5lz4.a" "h5lz4")
build_shared_plugin(lzf "libh5lzf.a" "h5lzf")
# build_shared_plugin(zfp list(libh5zfp.a))


# set(H5ZBSHUF_PLUGIN_NAME "libH5Zbshuf.so")
# add_custom_target(h5bshuf_shared ALL 
#   COMMAND 
#     ${CMAKE_C_COMPILER} -s SIDE_MODULE=1 ${h5pl_BINARY_DIR}/bin/libh5bshuf.a -o ${H5ZBSHUF_PLUGIN_NAME}
#   DEPENDS h5bshuf
# )
# install(PROGRAMS ${CMAKE_CURRENT_BINARY_DIR}/${H5ZBSHUF_PLUGIN_NAME} DESTINATION ${PLUGIN_DIR})

# set(H5ZSTD_PLUGIN_NAME "libH5Zzstd.so")
# add_custom_target(h5zstd_shared ALL 
#   COMMAND 
#     ${CMAKE_C_COMPILER} -s SIDE_MODULE=1 ${h5pl_BINARY_DIR}/bin/libh5zstd.a ${h5pl_BINARY_DIR}/bin/libzstd.a -o ${H5ZSTD_PLUGIN_NAME}
#   DEPENDS h5zstd ZSTD
# )
# install(PROGRAMS ${CMAKE_CURRENT_BINARY_DIR}/${H5ZSTD_PLUGIN_NAME} DESTINATION ${PLUGIN_DIR})

# set(H5ZLZ4_PLUGIN_NAME "libH5Zlz4.so")
# add_custom_target(h5lz4_shared ALL 
#   COMMAND 
#     ${CMAKE_C_COMPILER} -s SIDE_MODULE=1 ${h5pl_BINARY_DIR}/bin/libh5lz4.a -o ${H5ZLZ4_PLUGIN_NAME}
#   DEPENDS h5lz4
# )
# install(PROGRAMS ${CMAKE_CURRENT_BINARY_DIR}/${H5ZLZ4_PLUGIN_NAME} DESTINATION ${PLUGIN_DIR})