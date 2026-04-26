import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShieldAlert, Play, CheckCircle2, AlertTriangle, FileText, Settings, RefreshCw } from 'lucide-react';
import { analyzePlagiarism } from './lib/rabinKarp';

const defaultSourceText = `Data structures and algorithms are important. A rolling hash is a hash function where the input is hashed in a window that moves through the input. A few hash functions allow a rolling hash to be computed very quickly—the new hash value is rapidly calculated given only the old hash value, the old value removed from the window, and the new value added to the window.`;

const defaultSuspectedText = `Algorithms are important for coding. In computer science, a rolling hash is a hash function where the input is hashed in a window that moves through the input. Some hash functions allow a rolling hash to be computed very quickly. This is useful for string matching algorithms like Rabin-Karp, where we rapidly calculate the new hash given the old hash.`;

export default function App() {
  const [sourceText, setSourceText] = useState(defaultSourceText);
  const [suspectedText, setSuspectedText] = useState(defaultSuspectedText);
  const [kValue, setKValue] = useState(8);
  const [showAnimation, setShowAnimation] = useState(true);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  
  // Animation states
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const animationRef = useRef(null);

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    // Add small delay for UI effect
    setTimeout(() => {
      const res = analyzePlagiarism(sourceText, suspectedText, kValue, true);
      setResults(res);
      setIsAnalyzing(false);
      setCurrentStepIndex(-1);
      setIsPlaying(false);
      
      if (showAnimation && res.steps.length > 0) {
        setIsPlaying(true);
      } else {
        setCurrentStepIndex(res.steps.length - 1);
      }
    }, 600);
  };

  const loadSample = () => {
    setSourceText(defaultSourceText);
    setSuspectedText(defaultSuspectedText);
    setResults(null);
    setCurrentStepIndex(-1);
  };

  useEffect(() => {
    if (isPlaying && results && currentStepIndex < results.steps.length - 1) {
      // Dynamically adjust speed based on text length to avoid boring the user
      // Maximum 10 seconds for the whole animation
      const targetDurationMs = 5000; 
      const stepMs = Math.max(20, Math.min(200, targetDurationMs / results.steps.length));
      
      animationRef.current = setTimeout(() => {
        setCurrentStepIndex(prev => prev + 1);
      }, stepMs);
    } else if (isPlaying && results && currentStepIndex >= results.steps.length - 1) {
      setIsPlaying(false);
    }

    return () => clearTimeout(animationRef.current);
  }, [isPlaying, currentStepIndex, results]);

  const renderHighlightedText = (text, matchedIndicesSet, maxIndexToRender = Infinity) => {
    if (!text) return null;
    
    const elements = [];
    let isMatching = false;
    let currentChunk = '';

    for (let i = 0; i < text.length; i++) {
      // Only highlight up to where the animation has reached
      const isMatched = i <= maxIndexToRender && matchedIndicesSet && matchedIndicesSet.has(i);
      
      if (isMatched !== isMatching) {
        if (currentChunk) {
          elements.push(
            <span key={i} className={isMatching ? "bg-matchHighlight text-matchText rounded-sm px-[1px] transition-colors duration-300" : ""}>
              {currentChunk}
            </span>
          );
        }
        isMatching = isMatched;
        currentChunk = text[i];
      } else {
        currentChunk += text[i];
      }
    }

    if (currentChunk) {
      elements.push(
        <span key={text.length} className={isMatching ? "bg-matchHighlight text-matchText rounded-sm px-[1px] transition-colors duration-300" : ""}>
          {currentChunk}
        </span>
      );
    }

    return elements;
  };

  // Get current step
  const step = results && currentStepIndex >= 0 ? results.steps[currentStepIndex] : null;
  // Maximum index we have checked so far in animation
  const maxCheckedIndex = step ? step.index + kValue - 1 : (results && currentStepIndex === results.steps.length - 1 ? suspectedText.length : -1);

  return (
    <div className="min-h-screen bg-background bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.15),rgba(255,255,255,0))] font-sans p-4 md:p-8">
      {/* Header */}
      <header className="max-w-7xl mx-auto flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/20 rounded-xl">
            <ShieldAlert className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Plagiarism Visualizer</h1>
            <p className="text-gray-400 text-sm">Powered by Rabin-Karp Algorithm</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={loadSample} className="btn-secondary flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Sample Text
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto space-y-6">
        
        {/* Controls Section */}
        <section className="glass-panel p-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex-1 w-full max-w-md space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-300 font-medium flex items-center gap-2">
                <Settings className="w-4 h-4 text-gray-400" />
                Substring Length (k-gram)
              </span>
              <span className="bg-primary/20 text-primary px-3 py-1 rounded-full font-mono font-bold">k = {kValue}</span>
            </div>
            <input 
              type="range" 
              min="3" max="20" 
              value={kValue} 
              onChange={(e) => setKValue(parseInt(e.target.value))}
              className="w-full accent-primary h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-4 border-l border-white/10 pl-6 h-full">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative">
                <input 
                  type="checkbox" 
                  className="sr-only" 
                  checked={showAnimation}
                  onChange={(e) => setShowAnimation(e.target.checked)}
                />
                <div className={\`block w-14 h-8 rounded-full transition-colors duration-300 \${showAnimation ? 'bg-primary' : 'bg-gray-600'}\`}></div>
                <div className={\`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform duration-300 flex items-center justify-center \${showAnimation ? 'transform translate-x-6' : ''}\`}>
                  {showAnimation && <Play className="w-3 h-3 text-primary" />}
                </div>
              </div>
              <span className="text-gray-300 text-sm font-medium group-hover:text-white transition-colors">Show Hash Animation</span>
            </label>

            <button onClick={handleAnalyze} disabled={isAnalyzing} className="btn-primary flex items-center gap-2 ml-4">
              {isAnalyzing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
              Check Plagiarism
            </button>
          </div>
        </section>

        {/* Text Input Area */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Source Text */}
          <div className="glass-panel overflow-hidden flex flex-col h-[400px]">
            <div className="bg-white/5 px-6 py-4 border-b border-white/10 flex justify-between items-center">
              <h2 className="text-gray-200 font-semibold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                Original Text (Source)
              </h2>
              <span className="text-xs text-gray-500 font-mono">{sourceText.length} chars</span>
            </div>
            <textarea
              className="glass-input m-4 flex-1 p-4 resize-none focus:outline-none leading-relaxed text-sm"
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder="Paste original source text here..."
              spellCheck="false"
            />
          </div>

          {/* Suspected Text & Results */}
          <div className="glass-panel overflow-hidden flex flex-col h-[400px]">
            <div className="bg-white/5 px-6 py-4 border-b border-white/10 flex justify-between items-center">
              <h2 className="text-gray-200 font-semibold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-400"></span>
                Suspected Text
              </h2>
              {results && (
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 font-mono">{suspectedText.length} chars</span>
                  <span className={\`text-xs font-bold px-3 py-1 rounded-full \${results.similarity > 20 ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}\`}>
                    {results.similarity.toFixed(1)}% Match
                  </span>
                </div>
              )}
            </div>
            <div className="m-4 flex-1 relative rounded-xl border border-white/10 bg-black/40 overflow-auto">
              {!results ? (
                <textarea
                  className="absolute inset-0 w-full h-full p-4 resize-none bg-transparent focus:outline-none leading-relaxed text-sm"
                  value={suspectedText}
                  onChange={(e) => setSuspectedText(e.target.value)}
                  placeholder="Paste suspected text here to check..."
                  spellCheck="false"
                />
              ) : (
                <div className="absolute inset-0 w-full h-full p-4 whitespace-pre-wrap leading-relaxed text-sm text-gray-400">
                  {renderHighlightedText(suspectedText, results.matchedIndices, maxCheckedIndex)}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Live Visualization Panel */}
        <AnimatePresence>
          {showAnimation && results && step && (
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="glass-panel p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <span className="bg-primary p-1.5 rounded-lg">
                    <Search className="w-4 h-4 text-white" />
                  </span>
                  Rabin-Karp Live Engine
                </h2>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-400 font-mono">
                    Step {currentStepIndex + 1} / {results.steps.length}
                  </span>
                  {isPlaying ? (
                    <button onClick={() => setIsPlaying(false)} className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1 rounded-md text-white transition-colors">Pause</button>
                  ) : currentStepIndex < results.steps.length - 1 ? (
                    <button onClick={() => setIsPlaying(true)} className="text-xs bg-primary/80 hover:bg-primary px-3 py-1 rounded-md text-white transition-colors">Resume</button>
                  ) : null}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Sliding Window Visualization */}
                <div className="lg:col-span-2 bg-black/30 rounded-xl p-6 border border-white/5 relative overflow-hidden">
                  <h3 className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-4">Sliding Window</h3>
                  <div className="font-mono text-xl tracking-widest text-center overflow-x-auto whitespace-nowrap pb-4">
                    {/* Render window context */}
                    <span className="text-gray-600">
                      {suspectedText.substring(Math.max(0, step.index - 5), step.index)}
                    </span>
                    <motion.span 
                      key={step.index}
                      initial={{ scale: 1.1, color: '#9ca3af' }}
                      animate={{ scale: 1, color: '#ffffff' }}
                      className="inline-block mx-1 px-2 py-1 bg-primary/20 border border-primary/50 rounded-md text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]"
                    >
                      {step.substring}
                    </motion.span>
                    <span className="text-gray-600">
                      {suspectedText.substring(step.index + kValue, step.index + kValue + 5)}
                    </span>
                  </div>

                  <div className="mt-8 flex justify-center items-center gap-12">
                    <div className="text-center">
                      <div className="text-xs text-gray-500 mb-1">Current Hash</div>
                      <div className="font-mono text-2xl font-bold text-primary">{step.hash}</div>
                    </div>
                  </div>
                </div>

                {/* Engine Status */}
                <div className="bg-black/30 rounded-xl p-6 border border-white/5 flex flex-col justify-center">
                  <h3 className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-4">Comparison Status</h3>
                  
                  <div className="space-y-4">
                    <div className={\`flex items-center gap-3 p-3 rounded-lg border \${step.isHashMatch ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-white/5 border-white/10 text-gray-400'}\`}>
                      <div className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center shrink-0">
                        {step.isHashMatch ? <CheckCircle2 className="w-5 h-5" /> : <div className="w-2 h-2 rounded-full bg-gray-600" />}
                      </div>
                      <div>
                        <div className="font-semibold text-sm">Hash Found in Source?</div>
                        <div className="text-xs opacity-70">{step.isHashMatch ? 'Hash collision detected!' : 'Hash not found.'}</div>
                      </div>
                    </div>

                    <div className={\`flex items-center gap-3 p-3 rounded-lg border \${step.isExactMatch ? 'bg-matchHighlight border-yellow-500/30 text-matchText shadow-[0_0_20px_rgba(234,179,8,0.2)]' : step.isSpuriousHit ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-white/5 border-white/10 text-gray-400 opacity-50'}\`}>
                      <div className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center shrink-0">
                        {step.isExactMatch ? <ShieldAlert className="w-5 h-5 text-yellow-500" /> : step.isSpuriousHit ? <AlertTriangle className="w-5 h-5" /> : <div className="w-2 h-2 rounded-full bg-gray-600" />}
                      </div>
                      <div>
                        <div className="font-semibold text-sm">String Verification</div>
                        <div className="text-xs opacity-70">
                          {step.isExactMatch ? 'Exact match confirmed!' : step.isSpuriousHit ? 'Spurious hit (collision). Strings differ.' : 'Waiting for hash match...'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </motion.section>
          )}
        </AnimatePresence>

      </main>
    </div>
  );
}
