function generatePirateMap(canvas, seed)
{
    var width = canvas.width;
    var height = canvas.height;

    noise.seed(seed);
    seaLevel = 0.03;
    
    function distance(x1, y1, x2, y2)
    {
        var dx = x1 - x2;
        var dy = y1 - y2;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    function getHeight(x, y)
    {
        size = Math.max(width, height);
        edge = Math.min(width, height) * 0.7;
        centerX = width * 0.5;
        centerY = height * 0.5;
        dist = distance(x, y, centerX, centerY);
        scale = 6.0;
        sx = scale * x / size;
        sy = scale * y / size;
        var octaves = 3;
        var value = 0;
        persistence = 0.5;
        for (var n = 0; n < octaves; ++n)
        {
            var frequency = Math.pow(2, n);
            var amplitude = Math.pow(persistence, n);
            value += noise.perlin2(sx * frequency, sy * frequency) * amplitude;
        }
        factor = Math.pow(1 - dist / edge, 3.0);
        value *= factor;
        return value;
    }
    
    function isLand(height)
    {
        return height > seaLevel;
    }
    
    var gfx = canvas.getContext('2d');
    
    var rgbLand = [ 215, 180, 140 ];
    var rgbSea =  [ 200, 200, 160 ];
    
    var image = gfx.createImageData(width, height);
    var data = image.data;
    var heightMap = [];
    for (var y = 0; y < height; ++y)
    {
        for (var x = 0; x < width; ++x)
        {
            mapHeight = getHeight(x, y);
            heightMap.push(mapHeight);
        }
    }
    var coastMap = [];
    var range = 10;
    for (var y = 0; y < height; ++y)
    {
        for (var x = 0; x < width; ++x)
        {
            land = isLand(mapHeight[x + y * width]);
            var nx1 = Math.max(0, x - range);
            var ny1 = Math.max(0, y - range);
            var ny2 = Math.min(width - 1, x + range);
            var nx2 = Math.min(height - 1, y + range);
            for (var ny = ny1; ny <= ny2; ++ny)
            {
                for (var nx = nx1; nx <= nx2; ++nx)
                {
                    var nland = isLand(mapHeight[nx + ny * width]);
                    if (nland != land)
                    {
                    }
                }
            }
        }
    }
    for (var y = 0; y < height; ++y)
    {
        for (var x = 0; x < width; ++x)
        {
            mapHeight = heightMap[x + y * width];
            land = isLand(mapHeight);
            var index = (x + y * width) * 4;
            rgb = land ? rgbLand : rgbSea;
            data[index + 0] = rgb[0];
            data[index + 1] = rgb[1];
            data[index + 2] = rgb[2];
            data[index + 3] = 0xFF;
        }
    }
    
    gfx.putImageData(image, 0, 0);
}
