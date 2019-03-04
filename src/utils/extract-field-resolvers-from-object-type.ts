import { GraphQLObjectType, GraphQLInterfaceType, DocumentNode, ObjectTypeDefinitionNode } from "graphql";
import { getDefinitionNodesFromTypeDefs } from ".";
import { isGraphQLType, isGraphQLTypeExtension } from "../epoxy/typedefs-mergers/utils";

export interface IFieldResolvers {
    [fieldName: string]: ((...args: any[]) => any) | { subscribe: (...args: any[]) => any };
}

export interface ExtractFieldResolversFromObjectType {
    selectedTypeDefs?: DocumentNode;
}

export function extractFieldResolversFromObjectType(objectType: GraphQLObjectType | GraphQLInterfaceType, options ?: ExtractFieldResolversFromObjectType): IFieldResolvers {
    const fieldResolvers: IFieldResolvers = {};
    const fieldMap = objectType.getFields();
    let selectedFieldNames: string[];
    if( options && options.selectedTypeDefs) {
        const definitionNodes = getDefinitionNodesFromTypeDefs(options.selectedTypeDefs);
        const definitionNode = definitionNodes.find(definitionNode => {
            if (isGraphQLType(definitionNode) || isGraphQLTypeExtension(definitionNode)) {
                return definitionNode.name.value === objectType.name;
            } else {
                return false;
            }
        }) as ObjectTypeDefinitionNode;
        if (definitionNode) {
            selectedFieldNames = definitionNode.fields.map(field => field.name.value);
        } else {
            return {};
        }
    }
    for ( const fieldName in fieldMap ) {
        if (selectedFieldNames && !selectedFieldNames.includes(fieldName)) {
            continue;
        }
        const fieldDefinition = fieldMap[fieldName];
        if ('subscribe' in fieldDefinition) {
            fieldResolvers[fieldName] = {
                subscribe: fieldDefinition.subscribe,
            }
        } else if ('resolve' in fieldDefinition) {
            fieldResolvers[fieldName] = fieldDefinition.resolve;
        }
    }
    return fieldResolvers;
}
