import SwaggerParser from '@apidevtools/swagger-parser';
import { load as loadYaml } from 'js-yaml';

const SUCCESS_RESPONSE_STATUSES = new Set(['200', '201', '204']);

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function refName(ref) {
  const match =
    /^#\/components\/(?:schemas|parameters|responses|headers)\/(.+)$/.exec(ref);
  return match ? match[1] : null;
}

function resolveRef(spec, ref) {
  if (!ref?.startsWith('#/')) {
    return null;
  }

  const segments = ref.slice(2).split('/');
  let current = spec;
  for (const segment of segments) {
    if (!isObject(current)) {
      return null;
    }
    current = current[segment];
  }
  return current ?? null;
}

function deref(spec, node, seen = new Set()) {
  if (!isObject(node)) {
    return node;
  }

  if (node.$ref) {
    if (seen.has(node.$ref)) {
      return node;
    }
    seen.add(node.$ref);
    const resolved = resolveRef(spec, node.$ref);
    if (!resolved) {
      return node;
    }
    return deref(spec, resolved, seen);
  }

  if (Array.isArray(node)) {
    return node.map((item) => deref(spec, item, seen));
  }

  const output = {};
  for (const [key, value] of Object.entries(node)) {
    output[key] = deref(spec, value, seen);
  }
  return output;
}

function collectOperations(spec) {
  const operations = new Map();

  for (const [path, pathItem] of Object.entries(spec.paths ?? {})) {
    for (const method of [
      'get',
      'post',
      'put',
      'patch',
      'delete',
      'head',
      'options',
    ]) {
      const operation = pathItem?.[method];
      if (!operation) {
        continue;
      }

      operations.set(`${method.toUpperCase()} ${path}`, {
        path,
        method,
        operation: deref(spec, operation),
      });
    }
  }

  return operations;
}

function schemaProperties(schema) {
  if (!isObject(schema)) {
    return {};
  }

  if (schema.properties && isObject(schema.properties)) {
    return schema.properties;
  }

  if (schema.allOf) {
    const merged = {};
    for (const part of schema.allOf) {
      Object.assign(merged, schemaProperties(part));
    }
    return merged;
  }

  return {};
}

function schemaRequired(schema) {
  if (!isObject(schema)) {
    return new Set();
  }

  const required = new Set(schema.required ?? []);
  if (schema.allOf) {
    for (const part of schema.allOf) {
      for (const field of schemaRequired(part)) {
        required.add(field);
      }
    }
  }
  return required;
}

function schemaType(schema) {
  if (!isObject(schema)) {
    return 'unknown';
  }

  if (schema.type) {
    return schema.type;
  }

  if (schema.allOf?.length) {
    return schemaType(schema.allOf[0]);
  }

  if (schema.$ref) {
    return `ref:${refName(schema.$ref) ?? schema.$ref}`;
  }

  return 'unknown';
}

function schemaEnum(schema) {
  if (!isObject(schema) || !Array.isArray(schema.enum)) {
    return null;
  }
  return schema.enum;
}

function requestBodySchema(operation) {
  const content = operation.requestBody?.content;
  if (!isObject(content)) {
    return null;
  }
  const json = content['application/json'];
  return json?.schema ?? null;
}

function responseSchema(operation, status) {
  const response = operation.responses?.[status];
  const content = response?.content;
  if (!isObject(content)) {
    return null;
  }
  const json = content['application/json'];
  return json?.schema ?? null;
}

function operationParameters(operation) {
  return Array.isArray(operation.parameters) ? operation.parameters : [];
}

function breakingChanges(baseSpec, headSpec) {
  const changes = [];
  const baseOps = collectOperations(baseSpec);
  const headOps = collectOperations(headSpec);

  for (const [key, baseEntry] of baseOps.entries()) {
    const headEntry = headOps.get(key);
    if (!headEntry) {
      changes.push(`Removed operation: ${key}`);
      continue;
    }

    const baseOperation = baseEntry.operation;
    const headOperation = headEntry.operation;

    for (const status of Object.keys(baseOperation.responses ?? {})) {
      if (
        SUCCESS_RESPONSE_STATUSES.has(status) &&
        !headOperation.responses?.[status]
      ) {
        changes.push(`Removed success response ${status} from ${key}`);
      }
    }

    const baseParams = operationParameters(baseOperation);
    const headParams = operationParameters(headOperation);
    const headParamNames = new Set(
      headParams.map((param) => `${param.in}:${param.name}`),
    );

    for (const param of baseParams) {
      const identity = `${param.in}:${param.name}`;
      if (param.required && !headParamNames.has(identity)) {
        changes.push(
          `Removed required ${param.in} parameter ${param.name} from ${key}`,
        );
      }
    }

    const baseBody = requestBodySchema(baseOperation);
    const headBody = requestBodySchema(headOperation);
    if (baseBody && headBody) {
      compareSchemas(changes, `request body of ${key}`, baseBody, headBody, {
        request: true,
      });
    } else if (baseBody && !headBody) {
      changes.push(`Removed request body from ${key}`);
    }

    for (const status of SUCCESS_RESPONSE_STATUSES) {
      const baseResponseSchema = responseSchema(baseOperation, status);
      const headResponseSchema = responseSchema(headOperation, status);
      if (baseResponseSchema && headResponseSchema) {
        compareSchemas(
          changes,
          `response ${status} of ${key}`,
          baseResponseSchema,
          headResponseSchema,
          { request: false },
        );
      }
    }
  }

  for (const path of Object.keys(baseSpec.paths ?? {})) {
    if (!headSpec.paths?.[path]) {
      changes.push(`Removed path: ${path}`);
    }
  }

  return changes;
}

function compareSchemas(changes, label, baseSchema, headSchema, options) {
  const baseProps = schemaProperties(baseSchema);
  const headProps = schemaProperties(headSchema);
  const baseRequired = schemaRequired(baseSchema);
  const headRequired = schemaRequired(headSchema);

  for (const [name, baseProp] of Object.entries(baseProps)) {
    const headProp = headProps[name];
    if (!headProp) {
      if (options.request || baseRequired.has(name)) {
        changes.push(
          `Removed ${options.request ? 'required ' : ''}field ${name} from ${label}`,
        );
      } else {
        changes.push(`Removed response property ${name} from ${label}`);
      }
      continue;
    }

    if (!baseRequired.has(name) && headRequired.has(name)) {
      changes.push(`Field ${name} became required in ${label}`);
    }

    if (
      isObject(baseProp) &&
      isObject(headProp) &&
      (Object.keys(schemaProperties(baseProp)).length > 0 ||
        Object.keys(schemaProperties(headProp)).length > 0)
    ) {
      compareSchemas(changes, `${label}.${name}`, baseProp, headProp, options);
      continue;
    }

    const baseType = schemaType(baseProp);
    const headType = schemaType(headProp);
    if (
      baseType !== headType &&
      baseType !== 'unknown' &&
      headType !== 'unknown'
    ) {
      changes.push(
        `Incompatible type change for ${name} in ${label}: ${baseType} -> ${headType}`,
      );
    }

    const baseEnum = schemaEnum(baseProp);
    const headEnum = schemaEnum(headProp);
    if (baseEnum && headEnum) {
      const narrowed = baseEnum.filter((value) => !headEnum.includes(value));
      if (narrowed.length > 0) {
        changes.push(`Enum narrowed for ${name} in ${label}`);
      }
    }
  }
}

export async function parseOpenApiDocument(source) {
  const document = typeof source === 'string' ? loadYaml(source) : source;

  if (!document || typeof document !== 'object') {
    throw new Error('OpenAPI document could not be parsed.');
  }

  return SwaggerParser.parse(document);
}

export async function findOpenApiBreakingChanges(baseSource, headSource) {
  const baseSpec = await SwaggerParser.dereference(
    await parseOpenApiDocument(baseSource),
  );
  const headSpec = await SwaggerParser.dereference(
    await parseOpenApiDocument(headSource),
  );
  const changes = breakingChanges(baseSpec, headSpec);
  return {
    breaking: changes.length > 0,
    changes,
  };
}
