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
  axiosInstance?: any;
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
  } else if (err?.response?.data?.message) {
    message = err.response.data.message;
  }
  return { message };
};

async function runFetch(
  endpoint: string,
  method: string,
  payload: any,
  useFormData: boolean,
  axiosConfig: Record<string, any>,
  signal: AbortSignal | undefined,
): Promise<any> {
  const headers: Record<string, string> = {
    ...(axiosConfig.headers || {}),
    ...(!useFormData ? { "Content-Type": "application/json" } : {}),
  };

  const res = await fetch(endpoint, {
    method: method.toUpperCase(),
    headers,
    body: useFormData ? payload : JSON.stringify(payload),
    signal,
    credentials: axiosConfig.withCredentials ? "include" : "same-origin",
  });

  let data: any;
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  if (!res.ok) {
    const message =
      (typeof data === "object" && data?.message) ||
      `Request failed with status ${res.status}`;
    const error: any = new Error(message);
    error.response = { data, status: res.status };
    throw error;
  }

  return data;
}

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
        axiosInstance,
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

      const notifyFn: NotifyFn = notify ?? (() => {});

      let context: any;
      const transformedData = transformData ? transformData(data) : data;

      if (enableAbort) {
        abortControllerRef.current = new AbortController();
      }

      const signal = enableAbort
        ? abortControllerRef.current?.signal
        : undefined;

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
        } else if (endpoint && axiosInstance) {
          const config: any = {
            method,
            url: endpoint,
            data: payload,
            ...axiosConfig,
            signal,
            headers: useFormData
              ? {
                  ...axiosConfig.headers,
                  "Content-Type": "multipart/form-data",
                }
              : axiosConfig.headers,
          };
          const res = await axiosInstance(config);
          responseData = res.data;
        } else if (endpoint) {
          responseData = await runFetch(
            endpoint,
            method,
            payload,
            useFormData,
            axiosConfig,
            signal,
          );
        } else {
          throw new Error(
            "[@hirely/hooks] Provide either `endpoint` or a custom `service` function.",
          );
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
