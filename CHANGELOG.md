# Changelog
## v0.1.0 2025-04-14
### Added
 - JPEG filter
### Changed
 - Requires `h5wasm>=0.8.1`
 - SZ filter disabled
## v0.0.3 2023-11-09
### Added
 - now building and including `blosc2` filter
### Changed
 - uses h5wasm >= 0.6.10 (for new symbols used by `blosc2`
## v0.0.2 2023-11-07
### Fixed
 - added `-sWASM_BIGINT` flag to compilation/linking of final plugin, fixes issue #3
### Added
 - LICENSE file
 - README.md file
 - now building and including `bshuf` filter
## v0.0.1 2023-10-24
### Added (initial commit)
 - CMakeLists.txt that fetches
   - source of https://github.com/HDFGroup/hdf5_plugins
   - pre-built libhdf5-wasm
 - (source for compression libraries are embedded .tgz files in hdf5_plugins repo)
 - artifacts are published to https://www.npmjs.com/package/h5wasm-plugins
