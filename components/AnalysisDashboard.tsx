import React from 'react';
import { TrendReport, ShoppingItem } from '../types';
import { MapPin, Palette, Scissors, Factory, ShoppingBag, Sparkles, TrendingUp, ExternalLink, Tag, Loader2, Info } from 'lucide-react';
import ScrollReveal from './ScrollReveal';

interface Props {
  report: TrendReport;
  generatedImageUrl: string | null;
  isGeneratingImage: boolean;
  shoppingResults: ShoppingItem[];
  isSearchingShopping: boolean;
  shoppingSummary: string | null;
}

const formatShoppingSummary = (text: string) => {
  if (!text) return null;
  
  const cleanedText = text
    .replace(/\*\*\*/g, '**')
    .replace(/####/g, '###')
    .replace(/([^\n])###/g, '$1\n###')
    .replace(/([^\n])\*\s/g, '$1\n* ')
    .replace(/([^\n])\d\.\s/g, '$1\n1. ');

  return cleanedText.split('\n').map((line, lineIdx) => {
    const trimmedLine = line.trim();
    if (!trimmedLine) return <div key={lineIdx} className="h-3"></div>;
    
    if (trimmedLine.startsWith('###')) {
      const content = trimmedLine.replace(/^#+\s*/, '').replace(/\*\*/g, '');
      return (
        <h4 key={lineIdx} className="text-sm font-bold text-brand-800 dark:text-brand-300 mt-6 mb-3 uppercase tracking-wide border-b border-brand-100 dark:border-brand-900 pb-2 flex items-center">
          <Info className="w-3 h-3 mr-2" />
          {content}
        </h4>
      );
    }
    
    if (trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ')) {
       const content = trimmedLine.replace(/^[\*\-]\s*/, '');
       const parts = content.split(/(\*\*.*?\*\*)/g);
       
       return (
         <div key={lineIdx} className="flex items-start mb-2 ml-1 group hover:bg-white/50 dark:hover:bg-slate-800/50 p-1.5 rounded-lg transition-colors">
            <div className="min-w-[6px] h-[6px] rounded-full bg-brand-400 mt-2 mr-3 flex-shrink-0 group-hover:scale-125 transition-transform"></div>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-sm">
                {parts.map((part, i) => {
                  if (part.startsWith('**') && part.endsWith('**')) {
                     const boldContent = part.slice(2, -2);
                     return <strong key={i} className="font-bold text-brand-900 dark:text-brand-100">{boldContent}</strong>;
                  }
                  return part;
                })}
            </p>
         </div>
       );
    }
    
    const parts = line.split(/(\*\*.*?\*\*)/g);
    return (
      <p key={lineIdx} className="mb-2 text-slate-700 dark:text-slate-300 leading-relaxed text-sm">
        {parts.map((part, i) => {
          if (part.startsWith('**') && part.endsWith('**')) {
             const content = part.slice(2, -2).replace(/^\*+|\*+$/g, ''); 
             return <strong key={i} className="font-bold text-slate-900 dark:text-slate-100 bg-brand-50 dark:bg-brand-900/40 px-1 rounded">{content}</strong>;
          }
          return part;
        })}
      </p>
    );
  });
};

const AnalysisDashboard: React.FC<Props> = ({ 
  report, 
  generatedImageUrl, 
  isGeneratingImage, 
  shoppingResults, 
  isSearchingShopping,
  shoppingSummary 
}) => {
  return (
    <div className="space-y-8 pb-12">
      {/* Header Summary */}
      <ScrollReveal animation="zoom-in">
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 rounded-3xl shadow-sm border border-white/60 dark:border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-brand-100 to-purple-100 dark:from-brand-900/30 dark:to-purple-900/30 rounded-full blur-3xl -mr-20 -mt-20 opacity-60 group-hover:opacity-80 transition-opacity duration-1000"></div>
          
          <div className="relative flex flex-col md:flex-row items-start justify-between gap-8">
            <div className="flex-1 z-10">
              <div className="flex items-center space-x-2 text-brand-700 dark:text-brand-300 mb-4 bg-brand-50 dark:bg-brand-900/30 inline-flex px-3 py-1 rounded-full border border-brand-100 dark:border-brand-800">
                <MapPin className="w-3 h-3" />
                <span className="font-bold text-[10px] tracking-[0.15em] uppercase">{report.location_context}</span>
              </div>
              <h2 className="text-5xl md:text-6xl font-serif text-slate-900 dark:text-slate-100 leading-[1.1] tracking-tight mb-2">
                {report.the_vibe}
              </h2>
              <div className="h-1 w-24 bg-gradient-to-r from-brand-500 to-transparent rounded-full mt-4"></div>
            </div>
            
            <div className="flex-shrink-0 self-start md:self-center z-10 transform hover:scale-105 transition-transform duration-300">
              <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-md text-brand-900 dark:text-brand-100 rounded-[2.5rem] px-8 py-6 flex flex-col items-center justify-center border border-white dark:border-white/10 shadow-lg relative overflow-hidden">
                 <div className="absolute inset-0 bg-gradient-to-br from-white/40 dark:from-white/10 to-transparent"></div>
                 <span className="text-[10px] uppercase tracking-widest font-bold opacity-60 mb-1 leading-none relative z-10">Vastra Score</span>
                 <span className="text-5xl font-serif font-bold leading-none mt-2 relative z-10 bg-clip-text text-transparent bg-gradient-to-br from-brand-700 to-brand-900 dark:from-brand-300 dark:to-brand-500">92</span>
              </div>
            </div>
          </div>
        </div>
      </ScrollReveal>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Col: Analysis & Specs (Width 5) */}
        <div className="lg:col-span-5 space-y-8">
            
          {/* Winning Attributes */}
          <ScrollReveal animation="fade-in-up" delay="delay-100">
            <div className="glass p-8 rounded-3xl shadow-sm hover:shadow-md transition-shadow duration-300">
              <h3 className="text-lg font-bold flex items-center mb-8 text-slate-900 dark:text-slate-100 tracking-tight">
                <div className="p-2 bg-brand-100 dark:bg-brand-900/50 text-brand-600 dark:text-brand-300 rounded-lg mr-3">
                  <TrendingUp className="w-5 h-5" />
                </div>
                Winning Attributes
              </h3>
              <div className="space-y-6">
                {[
                    { icon: Scissors, label: "Silhouette", value: report.winning_attributes.silhouette, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/30" },
                    { icon: Palette, label: "Color Palette", value: report.winning_attributes.color_palette, color: "text-pink-500", bg: "bg-pink-50 dark:bg-pink-900/30" },
                    { icon: Sparkles, label: "Fabric / Print", value: report.winning_attributes.fabric_print, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-900/30" }
                ].map((item, idx) => (
                    <div key={idx} className="flex items-start group p-3 hover:bg-white/60 dark:hover:bg-white/5 rounded-xl transition-colors -mx-3">
                      <div className={`${item.bg} p-3 rounded-2xl mr-4 group-hover:scale-110 transition-transform duration-300 shadow-sm flex-shrink-0`}>
                          <item.icon className={`w-5 h-5 ${item.color}`} />
                      </div>
                      <div>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mb-1.5">{item.label}</p>
                          <p className="font-medium text-slate-800 dark:text-slate-200 leading-snug text-base">{item.value}</p>
                      </div>
                    </div>
                ))}
              </div>
            </div>
          </ScrollReveal>

          {/* Manufacturing Specs */}
          <ScrollReveal animation="fade-in-up" delay="delay-200">
            <div className="bg-slate-900 dark:bg-slate-950 text-slate-50 p-8 rounded-3xl shadow-2xl overflow-hidden relative group border border-slate-800">
               {/* Decorative element */}
               <div className="absolute top-0 right-0 w-64 h-64 bg-brand-600 rounded-full blur-[80px] opacity-20 -mr-20 -mt-20 group-hover:opacity-30 transition-opacity duration-700"></div>
               <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-600 rounded-full blur-[60px] opacity-10 -ml-10 -mb-10 group-hover:opacity-20 transition-opacity duration-700"></div>

               <h3 className="text-lg font-bold flex items-center mb-8 text-white relative z-10 tracking-tight">
                <div className="p-2 bg-white/10 rounded-lg mr-3 backdrop-blur-sm">
                    <Factory className="w-5 h-5 text-brand-200" />
                </div>
                Manufacturing Specs (ONDC)
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm relative z-10">
                  {[
                      { label: "Fabric Primary", value: report.manufacturing_specs.fabric_primary, color: "text-white" },
                      { label: "Procurement", value: report.manufacturing_specs.procurement_intent, color: "text-green-400" },
                      { label: "Estimated GSM", value: `${report.manufacturing_specs.estimated_gsm} GSM`, color: "text-white" },
                      { label: "Sourcing Hub", value: report.manufacturing_specs.sourcing_hub_suggestion, color: "text-brand-300" }
                  ].map((spec, idx) => (
                      <div key={idx} className="bg-white/5 p-4 rounded-2xl border border-white/5 hover:border-white/20 hover:bg-white/10 transition-all duration-300">
                          <p className="text-slate-400 text-[10px] uppercase tracking-wider mb-1.5">{spec.label}</p>
                          <p className={`font-medium ${spec.color}`}>{spec.value}</p>
                      </div>
                  ))}
              </div>
            </div>
          </ScrollReveal>

        </div>

        {/* Right Col: Design Concept (Width 7) */}
        <div className="lg:col-span-7 space-y-8">
            
          {/* Main Visual Card */}
          <ScrollReveal animation="slide-in-right" delay="delay-100">
            <div className="glass p-1 rounded-3xl shadow-sm h-full flex flex-col">
                <div className="bg-white/50 dark:bg-slate-800/40 p-8 rounded-[1.4rem] h-full flex flex-col">
                  <div className="flex items-center space-x-3 text-slate-900 dark:text-slate-100 mb-8">
                      <div className="p-2 bg-brand-100 dark:bg-brand-900/50 text-brand-600 dark:text-brand-300 rounded-xl">
                          <ShoppingBag className="w-5 h-5" />
                      </div>
                      <h3 className="text-lg font-bold tracking-tight">The "Best-Seller" Concept</h3>
                  </div>
                  
                  <div className="mb-8">
                      <h4 className="text-4xl font-serif text-slate-900 dark:text-white mb-4 leading-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">{report.best_seller_concept.product_name}</h4>
                      <div className="flex items-start">
                          <span className="text-6xl text-brand-200 dark:text-brand-800 font-serif mr-4 -mt-4 leading-none opacity-50">"</span>
                          <p className="text-slate-600 dark:text-slate-300 text-lg italic leading-relaxed">{report.best_seller_concept.design_rationale}</p>
                      </div>
                  </div>

                  <div className="flex-grow w-full bg-slate-100 dark:bg-slate-900 rounded-2xl border border-white/50 dark:border-white/10 overflow-hidden min-h-[500px] relative group shadow-inner flex items-center justify-center">
                      <div className="absolute inset-0 bg-grid-pattern opacity-5 dark:opacity-10 dark:invert"></div>
                      {generatedImageUrl ? (
                          <div className="relative w-full h-full flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                              <img src={generatedImageUrl} alt="AI Generated Design" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
                              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
                                  <span className="glass-dark px-4 py-2 rounded-full text-xs text-white font-medium flex items-center shadow-lg">
                                      <Sparkles className="w-3 h-3 mr-2 text-brand-300" />
                                      AI Visualized Concept
                                  </span>
                              </div>
                          </div>
                      ) : isGeneratingImage ? (
                          <div className="flex flex-col items-center justify-center p-8 z-10">
                              <div className="relative mb-8">
                                  <div className="absolute inset-0 bg-brand-400 blur-xl opacity-20 animate-pulse"></div>
                                  <div className="w-16 h-16 border-4 border-brand-500 border-t-transparent rounded-full animate-spin relative z-10"></div>
                              </div>
                              <p className="text-slate-800 dark:text-slate-200 font-bold text-lg animate-pulse tracking-wide">Synthesizing {report.best_seller_concept.product_name}</p>
                              <p className="text-sm text-slate-400 dark:text-slate-500 mt-2 font-mono">Simulating fabric drape & lighting...</p>
                          </div>
                      ) : (
                          <div className="flex items-center justify-center text-slate-300 dark:text-slate-700">
                              <p>Visual pending...</p>
                          </div>
                      )}
                  </div>
                  
                  <div className="mt-8 pt-6 border-t border-slate-200/60 dark:border-slate-700/60">
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mb-3">Prompt Logic</p>
                      <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100/80 dark:border-slate-800 font-mono text-xs text-slate-500 dark:text-slate-400 leading-relaxed shadow-sm">
                          {report.best_seller_concept.image_generation_prompt}
                      </div>
                  </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>

        {/* Shop the Vibe Section */}
        <ScrollReveal animation="fade-in-up" delay="delay-200">
            <div className="glass p-1 rounded-3xl shadow-lg mt-12">
                <div className="bg-white/60 dark:bg-slate-800/60 p-8 rounded-[1.4rem]">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center space-x-3 text-slate-900 dark:text-slate-100">
                            <div className="p-2 bg-brand-100 dark:bg-brand-900/50 text-brand-600 dark:text-brand-300 rounded-xl">
                                <Tag className="w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-bold tracking-tight">Shop Similar Styles</h3>
                        </div>
                        <div className="text-[10px] bg-white dark:bg-slate-900 px-3 py-1.5 rounded-full text-slate-500 dark:text-slate-400 font-mono border border-slate-200 dark:border-slate-700 shadow-sm flex items-center">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                            Live Market Data
                        </div>
                    </div>

                    {isSearchingShopping ? (
                        <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                            <Loader2 className="w-8 h-8 animate-spin mb-4 text-brand-400" />
                            <p className="text-sm font-medium">Scouring e-commerce platforms...</p>
                        </div>
                    ) : (shoppingResults.length > 0 || shoppingSummary) ? (
                        <div>
                            {shoppingSummary && (
                                <div className="mb-10 p-8 bg-slate-50/80 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-inner">
                                    {formatShoppingSummary(shoppingSummary)}
                                </div>
                            )}
                            
                            {shoppingResults.length > 0 && (
                                <>
                                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-6 flex items-center uppercase tracking-widest pl-1">
                                        <ExternalLink className="w-4 h-4 mr-2 text-brand-500" />
                                        Direct Purchase Links
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                                        {shoppingResults.map((item, idx) => (
                                            <a 
                                                key={idx} 
                                                href={item.uri} 
                                                target="_blank" 
                                                rel="noreferrer"
                                                className="group block bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl overflow-hidden hover:shadow-xl hover:border-brand-200 dark:hover:border-brand-700 hover:-translate-y-1 transition-all duration-300 p-1"
                                            >
                                                <div className="p-5 h-full flex flex-col bg-slate-50/30 dark:bg-slate-900/50 rounded-xl group-hover:bg-white dark:group-hover:bg-slate-800 transition-colors">
                                                    <div className="flex items-start justify-between mb-4">
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-300 bg-brand-50 dark:bg-brand-900/30 px-2.5 py-1 rounded-md border border-brand-100 dark:border-brand-800">
                                                            {item.source}
                                                        </span>
                                                        <ExternalLink className="w-3 h-3 text-slate-300 dark:text-slate-600 group-hover:text-brand-500 dark:group-hover:text-brand-400 transition-colors" />
                                                    </div>
                                                    <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm mb-3 line-clamp-2 group-hover:text-brand-700 dark:group-hover:text-brand-300 transition-colors leading-relaxed">
                                                        {item.title}
                                                    </h4>
                                                    <div className="mt-auto pt-3 flex items-center text-xs text-slate-400 dark:text-slate-500 font-medium border-t border-slate-100 dark:border-slate-700 group-hover:border-brand-100 dark:group-hover:border-brand-800">
                                                        <span className="group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors flex items-center">
                                                            View Product <span className="ml-1 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300">→</span>
                                                        </span>
                                                    </div>
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-16 text-slate-400 dark:text-slate-500 text-sm bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                            No direct shopping links found for this specific style.
                        </div>
                    )}
                </div>
            </div>
        </ScrollReveal>
    </div>
  );
};

export default AnalysisDashboard;