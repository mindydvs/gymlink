import {
  useMutation,
  useQuery,
  type MutationFunction,
  type UseMutationOptions,
  type UseMutationResult,
  type UseQueryOptions,
  type UseQueryResult,
} from "@tanstack/react-query";
import { customFetch } from "./custom-fetch";
import type { ErrorType } from "./custom-fetch";
import type { Gym } from "./generated/api.schemas";

type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];

export interface GymCandidate {
  osmType: string;
  osmId: number;
  name: string;
  address: string;
  city: string;
  lat: string;
  lon: string;
}

export interface AddGymBody {
  osmType: string;
  osmId: number;
}

export type SearchGymsParams = { q: string };

// ─── Search gyms (OpenStreetMap-backed) ──────────────────────────────────────
export const searchGyms = (
  params: SearchGymsParams,
  options?: SecondParameter<typeof customFetch>,
) =>
  customFetch<GymCandidate[]>(
    `/api/gyms/search?q=${encodeURIComponent(params.q)}`,
    { method: "GET", ...options },
  );

export const getSearchGymsQueryKey = (params: SearchGymsParams) =>
  ["searchGyms", params] as const;

export const useSearchGyms = <
  TData = Awaited<ReturnType<typeof searchGyms>>,
  TError = ErrorType<unknown>,
>(
  params: SearchGymsParams,
  options?: {
    query?: Partial<
      UseQueryOptions<Awaited<ReturnType<typeof searchGyms>>, TError, TData>
    >;
  },
): UseQueryResult<TData, TError> => {
  const { query: queryOptions } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getSearchGymsQueryKey(params);
  return useQuery({
    queryKey,
    queryFn: () => searchGyms(params),
    ...queryOptions,
  });
};

// ─── Add gym (verified against OpenStreetMap) ────────────────────────────────
export const addGym = (
  body: AddGymBody,
  options?: SecondParameter<typeof customFetch>,
) =>
  customFetch<Gym>("/api/gyms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    ...options,
  });

export const useAddGym = <TError = ErrorType<unknown>, TContext = unknown>(
  options?: {
    mutation?: UseMutationOptions<
      Awaited<ReturnType<typeof addGym>>,
      TError,
      { data: AddGymBody },
      TContext
    >;
    request?: SecondParameter<typeof customFetch>;
  },
): UseMutationResult<
  Awaited<ReturnType<typeof addGym>>,
  TError,
  { data: AddGymBody },
  TContext
> => {
  const { mutation: mutationOptions, request: requestOptions } = options ?? {};
  const mutationFn: MutationFunction<
    Awaited<ReturnType<typeof addGym>>,
    { data: AddGymBody }
  > = ({ data }) => addGym(data, requestOptions);
  return useMutation({ mutationFn, ...mutationOptions });
};
