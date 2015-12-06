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
			persistence = 0.60;
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
					if (coastRatio == 1)
					{
						factor = 1;
					}
					else if (coastRatio >= 0.5)
					{
						factor = 0.5 + 0.5 * coastRatio;
					}
					else
					{
						factor = 1 - coastRatio * 0.5;
					}
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
	
	function drawCompassRose(gfx, radius)
	{
		var sqrt2 = Math.sqrt(2);
		
		var r1 = radius * 1.00;
		var r2 = radius * 0.24;
		var r4 = radius * 0.90;
		var r5 = radius * 0.80;
		
		var r3 = (-r1 * r2) / (2 * r2 - r1);
		var p4 = (r2*(r1*r2-r1*r1-r2*r1))/(r1*r2-r1*r1-2*r2*r2+r2*r1);
		var q4 = -(r2*r1*(2*r2-r1))/(2*r2*r2-2*r2*r1+r1*r1);
		var p5 = q4;
		var q5 = p4;
		
		color1 = 'rgb(77,62,48)';
		color2 = 'rgb(' + rgbSea[0] + ',' + rgbSea[1] + ',' + rgbSea[2] + ')';

		gfx.lineWidth = 1.0;
		gfx.strokeStyle = color1;

		steps = 16;
		step = 2 * Math.PI / steps;
		for (var n = 0; n < steps; ++n)
		{
			var a1 = (n + 0.5) * step;
			var a2 = (n + 1.5) * step;
			gfx.fillStyle = (n % 2 == 0) ? color1 : color2;
			gfx.beginPath();
			gfx.moveTo(Math.cos(a1) * r4, Math.sin(a1) * r4);
			gfx.arc(0, 0, r4, a1, a2, false);
			gfx.lineTo(Math.cos(a2) * r5, Math.sin(a2) * r5);
			gfx.arc(0, 0, r5, a2, a1, true);
			gfx.lineTo(Math.cos(a1) * r5, Math.sin(a1) * r5);
			gfx.closePath();
			gfx.fill();
		}
		
		gfx.beginPath();
		gfx.arc(0, 0, r4, 0, Math.PI * 2);
		gfx.stroke();
		
		gfx.beginPath();
		gfx.arc(0, 0, r5, 0, Math.PI * 2);
		gfx.stroke();

		gfx.fillStyle = color2;
		gfx.beginPath();
		gfx.moveTo(  0,   0);
		gfx.lineTo(  0, -r1);
		gfx.lineTo(+r2, -r2);
		gfx.lineTo(+r3, -r3);
		gfx.lineTo(+p4, -q4);
		gfx.lineTo(+r2, -r2);
		gfx.lineTo(  0,   0);
		gfx.lineTo(+r1,   0);
		gfx.lineTo(+r2, +r2);
		gfx.lineTo(+r3, +r3);
		gfx.lineTo(+p5, +q5);
		gfx.lineTo(+r2, +r2);
		gfx.lineTo(  0,   0);
		gfx.lineTo(  0, +r1);
		gfx.lineTo(-r2, +r2);
		gfx.lineTo(-r3, +r3);
		gfx.lineTo(-p4, +q4);
		gfx.lineTo(-r2, +r2);
		gfx.lineTo(  0,   0);
		gfx.lineTo(-r1,   0);
		gfx.lineTo(-r2, -r2);
		gfx.lineTo(-r3, -r3);
		gfx.lineTo(-p5, -q5);
		gfx.lineTo(-r2, -r2);
		gfx.lineTo(  0,   0);
		gfx.fill();
		gfx.stroke();

		gfx.fillStyle = color1;
		gfx.beginPath();
		gfx.moveTo(  0,   0);
		gfx.lineTo(  0, -r1);
		gfx.lineTo(-r2, -r2);
		gfx.lineTo(-r3, -r3);
		gfx.lineTo(-p4, -q4);
		gfx.lineTo(-r2, -r2);
		gfx.lineTo(  0,   0);
		gfx.lineTo(+r1,   0);
		gfx.lineTo(+r2, -r2);
		gfx.lineTo(+r3, -r3);
		gfx.lineTo(+p5, -q5);
		gfx.lineTo(+r2, -r2);
		gfx.lineTo(  0,   0);
		gfx.lineTo(  0, +r1);
		gfx.lineTo(+r2, +r2);
		gfx.lineTo(+r3, +r3);
		gfx.lineTo(+p4, +q4);
		gfx.lineTo(+r2, +r2);
		gfx.lineTo(  0,   0);
		gfx.lineTo(-r1,   0);
		gfx.lineTo(-r2, +r2);
		gfx.lineTo(-r3, +r3);
		gfx.lineTo(-p5, +q5);
		gfx.lineTo(-r2, +r2);
		gfx.lineTo(  0,   0);
		gfx.fill();
		gfx.stroke();
	}
	
	var compassPosition = 70;
	gfx.translate(compassPosition, height - compassPosition);
	gfx.rotate(Math.PI * 0.04);
	drawCompassRose(gfx, 50);
	gfx.translate(-compassPosition, compassPosition - height);
}
