/**
 * Impression HTML sans popup (iframe) — évite les bloqueurs de pop-ups en production.
 */
export function printHtmlDocument(html: string): boolean {
  if (typeof document === "undefined") return false;

  const existing = document.getElementById("speedyprint-print-frame");
  if (existing) existing.remove();

  const iframe = document.createElement("iframe");
  iframe.id = "speedyprint-print-frame";
  iframe.setAttribute("title", "Impression");
  iframe.style.cssText =
    "position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0;pointer-events:none;";
  document.body.appendChild(iframe);

  const win = iframe.contentWindow;
  const doc = iframe.contentDocument || win?.document;
  if (!win || !doc) {
    iframe.remove();
    return false;
  }

  doc.open();
  doc.write(html);
  doc.close();

  const cleanup = () => {
    setTimeout(() => {
      try {
        iframe.remove();
      } catch {
        /* ignore */
      }
    }, 1500);
  };

  const doPrint = () => {
    try {
      win.focus();
      win.print();
    } catch {
      /* ignore */
    } finally {
      cleanup();
    }
  };

  const waitImagesThenPrint = () => {
    const images = Array.from(doc.images || []);
    if (images.length === 0) {
      setTimeout(doPrint, 200);
      return;
    }
    let pending = images.length;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      setTimeout(doPrint, 250);
    };
    const tick = () => {
      pending -= 1;
      if (pending <= 0) finish();
    };
    for (const img of images) {
      if (img.complete) tick();
      else {
        img.addEventListener("load", tick, { once: true });
        img.addEventListener("error", tick, { once: true });
      }
    }
    // Filet de sécurité si une image ne charge pas
    setTimeout(finish, 2500);
  };

  if (doc.readyState === "complete") {
    waitImagesThenPrint();
  } else {
    win.addEventListener("load", waitImagesThenPrint, { once: true });
    setTimeout(waitImagesThenPrint, 800);
  }

  return true;
}
