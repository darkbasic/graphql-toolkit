import { GraphQLSchema, buildClientSchema } from 'graphql';
import { SchemaLoader } from './schema-loader';
import { existsSync, readFileSync } from 'fs';
import * as isValidPath from 'is-valid-path';
import { extname, isAbsolute, resolve as resolvePath } from 'path';

export class IntrospectionFromFileLoader implements SchemaLoader {
  stripBOM(content: string) {
    content = content.toString();
    // Remove byte order marker. This catches EF BB BF (the UTF-8 BOM)
    // because the buffer-to-string conversion in `fs.readFileSync()`
    // translates it to FEFF, the UTF-16 BOM.
    if (content.charCodeAt(0) === 0xfeff) {
      content = content.slice(1);
    }

    return content;
  }

  parseBOM(content: string) {
    return JSON.parse(this.stripBOM(content));
  }

  canHandle(pointerToSchema: string): boolean {
    return isValidPath(pointerToSchema) && existsSync(pointerToSchema) && extname(pointerToSchema) === '.json';
  }

  handle(pointerToSchema: string, _options?: any): Promise<GraphQLSchema> {
    return new Promise<GraphQLSchema>((resolve, reject) => {
      const fullPath = isAbsolute(pointerToSchema) ? pointerToSchema : resolvePath(process.cwd(), pointerToSchema);

      if (existsSync(fullPath)) {
        try {
          const fileContent = readFileSync(fullPath, 'utf8');

          if (!fileContent) {
            reject(`Unable to read local introspection file: ${fullPath}`);
          }

          let introspection = this.parseBOM(fileContent);

          if (introspection.data) {
            introspection = introspection.data;
          }

          if (!introspection.__schema) {
            throw new Error('Invalid schema provided!');
          }

          resolve(buildClientSchema(introspection));
        } catch (e) {
          reject(e);
        }
      } else {
        reject(`Unable to locate local introspection file: ${fullPath}`);
      }
    });
  }
}
