import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search as SearchIcon, User, ChevronRight, X, FileSearch } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import SessionProgress from '@/components/SessionProgress';
import { api } from '@/utils/api';

interface CustomerItem {
  id: string;
  name: string;
  phone: string;
  medicalRecordNo: string;
  cardCount: number;
}

interface CardItem {
  id: string;
  projectName: string;
  status: 'active' | 'expired' | 'frozen' | 'refunded';
  totalSessions: number;
  usedSessions: number;
  frozenSessions: number;
  remainingSessions: number;
  startDate: string;
  expireDate: string;
}

type SearchField = 'phone' | 'name' | 'medicalRecordNo';

const searchFieldLabels: Record<SearchField, string> = {
  phone: '手机号',
  name: '姓名',
  medicalRecordNo: '病历号',
};

export default function SearchPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialKeyword = searchParams.get('keyword') || '';
  const initialField = (searchParams.get('field') as SearchField) || 'phone';

  const [keyword, setKeyword] = useState(initialKeyword);
  const [field, setField] = useState<SearchField>(initialField);
  const [results, setResults] = useState<CustomerItem[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [cards, setCards] = useState<CardItem[]>([]);
  const [loadingCards, setLoadingCards] = useState(false);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (initialKeyword) {
      doSearch(initialKeyword, initialField);
    }
  }, []);

  const doSearch = useCallback(async (kw: string, f: SearchField) => {
    if (!kw.trim()) return;
    setSearching(true);
    setHasSearched(true);
    setExpandedId(null);
    setCards([]);
    try {
      const data = await api.searchCustomers(kw.trim(), f);
      setResults(Array.isArray(data) ? data : []);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleSearch = useCallback(() => {
    if (!keyword.trim()) return;
    setSearchParams({ keyword: keyword.trim(), field });
    doSearch(keyword, field);
  }, [keyword, field, doSearch, setSearchParams]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  }, [handleSearch]);

  const handleClear = useCallback(() => {
    setKeyword('');
    setResults([]);
    setHasSearched(false);
    setExpandedId(null);
    setCards([]);
    setSearchParams({});
  }, [setSearchParams]);

  const handleFieldChange = useCallback((f: SearchField) => {
    setField(f);
    setExpandedId(null);
    setCards([]);
  }, []);

  const handleExpand = useCallback(async (customerId: string) => {
    if (expandedId === customerId) {
      setExpandedId(null);
      setCards([]);
      return;
    }
    setExpandedId(customerId);
    setLoadingCards(true);
    setCards([]);
    try {
      const data = await api.getCustomerCards(customerId);
      setCards(Array.isArray(data) ? data : []);
    } catch {
      setCards([]);
    } finally {
      setLoadingCards(false);
    }
  }, [expandedId]);

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center gap-3 mb-6">
        <SearchIcon size={24} className="text-roseGold" />
        <h1 className="text-2xl font-serif font-semibold text-softPink">顾客检索</h1>
      </div>

      <div className="glass rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          {(Object.keys(searchFieldLabels) as SearchField[]).map((f) => (
            <button
              key={f}
              onClick={() => handleFieldChange(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                field === f
                  ? 'bg-roseGold text-white'
                  : 'bg-transparent text-softPink/60 border border-softPink/20 hover:border-roseGold/50'
              }`}
            >
              {searchFieldLabels[f]}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <SearchIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-softPink/40" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`输入${searchFieldLabels[field]}搜索...`}
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-softPink placeholder:text-softPink/30 focus:outline-none focus:border-roseGold/50 focus:ring-1 focus:ring-roseGold/30 transition-all"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-6 py-3 rounded-xl bg-roseGold text-white font-medium hover:bg-roseGold/90 transition-colors"
          >
            搜索
          </button>
          {keyword && (
            <button
              onClick={handleClear}
              className="px-4 py-3 rounded-xl border border-softPink/20 text-softPink/60 hover:text-softPink hover:border-roseGold/50 transition-colors"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {searching && (
        <div className="text-center text-softPink/40 py-12">搜索中...</div>
      )}

      {!searching && hasSearched && results.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-softPink/40">
          <FileSearch size={64} className="mb-4 opacity-30" />
          <p className="text-lg mb-1">未找到匹配的顾客</p>
          <p className="text-sm">请尝试更换搜索条件</p>
        </div>
      )}

      {!searching && results.length > 0 && (
        <div className="space-y-4">
          {results.map((customer) => {
            const isExpanded = expandedId === customer.id;
            return (
              <div key={customer.id}>
                <div
                  onClick={() => handleExpand(customer.id)}
                  className="glass rounded-2xl p-5 cursor-pointer hover:bg-white/[0.12] transition-all duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-roseGold/15 flex items-center justify-center shrink-0">
                        <User size={22} className="text-roseGold" />
                      </div>
                      <div>
                        <p className="text-softPink font-medium text-base">{customer.name}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-sm text-softPink/50">{customer.phone}</span>
                          <span className="text-softPink/20">|</span>
                          <span className="text-sm text-softPink/50">{customer.medicalRecordNo}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs bg-roseGold/15 text-roseGold px-3 py-1 rounded-full font-medium">
                        {customer.cardCount}张卡
                      </span>
                      <ChevronRight
                        size={18}
                        className={`text-softPink/30 transition-transform duration-200 ${
                          isExpanded ? 'rotate-90' : ''
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-2 ml-6 space-y-3 animate-slideUp">
                    {loadingCards ? (
                      <div className="glass rounded-xl p-4 text-center text-softPink/40">
                        加载中...
                      </div>
                    ) : cards.length > 0 ? (
                      cards.map((card) => (
                        <div
                          key={card.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/card/${card.id}`);
                          }}
                          className="glass rounded-xl p-4 cursor-pointer hover:bg-white/[0.12] transition-all duration-200"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-softPink font-medium">{card.projectName}</span>
                            <StatusBadge status={card.status} />
                          </div>
                          <SessionProgress
                            total={card.totalSessions}
                            used={card.usedSessions}
                            frozen={card.frozenSessions}
                            remaining={card.remainingSessions}
                          />
                          <div className="mt-2 text-xs text-softPink/40">
                            有效期：{card.startDate} ~ {card.expireDate}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="glass rounded-xl p-4 text-center text-softPink/40">
                        暂无疗程卡
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
