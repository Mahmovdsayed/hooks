import { useMutation } from "@tanstack/react-query";
import type {
  UseMutationOptions,
  UseMutateFunction,
  UseMutateAsyncFunction,
  MutationStatus,
  DefaultError,
} from "@tanstack/react-query";
import { useFormHandler } from "./useFormHandler";
import type { UseFormHandlerOptions } from "./useFormHandler";
import type { ZodType, z } from "zod";
import type { FieldValues, UseFormReturn } from "react-hook-form";
import { useMemo, useRef } from "react";

export type UseFormMutationReturn<
  TSchema extends ZodType<FieldValues, any, any>,
  TData extends FieldValues = z.infer<TSchema>,
  TResponse = any,
  TError = DefaultError,
> = Omit<UseFormReturn<TData>, "reset"> & {
  onSubmit: (e?: unknown) => Promise<void>;
  loading: boolean;
  setError: React.Dispatch<React.SetStateAction<Error | null>>;
  abort?: () => void;
  mutate: UseMutateFunction<TResponse, TError, TData, any>;
  mutateAsync: UseMutateAsyncFunction<TResponse, TError, TData, any>;
  isPending: boolean;
  isLoading: boolean;
  isError: boolean;
  error: TError | null;
  formError?: Error | null;
  data: TResponse | undefined;
  reset: () => void;
  resetForm: UseFormReturn<TData>["reset"];
  resetMutation: () => void;
  status: MutationStatus;
};

export function useFormMutation<
  TSchema extends ZodType<FieldValues, any, any> = ZodType<
    FieldValues,
    any,
    any
  >,
  TData extends FieldValues = z.infer<TSchema>,
  TResponse = any,
  TError = DefaultError,
>(
  options: UseFormHandlerOptions<TSchema, TData> & {
    mutationOptions?: Omit<
      UseMutationOptions<TResponse, TError, TData, any>,
      "mutationFn"
    >;
  },
): UseFormMutationReturn<TSchema, TData, TResponse, TError> {
  const { mutationOptions, ...formOptions } = options;
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const form = useFormHandler(formOptions);

  const mutationFn = useMemo(() => {
    return async (data: TData): Promise<TResponse> => {
      const o = optionsRef.current;

      if (o.service) {
        return (await o.service(data)) as TResponse;
      }

      if (o.endpoint) {
        if (o.axiosInstance) {
          const res = await o.axiosInstance({
            method: o.method || "post",
            url: o.endpoint,
            data,
            ...o.axiosConfig,
          });
          return res.data;
        }

        const axiosConfig = o.axiosConfig || {};
        const headers: Record<string, string> = {
          ...(axiosConfig.headers || {}),
          "Content-Type": "application/json",
        };
        const res = await fetch(o.endpoint, {
          method: (o.method || "post").toUpperCase(),
          headers,
          body: JSON.stringify(data),
          credentials: axiosConfig.withCredentials ? "include" : "same-origin",
        });

        let responseData: any;
        const contentType = res.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          responseData = await res.json();
        } else {
          responseData = await res.text();
        }

        if (!res.ok) {
          const message =
            (typeof responseData === "object" && responseData?.message) ||
            `Request failed with status ${res.status}`;
          const error: any = new Error(message);
          error.response = { data: responseData, status: res.status };
          throw error;
        }

        return responseData as TResponse;
      }

      throw new Error("[@hirely/hooks] No `service` or `endpoint` provided.");
    };
  }, []);

  const mutation = useMutation<TResponse, TError, TData, any>({
    mutationFn,
    ...mutationOptions,
    onSuccess: (data, variables, context) => {
      optionsRef.current.onSuccess?.(data, context);
      if (mutationOptions?.onSuccess) {
        (mutationOptions.onSuccess as any)(data, variables, context);
      }
    },
    onError: (error, variables, context) => {
      optionsRef.current.onError?.(error, context);
      if (mutationOptions?.onError) {
        (mutationOptions.onError as any)(error, variables, context);
      }
    },
  });

  const reset = () => {
    mutation.reset();
    form.reset();
  };

  return {
    ...form,
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    formError: form.error,
    data: mutation.data,
    reset,
    resetForm: form.reset,
    resetMutation: mutation.reset,
    status: mutation.status,
  };
}
