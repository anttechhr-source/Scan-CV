import React from "react";
import { JD_TEMPLATES } from "../data/samples";
import { FileText, Briefcase, Sparkles } from "lucide-react";

interface JDInputProps {
  jdText: string;
  setJdText: (text: string) => void;
  selectedJdId: string;
  setSelectedJdId: (id: string) => void;
}

export default function JDInput({
  jdText,
  setJdText,
  selectedJdId,
  setSelectedJdId,
}: JDInputProps) {
  const handleSelectTemplate = (id: string) => {
    const template = JD_TEMPLATES.find((t) => t.id === id);
    if (template) {
      setJdText(template.fullText);
      setSelectedJdId(id);
    }
  };

  const wordCount = jdText.trim() ? jdText.trim().split(/\s+/).length : 0;

  return (
    <div className="bg-[#F9F7F2] border-2 border-[#1A1A1A] p-6 flex flex-col h-full" id="jd-input-panel">
      {/* Header Info */}
      <div className="flex items-baseline justify-between border-b pb-3 border-[#1A1A1A] mb-4">
        <div>
          <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#1A1A1A]/60 block mb-1">SECTION I // REQUIREMENT</span>
          <h2 className="font-serif font-black text-xl text-[#1A1A1A] tracking-tight">Job Description (JD)</h2>
        </div>
        <span className="text-[10px] font-bold font-mono text-white bg-[#1A1A1A] px-2 py-0.5 tracking-wider uppercase">
          {wordCount} Words
        </span>
      </div>

      {/* Quick Select Buttons */}
      <div className="mb-5">
        <label className="text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A] mb-2.5 block flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-[#1A1A1A]" />
          <span>Quick Selection Templates:</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {JD_TEMPLATES.map((tpl) => (
            <button
              key={tpl.id}
              onClick={() => handleSelectTemplate(tpl.id)}
              className={`text-left p-3 transition-all duration-200 border cursor-pointer ${
                selectedJdId === tpl.id
                  ? "bg-[#1A1A1A] border-[#1A1A1A] text-[#F9F7F2] font-bold"
                  : "bg-white border-[#1A1A1A] hover:bg-[#F5E6CC]/40 text-[#1A1A1A]/80 text-xs"
              }`}
              type="button"
            >
              <div className="font-serif font-black text-xs uppercase tracking-tight line-clamp-1">{tpl.title.split("-")[0]}</div>
              <div className="text-[9px] font-sans font-bold opacity-75 uppercase tracking-wider mt-1">{tpl.department.split(" ")[0]}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Text Area */}
      <div className="flex-1 flex flex-col min-h-[220px]">
        <textarea
          value={jdText}
          onChange={(e) => {
            setJdText(e.target.value);
            setSelectedJdId(""); // reset
          }}
          placeholder="Paste detailed job description (JD) here..."
          className="w-full flex-1 p-4 bg-white text-[#1A1A1A] text-sm border-2 border-[#1A1A1A] focus:outline-hidden focus:ring-1 focus:ring-[#1A1A1A] transition resize-none font-sans leading-relaxed"
          id="jd-textarea"
        />
      </div>

      <div className="mt-3 flex items-start gap-1 pb-1">
        <span className="text-[10px] leading-relaxed italic text-[#1A1A1A]/70 font-serif">
          * You can edit JD content directly to ensure AI analysis is precise.
        </span>
      </div>
    </div>
  );
}

