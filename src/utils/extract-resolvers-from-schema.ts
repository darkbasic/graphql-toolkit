import { GraphQLSchema, GraphQLScalarType, GraphQLObjectType, GraphQLInterfaceType, DocumentNode } from "graphql";
import { IResolvers } from "graphql-tools";
import { extractFieldResolversFromObjectType } from "./extract-field-resolvers-from-object-type";
import { getDefinitionNodesFromTypeDefs } from "./get-definition-nodes-from-typedefs";
import { isGraphQLType, isGraphQLTypeExtension } from "../epoxy/typedefs-mergers/utils";

export interface ExtractResolversFromSchemaOptions {
    selectedTypeDefs?: DocumentNode;
}

export function extractResolversFromSchema(schema: GraphQLSchema, options ?: ExtractResolversFromSchemaOptions): IResolvers {
    const resolvers: IResolvers = {};
    const typeMap = schema.getTypeMap();
    let selectedTypeNames: string[];
    if( options && options.selectedTypeDefs) {
        const definitionNodes = getDefinitionNodesFromTypeDefs(options.selectedTypeDefs);
        for (const definitionNode of definitionNodes) {
            if (isGraphQLType(definitionNode) || isGraphQLTypeExtension(definitionNode)) {
                selectedTypeNames = selectedTypeNames || [];
                selectedTypeNames.push(definitionNode.name.value);
            }
        }
    }
    for (const typeName in typeMap) {
        if (!typeName.startsWith('__')){
            const typeDef = typeMap[typeName];
            if (selectedTypeNames && !selectedTypeNames.includes(typeName)) {
                continue;
            }
            if (typeDef instanceof GraphQLScalarType) {
                resolvers[typeName] = typeDef as GraphQLScalarType;
            } else if (typeDef instanceof GraphQLObjectType || typeDef instanceof GraphQLInterfaceType) {
                resolvers[typeName] = extractFieldResolversFromObjectType(typeDef, {
                    selectedTypeDefs: options && options.selectedTypeDefs
                });
            }
        }
    }
    return resolvers;
}