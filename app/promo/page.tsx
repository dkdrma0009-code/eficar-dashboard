'use client';

import { useState, useMemo } from 'react';

const CUSTOMER_OPTIONS = ['SK렌터카', '롯데렌탈', '그린카', '삼성화재', 'KB캐피탈', '직접 입력'];
const PART_OPTIONS = [
  '시트 에어백 터짐',
  '헤드램프 파손',
  '휠 파손',
  '범퍼 파손',
  '도어 파손',
  '직접 입력',
];
const GIFT_OPTIONS = ['GS25', 'CU', '이마트', '스타벅스', '현금', '직접 입력'];
const AMOUNT_OPTIONS = ['10,000', '20,000', '30,000', '50,000', '100,000'];

function buildLms(params: {
  customer: string;
  part: string;
  gift: string;
  amount: string;
  startDate: string;
  extra: string;
}): string {
  const { customer, part, gift, amount, startDate, extra } = params;
  const amountFmt = Number(amount.replace(/,/g, '')).toLocaleString('ko-KR');
  const today = startDate || new Date().toISOString().slice(2, 10).replace(/-/g, '.');

  return `[${customer} 협력 정비소 안내]
안녕하세요,
${customer} 협력 정비소 담당자님!

1. 담당자님을 위한 '무제한' 증정 이벤트
■ 혜택: 에픽카 '${part} 수리 시' 1건당
☞ ${gift} ${amountFmt}원권 ☜ 100% 증정
■ 한도: 제한 없음
■ 지급: 부품 사용 확인 후 익일 즉시 발송
${extra ? `\n■ 참고: ${extra}` : ''}
2. 참여 방법 (아주 간단합니다!)
아래 번호를 통해 에픽카로 ${customer} 차량 수리 요청하시면 됩니다.
☏빠른 전화/문자: 010-2752-1054
＠카카오톡 채널 [에픽카_정비소]: https://pf.kakao.com/_kXxkPG
☞ 이벤트 기간: ${today}~별도 공지 시
☞ 프로모션은 사전 공지 없이 조기 종료될 수 있습니다.
업무로 바쁘신 와중에도 협조해 주셔서 감사합니다.
오늘 하루도 안전하고 활기찬 하루 보내세요!`.trim();
}

export default function PromoPage() {
  const [customer, setCustomer] = useState('SK렌터카');
  const [customCustomer, setCustomCustomer] = useState('');
  const [part, setPart] = useState('시트 에어백 터짐');
  const [customPart, setCustomPart] = useState('');
  const [gift, setGift] = useState('GS25');
  const [customGift, setCustomGift] = useState('');
  const [amount, setAmount] = useState('50,000');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(2, 10).replace(/-/g, '.'));
  const [extra, setExtra] = useState('');

  const [phone, setPhone] = useState('');
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState('');

  const [bulkNumbers, setBulkNumbers] = useState<string>('');
  const [bulkSending, setBulkSending] = useState(false);
  const [bulkResult, setBulkResult] = useState('');

  const finalCustomer = customer === '직접 입력' ? customCustomer : customer;
  const finalPart = part === '직접 입력' ? customPart : part;
  const finalGift = gift === '직접 입력' ? customGift : gift;

  const lms = useMemo(() => buildLms({
    customer: finalCustomer,
    part: finalPart,
    gift: finalGift,
    amount,
    startDate,
    extra,
  }), [finalCustomer, finalPart, finalGift, amount, startDate, extra]);

  const charCount = lms.length;
  const byteCount = new TextEncoder().encode(lms).length;

  async function sendSingle() {
    if (!phone.trim() || !finalCustomer || !finalPart) return;
    setSending(true);
    setFeedback('');
    try {
      const res = await fetch('/api/popbill/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiver: phone.trim().replace(/-/g, ''),
          receiverName: '정비소 담당자',
          subject: `[${finalCustomer}] 에픽카 이벤트 안내`,
          content: lms,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error ?? '발송 실패');
      setFeedback(`✅ ${data.msgType} 발송 완료 (접수번호: ${data.receiptNum})`);
    } catch (e) {
      setFeedback(`❌ ${e instanceof Error ? e.message : '발송 실패'}`);
    } finally {
      setSending(false);
    }
  }

  async function sendBulk() {
    const numbers = bulkNumbers.split(/[\n,]/).map(n => n.trim().replace(/-/g, '')).filter(n => n.length >= 10);
    if (!numbers.length) { setBulkResult('수신번호를 입력해주세요.'); return; }
    setBulkSending(true);
    setBulkResult(`0/${numbers.length} 발송 중...`);
    let success = 0, fail = 0;
    for (const num of numbers) {
      try {
        const res = await fetch('/api/popbill/sms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            receiver: num,
            subject: `[${finalCustomer}] 에픽카 이벤트 안내`,
            content: lms,
          }),
        });
        const data = await res.json();
        if (!res.ok || data.error) throw new Error(data.error);
        success++;
      } catch {
        fail++;
      }
      setBulkResult(`${success + fail}/${numbers.length} 처리 중... (성공 ${success} / 실패 ${fail})`);
      await new Promise(r => setTimeout(r, 300));
    }
    setBulkResult(`✅ 완료: 성공 ${success}건 / 실패 ${fail}건`);
    setBulkSending(false);
  }

  const FIELD_CLS = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#005957] bg-white';
  const SELECT_CLS = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#005957] bg-white';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#005957] flex items-center justify-center">
            <span className="text-white font-black text-base">📣</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-none">정비소 프로모션 문자</h1>
            <p className="text-xs text-gray-500 mt-0.5">협력 정비소 대상 이벤트 LMS 생성 · 발송</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 flex gap-6">
        {/* 왼쪽: 입력 폼 */}
        <div className="w-80 shrink-0 space-y-4">
          {/* 고객사 */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
            <p className="text-sm font-bold text-gray-800">이벤트 정보</p>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">고객사</label>
              <select value={customer} onChange={e => setCustomer(e.target.value)} className={SELECT_CLS}>
                {CUSTOMER_OPTIONS.map(o => <option key={o}>{o}</option>)}
              </select>
              {customer === '직접 입력' && (
                <input className={`${FIELD_CLS} mt-2`} value={customCustomer}
                  onChange={e => setCustomCustomer(e.target.value)} placeholder="고객사명 입력" />
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">부품 · 수리 조건</label>
              <select value={part} onChange={e => setPart(e.target.value)} className={SELECT_CLS}>
                {PART_OPTIONS.map(o => <option key={o}>{o}</option>)}
              </select>
              {part === '직접 입력' && (
                <input className={`${FIELD_CLS} mt-2`} value={customPart}
                  onChange={e => setCustomPart(e.target.value)} placeholder="예: 도어 판넬 교환" />
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">증정품</label>
              <select value={gift} onChange={e => setGift(e.target.value)} className={SELECT_CLS}>
                {GIFT_OPTIONS.map(o => <option key={o}>{o}</option>)}
              </select>
              {gift === '직접 입력' && (
                <input className={`${FIELD_CLS} mt-2`} value={customGift}
                  onChange={e => setCustomGift(e.target.value)} placeholder="예: 이마트, 현금" />
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">증정 금액 (원)</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {AMOUNT_OPTIONS.map(a => (
                  <button key={a} onClick={() => setAmount(a)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${amount === a ? 'bg-[#005957] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    {a}원
                  </button>
                ))}
              </div>
              <input className={FIELD_CLS} value={amount}
                onChange={e => setAmount(e.target.value)} placeholder="직접 입력" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">이벤트 시작일</label>
              <input type="text" className={FIELD_CLS} value={startDate}
                onChange={e => setStartDate(e.target.value)} placeholder="26.05.19" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">추가 참고사항 <span className="text-gray-400 font-normal">(선택)</span></label>
              <input className={FIELD_CLS} value={extra}
                onChange={e => setExtra(e.target.value)} placeholder="예: 차량 1대당 1회 한정" />
            </div>
          </div>

          {/* 단건 발송 */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
            <p className="text-sm font-bold text-gray-800">단건 발송</p>
            <div className="flex gap-2">
              <input type="tel" className={`${FIELD_CLS} flex-1`} value={phone}
                onChange={e => setPhone(e.target.value)} placeholder="010-0000-0000" />
              <button onClick={sendSingle} disabled={sending || !phone || !finalCustomer || !finalPart}
                className="px-4 py-2 rounded-xl bg-[#005957] text-white text-sm font-bold disabled:opacity-40 hover:bg-[#004745] transition-colors whitespace-nowrap">
                {sending ? '발송 중...' : '발송'}
              </button>
            </div>
            {feedback && (
              <p className={`text-xs font-semibold ${feedback.startsWith('✅') ? 'text-green-600' : 'text-red-600'}`}>{feedback}</p>
            )}
          </div>

          {/* 대량 발송 */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
            <p className="text-sm font-bold text-gray-800">대량 발송</p>
            <textarea className={`${FIELD_CLS} resize-none`} rows={5} value={bulkNumbers}
              onChange={e => setBulkNumbers(e.target.value)}
              placeholder={'수신번호 목록 (줄바꿈 또는 쉼표 구분)\n010-1234-5678\n010-9876-5432'} />
            <button onClick={sendBulk} disabled={bulkSending || !finalCustomer || !finalPart}
              className="w-full py-2.5 rounded-xl bg-[#191F28] text-white text-sm font-bold disabled:opacity-40 hover:bg-[#2D3748] transition-colors">
              {bulkSending ? '발송 중...' : `전체 발송`}
            </button>
            {bulkResult && (
              <p className={`text-xs font-semibold ${bulkResult.startsWith('✅') ? 'text-green-600' : 'text-gray-600'}`}>{bulkResult}</p>
            )}
          </div>
        </div>

        {/* 오른쪽: 미리보기 */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 h-full">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-gray-800">LMS 미리보기</span>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${charCount <= 300 ? 'bg-green-100 text-green-700' : charCount <= 1000 ? 'bg-yellow-100 text-yellow-700' : 'bg-orange-100 text-orange-700'}`}>
                  {charCount}자 ({byteCount}bytes)
                </span>
              </div>
              <button onClick={() => navigator.clipboard.writeText(lms)}
                className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold transition-colors">
                복사
              </button>
            </div>

            {/* 폰 목업 스타일 미리보기 */}
            <div className="flex justify-center">
              <div style={{ width: 320, background: '#f5f5f5', borderRadius: 24, padding: '24px 12px', boxShadow: '0 4px 24px rgba(0,0,0,0.1)' }}>
                <div style={{ background: '#fff', borderRadius: 16, padding: '16px 14px', minHeight: 400 }}>
                  <div style={{ fontSize: 11, color: '#8B95A1', textAlign: 'center', marginBottom: 12, fontWeight: 600 }}>
                    에픽카 (010-2752-1054)
                  </div>
                  <div style={{ background: '#E8F5F2', borderRadius: '4px 14px 14px 14px', padding: '12px 14px', fontSize: 13, color: '#191F28', lineHeight: 1.65, whiteSpace: 'pre-wrap', fontFamily: 'Apple SD Gothic Neo, Malgun Gothic, sans-serif' }}>
                    {lms}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
