import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { MessageSquare, Send, CheckCircle2, Phone, Bell, Search, Sparkles } from 'lucide-react';

export const NotificationCenter: React.FC = () => {
  const { notificationLogs, reservations, sendNotification } = useApp();

  const [selectedResId, setSelectedResId] = useState<string>(reservations[0]?.id || '');
  const [channel, setChannel] = useState<'KAKAO_ALIMTALK' | 'SMS'>('KAKAO_ALIMTALK');
  const [notifType, setNotifType] = useState<'BOOKING_CONFIRMED' | 'REMINDER_CHECKIN' | 'CANCELLATION'>('REMINDER_CHECKIN');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResId) return;
    sendNotification(selectedResId, notifType, channel);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-stone-900 flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-oak-green" />
            <span>고객 알림 전송 센터 (KakaoTalk Alimtalk & SMS)</span>
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            예약 완료, 체크인 1일 전 리마인더, 취소 안내 등 자동/수동 알림발송 내역을 관리합니다.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Manual Trigger Form */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-4">
          <h3 className="text-base font-bold text-stone-900 flex items-center gap-2 border-b pb-3">
            <Send className="w-5 h-5 text-oak-green" />
            <span>수동 알림톡 / SMS 즉시 발송</span>
          </h3>

          <form onSubmit={handleSend} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                수신 예약자 선택
              </label>
              <select
                value={selectedResId}
                onChange={(e) => setSelectedResId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:outline-none"
              >
                {reservations.map((r) => (
                  <option key={r.id} value={r.id}>
                    [{r.id}] {r.bookerName}님 ({r.bookerPhone}) - {r.roomTypeName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">발송 채널</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setChannel('KAKAO_ALIMTALK')}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    channel === 'KAKAO_ALIMTALK'
                      ? 'bg-amber-400 text-amber-950 border-amber-500 shadow-sm'
                      : 'bg-stone-50 text-stone-600 border-stone-200'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>카카오 알림톡</span>
                </button>

                <button
                  type="button"
                  onClick={() => setChannel('SMS')}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    channel === 'SMS'
                      ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
                      : 'bg-stone-50 text-stone-600 border-stone-200'
                  }`}
                >
                  <Phone className="w-4 h-4" />
                  <span>문자 (SMS)</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">알림 템플릿 유형</label>
              <select
                value={notifType}
                onChange={(e) => setNotifType(e.target.value as any)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold"
              >
                <option value="REMINDER_CHECKIN">입실 1일 전 체크인 안내 템플릿</option>
                <option value="BOOKING_CONFIRMED">예약 확정 안내 템플릿</option>
                <option value="CANCELLATION">예약 취소 및 오픈카드 해제 템플릿</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-oak-green hover:bg-oak-dark text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-oak-gold" />
              <span>알림 메시지 전송하기</span>
            </button>
          </form>
        </div>

        {/* Right: Logs List */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-4">
          <h3 className="text-base font-bold text-stone-900 border-b pb-3 flex items-center justify-between">
            <span>발송 내역 로그 ({notificationLogs.length}건)</span>
            <span className="text-xs font-medium text-stone-500">실시간 동기화</span>
          </h3>

          <div className="space-y-3">
            {notificationLogs.map((log) => (
              <div
                key={log.id}
                className="bg-stone-50 p-4 rounded-xl border border-stone-200/80 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between border-b pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-stone-900">{log.recipientName}</span>
                    <span className="text-stone-500">({log.recipientPhone})</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      log.channel === 'KAKAO_ALIMTALK' ? 'bg-amber-400/20 text-amber-900 border border-amber-300' : 'bg-stone-200 text-stone-800'
                    }`}>
                      {log.channel === 'KAKAO_ALIMTALK' ? '알림톡' : 'SMS'}
                    </span>
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      발송성공
                    </span>
                  </div>
                </div>

                <p className="text-stone-700 font-medium whitespace-pre-line leading-relaxed bg-white p-3 rounded-lg border border-stone-200">
                  {log.content}
                </p>

                <div className="text-[10px] text-stone-400 text-right">
                  발송시각: {new Date(log.sentAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
