"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Download, Upload, Wifi, RefreshCw, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface SpeedTestResult {
  downloadSpeed: number; // Mbps
  uploadSpeed: number; // Mbps
  ping: number; // ms
  jitter: number; // ms
  timestamp: Date;
  testDuration: number; // seconds
}

interface NetworkSpeedMonitorProps {
  className?: string;
}

const STORAGE_KEY = "network-speed-test";

export function NetworkSpeedMonitor({ className }: NetworkSpeedMonitorProps) {
  const [currentResult, setCurrentResult] = useState<SpeedTestResult | null>(null);
  const [isTestingDownload, setIsTestingDownload] = useState(false);
  const [isTestingUpload, setIsTestingUpload] = useState(false);
  const [isTestingPing, setIsTestingPing] = useState(false);
  const [testProgress, setTestProgress] = useState(0);
  const [lastTestTime, setLastTestTime] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Test download speed using real HTTP requests
  const testDownloadSpeed = useCallback(async (): Promise<number> => {
    const testSizes = [1, 2]; // Reduced from 3 to 2 tests
    const testUrl = 'https://httpbin.org/bytes/';
    
    try {
      setIsTestingDownload(true);
      setError(null);
      let totalSpeed = 0;
      let validTests = 0;

      for (let i = 0; i < testSizes.length; i++) {
        // Check if test was cancelled
        if (abortControllerRef.current?.signal.aborted) {
          throw new Error('Test cancelled');
        }

        const sizeBytes = testSizes[i] * 1024 * 1024;
        const startTime = performance.now();
        
        try {
          const response = await fetch(testUrl + sizeBytes, {
            cache: 'no-cache',
            signal: abortControllerRef.current?.signal,
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            }
          });
          
          if (response.ok) {
            await response.blob();
            const endTime = performance.now();
            const duration = (endTime - startTime) / 1000;
            const speedMbps = (sizeBytes * 8) / (duration * 1000000);
            
            totalSpeed += speedMbps;
            validTests++;
          }
        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError') {
            throw error;
          }
          console.warn(`Download test ${i + 1} failed:`, error);
        }
        
        setTestProgress(((i + 1) / testSizes.length) * 50);
        
        // Add delay between tests to prevent resource exhaustion
        if (i < testSizes.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      return validTests > 0 ? totalSpeed / validTests : 0;
    } catch (error) {
      if (error instanceof Error && error.message === 'Test cancelled') {
        throw error;
      }
      console.error('Download speed test failed:', error);
      setError('Download test failed');
      return 0;
    } finally {
      setIsTestingDownload(false);
    }
  }, []);

  // Test upload speed using POST requests
  const testUploadSpeed = useCallback(async (): Promise<number> => {
    const testSizes = [0.5, 1]; // Reduced from 3 to 2 tests
    const testUrl = 'https://httpbin.org/post';
    
    try {
      setIsTestingUpload(true);
      let totalSpeed = 0;
      let validTests = 0;

      for (let i = 0; i < testSizes.length; i++) {
        // Check if test was cancelled
        if (abortControllerRef.current?.signal.aborted) {
          throw new Error('Test cancelled');
        }

        const sizeBytes = testSizes[i] * 1024 * 1024;
        const testData = new Uint8Array(sizeBytes);
        
        const startTime = performance.now();
        
        try {
          const response = await fetch(testUrl, {
            method: 'POST',
            body: testData,
            signal: abortControllerRef.current?.signal,
            headers: {
              'Content-Type': 'application/octet-stream',
              'Cache-Control': 'no-cache'
            }
          });
          
          if (response.ok) {
            const endTime = performance.now();
            const duration = (endTime - startTime) / 1000;
            const speedMbps = (sizeBytes * 8) / (duration * 1000000);
            
            totalSpeed += speedMbps;
            validTests++;
          }
        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError') {
            throw error;
          }
          console.warn(`Upload test ${i + 1} failed:`, error);
        }
        
        setTestProgress(50 + ((i + 1) / testSizes.length) * 30);
        
        // Add delay between tests
        if (i < testSizes.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      return validTests > 0 ? totalSpeed / validTests : 0;
    } catch (error) {
      if (error instanceof Error && error.message === 'Test cancelled') {
        throw error;
      }
      console.error('Upload speed test failed:', error);
      setError('Upload test failed');
      return 0;
    } finally {
      setIsTestingUpload(false);
    }
  }, []);

  // Test ping/latency
  const testPing = useCallback(async (): Promise<{ ping: number; jitter: number }> => {
    const testUrl = 'https://httpbin.org/get';
    const pingTests = 3; // Reduced from 5 to 3 tests
    
    try {
      setIsTestingPing(true);
      const pings: number[] = [];
      
      for (let i = 0; i < pingTests; i++) {
        // Check if test was cancelled
        if (abortControllerRef.current?.signal.aborted) {
          throw new Error('Test cancelled');
        }

        const startTime = performance.now();
        
        try {
          const response = await fetch(testUrl + '?t=' + Date.now(), {
            cache: 'no-cache',
            signal: abortControllerRef.current?.signal,
            headers: { 'Cache-Control': 'no-cache' }
          });
          
          if (response.ok) {
            const endTime = performance.now();
            const ping = endTime - startTime;
            pings.push(ping);
          }
        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError') {
            throw error;
          }
          console.warn(`Ping test ${i + 1} failed:`, error);
        }
        
        setTestProgress(80 + ((i + 1) / pingTests) * 20);
        
        // Increased delay between ping tests to prevent resource exhaustion
        if (i < pingTests - 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
      
      if (pings.length > 0) {
        const avgPing = pings.reduce((a, b) => a + b, 0) / pings.length;
        const jitter = Math.max(...pings) - Math.min(...pings);
        return { ping: avgPing, jitter };
      }
      
      return { ping: 0, jitter: 0 };
    } catch (error) {
      if (error instanceof Error && error.message === 'Test cancelled') {
        throw error;
      }
      console.error('Ping test failed:', error);
      setError('Ping test failed');
      return { ping: 0, jitter: 0 };
    } finally {
      setIsTestingPing(false);
    }
  }, []);

  // Run complete speed test
  const runSpeedTest = useCallback(async () => {
    // Cancel any existing test
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller
    abortControllerRef.current = new AbortController();
    
    const startTime = Date.now();
    setTestProgress(0);
    setError(null);
    
    try {
      // Test download speed
      const downloadSpeed = await testDownloadSpeed();
      
      // Test upload speed
      const uploadSpeed = await testUploadSpeed();
      
      // Test ping
      const { ping, jitter } = await testPing();
      
      const endTime = Date.now();
      const testDuration = (endTime - startTime) / 1000;
      
      const result: SpeedTestResult = {
        downloadSpeed: Math.round(downloadSpeed * 10) / 10,
        uploadSpeed: Math.round(uploadSpeed * 10) / 10,
        ping: Math.round(ping),
        jitter: Math.round(jitter),
        timestamp: new Date(),
        testDuration: Math.round(testDuration)
      };
      
      setCurrentResult(result);
      setLastTestTime(new Date());
      setTestProgress(100);
      
      // Save to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
      
    } catch (error) {
      if (error instanceof Error && error.message === 'Test cancelled') {
        console.log('Speed test was cancelled');
        return;
      }
      console.error('Speed test failed:', error);
      setError('Speed test failed. Please try again.');
    } finally {
      setTestProgress(0);
      abortControllerRef.current = null;
    }
  }, [testDownloadSpeed, testUploadSpeed, testPing]);

  // Load last test result on component mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const result = JSON.parse(saved);
        setCurrentResult({
          ...result,
          timestamp: new Date(result.timestamp)
        });
        setLastTestTime(new Date(result.timestamp));
      } catch (error) {
        console.error('Failed to load speed test result:', error);
      }
    }
  }, []);

  // Auto-test on component mount if no recent data (disabled to prevent resource exhaustion)
  useEffect(() => {
    // Disabled auto-testing to prevent resource exhaustion
    // Users can manually trigger tests when needed
    return;
  }, [currentResult, lastTestTime, runSpeedTest]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const isAnyTestRunning = isTestingDownload || isTestingUpload || isTestingPing;
  const getSpeedColor = (speed: number) => {
    if (speed > 50) return "text-green-400";
    if (speed > 10) return "text-yellow-400";
    return "text-red-400";
  };

  const getPingColor = (ping: number) => {
    if (ping < 50) return "text-green-400";
    if (ping < 100) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className={cn("space-y-3 h-full flex flex-col", className)}>
      {/* Test Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wifi className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Network Speed</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={runSpeedTest}
          disabled={isAnyTestRunning}
          className="h-6 px-2 text-xs"
        >
          <RefreshCw className={cn("h-3 w-3 mr-1", isAnyTestRunning && "animate-spin")} />
          {isAnyTestRunning ? "Testing..." : "Test"}
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="text-center p-2 bg-red-500/10 border border-red-500/20 rounded-md">
          <div className="text-sm text-red-400">{error}</div>
        </div>
      )}

      {/* Speed Results */}
      {currentResult ? (
        <div className="flex-1 space-y-3">
          {/* Download & Upload */}
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center glass rounded-md p-2">
              <Download className="h-4 w-4 mx-auto mb-1 text-blue-500" />
              <div className={cn("text-lg font-bold", getSpeedColor(currentResult.downloadSpeed))}>
                {currentResult.downloadSpeed}
              </div>
              <div className="text-xs text-muted-foreground">Mbps Down</div>
            </div>
            <div className="text-center glass rounded-md p-2">
              <Upload className="h-4 w-4 mx-auto mb-1 text-green-500" />
              <div className={cn("text-lg font-bold", getSpeedColor(currentResult.uploadSpeed))}>
                {currentResult.uploadSpeed}
              </div>
              <div className="text-xs text-muted-foreground">Mbps Up</div>
            </div>
          </div>

          {/* Ping & Jitter */}
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center glass rounded-md p-2">
              <Zap className="h-4 w-4 mx-auto mb-1 text-yellow-500" />
              <div className={cn("text-sm font-bold", getPingColor(currentResult.ping))}>
                {currentResult.ping}ms
              </div>
              <div className="text-xs text-muted-foreground">Ping</div>
            </div>
            <div className="text-center glass rounded-md p-2">
              <Wifi className="h-4 w-4 mx-auto mb-1 text-purple-500" />
              <div className="text-sm font-bold text-primary-enhanced">
                {currentResult.jitter}ms
              </div>
              <div className="text-xs text-muted-foreground">Jitter</div>
            </div>
          </div>

          {/* Test Info */}
          <div className="text-center">
            <div className="text-xs text-muted-foreground">
              Last tested: {currentResult.timestamp.toLocaleTimeString()}
            </div>
            <div className="text-xs text-muted-foreground">
              Test duration: {currentResult.testDuration}s
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Wifi className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <div className="text-sm text-muted-foreground">
              {isAnyTestRunning ? "Running speed test..." : "Click Test to measure speed"}
            </div>
            {error && (
              <div className="text-xs text-red-400 mt-2">
                {error}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Progress Bar */}
      {isAnyTestRunning && (
        <div className="space-y-1">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
            <div 
              className="bg-primary h-1 rounded-full transition-all duration-300" 
              style={{ width: `${testProgress}%` }}
            />
          </div>
          <div className="text-xs text-muted-foreground text-center">
            {isTestingDownload && "Testing download speed..."}
            {isTestingUpload && "Testing upload speed..."}
            {isTestingPing && "Testing ping & jitter..."}
          </div>
        </div>
      )}
    </div>
  );
}

