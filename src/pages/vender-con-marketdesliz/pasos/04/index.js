// app/vender-con-marketdesliz/pasos/04/index.js
"use client";

import { useRouter } from "next/navigation";
import {
  Check,
  ShieldCheck,
  ChevronRight,
  MessageSquare,
  Rocket,
  Info,
  FileText,
  GraduationCap,
  ClipboardCheck,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Paso04Aceptacion() {
  const router = useRouter();

  const irAlPaso05 = () => {
    router.push("/vender-con-marketdesliz/pasos/05");
  };

  return (
    <>
      {/* Hero Section: Two Columns */}
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
        {/* Left Column: Acceptance Content */}
        <div className="space-y-8">
          <div className="space-y-4">
            <span className="inline-block rounded-full bg-[#f5f3ff] px-4 py-1 text-xs font-semibold uppercase tracking-wider text-[#7c3aed]">
              Aceptación
            </span>
            <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-5xl">
              Tu solicitud <br />
              <span className="text-[#5b21b6]">puede continuar.</span>
            </h1>
            <p className="max-w-md text-lg text-[#64748b]">
              Queremos que formes parte del proceso de vendedores de MarketDesliz.
            </p>
          </div>

          {/* Status Checklist Card */}
          <Card className="border-none bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] overflow-hidden">
            <CardContent className="p-6 space-y-4">
              <div className="space-y-4">
                {[
                  "Entrevista revisada",
                  "Disponibilidad compatible",
                  "Aceptado para continuar",
                ].map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between border-b border-slate-50 pb-4 last:border-0 last:pb-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f5f3ff] text-[#7c3aed]">
                        <Check className="h-4 w-4 stroke-[3px]" />
                      </div>
                      <span className="font-medium text-slate-700">{item}</span>
                    </div>
                    <Check className="h-5 w-5 text-emerald-500 stroke-[3px]" />
                  </div>
                ))}
              </div>

              {/* Info Box */}
              <div className="mt-6 flex items-start gap-4 rounded-2xl bg-[#5b21b6] p-5 text-white">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <p className="text-sm font-medium leading-relaxed opacity-90">
                  Aún falta completar tu alta y capacitación antes de comenzar a vender.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Hero Image (3D Badge) */}
        <div className="relative flex justify-center lg:justify-end">
          <div className="relative w-full max-w-md aspect-square rounded-[3rem] overflow-hidden bg-gradient-to-br from-[#f5f3ff] to-[#ddd6fe] flex items-center justify-center p-8">
            <img
              className="w-full h-full object-contain drop-shadow-2xl"
              src="https://storage.googleapis.com/uxpilot-auth.appspot.com/gen_b89c2d5a85_5126aa9dd91f77e3.png"
              alt="a professional 3D render of a purple lanyard id badge with 'MarketDesliz' logo on it, floating in a"
            />
          </div>
        </div>
      </div>

      {/* Next Steps Section */}
      <div className="mt-20 space-y-8">
        <h2 className="text-2xl font-bold">Lo que sigue</h2>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              step: "05",
              title: "Alta",
              desc: "Entrega tus documentos y realiza la cuota de alta de $100.",
              icon: FileText,
              hasArrow: true,
            },
            {
              step: "06",
              title: "Capacitación",
              desc: "Recibe tu uniforme y guion. Aprende el proceso de venta.",
              icon: GraduationCap,
              hasArrow: true,
            },
            {
              step: "07",
              title: "Evaluación",
              desc: "Practica con un capacitador para confirmar que estás listo para vender.",
              icon: ClipboardCheck,
              hasArrow: true,
            },
            {
              step: "08",
              title: "Activación",
              desc: "Recibe tu gafete y acceso como vendedor activo de MarketDesliz.",
              icon: UserCheck,
              hasArrow: false,
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="relative rounded-[2rem] bg-white p-8 text-center shadow-[0_4px_20px_rgb(0,0,0,0.03)] transition-all hover:shadow-lg"
            >
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#f5f3ff] text-[#7c3aed] relative">
                <item.icon className="h-8 w-8" />
                <span className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-white text-xs font-bold text-[#7c3aed] shadow-sm border border-slate-100">
                  {item.step}
                </span>
              </div>
              <h3 className="mb-2 text-lg font-bold">{item.title}</h3>
              <p className="text-sm leading-relaxed text-[#64748b]">
                {item.desc.includes("$100") ? (
                  <>
                    {item.desc.split("$100")[0]}
                    <span className="font-bold text-[#5b21b6]">$100</span>
                    {item.desc.split("$100")[1]}
                  </>
                ) : (
                  item.desc
                )}
              </p>
              {item.hasArrow && (
                <div className="absolute top-1/2 -right-4 hidden -translate-y-1/2 lg:block">
                  <ChevronRight className="h-6 w-6 text-slate-200" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Call to Action Banner */}
      <div className="mt-12 overflow-hidden rounded-[2.5rem] bg-white p-8 shadow-[0_4px_25px_rgb(0,0,0,0.03)] border border-slate-50">
        <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
          <div className="flex items-center gap-6">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#f5f3ff] text-[#7c3aed]">
              <Rocket className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold">Estás a un paso de comenzar.</h3>
              <p className="text-slate-500">
                Completa tu alta para seguir avanzando en el proceso.
              </p>
            </div>
          </div>
          <Button
            size="lg"
            onClick={irAlPaso05}
            className="h-14 rounded-2xl bg-[#5b21b6] px-8 text-lg font-semibold hover:bg-[#4c1d95] transition-all transform hover:scale-[1.02]"
          >
            Comenzar mi alta
            <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Support Section */}
      <div className="mt-8 flex flex-col items-center justify-between gap-6 rounded-[2rem] bg-white p-6 shadow-[0_4px_20px_rgb(0,0,0,0.02)] md:flex-row">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-400">
            <Info className="h-5 w-5" />
          </div>
          <div className="space-y-0.5 text-center md:text-left">
            <h4 className="font-bold">¿Tienes dudas?</h4>
            <p className="text-xs text-slate-400">
              Puedes contactarnos en cualquier momento.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          className="h-12 rounded-xl border-slate-200 px-6 font-semibold text-slate-600 hover:bg-slate-50"
        >
          <MessageSquare className="mr-2 h-4 w-4" />
          Contactar soporte
        </Button>
      </div>
    </>
  );
}