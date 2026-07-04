import fs from 'node:fs';
import { load } from 'js-yaml'
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

export function loadSchema(filePath) {
  const fileContent = fs.readFileSync(filePath, 'utf8');
  return load(fileContent);
}

export function validateAgainstSchema(data, schema) {
  const validate = ajv.compile(schema);
  const valid = validate(data);
  return { valid, errors: validate.errors ?? [] };
}

export function validateAgainstSchemaFile(data, schemaFilePath) {
  const schema = loadSchema(schemaFilePath);
  return validateAgainstSchema(data, schema);
}