// @react-pdf/renderer ist der größte Teil des Bundles – er wird erst beim ersten PDF geladen.
export async function generatePDF(...args) {
  const modul = await import('./generatePDF');
  return modul.generatePDF(...args);
}
