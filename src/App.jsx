import React, { useState, useRef } from "react";
import QRCode from "qrcode";
import { Link2, NotepadText,Phone,FileText,Download,Trash2,ScanQrCode,QrCode } from 'lucide-react';





function App() {
  const TYPES = [
    { key: "url", label: "URL", icon:<Link2 size={19}/> },
    { key: "text", label: "Text", icon:<NotepadText size={19} />},
    { key: "phone", label: "Phone", icon:<Phone size={19} /> },
    { key: "pdf", label: "Upload PDF", icon:<FileText size={19} /> },
  ];

  const [type, setType] = useState("text");
  const [pendingType, setPendingType] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [fileName, setFileName] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [error, setError] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const fileInputRef = useRef(null);

  const BACKEND_URL = "https://qr-generator-server-l7or.onrender.com";

  // validate URL
  const isValidUrl = (v) => {
    try {
      const u = new URL(v);
      return u.protocol === "http:" || u.protocol === "https:";
    } catch {
      return false;
    }
  };

  // validate phone
  const isValidPhone = (v) => {
    if (!v) return false;
    const plain = v.trim().startsWith("+") ? v.trim().slice(1) : v.trim();
    return /^[0-9]+$/.test(plain) && plain.length >= 6 && plain.length <= 15;
  };

  // change type
  const requestTypeChange = (newType) => {
    if (newType === type) return;
    if (inputValue || qrDataUrl || fileName) {
      setPendingType(newType);
      setShowConfirm(true);
    } else applyTypeChange(newType);
  };

  const applyTypeChange = (newType) => {
    setType(newType);
    setPendingType(null);
    setShowConfirm(false);
    setInputValue("");
    setFileName("");
    setQrDataUrl(null);
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
    // confirm change
  const handleConfirmChange = (confirm) => {
    if (confirm && pendingType) applyTypeChange(pendingType);
    else setShowConfirm(false);
  };

  // อัปโหลด PDF 
  const handlePdfUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      setError("กรุณาเลือกไฟล์ PDF เท่านั้น");
      return;
    }

    setFileName(file.name);

    try {
      // code
      const formData = new FormData();
      formData.append("file", file)

      const res =await fetch(`${BACKEND_URL}/upload`, {
        method: "POST",
        body: formData
      })

      const data = await res.json();
      if (res.ok) {
        setInputValue(data.fileUrl)
        setError("")
      } else {
        setError(data.error || "อัปโหลดไฟล์ล้มเหลว")
      }

    } catch (err) {
      console.error(err)
      setError("เกิดข้อผิดพลาดขณะอัปโหลด PDF")
    }
  };

  // generate qr
  const generateQr = async () => {
    setError("");
    setIsGenerating(true);

    try {
      let payload = "";
      if (type === "url") {
        if (!isValidUrl(inputValue))
          return setError("กรุณากรอก URL ให้ถูกต้อง"), setIsGenerating(false);
        payload = inputValue.trim();
      } else if (type === "phone") {
        if (!isValidPhone(inputValue))
          return (
            setError("กรุณากรอกหมายเลขโทรศัพท์ให้ถูกต้อง"),
            setIsGenerating(false)
          );
        payload = "tel:" + inputValue.trim();
      } else if (type === "text") {
        if (!inputValue)
          return setError("กรอกข้อความก่อนสร้าง QR code"), setIsGenerating(false);
        payload = inputValue;
      } else if (type === "pdf") {
        if (!inputValue)
          return setError("กรุณาอัปโหลด PDF ก่อน"), setIsGenerating(false);
        payload = inputValue;
      }

      const opts = { errorCorrectionLevel: "M", margin: 2, scale: 25 };
      const dataUrl = await QRCode.toDataURL(payload, opts);
      setQrDataUrl(dataUrl);
    } catch (e) {
      console.error(e);
      setError("เกิดข้อผิดพลาดขณะสร้าง QR code");
    } finally {
      setIsGenerating(false);
    }
  };

  // download QR
  const downloadQr = () => {
    if (!qrDataUrl) return;
    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = fileName
      ? fileName.replace(/\.[^.]+$/, "") + "_qr.png"
      : "qr.png";
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div>
      {/* Nav */}
      <nav className="bg-white shadow-md py-4">
        <div className="flex items-center">
          <div className="text-2xl font-bold text-sky-600 px-4 py-2 rounded-lg hover:bg-sky-100 transition">
            <QrCode size={30}/> 
          </div>
        </div>
      </nav>

      {/* Header */}
      <div className="flex flex-col items-center min-h-screen bg-slate-50 p-4">
        <h1 className="text-3xl font-bold text-gray-700 mb-6">
          QR Code Generator
        </h1>

        {/* Card */}
        <div className="bg-slate-200 shadow-lg rounded-3xl p-10 w-[95%] max-w-6xl flex flex-wrap justify-between border-2 border-zinc-500">
          {/* Left */}
          <div className="flex-1 min-w-[300px] mr-8">
            {/* Menu */}
            <div className="flex gap-2 mb-6 flex-wrap">
              {TYPES.map((t) => (
                <button
                  key={t.key}
                  onClick={() => requestTypeChange(t.key)}
                  className={`hover:bg-slate-300 flex items-center gap-2 px-3 py-2 rounded-md border ${
                    type === t.key
                      ? "bg-slate-800 text-white"
                      : "bg-white text-slate-800"
                  }`}
                >
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </div>

            {/* Input Section */}
            {type === "url" && (
              <input
                type="text"
                placeholder="https://example.com"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-6 py-4 mb-4 text-lg focus:outline-none focus:ring-2 focus:ring-sky-300"
              />
            )}
            {type === "text" && (
              <textarea
                rows="3"
                placeholder="พิมพ์ข้อความที่นี่..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-6 py-4 mb-4 text-lg focus:outline-none focus:ring-2 focus:ring-sky-300"
              />
            )}
            {type === "phone" && (
              <input
                type="text"
                placeholder="0812345678 หรือ +66812345678"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-6 py-4 mb-4 text-lg focus:outline-none focus:ring-2 focus:ring-sky-300"
              />
            )}
            {type === "pdf" && (
              <div className="flex flex-col gap-2 mb-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  onChange={handlePdfUpload}
                  className="w-full border border-gray-300 rounded-xl px-6 py-3 text-lg bg-white"
                />
                {fileName && (
                  <p className="text-sm text-gray-700">📄 {fileName}</p>
                )}
              </div>
            )}

            {/* Error */}
            {error && <div className="text-red-600 mb-3">{error}</div>}

            {/* Buttons */}
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={generateQr}
                disabled={isGenerating}
                className="flex items-center gap-2 px-4 py-2 rounded bg-sky-600 text-white disabled:opacity-60"
              >
                {isGenerating ? "กำลังสร้าง..." : (
                  <>
                  <ScanQrCode size={16} />
                  "สร้าง QR"
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setInputValue("");
                  setFileName("");
                  setQrDataUrl(null);
                  setError("");
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="flex items-center gap-2 px-4 py-2 rounded border bg-red-500 text-white"
              >
                <Trash2 size={16} />
                ล้าง
              </button>
              {qrDataUrl && (
                <button
                  onClick={downloadQr}
                  className="flex items-center gap-2 px-4 py-2 rounded bg-green-600 text-white"
                >
                  <Download size={16} />
                  ดาวน์โหลด PNG
                </button>
              )}
            </div>
          </div>

          {/* Right QR Preview */}
          <div className="flex items-center justify-center bg-white rounded-2xl p-8 w-[300px] h-[300px] mt-6 md:mt-0">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="QR code"
                className="w-56 h-56 object-contain bg-white p-2"
              />
            ) : (
              <p className="text-gray-600 text-sm text-center">
                สร้าง QR Code ของคุณที่นี่
              </p>
            )}
          </div>
        </div>

        {/* Confirm Modal */}
        {showConfirm && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-lg p-4 max-w-md w-full">
              <h4 className="font-semibold">ยืนยันการเปลี่ยนโหมด</h4>
              <p className="mt-2 text-sm text-gray-600">
                การเปลี่ยนโหมดจะล้างข้อมูล / ไฟล์ / QR ที่มีอยู่แล้ว
              </p>
              <div className="flex gap-2 justify-end mt-4">
                <button
                  onClick={() => handleConfirmChange(false)}
                  className="px-3 py-2 rounded border"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={() => handleConfirmChange(true)}
                  className="px-3 py-2 rounded bg-red-600 text-white"
                >
                  เปลี่ยนและล้าง
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
