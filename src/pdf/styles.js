import { StyleSheet } from '@react-pdf/renderer';
import { MARKENFARBEN as C } from '../lib/markenfarben';

// 1 mm = 2.835 pt
// DIN 5008 Form B: Anschriftfeld ab 45 mm = 127.6 pt von Oberkante
// Header (paddingV 13×2 + logo max 40 + accentBar 3) ≈ 69 pt ≈ 24.3 mm
// → paddingTop body = 127 - 69 = 58 pt ≈ 20.4 mm → Summe ≈ 44.7 mm ✓

export const s = StyleSheet.create({
  page: {
    fontFamily: 'Orbitron',
    fontSize: 9,
    color: C.textDark,
    backgroundColor: C.white,
    paddingBottom: 60,
    paddingTop: 69,
  },

  // ── HEADER: nur Logo ──────────────────────────────
  header: {
    backgroundColor: C.dark,
    paddingHorizontal: 40,
    paddingVertical: 13,
  },
  headerLogo: {
    maxHeight: 40,
    maxWidth: 150,
    objectFit: 'contain',
  },
  headerFirmaName: {
    fontSize: 15,
    fontWeight: 700,
    color: C.yellow,
    letterSpacing: 1,
  },

  accentBar: {
    height: 3,
    backgroundColor: C.yellow,
  },

  // ── BODY ─────────────────────────────────────────
  body: {
    paddingHorizontal: 40,
    paddingTop: 58,
  },

  // Zweispaltig: links Adressfenster, rechts Dokument-Info
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },

  // ── ADRESSFENSTER (links) ─────────────────────────
  addrCol: {
    width: 240,
  },
  absender: {
    fontSize: 6.5,
    color: C.textLight,
    borderBottomWidth: 0.5,
    borderBottomColor: C.border,
    paddingBottom: 3,
    marginBottom: 6,
  },
  addrName: {
    fontSize: 11,
    fontWeight: 700,
    color: C.textDark,
    marginBottom: 3,
  },
  addrLine: {
    fontSize: 9,
    color: C.textMid,
    marginBottom: 2,
  },

  // ── DOKUMENT-INFO (rechts) ─────────────────────────
  docCol: {
    alignItems: 'flex-end',
  },
  docTitle: {
    fontSize: 24,
    fontWeight: 700,
    color: C.dark,
    letterSpacing: 3,
    marginBottom: 8,
  },
  docMetaRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 3,
  },
  docMetaLabel: {
    fontSize: 8,
    color: C.textLight,
    textAlign: 'right',
    width: 55,
  },
  docMetaValue: {
    fontSize: 8,
    fontWeight: 700,
    color: C.textDark,
    textAlign: 'right',
  },

  // ── BETREFF / EINLEITUNG ─────────────────────────
  subject: {
    fontSize: 11,
    fontWeight: 700,
    color: C.textDark,
    borderLeftWidth: 3,
    borderLeftColor: C.yellow,
    paddingLeft: 10,
    marginBottom: 8,
  },
  intro: {
    fontSize: 9,
    color: C.textMid,
    lineHeight: 1.6,
    marginBottom: 20,
  },

  // ── TABELLE ──────────────────────────────────────
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: C.dark,
    paddingVertical: 7,
    borderRadius: 3,
    marginBottom: 1,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingVertical: 6,
  },
  tableRowAlt: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingVertical: 6,
    backgroundColor: C.bgLight,
  },
  colPos:   { width: '5%',  paddingLeft: 10, fontSize: 8 },
  colDesc:  { width: '44%', paddingLeft: 6 },
  colQty:   { width: '10%', textAlign: 'center' },
  colUnit:  { width: '10%', textAlign: 'center' },
  colPrice: { width: '15%', textAlign: 'right' },
  colTotal: { width: '16%', textAlign: 'right', paddingRight: 10 },
  thText:   { fontSize: 8,   fontWeight: 700, color: C.white },
  tdText:   { fontSize: 9 },
  tdSub:    { fontSize: 7.5, color: C.textLight, marginTop: 1 },

  // ── SUMMEN ───────────────────────────────────────
  totalsBlock: {
    marginTop: 14,
    marginLeft: 'auto',
    width: '36%',
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  totalsLabel: { fontSize: 8.5, color: C.textMid },
  totalsValue: { fontSize: 8.5, color: C.textDark },
  grandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: C.yellow,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 3,
    marginTop: 2,
  },
  grandLabel: { fontSize: 10, fontWeight: 700, color: C.dark },
  grandValue: { fontSize: 10, fontWeight: 700, color: C.dark },

  // ── HINWEISE ─────────────────────────────────────
  notes: {
    marginTop: 28,
    padding: 12,
    backgroundColor: C.bgLight,
    borderLeftWidth: 3,
    borderLeftColor: C.dark,
    borderRadius: 2,
  },
  notesLabel: { fontSize: 8, fontWeight: 700, color: C.dark, marginBottom: 4, letterSpacing: 0.5 },
  notesText:  { fontSize: 8.5, color: C.textMid, lineHeight: 1.6 },
  validity:   { marginTop: 12, fontSize: 8, color: C.textLight },

  // ── MAHNUNG ──────────────────────────────────────
  mahnTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: C.dark,
    letterSpacing: 2,
    marginBottom: 8,
    textAlign: 'right',
  },
  mahnBox: {
    marginTop: 20,
    borderWidth: 1.5,
    borderColor: '#FC8181',
    borderRadius: 4,
    padding: 14,
    backgroundColor: C.bgLight,
  },
  mahnBoxTitle: {
    fontSize: 8,
    fontWeight: 700,
    color: '#C53030',
    marginBottom: 10,
    letterSpacing: 1,
  },
  mahnSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#FED7D7',
  },
  mahnSummaryLabel: { fontSize: 8.5, color: C.textMid },
  mahnSummaryValue: { fontSize: 8.5, color: C.textDark },
  mahnTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#C53030',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 3,
    marginTop: 8,
  },
  mahnTotalLabel: { fontSize: 10, fontWeight: 700, color: C.white },
  mahnTotalValue: { fontSize: 10, fontWeight: 700, color: C.white },

  // ── FOOTER ───────────────────────────────────────
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: C.dark,
    paddingHorizontal: 40,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLeft: {
    flexDirection: 'column',
    gap: 2,
  },
  footerText: { fontSize: 7.5, color: '#6B7A94' },
  footerUstId: { fontSize: 7.5, color: '#8896A8' },
  footerPage: { fontSize: 7.5, color: C.yellow },
});
