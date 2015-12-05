function generatePirateMap(canvas, seed)
{
    var canvasWidth = canvas.width;
    var canvasHeight = canvas.height;
	var margin = 8;
	
	var borderSegmentSize = 50;
	var borderSegmentsX = Math.floor((canvasWidth - margin * 2) / borderSegmentSize);
	var borderSegmentsY = Math.floor((canvasHeight - margin * 2) / borderSegmentSize);
	borderSegmentsX -= (1 - borderSegmentsX % 2);
	borderSegmentsY -= (1 - borderSegmentsY % 2);
	
	var width = margin * 2 + borderSegmentsX * borderSegmentSize;
	var height = margin * 2 + borderSegmentsY * borderSegmentSize;

	random = new SeedableRandom();
	random.seed(seed);
	
    noise.seed(random.nextInt(0, 0xFFFF));
    seaLevel   = 0.028;
	
	canvas.onclick = function(e)
	{
		alert(e.pageX + ", " + e.pageY);
	};
    
    function distance(x1, y1, x2, y2)
    {
        var dx = x1 - x2;
        var dy = y1 - y2;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    function distance4(x1, y1, x2, y2)
    {
        var dx = Math.abs(x1 - x2);
        var dy = Math.abs(y1 - y2);
        return dx + dy;
    }
    
    function distance8(x1, y1, x2, y2)
    {
        var dx = Math.abs(x1 - x2);
        var dy = Math.abs(y1 - y2);
        return Math.max(dx, dy);
    }
    
    function isLand(height)
    {
        return height > seaLevel;
    }
    
    var gfx = canvas.getContext('2d');
	gfx.lineWidth = 0;
	gfx.fillStyle = 'white';
	gfx.beginPath();
	gfx.rect(0, 0, canvasWidth, canvasHeight);
	gfx.fill();
	gfx.closePath();
    
    var image = gfx.createImageData(width, height);
    var data = image.data;
    var heightMap = [];
    for (var y = 0; y < height; ++y)
    {
        for (var x = 0; x < width; ++x)
        {
			size = Math.max(width, height);
			edge = Math.min(width, height) * 0.7;
			centerX = width * 0.5;
			centerY = height * 0.5;
			dist = distance(x, y, centerX, centerY);
			scale = 6.0;
			sx = scale * x / size;
			sy = scale * y / size;
			var octaves = 4;
			var value = 0;
			persistence = 0.5;
			for (var n = 0; n < octaves; ++n)
			{
				var frequency = Math.pow(2, n);
				var amplitude = Math.pow(persistence, n);
				value += noise.perlin2(sx * frequency, sy * frequency) * amplitude;
			}
			factor = Math.pow(1 - dist / edge, 3.0);
			mapHeight = value * factor;
            heightMap.push(mapHeight);
        }
    }
    var coastMap = [];
    var coastRange = 10;
    for (var y = 0; y < height; ++y)
    {
        for (var x = 0; x < width; ++x)
        {
			var index = x + y * width;
            land = isLand(heightMap[index]);
            var nx1 = Math.max(0, x - coastRange);
            var ny1 = Math.max(0, y - coastRange);
            var nx2 = Math.min(width - 1, x + coastRange);
            var ny2 = Math.min(height - 1, y + coastRange);
			var minDist = coastRange;
            for (var ny = ny1; ny <= ny2; ++ny)
            {
                for (var nx = nx1; nx <= nx2; ++nx)
                {
					nindex = nx + ny * width;
                    var nland = isLand(heightMap[nindex]);
                    if (nland != land)
                    {
						dist = distance(nx, ny, x, y);
						if (dist < minDist)
						{
							minDist = dist;
						}
                    }
                }
            }
			coastMap[index] = minDist;
        }
    }
	
    var rgbLand        = [ 200, 190, 120 ];
    var rgbSea         = [ 190, 200, 180 ];
    var rgbBorder      = [  60,  60,  60 ];
    var rgbBorderFill1 = [ 240, 240, 240 ];
    var rgbBorderFill2 = [ 160,   0,  40 ];

    for (var y = 0; y < height; ++y)
    {
        for (var x = 0; x < width; ++x)
        {
			var index = x + y * width;
			factor = 1;
			if (x > margin && y > margin && x < width - margin - 1 && y < height - margin - 1)
			{
				mapHeight = heightMap[index];
				coastRatio = coastMap[index] / coastRange;
				land = isLand(mapHeight);
				rgb = land ? rgbLand : rgbSea;
				if (land)
				{
					factor = 0.75 + 0.2 * Math.pow(coastRatio, 2.0);
				}
				else
				{
					factor = 1.00 + (coastRatio > 0.5 ? (coastRatio - 1) * 0.3 : 0) - (coastRatio <= 0.5 ? (0.5 - coastRatio) : 0);
				}
			}
			else
			{
				rgb = rgbBorderFill1;
				if (x == 0 || y == 0 || x == width - 1 || y == height - 1 ||
				   ((x == margin || x == width - margin - 1) &&  y >= margin && y <= height - margin - 1) ||
				   ((x >= margin && x <= width - margin - 1) && (y == margin || y == height - margin - 1)))
				{
					rgb = rgbBorder;
				}
				else if (y < margin || y >= height - margin)
				{
					segment = Math.floor((x - margin) / borderSegmentSize);
					if (segment % 2 == 0)
					{
						rgb = rgbBorderFill2;
					}
				}
				else if (x < margin || x >= height - margin)
				{
					segment = Math.floor((y - margin) / borderSegmentSize);
					if (segment % 2 == 0)
					{
						rgb = rgbBorderFill2;
					}
				}
			}
			var grain = 0.95 + 0.05 * random.next();
			factor *= grain;
            data[index * 4 + 0] = rgb[0] * factor;
            data[index * 4 + 1] = rgb[1] * factor;
            data[index * 4 + 2] = rgb[2] * factor;
            data[index * 4 + 3] = 0xFF;
        }
    }
    gfx.putImageData(image, 0, 0);
}
