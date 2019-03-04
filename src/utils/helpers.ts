import { GraphQLObjectType, Source } from "graphql";

export const asArray = <T>(fns: T | T[]) => (Array.isArray(fns) ? fns : [fns]);

export function chainFunctions(funcs: any[]) {
  if (funcs.length === 1) {
    return funcs[0];
  }

  return funcs.reduce((a, b) => (...args: any[]) => a(b(...args)));
}

export function createSchemaDefinition(def: { query: string | GraphQLObjectType | null; mutation: string | GraphQLObjectType | null; subscription: string | GraphQLObjectType | null }): string {
  const schemaRoot: {
    query?: string;
    mutation?: string;
    subscription?: string;
  } = {};

  if (def.query) {
    schemaRoot.query = def.query.toString();
  }
  if (def.mutation) {
    schemaRoot.mutation = def.mutation.toString();
  }
  if (def.subscription) {
    schemaRoot.subscription = def.subscription.toString();
  }

  const fields = Object.keys(schemaRoot)
    .map(rootType => (schemaRoot[rootType] ? `${rootType}: ${schemaRoot[rootType]}` : null))
    .filter(a => a);

  if (fields.length) {
    return `schema { ${fields.join('\n')} }`;
  }

  return undefined;
}

export function isStringTypes(types: any): types is string {
  return typeof types === 'string';
}

export function isSourceTypes(types: any): types is Source {
  return types instanceof Source;
}
