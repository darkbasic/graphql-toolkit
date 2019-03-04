import { DocumentNode, Source, parse, DefinitionNode } from "graphql";
import { isStringTypes, isSourceTypes } from "./helpers";

export function getDefinitionNodesFromTypeDefs(typeDefs: string | Source | DocumentNode): ReadonlyArray<DefinitionNode> {
    let node: DocumentNode;
    if (isStringTypes(typeDefs) || isSourceTypes(typeDefs)) {
        node = parse(typeDefs);
    } else {
        node = typeDefs;
    }
    return node.definitions;
}
