import * as React from "react";

import { cn } from "@/lib/utils.ts";

export type SectionCardProps = {
  /** Üst mavi / marka şeridindeki başlık */
  title: React.ReactNode;
  /** İçerik alanı — form, grid, metin vb. */
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
  /** Başlık etiketinde ek sınıf (ör. daha büyük font) */
  titleClassName?: string;
};

/**
 * Üstte renkli şerit başlık, altta doldurulabilir gövde.
 * Köşeler yuvarlatılmış tek kart görünümü (overflow + rounded).
 */
export function SectionCard({
  title,
  children,
  className,
  headerClassName,
  bodyClassName,
  titleClassName,
}: SectionCardProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border/60 bg-card shadow-md",
        className,
      )}
    >
      <div
        className={cn(
          "bg-primary px-4 py-3 text-primary-foreground",
          headerClassName,
        )}
      >
        <div
          className={cn(
            "text-lg font-semibold tracking-tight text-inherit sm:text-xl",
            titleClassName,
          )}
        >
          {title}
        </div>
      </div>
      <div className={cn("bg-background p-4 sm:p-5", bodyClassName)}>
        {children}
      </div>
    </div>
  );
}

export type SectionCardGridProps = React.ComponentProps<"div"> & {
  /** Varsayılan: mobilde 1, md ve üzeri 2 sütun */
  columns?: 1 | 2 | 3;
};

/**
 * İçerik ızgarası: `columns={3}` → md ve üzeri 3 sütun (form / özet kartları için).
 */
export function SectionCardGrid({
  className,
  columns = 2,
  ...props
}: SectionCardGridProps) {
  const cols =
    columns === 1
      ? "grid-cols-1"
      : columns === 2
        ? "grid-cols-1 md:grid-cols-2"
        : "grid-cols-1 md:grid-cols-3";
  return (
    <div
      className={cn("grid gap-4", cols, className)}
      {...props}
    />
  );
}

export type SectionCardFieldProps = {
  label: string;
  /** Sol taraftaki ikon veya kısa görsel */
  icon?: React.ReactNode;
  /** Metin, input, select vb. */
  children: React.ReactNode;
  className?: string;
};

/**
 * Şerit içindeki tek “satır” alan: ikon + üstte etiket, altta değer / form kontrolü.
 */
export function SectionCardField({
  label,
  icon,
  children,
  className,
}: SectionCardFieldProps) {
  return (
    <div
      className={cn(
        "flex gap-3 rounded-xl border border-input bg-background px-3 py-2.5 shadow-sm",
        className,
      )}
    >
      {icon ? (
        <div className="flex shrink-0 items-start pt-0.5 text-muted-foreground [&_svg]:size-5">
          {icon}
        </div>
      ) : null}
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-muted-foreground text-xs font-medium">{label}</p>
        <div className="text-foreground w-full text-sm [&_input]:h-9 [&_input]:w-full [&_select]:w-full">
          {children}
        </div>
      </div>
    </div>
  );
}
