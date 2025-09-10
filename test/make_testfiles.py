import h5py, hdf5plugin
from pathlib import Path

destdir = Path(__file__).parent / "test_files"
destdir.mkdir(exist_ok=True)

with h5py.File(destdir / "test_gzip.h5", 'w') as root:
    root.create_dataset('data', data=list(range(10)), dtype='<f4', compression='gzip', compression_opts=4)
    root['data'].attrs['filter'] = 'gzip'

with h5py.File(destdir / "test_szip.h5", 'w') as root:
    root.create_dataset('data', data=list(range(10)), dtype='<f4', compression='szip')
    root['data'].attrs['filter'] = 'szip'

for filt in hdf5plugin.get_filters():
    filter_name = filt.filter_name
    if filter_name == 'sz':
        continue

    with h5py.File(destdir / f"test_{filter_name}.h5", 'w') as root:
        # need to use integer dtype with 1 or 2 bytes for fcidecomp
        dtype = '<f4' if filter_name != 'fcidecomp' else '<i2'
        try:
            root.create_dataset('data', data=list(range(10000)), shape=(100,100), dtype=dtype, **filt())
            root['data'].attrs['filter'] = filter_name
        except Exception as e:
            print(f"Error creating dataset for filter {filter_name}: {e}")

with h5py.File("test_filters.h5", "w") as root:
    root.create_dataset('gzip', data=list(range(20000)), dtype='<f4', compression='gzip', compression_opts=4)
    root.create_dataset('szip', data=list(range(20000)), dtype='<f4', compression='szip')
    for filt in hdf5plugin.get_filters():
        if filt.filter_name == 'sz':
            continue
        dtype = '<f4' if filt.filter_name != 'fcidecomp' else '<i2'
        root.create_dataset(filt.filter_name, data=list(range(20000)), shape=(100,200), dtype=dtype, **filt())
        root.flush()
