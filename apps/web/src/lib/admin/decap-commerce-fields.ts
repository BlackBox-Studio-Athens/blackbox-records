import { buildField } from './decap-yaml-builder';

export function buildCommerceFields() {
  return buildField({
    label: 'Commerce',
    name: 'commerce',
    widget: 'object',
    collapsed: true,
    required: false,
    summary: '{{fields.publish_target}} - {{fields.price.amount_minor}} {{fields.price.currency}}',
    hint: 'Controls catalog promotion. Leave disabled unless this item should become buyable through UAT or production.',
    fields: [
      buildField({
        label: 'Enable checkout',
        name: 'enabled',
        widget: 'boolean',
        hint: 'When off, the item may stay published editorially but is not promoted as buyable.',
        extras: ['default: false'],
      }),
      buildField({
        label: 'Publish target',
        name: 'publish_target',
        widget: 'select',
        hint: 'Use UAT plus production only after the same item is ready to prove through UAT first.',
        options: [
          { label: 'Draft / not buyable', value: 'draft' },
          { label: 'UAT only', value: 'uat' },
          { label: 'UAT plus production', value: 'uat_and_production' },
        ],
        extras: ['default: draft'],
      }),
      buildField({
        label: 'Price',
        name: 'price',
        widget: 'object',
        required: false,
        collapsed: true,
        hint: 'Required before production promotion. Amount is in cents, for example 2800 for EUR 28.00.',
        fields: [
          buildField({
            label: 'Amount minor',
            name: 'amount_minor',
            widget: 'number',
            hint: 'Integer amount in cents. Example: 2800 means EUR 28.00.',
            extras: ['value_type: int', 'min: 1'],
          }),
          buildField({
            label: 'Currency',
            name: 'currency',
            widget: 'select',
            hint: 'Initial supported live catalog currency.',
            options: [{ label: 'EUR', value: 'EUR' }],
            extras: ['default: EUR'],
          }),
          buildField({
            label: 'Price revision',
            name: 'revision',
            widget: 'string',
            required: false,
            hint: 'Optional stable revision label. Leave empty to derive one from amount, currency, and option.',
          }),
        ],
      }),
      buildField({
        label: 'Option label',
        name: 'option_label',
        widget: 'string',
        required: false,
        hint: 'Explicit sellable option label shown in provider catalog names, such as Black Vinyl LP.',
      }),
      buildField({
        label: 'Tax code',
        name: 'tax_code',
        widget: 'string',
        hint: 'Stripe tax code for physical goods unless an approved override is needed.',
        extras: ['default: txcd_99999999'],
      }),
      buildField({
        label: 'Initial stock',
        name: 'stock',
        widget: 'object',
        required: false,
        collapsed: true,
        hint: 'First-publication stock only. Later stock remains operator-owned in D1.',
        fields: [
          buildField({
            label: 'Initial online quantity',
            name: 'initial_online_quantity',
            widget: 'number',
            required: false,
            hint: 'Required for a new production item unless stock already exists in D1.',
            extras: ['value_type: int', 'min: 0'],
          }),
        ],
      }),
      buildField({
        label: 'Smoke candidate',
        name: 'smoke_candidate',
        widget: 'boolean',
        hint: 'Allows promotion workflows to choose this item for deterministic checkout smoke proof.',
        extras: ['default: false'],
      }),
      buildField({
        label: 'Retired from checkout',
        name: 'retired',
        widget: 'boolean',
        hint: 'Keeps editorial pages visible while promotion makes Store Offers non-buyable.',
        extras: ['default: false'],
      }),
    ],
  });
}
