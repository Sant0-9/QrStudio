/**
 * QR Code Generation Library
 * Provides functions for generating QR codes as SVG and rendering to canvas with optional logos
 */

// Types for QR code generation options
export interface QrOptions {
  size?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  type?: 'image/png' | 'image/jpeg' | 'image/webp';
  quality?: number;
  width?: number;
  rendererOpts?: {
    quality?: number;
  };
}

export interface CanvasConfig extends QrOptions {
  logo?: {
    src: string | HTMLImageElement;
    size?: number; // Percentage of QR code size (10-40)
    x?: number;
    y?: number;
    excavate?: boolean; // Remove QR modules behind logo
    background?: boolean; // Add white background behind logo
    borderRadius?: number;
  };
  style?: {
    cornerRadius?: number;
    gradient?: boolean;
    gradientColors?: string[];
    dotStyle?: 'square' | 'rounded' | 'circle';
    eyeStyle?: 'square' | 'rounded' | 'circle';
  };
}

/**
 * Generates QR code as SVG string
 * Uses the 'qrcode' library for reliable QR generation
 */
export async function generateQrSvg(
  payload: string,
  options: QrOptions = {}
): Promise<string> {
  // Dynamic import to avoid SSR issues
  const QRCode = (await import('qrcode')).default;
  
  const {
    size = 256,
    margin = 4,
    color = { dark: '#000000', light: '#FFFFFF' },
    errorCorrectionLevel = 'M',
    width = size,
  } = options;

  try {
    // Generate SVG string
    const svgString = await QRCode.toString(payload, {
      type: 'svg',
      width,
      margin,
      color,
      errorCorrectionLevel,
    });

    return svgString;
  } catch (error) {
    console.error('Failed to generate QR code SVG:', error);
    throw new Error(`QR generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Renders QR code to canvas with optional logo overlay
 * Automatically sets error correction to H if logo is present
 */
export async function renderToCanvas(
  canvas: HTMLCanvasElement,
  payload: string,
  config: CanvasConfig = {}
): Promise<void> {
  const QRCode = (await import('qrcode')).default;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not get canvas 2D context');
  }

  const {
    size = 256,
    margin = 4,
    color = { dark: '#000000', light: '#FFFFFF' },
    logo,
    style = {},
  } = config;

  // Automatically set error correction to H if logo exists
  const errorCorrectionLevel = logo ? 'H' : (config.errorCorrectionLevel || 'M');

  // Set canvas dimensions
  canvas.width = size;
  canvas.height = size;

  try {
    // Generate QR code to canvas
    await QRCode.toCanvas(canvas, payload, {
      width: size,
      margin,
      color,
      errorCorrectionLevel,
    });

    // Apply corner radius if specified
    if (style.cornerRadius && style.cornerRadius > 0) {
      applyCornerRadius(ctx, size, style.cornerRadius);
    }

    // Apply gradient effect if specified
    if (style.gradient && style.gradientColors) {
      applyGradientEffect(ctx, size, style.gradientColors);
    }

    // Add logo if provided
    if (logo) {
      await addLogoToCanvas(ctx, logo, size);
    }

  } catch (error) {
    console.error('Failed to render QR code to canvas:', error);
    throw new Error(`Canvas rendering failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Adds a logo to the center of the QR code on canvas
 */
async function addLogoToCanvas(
  ctx: CanvasRenderingContext2D,
  logo: NonNullable<CanvasConfig['logo']>,
  qrSize: number
): Promise<void> {
  const {
    src,
    size: logoSizePercent = 20,
    x,
    y,
    excavate = true,
    background = true,
    borderRadius = 0,
  } = logo;

  // Calculate logo dimensions
  const logoSize = (qrSize * logoSizePercent) / 100;
  const logoX = x ?? (qrSize - logoSize) / 2;
  const logoY = y ?? (qrSize - logoSize) / 2;

  // Load image if src is string
  let image: HTMLImageElement;
  if (typeof src === 'string') {
    image = new Image();
    image.crossOrigin = 'anonymous';
    
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('Failed to load logo image'));
      image.src = src;
    });
  } else {
    image = src;
  }

  // Save context state
  ctx.save();

  // Excavate area behind logo (clear QR modules)
  if (excavate) {
    const excavationSize = logoSize + 8; // Add small padding
    const excavationX = (qrSize - excavationSize) / 2;
    const excavationY = (qrSize - excavationSize) / 2;
    
    ctx.fillStyle = '#FFFFFF';
    if (borderRadius > 0) {
      roundedRect(ctx, excavationX, excavationY, excavationSize, excavationSize, borderRadius + 2);
      ctx.fill();
    } else {
      ctx.fillRect(excavationX, excavationY, excavationSize, excavationSize);
    }
  }

  // Draw white background behind logo
  if (background) {
    const backgroundSize = logoSize + 4;
    const backgroundX = (qrSize - backgroundSize) / 2;
    const backgroundY = (qrSize - backgroundSize) / 2;
    
    ctx.fillStyle = '#FFFFFF';
    if (borderRadius > 0) {
      roundedRect(ctx, backgroundX, backgroundY, backgroundSize, backgroundSize, borderRadius);
      ctx.fill();
    } else {
      ctx.fillRect(backgroundX, backgroundY, backgroundSize, backgroundSize);
    }
  }

  // Draw logo with optional border radius
  if (borderRadius > 0) {
    // Clip to rounded rectangle
    roundedRect(ctx, logoX, logoY, logoSize, logoSize, borderRadius);
    ctx.clip();
  }

  ctx.drawImage(image, logoX, logoY, logoSize, logoSize);

  // Restore context state
  ctx.restore();
}

/**
 * Applies corner radius to the entire QR code
 */
function applyCornerRadius(
  ctx: CanvasRenderingContext2D,
  size: number,
  radius: number
): void {
  // Create a new canvas for the rounded version
  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d');
  if (!tempCtx) return;

  tempCanvas.width = size;
  tempCanvas.height = size;

  // Copy current canvas to temp canvas
  tempCtx.drawImage(ctx.canvas, 0, 0);

  // Clear original canvas
  ctx.clearRect(0, 0, size, size);

  // Draw rounded rectangle clipping path
  roundedRect(ctx, 0, 0, size, size, radius);
  ctx.clip();

  // Draw the temp canvas back
  ctx.drawImage(tempCanvas, 0, 0);
}

/**
 * Applies gradient effect to QR code modules
 */
function applyGradientEffect(
  ctx: CanvasRenderingContext2D,
  size: number,
  colors: string[]
): void {
  if (colors.length < 2) return;

  // Create a new canvas to work with
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = size;
  tempCanvas.height = size;
  const tempCtx = tempCanvas.getContext('2d');
  if (!tempCtx) return;

  // Copy the original QR code to temp canvas
  tempCtx.drawImage(ctx.canvas, 0, 0);

  // Create gradient
  const gradient = tempCtx.createLinearGradient(0, 0, size, size);
  colors.forEach((color, index) => {
    gradient.addColorStop(index / (colors.length - 1), color);
  });

  // Apply gradient only to non-white pixels
  const imageData = tempCtx.getImageData(0, 0, size, size);
  const data = imageData.data;

  // Create gradient pattern
  tempCtx.fillStyle = gradient;
  tempCtx.fillRect(0, 0, size, size);
  const gradientData = tempCtx.getImageData(0, 0, size, size);

  // Apply gradient only to dark pixels from original QR code
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // If pixel is dark (not white/light)
    if (r < 200 && g < 200 && b < 200) {
      data[i] = gradientData.data[i];     // R
      data[i + 1] = gradientData.data[i + 1]; // G
      data[i + 2] = gradientData.data[i + 2]; // B
      // Keep original alpha
    }
  }

  // Put the processed image back
  tempCtx.putImageData(imageData, 0, 0);

  // Clear original canvas and draw the result
  ctx.clearRect(0, 0, size, size);
  ctx.drawImage(tempCanvas, 0, 0);
}

/**
 * Helper function to draw rounded rectangle
 */
function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * Utility function to download canvas as image
 */
export function downloadCanvasAsImage(
  canvas: HTMLCanvasElement,
  filename: string = 'qrcode',
  format: 'png' | 'jpeg' | 'webp' = 'png',
  quality: number = 0.92
): void {
  const mimeType = `image/${format}`;
  const dataUrl = canvas.toDataURL(mimeType, quality);
  
  const link = document.createElement('a');
  link.download = `${filename}.${format}`;
  link.href = dataUrl;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Utility function to get canvas as blob
 */
export function getCanvasBlob(
  canvas: HTMLCanvasElement,
  format: 'png' | 'jpeg' | 'webp' = 'png',
  quality: number = 0.92
): Promise<Blob | null> {
  const mimeType = `image/${format}`;
  
  return new Promise((resolve) => {
    canvas.toBlob(resolve, mimeType, quality);
  });
}

/**
 * Validates QR code payload and provides suggestions
 */
export function validateQrPayload(payload: string, type?: string): {
  isValid: boolean;
  warnings: string[];
  suggestions: string[];
} {
  const warnings: string[] = [];
  const suggestions: string[] = [];
  
  // Check payload length
  if (payload.length === 0) {
    return {
      isValid: false,
      warnings: ['Payload cannot be empty'],
      suggestions: ['Enter some content to generate a QR code'],
    };
  }
  
  if (payload.length > 2953) {
    warnings.push('Payload is very long and may not scan reliably');
    suggestions.push('Consider shortening the content or using a URL shortener');
  }
  
  // Type-specific validations
  if (type === 'url') {
    try {
      new URL(payload);
    } catch {
      warnings.push('Invalid URL format');
      suggestions.push('Make sure URL includes protocol (http:// or https://)');
    }
  }
  
  if (type === 'email') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(payload)) {
      warnings.push('Invalid email format');
      suggestions.push('Use format: user@domain.com');
    }
  }
  
  if (type === 'phone') {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(payload.replace(/[\s\-\(\)]/g, ''))) {
      warnings.push('Invalid phone number format');
      suggestions.push('Use format: +1234567890 or include country code');
    }
  }
  
  return {
    isValid: warnings.length === 0,
    warnings,
    suggestions,
  };
}