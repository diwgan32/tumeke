import json
import os 
dir_path = os.path.dirname(os.path.realpath(__file__))
print(dir_path)
__version__ = "1.0.1"

f = open(f"{dir_path}/config/rula.json")
rula_config = json.load(f)
f.close()

f = open(f"{dir_path}/config/rula.json")
reba_config = json.load(f)
f.close()

f = open(f"{dir_path}/config/rula.json")
niosh_config = json.load(f)
f.close()