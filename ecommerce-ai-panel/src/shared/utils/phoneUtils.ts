export const formatPhoneNumber = (phone?: string | null): string => {
    if (!phone) return "-";
    
    const cleaned = phone.replace(/\D/g, "");
    
    if (cleaned.length === 10) {
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)} ${cleaned.slice(6, 8)} ${cleaned.slice(8, 10)}`;
    }
    
    if (cleaned.length === 11 && cleaned.startsWith("0")) {
        const withoutZero = cleaned.slice(1);
        return `(${withoutZero.slice(0, 3)}) ${withoutZero.slice(3, 6)} ${withoutZero.slice(6, 8)} ${withoutZero.slice(8, 10)}`;
    }
    
    return phone;
};

