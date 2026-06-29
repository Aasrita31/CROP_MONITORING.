from shapely.geometry import Point, Polygon
import json

class GeometryService:
    @staticmethod
    def calculate_centroid(polygon_coords: list) -> list:
        """
        Calculate the centroid of a polygon.
        polygon_coords: list of [lat, lon]
        Returns: [lat, lon]
        """
        if not polygon_coords or len(polygon_coords) < 3:
            return None
        poly = Polygon(polygon_coords)
        return [poly.centroid.x, poly.centroid.y]

    @staticmethod
    def point_in_polygon(point_coords: list, polygon_coords: list) -> bool:
        """
        Check if a point is inside a polygon.
        point_coords: [lat, lon]
        polygon_coords: list of [lat, lon]
        """
        if not polygon_coords or len(polygon_coords) < 3:
            return False
        point = Point(point_coords[0], point_coords[1])
        poly = Polygon(polygon_coords)
        return poly.contains(point)

geometry_service = GeometryService()
