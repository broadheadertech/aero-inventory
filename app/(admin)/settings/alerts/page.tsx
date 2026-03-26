import { AlertSettingsForm } from "@/components/settings/alert-settings-form";

export default function AlertConfigurationPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Alert Configuration
        </h1>
        <p className="text-sm text-muted-foreground">
          Configure when slow mover alerts are triggered and how often
          notifications are sent.
        </p>
      </div>
      <AlertSettingsForm />
    </div>
  );
}
