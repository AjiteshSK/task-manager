/**
 * Shapes every document sent to the client: `id` instead of `_id`, no `__v`, and none of
 * the `hidden` fields. Express calls toJSON when it serializes a document with res.json().
 */
export function toJSONOptions(hidden: string[] = []) {
  return {
    virtuals: true, // includes Mongoose's built-in `id` virtual (the _id as a string)
    versionKey: false,
    transform: (_doc: unknown, ret: Record<string, unknown>) => {
      delete ret._id;
      for (const field of hidden) {
        delete ret[field];
      }
      return ret;
    },
  };
}
