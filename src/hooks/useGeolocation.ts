import { useState, useEffect } from 'react';

interface GeolocationState {
  location: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  } | null;
  error: string | null;
  loading: boolean;
}

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  watch?: boolean;
}

export const useGeolocation = (options: UseGeolocationOptions = {}) => {
  const [state, setState] = useState<GeolocationState>({
    location: null,
    error: null,
    loading: true
  });

  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 60000,
    watch = false
  } = options;

  useEffect(() => {
    if (!navigator.geolocation) {
      setState({
        location: null,
        error: 'Geolocation is not supported by this browser.',
        loading: false
      });
      return;
    }

    const onSuccess = (position: GeolocationPosition) => {
      setState({
        location: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        },
        error: null,
        loading: false
      });
    };

    const onError = (error: GeolocationPositionError) => {
      let errorMessage = 'Unknown error occurred.';
      
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = '位置情報へのアクセスが拒否されました。';
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = '位置情報を取得できませんでした。';
          break;
        case error.TIMEOUT:
          errorMessage = '位置情報の取得がタイムアウトしました。';
          break;
      }

      setState({
        location: null,
        error: errorMessage,
        loading: false
      });
    };

    const geoOptions = {
      enableHighAccuracy,
      timeout,
      maximumAge
    };

    setState(prev => ({ ...prev, loading: true }));

    let watchId: number | undefined;

    if (watch) {
      watchId = navigator.geolocation.watchPosition(onSuccess, onError, geoOptions);
    } else {
      navigator.geolocation.getCurrentPosition(onSuccess, onError, geoOptions);
    }

    return () => {
      if (watchId !== undefined) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [enableHighAccuracy, timeout, maximumAge, watch]);

  const getCurrentPosition = () => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: 'Geolocation is not supported by this browser.',
        loading: false
      }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          location: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          },
          error: null,
          loading: false
        });
      },
      (error) => {
        let errorMessage = 'Unknown error occurred.';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = '位置情報へのアクセスが拒否されました。';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = '位置情報を取得できませんでした。';
            break;
          case error.TIMEOUT:
            errorMessage = '位置情報の取得がタイムアウトしました。';
            break;
        }

        setState({
          location: null,
          error: errorMessage,
          loading: false
        });
      },
      {
        enableHighAccuracy,
        timeout,
        maximumAge
      }
    );
  };

  return {
    ...state,
    getCurrentPosition
  };
};