'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown, ChevronUp, Info } from '@/components/ui/icons';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { chatModels } from '@/lib/mock/chat-models';
import type { ConversationSettings as ConversationSettingsType, Persona, ReasoningEffort } from '@/types/ai';

interface ConversationSettingsProps {
  open: boolean;
  onClose: () => void;
  settings: ConversationSettingsType;
  onSettingsChange: (settings: ConversationSettingsType) => void;
  persona: Persona | null;
}

const reasoningLevels: { value: ReasoningEffort; label: string }[] = [
  { value: 'minimal', label: 'Minimal' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'xhigh', label: 'XHigh' },
];

function Toggle({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={cn(
        'relative h-6 w-11 rounded-full transition-colors shrink-0',
        enabled ? 'bg-white' : 'bg-white/10'
      )}
    >
      <motion.div
        animate={{ x: enabled ? 20 : 2 }}
        transition={{ duration: 0.15 }}
        className="absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm"
      />
    </button>
  );
}

function formatContext(tokens: number): string {
  if (tokens >= 1000000) return `${tokens / 1000000}M`;
  return `${tokens / 1000}K`;
}

export function ConversationSettings({
  open,
  onClose,
  settings,
  onSettingsChange,
  persona,
}: ConversationSettingsProps) {
  const [toolsExpanded, setToolsExpanded] = useState(true);
  const [advancedExpanded, setAdvancedExpanded] = useState(false);
  const [showModelList, setShowModelList] = useState(false);

  const selectedModel = chatModels.find((m) => m.id === settings.modelId) ?? chatModels[0];

  const handleReset = () => {
    onSettingsChange({
      modelId: settings.modelId,
      temperature: 0.7,
      maxTokens: 4096,
      systemPrompt: persona?.systemPrompt ?? '',
      memory: false,
      webAccess: selectedModel.capabilities.webAccess,
      functionCalling: false,
      structuredOutputs: false,
      thinking: selectedModel.capabilities.thinking,
      reasoningEffort: 'medium',
      streamResponse: true,
    });
  };

  const update = (patch: Partial<ConversationSettingsType>) => {
    onSettingsChange({ ...settings, ...patch });
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/40"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            className="fixed right-0 top-0 z-50 flex h-full w-[380px] max-w-[90vw] flex-col border-l border-white/10 bg-zinc-900/95 backdrop-blur-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 p-4">
              <h3 className="text-base font-semibold text-white">Настройки модели</h3>
              <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* MODEL */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-white/40">
                  Model
                </label>
                <button
                  onClick={() => setShowModelList(!showModelList)}
                  className="flex items-center justify-between w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white hover:bg-white/[0.06] transition-colors"
                >
                  <span className="font-medium">{selectedModel.name}</span>
                  <ChevronDown className={cn('h-4 w-4 text-white/40 transition-transform', showModelList && 'rotate-180')} />
                </button>

                <AnimatePresence>
                  {showModelList && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]"
                    >
                      {chatModels.map((model) => {
                        const isSelected = model.id === settings.modelId;
                        return (
                          <button
                            key={model.id}
                            onClick={() => {
                              update({
                                modelId: model.id,
                                webAccess: model.capabilities.webAccess && settings.webAccess,
                                thinking: model.capabilities.thinking && settings.thinking,
                                functionCalling: model.capabilities.functionCalling && settings.functionCalling,
                                structuredOutputs: model.capabilities.structuredOutputs && settings.structuredOutputs,
                              });
                              setShowModelList(false);
                            }}
                            className={cn(
                              'flex items-center gap-3 w-full px-4 py-3 text-left transition-colors border-b border-white/5 last:border-b-0',
                              isSelected
                                ? 'bg-white/10 text-white'
                                : 'text-white/70 hover:bg-white/5 hover:text-white'
                            )}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium">{model.name}</div>
                              <div className="text-[11px] text-white/40 mt-0.5">
                                {model.provider} · {formatContext(model.contextWindow)} контекст
                              </div>
                            </div>
                            <Badge variant="default" className="text-[10px] shrink-0">
                              {formatContext(model.contextWindow)}
                            </Badge>
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* MEMORY */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-white/40">
                    Memory
                  </label>
                  <Toggle enabled={settings.memory} onChange={(v) => update({ memory: v })} />
                </div>
                <p className="text-[11px] text-white/30 leading-relaxed">
                  Автоматически добавлять предыдущие сообщения для сохранения контекста. Может увеличить использование токенов.
                </p>
              </div>

              {/* TOOLS */}
              <div className="space-y-3">
                <button
                  onClick={() => setToolsExpanded(!toolsExpanded)}
                  className="flex items-center justify-between w-full"
                >
                  <label className="text-[11px] font-bold uppercase tracking-wider text-white/40">
                    Tools
                  </label>
                  {toolsExpanded ? (
                    <ChevronUp className="h-4 w-4 text-white/30" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-white/30" />
                  )}
                </button>

                <AnimatePresence>
                  {toolsExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="space-y-4 overflow-hidden"
                    >
                      {/* Function calling */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-white/70">Function calling</span>
                          {!selectedModel.capabilities.functionCalling && (
                            <Info className="h-3.5 w-3.5 text-white/20" />
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {settings.functionCalling && (
                            <span className="text-[11px] text-white/30 cursor-pointer hover:text-white transition-colors">
                              Edit
                            </span>
                          )}
                          <Toggle
                            enabled={settings.functionCalling}
                            onChange={(v) => update({ functionCalling: v && selectedModel.capabilities.functionCalling })}
                          />
                        </div>
                      </div>

                      {/* Structured outputs */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-white/70">Structured outputs</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {settings.structuredOutputs && (
                            <span className="text-[11px] text-white/30 cursor-pointer hover:text-white transition-colors">
                              Edit
                            </span>
                          )}
                          <Toggle
                            enabled={settings.structuredOutputs}
                            onChange={(v) => update({ structuredOutputs: v && selectedModel.capabilities.structuredOutputs })}
                          />
                        </div>
                      </div>

                      {/* Web Access */}
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm text-white/70">Web Access</span>
                          {settings.webAccess && (
                            <span className="text-[10px] text-white/30">Source: Google Search</span>
                          )}
                        </div>
                        <Toggle
                          enabled={settings.webAccess}
                          onChange={(v) => update({ webAccess: v && selectedModel.capabilities.webAccess })}
                        />
                      </div>

                      {/* Thinking process */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-white/70">Thinking process</span>
                        <Toggle
                          enabled={settings.thinking}
                          onChange={(v) => update({ thinking: v && selectedModel.capabilities.thinking })}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Reasoning effort */}
              {settings.thinking && (
                <div className="space-y-3">
                  <label className="text-sm font-medium text-white/70">Reasoning effort</label>
                  <div className="flex flex-wrap gap-2">
                    {reasoningLevels.map((level) => (
                      <button
                        key={level.value}
                        onClick={() => update({ reasoningEffort: level.value })}
                        className={cn(
                          'px-4 py-2 text-sm rounded-lg border transition-colors font-medium',
                          settings.reasoningEffort === level.value
                            ? 'bg-white/20 text-white border-white/30'
                            : 'bg-white/5 text-white/50 border-white/10 hover:border-white/20 hover:text-white/80'
                        )}
                      >
                        {level.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Stream Response */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white/70">Stream Response</span>
                <Toggle
                  enabled={settings.streamResponse}
                  onChange={(v) => update({ streamResponse: v })}
                />
              </div>

              {/* ADVANCED */}
              <div className="space-y-3">
                <button
                  onClick={() => setAdvancedExpanded(!advancedExpanded)}
                  className="flex items-center justify-between w-full"
                >
                  <label className="text-[11px] font-bold uppercase tracking-wider text-white/40">
                    Advanced
                  </label>
                  {advancedExpanded ? (
                    <ChevronUp className="h-4 w-4 text-white/30" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-white/30" />
                  )}
                </button>

                <AnimatePresence>
                  {advancedExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="space-y-5 overflow-hidden"
                    >
                      {/* Temperature */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm text-white/70">Температура</label>
                          <span className="text-sm font-mono text-white">{settings.temperature.toFixed(1)}</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="2"
                          step="0.1"
                          value={settings.temperature}
                          onChange={(e) => update({ temperature: parseFloat(e.target.value) })}
                          className={cn(
                            'w-full h-2 rounded-full appearance-none cursor-pointer',
                            'bg-white/10',
                            '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-lg'
                          )}
                        />
                        <div className="flex justify-between text-[10px] text-white/30">
                          <span>Точный</span>
                          <span>Креативный</span>
                        </div>
                      </div>

                      {/* Max tokens */}
                      <div className="space-y-2">
                        <label className="text-sm text-white/70">Максимум токенов</label>
                        <Input
                          type="number"
                          min={256}
                          max={16384}
                          value={settings.maxTokens}
                          onChange={(e) => update({ maxTokens: parseInt(e.target.value) || 4096 })}
                        />
                      </div>

                      {/* System prompt */}
                      <div className="space-y-2">
                        <label className="text-sm text-white/70">Системный промпт</label>
                        <Textarea
                          value={settings.systemPrompt}
                          onChange={(e) => update({ systemPrompt: e.target.value })}
                          rows={4}
                          placeholder="Задайте поведение ассистента..."
                        />
                      </div>

                      {/* Current persona */}
                      {persona && (
                        <div className="space-y-2">
                          <label className="text-sm text-white/70">Персона</label>
                          <Badge variant="purple">{persona.name}</Badge>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-white/10 p-4">
              <button
                onClick={handleReset}
                className="text-sm text-white/40 transition-colors hover:text-white"
              >
                Сбросить по умолчанию
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
