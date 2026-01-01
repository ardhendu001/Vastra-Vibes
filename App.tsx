import React, { useState, useEffect, useCallback } from 'react';
import { Upload, Loader2, Zap, Shirt, RefreshCw, Settings, AlertCircle, Sparkles, TrendingUp, Moon, Sun, FileCheck } from 'lucide-react';
import { analyzeFashionTrend, generateDesignVisual, findSimilarProducts } from './services/geminiService';
import { AnalysisState, TrendReport, AspectRatio, ImageSize, ImageConfig } from './types';
import AnalysisDashboard from './components/AnalysisDashboard';
import ChatBot from './components/ChatBot';
import ScrollReveal from './components/ScrollReveal';

const App: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<string>("");
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  
  // UX State for Upload
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  
  const [imageConfig, setImageConfig] = useState<ImageConfig>({
      aspectRatio: "1:1",
      imageSize: "1K"
  });
  
  const [state, setState] = useState<AnalysisState>({
    isAnalyzing: false,
    isGeneratingImage: false,
    isSearchingShopping: false,
    report: null,
    generatedImageUrl: null,
    shoppingResults: [],
    shoppingSummary: null,
    error: null,
  });

  // Handle Theme Toggle
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDarkMode(true);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
        const now = new Date();
        setCurrentTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const resetState = () => {
    setState(prev => ({
        ...prev,
        report: null,
        generatedImageUrl: null,
        shoppingResults: [],
        shoppingSummary: null,
        error: null
    }));
    setPreview(null); 
    setFile(null);
    setUploadProgress(0);
  };

  const processFile = useCallback((selectedFile: File) => {
    // Validation Constants
    const MAX_SIZE_BYTES = 100 * 1024 * 1024; // 100MB
    const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

    resetState();

    // Validate File Type
    if (!ALLOWED_MIME_TYPES.includes(selectedFile.type)) {
        setState(prev => ({
            ...prev,
            error: `Invalid file type. Please upload a JPG, PNG, or WEBP image.`
        }));
        return;
    }

    // Validate File Size
    if (selectedFile.size > MAX_SIZE_BYTES) {
        setState(prev => ({
            ...prev,
            error: `File is too large (${(selectedFile.size / (1024 * 1024)).toFixed(2)}MB). Maximum allowed size is 100MB.`
        }));
        return;
    }

    setFile(selectedFile);
    
    // Read File with Progress
    const reader = new FileReader();
    
    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentLoaded = Math.round((event.loaded / event.total) * 100);
        setUploadProgress(percentLoaded);
      }
    };

    reader.onloadstart = () => {
        setUploadProgress(0);
    };

    reader.onloadend = () => {
      setUploadProgress(100);
      setTimeout(() => {
        setPreview(reader.result as string);
      }, 300); // Small delay for smooth UI transition
    };

    reader.readAsDataURL(selectedFile);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  // Drag and Drop Handlers
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const processImage = async () => {
    if (!preview) return;

    setState(prev => ({ ...prev, isAnalyzing: true, error: null }));

    try {
      // Step 1: Analyze text/vision (Uses Gemini 3 Pro Preview)
      const mimeType = preview.split(';')[0].split(':')[1];
      const base64Data = preview.split(',')[1];
      const report = await analyzeFashionTrend(base64Data, mimeType);
      
      setState(prev => ({ 
          ...prev, 
          isAnalyzing: false, 
          report: report, 
          isGeneratingImage: true,
          isSearchingShopping: true 
      }));

      // Parallel Execution: Image Gen & Product Search

      // Trigger Product Search
      const searchQuery = `Buy ${report.winning_attributes.color_palette.split(',')[0]} ${report.winning_attributes.fabric_print} ${report.winning_attributes.silhouette} ${report.best_seller_concept.product_name} online India`;
      
      findSimilarProducts(searchQuery).then(result => {
          setState(prev => ({
              ...prev,
              isSearchingShopping: false,
              shoppingSummary: result.text,
              shoppingResults: result.items
          }));
      });

      // Step 2: Generate Visual (Uses Gemini 3 Pro Image Preview)
      if (report.best_seller_concept.image_generation_prompt) {
          try {
              // CHECK API KEY for paid features
              if (window.aistudio && window.aistudio.hasSelectedApiKey) {
                  const hasKey = await window.aistudio.hasSelectedApiKey();
                  if (!hasKey && window.aistudio.openSelectKey) {
                      await window.aistudio.openSelectKey();
                  }
              }

              const imageUrl = await generateDesignVisual(
                  report.best_seller_concept.image_generation_prompt,
                  imageConfig.aspectRatio,
                  imageConfig.imageSize
              );
              setState(prev => ({ ...prev, isGeneratingImage: false, generatedImageUrl: imageUrl }));
          } catch (imgErr: any) {
               console.error("Image generation failed", imgErr);
               setState(prev => ({ 
                   ...prev, 
                   isGeneratingImage: false, 
                   generatedImageUrl: null,
                   // Show error but keep the report visible
                   error: `Trend Analysis successful, but visual generation failed: ${imgErr.message}`
               }));
          }
      } else {
        setState(prev => ({ ...prev, isGeneratingImage: false }));
      }

    } catch (err: any) {
      console.error(err);
      setState(prev => ({ 
        ...prev, 
        isAnalyzing: false, 
        isGeneratingImage: false, 
        isSearchingShopping: false,
        error: err.message || "Failed to analyze trends. Please try a clearer image." 
      }));
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans relative overflow-hidden bg-slate-50/50 dark:bg-slate-950 transition-colors duration-300">
      
      {/* Ambient Background Blobs */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-brand-300 dark:bg-brand-900 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-30 dark:opacity-20 animate-blob"></div>
          <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-purple-300 dark:bg-purple-900 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-30 dark:opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-pink-300 dark:bg-pink-900 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-30 dark:opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 glass border-b border-white/40 dark:border-white/5 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            <div className="flex items-center group cursor-pointer">
              <div className="bg-gradient-to-br from-brand-600 to-brand-900 p-2.5 rounded-xl mr-3 shadow-lg shadow-brand-500/20 group-hover:shadow-brand-500/40 transition-all duration-300 group-hover:scale-105">
                 <Shirt className="text-white w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="font-serif text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-brand-900 dark:from-white dark:to-brand-200 tracking-tight">Vastra-Vibes</span>
                <div className="flex items-center space-x-2">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 font-bold">AI Merchandiser</span>
                    <span className="text-[10px] text-green-600 dark:text-green-400 font-mono flex items-center bg-green-100/50 dark:bg-green-900/30 px-1.5 py-0.5 rounded border border-green-200/50 dark:border-green-800/50">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse mr-1"></span>
                        LIVE
                    </span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col items-end justify-center">
                <div className="flex items-center gap-3 mb-1.5">
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono flex items-center bg-white/50 dark:bg-slate-800/50 px-2 py-0.5 rounded-full border border-white/60 dark:border-slate-700">
                      <RefreshCw className="w-3 h-3 mr-1.5 text-brand-500" /> Updated: <span className="text-slate-700 dark:text-slate-300 font-semibold ml-1">{currentTime}</span>
                  </div>
                  <button 
                    onClick={toggleTheme}
                    className="p-1.5 rounded-full bg-white/50 dark:bg-slate-800/50 border border-white/60 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700 transition-colors shadow-sm"
                    aria-label="Toggle Dark Mode"
                  >
                    {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
                  </button>
                </div>

                <div className="flex items-center space-x-4 max-w-xl overflow-hidden">
                    <div className="hidden md:flex text-xs space-x-8 text-slate-500 dark:text-slate-400 font-medium overflow-x-auto whitespace-nowrap mask-linear-fade scrollbar-hide py-1">
                        <span className="flex items-center flex-shrink-0 group"><span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2 group-hover:scale-125 transition-transform"></span>Cotton <span className="text-slate-300 dark:text-slate-600 mx-1">|</span> <span className="text-green-600 dark:text-green-400 font-bold">LOW</span></span>
                        <span className="flex items-center flex-shrink-0 group"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-2 group-hover:scale-125 transition-transform"></span>Poly <span className="text-slate-300 dark:text-slate-600 mx-1">|</span> <span className="text-blue-600 dark:text-blue-400 font-bold">V.LOW</span></span>
                        <span className="flex items-center flex-shrink-0 group"><span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-2 group-hover:scale-125 transition-transform"></span>Viscose <span className="text-slate-300 dark:text-slate-600 mx-1">|</span> <span className="text-amber-600 dark:text-amber-500 font-bold">STABLE</span></span>
                        <span className="flex items-center flex-shrink-0 group"><span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-2 group-hover:scale-125 transition-transform"></span>Linen <span className="text-slate-300 dark:text-slate-600 mx-1">|</span> <span className="text-red-500 dark:text-red-400 font-bold">HIGH</span></span>
                    </div>
                </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
        
        {/* Intro Section - only show if no report */}
        {!state.report && !state.isAnalyzing && (
            <ScrollReveal animation="fade-in-up">
                <div className="text-center max-w-3xl mx-auto mb-16 mt-8">
                    <div className="inline-flex items-center justify-center px-4 py-1.5 mb-6 text-xs font-semibold tracking-widest text-brand-700 dark:text-brand-300 uppercase bg-brand-50 dark:bg-brand-900/30 rounded-full border border-brand-100 dark:border-brand-800 shadow-sm">
                        <Sparkles className="w-3 h-3 mr-2 text-brand-500" /> Next-Gen Fashion Tech
                    </div>
                    <h1 className="text-5xl md:text-6xl font-serif font-bold text-slate-900 dark:text-white mb-6 leading-[1.1]">
                        Eliminate Dead Stock with <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-indigo-600 dark:from-brand-400 dark:to-indigo-400">Real-Time Intelligence</span>
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
                        Upload street style photos. Our AI analyzes hyper-local trends, cross-references <span className="font-semibold text-slate-900 dark:text-slate-200 decoration-brand-300 underline underline-offset-4 decoration-2">Live Fabric Indices</span>, and generates high-margin bestseller concepts instantly.
                    </p>
                </div>
            </ScrollReveal>
        )}

        <div className="grid grid-cols-1 gap-10">
            
            {/* Input Section */}
            <ScrollReveal animation="zoom-in" delay="delay-100" className={`transition-all duration-700 ease-in-out ${state.report ? 'bg-white/80 dark:bg-slate-900/80 p-5 rounded-3xl shadow-lg border border-white/50 dark:border-white/10 backdrop-blur-sm flex flex-col lg:flex-row items-center gap-6' : 'max-w-xl mx-auto w-full'}`}>
                
                {/* File Input & Drag Area */}
                <div 
                    className={`relative group w-full transition-all duration-500 ${state.report ? 'w-40 h-40 flex-shrink-0' : ''}`}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                >
                     {!preview ? (
                         <label 
                            className={`flex flex-col items-center justify-center w-full h-72 border-2 border-dashed rounded-3xl cursor-pointer transition-all duration-300 group overflow-hidden relative
                                ${isDragging 
                                    ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-900/20 scale-[1.02]' 
                                    : 'border-slate-300/60 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-brand-50/30 dark:hover:bg-brand-900/20 hover:border-brand-300 dark:hover:border-brand-700'
                                }
                            `}
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-brand-50/0 to-brand-50/0 group-hover:from-brand-50/50 dark:group-hover:from-brand-900/30 group-hover:to-transparent transition-all duration-500"></div>
                            
                            {/* Upload Content */}
                            <div className="flex flex-col items-center justify-center pt-5 pb-6 relative z-10 transform group-hover:scale-105 transition-transform duration-300">
                                {uploadProgress > 0 && uploadProgress < 100 ? (
                                    <div className="w-full max-w-[200px] flex flex-col items-center">
                                         <Loader2 className="w-10 h-10 text-brand-500 animate-spin mb-4" />
                                         <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                                            <div 
                                                className="bg-brand-500 h-2.5 rounded-full transition-all duration-300 ease-out"
                                                style={{ width: `${uploadProgress}%` }}
                                            ></div>
                                         </div>
                                         <p className="mt-2 text-xs font-mono text-brand-600 dark:text-brand-400">{uploadProgress}% Uploading...</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className={`p-4 rounded-full shadow-md mb-4 transition-all ${isDragging ? 'bg-brand-100 dark:bg-brand-900 text-brand-600' : 'bg-white dark:bg-slate-800 group-hover:shadow-xl group-hover:text-brand-500 dark:group-hover:text-brand-400 text-slate-400 dark:text-slate-500'}`}>
                                            <Upload className="w-8 h-8 transition-colors" />
                                        </div>
                                        <p className="mb-2 text-sm text-slate-600 dark:text-slate-300 font-medium">
                                            {isDragging ? 'Drop it like it\'s hot!' : 'Click to upload or Drag & Drop'}
                                        </p>
                                        <p className="text-xs text-slate-400 dark:text-slate-500">JPG, PNG, WEBP (Street Style)</p>
                                    </>
                                )}
                            </div>
                            <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} disabled={uploadProgress > 0 && uploadProgress < 100} />
                        </label>
                     ) : (
                        <div className={`relative overflow-hidden rounded-2xl border border-white dark:border-slate-700 shadow-2xl ${state.report ? 'w-full h-full' : 'w-full aspect-[3/4]'}`}>
                            <img src={preview} alt="Upload preview" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
                            {!state.isAnalyzing && !state.report && (
                                <button 
                                    onClick={resetState}
                                    className="absolute top-3 right-3 bg-white/20 hover:bg-white/40 backdrop-blur-md text-white rounded-full p-2 transition-all border border-white/20"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                </button>
                            )}
                        </div>
                     )}
                </div>

                {/* Controls */}
                <div className={`w-full ${state.report ? 'flex-grow' : 'mt-8'}`}>
                     {!state.report && preview && (
                         <div className="space-y-6 animate-fade-in-up">
                             {/* Image Settings */}
                             <div className="glass p-5 rounded-2xl shadow-sm">
                                 <div className="flex items-center gap-2 mb-4 text-slate-800 dark:text-slate-200 font-bold text-sm tracking-wide">
                                     <Settings className="w-4 h-4 text-brand-500" />
                                     <span>CONFIGURATION</span>
                                 </div>
                                 <div className="grid grid-cols-2 gap-5">
                                     <div>
                                         <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Aspect Ratio</label>
                                         <div className="relative">
                                             <select 
                                                value={imageConfig.aspectRatio}
                                                onChange={(e) => setImageConfig({...imageConfig, aspectRatio: e.target.value as AspectRatio})}
                                                className="w-full text-sm rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 border px-3 py-2.5 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none appearance-none cursor-pointer hover:bg-white dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 transition-colors"
                                             >
                                                 {["1:1", "2:3", "3:2", "3:4", "4:3", "9:16", "16:9", "21:9"].map(r => (
                                                     <option key={r} value={r}>{r}</option>
                                                 ))}
                                             </select>
                                             <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-slate-500">
                                                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                             </div>
                                         </div>
                                     </div>
                                     <div>
                                         <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Resolution</label>
                                         <div className="relative">
                                            <select 
                                                value={imageConfig.imageSize}
                                                onChange={(e) => setImageConfig({...imageConfig, imageSize: e.target.value as ImageSize})}
                                                className="w-full text-sm rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 border px-3 py-2.5 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none appearance-none cursor-pointer hover:bg-white dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 transition-colors"
                                            >
                                                {["1K", "2K", "4K"].map(s => (
                                                    <option key={s} value={s}>{s}</option>
                                                ))}
                                            </select>
                                            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-slate-500">
                                                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                             </div>
                                         </div>
                                     </div>
                                 </div>
                             </div>

                             <button
                                onClick={processImage}
                                disabled={state.isAnalyzing}
                                className="w-full py-4 px-6 bg-gradient-to-r from-brand-700 to-brand-900 hover:from-brand-600 hover:to-brand-800 text-white font-bold tracking-wide rounded-2xl shadow-xl shadow-brand-900/20 flex items-center justify-center transition-all transform hover:-translate-y-1 hover:shadow-2xl disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none relative overflow-hidden group"
                             >
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 rounded-2xl"></div>
                                {state.isAnalyzing ? (
                                    <>
                                        <Loader2 className="animate-spin mr-3 h-5 w-5 relative z-10" />
                                        <span className="relative z-10">Processing Visuals...</span>
                                    </>
                                ) : (
                                    <>
                                        <Zap className="mr-3 h-5 w-5 fill-current relative z-10" />
                                        <span className="relative z-10">Run Visual Forensics</span>
                                    </>
                                )}
                             </button>
                             <p className="text-[10px] text-center text-slate-400 dark:text-slate-500 font-medium">
                                Powered by Gemini 3 Pro. Paid API key required for high-res generation.
                             </p>
                        </div>
                     )}
                     
                     {/* Context info when collapsed */}
                     {state.report && (
                         <div className="animate-fade-in pl-2">
                             <div className="flex items-center justify-between mb-2">
                                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-lg">Analyzed Input</h4>
                                <div className="flex gap-3 text-xs font-mono text-slate-500 dark:text-slate-400 bg-slate-100/80 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                                    <span>{imageConfig.aspectRatio}</span>
                                    <span className="text-slate-300 dark:text-slate-600">|</span>
                                    <span>{imageConfig.imageSize}</span>
                                </div>
                             </div>
                             <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">Uploaded image successfully analyzed for micro-trends and supply chain optimization.</p>
                             
                             <button 
                                onClick={resetState}
                                className="text-xs text-brand-600 dark:text-brand-400 font-bold hover:text-brand-700 dark:hover:text-brand-300 uppercase tracking-wider flex items-center group"
                             >
                                <RefreshCw className="w-3 h-3 mr-1.5 group-hover:rotate-180 transition-transform duration-500" />
                                Upload New Image
                             </button>
                         </div>
                     )}
                </div>
            </ScrollReveal>

            {/* Error Message */}
            {state.error && (
                <div className="bg-red-50/90 dark:bg-red-900/30 backdrop-blur-sm border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-6 py-4 rounded-2xl mx-auto max-w-xl text-center flex items-center justify-center shadow-sm animate-pulse-slow">
                    <AlertCircle className="w-6 h-6 mr-3 flex-shrink-0" />
                    <span className="font-medium">{state.error}</span>
                </div>
            )}

            {/* Results Dashboard */}
            {state.report && (
                <AnalysisDashboard 
                    report={state.report} 
                    generatedImageUrl={state.generatedImageUrl}
                    isGeneratingImage={state.isGeneratingImage}
                    shoppingResults={state.shoppingResults}
                    isSearchingShopping={state.isSearchingShopping}
                    shoppingSummary={state.shoppingSummary}
                />
            )}

        </div>
      </main>
      
      <ChatBot report={state.report} />

      <footer className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border-t border-slate-200 dark:border-slate-800 py-8 mt-auto">
          <div className="max-w-7xl mx-auto px-4 text-center">
              <p className="text-slate-400 dark:text-slate-500 text-sm font-medium">© 2024 Vastra-Vibes. Powered by Google Gemini 3 Pro.</p>
          </div>
      </footer>
    </div>
  );
};

export default App;