import { useState, type ComponentType } from 'react'
import { cn } from '@/lib/utils.ts'

export interface TabItem {
    id: string
    label: string
    content: ComponentType<any>
    contentProps?: Record<string, any>
    disabled?: boolean
}

export interface DynamicTabsProps {
    title?: string
    tabs: TabItem[]
    defaultTabId?: string
    className?: string
    headerClassName?: string
    contentClassName?: string
}

export function DynamicTabs({
    tabs,
    defaultTabId,
    contentClassName
}: DynamicTabsProps) {
    const [activeTabId, setActiveTabId] = useState<string>(
        defaultTabId || tabs[0]?.id || ''
    )

    return (
        <div>
            <div className="mb-4 border-b border-gray-200 dark:border-gray-700">
                <ul
                    className="flex flex-wrap -mb-px text-sm font-medium text-center"
                    role="tablist"
                >
                    {tabs.map((tab) => (
                        <li key={tab.id} role="presentation">
                            <button
                                onClick={() => !tab.disabled && setActiveTabId(tab.id)}
                                disabled={tab.disabled}
                                className={cn(
                                    "inline-block px-4 py-2.5 font-semibold border-b-2 rounded-t-lg transition-colors",
                                    activeTabId === tab.id
                                        ? "text-primary-600 border-primary-600 dark:text-primary-400 dark:border-primary-400"
                                        : "text-gray-500 border-transparent hover:text-gray-600 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300",
                                    tab.disabled && "opacity-50 cursor-not-allowed"
                                )}
                                type="button"
                                role="tab"
                                aria-controls={tab.id}
                                aria-selected={activeTabId === tab.id}
                            >
                                {tab.label}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
            <div className={contentClassName}>
                {tabs.map((tab) => {
                    const ContentComponent = tab.content
                    return (
                        <div
                            key={tab.id}
                            id={tab.id}
                            role="tabpanel"
                            aria-labelledby={`${tab.id}-tab`}
                            className={cn(
                                activeTabId === tab.id ? "block" : "hidden"
                            )}
                        >
                            <ContentComponent {...(tab.contentProps || {})} />
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

