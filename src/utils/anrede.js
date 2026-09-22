export function briefAnrede(anrede, name) {
  if (anrede === 'Herr') return `Sehr geehrter Herr ${name || ''},`;
  if (anrede === 'Frau') return `Sehr geehrte Frau ${name || ''},`;
  return 'Sehr geehrte Damen und Herren,';
}

export function einleitungMitAnrede(anrede, name, vorlage) {
  return `${briefAnrede(anrede, name)}\n\n${vorlage}`;
}
