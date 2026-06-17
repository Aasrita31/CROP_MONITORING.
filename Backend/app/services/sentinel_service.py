import os
from dotenv import load_dotenv
load_dotenv()

import requests
import json
from datetime import datetime

class SentinelService:
    @staticmethod
    def get_village_location(village_name: str):
        """Uses Nominatim OpenStreetMap API to resolve village name to bounding box and coordinates."""
        try:
            url = f"https://nominatim.openstreetmap.org/search?q={village_name},Andhra+Pradesh,India&format=json&limit=1"
            headers = {"User-Agent": "AgriTwin-Monitoring-Platform"}
            response = requests.get(url, headers=headers)
            if response.status_code == 200 and len(response.json()) > 0:
                data = response.json()[0]
                return {
                    "lat": float(data["lat"]),
                    "lon": float(data["lon"]),
                    "boundingbox": [float(x) for x in data["boundingbox"]],
                    "name": data["display_name"]
                }
        except Exception as e:
            print(f"Nominatim Error: {e}")
            
        # Fallback to Kadiyam area if API fails or rate limited
        return {
            "lat": 16.9205,
            "lon": 81.7997,
            "boundingbox": [16.91, 16.93, 81.78, 81.81],
            "name": f"{village_name} (Fallback)"
        }

    _token = None
    _token_expiry = 0

    @classmethod
    def get_cdse_token(cls):
        client_id = os.environ.get("CDSE_CLIENT_ID")
        client_secret = os.environ.get("CDSE_CLIENT_SECRET")
        if not client_id or not client_secret:
            raise Exception("CDSE credentials not found in .env")
            
        now = datetime.now().timestamp()
        if cls._token and now < cls._token_expiry:
            return cls._token
            
        auth_url = "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token"
        data = {
            "grant_type": "client_credentials",
            "client_id": client_id,
            "client_secret": client_secret
        }
        res = requests.post(auth_url, data=data)
        if res.status_code != 200:
            raise Exception(f"Failed to get CDSE token: {res.text}")
            
        token_data = res.json()
        cls._token = token_data['access_token']
        # typical expiry is 3600 seconds, let's refresh slightly before
        cls._token_expiry = now + token_data.get('expires_in', 3600) - 60
        return cls._token

    @classmethod
    def fetch_sentinel2_bands(cls, bbox: list):
        """
        Fetches true Sentinel-2 B4 (Red) and B8 (NIR) from Copernicus Data Space API.
        bbox format: [min_lat, max_lat, min_lon, max_lon]
        """
        import numpy as np
        import rasterio
        from rasterio.io import MemoryFile
        from datetime import timedelta
        
        min_lat, max_lat, min_lon, max_lon = bbox
        
        token = cls.get_cdse_token()
        
        process_url = "https://sh.dataspace.copernicus.eu/api/v1/process"
        
        # We need a time range. Let's look at the last 30 days to get a cloud-free image.
        end_time = datetime.now()
        start_time = end_time - timedelta(days=30)
        
        evalscript = """
        //VERSION=3
        function setup() {
            return {
                input: ["B04", "B08", "dataMask"],
                output: { bands: 2, sampleType: "FLOAT32" }
            };
        }
        function evaluatePixel(sample) {
            return [sample.B04, sample.B08];
        }
        """
        
        request_payload = {
            "input": {
                "bounds": {
                    "properties": {
                        "crs": "http://www.opengis.net/def/crs/EPSG/0/4326"
                    },
                    "bbox": [min_lon, min_lat, max_lon, max_lat]
                },
                "data": [
                    {
                        "type": "sentinel-2-l2a",
                        "dataFilter": {
                            "timeRange": {
                                "from": start_time.strftime("%Y-%m-%dT00:00:00Z"),
                                "to": end_time.strftime("%Y-%m-%dT23:59:59Z")
                            },
                            "maxCloudCoverage": 20
                        }
                    }
                ]
            },
            "output": {
                "width": 512,
                "height": 512,
                "responses": [
                    {
                        "identifier": "default",
                        "format": {
                            "type": "image/tiff"
                        }
                    }
                ]
            },
            "evalscript": evalscript
        }
        
        headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "image/tiff"
        }
        
        response = requests.post(process_url, json=request_payload, headers=headers)
        
        if response.status_code != 200:
            raise Exception(f"Copernicus API Error: {response.text}")
            
        # Parse the TIFF bytes using rasterio
        with MemoryFile(response.content) as memfile:
            with memfile.open() as dataset:
                b4_red = dataset.read(1)
                b8_nir = dataset.read(2)
                
        return {
            "b4": b4_red,
            "b8": b8_nir,
            "bounds": [[min_lat, min_lon], [max_lat, max_lon]],
            "capture_date": end_time.strftime("%Y-%m-%dT%H:%M:%SZ"), # Note: CDSE Catalog API is needed for exact date, using fetch date for now
            "source": "Copernicus Sentinel-2 L2A (Real Data)"
        }
