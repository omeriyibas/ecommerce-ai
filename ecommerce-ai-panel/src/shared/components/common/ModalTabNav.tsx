import { AppButton } from "@/shared/components/common/AppButton.tsx"

export type ModalTabItem<T extends string> = {
  id: T
  label: string
  hidden?: boolean
}

export interface ModalTabNavProps<T extends string> {
  tabs: ModalTabItem<T>[]
  activeTab: T
  onTabChange: (tab: T) => void
}

export default function ModalTabNav<T extends string>({
  tabs,
  activeTab,
  onTabChange,
}: ModalTabNavProps<T>) {
  return (
    <div className="flex shrink-0 flex-wrap gap-2">
      {tabs
        .filter((item) => !item.hidden)
        .map((item) => (
          <AppButton
            key={item.id}
            type="button"
            size="sm"
            variant={activeTab === item.id ? "secondary" : "outline"}
            onClick={() => onTabChange(item.id)}
          >
            {item.label}
          </AppButton>
        ))}
    </div>
  )
}
