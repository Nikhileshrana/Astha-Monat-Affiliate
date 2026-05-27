"use client";

import * as React from "react";
import PhoneInput from "react-phone-number-input";
import type { Country, Value } from "react-phone-number-input";
import en from "react-phone-number-input/locale/en.json";
import "react-phone-number-input/style.css";

import { cn } from "@/lib/utils";

type PhoneInputFieldProps = {
  id?: string;
  value: Value | undefined;
  onChange: (value: Value | undefined) => void;
  defaultCountry?: Country;
  placeholder?: string;
  disabled?: boolean;
  "aria-invalid"?: boolean;
  className?: string;
};

export function PhoneInputField({
  id,
  value,
  onChange,
  defaultCountry = "US",
  placeholder = "Phone number",
  disabled,
  className,
  "aria-invalid": ariaInvalid,
}: PhoneInputFieldProps) {
  return (
    <PhoneInput
      id={id}
      international
      defaultCountry={defaultCountry}
      labels={en}
      value={value}
      onChange={onChange}
      disabled={disabled}
      placeholder={placeholder}
      aria-invalid={ariaInvalid}
      className={cn(
        "PhoneInputField flex w-full items-center gap-2 border-b border-input pb-1 transition-[border-color]",
        "focus-within:border-ring",
        ariaInvalid && "border-destructive focus-within:border-destructive",
        disabled && "opacity-50",
        className,
      )}
      numberInputProps={{
        className:
          "min-w-0 flex-1 bg-transparent py-1 text-base outline-none placeholder:text-muted-foreground md:text-sm",
      }}
      countrySelectProps={{
        className:
          "max-w-[7rem] shrink-0 bg-transparent py-1 text-sm outline-none",
      }}
    />
  );
}
