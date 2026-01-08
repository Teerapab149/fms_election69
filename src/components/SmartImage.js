'use client';
import { useState, useEffect, useRef } from 'react';
import smartcrop from 'smartcrop';

export default function SmartImage({ src, alt, className }) {
  const [cropStyle, setCropStyle] = useState({ objectPosition: '50% 35%' }); // ค่า Default 35%
  const imgRef = useRef(null);

  useEffect(() => {
    if (!src) return;

    const img = new Image();
    img.crossOrigin = "Anonymous"; // สำคัญสำหรับรูปจากภายนอก
    img.src = src;

    img.onload = () => {
      // ให้ smartcrop วิเคราะห์รูป (width/height คือขนาดที่เราอยากได้คร่าวๆ)
      smartcrop.crop(img, { width: 500, height: 500 }).then((result) => {
        const crop = result.topCrop;
        
        // คำนวณจุดกึ่งกลางของพื้นที่ที่ AI เลือกมา
        const centerX = (crop.x + crop.width / 2) / img.width * 100;
        const centerY = (crop.y + crop.height / 2) / img.height * 100;

        setCropStyle({
          objectPosition: `${centerX}% ${centerY}%`
        });
      });
    };
  }, [src]);

  return (
    <img
      ref={imgRef}
      src={src}
      alt={alt}
      className={className}
      style={{ ...cropStyle, objectFit: 'cover' }} // Merge objectPosition ที่คำนวณได้
    />
  );
}