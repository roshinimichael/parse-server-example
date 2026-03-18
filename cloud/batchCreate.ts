/**
 * batchCreate — create many Parse objects of the same class in one call.
 *
 * Request body: { className: string; objects: object[] }
 * Response:     { created: number; ids: string[] }
 */

interface BatchCreateRequest {
  className: string;
  objects: Record<string, unknown>[];
}

interface BatchCreateResponse {
  created: number;
  ids: string[];
}

Parse.Cloud.define(
  'batchCreate',
  async (request: Parse.Cloud.FunctionRequest): Promise<BatchCreateResponse> => {
    const { className, objects } = request.params as BatchCreateRequest;

    if (!className || typeof className !== 'string') {
      throw new Parse.Error(Parse.Error.INVALID_QUERY, 'className is required');
    }
    if (!Array.isArray(objects) || objects.length === 0) {
      throw new Parse.Error(Parse.Error.INVALID_QUERY, 'objects must be a non-empty array');
    }
    if (objects.length > 200) {
      throw new Parse.Error(Parse.Error.INVALID_QUERY, 'batchCreate supports at most 200 objects');
    }

    const ParseClass = Parse.Object.extend(className);
    const instances = objects.map((attrs) => {
      const obj = new ParseClass();
      Object.entries(attrs).forEach(([k, v]) => obj.set(k, v));
      return obj;
    });

    await Parse.Object.saveAll(instances, { useMasterKey: true });

    return {
      created: instances.length,
      ids: instances.map((o) => o.id!),
    };
  },
);
