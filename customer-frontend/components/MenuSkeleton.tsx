import React from "react";

export const MenuSkeleton = () => (
    <div className="grid grid-cols-2 gap-4 animate-pulse">
        {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-[32px] p-0 overflow-hidden h-full flex flex-col border border-slate-100">
                <div className="aspect-square bg-slate-100" />
                <div className="p-4 space-y-4">
                    <div className="space-y-2">
                        <div className="h-4 bg-slate-100 rounded-full w-3/4" />
                        <div className="h-4 bg-slate-50 rounded-full w-1/2" />
                    </div>
                    <div className="flex justify-between items-center pt-2">
                        <div className="h-5 bg-slate-100 rounded-full w-1/3" />
                        <div className="h-8 w-8 bg-slate-100 rounded-full" />
                    </div>
                </div>
            </div>
        ))}
    </div>
);

export const CategorySkeleton = () => (
    <div className="flex gap-2 overflow-x-auto pb-4 animate-pulse">
        {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="px-8 py-4 bg-white rounded-full border border-slate-100 min-w-[100px]" />
        ))}
    </div>
);

export const FeaturedSkeleton = () => (
    <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-100 rounded-full w-1/2" />
        <div className="h-[280px] bg-slate-100 rounded-[40px]" />
    </div>
);
