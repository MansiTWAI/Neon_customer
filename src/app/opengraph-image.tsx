import { ImageResponse } from 'next/og';

export const alt = 'Neon Adda: custom LED neon signs';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/** The preview shown when a storefront link is shared on WhatsApp, Instagram or X. */
export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at 50% 40%, #2a1033 0%, #0b0b12 70%)',
        color: '#fff',
        fontFamily: 'sans-serif',
      }}
    >
      <div
        style={{
          fontSize: 150,
          fontWeight: 700,
          color: '#ffe6f2',
          textShadow: '0 0 12px #ff2e88, 0 0 32px #ff2e88, 0 0 64px #ff2e88',
        }}
      >
        Neon Adda
      </div>
      <div style={{ marginTop: 28, fontSize: 40, color: '#c9c3d6' }}>
        Custom LED neon signs, made by hand in India
      </div>
    </div>,
    size,
  );
}
