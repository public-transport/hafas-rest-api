const fs = require('fs');
const TJS = require('typescript-json-schema')

const files = ['node_modules/@types/hafas-client/index.d.ts'];
const program = TJS.getProgramFromFiles(files);
const schema = TJS.generateSchema(program, "*", {}, files);

const components = {
    components: {
        schemas: schema.definitions
    }
}
const openApiSchema = JSON.stringify(components, null, 2)
    .replaceAll('#/definitions/', '#/components/schemas/')
    .replaceAll(/"type": \[(.|\n)*?\]/g, '"type": "string"') // type as a list is not valid in OpenAPI, using string as default!
    .replaceAll('"type": "null"', '"type": "string"'); // type null is not valid in OpenAPI, using string as default!

fs.writeFileSync('./routes/schema/responses.json', openApiSchema);