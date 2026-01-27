'use client';
import { useState, useEffect, useRef } from 'react';
import smartcrop from 'smartcrop';
import { getCropStyle, isPreloaded } from '../utils/imagePreloader';

export default function SmartImage({ src, alt, className, objectFit = 'cover', priority = false }) {
  // ลองดึงจาก cache ก่อน (instant!)
  const cachedStyle = getCropStyle(src);
  const [cropStyle, setCropStyle] = useState(
    cachedStyle || { objectPosition: '50% 35%' }
  );
  const [isLoaded, setIsLoaded] = useState(isPreloaded(src));
  const imgRef = useRef(null);

  useEffect(() => {
    // ถ้ามี cached style แล้ว ไม่ต้องทำอะไร
    if (cachedStyle) {
      setCropStyle(cachedStyle);
      setIsLoaded(true);
      return;
    }

    if (!src) return;

    // Fallback: ถ้าไม่มี cache ให้ใช้ default `center top` ไปเลย (ไม่คำนวณสดเพื่อลด CPU usage)
    if (!cachedStyle) {
      setIsLoaded(true);
      setCropStyle({ objectPosition: '50% 35%' });
    }
  }, [src, cachedStyle]);

  return (
    <img
      ref={imgRef}
      src={src}
      alt={alt}
      className={`${className} transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
      style={{ ...cropStyle, objectFit: objectFit }}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
    />
  );
}