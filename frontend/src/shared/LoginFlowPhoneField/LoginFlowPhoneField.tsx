import { useState } from 'react';
import { phonePrefix } from '../phoneNumber';
import { Field, Prefix, Divider, Input } from './LoginFlowPhoneField.styles';

/** Flutter: TextField(maxLength: 10) */
const MAX_LENGTH = 10;

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
        onChange={(e) => onChanged?.(e.target.value.replace(/\D/g, '').slice(0, MAX_LENGTH))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        aria-label="Mobile Number"
      />
    </Field>
  );
}
