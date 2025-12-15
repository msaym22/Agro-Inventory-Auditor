const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

/**
 * Extract features from an image for AI matching
 * Analyzes shape, edges, color distribution, and texture
 */
async function extractImageFeatures(imagePath) {
  try {
    const image = sharp(imagePath);
    const metadata = await image.metadata();
    
    // Resize to standard size for feature extraction
    const resized = await image
      .resize(224, 224, { fit: 'cover' })
      .raw()
      .toBuffer({ resolveWithObject: true });

    const { data, info } = resized;
    const { width, height, channels } = info;

    // Extract color histogram
    const colorHistogram = extractColorHistogram(data, width, height, channels);
    
    // Extract edge features using Sobel-like edge detection
    const edgeFeatures = extractEdgeFeatures(data, width, height, channels);
    
    // Extract texture features
    const textureFeatures = extractTextureFeatures(data, width, height, channels);
    
    // Extract shape features (contours, holes detection)
    const shapeFeatures = await extractShapeFeatures(imagePath, width, height);

    return {
      colorHistogram,
      edgeFeatures,
      textureFeatures,
      shapeFeatures,
      dimensions: {
        width: metadata.width,
        height: metadata.height
      },
      metadata: {
        format: metadata.format,
        size: metadata.size
      }
    };
  } catch (error) {
    console.error('Error extracting image features:', error);
    throw error;
  }
}

/**
 * Extract color histogram (RGB distribution)
 */
function extractColorHistogram(data, width, height, channels) {
  const bins = 16; // 16 bins per channel
  const histogram = {
    r: new Array(bins).fill(0),
    g: new Array(bins).fill(0),
    b: new Array(bins).fill(0)
  };

  for (let i = 0; i < data.length; i += channels) {
    const r = Math.floor((data[i] / 255) * bins);
    const g = Math.floor((data[i + 1] / 255) * bins);
    const b = Math.floor((data[i + 2] / 255) * bins);
    
    histogram.r[Math.min(r, bins - 1)]++;
    histogram.g[Math.min(g, bins - 1)]++;
    histogram.b[Math.min(b, bins - 1)]++;
  }

  // Normalize
  const total = width * height;
  histogram.r = histogram.r.map(v => v / total);
  histogram.g = histogram.g.map(v => v / total);
  histogram.b = histogram.b.map(v => v / total);

  return histogram;
}

/**
 * Extract edge features using gradient magnitude
 */
function extractEdgeFeatures(data, width, height, channels) {
  const grayscale = new Uint8Array(width * height);
  
  // Convert to grayscale
  for (let i = 0; i < data.length; i += channels) {
    const gray = Math.round(
      0.299 * data[i] + 
      0.587 * data[i + 1] + 
      0.114 * data[i + 2]
    );
    grayscale[Math.floor(i / channels)] = gray;
  }

  // Calculate gradients
  const gradients = [];
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const gx = grayscale[idx + 1] - grayscale[idx - 1];
      const gy = grayscale[(y + 1) * width + x] - grayscale[(y - 1) * width + x];
      const magnitude = Math.sqrt(gx * gx + gy * gy);
      gradients.push(magnitude);
    }
  }

  // Calculate statistics
  const sum = gradients.reduce((a, b) => a + b, 0);
  const mean = sum / gradients.length;
  const variance = gradients.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / gradients.length;
  const max = Math.max(...gradients);
  const min = Math.min(...gradients);

  return {
    mean,
    variance,
    max,
    min,
    edgeDensity: gradients.filter(g => g > mean).length / gradients.length
  };
}

/**
 * Extract texture features using Local Binary Pattern (simplified)
 */
function extractTextureFeatures(data, width, height, channels) {
  const grayscale = new Uint8Array(width * height);
  
  // Convert to grayscale
  for (let i = 0; i < data.length; i += channels) {
    const gray = Math.round(
      0.299 * data[i] + 
      0.587 * data[i + 1] + 
      0.114 * data[i + 2]
    );
    grayscale[Math.floor(i / channels)] = gray;
  }

  // Calculate local variance (texture measure)
  const variances = [];
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const neighbors = [
        grayscale[(y - 1) * width + (x - 1)],
        grayscale[(y - 1) * width + x],
        grayscale[(y - 1) * width + (x + 1)],
        grayscale[y * width + (x - 1)],
        grayscale[y * width + x],
        grayscale[y * width + (x + 1)],
        grayscale[(y + 1) * width + (x - 1)],
        grayscale[(y + 1) * width + x],
        grayscale[(y + 1) * width + (x + 1)]
      ];
      const mean = neighbors.reduce((a, b) => a + b, 0) / neighbors.length;
      const variance = neighbors.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / neighbors.length;
      variances.push(variance);
    }
  }

  return {
    meanVariance: variances.reduce((a, b) => a + b, 0) / variances.length,
    maxVariance: Math.max(...variances),
    minVariance: Math.min(...variances)
  };
}

/**
 * Extract shape features including holes and contours
 */
async function extractShapeFeatures(imagePath, width, height) {
  try {
    // Convert to grayscale and threshold for shape detection
    const image = sharp(imagePath);
    const { data, info } = await image
      .resize(224, 224, { fit: 'cover' })
      .greyscale()
      .normalize()
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Threshold to binary
    const threshold = 128;
    const binary = new Uint8Array(data.length);
    for (let i = 0; i < data.length; i++) {
      binary[i] = data[i] > threshold ? 255 : 0;
    }

    // Detect holes (dark regions in light background)
    const holes = detectHoles(binary, info.width, info.height);
    
    // Calculate shape metrics
    const shapeMetrics = calculateShapeMetrics(binary, info.width, info.height);

    return {
      holes: {
        count: holes.length,
        areas: holes.map(h => h.area),
        positions: holes.map(h => h.position)
      },
      shapeMetrics,
      aspectRatio: info.width / info.height,
      area: binary.filter(p => p === 0).length / (info.width * info.height)
    };
  } catch (error) {
    console.error('Error extracting shape features:', error);
    return {
      holes: { count: 0, areas: [], positions: [] },
      shapeMetrics: {},
      aspectRatio: 1,
      area: 0
    };
  }
}

/**
 * Detect holes in binary image
 */
function detectHoles(binary, width, height) {
  const visited = new Set();
  const holes = [];

  function floodFill(startX, startY) {
    const stack = [[startX, startY]];
    const region = [];
    
    while (stack.length > 0) {
      const [x, y] = stack.pop();
      const key = `${x},${y}`;
      
      if (x < 0 || x >= width || y < 0 || y >= height || visited.has(key)) {
        continue;
      }
      
      const idx = y * width + x;
      if (binary[idx] === 0) { // Dark pixel (hole)
        visited.add(key);
        region.push({ x, y });
        
        // Add neighbors
        stack.push([x + 1, y]);
        stack.push([x - 1, y]);
        stack.push([x, y + 1]);
        stack.push([x, y - 1]);
      }
    }
    
    return region;
  }

  // Find all dark regions (holes)
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const key = `${x},${y}`;
      const idx = y * width + x;
      
      if (!visited.has(key) && binary[idx] === 0) {
        const region = floodFill(x, y);
        if (region.length > 10) { // Filter small noise
          const centerX = region.reduce((sum, p) => sum + p.x, 0) / region.length;
          const centerY = region.reduce((sum, p) => sum + p.y, 0) / region.length;
          holes.push({
            area: region.length,
            position: { x: centerX, y: centerY }
          });
        }
      }
    }
  }

  return holes;
}

/**
 * Calculate shape metrics
 */
function calculateShapeMetrics(binary, width, height) {
  let perimeter = 0;
  let area = 0;
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      if (binary[idx] === 0) {
        area++;
        // Check if it's on the perimeter
        if (binary[idx - 1] === 255 || binary[idx + 1] === 255 ||
            binary[idx - width] === 255 || binary[idx + width] === 255) {
          perimeter++;
        }
      }
    }
  }

  const compactness = area > 0 ? (4 * Math.PI * area) / (perimeter * perimeter) : 0;
  
  return {
    area,
    perimeter,
    compactness,
    circularity: compactness
  };
}

/**
 * Compare two feature sets and return similarity score (0-1)
 * Handles both full feature sets and aggregated model data
 */
function compareFeatures(features1, features2) {
  if (!features1 || !features2) {
    return 0;
  }

  let totalScore = 0;
  let weightSum = 0;

  // Color histogram similarity (weight: 0.3)
  if (features1.colorHistogram && features2.colorHistogram) {
    try {
      const colorScore = compareHistograms(
        features1.colorHistogram,
        features2.colorHistogram
      );
      totalScore += colorScore * 0.3;
      weightSum += 0.3;
    } catch (error) {
      console.error('Error comparing color histograms:', error);
    }
  }

  // Edge features similarity (weight: 0.25)
  if (features1.edgeFeatures && features2.edgeFeatures) {
    try {
      const edgeScore = compareEdgeFeatures(
        features1.edgeFeatures,
        features2.edgeFeatures
      );
      totalScore += edgeScore * 0.25;
      weightSum += 0.25;
    } catch (error) {
      console.error('Error comparing edge features:', error);
    }
  }

  // Texture features similarity (weight: 0.2)
  if (features1.textureFeatures && features2.textureFeatures) {
    try {
      const textureScore = compareTextureFeatures(
        features1.textureFeatures,
        features2.textureFeatures
      );
      totalScore += textureScore * 0.2;
      weightSum += 0.2;
    } catch (error) {
      console.error('Error comparing texture features:', error);
    }
  }

  // Shape features similarity (weight: 0.25)
  if (features1.shapeFeatures && features2.shapeFeatures) {
    try {
      const shapeScore = compareShapeFeatures(
        features1.shapeFeatures,
        features2.shapeFeatures
      );
      totalScore += shapeScore * 0.25;
      weightSum += 0.25;
    } catch (error) {
      console.error('Error comparing shape features:', error);
    }
  }

  // If no features matched, return 0
  if (weightSum === 0) {
    return 0;
  }

  return totalScore / weightSum;
}

function compareHistograms(hist1, hist2) {
  if (!hist1 || !hist2) return 0;
  
  let similarity = 0;
  const channels = ['r', 'g', 'b'];
  let validChannels = 0;
  
  channels.forEach(channel => {
    if (hist1[channel] && hist2[channel] && Array.isArray(hist1[channel]) && Array.isArray(hist2[channel])) {
      let channelSim = 0;
      const minLength = Math.min(hist1[channel].length, hist2[channel].length);
      
      for (let i = 0; i < minLength; i++) {
        channelSim += Math.min(hist1[channel][i] || 0, hist2[channel][i] || 0);
      }
      
      // Normalize by array length
      if (minLength > 0) {
        similarity += channelSim / minLength;
        validChannels++;
      }
    }
  });
  
  return validChannels > 0 ? similarity / validChannels : 0;
}

function compareEdgeFeatures(edge1, edge2) {
  if (!edge1 || !edge2) return 0;
  
  const meanDiff = edge1.mean != null && edge2.mean != null
    ? Math.max(0, 1 - Math.abs(edge1.mean - edge2.mean) / 255)
    : 0;
  const varDiff = edge1.variance != null && edge2.variance != null
    ? Math.max(0, 1 - Math.abs(edge1.variance - edge2.variance) / (255 * 255))
    : 0;
  const densityDiff = edge1.edgeDensity != null && edge2.edgeDensity != null
    ? Math.max(0, 1 - Math.abs(edge1.edgeDensity - edge2.edgeDensity))
    : 0;
  
  const scores = [meanDiff, varDiff, densityDiff].filter(s => s > 0);
  return scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
}

function compareTextureFeatures(tex1, tex2) {
  if (!tex1 || !tex2) return 0;
  
  if (tex1.meanVariance != null && tex2.meanVariance != null) {
    const meanDiff = Math.max(0, 1 - Math.min(1, Math.abs(tex1.meanVariance - tex2.meanVariance) / 1000));
    return meanDiff;
  }
  return 0;
}

function compareShapeFeatures(shape1, shape2) {
  if (!shape1 || !shape2) return 0;
  
  let holesScore = 0;
  if (shape1.holes && shape2.holes && 
      shape1.holes.count != null && shape2.holes.count != null) {
    if (shape1.holes.count === shape2.holes.count) {
      holesScore = 1;
    } else {
      const maxCount = Math.max(shape1.holes.count, shape2.holes.count, 1);
      holesScore = Math.max(0, 1 - Math.abs(shape1.holes.count - shape2.holes.count) / maxCount);
    }
  }
  
  let aspectScore = 0;
  if (shape1.aspectRatio != null && shape2.aspectRatio != null) {
    const maxRatio = Math.max(shape1.aspectRatio, shape2.aspectRatio, 0.1);
    aspectScore = Math.max(0, 1 - Math.abs(shape1.aspectRatio - shape2.aspectRatio) / maxRatio);
  }
  
  let areaScore = 0;
  if (shape1.area != null && shape2.area != null) {
    areaScore = Math.max(0, 1 - Math.abs(shape1.area - shape2.area));
  }
  
  // Calculate weighted average, only counting non-zero scores
  const scores = [];
  if (holesScore > 0) scores.push({ value: holesScore, weight: 0.4 });
  if (aspectScore > 0) scores.push({ value: aspectScore, weight: 0.3 });
  if (areaScore > 0) scores.push({ value: areaScore, weight: 0.3 });
  
  if (scores.length === 0) return 0;
  
  const totalWeight = scores.reduce((sum, s) => sum + s.weight, 0);
  const weightedSum = scores.reduce((sum, s) => sum + s.value * s.weight, 0);
  
  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

module.exports = {
  extractImageFeatures,
  compareFeatures
};

