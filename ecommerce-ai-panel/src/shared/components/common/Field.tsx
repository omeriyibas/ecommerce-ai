interface FieldProps {
    label: string;
    text?: string;
    children?: React.ReactNode;
    className?: string;
    showBadge?: boolean;
    badgeColor?: string;
}

export default function Field({ label, text, children, className = "", showBadge = false, badgeColor = "" }: FieldProps) {
    const content = text || children;
    
    return (
        <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">{label}</label>
            <div className={`w-full rounded-md px-3 py-2 text-sm text-gray-900 shadow-sm ${className}`}>
                {showBadge ? (
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${badgeColor}`}>
                        {content}
                    </span>
                ) : (
                    content
                )}
            </div>
        </div>
    );
}
