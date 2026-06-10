import React, { useRef, useState } from "react";
import { Candidate } from "../types";
import { SAMPLE_CVS } from "../data/samples";
import { 
  FileText, UploadCloud, Trash2, CheckCircle2, 
  AlertCircle, ChevronRight, Sparkles, Loader2, Info
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface CandidateListProps {
  candidates: Candidate[];
  setCandidates: React.Dispatch<React.SetStateAction<Candidate[]>>;
  selectedCandidateId: string;
  setSelectedCandidateId: (id: string) => void;
  onScreenSingleCandidate: (candidateId: string) => void;
  isAnyScanning: boolean;
}

export default function CandidateList({
  candidates,
  setCandidates,
  selectedCandidateId,
  setSelectedCandidateId,
  onScreenSingleCandidate,
  isAnyScanning,
}: CandidateListProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  // Load prefabricated high-quality samples
  const handleLoadSamples = () => {
    const existingIds = candidates.map((c) => c.id);
    const uniqueSamples = SAMPLE_CVS.filter((s) => !existingIds.includes(s.id));
    
    if (uniqueSamples.length === 0) {
      alert("Tất cả hồ sơ mẫu đã được tải vào danh sách!");
      return;
    }

    const loadedCandidates: Candidate[] = uniqueSamples.map((s) => ({
      id: s.id,
      fileName: s.fileName,
      fileType: s.fileType,
      textContent: s.textContent,
      status: "idle",
    }));

    setCandidates((prev) => [...prev, ...loadedCandidates]);
    
    // Select the first new sample by default
    if (!selectedCandidateId && loadedCandidates.length > 0) {
      setSelectedCandidateId(loadedCandidates[0].id);
    }
  };

  // Safe file reader
  const processFiles = (files: FileList) => {
    Array.from(files).forEach((file) => {
      const id = "cv-" + Math.random().toString(36).substr(2, 9);
      const isPdf = file.type === "application/pdf" || file.name.endsWith(".pdf");
      const isTxt = file.type === "text/plain" || file.name.endsWith(".txt") || file.name.endsWith(".md");

      const sizeStr = (file.size / 1024).toFixed(1) + " KB";

      if (isTxt) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const text = e.target?.result as string;
          const newCandidate: Candidate = {
            id,
            fileName: file.name,
            fileType: "text",
            size: sizeStr,
            textContent: text,
            status: "idle",
          };
          setCandidates((prev) => [...prev, newCandidate]);
          setSelectedCandidateId(id);
        };
        reader.readAsText(file);
      } else if (isPdf) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          const base64 = dataUrl.split(",")[1];
          const newCandidate: Candidate = {
            id,
            fileName: file.name,
            fileType: "pdf",
            size: sizeStr,
            base64,
            mimeType: "application/pdf",
            status: "idle",
          };
          setCandidates((prev) => [...prev, newCandidate]);
          setSelectedCandidateId(id);
        };
        reader.readAsDataURL(file);
      } else {
        // Fallback: Read as text
        const reader = new FileReader();
        reader.onload = (e) => {
          const text = e.target?.result as string;
          const newCandidate: Candidate = {
            id,
            fileName: file.name,
            fileType: "text",
            size: sizeStr,
            textContent: text,
            status: "idle",
          };
          setCandidates((prev) => [...prev, newCandidate]);
          setSelectedCandidateId(id);
        };
        reader.readAsText(file);
      }
    });
  };

  // Handle Drag Events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const handleDeleteCandidate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCandidates((prev) => prev.filter((c) => c.id !== id));
    if (selectedCandidateId === id) {
      setSelectedCandidateId("");
    }
  };

  const handleClearAll = () => {
    if (window.confirm("Bạn có chắc chắn muốn xóa toàn bộ danh sách ứng viên này?")) {
      setCandidates([]);
      setSelectedCandidateId("");
    }
  };

  return (
    <div className="bg-[#F9F7F2] border-2 border-[#1A1A1A] p-6 flex flex-col h-full" id="candidate-list-panel">
      
      {/* Header block with Editorial Title */}
      <div className="flex items-baseline justify-between border-b pb-3 border-[#1A1A1A] mb-4">
        <div>
          <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#1A1A1A]/60 block mb-1">SECTION II // TALENT FILES</span>
          <h2 className="font-serif font-black text-xl text-[#1A1A1A] tracking-tight">Candidate Profiles (CV)</h2>
        </div>
        {candidates.length > 0 && (
          <button
            onClick={handleClearAll}
            className="text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A] border border-[#1A1A1A] hover:bg-rose-100 hover:text-rose-700 px-2 py-1 transition cursor-pointer"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Auto Load Sample Application Buttons */}
      <div className="mb-4">
        <button
          onClick={handleLoadSamples}
          className="w-full bg-[#1A1A1A] text-white hover:bg-white hover:text-[#1A1A1A] border-2 border-[#1A1A1A] py-2.5 px-4 text-xs font-bold uppercase tracking-widest transition duration-200 cursor-pointer flex items-center justify-center gap-2"
          id="btn-load-samples"
        >
          <Sparkles className="w-4 h-4" />
          <span>Samples: Load 3 Candidates</span>
        </button>
      </div>

      {/* Editorial Styled Drag & Drop File Container */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed p-5 text-center transition cursor-pointer flex flex-col items-center justify-center gap-1 bg-white ${
          dragActive
            ? "border-amber-600 bg-[#F5E6CC]/30"
            : "border-[#1A1A1A] hover:bg-[#F5E6CC]/20"
        }`}
        id="cv-upload-area"
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.txt,.md"
          onChange={handleChange}
          className="hidden"
        />
        <div className="w-9 h-9 border border-[#1A1A1A] bg-[#F9F7F2] flex items-center justify-center text-[#1A1A1A]">
          <UploadCloud className="w-4 h-4" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[#1A1A1A]">Select or drop files here</p>
          <p className="text-[10px] text-[#1A1A1A]/70 font-mono mt-0.5">SUPPORTED: PDF, TXT, MD</p>
        </div>
      </div>

      {/* List content */}
      <div className="flex-1 overflow-y-auto mt-4 max-h-[360px] pr-1 space-y-2.5">
        {candidates.length === 0 ? (
          <div className="text-center py-10 text-[#1A1A1A]/60 flex flex-col items-center justify-center h-full border border-dashed border-[#1A1A1A]/40 bg-white/40">
            <FileText className="w-8 h-8 text-[#1A1A1A]/30 mb-2" />
            <p className="text-xs font-bold uppercase tracking-widest">No candidates loaded</p>
            <p className="text-[10px] italic font-serif mt-1 max-w-[200px]">Drop CV files or use sample candidates button above.</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {candidates.map((cand) => {
              const isSelected = selectedCandidateId === cand.id;
              
              let statusBorder = "border-[#1A1A1A]/40 bg-white";
              if (cand.status === "scanning") statusBorder = "border-amber-600 bg-[#F5E6CC]/20";
              else if (cand.status === "error") statusBorder = "border-rose-400 bg-rose-50";
              else if (isSelected) statusBorder = "border-2 border-[#1A1A1A] bg-[#F5E6CC]/45";

              return (
                <motion.div
                  key={cand.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className={`border p-3 flex items-center justify-between transition cursor-pointer select-none ${statusBorder} ${
                    isSelected ? "shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]" : "hover:border-[#1A1A1A]"
                  }`}
                  onClick={() => setSelectedCandidateId(cand.id)}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className={`p-1.5 border border-[#1A1A1A] bg-white ${
                      cand.fileType === "pdf" ? "text-rose-700" : "text-[#1A1A1A]"
                    }`}>
                      <FileText className="w-3.5 h-3.5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-serif font-black text-xs text-[#1A1A1A] truncate max-w-[140px]">
                          {cand.results?.candidateName || cand.fileName}
                        </h4>
                        {cand.size && (
                          <span className="text-[8px] text-[#1A1A1A]/50 font-mono">({cand.size})</span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 mt-1">
                        {cand.status === "idle" && (
                          <span className="text-[9px] font-bold uppercase tracking-wider text-[#1A1A1A]/70 bg-[#F9F7F2] border border-[#1A1A1A]/30 px-1 py-0.2">
                            Pending
                          </span>
                        )}
                        {cand.status === "scanning" && (
                          <span className="text-[9px] font-serif font-bold text-amber-900 bg-amber-100 border border-amber-400 px-1 py-0.2 flex items-center gap-1 animate-pulse">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Processing...
                          </span>
                        )}
                        {cand.status === "success" && cand.results && (
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[9px] font-bold uppercase tracking-tighter px-1.5 py-0.2 border border-[#1A1A1A] ${
                              cand.results.recommendation === "Suitable"
                                ? "bg-[#E1F2E5] text-emerald-800"
                                : cand.results.recommendation === "Consider"
                                ? "bg-[#F5E6CC] text-amber-950"
                                : "bg-rose-100 text-rose-800"
                            }`}>
                              {cand.results.recommendation}
                            </span>
                            <span className="text-[9px] font-mono font-bold text-[#1A1A1A]">
                              {cand.results.matchScore}% MATCH
                            </span>
                          </div>
                        )}
                        {cand.status === "error" && (
                          <span className="text-[9px] font-bold text-rose-800 bg-rose-100 border border-rose-300 px-1 py-0.2 flex items-center gap-0.5">
                            <AlertCircle className="w-2.5 h-2.5" />
                            Error
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center ml-2">
                    {/* Action trigger button */}
                    {cand.status === "idle" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onScreenSingleCandidate(cand.id);
                        }}
                        disabled={isAnyScanning}
                        className={`text-white bg-[#1A1A1A] hover:bg-white hover:text-[#1A1A1A] border border-[#1A1A1A] p-0.5 transition duration-200 cursor-pointer ${
                          isAnyScanning ? "opacity-30 pointer-events-none" : ""
                        }`}
                        title="Start candidate screening"
                        type="button"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}

                    {/* Trash buttons */}
                    <button
                      onClick={(e) => handleDeleteCandidate(cand.id, e)}
                      className="text-[#1A1A1A]/40 hover:text-rose-700 p-1.5 hover:bg-white/70 transition ml-1 cursor-pointer"
                      title="Delete profile"
                      type="button"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      <div className="mt-auto pt-3 border-t border-[#1A1A1A]/20 text-[9px] text-[#1A1A1A]/60 italic font-serif">
        * Click the arrow button of an individual candidate to screen, or use the mass screening button in the dashboard to analyze all candidates.
      </div>
    </div>
  );
}
