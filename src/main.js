document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  const baseInput = document.getElementById("baseImageInput");
  const previewImg = document.getElementById("preview");
  const previewContainer = document.getElementById("preview-container");
  const downloadPngBtn = document.getElementById("downloadPngBtn");
  const downloadJpegBtn = document.getElementById("downloadJpegBtn");

  const getValue = (name) =>
    document.querySelector(`input[name="${name}"]:checked`).value;

  let baseImage = null;
  let outputSize = 1000;
  let supportsWebP = false;

  const checkWebPSupport = async () => {
    if (!self.createImageBitmap) return false;
    const webpData = 'data:image/webp;base64,UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA=';
    const blob = await fetch(webpData).then((r) => r.blob());
    return createImageBitmap(blob).then(
      () => true,
      () => false,
    );
  };

  checkWebPSupport().then((result) => {
    supportsWebP = result;
  });

  function getFramePath() {
    // const baseURL = "./media/";
    const baseURL = "https://media.ikada.net/skyframe/";

    let theme = getValue("theme");
    let transparency = getValue("transparency");
    let fontcolor = getValue("fontcolor");
    const text = getValue("text");
    if (theme === "strong") {
      if (transparency !== "a") {
        console.warn("Strong theme supports only one transparency option. Adjusted automatically.");
      }
      transparency = "a";
    }

    const ext = supportsWebP ? "webp" : "png";
    const filename = `frame_${theme}_${transparency}_${fontcolor}_${text}.${ext}`;
    return `${baseURL}${filename}`;
  }

  baseInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        baseImage = img;
        updateCanvasSize();
        updatePreview();
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });

  function updateCanvasSize() {
    if (!baseImage) return;
    const minSide = Math.min(baseImage.width, baseImage.height);
    outputSize = Math.min(minSide, 1000);
    canvas.width = outputSize;
    canvas.height = outputSize;
  }

  function drawComposite(callback) {
    if (!baseImage) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const size = Math.min(baseImage.width, baseImage.height);
    const sx = (baseImage.width - size) / 2;
    const sy = (baseImage.height - size) / 2;
    ctx.drawImage(baseImage, sx, sy, size, size, 0, 0, outputSize, outputSize);

    const frameUrl = getFramePath();
    const frame = new Image();
    frame.crossOrigin = "anonymous";

    frame.onload = () => {
      ctx.drawImage(frame, 0, 0, outputSize, outputSize);
      if (callback) callback();
    };

    frame.onerror = () => {
      if (frameUrl.endsWith(".webp")) {
        const fallback = frameUrl.replace(".webp", ".png");
        console.warn(`WebP not loaded, falling back to PNG: ${fallback}`);
        frame.src = fallback;
      } else {
        alert("Failed to load overlay frame image.");
        if (callback) callback();
      }
    };

    frame.src = frameUrl;
  }

  ;
  function updatePreview() {
    if (!baseImage) return;
    drawComposite(() => {
      const dataUrl = canvas.toDataURL("image/png");
      previewImg.src = dataUrl;
      previewContainer.classList.remove("hidden");

      const timeline = document.getElementById("timeline-preview");
      const timelineIcon = document.getElementById("timeline-icon");

      if (timeline && timelineIcon) {
        timeline.classList.remove("hidden");
        timelineIcon.src = dataUrl;
      }
      console.log("timelineIcon element:", timelineIcon);
      console.log("new src:", dataUrl.slice(0, 50));
      console.log("timelineIcon.src (after):", timelineIcon.src);
    });
  }

  document.querySelectorAll('input[type="radio"]').forEach((el) => {
    el.addEventListener("change", () => {
      if (baseImage) updatePreview();
    });
  });

  function downloadImage(format) {
    if (!baseImage) {
      alert("Please select an image first.");
      return;
    }
    drawComposite(() => {
      const mime = format === "jpeg" ? "image/jpeg" : "image/png";
      canvas.toBlob((blob) => {
        if (!blob) return;
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const url = URL.createObjectURL(blob);
        if (isIOS) {
          window.open(url, "_blank");
          alert("On iPhone, tap and hold the image to save it to Photos.");
        } else {
          const a = document.createElement("a");
          a.href = url;
          a.download = `skyframe.${format}`;
          a.style.display = "none";
          document.body.appendChild(a);
          a.click();
          a.remove();
        }
        setTimeout(() => URL.revokeObjectURL(url), 2000);
      }, mime, format === "jpeg" ? 0.92 : undefined);
    });
  }

  downloadPngBtn.addEventListener("click", () => downloadImage("png"));
  downloadJpegBtn.addEventListener("click", () => downloadImage("jpeg"));
});
