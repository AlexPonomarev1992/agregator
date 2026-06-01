import { z, type ZodTypeAny } from "zod";
import type { ParameterDef, SelectOption } from "./types";

/**
 * Build a Zod schema for an arbitrary parameter definition.
 * Required-ness, min/max, dependsOn are honored.
 */
function buildFieldSchema(param: ParameterDef): ZodTypeAny {
  const { type, required, min, max, maxLength, options } = param;

  const enumFromOptions = (opts: SelectOption[] | undefined): ZodTypeAny => {
    if (!opts || opts.length === 0) return z.string();
    const values = opts.map((o) => o.value) as [string, ...string[]];
    return z.enum(values);
  };

  switch (type) {
    case "longtext":
    case "text": {
      let s = z.string();
      if (required) s = s.min(1, `${param.label}: обязательное поле`);
      if (typeof maxLength === "number") s = s.max(maxLength);
      return s;
    }

    case "select":
    case "mode":
    case "aspectRatio":
    case "duration":
    case "resolution":
    case "styleSelect":
    case "colorPalette":
      return enumFromOptions(options);

    case "slider":
    case "number": {
      let s = z.number();
      if (typeof min === "number") s = s.min(min);
      if (typeof max === "number") s = s.max(max);
      return s;
    }

    case "switch":
      return z.boolean();

    case "imageUpload":
    case "audioUpload":
    case "videoUpload":
    case "maskUpload": {
      const single = z.string().url();
      if (param.multiple) {
        return z.array(single);
      }
      return single;
    }

    case "numberOfImages":
      return z.number().int().min(1).max(4);

    case "tagInput":
      return z.array(z.string()).max(8);

    case "dialogueList":
      return z.array(
        z.object({
          voiceId: z.string().min(1),
          text: z.string().min(1),
        })
      );

    case "voicePicker":
      return enumFromOptions(options);

    default: {
      const _exhaustive: never = type;
      void _exhaustive;
      return z.unknown();
    }
  }
}

/**
 * Wraps the field with optional/required logic and `dependsOn` semantics.
 * If `dependsOn` is present, the field is validated only when the parent
 * matches; otherwise it must be absent / optional.
 */
function wrapField(param: ParameterDef, base: ZodTypeAny): ZodTypeAny {
  // Default behavior — optional unless required and no dependency
  if (!param.dependsOn) {
    return param.required ? base : base.optional();
  }

  // Conditional schemas are handled at superRefine level on the object,
  // but we still mark base as optional here so single-field parse passes.
  return base.optional();
}

/**
 * Builds a Zod object schema for a set of parameters.
 * Conditional dependencies are enforced via superRefine on the resulting object.
 */
export function buildZodSchema(parameters: ParameterDef[]): z.ZodTypeAny {
  const shape: Record<string, ZodTypeAny> = {};
  for (const param of parameters) {
    const base = buildFieldSchema(param);
    shape[param.key] = wrapField(param, base);
  }

  const objectSchema = z.object(shape);

  return objectSchema.superRefine((data, ctx) => {
    for (const param of parameters) {
      const dep = param.dependsOn;
      if (!dep) continue;

      const parentValue = (data as Record<string, unknown>)[dep.key];
      const matches =
        (dep.equals !== undefined && parentValue === dep.equals) ||
        (dep.notEquals !== undefined && parentValue !== dep.notEquals);

      if (!matches) continue; // dependency not satisfied — field is not validated

      const value = (data as Record<string, unknown>)[param.key];
      if (param.required && (value === undefined || value === null || value === "")) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [param.key],
          message: `${param.label}: обязательное поле`,
        });
      }
    }
  });
}
