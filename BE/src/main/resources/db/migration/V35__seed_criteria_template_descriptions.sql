-- Bổ sung mô tả tiêu chí và mô tả theo mức cho mẫu rubric hệ thống
UPDATE criteria_template_items i
SET
    description = v.description,
    level_descriptors = v.level_descriptors::jsonb
FROM criteria_templates t,
     (VALUES
         ('R1_01',
          'Đánh giá mức độ hoàn thiện chức năng, độ ổn định và khả năng xử lý các luồng nghiệp vụ chính của sản phẩm.',
          '[{"level":"EXCELLENT","label":"Xuất sắc","minScore":9,"maxScore":10,"description":"Hoàn thiện cao, ít lỗi, xử lý tốt các trường hợp ngoại lệ và luồng phức tạp."},{"level":"GOOD","label":"Tốt","minScore":7,"maxScore":8.9,"description":"Hầu hết chức năng ổn định, đáp ứng đúng yêu cầu đề bài."},{"level":"SATISFACTORY","label":"Đạt","minScore":5,"maxScore":6.9,"description":"Một số chức năng chính hoạt động nhưng còn lỗi hoặc thiếu xử lý edge case."},{"level":"UNSATISFACTORY","label":"Chưa đạt","minScore":0,"maxScore":4.9,"description":"Sản phẩm không chạy được hoặc thiếu phần lớn chức năng bắt buộc theo đề bài."}]'),
         ('R1_02',
          'Đánh giá cách team tích hợp và khai thác AI/ML trong giải pháp (mục đích, độ phù hợp, hiệu quả thực tế).',
          '[{"level":"EXCELLENT","label":"Xuất sắc","minScore":9,"maxScore":10,"description":"AI được thiết kế tốt, tạo giá trị rõ rệt và được demo thuyết phục."},{"level":"GOOD","label":"Tốt","minScore":7,"maxScore":8.9,"description":"AI được áp dụng hợp lý, hỗ trợ rõ ràng cho chức năng cốt lõi."},{"level":"SATISFACTORY","label":"Đạt","minScore":5,"maxScore":6.9,"description":"Có dùng AI cơ bản nhưng chưa rõ giá trị hoặc chưa ổn định trong demo."},{"level":"UNSATISFACTORY","label":"Chưa đạt","minScore":0,"maxScore":4.9,"description":"Không có tích hợp AI hoặc chỉ mang tính hình thức, không gắn với bài toán."}]'),
         ('R1_03',
          'Đánh giá kiến trúc, phân tách module, chất lượng mã nguồn và khả năng bảo trì/mở rộng.',
          '[{"level":"EXCELLENT","label":"Xuất sắc","minScore":9,"maxScore":10,"description":"Thiết kế chuyên nghiệp, dễ mở rộng, tuân thủ best practice tốt."},{"level":"GOOD","label":"Tốt","minScore":7,"maxScore":8.9,"description":"Kiến trúc rõ ràng, mã dễ theo dõi, phù hợp quy mô dự án."},{"level":"SATISFACTORY","label":"Đạt","minScore":5,"maxScore":6.9,"description":"Có cấu trúc cơ bản nhưng còn coupling cao hoặc thiếu nhất quán."},{"level":"UNSATISFACTORY","label":"Chưa đạt","minScore":0,"maxScore":4.9,"description":"Cấu trúc lộn xộn, khó đọc hoặc không có ranh giới module rõ ràng."}]'),
         ('R1_04',
          'Đánh giá khả năng trình bày, demo trực tiếp và trả lời câu hỏi của ban giám khảo.',
          '[{"level":"EXCELLENT","label":"Xuất sắc","minScore":9,"maxScore":10,"description":"Thuyết trình thuyết phục, demo ấn tượng, phản hồi câu hỏi sâu và chính xác."},{"level":"GOOD","label":"Tốt","minScore":7,"maxScore":8.9,"description":"Demo ổn định, trình bày mạch lạc, trả lời được phần lớn câu hỏi."},{"level":"SATISFACTORY","label":"Đạt","minScore":5,"maxScore":6.9,"description":"Trình bày được ý chính nhưng demo chưa mượt hoặc thiếu rõ ràng."},{"level":"UNSATISFACTORY","label":"Chưa đạt","minScore":0,"maxScore":4.9,"description":"Không trình bày được luồng chính hoặc demo thất bại."}]'),
         ('R1_05',
          'Đánh giá phối hợp nhóm, phân công công việc và tinh thần hợp tác trong quá trình làm bài.',
          '[{"level":"EXCELLENT","label":"Xuất sắc","minScore":9,"maxScore":10,"description":"Teamwork xuất sắc, phối hợp nhịp nhàng và thể hiện tinh thần hợp tác chuyên nghiệp."},{"level":"GOOD","label":"Tốt","minScore":7,"maxScore":8.9,"description":"Phối hợp tốt, mỗi thành viên đóng góp rõ vai trò trong demo."},{"level":"SATISFACTORY","label":"Đạt","minScore":5,"maxScore":6.9,"description":"Có phân công cơ bản nhưng chưa thể hiện teamwork nhất quán."},{"level":"UNSATISFACTORY","label":"Chưa đạt","minScore":0,"maxScore":4.9,"description":"Thiếu phối hợp rõ rệt; thành viên không đóng góp hoặc mâu thuẫn trong trình bày."}]')
     ) AS v(code, description, level_descriptors)
WHERE i.template_id = t.id
  AND t.is_system_default = TRUE
  AND i.code = v.code;
