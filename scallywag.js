function generatePirateMap(canvas, seed)
{
	function logMatrix(data, w, h) {
		var offset = 0;
		var line   = '';

		for (var x = 0; x < w; x++) {
			var xx = (x < 10 ? ' ' : '') + x;
			line += xx + ",";
		}
		console.log("   " + line);

		for (var y = 0; y < h; y++) {
			line = '';
			for (var x = 0; x < w; x++) {
				var d = data[offset].toFixed();
				if (d.length < 2)
					d = ' ' + d;

				line += d + ",";
				offset++;
			}

			var yy = (y < 10 ? ' ' : '') + y;
			console.log(yy + " " + line);
		}
	};
	
	function UnionFind()
	{
		this.parent = [];
		this.rank = [];
	}
	
	UnionFind.prototype.add = function(value)
	{
		parent = this.parent;
		rank = this.rank;
		while (parent.length <= value)
		{
			parent.push(parent.length);
			rank.push(0);
		}
	};
	
	UnionFind.prototype.union = function(a, b)
	{
		parent = this.parent;
		rank = this.rank;
		aroot = this.find(a);
		broot = this.find(b);
		if (aroot != broot)
		{
			if (rank[aroot] < rank[broot])
			{
				parent[aroot] = broot;
			}
			else if (rank[aroot] > rank[broot])
			{
				parent[broot] = aroot;
			}
			else
			{
				parent[broot] = aroot;
				rank[aroot]++;
			}
		}
	};
	
	UnionFind.prototype.find = function(value)
	{
		parent = this.parent;
		if (parent[value] != value)
			parent[value] = this.find(parent[value]);
		return parent[value];
	};
	
	function labelConnectedComponents(input, width, height)
	{
		output = [];
		var nextLabel = 1;
		var equivalences = new UnionFind();
		for (var y = 0; y < height; ++y)
		{
			for (var x = 0; x < width; ++x)
			{
				output.push(0);
				var index = x + y * width;
				if (input[index])
				{
					var label = 0;
					var west = 0;
					var north = 0;
					if (y > 0 && input[index - width])
					{
						north = output[index - width];
					}
					if (x > 0 && input[index - 1])
					{
						west = output[index - 1];
					}
					if (west)
					{
						if (north)
						{
							if (west == north)
							{
								label = west;
							}
							else
							{
								min = Math.min(west, north);
								max = Math.max(west, north);
								label = min;
								equivalences.union(min, max);
							}
						}
						else
						{
							label = west;
						}
					}
					else
					{
						if (north)
						{
							label = north;
						}
						else
						{
							label = nextLabel++;
							equivalences.add(label);
						}
					}
					output[index] = label;
				}
			}
		}

		for (var y = 0; y < height; ++y)
		{
			for (var x = 0; x < width; ++x)
			{
				var index = x + y *  width;
				var label = output[index];
				if (label)
				{
					output[index] = equivalences.find(label);
				}
			}
		}
		
		return output;
	}
	
    var canvasWidth = canvas.width;
    var canvasHeight = canvas.height;
    var margin = 5;
    
    var borderSegmentSize = 20;
    var borderSegmentsX = Math.floor((canvasWidth - margin * 2) / borderSegmentSize);
    var borderSegmentsY = Math.floor((canvasHeight - margin * 2) / borderSegmentSize);
    borderSegmentsX -= (1 - borderSegmentsX % 2);
    borderSegmentsY -= (1 - borderSegmentsY % 2);
    
    var width = margin * 2 + borderSegmentsX * borderSegmentSize;
    var height = margin * 2 + borderSegmentsY * borderSegmentSize;
    var maxSize = Math.max(width, height);
    var minSize = Math.min(width, height);

    random = new SeedableRandom();
    random.seed(seed);
    
    noise.seed(random.nextInt(0, 0xFFFF));
    seaLevel   = 0.018;
    
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
            edge = minSize * 0.7;
            centerX = width * 0.5;
            centerY = height * 0.5;
            dist = distance(x, y, centerX, centerY);
            scale = 5.0;
            sx = scale * x / maxSize;
            sy = scale * y / maxSize;
            var octaves = 4;
            var value = 0;
            persistence = 0.55;
            for (var n = 0; n < octaves; ++n)
            {
                var frequency = Math.pow(2, n);
                var amplitude = Math.pow(persistence, n);
                value += noise.perlin2(sx * frequency, sy * frequency) * amplitude;
            }
            factor = Math.pow(1 - dist / edge, 4.0);
            mapHeight = value * factor;
            heightMap.push(mapHeight);
        }
    }
    
    // Run CCL to find the islands
    var landMask = [];
    for (var y = 0; y < height; ++y)
    {
        for (var x = 0; x < width; ++x)
        {
            landMask.push(isLand(heightMap[x + y * width]) ? 1 : 0);
        }
    }
    islandMap = labelConnectedComponents(landMask, width, height);
	
	// Compute the area of each island
	var islandAreas = {};
    for (var y = 0; y < height; ++y)
    {
        for (var x = 0; x < width; ++x)
        {
			var island = islandMap[x + y * width];
			if (island)
			{
				if (island in islandAreas)
				{
					islandAreas[island]++;
				}
				else
				{
					islandAreas[island] = 1;
				}
			}
		}
	}
	
	// Find the largest island
	var largestIsland = 0;
	var largestIslandArea = 0;
	for (island in islandAreas)
	{
		area = islandAreas[island];
		if (area > largestIslandArea)
		{
			largestIsland = island;
			largestIslandArea = area;
		}
	}
	
	// Find the bounds of the largest island
	var largestIslandBounds = {x1: width, y1: height, x2: 0, y2: 0};
    for (var y = 0; y < height; ++y)
    {
        for (var x = 0; x < width; ++x)
        {
            if (islandMap[x + y * width] == largestIsland)
			{
				largestIslandBounds.x1 = Math.min(largestIslandBounds.x1, x);
				largestIslandBounds.y1 = Math.min(largestIslandBounds.y1, y);
				largestIslandBounds.x2 = Math.max(largestIslandBounds.x2, x);
				largestIslandBounds.y2 = Math.max(largestIslandBounds.y2, y);
			}
		}
	}
	console.log(largestIslandBounds);
	
    
	// Determine coast range distances
    var coastMap = [];
    var coastRange = 2;
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
            
            if (isLand(mapHeight) && islandMap[index] == largestIsland)
            {
				rgb = [0xFF, 0xA0, 0xFF];
                data[index * 4 + 0] = rgb[0];
                data[index * 4 + 1] = rgb[1];
                data[index * 4 + 2] = rgb[2];
            }
        }
    }
    
    gfx.putImageData(image, 0, 0);
	
	gfx.beginPath();
	gfx.strokeStyle = 'magenta';
	gfx.rect(largestIslandBounds.x1, largestIslandBounds.y1, largestIslandBounds.x2 - largestIslandBounds.x1 + 1, largestIslandBounds.y2 - largestIslandBounds.y1 + 1);
	gfx.stroke();
    
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
    
    var compassPosition = margin + minSize * 0.12;
    gfx.translate(compassPosition, height - compassPosition);
    gfx.rotate(Math.PI * 0.04);
    drawCompassRose(gfx, minSize * 0.1);
    gfx.translate(-compassPosition, compassPosition - height);
}
