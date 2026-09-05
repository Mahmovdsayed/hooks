"use client";

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

let cachedAxios: any = null;
let axiosLoadPromise: Promise<any> | null = null;
const getAxios = async () => {
  if (cachedAxios) return cachedAxios;
  if (!axiosLoadPromise) {
    axiosLoadPromise = import("axios")
      .then((m) => {
        cachedAxios = m.default || m;
        return cachedAxios;
      })
      .catch(() => {
        axiosLoadPromise = null;
        return null;
      });
  }
  return axiosLoadPromise;
};

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
  TSchema extends ZodType<FieldValues, any, any> = ZodType<FieldValues, any, any>,
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
      const currentOpts = optionsRef.current;
      if (currentOpts.service) {
        return (await currentOpts.service(data)) as TResponse;
      }
      if (currentOpts.endpoint) {
        const axiosInstance = await getAxios();
        if (!axiosInstance) {
          throw new Error(
            "axios is not installed. Please install axios or provide a custom `service` function.",
          );
        }
        const res = await axiosInstance({
          method: currentOpts.method || "post",
          url: currentOpts.endpoint,
          data,
          ...currentOpts.axiosConfig,
        });
        return res.data;
      }
      throw new Error("No service or endpoint provided");
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
