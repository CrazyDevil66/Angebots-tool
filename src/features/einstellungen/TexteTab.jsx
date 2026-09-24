import { FileText } from 'lucide-react';
import FormField, { Textarea } from '../../components/FormField';
import Section from './Section';

export default function TexteTab({ firma, setFeld: set }) {
  return (
    <Section icon={FileText} title="Textvorlagen">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Einleitungstext — Angebot">
          <Textarea
            value={firma.einleitungAngebot ?? ''}
            onChange={e => set('einleitungAngebot', e.target.value)}
            rows={4}
            placeholder="vielen Dank für Ihr Interesse…"
          />
        </FormField>
        <FormField label="Einleitungstext — Rechnung">
          <Textarea
            value={firma.einleitungRechnung ?? ''}
            onChange={e => set('einleitungRechnung', e.target.value)}
            rows={4}
            placeholder="vielen Dank für Ihren Auftrag…"
          />
        </FormField>
        <FormField label="Hinweise — Angebot">
          <Textarea
            value={firma.hinweiseAngebot ?? ''}
            onChange={e => set('hinweiseAngebot', e.target.value)}
            rows={5}
            placeholder="Zahlungsziel: 14 Tage netto · Angebot freibleibend."
          />
        </FormField>
        <FormField label="Hinweise — Rechnung">
          <Textarea
            value={firma.hinweiseRechnung ?? ''}
            onChange={e => set('hinweiseRechnung', e.target.value)}
            rows={5}
            placeholder="Zahlungsziel: 14 Tage nach Rechnungseingang ohne Abzug."
          />
        </FormField>
      </div>
    </Section>
  );
}
