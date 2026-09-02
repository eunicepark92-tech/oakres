import React, { useState } from 'react';
import { Package } from '../../types';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, Sparkles, Tag, ArrowRight, Layers } from 'lucide-react';

interface PackageListProps {
  onSelectPackage: (pkg: Package) => void;
}

export const PackageList: React.FC<PackageListProps> = ({ onSelectPackage }) => {
  const { packages, currentPartner, packageCategories } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Filter packages for this partner (or 'ALL' target packages)
  const isPackageVisibleForPartner = (pkg: Package) => {
    if (!pkg.active) return false;
    if (pkg.partnerCode === 'ALL') return true;
    if (!currentPartner) return true; // Show all when browsing without specific partner
    return (
      pkg.partnerCode.toUpperCase() === currentPartner.code.toUpperCase() ||
      pkg.partnerId === currentPartner.id
    );
  };

  const availablePackages = packages.filter((pkg) => {
    const isPartnerMatch = isPackageVisibleForPartner(pkg);
    const isCategoryMatch = selectedCategory === 'ALL' || pkg.category === selectedCategory;
    return isPartnerMatch && isCategoryMatch;
  });

  // Only display categories that have at least one active package with configured pricing
  const configuredCategories = packageCategories.filter((c) => {
    const matchingPackages = packages.filter((pkg) => {
      const isPartnerMatch = isPackageVisibleForPartner(pkg);
      const isCategoryMatch = pkg.category === c.key;
      return isPartnerMatch && isCategoryMatch;
    });

    if (matchingPackages.length === 0) return false;

    // Must have pricing/rates set up (basePrice > 0)
    return matchingPackages.some((pkg) => pkg.basePrice && pkg.basePrice > 0);
  });

  const filterCategories = [
    { id: 'ALL', label: '전체 패키지' },
    ...configuredCategories.map((c) => ({ id: c.key, label: c.label })),
  ];

  return (
    <div className="space-y-6">
      
      {/* Category Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none py-1 -mx-1 px-1">
        {filterCategories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`min-h-[44px] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer flex items-center justify-center shrink-0 ${
              selectedCategory === cat.id
                ? 'bg-oak-green text-white shadow-md ring-2 ring-oak-green/30'
                : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Package Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {availablePackages.map((pkg) => {
          const discountRate = currentPartner?.discountRate || 30;
          const discountedPrice = Math.round((pkg.basePrice * (100 - discountRate)) / 100);

          return (
            <div
              key={pkg.id}
              className="bg-white rounded-2xl border border-stone-200/90 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between group"
            >
              <div>
                {/* Photo Header with Badge */}
                <div className="relative h-52 sm:h-60 overflow-hidden bg-stone-100">
                  <img
                    src={pkg.imageUrl}
                    alt={pkg.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />

                  {/* Top Left Highlight Badge */}
                  {pkg.highlightBadge && (
                    <div className="absolute top-3 left-3 bg-amber-500 text-stone-950 font-bold text-xs px-3 py-1 rounded-full shadow-md flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 fill-stone-950" />
                      <span>{pkg.highlightBadge}</span>
                    </div>
                  )}

                  {/* Top Right Partner Badge */}
                  <div className="absolute top-3 right-3 bg-oak-dark/90 text-amber-300 font-bold text-[11px] px-2.5 py-1 rounded-lg backdrop-blur-md border border-amber-500/30">
                    {pkg.partnerCode === 'ALL'
                      ? `${currentPartner?.name || '제휴사'} 우대`
                      : `🏢 [${pkg.partnerCode}] 전용`}
                  </div>

                  {/* Package Title Over Image */}
                  <div className="absolute bottom-3 left-4 right-4 text-white">
                    <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider block mb-0.5">
                      {pkg.categoryLabel}
                    </span>
                    <h3 className="text-lg sm:text-xl font-bold leading-snug text-white drop-shadow-sm">
                      {pkg.name}
                    </h3>
                  </div>
                </div>

                {/* Body Details */}
                <div className="p-5 space-y-4">
                  <p className="text-xs text-stone-600 leading-relaxed">
                    {pkg.description}
                  </p>

                  {/* Inclusions Box */}
                  <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200/70 space-y-2">
                    <div className="text-[11px] font-bold text-stone-700 flex items-center gap-1.5 border-b border-stone-200 pb-1.5">
                      <Layers className="w-3.5 h-3.5 text-oak-green" />
                      <span>패키지 특별 포함사항 (Inclusions)</span>
                    </div>
                    <ul className="space-y-1.5">
                      {pkg.inclusions.map((inc, i) => (
                        <li key={i} className="text-xs text-stone-700 flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{inc}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Card Footer: Pricing & Action */}
              <div className="p-5 pt-0 border-t border-stone-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-stone-400 line-through">
                      시중가 {pkg.basePrice.toLocaleString()}원
                    </span>
                    <span className="text-[10px] font-extrabold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                      {discountRate}% OFF
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-xs text-stone-500 font-medium">1박/</span>
                    <span className="text-xl font-extrabold text-oak-dark">
                      {discountedPrice.toLocaleString()}
                    </span>
                    <span className="text-sm font-bold text-stone-800">원~</span>
                  </div>
                </div>

                <button
                  onClick={() => onSelectPackage(pkg)}
                  className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 bg-oak-green hover:bg-oak-dark text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 hover:gap-2.5 cursor-pointer shrink-0 active:scale-98"
                >
                  <span>객실/날짜 선택</span>
                  <ArrowRight className="w-4 h-4 text-oak-gold" />
                </button>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
};
