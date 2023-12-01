import json
import os 
dir_path = os.path.dirname(os.path.realpath(__file__))

__version__ = "1.0.21"

f = open(f"{dir_path}/config/rula.json")
rula_config = json.load(f)
f.close()

f = open(f"{dir_path}/config/reba.json")
reba_config = json.load(f)
f.close()

f = open(f"{dir_path}/config/niosh.json")
niosh_config = json.load(f)
f.close()

f = open(f"{dir_path}/config/handstrain.json")
handstrain_config = json.load(f)
f.close()

f = open(f"{dir_path}/config/libertymutual.json")
lm_config = json.load(f)
f.close()

f = open(f"{dir_path}/config/skeleton.json")
skeleton_config = json.load(f)
f.close()
