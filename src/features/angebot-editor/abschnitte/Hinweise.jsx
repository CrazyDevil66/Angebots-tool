import { FileText } from 'lucide-react';
import Collapse from '../../../components/Collapse';
import FormField, { Textarea } from '../../../components/FormField';

export default function Hinweise({ hinweise, set }) {
  return (
    <Collapse title="Hinweise & Zahlungsbedingungen" icon={FileText} defaultOpen={false}>
      <FormField label="Hinweistext">
        <Textarea value={hinweise} onChange={e => set('hinweise', e.target.value)} rows={4} placeholder="Zahlungsziel: 14 Tage netto…" />
      </FormField>
    </Collapse>
  );
}
