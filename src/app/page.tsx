import type { Metadata } from "next";
import { ArchivoBoundary } from "@/components/archivo/ArchivoBoundary";
import { ArchivoExperience } from "@/components/archivo/ArchivoExperience";

export const metadata: Metadata = {
  title: "NOCTA — Tattoo Studio",
  description:
    "Colección Archivo de Valentina Ríos. Tu idea en tu piel: prueba el simulador y proyecta tu concepto antes de agendar.",
};

export default function HomePage() {
  return (
    <ArchivoBoundary>
      <ArchivoExperience />
    </ArchivoBoundary>
  );
}
