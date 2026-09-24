// components/interview/InterviewForm.tsx
"use client";

import React from 'react';
import { User, Users, Store, Globe, Heart, MessageCircle, CheckCircle2 } from 'lucide-react';
import { cn } from "@/lib/utils";

const StepWrapper = ({ number, title, children }: { number: string; title: string; children: React.ReactNode }) => (
  <div className="flex gap-6 mb-12">
    <div className="shrink-0">
      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-bold text-primary text-sm">
        {number}
      </div>
    </div>
    <div className="flex-1 pt-1.5">
      <h3 className="font-bold text-base text-[#1e1b4b] mb-4">{title}</h3>
      {children}
    </div>
  </div>
);

const SelectionCard = ({ icon: Icon, label, selected }: { icon: any; label: string; selected?: boolean }) => (
  <div className={cn(
    "flex items-center gap-3 p-4 rounded-xl border transition-all cursor-pointer",
    selected
      ? "border-primary bg-indigo-50/50"
      : "border-gray-100 bg-white hover:border-gray-200"
  )}>
    <div className={cn(
      "w-8 h-8 rounded-lg flex items-center justify-center",
      selected ? "bg-primary text-white" : "bg-secondary text-primary"
    )}>
      <Icon className="w-4 h-4" />
    </div>
    <span className={cn("text-sm font-medium", selected ? "text-primary" : "text-muted-foreground")}>
      {label}
    </span>
  </div>
);

export function InterviewForm() {
  return (
    <div className="flex-1 bg-white rounded-[2rem] p-12 card-shadow border border-gray-50">
      <StepWrapper number="01" title="Cuéntanos un poco sobre ti.">
        <textarea
          placeholder="Escribe tu respuesta aquí..."
          className="input-field h-24"
        />
      </StepWrapper>

      <StepWrapper number="02" title="¿Qué haces actualmente?">
        <textarea
          placeholder="Escribe tu respuesta aquí..."
          className="input-field h-24"
        />
      </StepWrapper>

      <StepWrapper number="03" title="¿Por qué te interesa ser vendedor de MarketDesliz?">
        <textarea
          placeholder="Escribe tu respuesta aquí..."
          className="input-field h-24"
        />
      </StepWrapper>

      <StepWrapper number="04" title="¿Qué te gustaría lograr con esta oportunidad?">
        <textarea
          placeholder="Escribe tu respuesta aquí..."
          className="input-field h-24"
        />
      </StepWrapper>

      <StepWrapper number="05" title="¿Cómo conociste MarketDesliz?">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <SelectionCard icon={User} label="Un vendedor" />
          <SelectionCard icon={Users} label="Un amigo / familiar" />
          <SelectionCard icon={Store} label="Vi MarketDesliz en mi comunidad" />
          <SelectionCard icon={Globe} label="Redes / Internet" />
          <SelectionCard icon={Heart} label="Ya soy cliente" />
          <SelectionCard icon={MessageCircle} label="Otro" />
        </div>
        <textarea
          placeholder="Cuéntanos más (opcional)"
          className="input-field h-12"
        />
      </StepWrapper>

      <StepWrapper number="06" title="¿Has tenido experiencia tratando con clientes o vendiendo?">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center justify-between p-4 rounded-xl border-2 border-primary bg-indigo-50/50 cursor-pointer">
            <span className="text-sm font-bold text-primary">Sí</span>
            <CheckCircle2 className="w-5 h-5 text-primary fill-primary text-white" />
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-white cursor-pointer hover:border-gray-200">
            <span className="text-sm font-bold text-muted-foreground">No</span>
          </div>
        </div>
        <p className="text-xs font-medium text-muted-foreground mb-3">Si tu respuesta es sí, cuéntanos brevemente.</p>
        <textarea
          placeholder="Escribe tu respuesta aquí..."
          className="input-field h-24"
        />
      </StepWrapper>
    </div>
  );
}