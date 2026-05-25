"""
Geocoding service — converts place name to latitude/longitude.
Uses OpenStreetMap Nominatim (free, no API key required).
"""

import httpx
from typing import Optional


NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
HEADERS = {"User-Agent": "AstrologyWebApp/1.0 (kareer-studio)"}


class GeocodingError(Exception):
    pass


def geocode_place(place_name: str) -> dict:
    """
    Returns:
        { "lat": float, "lon": float, "display_name": str }
    Raises:
        GeocodingError if place not found or request fails
    """
    try:
        with httpx.Client(timeout=10.0) as client:
            response = client.get(
                NOMINATIM_URL,
                params={"q": place_name, "format": "json", "limit": 1},
                headers=HEADERS,
            )
        response.raise_for_status()
        results = response.json()
    except httpx.HTTPError as e:
        raise GeocodingError(f"Geocoding request failed: {e}")

    if not results:
        raise GeocodingError(f"Place not found: '{place_name}'")

    first = results[0]
    return {
        "lat": float(first["lat"]),
        "lon": float(first["lon"]),
        "display_name": first.get("display_name", place_name),
    }
