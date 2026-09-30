import React, { useState } from 'react';
import { X, Cloud, RefreshCw, Smartphone, Laptop, Check, Copy, KeyRound, AlertCircle, ShieldCheck } from 'lucide-react';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  syncCode: string | null;
  onConnectSync: (code: string) => Promise<boolean>;
  onDisconnectSync: () => void;
  onManualSync: () => Promise<void>;
  isSyncing: boolean;
  lastSyncedAt: number | null;
  vocabCount: number;
  historyCount: number;
}

export const SyncModal: React.FC<SyncModalProps> = ({
  isOpen,
  onClose,
  syncCode,
  onConnectSync,
  onDisconnectSync,
  onManualSync,
  isSyncing,
  lastSyncedAt,
  vocabCount,
  historyCount,
}) => {
  const [inputCode, setInputCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Generate a random 6-character clean memorable code (e.g. prep-7x9k)
  const handleGenerateRandomCode = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
    let code = 'prep-';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setInputCode(code);
    setErrorMessage(null);
  };

  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = inputCode.trim();
    if (!clean) {
      setErrorMessage('请输入专属同步暗号或生成一个');
      return;
    }
    if (clean.length < 3) {
      setErrorMessage('同步暗号至少需要 3 个字符');
      return;
    }
    setErrorMessage(null);
    const success = await onConnectSync(clean);
    if (!success) {
      setErrorMessage('连接同步失败，请检查网络或稍后重试');
    }
  };

  const formatLastSync = (timestamp: number | null) => {
    if (!timestamp) return '尚未同步';
    const diff = Date.now() - timestamp;
    if (diff < 15000) return '刚刚';
    if (diff < 60000) return `${Math.floor(diff / 1000)} 秒前`;
    if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
    const date = new Date(timestamp);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-md liquid-glass text-zinc-900 rounded-3xl border border-white/80 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-200/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-2xl flex items-center justify-center ${syncCode ? 'bg-emerald-500/10 text-emerald-600' : 'bg-black text-white'}`}>
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-zinc-950 flex items-center gap-1.5">
                跨设备数据云同步
                {syncCode && (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
                    已连接
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-zinc-500">
                手机与电脑无缝互通生词本与打卡记录
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-black/5 text-zinc-400 hover:text-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          {syncCode ? (
            /* Connected state */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-white/70 border border-emerald-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 text-[11px]">当前设备同步暗号</span>
                  <button
                    onClick={() => handleCopyCode(syncCode)}
                    className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-900"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? '已复制' : '复制暗号'}</span>
                  </button>
                </div>
                <div className="flex items-center justify-between bg-zinc-900 text-white px-3.5 py-2.5 rounded-xl font-mono text-sm tracking-wider">
                  <span>{syncCode}</span>
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                  <div className="p-2 rounded-xl bg-zinc-50 border border-zinc-100">
                    <span className="text-zinc-400 block">云端生词</span>
                    <span className="font-bold text-zinc-900 text-xs">{vocabCount} 个</span>
                  </div>
                  <div className="p-2 rounded-xl bg-zinc-50 border border-zinc-100">
                    <span className="text-zinc-400 block">练习打卡</span>
                    <span className="font-bold text-zinc-900 text-xs">{historyCount} 次</span>
                  </div>
                </div>
                <div className="text-[11px] text-zinc-400 flex items-center justify-between pt-1 border-t border-zinc-100">
                  <span>最后同步：{formatLastSync(lastSyncedAt)}</span>
                  <span className="flex items-center gap-1 text-emerald-600 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    变动自动静默同步
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={onManualSync}
                  disabled={isSyncing}
                  className="w-full py-2.5 px-4 bg-black text-white hover:bg-zinc-800 disabled:opacity-60 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98]"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? '正在同步数据...' : '立即手动同步一次'}</span>
                </button>

                <button
                  type="button"
                  onClick={onDisconnectSync}
                  className="w-full py-2 px-4 text-zinc-500 hover:text-red-600 hover:bg-red-50/60 rounded-xl font-medium transition-all"
                >
                  断开此设备同步（保留本地数据）
                </button>
              </div>

              {/* Pairing Tip */}
              <div className="p-3.5 rounded-2xl bg-zinc-50/80 border border-zinc-200/60 space-y-1.5 text-[11px] text-zinc-600">
                <div className="font-semibold text-zinc-900 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-zinc-700" />
                  <span>如何在手机上同步？</span>
                </div>
                <p>
                  手机打开网站后，点击顶部<strong>「同步」</strong>图标，输入暗号 <code className="bg-zinc-200 px-1 py-0.5 rounded font-mono text-zinc-900 font-bold">{syncCode}</code> 并点击连接，两台设备就会自动双向打通！
                </p>
              </div>
            </div>
          ) : (
            /* Unconnected state: input custom code or generate random */
            <form onSubmit={handleConnect} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-zinc-50/80 border border-zinc-200/60 space-y-2 text-[11px] text-zinc-600">
                <div className="font-semibold text-zinc-900 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-zinc-700" />
                  <span>什么是专属同步暗号？</span>
                </div>
                <p className="leading-relaxed">
                  无需注册账号或输入密码！只需设定一个你容易记住的自定义暗号（例如 <code className="bg-zinc-200/80 px-1 py-0.5 rounded text-zinc-900 font-mono">jayan888</code>），在你的 Mac 和手机上输入相同暗号，生词与练习记录即可实时互通。
                </p>
              </div>

              <div className="space-y-2">
                <label className="block font-semibold text-zinc-800 text-[11px]">
                  输入或生成你的专属暗号
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={inputCode}
                    onChange={(e) => {
                      setInputCode(e.target.value);
                      setErrorMessage(null);
                    }}
                    placeholder="例如：jayan888"
                    className="w-full px-3.5 py-2.5 bg-white border border-zinc-200 rounded-xl text-xs font-mono placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-black/10 focus:border-black transition-all"
                  />
                  <button
                    type="button"
                    onClick={handleGenerateRandomCode}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 text-[10px] font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg transition-colors"
                  >
                    随机生成
                  </button>
                </div>

                {errorMessage && (
                  <p className="text-[11px] text-red-600 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>{errorMessage}</span>
                  </p>
                )}
              </div>

              {/* Cross devices icon hint */}
              <div className="flex items-center justify-around py-3 px-4 rounded-2xl bg-white/60 border border-zinc-100 text-zinc-600 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <Laptop className="w-4 h-4 text-zinc-800" />
                  <span>Mac / PC 电脑</span>
                </div>
                <span className="text-zinc-300 font-mono">⇄</span>
                <div className="flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-zinc-800" />
                  <span>手机 / iPad</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSyncing}
                className="w-full py-2.5 px-4 bg-black text-white hover:bg-zinc-800 disabled:opacity-60 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98]"
              >
                <Cloud className="w-3.5 h-3.5" />
                <span>{isSyncing ? '正在连接并同步...' : '立即连接并同步数据'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
