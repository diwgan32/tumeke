import json

__version__ = "1.0.1"

f = open("config/rula.json")
rula_config = json.load(f)
f.close()

f = open("config/reba.json")
reba_config = json.load(f)
f.close()

f = open("config/niosh.json")
niosh_config = json.load(f)
f.close()