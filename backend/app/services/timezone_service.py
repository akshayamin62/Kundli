"""
Timezone service — resolves the IANA timezone for given lat/lon
and converts local birth time to UTC using pytz (handles historical offsets).
"""

import math
import pytz
from datetime import datetime
from typing import Tuple


class TimezoneError(Exception):
    pass


def _is_india(lat: float, lon: float) -> bool:
    """Approximate bounding box for India (includes Navsari, Gujarat, etc.)."""
    return 6.0 <= lat <= 37.5 and 68.0 <= lon <= 97.5


def _find_timezone_name(lat: float, lon: float) -> str:
    """
    Find IANA timezone name from lat/lon using timezonefinder (lightweight, offline).
    Falls back to regional defaults, then a longitude-based estimate.
    """
    try:
        from timezonefinder import TimezoneFinder  # optional but recommended
        tf = TimezoneFinder()
        tz_name = tf.timezone_at(lat=lat, lng=lon)
        if tz_name:
            return tz_name
    except ImportError:
        pass

    if _is_india(lat, lon):
        return "Asia/Kolkata"

    # Fallback: estimate from longitude (rough, ±30 min accuracy)
    offset_hours = round(lon / 15)
    offset_hours = max(-12, min(14, offset_hours))
    sign = "+" if offset_hours >= 0 else "-"
    abs_h = abs(offset_hours)
    return f"Etc/GMT{sign}{abs_h}" if offset_hours != 0 else "UTC"


def local_to_utc(
    year: int, month: int, day: int,
    hour: int, minute: int, second: int,
    lat: float, lon: float,
) -> Tuple[datetime, str, str]:
    """
    Convert local birth time to UTC.

    Returns:
        (utc_datetime, tz_name, utc_offset_string)
    """
    tz_name = _find_timezone_name(lat, lon)

    try:
        tz = pytz.timezone(tz_name)
    except pytz.UnknownTimeZoneError:
        tz = pytz.UTC
        tz_name = "UTC"

    local_dt = datetime(year, month, day, hour, minute, second)

    try:
        local_dt_aware = tz.localize(local_dt, is_dst=None)
    except pytz.exceptions.AmbiguousTimeError:
        local_dt_aware = tz.localize(local_dt, is_dst=True)
    except pytz.exceptions.NonExistentTimeError:
        # Clocks skipped this time — shift forward 1 hour
        from datetime import timedelta
        local_dt_aware = tz.localize(local_dt + timedelta(hours=1), is_dst=True)

    utc_dt = local_dt_aware.astimezone(pytz.utc)
    offset = local_dt_aware.utcoffset()
    total_seconds = int(offset.total_seconds())
    sign = "+" if total_seconds >= 0 else "-"
    abs_seconds = abs(total_seconds)
    utc_offset_str = f"{sign}{abs_seconds // 3600:02d}:{(abs_seconds % 3600) // 60:02d}"

    return utc_dt, tz_name, utc_offset_str
