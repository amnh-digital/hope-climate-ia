var CONFIG = {
  "colors": {
    "primary": "058599",
    "primaryDark": "216d79",
    "primaryDarker": "1b565f",
    "primaryDarkest": "0f363c",
    "secondary": "c98f20",
    "highlight": "e2bb3d",
    "white": "d9dfe8",
    "gray": "231f20",
    "grayLight": "5b5959",
    "black": "000000",
    "warm": "eb5229",
    "cool": "99cccc"
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
