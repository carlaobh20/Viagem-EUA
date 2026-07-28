'use client';

/**
 * Bloco de carregamento com shimmer (classe .v3-skel definida em app/globals.css).
 * Usar no lugar de "Carregando…" textual em áreas com layout já conhecido.
 * @param {{ height?: number, radiusPx?: number, style?: Object }} props
 */
export default function Skeleton({ height = 16, radiusPx = 8, style = {} }) {
  return <div className="v3-skel" style={{ height, borderRadius: radiusPx, width: '100%', ...style }} />;
}
