import {
  DefinitionNode,
  DocumentNode,
  GraphQLSchema,
  parse,
  Source,
} from 'graphql';
import { isGraphQLSchema, isSchemaDefinition } from './utils';
import { MergedResultMap, mergeGraphQLNodes } from './merge-nodes';
import { createSchemaDefinition, isStringTypes, isSourceTypes } from '../../utils/helpers';
import { printSchema } from '../../utils';

interface Config {
  useSchemaDefinition?: boolean;
}

export function mergeGraphQLSchemas(...args: ArgsType<typeof mergeGraphQLTypes>): ReturnType<typeof mergeGraphQLTypes> {
  console.info(`
    GraphQL Toolkit/Epoxy 
    Deprecation Notice;
    'mergeGraphQLSchemas' is deprecated and will be removed in the next version.
    Please use 'mergeTypeDefs' instead!
  `);
  return mergeGraphQLTypes(...args);
}

export function mergeTypeDefs(types: Array<string | Source | DocumentNode | GraphQLSchema>, config?: Partial<Config>): DocumentNode {
  return {
    kind: 'Document',
    definitions: mergeGraphQLTypes(types, {
      useSchemaDefinition: true,
      ...config,
    }),
  };
}

export function mergeGraphQLTypes(types: Array<string | Source | DocumentNode | GraphQLSchema>, config: Config): DefinitionNode[] {
  const allNodes: ReadonlyArray<DefinitionNode> = types
    .map<DocumentNode>(type => {
      if (isGraphQLSchema(type)) {
        return parse(printSchema(type));
      } else if (isStringTypes(type) || isSourceTypes(type)) {
        return parse(type);
      }
      return type;
    })
    .map(ast => ast.definitions)
    .reduce((defs, newDef) => [...defs, ...newDef], []);

  // XXX: right now we don't handle multiple schema definitions
  let schemaDef: {
    query: string | null;
    mutation: string | null;
    subscription: string | null;
  } = allNodes.filter(isSchemaDefinition).reduce(
    (def, node) => {
      node.operationTypes
        .filter(op => op.type.name.value)
        .forEach(op => {
          def[op.operation] = op.type.name.value;
        });

      return def;
    },
    {
      query: null,
      mutation: null,
      subscription: null,
    }
  );
  const mergedNodes: MergedResultMap = mergeGraphQLNodes(allNodes);
  const allTypes = Object.keys(mergedNodes);

  if (config && config.useSchemaDefinition) {
    const queryType = schemaDef.query ? schemaDef.query : allTypes.find(t => t === 'Query');
    const mutationType = schemaDef.mutation ? schemaDef.mutation : allTypes.find(t => t === 'Mutation');
    const subscriptionType = schemaDef.subscription ? schemaDef.subscription : allTypes.find(t => t === 'Subscription');
    schemaDef = {
      query: queryType,
      mutation: mutationType,
      subscription: subscriptionType,
    };
  }

  const schemaDefinition = createSchemaDefinition(schemaDef);

  if (!schemaDefinition) {
    return Object.values(mergedNodes);
  }

  return [...Object.values(mergedNodes), parse(schemaDefinition).definitions[0]];
}
