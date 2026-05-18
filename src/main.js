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

  const messages = {
    en: {
      unsupportedFormat:
        "Unsupported file format. Please upload a JPEG, PNG, or WebP image.",

      fileTooLarge:
        "File size exceeds 10MB. Please upload a smaller image.",

      failedBaseImage:
        "Failed to load the image. Please try again with a different file.",

      failedOverlay:
        "Unable to load the overlay image. Please try again later.",

      selectImageFirst:
        "Please select an image first.",

      overlayLoadFailed:
        "Failed to load overlay frame image after attempts.",
    },

    ja: {
      unsupportedFormat:
        "対応していない画像形式です。JPEG、PNG、WebP画像を選択してください。",

      fileTooLarge:
        "画像サイズが10MBを超えています。より小さい画像を選択してください。",

      failedBaseImage:
        "画像を読み込めませんでした。別のファイルをお試しください。",

      failedOverlay:
        "オーバーレイ画像を読み込めませんでした。時間をおいて再度お試しください。",

      selectImageFirst:
        "先に画像を選択してください。",

      overlayLoadFailed:
        "オーバーレイ画像の読み込みに失敗しました。",
    }
  };

  const lang =
    document.documentElement.lang === "ja" ? "ja" : "en";

  const t = (key) => messages[lang][key] || key;

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

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      alert(t("unsupportedFormat"));
      return;
    }

    const maxSizeInBytes = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSizeInBytes) {
      alert(t("fileTooLarge"));
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        baseImage = img;
        updateCanvasSize();
        updatePreview();
      };
      img.onerror = () => {
        alert(t("failedBaseImage"));
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

    let fallbackAttempt = 0;

    frame.onload = () => {
      ctx.drawImage(frame, 0, 0, outputSize, outputSize);
      if (callback) callback();
    };

    frame.onerror = () => {
      if (fallbackAttempt === 0 && frameUrl.endsWith(".webp")) {
        const fallback = frameUrl.replace(".webp", ".png");
        console.warn(`WebP not loaded, falling back to PNG: ${fallback}`);
        frame.src = fallback;
        fallbackAttempt++;
      } else {
        console.error(t("overlayLoadFailed"));
        alert(t("failedOverlay"));
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

  let debounceTimeout;

  document.querySelectorAll('input[type="radio"]').forEach((el) => {
    el.addEventListener("change", () => {
      if (!baseImage) return;

      clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(() => {
        updatePreview();
      }, 500);
    });
  });

  function downloadImage(format) {
    if (!baseImage) {
      alert(t("selectImageFirst"));
      return;
    }

    const mime = format === "jpeg" ? "image/jpeg" : "image/png";
    if (!canvas.toBlob) {
      const dataUrl = canvas.toDataURL(mime);
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `skyframe.${format}`;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      a.remove();
      return;
    }

    drawComposite(() => {
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `skyframe.${format}`;
        a.style.display = "none";
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
      }, mime);
    });
  }

  downloadPngBtn.addEventListener("click", () => downloadImage("png"));
  downloadJpegBtn.addEventListener("click", () => downloadImage("jpeg"));
});
