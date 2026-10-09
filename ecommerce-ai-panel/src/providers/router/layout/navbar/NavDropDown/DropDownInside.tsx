import React from "react";
import NavDropDown from "./NavDropDown.tsx";
import { twMerge } from "tailwind-merge";
import {Link, useLocation} from "@tanstack/react-router";
import {DEFAULT_PATHS} from "@/shared/config/paths.ts";

export interface NavItem {
    icon?: React.ComponentType<{ className?: string }>;
    label: string;
    path: string;
    subs?: NavItem[];
}

export interface DropDownInsideProps {
    icon?: React.ComponentType<{ className?: string }>;
    label: string;
    path: string;
    subs?: NavItem[];
}

const DropDownInside: React.FC<DropDownInsideProps> = ({ icon: Icon, label, path, subs }) => {

    const { pathname } = useLocation();

    const isActive = path.startsWith('#') ? false : pathname === path || pathname.indexOf(`${path}`) > -1 && path !== DEFAULT_PATHS.APP;


    if (subs) {
        return (
            <ul>
                <div className={"ml-5 mt-1"}>
                    <NavDropDown icon={Icon} label={label} path={path} subs={subs} />
                </div>
            </ul>
        );
    } else {
        return (
            <li className="ml-5 mt-1">
                <Link
                    to={path}
                    className={twMerge(
                        "text-white cursor-pointer flex items-center w-full px-4 py-3 rounded-xl transition hover:bg-white/15",
                        isActive && "bg-secondary/90 text-white shadow-sm",
                    )}
                >
                    {Icon && <Icon className={twMerge("text-white", isActive && "text-white")} />}
                    <span className={"ml-2"}>{label}</span>
                </Link>
            </li>
        );
    }
};

export default DropDownInside;


