import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  RouteRequest, 
  RouteOptimizationResult, 
  RouteUpdate, 
  OptimizedRoute,
  RoutePerformance,
  RoutePoint 
} from '@/types/route';
import { routeOptimizationService } from '@/services/routeOptimizationService';

interface UseRouteOptimizationOptions {
  autoUpdate?: boolean;
  updateInterval?: number; // minutes
  onRouteUpdate?: (update: RouteUpdate) => void;
  onError?: (error: Error) => void;
}

interface UseRouteOptimizationReturn {
  // State
  isOptimizing: boolean;
  optimizationResult: RouteOptimizationResult | null;
  currentRoute: OptimizedRoute | null;
  routeUpdates: RouteUpdate[];
  error: string | null;
  
  // Actions
  optimizeRoute: (request: RouteRequest) => Promise<RouteOptimizationResult | null>;
  selectRoute: (routeId: string) => void;
  startMonitoring: () => void;
  stopMonitoring: () => void;
  clearError: () => void;
  recordRoutePerformance: (actualTime: number, deviations?: Array<{timestamp: Date; reason: string; timeImpact: number}>) => Promise<void>;
  
  // Utilities
  getETA: () => Date | null;
  getTimeSaved: () => number;
  getTrafficLevel: () => 'low' | 'medium' | 'high' | 'congested' | null;
}

export const useRouteOptimization = (
  options: UseRouteOptimizationOptions = {}
): UseRouteOptimizationReturn => {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<RouteOptimizationResult | null>(null);
  const [currentRoute, setCurrentRoute] = useState<OptimizedRoute | null>(null);
  const [routeUpdates, setRouteUpdates] = useState<RouteUpdate[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);

  const routeStartTimeRef = useRef<Date | null>(null);
  const monitoringActiveRef = useRef(false);

  const {
    autoUpdate = true,
    updateInterval = 5,
    onRouteUpdate,
    onError
  } = options;

  // Optimize route
  const optimizeRoute = useCallback(async (request: RouteRequest): Promise<RouteOptimizationResult | null> => {
    setIsOptimizing(true);
    setError(null);
    
    try {
      const result = await routeOptimizationService.optimizeRoute(request);
      setOptimizationResult(result);
      setCurrentRoute(result.recommendedRoute);
      routeStartTimeRef.current = new Date();
      
      // Auto-start monitoring if enabled
      if (autoUpdate) {
        setTimeout(() => startMonitoring(), 1000);
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Route optimization failed';
      setError(errorMessage);
      onError?.(err instanceof Error ? err : new Error(errorMessage));
      return null;
    } finally {
      setIsOptimizing(false);
    }
  }, [autoUpdate, onError]);

  // Select a specific route from the optimization result
  const selectRoute = useCallback((routeId: string) => {
    if (!optimizationResult) return;
    
    const selectedRoute = optimizationResult.routes.find(route => route.id === routeId);
    if (selectedRoute) {
      setCurrentRoute(selectedRoute);
      
      // Update the recommended route in the result
      setOptimizationResult(prev => prev ? {
        ...prev,
        recommendedRoute: selectedRoute
      } : null);
      
      // Restart monitoring with new route
      if (isMonitoring) {
        stopMonitoring();
        setTimeout(() => startMonitoring(), 1000);
      }
    }
  }, [optimizationResult, isMonitoring]);

  // Start route monitoring
  const startMonitoring = useCallback(() => {
    if (!currentRoute || !optimizationResult || monitoringActiveRef.current) return;
    
    monitoringActiveRef.current = true;
    setIsMonitoring(true);
    
    routeOptimizationService.startRouteMonitoring(
      optimizationResult.requestId,
      (update: RouteUpdate) => {
        setRouteUpdates(prev => [update, ...prev].slice(0, 10)); // Keep last 10 updates
        onRouteUpdate?.(update);
        
        // Update current route if there's a significant change
        if (update.alternativeRecommendation) {
          setCurrentRoute(update.alternativeRecommendation);
        }
      },
      updateInterval
    );
  }, [currentRoute, optimizationResult, updateInterval, onRouteUpdate]);

  // Stop route monitoring
  const stopMonitoring = useCallback(() => {
    if (!optimizationResult || !monitoringActiveRef.current) return;
    
    routeOptimizationService.stopRouteMonitoring(optimizationResult.requestId);
    monitoringActiveRef.current = false;
    setIsMonitoring(false);
  }, [optimizationResult]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Record route performance for analytics
  const recordRoutePerformance = useCallback(async (
    actualTime: number,
    deviations: Array<{timestamp: Date; reason: string; timeImpact: number}> = []
  ) => {
    if (!currentRoute || !optimizationResult || !routeStartTimeRef.current) return;
    
    try {
      const plannedTime = currentRoute.estimatedTimeWithTraffic;
      const accuracy = Math.max(0, 1 - Math.abs(actualTime - plannedTime) / plannedTime);
      
      const performance: RoutePerformance = {
        routeId: currentRoute.id,
        caseId: optimizationResult.requestId,
        plannedTime,
        actualTime,
        accuracy,
        trafficConditions: currentRoute.segments.some(s => s.trafficLevel === 'congested') ? 'heavy' :
                          currentRoute.segments.some(s => s.trafficLevel === 'high') ? 'moderate' : 'light',
        completedAt: new Date(),
        deviations
      };
      
      await routeOptimizationService.saveRoutePerformance(performance);
      
      // Stop monitoring after recording performance
      stopMonitoring();
    } catch (err) {
      console.error('Failed to record route performance:', err);
    }
  }, [currentRoute, optimizationResult, stopMonitoring]);

  // Get estimated time of arrival
  const getETA = useCallback((): Date | null => {
    if (!optimizationResult) return null;
    return optimizationResult.estimatedArrivalTime;
  }, [optimizationResult]);

  // Get time saved compared to default route
  const getTimeSaved = useCallback((): number => {
    if (!currentRoute || !optimizationResult) return 0;
    
    // Compare to the slowest route as baseline
    const slowestRoute = optimizationResult.routes.reduce((slowest, route) => 
      route.estimatedTimeWithTraffic > slowest.estimatedTimeWithTraffic ? route : slowest
    );
    
    return slowestRoute.estimatedTimeWithTraffic - currentRoute.estimatedTimeWithTraffic;
  }, [currentRoute, optimizationResult]);

  // Get current traffic level
  const getTrafficLevel = useCallback((): 'low' | 'medium' | 'high' | 'congested' | null => {
    if (!currentRoute) return null;
    
    const trafficLevels = currentRoute.segments.map(s => s.trafficLevel);
    
    if (trafficLevels.some(level => level === 'congested')) return 'congested';
    if (trafficLevels.some(level => level === 'high')) return 'high';
    if (trafficLevels.some(level => level === 'medium')) return 'medium';
    return 'low';
  }, [currentRoute]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (monitoringActiveRef.current) {
        stopMonitoring();
      }
    };
  }, [stopMonitoring]);

  // Auto-clear error after 10 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 10000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return {
    // State
    isOptimizing,
    optimizationResult,
    currentRoute,
    routeUpdates,
    error,
    
    // Actions
    optimizeRoute,
    selectRoute,
    startMonitoring,
    stopMonitoring,
    clearError,
    recordRoutePerformance,
    
    // Utilities
    getETA,
    getTimeSaved,
    getTrafficLevel
  };
};

// Helper hook for quick route requests
export const useQuickRoute = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<OptimizedRoute | null>(null);
  
  const getQuickRoute = useCallback(async (
    origin: RoutePoint,
    destination: RoutePoint,
    preference: 'fastest' | 'most_stable' | 'shortest' = 'fastest'
  ) => {
    setIsLoading(true);
    try {
      const request: RouteRequest = {
        origin,
        destination,
        routePreference: preference,
        departureTime: new Date(),
        vehicleType: 'emergency'
      };
      
      const optimization = await routeOptimizationService.optimizeRoute(request);
      setResult(optimization.recommendedRoute);
      return optimization.recommendedRoute;
    } catch (error) {
      console.error('Quick route failed:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  return {
    isLoading,
    result,
    getQuickRoute
  };
};

// Hook for route analytics
export const useRouteAnalytics = () => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const loadAnalytics = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await routeOptimizationService.getRouteAnalytics();
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);
  
  return {
    analytics,
    isLoading,
    refreshAnalytics: loadAnalytics
  };
};