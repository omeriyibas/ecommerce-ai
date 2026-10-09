import type { ModalButtonColor } from "@/shared/types/ItemDetail";

// Helper function to get modal button color classes
export const getModalButtonColor = (color?: ModalButtonColor): string => {
    const colorMap: Record<ModalButtonColor, string> = {
        'blue': 'text-blue-500 hover:bg-blue-500 hover:text-white',
        'green': 'text-green-500 hover:bg-green-500 hover:text-white',
        'purple': 'text-purple-500 hover:bg-purple-500 hover:text-white',
        'red': 'text-red-500 hover:bg-red-500 hover:text-white',
        'orange': 'text-orange-500 hover:bg-orange-500 hover:text-white',
        'pink': 'text-pink-500 hover:bg-pink-500 hover:text-white',
        'indigo': 'text-indigo-500 hover:bg-indigo-500 hover:text-white',
        'teal': 'text-teal-500 hover:bg-teal-500 hover:text-white',
        'cyan': 'text-cyan-500 hover:bg-cyan-500 hover:text-white',
        'lime': 'text-lime-500 hover:bg-lime-500 hover:text-white',
        'amber': 'text-amber-500 hover:bg-amber-500 hover:text-white',
        'emerald': 'text-emerald-500 hover:bg-emerald-500 hover:text-white',
        'violet': 'text-violet-500 hover:bg-violet-500 hover:text-white',
        'fuchsia': 'text-fuchsia-500 hover:bg-fuchsia-500 hover:text-white',
        'rose': 'text-rose-500 hover:bg-rose-500 hover:text-white',
        'sky': 'text-sky-500 hover:bg-sky-500 hover:text-white',
        'slate': 'text-slate-500 hover:bg-slate-500 hover:text-white',
        'gray': 'text-gray-500 hover:bg-gray-500 hover:text-white',
        'zinc': 'text-zinc-500 hover:bg-zinc-500 hover:text-white',
        'neutral': 'text-neutral-500 hover:bg-neutral-500 hover:text-white',
        'stone': 'text-stone-500 hover:bg-stone-500 hover:text-white'
    };
    
    return colorMap[color || 'blue'];
};

// Helper function to get badge color classes
export const getBadgeColor = (color?: ModalButtonColor): string => {
    const colorMap: Record<ModalButtonColor, string> = {
        'blue': 'bg-blue-100 text-blue-800',
        'green': 'bg-green-100 text-green-800',
        'purple': 'bg-purple-100 text-purple-800',
        'red': 'bg-red-100 text-red-800',
        'orange': 'bg-orange-100 text-orange-800',
        'pink': 'bg-pink-100 text-pink-800',
        'indigo': 'bg-indigo-100 text-indigo-800',
        'teal': 'bg-teal-100 text-teal-800',
        'cyan': 'bg-cyan-100 text-cyan-800',
        'lime': 'bg-lime-100 text-lime-800',
        'amber': 'bg-amber-100 text-amber-800',
        'emerald': 'bg-emerald-100 text-emerald-800',
        'violet': 'bg-violet-100 text-violet-800',
        'fuchsia': 'bg-fuchsia-100 text-fuchsia-800',
        'rose': 'bg-rose-100 text-rose-800',
        'sky': 'bg-sky-100 text-sky-800',
        'slate': 'bg-slate-100 text-slate-800',
        'gray': 'bg-gray-100 text-gray-800',
        'zinc': 'bg-zinc-100 text-zinc-800',
        'neutral': 'bg-neutral-100 text-neutral-800',
        'stone': 'bg-stone-100 text-stone-800'
    };
    
    return colorMap[color || 'blue'];
};
