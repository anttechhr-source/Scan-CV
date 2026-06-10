import React, { useState, useEffect } from "react";
import JDInput from "./components/JDInput";
import CandidateList from "./components/CandidateList";
import { Candidate } from "./types";
import { 
  Sparkles, Award, Mail, Phone, BookOpen, Clock, 
  MapPin, CheckCircle, XCircle, AlertCircle, RefreshCw, 
  Copy, FileText, Check, ListChecks, HelpCircle, Save, Info, ArrowUpRight
} from "lucide-react";

export default function App() {
  // Read initial states from LocalStorage if available for easier persistence
  const [candidates, setCandidates] = useState<Candidate[]>(() => {
    const saved = localStorage.getItem("recruitment_candidates");
    return saved ? JSON.parse(saved) : [];
  });

  const [jdText, setJdText] = useState(() => {
    const saved = localStorage.getItem("recruitment_jd_text");
    if (saved) return saved;
    // Default to the first template's text
    return `[MÔ TẢ CÔNG VIỆC]
Chúng tôi đang tìm kiếm Lập trình viên Frontend (ReactJS / Next.js) gia nhập đội ngũ để phát triển các sản phẩm ứng dụng Web thông minh, chất lượng cao.

[NHIỆM VỤ CHÍNH]
- Thiết kế, phát triển và tối ưu giao diện web sử dụng ReactJS, Next.js và Tailwind CSS.
- Chuyển đổi các bản thiết kế Figma thành mã HTML/CSS/React động.

[YÊU CẦU CÔNG VIỆC]
- Có ít nhất 1.5 - 3 năm kinh nghiệm lập trình chuyên môn sản phẩm Frontend.
- Nắm vững JavaScript (ES6+), TypeScript, ReactJS (Hooks, Context API).
- Sử dụng thành thạo Tailwind CSS và các thư viện UI phổ biến.`;
  });

  const [selectedJdId, setSelectedJdId] = useState("react-dev");
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"analysis" | "matrix">("analysis");
  const [copiedText, setCopiedText] = useState<string>("");
  const [tempNotes, setTempNotes] = useState<string>("");

  // Sync state with LocalStorage
  useEffect(() => {
    localStorage.setItem("recruitment_candidates", JSON.stringify(candidates));
  }, [candidates]);

  useEffect(() => {
    localStorage.setItem("recruitment_jd_text", jdText);
  }, [jdText]);

  // Set default selected candidate
  useEffect(() => {
    if (candidates.length > 0 && !selectedCandidateId) {
      setSelectedCandidateId(candidates[0].id);
    }
  }, [candidates, selectedCandidateId]);

  // Handle note loading when candidate changes
  const activeCandidate = candidates.find((c) => c.id === selectedCandidateId);
  useEffect(() => {
    if (activeCandidate) {
      setTempNotes(activeCandidate.notes || "");
    } else {
      setTempNotes("");
    }
  }, [selectedCandidateId]);

  // Save notes handler
  const handleSaveNotes = () => {
    if (!selectedCandidateId) return;
    setCandidates((prev) =>
      prev.map((c) =>
        c.id === selectedCandidateId ? { ...c, notes: tempNotes } : c
      )
    );
    triggerCopiedFeedback("notes-saved");
  };

  const triggerCopiedFeedback = (key: string) => {
    setCopiedText(key);
    setTimeout(() => setCopiedText(""), 1800);
  };

  const copyToClipboard = (text: string, keyId: string) => {
    navigator.clipboard.writeText(text);
    triggerCopiedFeedback(keyId);
  };

  // Screening processing logic
  const handleScreenSingle = async (candidateId: string) => {
    const cand = candidates.find((c) => c.id === candidateId);
    if (!cand) return;

    // Set candidate to scanning
    setCandidates((prev) =>
      prev.map((c) => (c.id === candidateId ? { ...c, status: "scanning", errorMsg: undefined } : c))
    );

    try {
      // Prepare payload representation
      const payload: any = {
        jdText,
        cv: {
          id: cand.id,
          name: cand.fileName,
          textContent: cand.textContent,
          base64: cand.base64,
          mimeType: cand.mimeType,
        },
      };

      const res = await fetch("/api/screen-cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || errData.details || "Phản hồi máy chủ lỗi hoặc rỗng.");
      }

      const data = await res.json();
      setCandidates((prev) =>
        prev.map((c) =>
          c.id === candidateId
            ? { ...c, status: "success", results: data.results }
            : c
        )
      );
    } catch (err: any) {
      console.error(err);
      setCandidates((prev) =>
        prev.map((c) =>
          c.id === candidateId
            ? { ...c, status: "error", errorMsg: err.message || "Lỗi AI phân tích" }
            : c
        )
      );
    }
  };

  // Run screen on all non-complete candidates
  const handleScreenAll = async () => {
    const pending = candidates.filter((c) => c.status !== "scanning" && c.status !== "success");
    if (pending.length === 0) {
      alert("Không có hồ sơ nào đang chờ hoặc bị lỗi để sàng lọc lại.");
      return;
    }

    // Call screening in parallel
    await Promise.all(pending.map((cand) => handleScreenSingle(cand.id)));
  };

  const isAnyScanning = candidates.some((c) => c.status === "scanning");

  return (
    <div className="w-full bg-slate-50 text-slate-900 font-sans min-h-screen flex flex-col antialiased">
      
      {/* Editorial Header Accent */}
      <div className="h-1.5 bg-indigo-600" />

      {/* Header */}
      <header className="px-6 md:px-12 py-6 border-b border-indigo-100 bg-white flex flex-col md:flex-row justify-between items-baseline gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-serif font-black tracking-tighter uppercase flex items-center gap-1 text-indigo-950">
            CV/MATCH <span className="font-serif italic font-normal text-3xl lowercase text-indigo-600">intelligence</span>
          </h1>
          <p className="text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] text-slate-500 mt-1">
            AI-POWERED AUTOMATED CV/JD MATCHING & SCREENING SYSTEM
          </p>
        </div>
        
        {/* Statistics & Meta info banner */}
        <div className="flex gap-8 text-[11px] font-bold uppercase tracking-widest text-slate-600 self-end md:self-auto">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>AI ENGINE ONLINE</span>
          </div>
          <div className="text-slate-400">
            SYSTEM VERSION // 3.5.FL
          </div>
        </div>
      </header>

      {/* Primary Workspace Panels */}
      <main className="flex-1 flex flex-col lg:flex-row min-h-0 border-b border-[#1A1A1A]">
        
        {/* Left column sidebar for Inputs (JD + File List) */}
        <aside className="w-full lg:w-[380px] border-r border-slate-200 flex flex-col bg-slate-50 flex-shrink-0">
          
          {/* Section 1: JD Input Panel */}
          <div className="p-4 md:p-6 border-b border-slate-200 flex-1">
            <JDInput
              jdText={jdText}
              setJdText={setJdText}
              selectedJdId={selectedJdId}
              setSelectedJdId={setSelectedJdId}
            />
          </div>

          {/* Section 2: Candidate File Manager */}
          <div className="p-4 md:p-6 flex-1">
            <CandidateList
              candidates={candidates}
              setCandidates={setCandidates}
              selectedCandidateId={selectedCandidateId}
              setSelectedCandidateId={setSelectedCandidateId}
              onScreenSingleCandidate={handleScreenSingle}
              isAnyScanning={isAnyScanning}
            />
          </div>
        </aside>

        {/* Right column: Primary Display Results Dashboard */}
        <section className="flex-1 p-4 md:p-8 flex flex-col bg-slate-50 overflow-y-auto">
          
          {/* Action Header bar (Core control center) */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-4 border-slate-200 mb-6 gap-4">
            
            {/* Elegant tabs indicator */}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab("analysis")}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-widest border transition duration-200 cursor-pointer rounded-md ${
                  activeTab === "analysis"
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                    : "bg-white text-slate-700 border-slate-200 hover:border-indigo-200"
                }`}
              >
                Analysis Details
              </button>
              <button
                onClick={() => setActiveTab("matrix")}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-widest border transition duration-200 cursor-pointer rounded-md ${
                  activeTab === "matrix"
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                    : "bg-white text-slate-700 border-slate-200 hover:border-indigo-200"
                }`}
              >
                Comparison Matrix ({candidates.filter(c => c.status === "success").length})
              </button>
            </div>

            {/* Mass control action button */}
            {candidates.length > 0 && (
              <button
                onClick={handleScreenAll}
                disabled={isAnyScanning}
                className={`w-full md:w-auto text-xs font-bold uppercase tracking-widest border border-indigo-600 py-2.5 px-5 bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white transition duration-200 cursor-pointer flex items-center justify-center gap-2 rounded-md ${
                  isAnyScanning ? "opacity-40 cursor-not-allowed" : ""
                }`}
              >
                {isAnyScanning ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Screening in progress...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Screen all candidates ({candidates.filter(c => c.status !== "success").length})</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* TAB 1: SINGLE ANALYSIS DETAIL SCREEN */}
          {activeTab === "analysis" && (
            <div className="flex-1 flex flex-col">
              {!activeCandidate ? (
                <div className="flex-1 flex flex-col items-center justify-center py-20 text-[#1A1A1A]/40 min-h-[300px] border-2 border-dashed border-[#1A1A1A]/30 bg-[#F9F7F2]/30 p-6 text-center">
                  <FileText className="w-12 h-12 text-[#1A1A1A]/20 mb-3" />
                  <h3 className="font-serif font-black text-lg text-[#1A1A1A] uppercase tracking-wider">No candidate selected</h3>
                  <p className="text-xs italic font-serif mt-1 max-w-sm text-[#1A1A1A]/70">
                    Please upload a CV document or select a candidate from the sidebar to view detailed AI analysis.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  
                  {/* Selected Candidate Meta Section */}
                  <div className="border border-[#1A1A1A] p-6 bg-[#F9F7F2]">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      
                      {/* Name, contact and estimated experience */}
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold tracking-widest bg-white border border-[#1A1A1A] px-2 py-0.5 text-slate-700">
                          Ứng viên ({activeCandidate.fileType.toUpperCase()})
                        </span>
                        <h2 className="text-3xl font-serif font-black tracking-tight text-[#1A1A1A] uppercase">
                          {activeCandidate.results?.candidateName || activeCandidate.fileName}
                        </h2>
                        
                        {/* Interactive contact card */}
                        <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs pt-1.5">
                          {activeCandidate.results?.email && (
                            <button
                              onClick={() => copyToClipboard(activeCandidate.results!.email, "email")}
                              className="flex items-center gap-1 text-[#1A1A1A]/80 hover:text-[#1A1A1A] transition cursor-pointer"
                              title="Nhấp để sao chép địa chỉ email"
                            >
                              <Mail className="w-3.5 h-3.5" />
                              <span className="underline decoration-dotted underline-offset-2">{activeCandidate.results.email}</span>
                              {copiedText === "email" && <Check className="w-3 h-3 text-emerald-700 font-bold" />}
                            </button>
                          )}
                          {activeCandidate.results?.phone && (
                            <button
                              onClick={() => copyToClipboard(activeCandidate.results!.phone, "phone")}
                              className="flex items-center gap-1 text-[#1A1A1A]/80 hover:text-[#1A1A1A] transition cursor-pointer"
                              title="Nhấp để sao chép số điện thoại"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              <span className="underline decoration-dotted underline-offset-2">{activeCandidate.results.phone}</span>
                              {copiedText === "phone" && <Check className="w-3 h-3 text-emerald-700" />}
                            </button>
                          )}
                          {activeCandidate.results?.education && (
                            <div className="flex items-center gap-1 text-[#1A1A1A]/70 font-serif">
                              <BookOpen className="w-3.5 h-3.5 text-[#1A1A1A]" />
                              <span className="italic">{activeCandidate.results.education}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Matching badge and Quick trigger */}
                      <div className="flex flex-col items-end gap-2 self-stretch md:self-auto">
                        {activeCandidate.status === "success" && activeCandidate.results ? (
                          <div className="text-right flex items-baseline md:flex-col gap-2">
                            <span className="text-xs font-mono font-bold tracking-widest">ĐỘ TƯƠNG THÍCH</span>
                            <div className="text-5xl font-serif font-black italic tracking-tighter text-[#1A1A1A]">
                              {activeCandidate.results.matchScore}%
                            </div>
                          </div>
                        ) : (
                          <div className="h-full flex items-center">
                            {activeCandidate.status === "scanning" ? (
                              <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-500 rounded-lg">
                                <RefreshCw className="w-4 h-4 animate-spin text-amber-700" />
                                <span className="text-xs font-bold text-amber-900 uppercase">AI Đang phân tích...</span>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleScreenSingle(activeCandidate.id)}
                                className="bg-[#1A1A1A] text-white hover:bg-white hover:text-[#1A1A1A] border-2 border-[#1A1A1A] px-5 py-2.5 text-xs font-bold uppercase tracking-widest transition"
                              >
                                Bắt đầu phân tích CV này
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                    </div>
                  </div>

                  {/* Primary results dashboard shown only on Success */}
                  {activeCandidate.status === "success" && activeCandidate.results ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                      {/* Column block 1: Summary Recommendation Card & Sub-scores */}
                      <div className="md:col-span-1 space-y-6">
                        
                        {/* Custom Verdict Block */}
                        <div className="border border-[#1A1A1A] p-5 bg-white">
                          <span className="text-[9px] uppercase font-bold tracking-widest text-[#1A1A1A]/60 block mb-1">RECOMMENDATION</span>
                          <div className="flex items-center gap-2.5 mb-2.5">
                            <h3 className="font-serif font-black text-2xl uppercase tracking-tighter">
                              KẾT LUẬN:
                            </h3>
                            <span className={`px-2.5 py-0.5 border border-[#1A1A1A] text-xs font-bold uppercase ${
                              activeCandidate.results.recommendation === "Phù hợp"
                                ? "bg-[#E1F2E5] text-emerald-800"
                                : activeCandidate.results.recommendation === "Cân nhắc"
                                ? "bg-[#F5E6CC] text-amber-950"
                                : "bg-rose-100 text-rose-800"
                            }`}>
                              {activeCandidate.results.recommendation}
                            </span>
                          </div>
                          <p className="text-xs italic font-serif leading-relaxed text-[#1A1A1A]/80">
                            "{activeCandidate.results.reason}"
                          </p>
                        </div>

                        {/* Breakdown Subscores indicators (Styled like custom Editorial columns) */}
                        <div className="border border-[#1A1A1A] p-5 bg-[#F9F7F2]/50 space-y-4">
                          <span className="text-[9px] uppercase font-bold tracking-widest text-[#1A1A1A]/60 block border-b border-[#1A1A1A]/20 pb-1.5 mb-3">SCORE METRICS</span>
                          
                          {/* Technical score */}
                          <div>
                            <div className="flex justify-between items-baseline mb-1">
                              <span className="text-[10px] font-bold uppercase tracking-wide">Kỹ năng Chuyên môn</span>
                              <span className="font-serif text-sm font-bold italic">{activeCandidate.results.technicalScore}/100</span>
                            </div>
                            <div className="w-full bg-[#1A1A1A]/10 h-1.5 border border-[#1A1A1A]">
                              <div className="bg-[#1A1A1A] h-full" style={{ width: `${activeCandidate.results.technicalScore}%` }} />
                            </div>
                          </div>

                          {/* Experience score */}
                          <div>
                            <div className="flex justify-between items-baseline mb-1">
                              <span className="text-[10px] font-bold uppercase tracking-wide">Kinh nghiệm thực tế</span>
                              <span className="font-serif text-sm font-bold italic">{activeCandidate.results.experienceScore}/100</span>
                            </div>
                            <div className="w-full bg-[#1A1A1A]/10 h-1.5 border border-[#1A1A1A]">
                              <div className="bg-[#1A1A1A] h-full" style={{ width: `${activeCandidate.results.experienceScore}%` }} />
                            </div>
                          </div>

                          {/* Education score */}
                          <div>
                            <div className="flex justify-between items-baseline mb-1">
                              <span className="text-[10px] font-bold uppercase tracking-wide">Học vấn & Bằng cấp</span>
                              <span className="font-serif text-sm font-bold italic">{activeCandidate.results.educationScore}/100</span>
                            </div>
                            <div className="w-full bg-[#1A1A1A]/10 h-1.5 border border-[#1A1A1A]">
                              <div className="bg-[#1A1A1A] h-full" style={{ width: `${activeCandidate.results.educationScore}%` }} />
                            </div>
                          </div>

                          {/* Quick Summary list of metrics metadata */}
                          <div className="pt-3 border-t border-[#1A1A1A] border-dashed grid grid-cols-2 gap-2 text-center text-xs">
                            <div className="bg-white border p-1">
                              <div className="text-[10px] text-[#1A1A1A]/50">KINH NGHIỆM</div>
                              <div className="font-serif font-black">{activeCandidate.results.yearsOfExperience || "—"} Năm</div>
                            </div>
                            <div className="bg-white border p-1">
                              <div className="text-[10px] text-[#1A1A1A]/50 font-serif">PHÙ HỢP CHUNG</div>
                              <div className="font-serif font-black">{activeCandidate.results.matchScore}%</div>
                            </div>
                          </div>
                        </div>

                        {/* Recruiter Custom Editable Local Notes Section */}
                        <div className="border border-[#1A1A1A] p-5 bg-[#F9F7F2]/30 space-y-3">
                          <span className="text-[9px] uppercase font-bold tracking-widest text-[#1A1A1A]/60 block">SỔ TAY GHI CHÚ NHÀ TUYỂN DỤNG</span>
                          <textarea
                            value={tempNotes}
                            onChange={(e) => setTempNotes(e.target.value)}
                            placeholder="Nhập ghi chú nhanh về ứng viên này (Ví dụ: Đã hẹn phỏng vấn thứ 3 tuần sau, yêu cầu gửi thêm portfolio...)"
                            className="w-full min-h-[90px] p-2.5 bg-white text-xs border border-[#1A1A1A] text-slate-800 leading-relaxed focus:outline-hidden"
                          />
                          <button
                            onClick={handleSaveNotes}
                            className="w-full bg-[#1A1A1A] text-[#F9F7F2] py-1.5 text-xs font-bold uppercase tracking-widest hover:bg-[#F5E6CC] hover:text-[#1A1A1A] border border-[#1A1A1A] transition cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>Lưu ghi chú riêng</span>
                          </button>
                          {copiedText === "notes-saved" && (
                            <p className="text-[10px] text-emerald-800 font-bold bg-emerald-50 px-2 py-1 text-center border border-emerald-300">
                              Đã sao lưu thông tin notes thành công!
                            </p>
                          )}
                        </div>

                      </div>

                      {/* Column block 2: Skill matching details */}
                      <div className="md:col-span-2 space-y-6">

                        {/* Overview assessment paragraphs */}
                        <div className="border border-[#1A1A1A] p-6 bg-white space-y-2">
                          <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#1A1A1A]/60 block border-b pb-1">TỔNG QUAN HỒ SƠ</span>
                          <p className="text-sm italic font-serif leading-relaxed text-slate-800">
                            "{activeCandidate.results.summary}"
                          </p>
                        </div>

                        {/* Skills and core profiles layout */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          
                          {/* Matched list */}
                          <div className="border border-[#1A1A1A] p-5 bg-[#E1F2E5]/25">
                            <h4 className="font-serif font-black text-sm uppercase tracking-tight text-[#1A1A1A] mb-3 flex items-center gap-1.5">
                              <CheckCircle className="w-4 h-4 text-emerald-800" />
                              <span>Kỹ năng & Thỏa mãn (Matched)</span>
                            </h4>
                            {activeCandidate.results.technicalSkillsMatched.length === 0 ? (
                              <p className="text-xs italic text-[#1A1A1A]/50">Chưa có thông tin tương thích chi tiết.</p>
                            ) : (
                              <ul className="space-y-2.5">
                                {activeCandidate.results.technicalSkillsMatched.map((skill, i) => (
                                  <li key={i} className="text-xs flex items-start gap-1 text-slate-800">
                                    <span className="text-emerald-700 font-bold mt-0.5">•</span>
                                    <span>{skill}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>

                          {/* Missing / Unmet items */}
                          <div className="border border-[#1A1A1A] p-5 bg-rose-50/20">
                            <h4 className="font-serif font-black text-sm uppercase tracking-tight text-[#1A1A1A] mb-3 flex items-center gap-1.5">
                              <XCircle className="w-4 h-4 text-rose-800" />
                              <span>Điểm thiếu hụt (Missing Gap)</span>
                            </h4>
                            {activeCandidate.results.technicalSkillsMissing.length === 0 ? (
                              <li className="text-xs list-none italic text-emerald-800 bg-emerald-50 p-2 border border-emerald-200">
                                Tuyệt vời! Ứng viên đáp ứng hầu hết các kỹ năng kỹ thuật yêu cầu.
                              </li>
                            ) : (
                              <ul className="space-y-2.5">
                                {activeCandidate.results.technicalSkillsMissing.map((skill, i) => (
                                  <li key={i} className="text-xs flex items-start gap-1 text-slate-800">
                                    <span className="text-rose-700 font-bold mt-0.5">•</span>
                                    <span>{skill}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>

                        </div>

                        {/* Strengths and weaknesses lists */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          
                          {/* Strengths */}
                          <div className="border border-[#1A1A1A] p-5 bg-white">
                            <h4 className="font-serif font-black text-sm uppercase tracking-tight text-[#1A1A1A] mb-3 flex items-center gap-1.5">
                              <Award className="w-4 h-4 text-amber-700" />
                              <span>Thế mạnh nổi bật</span>
                            </h4>
                            <ul className="space-y-2.5">
                              {activeCandidate.results.strengths.map((str, i) => (
                                <li key={i} className="text-xs flex items-start gap-2 text-slate-800">
                                  <span className="bg-[#1A1A1A] text-white text-[9px] w-4 h-4 font-bold flex items-center justify-center font-mono mt-0.5">
                                    {i + 1}
                                  </span>
                                  <span>{str}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Weaknesses */}
                          <div className="border border-[#1A1A1A] p-5 bg-white">
                            <h4 className="font-serif font-black text-sm uppercase tracking-tight text-[#1A1A1A] mb-3 flex items-center gap-1.5">
                              <AlertCircle className="w-4 h-4 text-slate-700" />
                              <span>Cần cân nhắc / Điểm hạn chế</span>
                            </h4>
                            <ul className="space-y-2.5">
                              {activeCandidate.results.weaknesses.map((weak, i) => (
                                <li key={i} className="text-xs flex items-start gap-1.5 text-slate-800">
                                  <span className="text-[#1A1A1A]/70 font-bold mt-0.5">—</span>
                                  <span>{weak}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                        </div>

                        {/* Deeper Interview Prompt Questions */}
                        <div className="border border-[#1A1A1A] p-5 bg-[#F5E6CC]/20 space-y-4">
                          <div>
                            <h4 className="font-serif font-black text-base uppercase tracking-tight text-[#1A1A1A]">
                              ĐỀ XUẤT CÂU HỎI PHỎNG VẤN CHUYÊN BIỆT
                            </h4>
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">
                              CÂU HỎI NHẰM PHÂN MINH ĐIỂM YẾU HOẶC THỬ THÁCH NĂNG LỰC
                            </p>
                          </div>

                          {activeCandidate.results.interviewQuestions.length === 0 ? (
                            <p className="text-xs italic text-[#1A1A1A]/50">Không có câu hỏi đề xuất đặc thù.</p>
                          ) : (
                            <div className="space-y-3.5">
                              {activeCandidate.results.interviewQuestions.map((q, i) => (
                                <div key={i} className="bg-white border-l-4 border-[#1A1A1A] p-3 text-xs leading-relaxed text-[#1A1A1A]">
                                  <div className="font-bold text-[9px] uppercase tracking-wider text-slate-400 mb-1">CÂU HỎI INTERVIEW {i + 1}</div>
                                  <p className="font-serif font-bold italic">"{q}"</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                      </div>

                    </div>
                  ) : activeCandidate.status === "error" ? (
                    <div className="border-2 border-rose-500 bg-rose-50/10 p-6 text-center space-y-3">
                      <AlertCircle className="w-10 h-10 text-rose-700 mx-auto" />
                      <h4 className="font-bold text-rose-800">SÀNG LỌC THẤT BẠI</h4>
                      <p className="text-xs max-w-md mx-auto text-rose-950 font-serif leading-relaxed">
                        Đã có lỗi xảy ra trong quá trình gọi Generative AI phân tích cấu trúc. Vui lòng xác minh khóa GEMINI_API_KEY trong cấu hình Secrets hoặc xem nội dung text CV.
                      </p>
                      {activeCandidate.errorMsg && (
                        <div className="bg-white border border-rose-200 text-[#1A1A1A] font-mono text-[10px] p-3 rounded-sm text-left max-w-xl mx-auto overflow-x-auto">
                          {activeCandidate.errorMsg}
                        </div>
                      )}
                      <button
                        onClick={() => handleScreenSingle(activeCandidate.id)}
                        className="bg-rose-800 text-white hover:bg-rose-900 text-xs font-bold uppercase tracking-widest px-4 py-2"
                      >
                        Thử lại ngay
                      </button>
                    </div>
                  ) : (
                    <div className="border border-dashed border-[#1A1A1A] p-12 text-center bg-[#FAF9F5] space-y-4">
                      <Info className="w-10 h-10 text-[#1A1A1A]/40 mx-auto" />
                      <h3 className="font-serif font-black text-xl uppercase tracking-wider">Hồ sơ chưa được sàng lọc</h3>
                      <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed font-serif italic">
                        "Nhấp vào nút bên dưới để sử dụng AI Gemini Flash quét trực tiếp dữ liệu ứng tuyển này so sánh với mô tả công việc (JD)."
                      </p>
                      <button
                        onClick={() => handleScreenSingle(activeCandidate.id)}
                        className="bg-[#1A1A1A] text-white hover:bg-white hover:text-[#1A1A1A] border-2 border-[#1A1A1A] px-6 py-3 text-xs font-bold uppercase tracking-widest transition"
                      >
                        Bắt đầu phân tích ứng viên
                      </button>
                    </div>
                  )}

                  {/* Plaintext representation view for Verification */}
                  <div className="border border-[#1A1A1A] p-5 bg-[#FAF9F5]">
                    <span className="text-[9px] uppercase font-bold tracking-widest text-[#1A1A1A]/50 block border-b mb-3 pb-1">DỮ LIỆU NGUỒN CV (RAW TEXT / DETECTED SOURCE)</span>
                    <div className="bg-white p-4 border border-[#1A1A1A]/30 max-h-[220px] overflow-y-auto text-xs text-slate-700 leading-relaxed font-mono whitespace-pre-wrap">
                      {activeCandidate.textContent || (activeCandidate.base64 ? `[Tài liệu tệp PDF được đính kèm ở dạng Base64 - Kích cỡ: ${activeCandidate.size || "Sẵn sàng"}]` : "[Trống]")}
                    </div>
                  </div>

                </div>
              )}
            </div>
          )}

          {/* TAB 2: OVERALL TALENT COMPARISON BOARD */}
          {activeTab === "matrix" && (
            <div className="flex-1 flex flex-col space-y-6">
              
              <div className="p-4 border border-[#1A1A1A] bg-[#F5E6CC]/35 text-xs text-[#1A1A1A] flex items-start gap-2.5">
                <Info className="w-5 h-5 text-slate-700 flex-shrink-0 mt-0.5" />
                <div className="space-y-1 font-serif leading-relaxed">
                  <p className="font-bold uppercase tracking-wider text-[10px] font-sans">MÁY QUANG HỌC MATRIX CHUYÊN SÂU</p>
                  <p>Bảng hiển thị so sánh chuẩn hóa các ứng viên đã được sàng lọc thành công. Bạn có thể nhanh chóng sắp xếp, đưa ra quyết định ngắn hạn, so sánh phân bổ năng lực giữa các hồ sơ.</p>
                </div>
              </div>

              {candidates.filter((c) => c.status === "success").length === 0 ? (
                <div className="py-20 text-center text-[#1A1A1A]/40 min-h-[200px] border border-dashed border-[#1A1A1A] bg-[#F9F7F2]/40 flex flex-col items-center justify-center">
                  <ListChecks className="w-12 h-12 text-[#1A1A1A]/20 mb-2" />
                  <h3 className="font-serif font-black text-lg uppercase tracking-wider">Chưa có ứng viên được sàng lọc</h3>
                  <p className="text-xs italic font-serif mt-1 max-w-sm text-[#1A1A1A]/70">
                    Vui lòng bấm vào nút "Sàng lọc ứng viên đồng loạt" phía trên hoặc tiến hành phân tích lẻ các CV ở danh sách bên trái để lấy dữ liệu xếp hạng.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto border-2 border-[#1A1A1A] bg-white">
                  <table className="w-full text-left border-collapse font-sans">
                    
                    {/* Table headers */}
                    <thead>
                      <tr className="bg-[#1A1A1A] text-white text-[10px] font-bold uppercase tracking-widest border-b border-[#1A1A1A]">
                        <th className="p-4 border-r border-[#1A1A1A]/20">STT</th>
                        <th className="p-4 border-r border-[#1A1A1A]/20">Ứng viên</th>
                        <th className="p-4 text-center border-r border-[#1A1A1A]/20">Sàng lọc CHUNG</th>
                        <th className="p-4 text-center border-r border-[#1A1A1A]/20">Chuyên môn</th>
                        <th className="p-4 text-center border-r border-[#1A1A1A]/20">Kinh nghiệm</th>
                        <th className="p-4 text-center border-r border-[#1A1A1A]/20">Học vấn</th>
                        <th className="p-4 border-r border-[#1A1A1A]/20">Phân loại</th>
                        <th className="p-4">Tóm tắt đánh giá</th>
                      </tr>
                    </thead>
                    
                    {/* Table body */}
                    <tbody className="text-xs">
                      {candidates
                        .filter((c) => c.status === "success" && c.results)
                        .sort((a, b) => (b.results?.matchScore || 0) - (a.results?.matchScore || 0))
                        .map((cand, idx) => {
                          const r = cand.results!;
                          return (
                            <tr
                              key={cand.id}
                              onClick={() => {
                                setSelectedCandidateId(cand.id);
                                setActiveTab("analysis");
                              }}
                              className="border-b border-[#1A1A1A] hover:bg-[#F5E6CC]/20 transition cursor-pointer"
                            >
                              {/* Index */}
                              <td className="p-4 font-serif font-bold border-r border-[#1A1A1A]/10 text-center">
                                {idx + 1}
                              </td>

                              {/* Candidate Name & Info */}
                              <td className="p-4 border-r border-[#1A1A1A]/10 max-w-[160px]">
                                <div className="font-serif font-black uppercase text-[#1A1A1A] truncate">
                                  {r.candidateName}
                                </div>
                                <div className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">
                                  {r.email || "Không có Email"}
                                </div>
                              </td>

                              {/* Overal rating */}
                              <td className="p-4 text-center border-r border-[#1A1A1A]/10 bg-[#FAF9F5]">
                                <div className="font-serif font-black text-lg italic text-[#1A1A1A]">
                                  {r.matchScore}%
                                </div>
                              </td>

                              {/* Tech Score */}
                              <td className="p-4 text-center border-r border-[#1A1A1A]/10">
                                <span className={`font-mono font-bold ${r.technicalScore >= 80 ? "text-emerald-800" : ""}`}>
                                  {r.technicalScore}
                                </span>
                              </td>

                              {/* Experience score / duration */}
                              <td className="p-4 text-center border-r border-[#1A1A1A]/10">
                                <span className="font-mono font-bold block">{r.experienceScore}</span>
                                <span className="text-[9px] text-[#1A1A1A]/60 italic">({r.yearsOfExperience} Năm)</span>
                              </td>

                              {/* Education Score */}
                              <td className="p-4 text-center border-r border-[#1A1A1A]/10 font-mono">
                                {r.educationScore}
                              </td>

                              {/* Recommendation badges */}
                              <td className="p-4 border-r border-[#1A1A1A]/10">
                                <span className={`px-2 py-0.5 border border-[#1A1A1A] text-[9px] font-bold uppercase block text-center ${
                                  r.recommendation === "Phù hợp"
                                    ? "bg-[#E1F2E5] text-emerald-800"
                                    : r.recommendation === "Cân nhắc"
                                    ? "bg-[#F5E6CC] text-amber-950"
                                    : "bg-rose-100 text-rose-800"
                                }`}>
                                  {r.recommendation}
                                </span>
                              </td>

                              {/* Brief summary */}
                              <td className="p-4 text-slate-700 italic font-serif leading-relaxed text-[11px] max-w-[280px] line-clamp-2">
                                "{r.summary}"
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </section>
      </main>

      {/* Decorative footer */}
      <footer className="bg-[#1A1A1A] text-white px-6 md:px-12 py-3 flex flex-col sm:flex-row justify-between items-center text-[10px] uppercase font-bold tracking-widest gap-2">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            Trực quan hoá Báo chí (Editorial Theme)
          </span>
          <span className="opacity-40">Môi trường: Google Cloud Run</span>
        </div>
        <div className="opacity-70 text-right">
          SÀNG LỌC TUYỂN DỤNG THÔNG MINH // ANT TECH HR © 2026
        </div>
      </footer>

    </div>
  );
}
