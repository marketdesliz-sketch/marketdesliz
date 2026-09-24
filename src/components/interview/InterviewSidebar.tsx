// components/interview/InterviewSidebar.tsx
"use client";

import React from 'react';
import { User, Briefcase, Heart, Star, Megaphone, Users, ShieldCheck } from 'lucide-react';

const SidebarItem = ({ icon: Icon, title, description }: { icon: any; title: string; description: string }) => (
  <div className="flex gap-4 items-start py-4">
    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
      <Icon className="w-5 h-5 text-primary" />
    </div>
    <div>
      <h4 className="font-bold text-sm text-foreground">{title}</h4>
      <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{description}</p>
    </div>
  </div>
);

export function InterviewSidebar() {
  return (
    <aside className="w-[340px] flex flex-col gap-6">
      <div className="bg-white rounded-[2rem] p-8 card-shadow border border-gray-50">
        <h3 className="font-extrabold text-lg mb-4 text-[#1e1b4b]">¿Qué queremos conocer?</h3>

        <div className="flex flex-col">
          <SidebarItem
            icon={User}
            title="Tu historia"
            description="Queremos saber un poco más de ti."
          />
          <SidebarItem
            icon={Briefcase}
            title="Tu momento actual"
            description="A qué te dedicas hoy."
          />
          <SidebarItem
            icon={Heart}
            title="Tu motivación"
            description="Por qué quieres vender con MarketDesliz."
          />
          <SidebarItem
            icon={Star}
            title="Tus aspiraciones"
            description="Qué esperas conseguir con esta oportunidad."
          />
          <SidebarItem
            icon={Megaphone}
            title="Cómo llegaste a nosotros"
            description="Cómo conociste MarketDesliz."
          />
          <SidebarItem
            icon={Users}
            title="Tu experiencia"
            description="No es requisito haber vendido antes."
          />
        </div>

        <div className="mt-8 p-6 rounded-2xl bg-[#f0f4ff] border border-[#e0e7ff] relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-primary" />
              </div>
              <h4 className="font-bold text-sm text-foreground leading-tight">
                No necesitas experiencia en ventas.
              </h4>
            </div>
            <p className="text-xs text-[#4b5563] leading-relaxed">
              Si continúas en el proceso, MarketDesliz te dará un guion y capacitación
              antes de que salgas a vender.
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}