import { expect, test } from "@playwright/test";
import { mapOrganizerErrorMessage } from "../../src/utils/organizerErrors";
import { mapRegistrationErrorMessage } from "../../src/utils/registrationErrors";

test.describe("API error mapping for new lock rules", () => {
  test("maps roster, staff invitation, and award eligibility codes", () => {
    expect(mapOrganizerErrorMessage("TEAM_ROSTER_LOCKED_AFTER_OPERATION")).toContain(
      "repo/phiếu chấm/xếp hạng"
    );
    expect(mapOrganizerErrorMessage("TEAM_ROSTER_LOCKED_AFTER_ASSIGNMENT")).toContain("phân bảng");
    expect(mapOrganizerErrorMessage("STAFF_INVITATION_BOARD_LOCKED")).toContain("khóa phân công");
    expect(mapOrganizerErrorMessage("TEAM_NOT_ELIGIBLE_FOR_AWARD")).toContain("xác nhận");

    expect(mapRegistrationErrorMessage("TEAM_ROSTER_LOCKED_AFTER_OPERATION")).toContain(
      "repo/phiếu chấm/xếp hạng"
    );
    expect(mapRegistrationErrorMessage("TEAM_ROSTER_LOCKED_AFTER_ASSIGNMENT")).toContain("phân bảng");
  });
});
