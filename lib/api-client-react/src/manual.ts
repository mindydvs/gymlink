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

type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];

// ─── Recipe types ───────────────────────────────────────────────────────────
export interface RecipeUser {
  id: string;
  name: string;
  avatar?: string | null;
  avatarUrl?: string | null;
}

export interface Recipe {
  id: string;
  userId: string;
  title: string;
  description?: string | null;
  ingredients: string[];
  steps: string[];
  mediaObjectPath?: string | null;
  mediaType?: string | null;
  createdAt: string;
  user?: RecipeUser | null;
}

export interface CreateRecipeBody {
  title: string;
  description?: string;
  ingredients?: string[];
  steps?: string[];
  mediaObjectPath?: string;
  mediaType?: string;
}

export type ListRecipesParams = {
  userId?: string;
};

// ─── Cancel Connection ──────────────────────────────────────────────────────
export const cancelConnection = (
  id: string,
  options?: SecondParameter<typeof customFetch>,
) =>
  customFetch<{ success: boolean }>(`/api/connections/${id}`, {
    method: "DELETE",
    ...options,
  });

export const useCancelConnection = <TError = ErrorType<unknown>, TContext = unknown>(
  options?: {
    mutation?: UseMutationOptions<
      Awaited<ReturnType<typeof cancelConnection>>,
      TError,
      { id: string },
      TContext
    >;
    request?: SecondParameter<typeof customFetch>;
  },
): UseMutationResult<
  Awaited<ReturnType<typeof cancelConnection>>,
  TError,
  { id: string },
  TContext
> => {
  const { mutation: mutationOptions, request: requestOptions } = options ?? {};
  const mutationFn: MutationFunction<
    Awaited<ReturnType<typeof cancelConnection>>,
    { id: string }
  > = ({ id }) => cancelConnection(id, requestOptions);
  return useMutation({ mutationFn, ...mutationOptions });
};

// ─── Recipes ────────────────────────────────────────────────────────────────
export const listRecipes = (
  params?: ListRecipesParams,
  options?: SecondParameter<typeof customFetch>,
) => {
  const search = params?.userId ? `?userId=${params.userId}` : "";
  return customFetch<Recipe[]>(`/api/recipes${search}`, { method: "GET", ...options });
};

export const getListRecipesQueryKey = (params?: ListRecipesParams) =>
  ["listRecipes", params] as const;

export const useListRecipes = <
  TData = Awaited<ReturnType<typeof listRecipes>>,
  TError = ErrorType<unknown>,
>(
  params?: ListRecipesParams,
  options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listRecipes>>, TError, TData>;
  },
): UseQueryResult<TData, TError> => {
  const { query: queryOptions } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getListRecipesQueryKey(params);
  return useQuery({ queryKey, queryFn: () => listRecipes(params), ...queryOptions });
};

export const createRecipe = (
  body: CreateRecipeBody,
  options?: SecondParameter<typeof customFetch>,
) =>
  customFetch<Recipe>("/api/recipes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    ...options,
  });

export const useCreateRecipe = <TError = ErrorType<unknown>, TContext = unknown>(
  options?: {
    mutation?: UseMutationOptions<
      Awaited<ReturnType<typeof createRecipe>>,
      TError,
      { data: CreateRecipeBody },
      TContext
    >;
    request?: SecondParameter<typeof customFetch>;
  },
): UseMutationResult<
  Awaited<ReturnType<typeof createRecipe>>,
  TError,
  { data: CreateRecipeBody },
  TContext
> => {
  const { mutation: mutationOptions, request: requestOptions } = options ?? {};
  const mutationFn: MutationFunction<
    Awaited<ReturnType<typeof createRecipe>>,
    { data: CreateRecipeBody }
  > = ({ data }) => createRecipe(data, requestOptions);
  return useMutation({ mutationFn, ...mutationOptions });
};

export const deleteRecipe = (
  id: string,
  options?: SecondParameter<typeof customFetch>,
) => customFetch<void>(`/api/recipes/${id}`, { method: "DELETE", ...options });

export const useDeleteRecipe = <TError = ErrorType<unknown>, TContext = unknown>(
  options?: {
    mutation?: UseMutationOptions<
      Awaited<ReturnType<typeof deleteRecipe>>,
      TError,
      { id: string },
      TContext
    >;
    request?: SecondParameter<typeof customFetch>;
  },
): UseMutationResult<
  Awaited<ReturnType<typeof deleteRecipe>>,
  TError,
  { id: string },
  TContext
> => {
  const { mutation: mutationOptions, request: requestOptions } = options ?? {};
  const mutationFn: MutationFunction<
    Awaited<ReturnType<typeof deleteRecipe>>,
    { id: string }
  > = ({ id }) => deleteRecipe(id, requestOptions);
  return useMutation({ mutationFn, ...mutationOptions });
};
