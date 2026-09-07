import React from 'react';
import Link from 'next/link';
import { Compass, MapPin, Camera, WifiOff, ShieldCheck, ArrowRight, BookOpen } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="relative overflow-hidden hero-gradient">
      {/* Hero Section */}
      <section className="relative pt-20 pb-28 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100/80 border border-amber-300 text-amber-900 text-xs font-semibold mb-8 animate-fade-in">
          <Compass className="w-3.5 h-3.5 text-brand-600" />
          <span>O seu diário de bordo digital e pessoal</span>
        </div>

        <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-stone-900 leading-[1.15] mb-6">
          Guarde suas viagens como histórias,{' '}
          <span className="italic font-normal text-brand-700 underline decoration-amber-300 decoration-wavy underline-offset-8">
            não apenas fotos soltas.
          </span>
        </h1>

        <p className="max-w-2xl mx-auto text-lg sm:text-xl text-stone-600 mb-10 leading-relaxed">
          Conecte itinerários, relatos diários, coordenadas geográficas e momentos inesquecíveis em uma linha do tempo elegante e mapa interativo.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/register"
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-medium text-base shadow-lg shadow-brand-600/25 transition-all flex items-center justify-center gap-2 group"
          >
            <span>Começar Meu Diário</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white hover:bg-stone-50 border border-stone-300 text-stone-800 font-medium text-base shadow-sm transition-all"
          >
            Já tenho uma conta
          </Link>
        </div>
      </section>

      {/* Grid de Diferenciais */}
      <section className="py-16 bg-white/60 border-t border-stone-200/80 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 mb-3">
              Projetado para quem ama viajar
            </h2>
            <p className="text-stone-600 text-base max-w-xl mx-auto">
              Cada funcionalidade foi pensada para a realidade das viagens, de grandes cidades a trilhas remotas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Card 1 */}
            <div className="p-6 rounded-2xl bg-white border border-stone-200/80 shadow-soft hover:border-amber-400 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 mb-4">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl font-bold text-stone-900 mb-2">
                Linha do Tempo
              </h3>
              <p className="text-sm text-stone-600 leading-relaxed">
                Relatos dia a dia com fotos, memórias, gastos e categorias organizadas cronologicamente.
              </p>
            </div>

            {/* Card 2 */}
            <div className="p-6 rounded-2xl bg-white border border-stone-200/80 shadow-soft hover:border-emerald-400 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 mb-4">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl font-bold text-stone-900 mb-2">
                Mapa Interativo
              </h3>
              <p className="text-sm text-stone-600 leading-relaxed">
                Visualize os trajetos percorridos e clique em pontos para ver as fotos tiradas em cada local.
              </p>
            </div>

            {/* Card 3 */}
            <div className="p-6 rounded-2xl bg-white border border-stone-200/80 shadow-soft hover:border-blue-400 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 mb-4">
                <WifiOff className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl font-bold text-stone-900 mb-2">
                Offline no Celular
              </h3>
              <p className="text-sm text-stone-600 leading-relaxed">
                Sem sinal na montanha ou no avião? Registre tudo normalmente; o app sincroniza quando houver Wi-Fi.
              </p>
            </div>

            {/* Card 4 */}
            <div className="p-6 rounded-2xl bg-white border border-stone-200/80 shadow-soft hover:border-purple-400 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700 mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl font-bold text-stone-900 mb-2">
                Sua Privacidade
              </h3>
              <p className="text-sm text-stone-600 leading-relaxed">
                Seus dados não são minerados para anúncios. Suas viagens são privadas até que você decida compartilhar.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
