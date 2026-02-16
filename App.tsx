
import React, { useState, useRef } from 'react';
import { Layout } from './components/Layout';
import { AppStatus, ImageState, PromptSuggestion } from './types';
import { editImage, getPromptSuggestions } from './services/geminiService';

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [originalImage, setOriginalImage] = useState<ImageState | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [suggestions, setSuggestions] = useState<PromptSuggestion[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchSuggestionsForImage = async (img: ImageState) => {
    setStatus(AppStatus.SUGGESTING);
    try {
      const fetchedSuggestions = await getPromptSuggestions(img.base64, img.mimeType);
      setSuggestions(fetchedSuggestions);
      setStatus(AppStatus.IDLE);
    } catch (err) {
      console.error("Suggestions failed:", err);
      setStatus(AppStatus.IDLE); // Fallback to IDLE so user can still type their own prompt
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setStatus(AppStatus.UPLOADING);
    setErrorMessage(null);
    setEditedImage(null);
    setSuggestions([]);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      const imageState = {
        base64: base64,
        mimeType: file.type,
        previewUrl: URL.createObjectURL(file),
      };
      setOriginalImage(imageState);
      await fetchSuggestionsForImage(imageState);
    };
    reader.onerror = () => {
      setErrorMessage("Could not read the uploaded file.");
      setStatus(AppStatus.ERROR);
    };
    reader.readAsDataURL(file);
  };

  const handleEdit = async () => {
    if (!originalImage || !prompt) return;

    setStatus(AppStatus.EDITING);
    setErrorMessage(null);

    try {
      const result = await editImage(originalImage.base64, originalImage.mimeType, prompt);
      if (result) {
        setEditedImage(result);
        setStatus(AppStatus.SUCCESS);
      } else {
        throw new Error("Gemini returned an empty result. Try clarifying your prompt.");
      }
    } catch (err: any) {
      console.error("Edit failed:", err);
      const msg = err.message || "An unexpected error occurred during image generation.";
      setErrorMessage(msg);
      setStatus(AppStatus.ERROR);
    }
  };

  const applySuggestion = (suggestedPrompt: string) => {
    setPrompt(suggestedPrompt);
  };

  const reset = () => {
    setOriginalImage(null);
    setEditedImage(null);
    setPrompt('');
    setSuggestions([]);
    setStatus(AppStatus.IDLE);
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <header className="mb-12 text-center animate-in fade-in slide-in-from-top-4 duration-700">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-300 to-gray-600">
            Creative AI Studio
          </h1>
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto">
            Experience near-instant image transformation. Upload a photo and describe your vision.
          </p>
        </header>

        {!originalImage ? (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="group relative cursor-pointer border-2 border-dashed border-white/10 hover:border-blue-500/50 rounded-3xl p-12 md:p-24 text-center bg-white/5 transition-all duration-300 hover:bg-white/[0.07] active:scale-[0.99]"
          >
            <input 
              type="file" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*"
            />
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:bg-blue-500/20 transition-all duration-500">
              <i className="fas fa-cloud-arrow-up text-2xl text-gray-400 group-hover:text-blue-400"></i>
            </div>
            <h2 className="text-2xl font-semibold mb-2">Start with an image</h2>
            <p className="text-gray-500">Drag & drop or click to upload</p>
            <div className="mt-8 flex justify-center gap-4 text-[10px] font-bold tracking-widest text-gray-600 uppercase">
              <span className="px-3 py-1 bg-white/5 rounded-full">Supports PNG, JPG, WEBP</span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in zoom-in-95 duration-500">
            
            {/* Left Panel: Preview Area */}
            <div className="lg:col-span-7 space-y-6">
              <div className="relative group overflow-hidden rounded-3xl border border-white/10 bg-[#050505] shadow-2xl">
                <div className="flex justify-between items-center p-4 border-b border-white/5 bg-white/5">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/30"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/30"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/30"></div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.2em]">
                      {editedImage ? 'Generated' : 'Original'}
                    </span>
                  </div>
                  <button onClick={reset} className="text-gray-500 hover:text-white transition-colors p-1">
                    <i className="fas fa-xmark"></i>
                  </button>
                </div>
                
                <div className="aspect-video flex items-center justify-center bg-[#030303] overflow-hidden relative min-h-[400px]">
                  {status === AppStatus.EDITING && (
                    <div className="absolute inset-0 z-20 bg-black/70 backdrop-blur-md flex flex-col items-center justify-center">
                      <div className="relative w-16 h-16 mb-6">
                        <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                      <p className="text-xl font-semibold tracking-wide animate-pulse">Reimagining pixels...</p>
                      <p className="text-xs text-gray-500 mt-3 font-mono">Gemini 2.5 Flash performing edit</p>
                    </div>
                  )}
                  
                  <img 
                    src={editedImage || originalImage.previewUrl} 
                    className={`max-w-full max-h-full object-contain transition-all duration-1000 ${status === AppStatus.EDITING ? 'scale-110 blur-xl opacity-30' : 'scale-100 blur-0 opacity-100'}`}
                    alt="AI Workflow Preview"
                  />
                  
                  {editedImage && status !== AppStatus.EDITING && (
                    <button 
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = editedImage;
                        link.download = `flash-edit-${Date.now()}.png`;
                        link.click();
                      }}
                      className="absolute bottom-6 right-6 bg-white text-black px-6 py-3 rounded-2xl shadow-2xl hover:scale-105 active:scale-95 transition-all font-bold flex items-center gap-2"
                    >
                      <i className="fas fa-download"></i>
                      <span>Save Image</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Suggestions Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
                    <i className="fas fa-wand-magic-sparkles text-blue-500"></i> AI Brainstorm
                  </h3>
                  {status === AppStatus.SUGGESTING && (
                    <span className="text-[10px] text-blue-400 font-bold animate-pulse uppercase tracking-widest">
                      Analyzing...
                    </span>
                  )}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {status === AppStatus.SUGGESTING ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="h-24 bg-white/[0.02] rounded-2xl border border-white/5 animate-pulse"></div>
                    ))
                  ) : suggestions.length > 0 ? (
                    suggestions.map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => applySuggestion(s.prompt)}
                        className="group flex flex-col items-start p-4 bg-white/[0.03] border border-white/10 rounded-2xl text-left hover:border-blue-500/40 hover:bg-white/[0.06] transition-all duration-300"
                      >
                        <span className="text-[9px] font-black text-blue-500 uppercase mb-1 tracking-tighter">{s.category}</span>
                        <span className="text-sm font-semibold mb-1 group-hover:text-blue-300 transition-colors">{s.title}</span>
                        <p className="text-xs text-gray-500 line-clamp-2 leading-tight">{s.prompt}</p>
                      </button>
                    ))
                  ) : (
                    <div className="col-span-full py-10 text-center bg-white/[0.02] rounded-2xl border border-white/5 border-dashed">
                      <p className="text-xs text-gray-500 font-medium">Ready for your custom prompt.</p>
                      {originalImage && (
                        <button 
                          onClick={() => fetchSuggestionsForImage(originalImage)}
                          className="mt-3 text-[10px] text-blue-500 uppercase font-bold hover:text-blue-400"
                        >
                          Retry Analysis
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Panel: Controls Panel */}
            <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-6">
              <div className="p-8 rounded-3xl bg-white/[0.03] border border-white/10 shadow-2xl backdrop-blur-2xl">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center border border-blue-500/20">
                    <i className="fas fa-terminal text-blue-500 text-sm"></i>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Edit Console</h3>
                    <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">Model: Gemini 2.5 Flash</p>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Modification Prompt</label>
                      <span className="text-[10px] text-gray-600 font-mono">{prompt.length} chars</span>
                    </div>
                    <textarea 
                      className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-white placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/40 transition-all resize-none h-40 font-medium text-sm leading-relaxed"
                      placeholder="Describe the transformation... (e.g. 'Make it look like a snowy winter morning with soft blue lighting')"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                    ></textarea>
                  </div>

                  {errorMessage && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex gap-3 items-start animate-in fade-in slide-in-from-left-2">
                      <i className="fas fa-triangle-exclamation text-red-500 mt-1"></i>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-red-500 uppercase mb-1">Execution Error</p>
                        <p className="text-xs text-red-400/80 leading-relaxed">{errorMessage}</p>
                      </div>
                    </div>
                  )}

                  <button 
                    onClick={handleEdit}
                    disabled={!prompt || status === AppStatus.EDITING}
                    className="w-full group relative disabled:opacity-40 disabled:cursor-not-allowed overflow-hidden rounded-2xl"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-400 transition-transform group-hover:scale-110 duration-500"></div>
                    <div className="relative flex items-center justify-center gap-3 py-4 font-bold text-white tracking-wide">
                      {status === AppStatus.EDITING ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                          <span className="animate-pulse">Processing...</span>
                        </>
                      ) : (
                        <>
                          <i className="fas fa-bolt-lightning text-yellow-300"></i>
                          <span>Execute Edit</span>
                        </>
                      )}
                    </div>
                  </button>

                  <div className="pt-2 flex flex-col gap-3">
                    <div className="flex items-center gap-3 text-[10px] text-gray-500 font-medium">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                      <span>Cloud Processing Active</span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-gray-500 font-medium">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                      <span>Native Multimodal Decoding</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tips Feature */}
              <div className="p-6 border border-white/5 bg-white/[0.01] rounded-3xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                   <i className="fas fa-quote-right text-4xl"></i>
                </div>
                <h4 className="text-[11px] font-bold text-blue-400 mb-2 uppercase tracking-widest">Editing Guide</h4>
                <p className="text-xs text-gray-500 leading-relaxed italic">
                  "For best results, mention lighting conditions and specific object changes. Gemini handles detailed atmospheric descriptions extremely well."
                </p>
              </div>
            </div>

          </div>
        )}
      </div>
    </Layout>
  );
};

export default App;
