export function getSchemaFromComponentValues(ComponentValues) {
    let schema = {};
    getSchemaHelper(ComponentValues, undefined, schema);
    return schema;
}

function getSchemaHelper(values, key, schema) {
  for (let k of Object.keys(values)) {
    if (typeof values[k] === "string" || !values[k]) {
      continue;
    }
    if ("Base" in values[k]) {
      schema[k] = values[k]["Base"];
    } else {
      schema[k] = {};
      schema[k]["Warnings"] = {};
      getSchemaHelper(values[k], k, schema[k]);
    }
  }
}