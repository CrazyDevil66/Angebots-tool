import { Settings } from 'lucide-react';
import Collapse from '../../../components/Collapse';
import FormField, { Input } from '../../../components/FormField';
import DateInput from '../../../components/DateInput';

export default function AngebotInfos({ data, set, setDatum }) {
  return (
    <Collapse title="Angebots-Informationen" icon={Settings}>
      <div className="grid grid-cols-2 min-[1400px]:grid-cols-4 gap-4">
        <FormField label="Angebotsnummer">
          <Input value={data.angebotNr} onChange={e => set('angebotNr', e.target.value)} placeholder="A-2024-001" />
        </FormField>
        <FormField label="Datum">
          <DateInput value={data.datum} onChange={setDatum} />
        </FormField>
        <FormField label="Gültig bis (auto)">
          <div className="w-full px-3 py-2 text-sm border border-slate-100 rounded-lg bg-slate-50 text-slate-400 select-none">
            {data.gueltigBis || '—'}
          </div>
        </FormField>
        <FormField label="MwSt. (%)">
          <Input type="number" value={data.mwstSatz} onChange={e => set('mwstSatz', e.target.value)} />
        </FormField>
      </div>
    </Collapse>
  );
}
