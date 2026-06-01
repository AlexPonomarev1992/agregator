'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { ModeDefinition, ParameterDef } from '@/lib/models/types';
import { ParameterField } from '../ParameterField';
import { AdvancedSettings } from '../AdvancedSettings';
import { GenerationActionBar } from '../GenerationActionBar';

export interface DynamicFormProps {
  mode: ModeDefinition;
  defaultValues?: Record<string, unknown>;
  onValuesChange?: (values: Record<string, unknown>) => void;
  onSubmit?: (values: Record<string, unknown>) => void;
  userCredits: number;
  modelPrice: (params: Record<string, unknown>) => number;
}

function buildDefaultValues(params: ParameterDef[]): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const p of params) {
    if (p.defaultValue !== undefined) {
      result[p.key] = p.defaultValue;
    } else {
      switch (p.type) {
        case 'switch':
          result[p.key] = false;
          break;
        case 'tagInput':
        case 'dialogueList':
          result[p.key] = [];
          break;
        case 'imageUpload':
        case 'audioUpload':
        case 'videoUpload':
        case 'maskUpload':
          result[p.key] = p.multiple ? [] : '';
          break;
        default:
          result[p.key] = '';
      }
    }
  }
  return result;
}

function isDependencySatisfied(
  param: ParameterDef,
  values: Record<string, unknown>
): boolean {
  const dep = param.dependsOn;
  if (!dep) return true;
  const parentValue = values[dep.key];
  if (dep.equals !== undefined) return parentValue === dep.equals;
  if (dep.notEquals !== undefined) return parentValue !== dep.notEquals;
  return true;
}

export function DynamicForm({
  mode,
  defaultValues,
  onValuesChange,
  onSubmit,
  userCredits,
  modelPrice,
}: DynamicFormProps) {
  const [values, setValues] = useState<Record<string, unknown>>(() => ({
    ...buildDefaultValues(mode.parameters),
    ...defaultValues,
  }));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when mode changes
  useEffect(() => {
    setValues({
      ...buildDefaultValues(mode.parameters),
      ...defaultValues,
    });
    setErrors({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode.id]);

  const handleChange = useCallback(
    (key: string, val: unknown) => {
      setValues((prev) => {
        const next = { ...prev, [key]: val };
        onValuesChange?.(next);
        return next;
      });
      if (errors[key]) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }
    },
    [errors, onValuesChange]
  );

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    for (const param of mode.parameters) {
      if (!isDependencySatisfied(param, values)) continue;
      if (!param.required) continue;
      const val = values[param.key];
      if (
        val === undefined ||
        val === null ||
        val === '' ||
        (Array.isArray(val) && val.length === 0)
      ) {
        newErrors[param.key] = `${param.label}: обязательное поле`;
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [mode.parameters, values]);

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      await onSubmit?.(values);
    } finally {
      setIsSubmitting(false);
    }
  }, [validate, onSubmit, values]);

  const handleReset = useCallback(() => {
    const fresh = { ...buildDefaultValues(mode.parameters), ...defaultValues };
    setValues(fresh);
    setErrors({});
    onValuesChange?.(fresh);
  }, [mode.parameters, defaultValues, onValuesChange]);

  const basicParams = mode.parameters.filter((p) => p.visibility === 'basic');
  const advancedParams = mode.parameters.filter((p) => p.visibility === 'advanced');
  const currentCredits = modelPrice(values);

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
      className="flex flex-col gap-4"
    >
      {/* Basic fields */}
      <div className="flex flex-col gap-4">
        {basicParams.map((param) => {
          const visible = isDependencySatisfied(param, values);
          return (
            <AnimatePresence key={param.key} mode="wait">
              {visible && (
                <motion.div
                  key={param.key}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ParameterField
                    schema={param}
                    value={values[param.key]}
                    onChange={(val) => handleChange(param.key, val)}
                    error={errors[param.key]}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          );
        })}
      </div>

      {/* Advanced fields */}
      {advancedParams.length > 0 && (
        <AdvancedSettings>
          {advancedParams.map((param) => {
            const visible = isDependencySatisfied(param, values);
            return (
              <AnimatePresence key={param.key} mode="wait">
                {visible && (
                  <motion.div
                    key={param.key}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <ParameterField
                      schema={param}
                      value={values[param.key]}
                      onChange={(val) => handleChange(param.key, val)}
                      error={errors[param.key]}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            );
          })}
        </AdvancedSettings>
      )}

      {/* Action bar */}
      <GenerationActionBar
        credits={currentCredits}
        userCredits={userCredits}
        isLoading={isSubmitting}
        onGenerate={handleSubmit}
        onReset={handleReset}
      />
    </form>
  );
}
