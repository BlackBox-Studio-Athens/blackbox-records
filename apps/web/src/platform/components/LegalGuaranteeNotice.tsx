// EU harmonised notice on the legal guarantee of conformity (Implementing Regulation (EU) 2025/1960).
// The artwork is the Commission's unmodified RGB file; provenance and hashes live in
// openspec/changes/add-harmonised-legal-guarantee-notice/validation.md. The transcripts repeat the official text.
const base = () => (import.meta.env.BASE_URL || '/').replace(/\/$/, '');

export const LEGAL_GUARANTEE_COPY = {
  summary: 'Your legal guarantee rights',
  alt: 'EU notice on your legal guarantee rights',
  fullSize: 'Open full size',
  greek: 'Στα ελληνικά',
  information: 'EU legal guarantee information',
  textVersion: 'Text version',
} as const;

const EN_TRANSCRIPT = [
  'Legal guarantee',
  'Minimum two-year legal guarantee protection for goods sold in the European Union.',
  'Consumers can claim their rights under the legal guarantee of conformity, for example if goods: do not match the description; do not function as intended.',
  'Sellers are liable for any lack of conformity which existed when the goods were delivered, and which becomes apparent within the legal guarantee period. Sellers in such a situation are required to offer: free repair or free replacement; in some cases, a price reduction or full reimbursement.',
  'Some countries have a longer legal guarantee period. For second-hand goods, a shorter period may apply, but not less than one year.',
  'For more information on your rights in a specific country, scan the QR code below or ask the seller. europa.eu/youreurope/guarantees',
  'What to do if you receive non-conforming goods: 1. Contact the seller as soon as possible to report the issue; 2. Provide proof of purchase, such as a receipt, invoice, or bank statement.',
  'Sellers and producers may also offer commercial guarantees, which apply independently from the legal guarantee. For example, you may see this GARAN label representing a commercial guarantee of durability offered by the producer at no additional cost and covering the entire good.',
];

const EL_TRANSCRIPT = [
  'Νόμιμη εγγύηση',
  'Ελάχιστη νόμιμη εγγύηση δύο ετών για τα αγαθά που πωλούνται στην Ευρωπαϊκή Ένωση.',
  'Οι καταναλωτές μπορούν να ασκήσουν τα δικαιώματά τους βάσει της νόμιμης εγγύησης συμμόρφωσης, για παράδειγμα εάν τα αγαθά: δεν ανταποκρίνονται στην περιγραφή· δεν λειτουργούν όπως προβλέπεται.',
  'Οι πωλητές ευθύνονται για κάθε έλλειψη συμμόρφωσης που υφίσταται κατά την παράδοση των αγαθών και καθίσταται εμφανής εντός της περιόδου της νόμιμης εγγύησης. Οι πωλητές σε τέτοιες περιπτώσεις υποχρεούνται να προσφέρουν: δωρεάν επισκευή ή δωρεάν αντικατάσταση· σε ορισμένες περιπτώσεις, μείωση του τιμήματος ή πλήρη επιστροφή του τιμήματος.',
  'Ορισμένες χώρες έχουν πιο μακρά περίοδο νόμιμης εγγύησης. Για τα μεταχειρισμένα αγαθά μπορεί να προβλέπεται συντομότερη περίοδος, αλλά όχι μικρότερη του ενός έτους.',
  'Για περισσότερες πληροφορίες σχετικά με τα δικαιώματά σας σε μια ορισμένη χώρα, σαρώστε τον παρακάτω κωδικό QR ή ρωτήστε τον πωλητή. europa.eu/youreurope/εγγυήσεις',
  'Τι πρέπει να κάνετε εάν παραλάβετε μη συμμορφούμενα αγαθά: 1. επικοινωνήστε με τον πωλητή το συντομότερο δυνατόν για να αναφέρετε το πρόβλημα· 2. προσκομίστε παραστατικό αγοράς, όπως απόδειξη, τιμολόγιο ή αντίγραφο κίνησης τραπεζικού λογαριασμού.',
  'Οι πωλητές και οι παραγωγοί μπορούν επίσης να προσφέρουν εμπορικές εγγυήσεις, οι οποίες ισχύουν ανεξάρτητα από τη νόμιμη εγγύηση. Για παράδειγμα, μπορεί να δείτε το σήμα GARAN, που δηλώνει εμπορική εγγύηση όσον αφορά την ανθεκτικότητα η οποία προσφέρεται από τον παραγωγό χωρίς πρόσθετο κόστος και καλύπτει ολόκληρο το αγαθό.',
];

/** Closed native disclosure: the full notice appears on the first click, with no script, history or focus side effects. */
export default function LegalGuaranteeNotice() {
  const en = `${base()}/assets/images/legal/legal-guarantee-notice-en.svg`;
  const el = `${base()}/assets/images/legal/legal-guarantee-notice-el.svg`;
  return (
    <details className="legal-guarantee" data-legal-guarantee>
      <summary>{LEGAL_GUARANTEE_COPY.summary}</summary>
      <div className="legal-guarantee__body">
        <img src={en} alt={LEGAL_GUARANTEE_COPY.alt} width={595} height={842} loading="lazy" decoding="async" />
        <p className="legal-guarantee__links">
          <a href={en} target="_blank" rel="noopener">
            {LEGAL_GUARANTEE_COPY.fullSize}
          </a>
          <a href={el} target="_blank" rel="noopener" lang="el" hrefLang="el">
            {LEGAL_GUARANTEE_COPY.greek}
          </a>
          <a href="https://europa.eu/youreurope/guarantees" target="_blank" rel="noopener noreferrer">
            {LEGAL_GUARANTEE_COPY.information}
          </a>
        </p>
        <details className="legal-guarantee__text">
          <summary>{LEGAL_GUARANTEE_COPY.textVersion}</summary>
          {EN_TRANSCRIPT.map((line) => (
            <p key={line}>{line}</p>
          ))}
          <div lang="el">
            {EL_TRANSCRIPT.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </details>
      </div>
    </details>
  );
}
