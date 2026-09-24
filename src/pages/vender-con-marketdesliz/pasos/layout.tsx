// app/vender-con-marketdesliz/pasos/layout.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronLeft,
  Check,
  Calendar,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const steps = [
  { id: '01', label: 'Requisitos', path: '/vender-con-marketdesliz/pasos/01' },
  { id: '02', label: 'Disponibilidad', path: '/vender-con-marketdesliz/pasos/02' },
  { id: '03', label: 'Entrevista', path: '/vender-con-marketdesliz/pasos/03' },
  { id: '04', label: 'Aceptación', path: '/vender-con-marketdesliz/pasos/04' },
  { id: '05', label: 'Alta', path: '/vender-con-marketdesliz/pasos/05' },
  { id: '06', label: 'Capacitación', path: '/vender-con-marketdesliz/pasos/06' },
  { id: '07', label: 'Evaluación', path: '/vender-con-marketdesliz/pasos/07' },
  { id: '08', label: 'Activación', path: '/vender-con-marketdesliz/pasos/08' },
];

export default function PasosLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const currentIndex = steps.findIndex((s) => pathname.startsWith(s.path));

  // Si no se encuentra, por defecto paso 1
  const activeIndex = currentIndex === -1 ? 0 : currentIndex;
  const previousPath =
    activeIndex > 0 ? steps[activeIndex - 1].path : "/vender-con-marketdesliz";

  return (
    <div className="h-screen overflow-hidden bg-white flex flex-col">
      {/* ZONA FIJA: back link + stepper */}
      <div className="flex-shrink-0 px-12 pt-8 pb-4">
        {/* Botón volver dinámico */}
        <Link
          href={previousPath}
          className="flex items-center gap-2 text-primary font-bold text-sm mb-10 hover:underline"
        >
          <ChevronLeft className="w-4 h-4" />
          {activeIndex > 0
            ? `Volver a ${steps[activeIndex - 1].label}`
            : "Volver a Cómo funciona"}
        </Link>

        {/* Stepper dinámico */}
        <div className="flex items-start justify-between mb-6 relative">
          <div className="absolute top-5 left-10 right-10 h-[2px] bg-gray-100 -z-10"></div>
          {steps.map((step, idx) => {
            const status =
              idx < activeIndex
                ? "completed"
                : idx === activeIndex
                ? "current"
                : "pending";
            return (
              <div key={step.id} className="flex flex-col items-center gap-3">
                <div
                  className={cn(
                    "w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300",
                    status === "completed"
                      ? "bg-primary/10 text-primary border-2 border-primary/20"
                      : status === "current"
                      ? "bg-primary text-white step-shadow ring-4 ring-primary/20"
                      : "bg-white border-2 border-gray-100 text-gray-300"
                  )}
                >
                  {status === "completed" ? (
                    <Check className="w-6 h-6 stroke-[3px]" />
                  ) : status === "current" && idx === 2 ? (
                    <Avatar className="w-5 h-5 opacity-50 grayscale">
                      <AvatarFallback>?</AvatarFallback>
                    </Avatar>
                  ) : status === "current" && idx === 1 ? (
                    <Calendar className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-bold">{step.id}</span>
                  )}
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    {step.id}
                  </span>
                  <span
                    className={cn(
                      "text-[13px] font-bold whitespace-nowrap mt-0.5",
                      status === "current" ? "text-foreground" : "text-gray-400"
                    )}
                  >
                    {step.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CONTENIDO DEL PASO CON SCROLL */}
      <div className="flex-1 min-h-0 overflow-y-auto px-12 pb-8">
        {children}
      </div>
    </div>
  );
}