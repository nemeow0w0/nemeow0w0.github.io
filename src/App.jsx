import React, { useState, useRef } from "react";
import QRCode from "qrcode";
import {
  Link2,
  NotepadText,
  Phone,
  Download,
  Trash2,
  ScanQrCode,
  QrCode,
} from "lucide-react";

function App() {
  const TYPES = [
    { key: "url", label: "URL", icon: <Link2 size={19} /> },
    { key: "text", label: "Text", icon: <NotepadText size={19} /> },
    { key: "phone", label: "Phone", icon: <Phone size={19} /> },
  ];

  const [type, setType] = useState("text");
  const [pendingType, setPendingType] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [error, setError] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [qrPayload, setQrPayload] = useState("");

  const canvasRef = useRef();

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
    if (inputValue || qrDataUrl) {
      setPendingType(newType);
      setShowConfirm(true);
    } else applyTypeChange(newType);
  };
  const applyTypeChange = (newType) => {
    setType(newType);
    setPendingType(null);
    setShowConfirm(false);
    clearAll();
  };

  const handleConfirmChange = (confirm) => {
    if (confirm && pendingType) applyTypeChange(pendingType);
    else setShowConfirm(false);
  };

  // clear all
  const clearAll = () => {
    setInputValue("");
    setQrDataUrl(null);
    setLogoFile(null);
    setError("");
    setQrPayload("");
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  // drae qr with logo
  const drawQrWithLogo = async (payload, logoFile) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const canvasSize = 250;
    canvas.width = canvasSize;
    canvas.height = canvasSize;

    await QRCode.toCanvas(canvas, payload, {
      errorCorrectionLevel: "H",
      margin: 2,
      width: canvasSize,
    });

    if (logoFile) {
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.src = URL.createObjectURL(logoFile);
      await new Promise((res) => {
        img.onload = () => {
          const size = canvas.width * 0.2;
          const x = (canvas.width - size) / 2;
          const y = (canvas.height - size) / 2;
          ctx.drawImage(img, x, y, size, size);
          res();
        };
      });
    }

    setQrDataUrl(canvas.toDataURL());
  };

  // generate QR
  const generateQr = async () => {
    setError("");
    setIsGenerating(true);
    try {
      let payload = "";
      if (type === "url") {
        if (!isValidUrl(inputValue)) {
          setError("กรุณากรอก URL ให้ถูกต้อง");
          setIsGenerating(false);
          return;
        }
        payload = inputValue.trim();
      } else if (type === "phone") {
        if (!isValidPhone(inputValue)) {
          setError("กรุณากรอกหมายเลขโทรศัพท์ให้ถูกต้อง");
          setIsGenerating(false);
          return;
        }
        payload = "tel:" + inputValue.trim();
      } else if (type === "text") {
        if (!inputValue) {
          setError("กรอกข้อความก่อนสร้าง QR code");
          setIsGenerating(false);
          return;
        }
        payload = inputValue;
      }

      setQrPayload(payload);
      await drawQrWithLogo(payload, logoFile);
    } catch (e) {
      console.error(e);
      setError("เกิดข้อผิดพลาดขณะสร้าง QR code");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadQr = async () => {
    if (!qrDataUrl) return;

    const canvas = document.createElement("canvas");
    const size = 1000;
    canvas.width = size;
    canvas.height = size;

    await QRCode.toCanvas(canvas, qrPayload, {
      errorCorrectionLevel: "H",
      margin: 2,
      width: size,
    });

    if (logoFile) {
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.src = URL.createObjectURL(logoFile);
      await new Promise((res) => {
        img.onload = () => {
          const logoSize = size * 0.2;
          const x = (size - logoSize) / 2;
          const y = (size - logoSize) / 2;
          ctx.drawImage(img, x, y, logoSize, logoSize);
          res();
        };
      });
    }

    canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "qr.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, "image/png");
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gradient-to-br from-sky-50 via-white to-cyan-50 p-6">
      <nav className="w-full max-w-6xl bg-white/80 backdrop-blur-lg shadow-lg rounded-3xl mb-8 px-8 py-5 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-sky-300 to-cyan-400 p-2 rounded-xl shadow">
            <QrCode className="text-white" size={26} />
          </div>
          <span className="text-2xl font-bold text-sky-700">
            QR Code Generator
          </span>
        </div>
      </nav>

      <h1 className="text-3xl font-extrabold text-sky-800 mb-8 drop-shadow-sm text-center">
        Create your QR code here for free! ✨
      </h1>
      {/*main Container */}
      <div className="w-full max-w-6xl bg-white/80 backdrop-blur-xl border border-slate-200 shadow-2xl rounded-3xl p-10 flex flex-wrap justify-between gap-10">
        {/* Left Panel */}
        <div className="flex-1 min-w-[300px] flex flex-col gap-4">
          <div className="flex flex-wrap gap-3">
            {TYPES.map((t) => (
              <button
                key={t.key}
                onClick={() => requestTypeChange(t.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all shadow-md ${
                  type === t.key
                    ? "bg-gradient-to-r from-sky-500 to-cyan-500 text-white"
                    : "bg-white text-slate-800 hover:bg-slate-100"
                }`}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* Input */}
          {type === "url" && (
            <input
              type="text"
              placeholder="https://example.com"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-sky-400 shadow-inner"
            />
          )}
          {type === "text" && (
            <textarea
              rows={3}
              placeholder="พิมพ์ข้อความที่นี่..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-sky-400 shadow-inner"
            />
          )}
          {type === "phone" && (
            <input
              type="text"
              placeholder="0812345678"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-sky-400 shadow-inner"
            />
          )}

          {error && <div className="text-red-600 text-sm">{error}</div>}

          <div className="flex flex-wrap gap-3 mt-3">
            <button
              onClick={generateQr}
              disabled={isGenerating}
              className="bg-gradient-to-r from-sky-600 to-cyan-500 hover:from-sky-700 hover:to-cyan-600 text-white px-5 py-2 rounded-xl flex items-center gap-2 shadow-md transition-all hover:scale-[1.02]"
            >
              {isGenerating ? (
                "กำลังสร้าง..."
              ) : (
                <>
                  <ScanQrCode size={16} /> สร้าง QR
                </>
              )}
            </button>
            <button
              onClick={clearAll}
              className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-xl flex items-center gap-2 text-sm shadow-md transition-all hover:scale-[1.02]"
            >
              <Trash2 size={16} /> ล้าง
            </button>
          </div>
        </div>

        {/* Right Panel */}
        <div className="flex flex-col items-center gap-4 w-full max-w-[280px]">
          <div className="bg-white rounded-3xl p-4 w-full h-[280px] flex items-center justify-center shadow-xl border border-slate-200 hover:scale-[1.02] transition-all">
            <canvas ref={canvasRef} className="w-full h-full object-contain" />
            {!qrDataUrl && (
              <p className="absolute text-center text-gray-400 text-lg px-2">
                สร้าง QR ของคุณได้ที่นี่
              </p>
            )}
          </div>

          {qrDataUrl && (
            <button
              onClick={downloadQr}
              className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-xl shadow-md text-sm transition-all hover:scale-[1.03]"
            >
              <Download size={16} /> ดาวน์โหลด PNG
            </button>
          )}

          {qrDataUrl && (
            <div className="w-full flex flex-col items-center gap-2 mt-2">
              <label className="cursor-pointer bg-slate-700 hover:bg-slate-900 text-white px-5 py-2 rounded-xl flex items-center gap-2 shadow-md text-sm transition-all hover:scale-[1.03]">
                เลือกโลโก้
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (!file || !qrPayload) return;
                    setLogoFile(file);
                    await drawQrWithLogo(qrPayload, file);
                    e.target.value = "";
                  }}
                />
              </label>

              {logoFile && (
                <span className="text-sm text-gray-700">
                  ไฟล์โลโก้ที่เลือก: {logoFile.name}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 🔹 Modal Confirm */}
      {showConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h4 className="font-semibold text-lg text-slate-800">
              ยืนยันการเปลี่ยนโหมด
            </h4>
            <p className="mt-3 text-sm text-gray-600">
              การเปลี่ยนโหมดจะล้างข้อมูล / QR ที่มีอยู่แล้ว
            </p>
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => handleConfirmChange(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 transition"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => handleConfirmChange(true)}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition"
              >
                เปลี่ยนและล้าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
