(() => {
  "use strict";

  const source = document.getElementById("source");
  const slot = document.getElementById("slot");
  const cropButton = document.getElementById("crop");
  const message = document.getElementById("message");
  const preview = document.getElementById("preview");
  const emptyPreview = document.getElementById("emptyPreview");
  const metadata = document.getElementById("metadata");
  let previewUrl = "";

  function report(text, error = false) {
    message.textContent = text;
    message.classList.toggle("error", error);
  }

  function releasePreview() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = "";
  }

  source.addEventListener("change", () => {
    const file = source.files?.[0] || null;
    cropButton.disabled = !file;
    report(file ? `${file.name} is ready to crop.` : "No image selected.");
  });

  cropButton.addEventListener("click", async () => {
    const file = source.files?.[0] || null;
    if (!file) return;
    cropButton.disabled = true;
    report("Opening the crop window…");
    try {
      const cropped = await window.AliaSpacesProfileCrop.open({ file, slot: slot.value });
      if (!cropped) {
        report("Crop canceled. The original image remains local.");
        return;
      }
      releasePreview();
      previewUrl = URL.createObjectURL(cropped);
      preview.src = previewUrl;
      preview.hidden = false;
      emptyPreview.hidden = true;
      metadata.textContent = `${cropped.name} · ${cropped.type} · ${Math.max(1, Math.round(cropped.size / 1024))} KB`;
      report("Crop created locally. Nothing was uploaded or saved.");
    } catch (error) {
      report(error instanceof Error ? error.message : "The image could not be cropped.", true);
    } finally {
      cropButton.disabled = !source.files?.[0];
    }
  });

  window.addEventListener("pagehide", releasePreview, { once: true });
})();
