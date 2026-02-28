import React from 'react';
import { Select } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';
import styles from './NfaFields.module.css';

/* ------------------------------------------------------------------ */
/*  Props                                                               */
/* ------------------------------------------------------------------ */

interface NfaFieldsProps {
  values: {
    nfa_designation: string;
    form4_date: string;
    tax_stamp_status: string;
    trust_name: string;
  };
  onChange: (field: string, value: string) => void;
}

/* ------------------------------------------------------------------ */
/*  Select options                                                      */
/* ------------------------------------------------------------------ */

const NFA_DESIGNATION_OPTIONS = [
  { value: 'sbr', label: 'SBR' },
  { value: 'sbs', label: 'SBS' },
  { value: 'mg', label: 'Machine Gun' },
  { value: 'aow', label: 'AOW' },
  { value: 'dd', label: 'Destructive Device' },
];

const TAX_STAMP_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'denied', label: 'Denied' },
];

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

const NfaFields: React.FC<NfaFieldsProps> = ({ values, onChange }) => (
  <div className={styles.section}>
    <h2 className={styles.heading}>NFA Information</h2>

    <div className={styles.grid}>
      <Select
        label="NFA Designation"
        options={NFA_DESIGNATION_OPTIONS}
        value={values.nfa_designation}
        onChange={(e) => onChange('nfa_designation', e.target.value)}
        placeholder="Select designation"
      />
      <Select
        label="Tax Stamp Status"
        options={TAX_STAMP_OPTIONS}
        value={values.tax_stamp_status}
        onChange={(e) => onChange('tax_stamp_status', e.target.value)}
        placeholder="Select status"
      />
      <Input
        label="Form 4 Approval Date"
        type="date"
        value={values.form4_date}
        onChange={(e) => onChange('form4_date', e.target.value)}
      />
      <Input
        label="Trust Name"
        value={values.trust_name}
        onChange={(e) => onChange('trust_name', e.target.value)}
        placeholder="e.g. My NFA Trust"
      />
    </div>
  </div>
);

export { NfaFields };
