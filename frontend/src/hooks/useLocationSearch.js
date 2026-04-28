import { useEffect, useState } from 'react';

export const RADIUS_OPTIONS = [1, 3, 5, 10];

const useLocationSearch = ({ defaultMode = 'none' } = {}) => {
  const [locationMode, setLocationMode] = useState(defaultMode);
  const [manualQuery, setManualQuery] = useState('');
  const [coordinates, setCoordinates] = useState(null);
  const [radiusKm, setRadiusKm] = useState(5);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState('');
  const LAST_LOCATION_KEY = 'lastKnownLocation';

  const resolveCurrentLocation = ({ preferCache = true } = {}) => {
    setLocationError('');

    if (preferCache) {
      const cached = localStorage.getItem(LAST_LOCATION_KEY);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Number.isFinite(Number(parsed?.lat)) && Number.isFinite(Number(parsed?.lng))) {
            setCoordinates({ lat: Number(parsed.lat), lng: Number(parsed.lng) });
          }
        } catch {
          // ignore invalid cached location
        }
      }
    }

    setLoadingLocation(true);

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      setLoadingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextCoordinates = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setCoordinates(nextCoordinates);
        localStorage.setItem(LAST_LOCATION_KEY, JSON.stringify(nextCoordinates));
        setLoadingLocation(false);
      },
      () => {
        setLocationError('Unable to access current location. Please allow GPS permission.');
        setLoadingLocation(false);
      },
      { enableHighAccuracy: false, timeout: 7000, maximumAge: 60000 }
    );
  };

  const resolveManualLocation = async (event) => {
    if (event?.preventDefault) event.preventDefault();

    const query = manualQuery.trim();
    if (!query) {
      setLocationError('Please enter city or pincode.');
      return false;
    }

    setLocationError('');
    setLoadingLocation(true);
    try {
      const params = new URLSearchParams({ q: query, format: 'json', limit: '1' });
      const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
        headers: { Accept: 'application/json' }
      });
      if (!response.ok) {
        throw new Error('Location search request failed');
      }
      const data = await response.json();

      if (!data?.length) {
        setLocationError('Location not found. Please try another city/pincode.');
        setCoordinates(null);
        return false;
      }

      setCoordinates({
        lat: Number.parseFloat(data[0].lat),
        lng: Number.parseFloat(data[0].lon)
      });
      return true;
    } catch (error) {
      console.error('Manual geocoding failed:', error);
      setLocationError('Failed to resolve location. Please try again.');
      return false;
    } finally {
      setLoadingLocation(false);
    }
  };

  const clearLocation = () => {
    setLocationMode('none');
    setManualQuery('');
    setCoordinates(null);
    setLocationError('');
  };

  useEffect(() => {
    if (locationMode === 'current') {
      resolveCurrentLocation();
      return;
    }
    if (locationMode === 'none') {
      setCoordinates(null);
      setLocationError('');
    }
  }, [locationMode]);

  return {
    locationMode,
    setLocationMode,
    manualQuery,
    setManualQuery,
    coordinates,
    setCoordinates,
    radiusKm,
    setRadiusKm,
    loadingLocation,
    locationError,
    setLocationError,
    resolveCurrentLocation,
    resolveManualLocation,
    clearLocation
  };
};

export default useLocationSearch;
