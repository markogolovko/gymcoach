from pathlib import Path
import struct
import zlib

OUT = Path('public/apple-touch-icon.png')
scale = 3
size = 180
large = size * scale
acid = (215, 250, 112, 255)
ink = (22, 26, 16, 255)
pixels = bytearray(large * large * 4)
radius = 112

def inside_polygon(x, y, points):
    inside = False
    previous = points[-1]
    for current in points:
        x1, y1 = previous
        x2, y2 = current
        if (y1 > y) != (y2 > y) and x < (x2 - x1) * (y - y1) / (y2 - y1) + x1:
            inside = not inside
        previous = current
    return inside

outer = [(46, 32), (93, 32), (114, 37), (127, 49), (133, 67), (131, 83), (122, 95), (106, 103), (139, 148), (100, 148), (76, 110), (79, 110), (79, 148), (46, 148)]
counter = [(79, 60), (90, 60), (98, 63), (102, 70), (98, 77), (90, 79), (79, 79)]

for y in range(large):
    for x in range(large):
        dx = min(x, large - 1 - x)
        dy = min(y, large - 1 - y)
        inside = True
        if dx < radius and dy < radius:
            cx = radius if x < radius else large - 1 - radius
            cy = radius if y < radius else large - 1 - radius
            inside = (x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2
        if not inside:
            continue
        px, py = x / scale, y / scale
        is_mark = inside_polygon(px, py, outer) and not inside_polygon(px, py, counter)
        color = ink if is_mark else acid
        offset = (y * large + x) * 4
        pixels[offset:offset + 4] = bytes(color)

small = bytearray(size * size * 4)
for y in range(size):
    for x in range(size):
        samples = [pixels[((y * scale + oy) * large + x * scale + ox) * 4:((y * scale + oy) * large + x * scale + ox) * 4 + 4]
                   for oy in range(scale) for ox in range(scale)]
        offset = (y * size + x) * 4
        small[offset:offset + 4] = bytes(sum(sample[channel] for sample in samples) // 9 for channel in range(4))

def chunk(name, payload):
    data = name + payload
    return struct.pack('!I', len(payload)) + data + struct.pack('!I', zlib.crc32(data) & 0xffffffff)

raw = b''.join(b'\0' + small[y * size * 4:(y + 1) * size * 4] for y in range(size))
png = b'\x89PNG\r\n\x1a\n'
png += chunk(b'IHDR', struct.pack('!2I5B', size, size, 8, 6, 0, 0, 0))
png += chunk(b'IDAT', zlib.compress(raw, 9))
png += chunk(b'IEND', b'')
OUT.write_bytes(png)
print(f'Wrote {OUT} ({len(png)} bytes)')
