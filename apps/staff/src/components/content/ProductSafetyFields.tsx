import { useEffect, useState } from 'react';
import { countryOptions, getProductSafetyIssues, productSafetyContentSchema } from '@blackbox/content-model';
import { BadgeCheck, ShieldCheck } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { NativeSelect } from '../ui/native-select';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from '../ui/field';

type Safety = Record<string, unknown>;
type Spec = {
  label: string;
  hint?: string;
  missing: string;
  kind?: 'textarea' | 'date' | 'select';
  options?: ReadonlyArray<readonly [string, string]>;
  lang?: string;
};

const euCountryCodes: readonly string[] = productSafetyContentSchema.shape.responsible_person
  .unwrap()
  .shape.eu_country.unwrap().options;
const euCountries = countryOptions
  .filter(({ code }) => euCountryCodes.includes(code))
  .map(({ code, name }) => [code, name] as const);
const contactHint = "An email address or a direct contact page (https://…). A homepage isn't enough.";
const contactMissing = 'Enter an email address or an https:// contact page.';
const addressHint = 'Full address including postcode and country.';

const specs: Record<string, Spec> = {
  product_type: {
    label: 'What is the product?',
    hint: 'What the buyer gets, e.g. "12-inch vinyl LP", "CD in jewel case", "Cassette", "T-shirt".',
    missing: 'Enter what the product is, e.g. 12-inch vinyl LP.',
  },
  product_identifier: {
    label: 'Catalogue number or batch code',
    hint: 'The code that identifies this exact pressing, usually the catalogue number on the spine or centre label (e.g. BBX-014). For a repress, add the batch too (e.g. BBX-014 · 2nd press 2026).',
    missing: 'Enter the catalogue number printed on this edition, e.g. BBX-014.',
  },
  operator_role: {
    label: 'Our role for this item',
    hint: 'Pick what the order or invoice shows.',
    missing: 'Choose our role for this item.',
    kind: 'select',
    options: [
      ['', 'Choose…'],
      ['manufacturer', 'We had it made under our name (manufacturer)'],
      ['distributor', 'We bought finished copies in the EU (distributor)'],
      ['importer', 'We brought it in from outside the EU (importer)'],
    ],
  },
  'manufacturer.name': {
    label: 'Name',
    hint: 'The person or company the product is made by, or made for and sold under the name of. The pressing plant can be different.',
    missing: "Enter the manufacturer's name.",
  },
  'manufacturer.establishment': {
    label: 'Where is the manufacturer based?',
    missing: 'Choose where the manufacturer is based.',
    kind: 'select',
    options: [
      ['', 'Not known yet'],
      ['eu', 'In the EU'],
      ['non_eu', 'Outside the EU'],
    ],
  },
  'manufacturer.postal_address': {
    label: 'Postal address',
    hint: addressHint,
    missing: "Enter the manufacturer's full postal address.",
    kind: 'textarea',
  },
  'manufacturer.electronic_address': { label: 'Email or contact page', hint: contactHint, missing: contactMissing },
  'responsible_person.name': {
    label: 'Name',
    hint: 'The EU company named on the paperwork as responsible for this product.',
    missing: "Enter the EU contact person's name.",
  },
  'responsible_person.postal_address': {
    label: 'Postal address',
    hint: addressHint,
    missing: "Enter the EU contact person's full postal address.",
    kind: 'textarea',
  },
  'responsible_person.electronic_address': {
    label: 'Email or contact page',
    hint: contactHint,
    missing: contactMissing,
  },
  'responsible_person.eu_country': {
    label: 'EU country',
    hint: 'The EU country where the contact person is based.',
    missing: 'Choose the EU country where the contact person is based.',
    kind: 'select',
    options: [['', 'Choose…'], ...euCountries],
  },
  'safety_information.status': {
    label: 'Does it need warnings or instructions?',
    missing: 'Choose whether this product needs warnings.',
    kind: 'select',
    options: [
      ['', 'Not checked yet'],
      ['provided', 'Yes, add them below'],
      ['not_required', 'No, checked: safe to use without them'],
    ],
  },
  'safety_information.text_el': {
    label: 'Warnings in Greek',
    hint: 'Copy them exactly from the supplier, in Greek, e.g. "Φυλάσσετε μακριά από πηγές θερμότητας."',
    missing: 'Add the warnings in Greek.',
    kind: 'textarea',
    lang: 'el',
  },
  'evidence.reference': {
    label: 'Where the proof is kept',
    hint: 'e.g. "Invoice 2026-031, Drive › Suppliers › Plant X".',
    missing: 'Say where the proof is kept.',
  },
  'evidence.checked_on': { label: 'Checked on', missing: 'Enter the date you checked the proof.', kind: 'date' },
  'evidence.notes': {
    label: 'Notes',
    hint: 'How you know the role, contacts and warnings above are right.',
    missing: 'Add a short note on how you checked.',
    kind: 'textarea',
  },
};
const responsiblePersonMissing = 'Add the EU contact person for a manufacturer outside the EU.';

const isRecord = (value: unknown): value is Safety => !!value && typeof value === 'object' && !Array.isArray(value);
const read = (data: Safety, path: string) =>
  path.split('.').reduce<unknown>((current, key) => (isRecord(current) ? current[key] : undefined), data);

// Readiness check with empty groups present, so missing details are reported per field rather than per group.
function readinessIssues(data: Safety) {
  const nonEu = read(data, 'manufacturer.establishment') === 'non_eu';
  return getProductSafetyIssues({
    ...data,
    manufacturer: { ...(isRecord(data.manufacturer) ? data.manufacturer : {}) },
    safety_information: { ...(isRecord(data.safety_information) ? data.safety_information : {}) },
    evidence: { ...(isRecord(data.evidence) ? data.evidence : {}) },
    ...(nonEu || data.responsible_person !== undefined
      ? { responsible_person: { ...(isRecord(data.responsible_person) ? data.responsible_person : {}) } }
      : {}),
    review_status: 'verified',
  }).map((issue) => ({ path: issue.path.slice(1).join('.'), message: issue.message }));
}

export default function ProductSafetyFields({
  value,
  onChange,
  disabled = false,
  validationAttempt = 0,
}: {
  value: unknown;
  onChange(next: Safety): void;
  disabled?: boolean;
  validationAttempt?: number;
}) {
  const data = isRecord(value) ? value : {};
  const saveIssues = (productSafetyContentSchema.safeParse(data).error?.issues ?? []).map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
  }));
  const missing = readinessIssues(data);
  const issues = new Map<string, string>();
  for (const issue of [...saveIssues, ...missing]) if (!issues.has(issue.path)) issues.set(issue.path, issue.message);
  const [touched, setTouched] = useState<Set<string>>(() => new Set());
  const [open, setOpen] = useState(saveIssues.length > 0);
  useEffect(() => {
    if (validationAttempt > 0 && saveIssues.length > 0) setOpen(true);
  }, [validationAttempt]);
  const verified = data.review_status === 'verified';
  const checkedOn = read(data, 'evidence.checked_on');
  const nonEu = read(data, 'manufacturer.establishment') === 'non_eu';
  const shown = (path: string) => validationAttempt > 0 || touched.has(path);
  const unmapped = [...issues]
    // Group-level paths (e.g. a missing "evidence" group) are already reported on each field.
    .filter(([path]) => !specs[path] && !Object.keys(specs).some((key) => key.startsWith(`${path}.`)))
    .map(([, message]) => message);

  function message(path: string) {
    if (
      path === 'safety_information.status' &&
      read(data, 'safety_information.status') === 'not_required' &&
      read(data, 'safety_information.text_el')
    )
      return 'Choose "Yes, add them below" when you\'ve written warnings.';
    return specs[path]?.missing ?? issues.get(path) ?? '';
  }

  function update(path: string, input: string) {
    const next = structuredClone(data);
    const parts = path.split('.');
    let parent = next;
    for (const key of parts.slice(0, -1)) {
      if (!isRecord(parent[key])) parent[key] = {};
      parent = parent[key] as Safety;
    }
    // Empty means "not known yet": remove the key instead of storing a placeholder.
    if (input.trim() === '') {
      delete parent[parts.at(-1)!];
      for (let depth = parts.length - 1; depth > 0; depth--) {
        const holder = depth === 1 ? next : (read(next, parts.slice(0, depth - 1).join('.')) as Safety);
        const key = parts[depth - 1]!;
        if (isRecord(holder[key]) && Object.keys(holder[key]).length === 0) delete holder[key];
      }
    } else parent[parts.at(-1)!] = input;
    if (verified && !path.startsWith('evidence.') && path !== 'operator_role') next.review_status = 'incomplete';
    onChange(next);
  }

  function control(path: string) {
    const spec = specs[path]!;
    const id = `content-product_safety.${path}`;
    const hintId = `${id}-hint`;
    const errorId = `${id}-error`;
    const errors = shown(path) && issues.has(path) ? [message(path)] : [];
    const props = {
      id,
      'data-content-path': `product_safety.${path}`,
      value: String(read(data, path) ?? ''),
      disabled,
      'aria-invalid': errors.length > 0 || undefined,
      'aria-describedby':
        [spec.hint ? hintId : '', errors.length ? errorId : ''].filter(Boolean).join(' ') || undefined,
      onBlur: () => setTouched((current) => (current.has(path) ? current : new Set(current).add(path))),
      onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        update(path, event.target.value),
    };
    return (
      <Field
        key={path}
        className={spec.kind === 'textarea' ? 'col-span-full min-w-0' : 'min-w-0'}
        data-invalid={errors.length > 0}
      >
        <FieldLabel htmlFor={id}>{spec.label}</FieldLabel>
        {spec.kind === 'select' ? (
          <NativeSelect {...props} className="min-h-11 w-full min-w-0">
            {spec.options!.map(([option, label]) => (
              <option key={option} value={option}>
                {label}
              </option>
            ))}
          </NativeSelect>
        ) : spec.kind === 'textarea' ? (
          <Textarea {...props} lang={spec.lang} className="min-h-11 w-full min-w-0" rows={3} />
        ) : (
          <Input {...props} type={spec.kind === 'date' ? 'date' : 'text'} className="min-h-11 w-full min-w-0" />
        )}
        {spec.hint && <FieldDescription id={hintId}>{spec.hint}</FieldDescription>}
        <FieldError id={errorId}>{errors.join(' ')}</FieldError>
      </Field>
    );
  }

  function group(legend: string, paths: string[], help?: string, error?: string) {
    return (
      <FieldSet className="col-span-full min-w-0 gap-4">
        <FieldLegend>{legend}</FieldLegend>
        {help && <FieldDescription>{help}</FieldDescription>}
        {error && <FieldError>{error}</FieldError>}
        <FieldGroup className="grid min-w-0 gap-6 @2xl:grid-cols-2">{paths.map(control)}</FieldGroup>
      </FieldSet>
    );
  }

  const count = missing.length;
  return (
    <details
      className="col-span-full border-y border-border py-4"
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary className="flex min-h-11 cursor-pointer flex-wrap items-center gap-x-3 gap-y-1">
        <span className="flex items-center gap-2 font-medium">
          <ShieldCheck aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
          Product safety
        </span>
        {count > 0 ? (
          <span className="text-sm text-muted-foreground">
            <span aria-hidden="true">⚠ </span>
            {count} {count === 1 ? 'detail' : 'details'} missing before this can be verified.
          </span>
        ) : (
          verified && (
            <span className="flex items-center gap-1 text-sm">
              <BadgeCheck aria-hidden="true" className="size-4 shrink-0" />
              Verified{typeof checkedOn === 'string' ? ` · checked on ${checkedOn}` : ''}
            </span>
          )
        )}
      </summary>
      <div className="mt-4 grid min-w-0 gap-8">
        <p className="text-sm text-muted-foreground">
          Fill this in from the paperwork for this exact edition. If you're unsure of a value, leave it empty: empty
          means "not known yet", and shoppers see nothing until you mark it verified.
        </p>
        {unmapped.length > 0 && <FieldError>{unmapped.join(' ')}</FieldError>}
        {group('Product', ['product_type', 'product_identifier', 'operator_role'])}
        {group('Manufacturer (shown to shoppers)', [
          'manufacturer.name',
          'manufacturer.establishment',
          'manufacturer.postal_address',
          'manufacturer.electronic_address',
        ])}
        {(nonEu || data.responsible_person !== undefined) &&
          group(
            'EU contact person',
            [
              'responsible_person.name',
              'responsible_person.postal_address',
              'responsible_person.electronic_address',
              'responsible_person.eu_country',
            ],
            'The company in the EU responsible for this product.',
            shown('responsible_person') && issues.has('responsible_person') ? responsiblePersonMissing : undefined,
          )}
        {group('Safety warnings', ['safety_information.status', 'safety_information.text_el'])}
        {group('Proof (private, never shown to shoppers)', [
          'evidence.reference',
          'evidence.checked_on',
          'evidence.notes',
        ])}
        {!verified && (
          <div className="grid gap-2">
            <Button
              type="button"
              variant="outline"
              className="w-fit"
              disabled={disabled || count > 0}
              aria-describedby={count > 0 ? 'product-safety-verify-help' : undefined}
              onClick={() => onChange({ ...data, review_status: 'verified' })}
            >
              <BadgeCheck className="size-4" aria-hidden="true" />
              Mark details verified
            </Button>
            {count > 0 && (
              <p id="product-safety-verify-help" className="text-sm text-muted-foreground">
                Available once every required field above is filled.
              </p>
            )}
          </div>
        )}
      </div>
    </details>
  );
}
