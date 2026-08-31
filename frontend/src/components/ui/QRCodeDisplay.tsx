import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';

export function QRCodeDisplay({ value, size = 260 }: { value: string; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, value, { width: size, margin: 1, color: { dark: '#3F382F', light: '#FFFFFF' } }).catch(
      () => setError('Could not render QR code')
    );
  }, [value, size]);

  if (error) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border border-red-200 bg-red-50 text-sm text-red-600"
        style={{ width: size, height: size }}
      >
        {error}
      </div>
    );
  }

  return <canvas ref={canvasRef} className="rounded-lg border border-border" width={size} height={size} />;
}
