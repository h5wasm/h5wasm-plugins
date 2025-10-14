import hdf5plugin
import json
from pathlib import Path

output = {}
for filt in hdf5plugin.get_filters():
    filter_info = dict(filt())
    output[filt.filter_name] = filter_info


with open(Path(__file__).parent / "default_cd_values.json", "w") as f:
    json.dump(output, f, indent=4)
