import { useRef } from 'react';
import { Building2, ImagePlus, Trash2, CreditCard, Download } from 'lucide-react';
import FormField, { Input } from '../../components/FormField';
import Section from './Section';
import Datensicherung from './Datensicherung';

export default function FirmaTab({ firma, setFeld, istAdmin, token, setFirma, setKunden, setKatalog, setAngebote }) {
  const fileRef = useRef(null);
  const set = setFeld;

  function handleLogoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => set('logo', ev.target.result);
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  return (
    <>
      {/* Logo */}
      <Section icon={ImagePlus} title="Firmen-Logo">
        <div className="flex items-center gap-5">
          {firma.logo ? (
            <>
              <div className="w-28 h-14 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                <img src={firma.logo} alt="Logo" className="max-w-full max-h-full object-contain" />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-indigo-600 border border-indigo-200 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-all"
                >
                  <ImagePlus size={13} />
                  Austauschen
                </button>
                <button
                  onClick={() => set('logo', null)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                >
                  <Trash2 size={13} />
                  Entfernen
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-3 px-4 py-2.5 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:border-indigo-300 hover:text-indigo-500 hover:bg-indigo-50/50 transition-all"
            >
              <ImagePlus size={18} />
              <div className="text-left">
                <div className="text-sm font-medium">Logo hochladen</div>
                <div className="text-xs text-slate-400">PNG, JPG oder SVG</div>
              </div>
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
        </div>
      </Section>

      {/* Firmendaten */}
      <Section icon={Building2} title="Firmendaten">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Firmenname" className="sm:col-span-2">
            <Input value={firma.name} onChange={e => set('name', e.target.value)} placeholder="Muster GmbH" />
          </FormField>
          <FormField label="Straße">
            <Input value={firma.strasse} onChange={e => set('strasse', e.target.value)} placeholder="Musterstraße 1" />
          </FormField>
          <div className="grid grid-cols-[90px_1fr] gap-2">
            <FormField label="PLZ">
              <Input value={firma.plz} onChange={e => set('plz', e.target.value)} placeholder="12345" />
            </FormField>
            <FormField label="Ort">
              <Input value={firma.ort} onChange={e => set('ort', e.target.value)} placeholder="Berlin" />
            </FormField>
          </div>
          <FormField label="Telefon">
            <Input value={firma.telefon} onChange={e => set('telefon', e.target.value)} placeholder="+49 30 123456" />
          </FormField>
          <FormField label="E-Mail">
            <Input type="email" value={firma.email} onChange={e => set('email', e.target.value)} placeholder="info@firma.de" />
          </FormField>
          <FormField label="Website">
            <Input value={firma.web} onChange={e => set('web', e.target.value)} placeholder="www.firma.de" />
          </FormField>
          <FormField label="USt-ID">
            <Input value={firma.ustId} onChange={e => set('ustId', e.target.value)} placeholder="DE123456789" />
          </FormField>
        </div>
      </Section>

      {/* Bankverbindung */}
      <Section icon={CreditCard} title="Bankverbindung">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Kontoinhaber" className="sm:col-span-2">
            <Input value={firma.kontoinhaber ?? ''} onChange={e => set('kontoinhaber', e.target.value)} placeholder="Max Mustermann" />
          </FormField>
          <FormField label="IBAN" className="sm:col-span-2">
            <Input value={firma.iban ?? ''} onChange={e => set('iban', e.target.value.toUpperCase())} placeholder="DE12 3456 7890 1234 5678 90" />
          </FormField>
          <FormField label="BIC">
            <Input value={firma.bic ?? ''} onChange={e => set('bic', e.target.value.toUpperCase())} placeholder="BELADEBEXXX" />
          </FormField>
          <FormField label="Kreditinstitut">
            <Input value={firma.bank ?? ''} onChange={e => set('bank', e.target.value)} placeholder="Musterbank" />
          </FormField>
          <FormField label="Standard-Mahngebühr (€)">
            <Input type="number" step="0.01" value={firma.mahngebuehr ?? '5.00'} onChange={e => set('mahngebuehr', e.target.value)} placeholder="5.00" />
          </FormField>
        </div>
      </Section>

      {istAdmin && (
        <Section icon={Download} title="Datensicherung">
          <Datensicherung
            token={token}
            setFirma={setFirma}
            setKunden={setKunden}
            setKatalog={setKatalog}
            setAngebote={setAngebote}
          />
        </Section>
      )}
    </>
  );
}
