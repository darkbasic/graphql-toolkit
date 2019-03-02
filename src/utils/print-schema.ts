import {
    buildASTSchema,
    printSchema as graphQLPrintSchema,
    GraphQLSchema,
    parse,
    print,
    isSpecifiedScalarType,
    isIntrospectionType,
    GraphQLScalarType,
    printType,
    GraphQLNamedType,
    ObjectTypeExtensionNode,
  } from 'graphql';
import { createSchemaDefinition } from './helpers';

function fixSchemaAst(schema: GraphQLSchema): GraphQLSchema {
    return buildASTSchema(parse(graphQLPrintSchema(schema)));
}

function extendDefinition(type: GraphQLNamedType): GraphQLNamedType['astNode'] {
    switch (type.astNode.kind) {
      case 'ObjectTypeDefinition':
        return {
          ...type.astNode,
          // add fields from object extension (`extend type Query { newField: String }`)
          fields: type.astNode.fields.concat((type.extensionASTNodes as ReadonlyArray<ObjectTypeExtensionNode>).reduce((fields, node) => fields.concat(node.fields), [])),
        };
      default:
        return type.astNode;
    }
  }

  
export function printSchema(schema: GraphQLSchema) {
    let typesMap = schema.getTypeMap();
    const validAstNodes = Object.keys(typesMap).filter(key => typesMap[key].astNode);

    if (validAstNodes.length === 0 && Object.keys(typesMap).length > 0) {
      schema = fixSchemaAst(schema);
      typesMap = schema.getTypeMap();
    }

    const schemaDefinition = createSchemaDefinition({
      query: schema.getQueryType(),
      mutation: schema.getMutationType(),
      subscription: schema.getSubscriptionType(),
    });
    const allTypesPrinted = Object.keys(typesMap)
      .map(key => typesMap[key])
      .filter(type => {
        const isPredefinedScalar = type instanceof GraphQLScalarType && isSpecifiedScalarType(type);
        const isIntrospection = isIntrospectionType(type);

        return !isPredefinedScalar && !isIntrospection;
      })
      .map(type => {
        if (type.astNode) {
          return print(type.extensionASTNodes ? extendDefinition(type) : type.astNode);
        } else {
          return printType(type);
        }
      })
      .filter(e => e);
    const directivesDeclaration = schema
      .getDirectives()
      .map(directive => (directive.astNode ? print(directive.astNode) : null))
      .filter(e => e);
    const printedSchema = [...directivesDeclaration, ...allTypesPrinted, schemaDefinition].join('\n');

    return parse(printedSchema);
}