import React, { useState } from 'react';

export default function ImageWithLoader({ src, alt, className, style }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className={className} style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', ...style }}>
      {!loaded && <div className="img-loader" style={{ position: 'absolute' }} />}
      <img
        src={src}
        alt={alt}
        style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: loaded ? 1 : 0, transition: 'opacity 0.3s ease' }}
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}
