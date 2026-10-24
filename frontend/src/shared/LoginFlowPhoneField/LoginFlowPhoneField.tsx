import { useState } from 'react';
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
      <Prefix>+91</Prefix>
      <Divider />
      <Input
        type="tel"
        inputMode="tel"
        maxLength={MAX_LENGTH}
        value={value}
        onChange={(e) => onChanged?.(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        aria-label="Mobile Number"
      />
    </Field>
  );
}
