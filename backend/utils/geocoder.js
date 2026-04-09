/**
 * Utility for geocoding text addresses using OpenStreetMap's Nominatim API.
 * Nominatim has a usage policy of max 1 request per second.
 */

async function geocodeAddress(address) {
  try {
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.append('q', address);
    url.searchParams.append('format', 'json');
    url.searchParams.append('limit', '1');

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'JobMateApp/1.0'
      }
    });

    if (!response.ok) {
      console.error('Geocoding error:', response.statusText);
      return null;
    }

    const data = await response.json();
    if (data && data.length > 0) {
      return {
        longitude: parseFloat(data[0].lon),
        latitude: parseFloat(data[0].lat)
      };
    }
    return null;
  } catch (error) {
    console.error('Geocoding function error:', error);
    return null;
  }
}

module.exports = { geocodeAddress };
