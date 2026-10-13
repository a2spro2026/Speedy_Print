/** Nom de fichier sûr (Windows / macOS) à partir d'un numéro de document. */
export function safePdfFileName(name: string, fallback = "document"): string {
  return (name || fallback)
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, "_");
}

/**
 * Convertit un document HTML imprimable (une ou plusieurs `.page` A4) en PDF
 * et lance le téléchargement.
 */
export async function downloadHtmlAsPdf(
  html: string,
  fileName: string
): Promise<boolean> {
  if (typeof document === "undefined") return false;

  const host = document.createElement("div");
  host.setAttribute("aria-hidden", "true");
  host.style.cssText =
    "position:fixed;left:-10000px;top:0;width:210mm;overflow:hidden;pointer-events:none;opacity:0;";
  document.body.appendChild(host);

  try {
    const iframe = document.createElement("iframe");
    iframe.style.cssText = "width:210mm;height:297mm;border:0;";
    host.appendChild(iframe);

    const doc = iframe.contentDocument;
    const win = iframe.contentWindow;
    if (!doc || !win) return false;

    doc.open();
    doc.write(html);
    doc.close();

    await new Promise<void>((resolve) => {
      const done = () => resolve();
      if (doc.readyState === "complete") done();
      else win.addEventListener("load", done, { once: true });
      setTimeout(done, 800);
    });

    const images = Array.from(doc.images || []);
    await Promise.all(
      images.map(
        (img) =>
          new Promise<void>((resolve) => {
            if (img.complete) resolve();
            else {
              img.addEventListener("load", () => resolve(), { once: true });
              img.addEventListener("error", () => resolve(), { once: true });
            }
          })
      )
    );
    // Laisse le rendu CSS / fond se stabiliser
    await new Promise((r) => setTimeout(r, 200));

    const pages = Array.from(doc.querySelectorAll(".page")) as HTMLElement[];
    if (pages.length === 0) return false;

    iframe.style.height = `${pages.length * 297}mm`;

    const html2canvas = (await import("html2canvas")).default;
    const { jsPDF } = await import("jspdf");

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    });

    for (let i = 0; i < pages.length; i += 1) {
      const page = pages[i];
      const canvas = await html2canvas(page, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
        width: page.offsetWidth,
        height: page.offsetHeight,
        windowWidth: page.offsetWidth,
        windowHeight: page.offsetHeight,
      });
      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      if (i > 0) pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, 0, 210, 297, undefined, "FAST");
    }

    pdf.save(`${safePdfFileName(fileName)}.pdf`);
    return true;
  } catch {
    return false;
  } finally {
    host.remove();
  }
}
