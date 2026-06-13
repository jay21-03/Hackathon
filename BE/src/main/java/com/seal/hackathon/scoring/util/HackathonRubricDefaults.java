package com.seal.hackathon.scoring.util;

import com.seal.hackathon.scoring.dto.CriteriaRequestItem;
import com.seal.hackathon.scoring.dto.LevelDescriptorDto;
import java.util.List;
import java.util.Map;
import org.springframework.util.StringUtils;

/** Mô tả mặc định cho mẫu rubric Hackathon SEAL (5 tiêu chí). */
public final class HackathonRubricDefaults {

    private record CriterionDefaults(String description, Map<String, String> levelDescriptions) {}

    private static final Map<String, CriterionDefaults> BY_CODE = Map.of(
            "R1_01",
            new CriterionDefaults(
                    "Đánh giá mức độ hoàn thiện chức năng, độ ổn định và khả năng xử lý các luồng nghiệp vụ chính của sản phẩm.",
                    Map.of(
                            "UNSATISFACTORY",
                            "Sản phẩm không chạy được hoặc thiếu phần lớn chức năng bắt buộc theo đề bài.",
                            "SATISFACTORY",
                            "Một số chức năng chính hoạt động nhưng còn lỗi hoặc thiếu xử lý edge case.",
                            "GOOD",
                            "Hầu hết chức năng ổn định, đáp ứng đúng yêu cầu đề bài.",
                            "EXCELLENT",
                            "Hoàn thiện cao, ít lỗi, xử lý tốt các trường hợp ngoại lệ và luồng phức tạp.")),
            "R1_02",
            new CriterionDefaults(
                    "Đánh giá cách team tích hợp và khai thác AI/ML trong giải pháp (mục đích, độ phù hợp, hiệu quả thực tế).",
                    Map.of(
                            "UNSATISFACTORY",
                            "Không có tích hợp AI hoặc chỉ mang tính hình thức, không gắn với bài toán.",
                            "SATISFACTORY",
                            "Có dùng AI cơ bản nhưng chưa rõ giá trị hoặc chưa ổn định trong demo.",
                            "GOOD",
                            "AI được áp dụng hợp lý, hỗ trợ rõ ràng cho chức năng cốt lõi.",
                            "EXCELLENT",
                            "AI được thiết kế tốt, tạo giá trị rõ rệt và được demo thuyết phục.")),
            "R1_03",
            new CriterionDefaults(
                    "Đánh giá kiến trúc, phân tách module, chất lượng mã nguồn và khả năng bảo trì/mở rộng.",
                    Map.of(
                            "UNSATISFACTORY",
                            "Cấu trúc lộn xộn, khó đọc hoặc không có ranh giới module rõ ràng.",
                            "SATISFACTORY",
                            "Có cấu trúc cơ bản nhưng còn coupling cao hoặc thiếu nhất quán.",
                            "GOOD",
                            "Kiến trúc rõ ràng, mã dễ theo dõi, phù hợp quy mô dự án.",
                            "EXCELLENT",
                            "Thiết kế chuyên nghiệp, dễ mở rộng, tuân thủ best practice tốt.")),
            "R1_04",
            new CriterionDefaults(
                    "Đánh giá khả năng trình bày, demo trực tiếp và trả lời câu hỏi của ban giám khảo.",
                    Map.of(
                            "UNSATISFACTORY",
                            "Không trình bày được luồng chính hoặc demo thất bại.",
                            "SATISFACTORY",
                            "Trình bày được ý chính nhưng demo chưa mượt hoặc thiếu rõ ràng.",
                            "GOOD",
                            "Demo ổn định, trình bày mạch lạc, trả lời được phần lớn câu hỏi.",
                            "EXCELLENT",
                            "Thuyết trình thuyết phục, demo ấn tượng, phản hồi câu hỏi sâu và chính xác.")),
            "R1_05",
            new CriterionDefaults(
                    "Đánh giá phối hợp nhóm, phân công công việc và tinh thần hợp tác trong quá trình làm bài.",
                    Map.of(
                            "UNSATISFACTORY",
                            "Thiếu phối hợp rõ rệt; thành viên không đóng góp hoặc mâu thuẫn trong trình bày.",
                            "SATISFACTORY",
                            "Có phân công cơ bản nhưng chưa thể hiện teamwork nhất quán.",
                            "GOOD",
                            "Phối hợp tốt, mỗi thành viên đóng góp rõ vai trò trong demo.",
                            "EXCELLENT",
                            "Teamwork xuất sắc, phối hợp nhịp nhàng và thể hiện tinh thần hợp tác chuyên nghiệp.")));

    private HackathonRubricDefaults() {}

    public static void enrichBlankDescriptions(CriteriaRequestItem item) {
        if (item == null || !StringUtils.hasText(item.getCode())) {
            return;
        }
        CriterionDefaults defaults = BY_CODE.get(item.getCode().trim());
        if (defaults == null) {
            return;
        }
        if (!StringUtils.hasText(item.getDescription())) {
            item.setDescription(defaults.description());
        }
        if (item.getLevelDescriptors() == null || item.getLevelDescriptors().isEmpty()) {
            return;
        }
        for (LevelDescriptorDto level : item.getLevelDescriptors()) {
            if (level == null || !StringUtils.hasText(level.getLevel())) {
                continue;
            }
            if (!StringUtils.hasText(level.getDescription())) {
                String text = defaults.levelDescriptions().get(level.getLevel().trim().toUpperCase());
                if (text != null) {
                    level.setDescription(text);
                }
            }
        }
    }

    public static List<CriteriaRequestItem> enrichBlankDescriptions(List<CriteriaRequestItem> items) {
        if (items == null) {
            return List.of();
        }
        items.forEach(HackathonRubricDefaults::enrichBlankDescriptions);
        return items;
    }
}
