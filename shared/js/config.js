var CONFIG = {
  "colors": {
    "primary": "058599",
    "primaryDark": "29494e",
    "primaryDarker": "0a2126",
    "primaryDarkest": "061416",
    "secondary": "c98f20",
    "highlight": "e2bb3d",
    "white": "aaaaaa",
    "gray": "231f20",
    "black": "000000"
  }
};

function updateColorsRecursive(obj, colors) {
  for (var k in obj) {
    if (typeof obj[k] == "object" && obj[k] !== null) {
      updateColorsRecursive(obj[k], colors);
    } else {
      var value = obj[k];
      if (typeof value === "string" && value.startsWith("$")) {
        var offset = 2;
        var prepend = "#";
        if (value.startsWith("$0x")) {
          offset = 3;
          prepend = "0x";
        }
        var key = value.substring(offset);
        var color = colors[key];
        if (color !== undefined) {
          obj[k] = prepend + color;
        }
      }
    }
  }
}

function updateColorsFromConfig(params, colors){
  colors = colors || CONFIG.colors;
  updateColorsRecursive(params, colors);
}
