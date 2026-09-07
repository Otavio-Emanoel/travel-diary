import React from 'react';
import type { Metadata } from 'next';
import './globals.css';
import { QueryProvider } from '../providers/query-provider';
import { Navbar } from '../components/layout/navbar';

export const metadata: Metadata = {
  title: 'Diário de Viagens — Suas memórias e itinerários organizados',
  description:
    'Documente relatos de viagem, itinerários, fotos e coordenadas em um diário moderno e elegante.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="flex flex-col min-h-screen">
        <QueryProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-stone-200 py-6 text-center text-xs text-stone-500">
            <p>Diário de Viagens — Plataforma Modular e Auto-hospedável para Viajantes</p>
          </footer>
        </QueryProvider>
      </body>
    </html>
  );
}
