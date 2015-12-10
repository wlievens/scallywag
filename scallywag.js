function generatePirateMap(canvas, seed)
{
	var DEBUG = false;

    var seaLevel          = -0.30;
	var mountainLevel     = +0.22;
    var margin            = 12;
    var borderSegmentSize = 30;
    var coastRange        = 12;
    var mountainRange     = 6;
	
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
    
    canvas.onclick = function(e)
    {
	    var mouseX, mouseY;

        if(e.offsetX) {
            mouseX = e.offsetX;
            mouseY = e.offsetY;
        }
        else if(e.layerX) {
            mouseX = e.layerX;
            mouseY = e.layerY;
        }
        alert(mouseX + ", " + mouseY);
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
        return height >= seaLevel;
    }
    
    function isMountain(height)
    {
        return height >= mountainLevel;
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
            scale = 4.0;
            sx = scale * x / maxSize;
            sy = scale * y / maxSize;
            var octaves = 5;
            var value = 0;
            persistence = 0.65;
            for (var n = 0; n < octaves; ++n)
            {
                var frequency = Math.pow(2, n);
                var amplitude = Math.pow(persistence, n);
                value += noise.perlin2(sx * frequency, sy * frequency) * amplitude;
            }
            fall = 1.8 * Math.pow(dist / edge, 1.5);
            mapHeight = value - fall;
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
	largestIslandBounds.width = largestIslandBounds.x2 - largestIslandBounds.x1 + 1;
	largestIslandBounds.height = largestIslandBounds.y2 - largestIslandBounds.y1 + 1;
	
	function buildRangeMap(heightMap, discriminator, maxRange)
	{
		var map = [];
		for (var y = 0; y < height; ++y)
		{
			for (var x = 0; x < width; ++x)
			{
				var index = x + y * width;
				value = discriminator(heightMap[index]);
				var nx1 = Math.max(0, x - maxRange);
				var ny1 = Math.max(0, y - maxRange);
				var nx2 = Math.min(width - 1, x + maxRange);
				var ny2 = Math.min(height - 1, y + maxRange);
				var minDist = maxRange;
				for (var ny = ny1; ny <= ny2; ++ny)
				{
					for (var nx = nx1; nx <= nx2; ++nx)
					{
						nindex = nx + ny * width;
						var nvalue = discriminator(heightMap[nindex]);
						if (nvalue != value)
						{
							dist = distance(nx, ny, x, y);
							if (dist < minDist)
							{
								minDist = dist;
							}
						}
					}
				}
				map[index] = minDist;
			}
		}
		return map;
	}
    
	// Determine coast distances
    var coastMap = buildRangeMap(heightMap, isLand, coastRange);
    
	// Determine mountain distances
    var mountainMap = buildRangeMap(heightMap, isMountain, mountainRange);
	
	// Determine the goal
	function pickIslandPoint(island, others, minDistance)
	{
		var attempts = 0;
		while (true)
		{
			var x = largestIslandBounds.x1 + random.nextInt(0, largestIslandBounds.width);
			var y = largestIslandBounds.y1 + random.nextInt(0, largestIslandBounds.height);
			var index = x + y * width;
			if (islandMap[index] == island && coastMap[index] == coastRange)
			{
				var valid = true;
				if (others)
				{
					for (var n = 0; n < others.length; ++n)
					{
						var dist = distance(others[n].x, others[n].y, x, y);
						if (dist < minDistance)
						{
							valid = false;
							break;
						}
					}
				}
				if (valid)
				{
					return {x: x, y: y};
				}
			}
			++attempts;
			if (attempts > 1000)
			{
				return null;
			}
		}
	}
	
	// Pick the treasure goal
	var goal = pickIslandPoint(largestIsland);
	
	var points = [];
	var path = [];
	if (goal)
	{
		// Pick the points that will make up the path
		points.push(goal);
		for (var n = 0; n < 50; ++n)
		{
			var point = pickIslandPoint(largestIsland, points, 30.0);
			if (point)
			{
				points.push(point);
			}
		}
		
		// Sort them sensibly
		var current = goal;
		while (points.length)
		{
			// Pick the nearest
			var nearest = null;
			var nearestIndex = 0;
			var nearestDist = 0;
			for (var n = 0; n < points.length; ++n)
			{
				var point = points[n];
				var dist = distance(point.x, point.y, current.x, current.y);
				if (nearest == null || dist < nearestDist)
				{
					nearest = point;
					nearestIndex = n;
					nearestDist = dist;
				}
			}
			if (nearest)
			{
				if (nearestDist < 80)
				{
					// Test if the path is mostly land of the same island
					var valid = true;
					if (nearest != goal)
					{
						var steps = Math.ceil(nearestDist);
						var good = 0;
						var bad = 0;
						for (var n = 0; n <= steps; ++n)
						{
							var r = n / steps;
							var x = Math.round(current.x + (nearest.x - current.x) * r);
							var y = Math.round(current.y + (nearest.y - current.y) * r);
							var index = x + y * width;
							if (islandMap[index] == largestIsland && !isMountain(heightMap[index]))
							{
								++good;
							}
							else
							{
								++bad;
							}
						}
						valid = (good / (good + bad)) > 0.80;
					}
					if (valid)
					{
						path.push(nearest);
						current = nearest;
					}
				}
				points.splice(nearestIndex, 1);
			}
		}
	}
	
    
    var rgbLand        = [ 200, 190, 120 ];
    var rgbMountain    = [ 170, 160, 125 ];
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
                mountainRatio = mountainMap[index] / mountainRange;
				ratio = Math.min(coastRatio, mountainRatio);
                land = isLand(mapHeight);
				mountain = isMountain(mapHeight);
                rgb = mountain ? rgbMountain : land ? rgbLand : rgbSea;
                if (land)
                {
                    factor = 0.75 + 0.2 * Math.pow(ratio, 2.0);
                }
                else
                {
                    if (ratio == 1)
                    {
                        factor = 1;
                    }
                    else if (ratio >= 0.5)
                    {
                        factor = 0.5 + 0.5 * ratio;
                    }
                    else
                    {
                        factor = 1 - ratio * 0.5;
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
            data[index * 4 + 0] = rgb[0] * factor;
            data[index * 4 + 1] = rgb[1] * factor;
            data[index * 4 + 2] = rgb[2] * factor;
            data[index * 4 + 3] = 0xFF;
            
            if (DEBUG && isLand(mapHeight) && islandMap[index] == largestIsland)
            {
				rgb = [0xFF, 0xA0, 0xFF];
                data[index * 4 + 0] = rgb[0];
                data[index * 4 + 1] = rgb[1];
                data[index * 4 + 2] = rgb[2];
            }
        }
    }
    
    gfx.putImageData(image, 0, 0);
	
	// Draw the path
	gfx.setLineDash([3, 5]);
	gfx.strokeStyle = 'rgba(30, 30, 30, 0.75)';
	gfx.lineWidth = 2.0;
	for (var n = 0; n < path.length - 1; ++n)
	{
		var x1 = path[n].x;
		var y1 = path[n].y;
		var x2 = path[n + 1].x;
		var y2 = path[n + 1].y;
		var length = distance(x1, y1, x2, y2);
		var factor1 = 0.1;
		var factor2 = 0.2;
		var angle = Math.atan2(y2 - y1, x2 - x1) + Math.PI / 2;
		if (random.next() > 0.5)
		{
			angle += Math.PI;
		}
		var radius = length * (factor1 + factor2 * random.next());
		var mx = (x1 + x2) * 0.5 + Math.cos(angle) * radius;
		var my = (y1 + y2) * 0.5 + Math.sin(angle) * radius;
		gfx.beginPath();
		gfx.moveTo(x1, y1);
		gfx.quadraticCurveTo(mx, my, x2, y2);
		gfx.stroke();
		
		if (DEBUG)
		{
			gfx.beginPath();
			gfx.rect(x1 - 1, y1 - 1, 3, 3);
			gfx.fillStyle = 'red';
			gfx.fill();
			
			gfx.beginPath();
			gfx.rect(mx - 1, my - 1, 3, 3);
			gfx.fillStyle = 'cyan';
			gfx.fill();
		}
	}
	
	// Draw the goal
	for (var n = 4; n >= 1; n--)
	{
		gfx.beginPath();
		gfx.setLineDash([]);
		gfx.strokeStyle = 'rgba(220, 30, 40, ' + (0.5 - 0.1 * n) + ')';
		gfx.lineWidth = n*1.7;
		var radius = 9.0;
		var spread = 0*1.8;
		var x1 = goal.x - radius + (random.next() * 2 - 1) * spread;
		var y1 = goal.y - radius + (random.next() * 2 - 1) * spread;
		var x2 = goal.x + radius + (random.next() * 2 - 1) * spread;
		var y2 = goal.y + radius + (random.next() * 2 - 1) * spread;
		var x3 = goal.x - radius + (random.next() * 2 - 1) * spread;
		var y3 = goal.y + radius + (random.next() * 2 - 1) * spread;
		var x4 = goal.x + radius + (random.next() * 2 - 1) * spread;
		var y4 = goal.y - radius + (random.next() * 2 - 1) * spread;
		gfx.moveTo(x1, y1);
		gfx.lineTo(x2, y2);
		gfx.moveTo(x3, y3);
		gfx.lineTo(x4, y4);
		gfx.stroke();
	}
	
	// Draw the largest island outline
	if (DEBUG)
	{
		gfx.beginPath();
		gfx.setLineDash([]);
		gfx.strokeStyle = 'magenta';
		gfx.lineWidth = 1;
		gfx.rect(largestIslandBounds.x1, largestIslandBounds.y1, largestIslandBounds.x2 - largestIslandBounds.x1 + 1, largestIslandBounds.y2 - largestIslandBounds.y1 + 1);
		gfx.stroke();
	}
    
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
        
        color1 = 'rgb(80,65,60)';
        color2 = 'rgb(' + rgbSea[0] + ',' + rgbSea[1] + ',' + rgbSea[2] + ')';

		gfx.setLineDash([]);
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
		
		gfx.font = '22px Georgia';
		gfx.fillText('N', -gfx.measureText('N').width / 2, -r1 - 2);

		gfx.font = '14px Georgia';
		gfx.fillText('S', -gfx.measureText('S').width / 2, +r1 + 12);
		gfx.fillText('W', -r1 - gfx.measureText('W').width, +6);
		gfx.fillText('E', +r1 + 1, +6);
    }
    
    var compassPosition = margin + 80;
	gfx.save();
    gfx.translate(compassPosition, height - compassPosition);
    gfx.rotate(Math.PI * 0.04*0);
    drawCompassRose(gfx, 60);
	gfx.restore();
	
    noise.seed(random.nextInt(0, 0xFFFF));
	var bitmap = gfx.getImageData(0, 0, width, height);
	var data = bitmap.data;
    for (var y = 0; y < height; ++y)
    {
        for (var x = 0; x < width; ++x)
        {
			var noiseAmplitude = 0.05;
			var noiseScale = 0.02;
			var grainAmplitude = 0.02;
			var factor = 1.0 + noiseAmplitude * noise.perlin2(x * noiseScale, y * noiseScale) + random.next() * grainAmplitude * 2 - grainAmplitude;
			data[(x + y * width) * 4 + 0] *= factor;
			data[(x + y * width) * 4 + 1] *= factor;
			data[(x + y * width) * 4 + 2] *= factor;
		}
	}
	gfx.putImageData(bitmap, 0, 0);
}
