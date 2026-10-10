import { useState } from 'react';
import { normalizePhoneInput, phonePrefix } from '../phoneNumber';
import { Field, Prefix, Divider, Input } from './LoginFlowPhoneField.styles';

interface LoginFlowPhoneFieldProps {
  value: string;
  onChanged?: (value: string) => void;
}

export function LoginFlowPhoneField({ value, onChanged }: LoginFlowPhoneFieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <Field $focused={focused}>
      <Prefix>{phonePrefix(value)}</Prefix>
      <Divider />
      <Input
        type="tel"
        inputMode="tel"
        value={value}
        onChange={(e) => onChanged?.(normalizePhoneInput(e.target.value))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        aria-label="Mobile Number"
      />
    </Field>
  );
}
