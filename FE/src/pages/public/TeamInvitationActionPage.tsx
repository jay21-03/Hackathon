import { useEffect, useRef, useState } from "react";

import { Navigate, useLocation, useSearchParams } from "react-router-dom";

import { useQueryClient } from "@tanstack/react-query";

import { isAuthenticated } from "../../auth/authSession";

import { useToast } from "../../components/feedback/ToastProvider";

import { Badge } from "../../components/ui/Badge";

import { ButtonLink } from "../../components/ui/Button";

import { Icon } from "../../components/ui/Icon";

import { ModuleSkeleton } from "../../components/ui/ModuleSkeleton";

import { PageHeader } from "../../components/ui/PageHeader";

import { getStatusLabel, getStatusTone } from "../../domain/status";

import { setStoredActiveEventId } from "../../hooks/useActiveEvent";
import { invalidateAfterTeamMutation } from "../../lib/invalidateAppQueries";

import {

  confirmInvitation,

  declineInvitation,

  type TeamDetailResponse

} from "../../services/registrationService";

import { resolveApiError } from "../../utils/apiError";
import { decodeInvitationTokenParam, invitationErrorMessage } from "../../utils/invitationToken";



export type InvitationAction = "accept" | "decline";



interface TeamInvitationActionPageProps {

  action: InvitationAction;

}



export function TeamInvitationActionPage({ action }: TeamInvitationActionPageProps) {

  const location = useLocation();

  const [searchParams] = useSearchParams();

  const invitationToken = decodeInvitationTokenParam(searchParams.get("token"));

  const { notify } = useToast();

  const queryClient = useQueryClient();

  const startedRef = useRef(false);



  const [team, setTeam] = useState<TeamDetailResponse | null>(null);

  const [error, setError] = useState<string | null>(null);

  const [processing, setProcessing] = useState(true);



  const returnTo = `${location.pathname}${location.search}`;

  const isAccept = action === "accept";



  useEffect(() => {

    if (!invitationToken || !isAuthenticated() || startedRef.current) return;

    startedRef.current = true;



    (async () => {

      try {

        const response = isAccept

          ? await confirmInvitation(invitationToken)

          : await declineInvitation(invitationToken);

        setTeam(response);

        if (response.eventId) {
          setStoredActiveEventId(response.eventId);
        }

        await invalidateAfterTeamMutation(queryClient);

        notify(

          isAccept ? "Đã xác nhận tham gia đội." : "Đã từ chối lời mời.",

          "success"

        );

      } catch (err) {
        const apiMessage = resolveApiError(err, "");
        setError(invitationErrorMessage(apiMessage, isAccept));

      } finally {

        setProcessing(false);

      }

    })();

  }, [invitationToken, isAccept, notify, queryClient]);



  if (!invitationToken) {

    return (

      <div className="mx-auto max-w-3xl space-y-lg">

        <PageHeader

          eyebrow="Lời mời tham gia đội"

          title="Liên kết không hợp lệ"

          description="Vui lòng mở lại lời mời từ email (nút Đồng ý hoặc Từ chối)."

        />

        <ButtonLink to="/events" variant="secondary">

          Quay lại danh sách cuộc thi

        </ButtonLink>

      </div>

    );

  }



  if (!isAuthenticated()) {

    return (

      <Navigate

        to="/login"

        replace

        state={{

          from: returnTo,

          message: "Vui lòng đăng nhập bằng đúng email được mời trong thư, sau đó hệ thống sẽ xử lý lời mời."

        }}

      />

    );

  }



  if (processing) {

    return (

      <div className="mx-auto max-w-3xl space-y-lg">

        <PageHeader

          eyebrow="Lời mời tham gia đội"

          title={isAccept ? "Đang xác nhận…" : "Đang từ chối…"}

          description="Vui lòng đợi trong giây lát."

        />

        <ModuleSkeleton rows={3} />

      </div>

    );

  }



  if (error) {

    return (

      <div className="mx-auto max-w-3xl space-y-lg">

        <PageHeader

          eyebrow="Lời mời tham gia đội"

          title="Không xử lý được lời mời"

          description={error}

        />

        <div className="flex flex-wrap gap-sm">

          <ButtonLink to="/login" variant="secondary" state={{ from: returnTo }}>

            Đăng nhập lại

          </ButtonLink>

          <ButtonLink to="/events" variant="secondary">

            Danh sách cuộc thi

          </ButtonLink>

        </div>

      </div>

    );

  }



  return (

    <div className="mx-auto max-w-3xl space-y-lg">

      <PageHeader

        eyebrow="Lời mời tham gia đội"

        title={team?.name ?? (isAccept ? "Đã tham gia đội" : "Đã từ chối")}

        description={

          isAccept

            ? "Bạn đã xác nhận. Xem đội tại khu vực thí sinh (chọn đúng cuộc thi nếu có nhiều sự kiện)."

            : "Bạn đã từ chối lời mời này."

        }

        actions={

          team?.status ? (

            <Badge tone={getStatusTone(team.status)}>{getStatusLabel(team.status)}</Badge>

          ) : null

        }

      />



      {team?.members?.length ? (

        <section className="rounded-xl border border-outline-variant bg-surface-container p-md">

          <p className="mb-sm font-label-md text-on-surface">Thành viên trong đội</p>

          <ul className="space-y-1 font-body-sm text-on-surface-variant">

            {team.members.map((member) => (

              <li key={member.id}>

                {member.fullName} — {member.email} ({getStatusLabel(member.status)})

              </li>

            ))}

          </ul>

        </section>

      ) : null}



      <div className="flex flex-wrap gap-sm">

        {isAccept ? (

          <ButtonLink to="/me/team" icon={<Icon name="groups" />}>

            Xem đội của tôi

          </ButtonLink>

        ) : null}

        <ButtonLink to="/me/team" variant="secondary" icon={<Icon name="groups" />}>

          Đội của tôi

        </ButtonLink>

        <ButtonLink to="/me" variant="secondary">

          Tổng quan thí sinh

        </ButtonLink>

      </div>

    </div>

  );

}


