"use client";

import { useState, useRef, useEffect } from 'react';
import { generateQrSvg, renderToCanvas, downloadCanvasAsImage, validateQrPayload } from '@/lib/qr';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Demo component showing how to use the QR code library
 * This can be used for testing and as a reference implementation
 */
export function QrDemo() {
  const [payload, setPayload] = useState('https://qrstudio.app');
  const [svgString, setSvgString] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Generate SVG when payload changes
  useEffect(() => {
    const generateSvg = async () => {
      if (!payload.trim()) {
        setSvgString('');
        return;
      }

      try {
        setIsLoading(true);
        setError('');
        
        const svg = await generateQrSvg(payload, {
          size: 256,
          errorCorrectionLevel: 'M',
          color: { dark: '#000000', light: '#FFFFFF' }
        });
        
        setSvgString(svg);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to generate QR code');
        setSvgString('');
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(generateSvg, 300); // Debounce
    return () => clearTimeout(timeoutId);
  }, [payload]);

  // Render to canvas
  const handleRenderToCanvas = async () => {
    if (!canvasRef.current || !payload.trim()) return;

    try {
      setIsLoading(true);
      setError('');

      await renderToCanvas(canvasRef.current, payload, {
        size: 256,
        margin: 4,
        color: { dark: '#1a1a1a', light: '#ffffff' },
        style: {
          cornerRadius: 8,
          gradient: false,
        },
        // Optional logo example (commented out)
        // logo: {
        //   src: '/logo.png',
        //   size: 20,
        //   background: true,
        //   borderRadius: 4,
        // }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to render to canvas');
    } finally {
      setIsLoading(false);
    }
  };

  // Download canvas as PNG
  const handleDownload = () => {
    if (canvasRef.current) {
      downloadCanvasAsImage(canvasRef.current, 'qr-code', 'png', 0.92);
    }
  };

  // Validate payload
  const validation = validateQrPayload(payload);

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>QR Code Generation Demo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Input */}
          <div className="space-y-2">
            <label htmlFor="payload" className="text-sm font-medium">
              Content
            </label>
            <Input
              id="payload"
              value={payload}
              onChange={(e) => setPayload(e.target.value)}
              placeholder="Enter content for QR code..."
              className={validation.isValid ? '' : 'border-red-500'}
            />
            {validation.warnings.length > 0 && (
              <div className="text-sm text-red-600 space-y-1">
                {validation.warnings.map((warning, i) => (
                  <div key={i}>⚠️ {warning}</div>
                ))}
              </div>
            )}
            {validation.suggestions.length > 0 && (
              <div className="text-sm text-blue-600 space-y-1">
                {validation.suggestions.map((suggestion, i) => (
                  <div key={i}>💡 {suggestion}</div>
                ))}
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* SVG Preview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">SVG Output</h3>
              <div className="border rounded-md p-4 bg-white min-h-[200px] flex items-center justify-center">
                {isLoading ? (
                  <div className="text-gray-500">Generating...</div>
                ) : svgString ? (
                  <div dangerouslySetInnerHTML={{ __html: svgString }} />
                ) : (
                  <div className="text-gray-400">No QR code generated</div>
                )}
              </div>
            </div>

            {/* Canvas Preview */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Canvas Output</h3>
              <div className="border rounded-md p-4 bg-white min-h-[200px] flex items-center justify-center">
                <canvas
                  ref={canvasRef}
                  width={256}
                  height={256}
                  className="max-w-full h-auto border border-gray-200"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleRenderToCanvas}
                  disabled={isLoading || !payload.trim()}
                  size="sm"
                >
                  Render to Canvas
                </Button>
                <Button
                  onClick={handleDownload}
                  disabled={!canvasRef.current}
                  variant="outline"
                  size="sm"
                >
                  Download PNG
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}