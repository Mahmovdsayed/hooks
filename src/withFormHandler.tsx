
import type { ComponentType } from "react";
import { useFormHandler } from "./useFormHandler";
import type { UseFormHandlerOptions } from "./useFormHandler";
import type { ZodType } from "zod";
import type { FieldValues } from "react-hook-form";

export function withFormHandler<
  TSchema extends ZodType<FieldValues, any, any>,
  P extends { formHandler: ReturnType<typeof useFormHandler<TSchema>> },
>(
  WrappedComponent: ComponentType<P>,
  options: UseFormHandlerOptions<TSchema>,
) {
  const WithFormHandler = (props: Omit<P, "formHandler">) => {
    const formHandler = useFormHandler(options);
    return <WrappedComponent {...(props as P)} formHandler={formHandler} />;
  };
  WithFormHandler.displayName = `WithFormHandler(${WrappedComponent.displayName || WrappedComponent.name || "Component"})`;
  return WithFormHandler;
}