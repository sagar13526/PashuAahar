/**
 * Client-Side Image Feature Extraction for PashuAahar
 * Matches OpenCV HSV logic from backend/image_features.py
 * Runs 100% offline in browser using Canvas API.
 */

export const IMAGE_PRESETS = {
  clean: {
    dark_green_ratio: 0.01,
    white_crystal_ratio: 0.02,
    sand_ratio: 0.01,
    avg_brightness: 132.0,
    label: "Clean & Uniform"
  },
  mouldy: {
    dark_green_ratio: 0.28,
    white_crystal_ratio: 0.04,
    sand_ratio: 0.02,
    avg_brightness: 82.0,
    label: "Mould / Fungal Patches"
  },
  sandy: {
    dark_green_ratio: 0.02,
    white_crystal_ratio: 0.05,
    sand_ratio: 0.29,
    avg_brightness: 145.0,
    label: "Sand / Silica Contamination"
  }
};

/**
 * Extracts HSV color indicators from an HTML Image or Blob/File offline.
 * Exactly mirrors backend/image_features.py thresholds:
 * 1. Mould proxy (dark green & dark pixels): H 25-85, S 35-255, V 20-100 OR V < 35
 * 2. White crystal proxy (salt/bright minerals): S < 35 and V > 180
 * 3. Sand/grit proxy (grey/sandy hue): H 15-35, S 30-140, V 90-190
 * 4. Average Brightness (mean V 0-255)
 */
export async function extractFeaturesFromImageFile(fileOrBlob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          // Scale down for ultra-fast offline processing
          const maxDim = 256;
          let width = img.width;
          let height = img.height;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          const imageData = ctx.getImageData(0, 0, width, height);
          const data = imageData.data;
          const totalPixels = width * height;

          let darkGreenCount = 0;
          let whiteCrystalCount = 0;
          let sandCount = 0;
          let brightnessSum = 0;

          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            const rNorm = r / 255;
            const gNorm = g / 255;
            const bNorm = b / 255;
            const max = Math.max(rNorm, gNorm, bNorm);
            const min = Math.min(rNorm, gNorm, bNorm);
            const diff = max - min;

            // Value (0..255 in OpenCV)
            const vCv = max * 255;
            // Saturation (0..255 in OpenCV)
            const sCv = max === 0 ? 0 : (diff / max) * 255;

            // Hue (0..180 in OpenCV)
            let hDeg = 0;
            if (diff > 0) {
              if (max === rNorm) {
                hDeg = 60 * (((gNorm - bNorm) / diff) % 6);
              } else if (max === gNorm) {
                hDeg = 60 * (((bNorm - rNorm) / diff) + 2);
              } else {
                hDeg = 60 * (((rNorm - gNorm) / diff) + 4);
              }
              if (hDeg < 0) hDeg += 360;
            }
            const hCv = hDeg / 2;

            brightnessSum += vCv;

            // 1. Dark green or very dark (mould proxy)
            const isGreen = (hCv >= 25 && hCv <= 85 && sCv >= 35 && vCv >= 20 && vCv <= 100);
            const isDark = (vCv < 35);
            if (isGreen || isDark) {
              darkGreenCount++;
            }

            // 2. White / crystalline bright pixels (salt proxy)
            if (sCv < 35 && vCv > 180) {
              whiteCrystalCount++;
            }

            // 3. Sandy / grit texture (silica proxy)
            if (hCv >= 15 && hCv <= 35 && sCv >= 30 && sCv <= 140 && vCv >= 90 && vCv <= 190) {
              sandCount++;
            }
          }

          const dark_green_ratio = totalPixels > 0 ? Number((darkGreenCount / totalPixels).toFixed(3)) : 0.01;
          const white_crystal_ratio = totalPixels > 0 ? Number((whiteCrystalCount / totalPixels).toFixed(3)) : 0.02;
          const sand_ratio = totalPixels > 0 ? Number((sandCount / totalPixels).toFixed(3)) : 0.01;
          const avg_brightness = totalPixels > 0 ? Number((brightnessSum / totalPixels).toFixed(1)) : 120.0;

          // Also generate a compact thumbnail preview DataURL (max 160px)
          const thumbCanvas = document.createElement("canvas");
          const thumbMax = 160;
          let tw = img.width;
          let th = img.height;
          if (tw > thumbMax || th > thumbMax) {
            if (tw > th) {
              th = Math.round((th * thumbMax) / tw);
              tw = thumbMax;
            } else {
              tw = Math.round((tw * thumbMax) / th);
              th = thumbMax;
            }
          }
          thumbCanvas.width = tw;
          thumbCanvas.height = th;
          const thumbCtx = thumbCanvas.getContext("2d");
          thumbCtx.drawImage(img, 0, 0, tw, th);
          const thumbnailDataUrl = thumbCanvas.toDataURL("image/jpeg", 0.7);

          resolve({
            features: {
              dark_green_ratio,
              white_crystal_ratio,
              sand_ratio,
              avg_brightness,
              label: "Analyzed from Camera / Upload"
            },
            thumbnail: thumbnailDataUrl,
            originalWidth: img.width,
            originalHeight: img.height
          });
        } catch (err) {
          console.error("Error analyzing image canvas:", err);
          resolve({
            features: IMAGE_PRESETS.clean,
            thumbnail: null
          });
        }
      };
      img.onerror = (err) => {
        console.error("Image load error:", err);
        resolve({
          features: IMAGE_PRESETS.clean,
          thumbnail: null
        });
      };
      img.src = e.target.result;
    };
    reader.onerror = (err) => {
      console.error("FileReader error:", err);
      resolve({
        features: IMAGE_PRESETS.clean,
        thumbnail: null
      });
    };
    reader.readAsDataURL(fileOrBlob);
  });
}
