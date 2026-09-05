"use client";

import React, { useState, useRef, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import type {
  DefaultValues,
  SubmitHandler,
  UseFormReturn,
  FieldValues,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ZodType, z } from "zod";
import { useFormHandlerContext } from "./context";

export type NotifyFn = (message: string, type: "success" | "error") => void;
export type ResponseParser = (responseData: any) => {
  success: boolean;
  message?: string;
  data?: any;
};
export type ErrorParser = (error: any) => { message: string };

export interface UseFormHandlerOptions<
  TSchema extends ZodType<FieldValues, any, any> = ZodType<
    FieldValues,
    any,
    any
  >,
  TData extends FieldValues = z.infer<TSchema>,
> {
  schema: TSchema;
  endpoint?: string;
  method?: "post" | "patch" | "put" | "delete";
  service?: (data: TData) => Promise<any>;
  defaultValues?: DefaultValues<TData>;
  values?: TData;
  transformData?: (data: TData) => any;
  onMutate?: (data: TData) => any | Promise<any>;
  onSuccess?: (data: any, context?: any) => void;
  onError?: (error: any, context?: any) => void;
  onSubmitStart?: () => void;
  onSubmitEnd?: () => void;
  notify?: NotifyFn;
  resetOptions?: {
    resetAfterSuccess?: boolean;
    keepDefaultValues?: boolean;
    keepDirty?: boolean;
  };
  useFormData?: boolean;
  enableAbort?: boolean;
  axiosConfig?: Record<string, any>;
  mode?: "onSubmit" | "onBlur" | "onChange" | "onTouched" | "all";
  reValidateMode?: "onChange" | "onBlur" | "onSubmit";
  parseResponse?: ResponseParser;
  parseError?: ErrorParser;
}

const defaultParseResponse: ResponseParser = (res) => ({
  success: res?.success !== undefined ? Boolean(res.success) : true,
  message: res?.message,
  data: res,
});

const defaultParseError: ErrorParser = (err) => {
  let message = "Request failed";
  if (err?.isAxiosError) {
    message = err?.response?.data?.message || err.message || message;
    if (err.code === "ERR_CANCELED") {
      message = "Request was cancelled";
    }
  } else if (err instanceof Error) {
    message = err.message;
  }
  return { message };
};

let cachedAxios: any = null;
let axiosLoadPromise: Promise<any> | null = null;
const getAxios = async () => {
  if (cachedAxios) return cachedAxios;
  if (!axiosLoadPromise) {
    // @ts-ignore – axios is optional
    axiosLoadPromise = import(/* webpackIgnore: true */ "axios")
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

let cachedSonnerToast: any = null;
let sonnerLoadPromise: Promise<any> | null = null;
const getSonnerToast = async () => {
  if (cachedSonnerToast) return cachedSonnerToast;
  if (!sonnerLoadPromise) {
    // @ts-ignore – sonner is optional
    sonnerLoadPromise = import(/* webpackIgnore: true */ "sonner")
      .then((m) => {
        cachedSonnerToast = m.toast || m;
        return cachedSonnerToast;
      })
      .catch(() => {
        sonnerLoadPromise = null;
        return null;
      });
  }
  return sonnerLoadPromise;
};

export function useFormHandlerInternal<
  TSchema extends ZodType<FieldValues, any, any>,
  TData extends FieldValues = z.infer<TSchema>,
>(options: UseFormHandlerOptions<TSchema, TData>) {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const {
    schema,
    defaultValues,
    values,
    mode = "onSubmit",
    reValidateMode = "onChange",
  } = options;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const form = useForm<TData>({
    resolver: zodResolver(schema as any) as any,
    defaultValues,
    values,
    mode,
    reValidateMode,
  });

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const submitHandler = useCallback<SubmitHandler<TData>>(
    async (data) => {
      const currentOptions = optionsRef.current;
      const {
        endpoint,
        method = "post",
        service,
        transformData,
        onMutate,
        onSuccess,
        onError,
        onSubmitStart,
        onSubmitEnd,
        notify,
        resetOptions = { resetAfterSuccess: true, keepDefaultValues: true },
        useFormData = false,
        enableAbort = false,
        axiosConfig = {},
        parseResponse = defaultParseResponse,
        parseError = defaultParseError,
      } = currentOptions;

      let context: any;
      const transformedData = transformData ? transformData(data) : data;

      let notifyFn: NotifyFn;
      if (notify) {
        notifyFn = notify;
      } else {
        const toast = await getSonnerToast();
        if (toast) {
          notifyFn = (message: string, type: "success" | "error") => {
            if (type === "success") {
              toast.success(message);
            } else {
              toast.error(message);
            }
          };
        } else {
          notifyFn = () => {};
        }
      }

      if (enableAbort) {
        abortControllerRef.current = new AbortController();
      }

      try {
        setLoading(true);
        setError(null);
        onSubmitStart?.();

        if (onMutate) {
          context = await onMutate(data);
        }

        let responseData: any;
        let payload: any = transformedData;

        if (useFormData) {
          const formData = new FormData();
          if (transformedData && typeof transformedData === "object") {
            for (const [key, value] of Object.entries(
              transformedData as Record<string, unknown>,
            )) {
              if (value instanceof File || value instanceof Blob) {
                formData.append(key, value);
              } else if (Array.isArray(value)) {
                for (const item of value) {
                  if (item instanceof File || item instanceof Blob) {
                    formData.append(key, item);
                  } else if (item !== undefined && item !== null) {
                    formData.append(key, String(item));
                  }
                }
              } else if (value !== undefined && value !== null) {
                formData.append(key, String(value));
              }
            }
          }
          payload = formData;
        }

        if (service) {
          responseData = await service(payload);
        } else {
          if (!endpoint) {
            throw new Error("No endpoint or service provided");
          }

          const axiosInstance = await getAxios();
          if (!axiosInstance) {
            throw new Error(
              "axios is not installed. Please install axios or provide a custom `service` function.",
            );
          }

          const config: any = {
            method,
            url: endpoint,
            data: payload,
            ...axiosConfig,
            signal: enableAbort
              ? abortControllerRef.current?.signal
              : undefined,
            headers: useFormData
              ? {
                  ...axiosConfig.headers,
                  "Content-Type": "multipart/form-data",
                }
              : axiosConfig.headers,
          };
          const res = await axiosInstance(config);
          responseData = res.data;
        }

        const parsed = parseResponse(responseData);
        const isSuccess = parsed.success;
        const message =
          parsed.message || (isSuccess ? "Success" : "Something went wrong");

        if (isSuccess) {
          notifyFn(message, "success");
          onSuccess?.(responseData, context);
          if (resetOptions.resetAfterSuccess !== false) {
            form.reset(undefined, {
              keepDefaultValues: resetOptions.keepDefaultValues !== false,
              keepDirty: resetOptions.keepDirty || false,
              keepTouched: false,
              keepErrors: false,
              keepValues: false,
            });
          }
        } else {
          notifyFn(message, "error");
          onError?.(responseData, context);
          setError(new Error(message));
        }
      } catch (err: any) {
        const parsedError = parseError(err);
        const errorMsg = parsedError.message;
        setError(new Error(errorMsg));
        notifyFn(errorMsg, "error");
        onError?.(err, context);
      } finally {
        setLoading(false);
        onSubmitEnd?.();
        abortControllerRef.current = null;
      }
    },
    [form],
  );

  const onSubmit = useMemo(
    () => form.handleSubmit(submitHandler),
    [form, submitHandler],
  );

  return useMemo(
    () => ({
      ...form,
      onSubmit,
      loading,
      error,
      setError,
      abort: options.enableAbort ? abort : undefined,
    }),
    [form, onSubmit, loading, error, setError, abort, options.enableAbort],
  ) as UseFormReturn<TData> & {
    onSubmit: (e?: unknown) => Promise<void>;
    loading: boolean;
    error: Error | null;
    setError: React.Dispatch<React.SetStateAction<Error | null>>;
    abort?: () => void;
  };
}

export function useFormHandler<
  TSchema extends ZodType<FieldValues, any, any>,
  TData extends FieldValues = z.infer<TSchema>,
>(options: UseFormHandlerOptions<TSchema, TData>) {
  const contextOptions = useFormHandlerContext();
  const mergedOptions = useMemo(() => {
    return {
      ...contextOptions,
      ...options,
      axiosConfig: {
        ...(contextOptions.axiosConfig || {}),
        ...(options.axiosConfig || {}),
      },
      resetOptions: {
        ...(contextOptions.resetOptions || {}),
        ...(options.resetOptions || {}),
      },
    } as UseFormHandlerOptions<TSchema, TData>;
  }, [contextOptions, options]);

  return useFormHandlerInternal(mergedOptions);
}

export function createFormHandler(
  defaultOptions: Partial<UseFormHandlerOptions<any>>,
) {
  return function useCreatedFormHandler<
    TSchema extends ZodType<FieldValues, any, any>,
    TData extends FieldValues = z.infer<TSchema>,
  >(options: UseFormHandlerOptions<TSchema, TData>) {
    const mergedOptions = useMemo(() => {
      return {
        ...defaultOptions,
        ...options,
        axiosConfig: {
          ...(defaultOptions.axiosConfig || {}),
          ...(options.axiosConfig || {}),
        },
        resetOptions: {
          ...(defaultOptions.resetOptions || {}),
          ...(options.resetOptions || {}),
        },
      } as UseFormHandlerOptions<TSchema, TData>;
    }, [options]);

    return useFormHandlerInternal(mergedOptions);
  };
}
