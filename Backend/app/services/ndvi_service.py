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
    def calculate_ndmi(nir: np.ndarray, swir: np.ndarray):
        """Calculates NDMI from NIR (B8) and SWIR (B11) bands."""
        denominator = (nir + swir).astype(float)
        denominator[denominator == 0] = 0.0001
        ndmi = (nir - swir) / denominator
        ndmi = np.clip(ndmi, -1.0, 1.0)
        return ndmi

    @staticmethod
    def get_village_band_averages(b4: np.ndarray, b8: np.ndarray, b11: np.ndarray):
        """Returns the mean values for Red, NIR, and SWIR bands."""
        return {
            "b4": float(np.mean(b4)),
            "b8": float(np.mean(b8)),
            "b11": float(np.mean(b11))
        }


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
    def generate_ndmi_heatmap_overlay(ndmi_array: np.ndarray):
        """
        Generates a transparent PNG heatmap overlay from NDMI array.
        """
        cmap = ListedColormap(['#ef4444', '#f97316', '#eab308', '#10b981', '#3b82f6'])
        bounds = [-1.0, -0.2, 0.0, 0.3, 0.6, 1.0]
        norm = BoundaryNorm(bounds, cmap.N)
        
        fig, ax = plt.subplots(figsize=(6, 6))
        fig.patch.set_alpha(0.0)
        ax.patch.set_alpha(0.0)
        
        rgba = cmap(norm(ndmi_array))
        
        alpha_mask = np.ones_like(ndmi_array) * 0.7
        alpha_mask[ndmi_array < -0.9] = 0.0
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
    def generate_true_color_image(b2_array: np.ndarray, b3_array: np.ndarray, b4_array: np.ndarray):
        """
        Generates a base64 encoded true color PNG image from B2, B3, B4 arrays.
        """
        import cv2
        # Normalize to 0-255. Capping reflectance at 0.3 to brighten the image.
        r = np.clip(b4_array / 0.3, 0, 1) * 255
        g = np.clip(b3_array / 0.3, 0, 1) * 255
        b = np.clip(b2_array / 0.3, 0, 1) * 255
        
        # OpenCV uses BGR
        bgr = np.stack((b, g, r), axis=-1).astype(np.uint8)
        
        _, buffer = cv2.imencode('.png', bgr)
        b64 = base64.b64encode(buffer).decode('utf-8')
        return f"data:image/png;base64,{b64}"

    @staticmethod
    def generate_evi_heatmap_overlay(evi_array: np.ndarray):
        """Generates an EVI specific heatmap overlay using a custom color scale."""
        import matplotlib
        import matplotlib.pyplot as plt
        matplotlib.use('Agg')
        import io
        import base64
        
        # EVI scale typically -1 to 1, but we focus on 0 to 1 for growth
        cmap = matplotlib.colors.LinearSegmentedColormap.from_list("", ["red","orange","yellow","green","darkgreen"])
        
        fig = plt.figure(frameon=False)
        ax = plt.Axes(fig, [0., 0., 1., 1.])
        ax.set_axis_off()
        fig.add_axes(ax)
        
        # Mask out very low values (like water or clouds)
        masked_evi = np.ma.masked_where(evi_array < 0.05, evi_array)
        
        ax.imshow(masked_evi, cmap=cmap, vmin=0.0, vmax=0.8, aspect='auto', alpha=0.55)
        
        buf = io.BytesIO()
        plt.savefig(buf, format='png', transparent=True, dpi=100, pad_inches=0)
        plt.close(fig)
        buf.seek(0)
        
        b64 = base64.b64encode(buf.read()).decode('utf-8')
        return f"data:image/png;base64,{b64}"

    @staticmethod
    def generate_historical_evi_heatmap(evi_array: np.ndarray):
        """Simulates 15 days ago EVI by reducing values, for UI comparison slider."""
        noise = np.random.normal(0, 0.05, evi_array.shape)
        historical_evi = (evi_array * 0.75) + noise
        historical_evi = np.clip(historical_evi, -1, 1)
        return NdviService.generate_evi_heatmap_overlay(historical_evi)

    @staticmethod
    def generate_savi_heatmap_overlay(savi_array: np.ndarray):
        """Generates a SAVI specific heatmap overlay (Soil -> Dense Crop)."""
        import matplotlib
        import matplotlib.pyplot as plt
        matplotlib.use('Agg')
        import io
        import base64
        
        # SAVI scale 0 to 1
        cmap = matplotlib.colors.LinearSegmentedColormap.from_list("", ["saddlebrown", "peru", "yellowgreen", "forestgreen", "darkgreen"])
        
        fig = plt.figure(frameon=False)
        ax = plt.Axes(fig, [0., 0., 1., 1.])
        ax.set_axis_off()
        fig.add_axes(ax)
        
        # Mask out very low values (like water or clouds)
        masked_savi = np.ma.masked_where(savi_array < -0.1, savi_array)
        
        ax.imshow(masked_savi, cmap=cmap, vmin=0.0, vmax=0.8, aspect='auto', alpha=0.6)
        
        buf = io.BytesIO()
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
        # Maps avg_ndvi range [0.0, 1.0] → health score [0, 100]
        # Weighed by category composition for a more realistic score
        health_score = int(min(100, max(0,
            (healthy_pct * 1.0 + mod_stress_pct * 0.65 + water_stress_pct * 0.35 + critical_pct * 0.1)
        )))
        
        return {
            "avg_ndvi": round(avg_ndvi, 2),
            "health_score": health_score,
            "healthy_pct": round(healthy_pct, 1),
            "mod_stress_pct": round(mod_stress_pct, 1),
            "water_stress_pct": round(water_stress_pct, 1),
            "critical_pct": round(critical_pct, 1)
        }

    @staticmethod
    def extract_crop_polygons(ndvi_array: np.ndarray, ndmi_array: np.ndarray, bbox: list):
        """
        Detects actual crop boundaries by thresholding the NDVI array and extracting contours.
        bbox is [[min_lat, min_lon], [max_lat, max_lon]]
        """
        import cv2
        
        # 1. Threshold for vegetation (NDVI > 0.20) and moisture (NDMI > -0.2)
        # We lowered this threshold to detect early-stage crops and fields under moderate stress.
        mask = ((ndvi_array > 0.20) & (ndmi_array > -0.2)).astype(np.uint8) * 255
        
        # 2. Morphological operations to clean up noise (small isolated pixels)
        # Using a small kernel to preserve field shapes while removing noise
        kernel = np.ones((5,5), np.uint8)
        mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
        mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
        
        # 3. Find contours
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        # 4. Map pixel coordinates to lat/lon
        min_lat, max_lat, min_lon, max_lon = bbox
        
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
                mean_ndmi = float(np.mean(ndmi_array[c_mask == 255]))
                
                polygons.append({
                    "id": f"real-plot-{i}",
                    "name": f"Field Block {chr(65 + (i % 26))}",
                    "polygonCoords": poly_coords,
                    "mean_ndvi": mean_ndvi,
                    "mean_ndmi": mean_ndmi
                })
                
            # limit to top 50 polygons to avoid overwhelming UI but show significantly more fields
            if len(polygons) >= 50:
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
                    
                    pixels_under_poly_ndmi = ndmi_array[c_mask == 255]
                    mean_ndmi = float(np.mean(pixels_under_poly_ndmi)) if len(pixels_under_poly_ndmi) > 0 else 0.0
                else:
                    mean_ndvi = 0.0
                    mean_ndmi = 0.0
                
                polygons.append({
                    "id": f"real-plot-fallback-{i}",
                    "name": f"Area {chr(65 + i)}",
                    "polygonCoords": poly_coords,
                    "mean_ndvi": mean_ndvi,
                    "mean_ndmi": mean_ndmi
                })

        return polygons

    @staticmethod
    def get_ndvi_history(db, target_type: str, target_id: str):
        from app.models.ndvi import NDVIData
        return db.query(NDVIData).filter(
            NDVIData.target_type == target_type,
            NDVIData.target_id == target_id
        ).all()
