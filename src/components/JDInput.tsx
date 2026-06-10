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
    <div className="bg-white border border-slate-200 p-6 flex flex-col h-full rounded-xl shadow-sm" id="jd-input-panel">
      {/* Header Info */}
      <div className="flex items-baseline justify-between border-b border-slate-100 pb-3 mb-4">
        <div>
          <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500 block mb-1">SECTION I // REQUIREMENT</span>
          <h2 className="font-serif font-black text-xl text-slate-900 tracking-tight">Job Description (JD)</h2>
        </div>
        <span className="text-[10px] font-bold font-mono text-white bg-indigo-600 rounded px-2 py-0.5 tracking-wider uppercase">
          {wordCount} Words
        </span>
      </div>

      {/* Quick Select Buttons */}
      <div className="mb-5">
        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2.5 block flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          <span>Quick Selection Templates:</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {JD_TEMPLATES.map((tpl) => (
            <button
              key={tpl.id}
              onClick={() => handleSelectTemplate(tpl.id)}
              className={`text-left p-3 transition-all duration-200 border cursor-pointer rounded-lg ${
                selectedJdId === tpl.id
                  ? "bg-indigo-600 border-indigo-600 text-white font-bold"
                  : "bg-slate-50 border-slate-100 hover:border-indigo-200 hover:bg-slate-100 text-slate-700 text-xs"
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
          className="w-full flex-1 p-4 bg-slate-50 text-slate-900 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 transition resize-none font-sans leading-relaxed"
          id="jd-textarea"
        />
      </div>

      <div className="mt-3 flex items-start gap-1 pb-1">
        <span className="text-[10px] leading-relaxed italic text-slate-400 font-serif">
          * You can edit JD content directly to ensure AI analysis is precise.
        </span>
      </div>
    </div>
  );
}

