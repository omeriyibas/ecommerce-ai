import React, { useEffect, useMemo, useState } from "react";
import DropDownInside, { type NavItem } from "./DropDownInside.tsx";
import {useLocation} from "@tanstack/react-router";
import { twMerge } from "tailwind-merge";

function pathMatchesNav(path: string, pathname: string): boolean {
    if (path.startsWith("#")) return false;
    if (pathname === path) return true;
    if (path.length > 1 && pathname.startsWith(path + "/")) return true;
    return false;
}

export interface NavDropDownProps {
    icon?: React.ComponentType<{ className?: string }>;
    label: string;
    path: string;
    subs?: NavItem[];
}

const NavDropDown: React.FC<NavDropDownProps> = ({ icon: Icon, label, path, subs = [] }) => {
    const { pathname } = useLocation();

    const groupActive = useMemo(() => {
        if (subs.length > 0) {
            return subs.some((s) => pathMatchesNav(s.path, pathname));
        }
        return pathMatchesNav(path, pathname);
    }, [subs, path, pathname]);

    const [open, setOpen] = useState<boolean>(groupActive);

    useEffect(() => {
        if (groupActive) setOpen(true);
    }, [pathname, groupActive]);

    return (
        <li className="relative">
            <button
                onClick={() => setOpen((v) => !v)}
                className={twMerge(
                    "text-white cursor-pointer flex items-center w-full px-4 py-3 rounded-xl transition hover:bg-white/15",
                    groupActive && "bg-white/15"
                )}
            >
                {Icon && <Icon className={"text-white"} />}
                <span className={"ml-2"}>{label}</span>
                <svg
                    className={`ml-auto w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="white"
                    viewBox="0 0 24 24"
                >
                    <path d="M6 9l6 6 6-6" strokeWidth="2" strokeLinecap="round"
                          strokeLinejoin="round" />
                </svg>
            </button>
            {open && subs.map((sub, idx) => (
                <DropDownInside
                    key={`${sub.path}-${idx}`}
                    icon={sub.icon}
                    label={sub.label}
                    path={sub.path}
                    subs={sub.subs}
                />
            ))}
        </li>
    );
};

export default NavDropDown;


