import { useState } from "react";
import { useToast } from "../../components/feedback/ToastProvider";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Icon } from "../../components/ui/Icon";
import { PageHeader } from "../../components/ui/PageHeader";
import { getStatusLabel, getStatusTone } from "../../domain/status";
import { demoCheckIns, demoTeams } from "../../services/demoDataService";

export function CheckInPage() {
  const { notify } = useToast();
  const team = demoTeams[0];
  const existing = demoCheckIns.find((item) => item.teamId === team.id);
  const [imageName, setImageName] = useState(existing ? "quantum-nexus-checkin.jpg" : "");
  const [status, setStatus] = useState(existing?.status ?? "DRAFT");

  function submitCheckIn() {
    if (!imageName) {
      notify("Can chon anh check-in truoc khi nop.", "warning");
      return;
    }
    setStatus("PENDING");
    notify("Da nop anh check-in, cho ban to chuc duyet.", "success");
  }

  return (
    <div className="space-y-lg">
      <PageHeader
        eyebrow="Check-in"
        title={team.name}
        description="Nop anh check-in de ban to chuc xac nhan co mat. Check-in khong chan quyen xem de thi."
        actions={<Badge tone={getStatusTone(status)}>{getStatusLabel(status)}</Badge>}
      />

      <section className="grid gap-lg lg:grid-cols-[1fr_320px]">
        <article className="rounded-xl border border-outline-variant bg-surface-container p-lg">
          <label className="flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-outline-variant bg-surface-container-low p-lg text-center hover:bg-surface-variant">
            <Icon name="add_a_photo" className="text-5xl text-primary" />
            <p className="mt-md font-label-md text-on-surface">
              {imageName || "Chon anh check-in"}
            </p>
            <p className="mt-xs font-body-sm text-on-surface-variant">
              Anh nen ro mat cac thanh vien co mat tai khu vuc thi.
            </p>
            <input
              data-testid="checkin-file"
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) setImageName(file.name);
              }}
            />
          </label>

          <div className="mt-md flex flex-wrap gap-sm">
            <Button type="button" onClick={submitCheckIn} data-testid="submit-checkin">
              Nop check-in
              <Icon name="send" className="text-[18px]" />
            </Button>
            <Button type="button" variant="ghost" onClick={() => setImageName("")}>
              Xoa anh
            </Button>
          </div>
        </article>

        <aside className="rounded-xl border border-outline-variant bg-surface-container p-lg">
          <h2 className="font-headline-sm text-on-surface">Trang thai hien tai</h2>
          <div className="mt-md space-y-sm font-body-sm text-on-surface-variant">
            <p>Doi: {team.name}</p>
            <p>Bang: {team.board}</p>
            <p>Ghi chu: {existing?.note ?? "Chua co ghi chu."}</p>
            <p>De thi van mo theo release_at, khong phu thuoc check-in.</p>
          </div>
        </aside>
      </section>
    </div>
  );
}
