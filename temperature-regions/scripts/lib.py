
def clamp(value, v0=0, v1=1):
    value = min(value, v1)
    value = max(value, v0)
    return value

def getColor(grad, amount, toInt=False):
    gradLen = len(grad)
    i = (gradLen-1) * amount
    remainder = i % 1
    rgb = (0,0,0)
    if amount > 1:
        print amount
    if remainder > 0:
        rgb = lerpColor(grad[int(i)], grad[int(i)+1], remainder)
    else:
        rgb = grad[int(i)]
    if toInt:
        return int(rgb2hex(rgb), 16)
    else:
        return rgb

# Add colors
def hex2rgb(hex):
  # "#FFFFFF" -> [1,1,1]
  # return tuple([int(hex[i:i+2], 16)/255.0 for i in range(1,6,2)])
  return tuple([int(hex[i:i+2], 16) for i in range(1,6,2)])

def lerp(a, b, amount):
    return (b-a) * amount + a

def lerpColor(s, f, amount):
    rgb = [
      (s[j] + amount * (f[j]-s[j]))
      for j in range(3)
    ]
    return tuple(rgb)

def norm(value, a, b):
    n = 1.0 * (value - a) / (b - a)
    n = min(n, 1)
    n = max(n, 0)
    return n

# Mean of list
def mean(data):
    n = len(data)
    if n < 1:
        return 0
    else:
        return 1.0 * sum(data) / n

def rgb2hex(rgb):
    # [255,255,255] -> "0xFFFFFF"
    rgb = [int(x) for x in list(rgb)]
    return "0x"+"".join(["0{0:x}".format(v) if v < 16 else "{0:x}".format(v) for v in rgb]).upper()
