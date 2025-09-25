"use client";

import { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, FileImage, Code, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import Image from "next/image";
import { renderToCanvas, generateQrSvg, type CanvasConfig } from "@/lib/qr";

// Configuration interface for the preview component
export interface PreviewConfig {
  contentType: 'text' | 'url' | 'email' | 'phone' | 'wifi' | 'sms' | 'vcard';
  content: string;
  vcard?: {
    name: string;
    phone: string;
    email: string;
    organization?: string;
    url?: string;
  };
  size: number;
  margin: number;
  errorCorrection: 'L' | 'M' | 'Q' | 'H';
  colors: {
    foreground: string;
    background: string;
  };
  style: {
    cornerRadius: number;
    gradient: boolean;
    gradientColors?: string[];
    dotStyle: 'square' | 'rounded' | 'circle';
    eyeStyle: 'square' | 'rounded' | 'circle';
  };
  logo?: {
    file?: File;
    src?: string;
    size: number; // 0.1 to 0.3 (10% to 30%)
    background: boolean;
    borderRadius: number;
  };
}

interface PreviewProps {
  config: PreviewConfig;
  className?: string;
}

export function Preview({ config, className = "" }: PreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [renderKey, setRenderKey] = useState(0); // Force re-render trigger
  const [showMobileExport, setShowMobileExport] = useState(false);

  // Check if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      setShowMobileExport(window.innerWidth < 768); // md breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Calculate contrast ratio for accessibility
  const getContrastRatio = (color1: string, color2: string): number => {
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    };

    const getLuminance = (r: number, g: number, b: number) => {
      const [rs, gs, bs] = [r, g, b].map(c => {
        c = c / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    };

    const rgb1 = hexToRgb(color1);
    const rgb2 = hexToRgb(color2);
    
    if (!rgb1 || !rgb2) return 21; // Default to good contrast if can't parse
    
    const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
    const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
    
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    
    return (brightest + 0.05) / (darkest + 0.05);
  };

  // Check if contrast is too low
  const contrastRatio = getContrastRatio(config.colors.foreground, config.colors.background);
  const hasLowContrast = contrastRatio < 3; // WCAG AA minimum is 3:1 for large text


  // Generate QR content based on type
  const generateQrContent = (config: PreviewConfig): string => {
    console.log('generateQrContent called with:', { contentType: config.contentType, content: config.content });

    let result = '';
    switch (config.contentType) {
      case 'vcard':
        if (!config.vcard) {
          result = config.content || '';
          break;
        }
        const { name, phone, email, organization, url } = config.vcard;

        // Only create vCard if we have at least a name
        if (!name.trim()) {
          result = config.content || '';
          break;
        }

        let vcard = 'BEGIN:VCARD\nVERSION:3.0\n';
        vcard += `FN:${name.trim()}\n`;
        if (phone && phone.trim()) vcard += `TEL:${phone.trim()}\n`;
        if (email && email.trim()) vcard += `EMAIL:${email.trim()}\n`;
        if (organization && organization.trim()) vcard += `ORG:${organization.trim()}\n`;
        if (url && url.trim()) vcard += `URL:${url.trim()}\n`;
        vcard += 'END:VCARD';
        result = vcard;
        break;
      case 'email':
        const emailContent = config.content.trim();
        result = emailContent.startsWith('mailto:') ? emailContent : `mailto:${emailContent}`;
        break;
      case 'phone':
        const phoneContent = config.content.trim();
        result = phoneContent.startsWith('tel:') ? phoneContent : `tel:${phoneContent}`;
        break;
      case 'sms':
        const smsContent = config.content.trim();
        result = smsContent.startsWith('sms:') ? smsContent : `sms:${smsContent}`;
        break;
      case 'wifi':
        // Format: WIFI:T:WPA;S:NetworkName;P:Password;H:false;;
        const wifiContent = config.content.trim();
        result = wifiContent.startsWith('WIFI:') ? wifiContent : wifiContent;
        break;
      default:
        result = config.content.trim();
        break;
    }

    console.log('generateQrContent result:', result);
    return result;
  };

  // State for QR data URL
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  // Generate advanced QR code with custom features
  const generateAdvancedQrDataUrl = async (content: string, config: PreviewConfig): Promise<string> => {
    const canvas = document.createElement('canvas');
    canvas.width = config.size;
    canvas.height = config.size;

    try {
      const canvasConfig: CanvasConfig = {
        size: config.size,
        margin: config.margin,
        errorCorrectionLevel: config.logo?.src ? 'H' : config.errorCorrection,
        color: {
          dark: config.colors.foreground || '#000000',
          light: config.colors.background === 'transparent' ? '#FFFFFF' : (config.colors.background || '#FFFFFF'),
        },
      };

      // Add logo if exists
      if (config.logo?.src) {
        canvasConfig.logo = {
          src: config.logo.src,
          size: Math.round(config.logo.size * 100),
          background: config.logo.background,
          borderRadius: config.logo.borderRadius,
          excavate: true,
        };
      }

      // Add advanced styling
      if (config.style.cornerRadius > 0 || config.style.gradient) {
        canvasConfig.style = {
          cornerRadius: config.style.cornerRadius,
          gradient: config.style.gradient,
          gradientColors: config.style.gradientColors || ['#667eea', '#764ba2'],
        };
      }

      // Use the renderToCanvas function from the QR library
      await renderToCanvas(canvas, content, canvasConfig);

      return canvas.toDataURL('image/png', 0.95);
    } catch (error) {
      console.warn('Advanced rendering failed, falling back to basic:', error);
      // Fallback to basic QR generation
      const QRCode = (await import('qrcode')).default;
      return await QRCode.toDataURL(content, {
        width: config.size,
        margin: config.margin,
        color: {
          dark: config.colors.foreground || '#000000',
          light: config.colors.background === 'transparent' ? '#FFFFFF' : (config.colors.background || '#FFFFFF'),
        },
        errorCorrectionLevel: config.logo?.src ? 'H' : config.errorCorrection,
      });
    }
  };

  // Generate QR code as data URL when config changes
  useEffect(() => {
    const generateQr = async () => {
      const qrContent = generateQrContent(config);

      if (!qrContent.trim()) {
        setQrDataUrl('');
        return;
      }

      setIsRendering(true);

      try {
        console.log('Generating QR data URL for:', qrContent);

        const QRCode = (await import('qrcode')).default;

        let dataUrl: string;

        // Check if we need advanced features
        const needsAdvancedFeatures = config.logo?.src ||
                                      config.style.cornerRadius > 0 ||
                                      config.style.gradient;

        if (needsAdvancedFeatures) {
          // Use advanced canvas rendering for complex features
          console.log('Using advanced rendering with features:', {
            logo: !!config.logo?.src,
            cornerRadius: config.style.cornerRadius,
            gradient: config.style.gradient,
            dotStyle: config.style.dotStyle,
            eyeStyle: config.style.eyeStyle
          });
          dataUrl = await generateAdvancedQrDataUrl(qrContent, config);
        } else {
          // Use simple QRCode.toDataURL for basic QR codes
          console.log('Using basic rendering');
          dataUrl = await QRCode.toDataURL(qrContent, {
            width: config.size,
            margin: config.margin,
            color: {
              dark: config.colors.foreground || '#000000',
              light: config.colors.background === 'transparent' ? '#FFFFFF' : (config.colors.background || '#FFFFFF'),
            },
            errorCorrectionLevel: config.logo?.src ? 'H' : config.errorCorrection,
          });
        }

        setQrDataUrl(dataUrl);
        setRenderKey(prev => prev + 1);
        console.log('QR data URL generated successfully');

      } catch (error) {
        console.error('QR generation failed:', error);
        setQrDataUrl('');
        toast.error('Failed to generate QR code', {
          description: error instanceof Error ? error.message : 'Unknown error occurred',
        });
      } finally {
        setIsRendering(false);
      }
    };

    const timeoutId = setTimeout(generateQr, 300); // Increased debounce for better performance
    return () => clearTimeout(timeoutId);
  }, [config]);

  // Export as PNG
  const handleExportPng = async () => {
    if (!qrDataUrl) return;

    setIsExporting(true);
    try {
      // Convert data URL to blob and download
      const response = await fetch(qrDataUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `qrcode-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('PNG exported successfully', {
        description: 'QR code has been downloaded to your device',
        duration: 3000,
      });
    } catch (error) {
      console.error('PNG export failed:', error);
      toast.error('Export failed', {
        description: 'Could not export PNG file',
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Export as SVG
  const handleExportSvg = async () => {
    const qrContent = generateQrContent(config);
    if (!qrContent.trim()) return;

    setIsExporting(true);
    try {
      console.log('Generating SVG for content:', qrContent);
      const svg = await generateQrSvg(qrContent, {
        size: config.size,
        margin: config.margin,
        errorCorrectionLevel: config.logo?.src ? 'H' : config.errorCorrection,
        color: {
          dark: config.colors.foreground || '#000000',
          light: config.colors.background === 'transparent' ? '#FFFFFF' : (config.colors.background || '#FFFFFF'),
        },
        width: config.size,
      });

      console.log('SVG generated successfully, length:', svg.length);

      // Create download link for SVG
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `qrcode-${Date.now()}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('SVG exported successfully', {
        description: 'QR code has been downloaded as vector file',
        duration: 3000,
      });
    } catch (error) {
      console.error('SVG export failed:', error);
      toast.error('Export failed', {
        description: 'Could not export SVG file',
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Copy image to clipboard
  const handleCopyToClipboard = async () => {
    if (!qrDataUrl) return;

    try {
      const response = await fetch(qrDataUrl);
      const blob = await response.blob();

      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);

      toast.success('Copied to clipboard', {
        description: 'QR code image copied to clipboard',
        duration: 2000,
      });
    } catch {
      // Fallback: show message if clipboard API is not supported
      toast.info('Copy not supported', {
        description: 'Use the download buttons to save the QR code',
      });
    }
  };

  return (
    <Card className={`glass border-white/10 ${className}`}>
      <CardHeader className="text-center pb-4">
        <CardTitle className="flex items-center justify-center gap-2">
          <FileImage className="h-5 w-5" />
          Live Preview
        </CardTitle>
        <CardDescription>
          Your QR code updates in real-time
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Canvas Preview with Micro-interaction */}
        <div className="flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={renderKey}
              initial={{ scale: 0.95, opacity: 0.8 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0.8 }}
              transition={{ 
                type: "spring",
                stiffness: 300,
                damping: 30,
                duration: 0.3
              }}
              className="relative"
            >
              {/* Loading overlay */}
              {isRendering && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-white/80 dark:bg-black/80 backdrop-blur-sm rounded-lg z-10 flex items-center justify-center"
                >
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    Generating...
                  </div>
                </motion.div>
              )}

              {/* QR Code Display */}
              <div className="relative p-4 bg-white dark:bg-gray-900 rounded-lg shadow-lg">
                {qrDataUrl ? (
                  <Image
                    src={qrDataUrl}
                    alt="QR Code"
                    className="border border-gray-300 rounded-sm block mx-auto cursor-pointer"
                    onClick={handleCopyToClipboard}
                    title="Click to copy to clipboard"
                    width={config.size}
                    height={config.size}
                    style={{
                      imageRendering: 'pixelated'
                    }}
                    unoptimized
                  />
                ) : (
                  <div
                    className="border border-gray-300 rounded-sm block mx-auto bg-gray-100 flex items-center justify-center"
                    style={{
                      width: `${config.size}px`,
                      height: `${config.size}px`
                    }}
                  >
                    {isRendering ? (
                      <div className="text-sm text-gray-500">Generating...</div>
                    ) : (
                      <div className="text-sm text-gray-500">No content</div>
                    )}
                  </div>
                )}

                {/* Hidden canvas for PNG export */}
                <canvas
                  ref={canvasRef}
                  width={config.size}
                  height={config.size}
                  className="hidden"
                />
                
                {/* Subtle glow effect */}
                <div 
                  className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-pink-500/10 rounded-lg blur-xl -z-10"
                  style={{ 
                    transform: 'scale(1.1)',
                  }}
                />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Export Buttons - Hidden on mobile, shown in sticky bar */}
        <div className={`space-y-3 ${showMobileExport ? 'hidden' : 'block'}`}>
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handleExportPng}
              disabled={isExporting || isRendering || !config.content.trim()}
              className="smooth-scale button-glow-hover"
              size="sm"
              aria-label="Download QR code as PNG image"
            >
              {isExporting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              PNG
            </Button>
            
            <Button
              onClick={handleExportSvg}
              disabled={isExporting || isRendering || !config.content.trim()}
              variant="outline"
              className="glass smooth-scale button-glow-hover"
              size="sm"
              aria-label="Download QR code as SVG vector"
            >
              {isExporting ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Code className="h-4 w-4 mr-2" />
              )}
              SVG
            </Button>
          </div>
          
          <p className="text-xs text-center text-muted-foreground">
            Click the preview to copy to clipboard
          </p>
        </div>

        {/* Preview Info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="pt-4 border-t border-white/10 space-y-3"
        >
          {/* Contrast Warning */}
          {hasLowContrast && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg"
            >
              <div className="flex items-center gap-2 text-yellow-400">
                <AlertTriangle className="h-4 w-4" />
                <p className="text-sm font-medium">Low Contrast Warning</p>
              </div>
              <p className="text-xs text-yellow-300 mt-1">
                Contrast ratio: {contrastRatio.toFixed(1)}:1. Consider using darker foreground or lighter background for better readability.
              </p>
            </motion.div>
          )}

          <div className="text-center space-y-1">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Type:</span> {config.contentType.toUpperCase()} • {" "}
              <span className="font-medium">Content:</span>{" "}
              <span className="font-mono text-xs">
                {config.contentType === 'vcard' && config.vcard?.name 
                  ? config.vcard.name 
                  : config.content.length > 30 
                    ? `${config.content.slice(0, 30)}...` 
                    : config.content || 'No content'
                }
              </span>
            </p>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Size:</span> {config.size}×{config.size}px • {" "}
              <span className="font-medium">ECC:</span> {config.errorCorrection}
              {config.logo?.src && (
                <>
                  {" • "}
                  <span className="font-medium">Logo:</span> {Math.round(config.logo.size * 100)}%
                </>
              )}
              {hasLowContrast && (
                <>
                  {" • "}
                  <span className="font-medium text-yellow-400">Contrast:</span> {contrastRatio.toFixed(1)}:1
                </>
              )}
            </p>
          </div>
        </motion.div>
      </CardContent>

      {/* Mobile Sticky Export Bar */}
      {showMobileExport && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.3 }}
          className="mobile-export-bar show"
        >
          <div className="flex gap-3">
            <Button
              onClick={handleExportPng}
              disabled={isExporting || isRendering || !config.content.trim()}
              className="flex-1 button-glow-hover"
              size="sm"
              aria-label="Download QR code as PNG image"
            >
              {isExporting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              PNG
            </Button>
            
            <Button
              onClick={handleExportSvg}
              disabled={isExporting || isRendering || !config.content.trim()}
              variant="outline"
              className="flex-1 glass button-glow-hover"
              size="sm"
              aria-label="Download QR code as SVG vector"
            >
              {isExporting ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Code className="h-4 w-4 mr-2" />
              )}
              SVG
            </Button>
          </div>
          
          <p className="text-xs text-center text-muted-foreground mt-2">
            Tap preview to copy • Swipe up to dismiss
          </p>
        </motion.div>
      )}
    </Card>
  );
}