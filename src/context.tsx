"use client";

import { createContext, useContext, useMemo } from "react";
import type { ReactNode } from "react";
import type { UseFormHandlerOptions } from "./useFormHandler";
import type { ZodType } from "zod";
import type { FieldValues } from "react-hook-form";

const FormHandlerContext = createContext<Partial<UseFormHandlerOptions<any>>>({});

export const FormHandlerProvider = <TSchema extends ZodType<FieldValues, any, any> = ZodType<FieldValues, any, any>>({
  children,
  defaultOptions,
}: {
  children: ReactNode;
  defaultOptions: Partial<UseFormHandlerOptions<TSchema>>;
}) => {
  const value = useMemo(() => defaultOptions, [defaultOptions]);
  return (
    <FormHandlerContext.Provider value={value}>
      {children}
    </FormHandlerContext.Provider>
  );
};

export const useFormHandlerContext = () => useContext(FormHandlerContext);