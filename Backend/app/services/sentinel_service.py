class SentinelService:
    @staticmethod
    def get_latest_metadata():
        return {
            "satellite": "Sentinel-2B",
            "sensor": "MSI (Multi-Spectral Instrument)",
            "resolution": "10m / 3m fused",
            "last_orbit": "2026-06-15T09:42:00Z",
            "cloud_cover": "1.2%",
            "processing_level": "Level-2A (Ortho-rectified Bottom-of-Atmosphere)"
        }

    @staticmethod
    def get_satellite_tiles():
        return [
            {"tile_id": "T44PQA", "region": "Godavari Deltas", "paddy_area_ha": 670000, "avg_ndvi": 0.83, "cloud_free": True},
            {"tile_id": "T44PQB", "region": "Krishna Delta", "paddy_area_ha": 280000, "avg_ndvi": 0.65, "cloud_free": True},
            {"tile_id": "T44PPA", "region": "Nellore Belt", "paddy_area_ha": 190000, "avg_ndvi": 0.35, "cloud_free": False}
        ]
