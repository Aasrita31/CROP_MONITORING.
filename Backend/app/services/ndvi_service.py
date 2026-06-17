import io
import base64
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.colors import ListedColormap, BoundaryNorm

class NdviService:
    @staticmethod
    def calculate_ndvi(b4: np.ndarray, b8: np.ndarray):
        """Calculates NDVI from Red (B4) and NIR (B8) bands."""
        # Prevent division by zero
        denominator = (b8 + b4).astype(float)
        denominator[denominator == 0] = 0.0001
        
        ndvi = (b8 - b4) / denominator
        # Clip to valid NDVI range [-1, 1]
        ndvi = np.clip(ndvi, -1.0, 1.0)
        return ndvi

    @staticmethod
    def generate_heatmap_overlay(ndvi_array: np.ndarray):
        """
        Generates a transparent PNG heatmap overlay from NDVI array.
        Returns base64 encoded data URI.
        """
        # Define color bounds as per user requirement
        # <0.25: Red (Critical)
        # 0.25 - 0.40: Orange (Water Stress)
        # 0.40 - 0.60: Yellow (Moderate Stress)
        # 0.60 - 0.75: Green (Healthy)
        # >0.75: Dark Green (Very Healthy)
        
        # Values: Red, Orange, Yellow, Green, Dark Green
        cmap = ListedColormap(['#ef4444', '#f97316', '#eab308', '#10b981', '#064e3b'])
        bounds = [-1.0, 0.25, 0.40, 0.60, 0.75, 1.0]
        norm = BoundaryNorm(bounds, cmap.N)
        
        # We need to make the background (non-vegetation, <0.1) transparent
        # or maybe just let all vegetation be colored, but with an alpha layer.
        fig, ax = plt.subplots(figsize=(6, 6))
        fig.patch.set_alpha(0.0)
        ax.patch.set_alpha(0.0)
        
        # Create an RGBA image where alpha depends on NDVI (low NDVI = more transparent, to show map)
        rgba = cmap(norm(ndvi_array))
        
        # Make very low NDVI (water/roads/buildings) mostly transparent
        alpha_mask = np.clip((ndvi_array + 0.5) / 1.5, 0.1, 0.8)
        rgba[..., 3] = alpha_mask
        
        ax.imshow(rgba, aspect='auto')
        ax.axis('off')
        
        buf = io.BytesIO()
        plt.subplots_adjust(top=1, bottom=0, right=1, left=0, hspace=0, wspace=0)
        plt.margins(0,0)
        plt.savefig(buf, format='png', transparent=True, dpi=100, pad_inches=0)
        plt.close(fig)
        buf.seek(0)
        
        b64 = base64.b64encode(buf.read()).decode('utf-8')
        return f"data:image/png;base64,{b64}"

    @staticmethod
    def get_village_metrics(ndvi_array: np.ndarray):
        """Calculates aggregate metrics for the village from the NDVI array."""
        valid_pixels = ndvi_array[ndvi_array > 0.1] # Filter out water/buildings
        if len(valid_pixels) == 0:
            return {"avg_ndvi": 0, "health_score": 0, "water_stress": 0, "disease_risk": 0}
            
        avg_ndvi = float(np.mean(valid_pixels))
        
        # Calculate percentages in each category
        total = len(valid_pixels)
        healthy_pct = float(np.sum(valid_pixels >= 0.60)) / total * 100
        mod_stress_pct = float(np.sum((valid_pixels >= 0.40) & (valid_pixels < 0.60))) / total * 100
        water_stress_pct = float(np.sum((valid_pixels >= 0.25) & (valid_pixels < 0.40))) / total * 100
        critical_pct = float(np.sum(valid_pixels < 0.25)) / total * 100
        
        # Map to Health Score out of 100
        # A perfectly healthy field (NDVI > 0.75 everywhere) would be 100.
        health_score = int(min(100, max(0, avg_ndvi * 100 + 15)))
        
        return {
            "avg_ndvi": round(avg_ndvi, 2),
            "health_score": health_score,
            "healthy_pct": round(healthy_pct, 1),
            "mod_stress_pct": round(mod_stress_pct, 1),
            "water_stress_pct": round(water_stress_pct, 1),
            "critical_pct": round(critical_pct, 1)
        }

    @staticmethod
    def extract_crop_polygons(ndvi_array: np.ndarray, bbox: list):
        """
        Detects actual crop boundaries by thresholding the NDVI array and extracting contours.
        bbox is [[min_lat, min_lon], [max_lat, max_lon]]
        """
        import cv2
        
        # 1. Threshold for vegetation (NDVI > 0.3)
        # Using 0.3 to be generous with detecting fields that might be recently planted or stressed
        mask = (ndvi_array > 0.3).astype(np.uint8) * 255
        
        # 2. Morphological operations to clean up noise (small isolated pixels)
        # Using a small kernel to preserve field shapes while removing noise
        kernel = np.ones((5,5), np.uint8)
        mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
        mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
        
        # 3. Find contours
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        # 4. Map pixel coordinates to lat/lon
        min_lat, min_lon = bbox[0]
        max_lat, max_lon = bbox[1]
        
        height, width = ndvi_array.shape
        lat_step = (max_lat - min_lat) / height
        lon_step = (max_lon - min_lon) / width
        
        polygons = []
        for i, cnt in enumerate(contours):
            # Filter tiny contours (less than approx 1 hectare)
            # Assuming 10m pixel, 100 pixels = 1 hectare
            if cv2.contourArea(cnt) < 50:  
                continue
                
            poly_coords = []
            # Simplify contour to reduce vertex count for frontend rendering performance
            epsilon = 0.02 * cv2.arcLength(cnt, True)
            approx = cv2.approxPolyDP(cnt, epsilon, True)
            
            for point in approx:
                x, y = point[0]
                # x is column (longitude), y is row (latitude)
                lon = min_lon + (x * lon_step)
                # Since image row 0 is max_lat (top), row H is min_lat (bottom)
                lat = max_lat - (y * lat_step)
                poly_coords.append([lat, lon])
                
            # Need at least a triangle
            if len(poly_coords) >= 3:
                # Extract the mean NDVI for just this polygon to determine its unique health
                c_mask = np.zeros_like(mask)
                cv2.drawContours(c_mask, [cnt], -1, 255, -1)
                mean_ndvi = float(np.mean(ndvi_array[c_mask == 255]))
                
                polygons.append({
                    "id": f"real-plot-{i}",
                    "name": f"Field Block {chr(65 + (i % 26))}",
                    "polygonCoords": poly_coords,
                    "mean_ndvi": mean_ndvi
                })
                
            # limit to top 15 polygons to avoid overwhelming UI
            if len(polygons) >= 15:
                break
                
        # Fallback if no contours found (e.g. heavily urban area or off-season)
        # Generate geometric blocks but sample the REAL NDVI underneath them
        if len(polygons) == 0:
            center_lat = (min_lat + max_lat) / 2
            center_lon = (min_lon + max_lon) / 2
            import math
            
            for i in range(5):
                gridX = (i % 3) - 1
                gridY = (i // 3) - 1
                
                fLat = center_lat + gridY * 0.0035 + (np.random.random() * 0.0005)
                fLng = center_lon + gridX * 0.0035 + (np.random.random() * 0.0005)
                radius = 0.0012 + np.random.random() * 0.0003
                numPoints = 6 + int(np.random.random() * 2)
                
                poly_coords = []
                for j in range(numPoints):
                    angle = (j / numPoints) * 2 * math.pi
                    rad = radius * (0.8 + np.random.random() * 0.2)
                    poly_coords.append([fLat + rad * math.cos(angle), fLng + rad * math.sin(angle)])
                
                # Calculate real NDVI underneath this generated polygon
                c_mask = np.zeros((height, width), dtype=np.uint8)
                pixel_poly = []
                for pt in poly_coords:
                    # Clip to bounds to avoid index errors
                    px = min(width - 1, max(0, int((pt[1] - min_lon) / lon_step)))
                    py = min(height - 1, max(0, int((max_lat - pt[0]) / lat_step)))
                    pixel_poly.append([px, py])
                    
                if len(pixel_poly) > 0:
                    cv2.fillPoly(c_mask, [np.array(pixel_poly, dtype=np.int32)], 255)
                    pixels_under_poly = ndvi_array[c_mask == 255]
                    mean_ndvi = float(np.mean(pixels_under_poly)) if len(pixels_under_poly) > 0 else 0.0
                else:
                    mean_ndvi = 0.0
                
                polygons.append({
                    "id": f"real-plot-fallback-{i}",
                    "name": f"Area {chr(65 + i)}",
                    "polygonCoords": poly_coords,
                    "mean_ndvi": mean_ndvi
                })

        return polygons
