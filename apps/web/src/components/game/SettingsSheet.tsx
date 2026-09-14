import type { AppSettings } from "@/lib/persistence";
import { Sheet, SheetContent } from "@/components/ui/sheet";

function SettingRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3 py-2 cursor-pointer">
      <input
        type="checkbox"
        className="mt-1"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>
        <span className="text-sm font-medium text-text-primary block">{label}</span>
        {description && (
          <span className="text-xs text-text-muted">{description}</span>
        )}
      </span>
    </label>
  );
}

export function SettingsSheet({
  open,
  onOpenChange,
  settings,
  onChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: AppSettings;
  onChange: (patch: Partial<AppSettings>) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent title="Match settings">
        <section className="space-y-1 border-b border-border-subtle pb-4">
          <p className="text-xs font-medium uppercase tracking-wide text-text-muted mb-2">
            Audio &amp; tutorial
          </p>
          <SettingRow
            label="Reduce motion"
            description="Minimize animations (also respects system setting)"
            checked={settings.reduceMotion}
            onChange={(v) => onChange({ reduceMotion: v })}
          />
          <SettingRow
            label="Mute sounds"
            checked={settings.muteSound}
            onChange={(v) => onChange({ muteSound: v })}
          />
          {!settings.muteSound && (
            <label className="flex flex-col gap-1 py-2">
              <span className="text-sm font-medium text-text-primary">
                Sound volume
              </span>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(settings.sfxVolume * 100)}
                onChange={(e) =>
                  onChange({ sfxVolume: Number(e.target.value) / 100 })
                }
                className="w-full"
              />
            </label>
          )}
          <SettingRow
            label="Line lock sounds"
            description="When a scoring line completes"
            checked={settings.sfxLineLock}
            onChange={(v) => onChange({ sfxLineLock: v })}
          />
          <SettingRow
            label="Level fanfare (L4/L5)"
            checked={settings.sfxLevelFanfare}
            onChange={(v) => onChange({ sfxLevelFanfare: v })}
          />
          <SettingRow
            label="Show tutorial on play"
            checked={settings.showTutorialOnPlay}
            onChange={(v) => onChange({ showTutorialOnPlay: v })}
          />
        </section>
        <section className="space-y-1 border-b border-border-subtle py-4">
          <p className="text-xs font-medium uppercase tracking-wide text-text-muted mb-2">
            Match
          </p>
          <SettingRow
            label="Random first player"
            checked={settings.randomFirstPlayer}
            onChange={(v) => onChange({ randomFirstPlayer: v })}
          />
          <SettingRow
            label="Opening swap"
            description="Alternate who moves first each new game"
            checked={settings.openingSwap}
            onChange={(v) => onChange({ openingSwap: v })}
          />
        </section>
        <section className="space-y-1 border-b border-border-subtle py-4">
          <p className="text-xs font-medium uppercase tracking-wide text-text-muted mb-2">
            Line overlays
          </p>
          <SettingRow
            label="Highlight rows"
            checked={settings.showRowOverlays}
            onChange={(v) => onChange({ showRowOverlays: v })}
          />
          <SettingRow
            label="Highlight columns"
            checked={settings.showColOverlays}
            onChange={(v) => onChange({ showColOverlays: v })}
          />
          <SettingRow
            label="Diagonal guides on board"
            description="Thin outlines around diagonal cells, linked in the gaps"
            checked={settings.showDiagOverlays}
            onChange={(v) => onChange({ showDiagOverlays: v })}
          />
        </section>
        <section className="space-y-1 pt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-text-muted mb-2">
            Arena (local preview)
          </p>
          <SettingRow
            label="Move clock"
            description={`${settings.arenaMoveLimitSec}s per move when enabled`}
            checked={settings.arenaClockEnabled}
            onChange={(v) => onChange({ arenaClockEnabled: v })}
          />
        </section>
      </SheetContent>
    </Sheet>
  );
}
