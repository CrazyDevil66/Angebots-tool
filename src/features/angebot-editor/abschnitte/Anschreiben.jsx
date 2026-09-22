import { FileText } from 'lucide-react';
import Collapse from '../../../components/Collapse';
import FormField, { Input, Textarea } from '../../../components/FormField';

export default function Anschreiben({ data, set }) {
  return (
    <Collapse title="Anschreiben" icon={FileText}>
      <div className="flex flex-col gap-4">
        <FormField label="Betreff">
          <Input value={data.betreff} onChange={e => set('betreff', e.target.value)} placeholder="Angebot für Umbaumaßnahmen" />
        </FormField>
        <FormField label="Einleitungstext">
          <Textarea value={data.einleitung} onChange={e => set('einleitung', e.target.value)} rows={3} />
        </FormField>
      </div>
    </Collapse>
  );
}
