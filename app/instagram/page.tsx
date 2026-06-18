'use client';

import { useEffect, useState, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { IgInsights } from '@/app/api/instagram/insights/route';

interface IgPost {
  postId: string;
  permalink: string;
  caption: string;
  topic: string;
  uploadedAt: string;
  cardCount: number;
}

interface PostWithInsights extends IgPost {
  insights?: IgInsights;
  loading?: boolean;
  error?: string;
}

export default function InstagramPage() {
  const [posts, setPosts] = useState<PostWithInsights[]>([]);

  // 토큰 갱신
  const [refreshing, setRefreshing] = useState(false);
  const [refreshResult, setRefreshResult] = useState<{ newToken?: string; expiresAt?: string; error?: string } | null>(null);

  async function refreshToken() {
    setRefreshing(true);
    setRefreshResult(null);
    try {
      const res = await fetch('/api/instagram/refresh-token', { method: 'POST' });
      const data = await res.json() as { newToken?: string; expiresAt?: string; error?: string };
      setRefreshResult(data);
    } finally {
      setRefreshing(false);
    }
  }

  const loadPosts = useCallback(() => {
    const stored: IgPost[] = JSON.parse(localStorage.getItem('eficar-ig-posts') ?? '[]');
    setPosts(stored.map(p => ({ ...p, loading: true })));

    stored.forEach(async (post, i) => {
      try {
        const res = await fetch(`/api/instagram/insights?mediaId=${post.postId}`);
        const data: IgInsights | { error: string } = await res.json();
        setPosts(prev => prev.map((p, idx) =>
          idx === i
            ? { ...p, loading: false, insights: res.ok ? (data as IgInsights) : undefined, error: !res.ok ? (data as { error: string }).error : undefined }
            : p
        ));
      } catch {
        setPosts(prev => prev.map((p, idx) =>
          idx === i ? { ...p, loading: false, error: '조회 실패' } : p
        ));
      }
    });
  }, []);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  const removePost = (postId: string) => {
    const stored: IgPost[] = JSON.parse(localStorage.getItem('eficar-ig-posts') ?? '[]');
    const filtered = stored.filter(p => p.postId !== postId);
    localStorage.setItem('eficar-ig-posts', JSON.stringify(filtered));
    setPosts(prev => prev.filter(p => p.postId !== postId));
  };

  const chartData = posts
    .filter(p => p.insights)
    .map(p => ({
      topic: p.topic.slice(0, 10),
      impressions: p.insights!.impressions,
      reach: p.insights!.reach,
      likes: p.insights!.likes,
      saved: p.insights!.saved,
    }));

  const best = posts
    .filter(p => p.insights)
    .sort((a, b) => (b.insights!.impressions) - (a.insights!.impressions))[0];

  const totalImpressions = posts.reduce((s, p) => s + (p.insights?.impressions ?? 0), 0);
  const totalLikes       = posts.reduce((s, p) => s + (p.insights?.likes ?? 0), 0);
  const totalSaved       = posts.reduce((s, p) => s + (p.insights?.saved ?? 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737] flex items-center justify-center">
              <span className="text-white font-black text-sm">IG</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-none">인스타그램 성과</h1>
              <p className="text-xs text-gray-500 mt-0.5">업로드된 카드뉴스 인사이트</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadPosts}
              className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold transition-colors"
            >
              새로고침
            </button>
            <button
              onClick={refreshToken}
              disabled={refreshing}
              className="text-xs px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              {refreshing && <span className="inline-block w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />}
              {refreshing ? '갱신 중...' : '🔑 토큰 갱신'}
            </button>
          </div>

          {/* 토큰 갱신 결과 */}
          {refreshResult && (
            <div className={`mt-3 p-3 rounded-xl text-xs border ${refreshResult.error ? 'bg-red-50 border-red-200 text-red-700' : 'bg-blue-50 border-blue-200 text-blue-800'}`}>
              {refreshResult.error ? (
                <p>❌ {refreshResult.error}</p>
              ) : (
                <>
                  <p className="font-bold mb-1">✅ 토큰 갱신 완료 · 만료: {refreshResult.expiresAt}</p>
                  <p className="text-xs text-blue-600 mb-1">.env.local의 EFICAR_IG_ACCESS_TOKEN을 아래 값으로 교체하세요</p>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 bg-white border border-blue-200 rounded px-2 py-1 break-all font-mono text-xs">{refreshResult.newToken}</code>
                    <button
                      onClick={() => navigator.clipboard.writeText(refreshResult.newToken ?? '')}
                      className="px-2 py-1 rounded bg-blue-600 text-white font-semibold whitespace-nowrap hover:bg-blue-700 transition-colors"
                    >
                      복사
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">

        {posts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
            <p className="text-4xl mb-3">📸</p>
            <p className="text-gray-600 font-semibold mb-1">업로드된 게시물이 없습니다</p>
            <p className="text-sm text-gray-400">카드뉴스 페이지에서 인스타 업로드를 해보세요</p>
          </div>
        ) : (
          <>
            {/* KPI 요약 */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: '총 게시물', value: posts.length, unit: '개', color: 'from-[#833AB4] to-[#FD1D1D]' },
                { label: '총 노출수', value: totalImpressions.toLocaleString(), unit: '', color: 'from-blue-500 to-blue-600' },
                { label: '총 좋아요', value: totalLikes.toLocaleString(), unit: '', color: 'from-rose-500 to-pink-500' },
                { label: '총 저장', value: totalSaved.toLocaleString(), unit: '', color: 'from-emerald-500 to-teal-600' },
              ].map(({ label, value, unit, color }) => (
                <div key={label} className="bg-white rounded-2xl border border-gray-100 p-5">
                  <p className="text-xs font-semibold text-gray-500 mb-2">{label}</p>
                  <p className={`text-2xl font-black bg-gradient-to-r ${color} bg-clip-text text-transparent`}>
                    {value}{unit}
                  </p>
                </div>
              ))}
            </div>

            {/* 베스트 게시물 */}
            {best && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">가장 반응 좋은 게시물</p>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737] flex items-center justify-center text-white font-black text-lg">🏆</div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900">{best.topic}</p>
                    <p className="text-xs text-gray-500">{new Date(best.uploadedAt).toLocaleDateString('ko-KR')} · {best.cardCount}장</p>
                  </div>
                  <div className="flex gap-4 text-center">
                    <div><p className="text-lg font-black text-blue-600">{best.insights!.impressions.toLocaleString()}</p><p className="text-xs text-gray-500">노출</p></div>
                    <div><p className="text-lg font-black text-rose-600">{best.insights!.likes.toLocaleString()}</p><p className="text-xs text-gray-500">좋아요</p></div>
                    <div><p className="text-lg font-black text-emerald-600">{best.insights!.saved.toLocaleString()}</p><p className="text-xs text-gray-500">저장</p></div>
                  </div>
                  <a href={best.permalink} target="_blank" rel="noreferrer"
                    className="text-xs px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold transition-colors whitespace-nowrap">
                    보기 →
                  </a>
                </div>
              </div>
            )}

            {/* 성과 차트 */}
            {chartData.length > 1 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <p className="text-sm font-bold text-gray-800 mb-4">게시물별 노출수 추이</p>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData} barSize={28}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F2F4F6" />
                    <XAxis dataKey="topic" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: number) => v.toLocaleString()} />
                    <Bar dataKey="impressions" name="노출" fill="#833AB4" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="likes" name="좋아요" fill="#FD1D1D" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="saved" name="저장" fill="#059669" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* 게시물 목록 */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <p className="text-sm font-bold text-gray-800">게시물 목록</p>
              </div>
              <div className="divide-y divide-gray-50">
                {posts.map(post => (
                  <div key={post.postId} className="px-5 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737] flex items-center justify-center text-white font-black text-xs flex-shrink-0">
                      {post.cardCount}장
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">{post.topic}</p>
                      <p className="text-xs text-gray-400">{new Date(post.uploadedAt).toLocaleString('ko-KR')}</p>
                    </div>

                    {post.loading ? (
                      <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <span className="inline-block w-3 h-3 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                        인사이트 로딩 중
                      </div>
                    ) : post.error ? (
                      <span className="text-xs text-gray-400">{post.error}</span>
                    ) : post.insights ? (
                      <div className="flex gap-4 text-center">
                        <div><p className="text-sm font-bold text-blue-600">{post.insights.impressions.toLocaleString()}</p><p className="text-xs text-gray-400">노출</p></div>
                        <div><p className="text-sm font-bold text-[#005957]">{post.insights.reach.toLocaleString()}</p><p className="text-xs text-gray-400">도달</p></div>
                        <div><p className="text-sm font-bold text-rose-600">{post.insights.likes.toLocaleString()}</p><p className="text-xs text-gray-400">좋아요</p></div>
                        <div><p className="text-sm font-bold text-emerald-600">{post.insights.saved.toLocaleString()}</p><p className="text-xs text-gray-400">저장</p></div>
                        <div><p className="text-sm font-bold text-gray-600">{post.insights.comments.toLocaleString()}</p><p className="text-xs text-gray-400">댓글</p></div>
                      </div>
                    ) : null}

                    <a href={post.permalink} target="_blank" rel="noreferrer"
                      className="text-xs px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold transition-colors flex-shrink-0">
                      보기
                    </a>
                    <button
                      onClick={() => removePost(post.postId)}
                      className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0 text-lg leading-none"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
