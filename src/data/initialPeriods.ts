import { ReportPeriod } from "../types";

export const SEEDED_PERIODS: ReportPeriod[] = [
  {
    "title": "BIÊN BẢN HỌP TỔ CHUYÊN MÔN LẦN 3 (08-10-2026)",
    "targetAudience": "dept_heads_only",
    "id": "period-1791271199207",
    "createdBy": "Ban Giám Hiệu",
    "startDate": "2026-10-06T00:00:00.000Z",
    "allowMultipleSubmissions": false,
    "academicYear": "2026-2027",
    "targetUserIds": [
      "staff-5",
      "staff-6",
      "staff-7",
      "staff-19",
      "staff-20",
      "staff-21",
      "staff-34",
      "staff-35",
      "staff-36",
      "staff-51",
      "staff-52",
      "staff-53",
      "staff-67",
      "staff-68",
      "staff-69",
      "staff-70",
      "staff-93",
      "staff-94",
      "staff-95",
      "staff-109",
      "staff-110",
      "staff-111",
      "staff-2"
    ],
    "semester": "HK1",
    "targetRoles": [
      "dept_head",
      "teacher"
    ],
    "formTemplate": {
      "fields": [
        {
          "id": "fld-1789530482314-90qm",
          "label": "Thời gian họp (giờ, phút)",
          "type": "text",
          "placeholder": "Nhập thời gian...",
          "required": true
        },
        {
          "placeholder": "Nhập địa điểm...",
          "id": "fld-1789530482314-92fp",
          "required": true,
          "label": "Địa điểm (phòng):",
          "type": "text"
        },
        {
          "id": "field-1789548985977-nol9",
          "label": "Thành phần",
          "type": "dropdown",
          "options": [
            "Thành viên tổ Ngữ văn - Thư viện - Thiết bị",
            "Thành viên tổ Toán",
            "Thành viên tổ Vật lý - Hóa học - Sinh học - Công nghệ",
            "Thành viên tổ Lịch sử - Địa lý - GDKTPL",
            "Thành viên tổ Tiếng Anh - Tin học",
            "Thành viên tổ GDTC - GDQPAN- Nghệ thuật",
            "Thành viên tổ Văn phòng"
          ],
          "required": true
        },
        {
          "required": true,
          "label": "Tổng số thành viên của tổ",
          "type": "number",
          "placeholder": "Nhập tổng số thành viên của tổ...",
          "id": "fld-1789530482314-nnl9"
        },
        {
          "placeholder": "Nhập tổng số thành viên tham dự...",
          "label": "Tổng số thành viên tham dự",
          "id": "fld-1789530482314-aig6",
          "required": true,
          "type": "number"
        },
        {
          "label": "Vắng có phép (ghi rõ họ và tên, lý do)",
          "required": true,
          "placeholder": "Nhập vắng...",
          "type": "text",
          "id": "fld-1789530482314-jmyn"
        },
        {
          "id": "fld-1789530482314-bk9w",
          "label": "Vắng không phép (họ và tên):",
          "type": "text",
          "placeholder": "Nhập không phép...",
          "required": true
        },
        {
          "id": "fld-1789530482314-z5zt",
          "type": "text",
          "placeholder": "Nhập chủ trì...",
          "required": true,
          "label": "Chủ trì cuộc họp"
        },
        {
          "placeholder": "Nhập thư ký...",
          "id": "fld-1789530482314-gg4q",
          "required": true,
          "type": "text",
          "label": "Thư ký cuộc họp"
        },
        {
          "required": false,
          "placeholder": "Nhập 1. đánh giá hoạt động của tổ trong thời gian qua...",
          "type": "section",
          "id": "fld-1789530482314-17oq",
          "label": "1. Đánh giá hoạt động của tổ trong thời gian qua"
        },
        {
          "type": "textarea",
          "id": "field-1789530878093-a1cx",
          "required": true,
          "label": "Ưu điểm"
        },
        {
          "label": "Hạn chế",
          "type": "textarea",
          "placeholder": "Nhập hạn chế...",
          "id": "fld-1789530482314-u4qq",
          "required": true
        },
        {
          "label": "Nguyên nhân của hạn chế",
          "required": true,
          "type": "textarea",
          "id": "fld-1789530482314-qf0p",
          "placeholder": "Nhập nguyên nhân của hạn chế..."
        },
        {
          "placeholder": "Nhập giải pháp khắc phục...",
          "required": true,
          "label": "Giải pháp khắc phục",
          "type": "text",
          "id": "fld-1789530482314-3yoa"
        },
        {
          "id": "fld-1789530482314-ze33",
          "placeholder": "Nhập 2. triển khai các văn bản...",
          "type": "text",
          "label": "2. Triển khai các văn bản (nêu các vướng mắc, đề xuất nếu có trong quá trình triển khai văn bản)",
          "required": true
        },
        {
          "required": false,
          "placeholder": "Nhập 3. triển khai nội dung công việc trọng tâm của trường/tổ...",
          "label": "3. Triển khai nội dung công việc trọng tâm của trường/tổ",
          "type": "section",
          "id": "fld-1789530482314-qvc4"
        },
        {
          "label": "Nêu những ý kiến về dự thảo kế hoạch giáo dục nhà trường.",
          "type": "textarea",
          "id": "fld-1789530482314-w6wb",
          "required": true,
          "placeholder": "Nhập triển khai về nội dung sinh hoạt chuyên môn. trong đó lưu ý về các biểu mẫu sở gửi kèm trong công văn 1091. lưu ý..."
        },
        {
          "type": "textarea",
          "required": true,
          "id": "field-1789531414892-v79d",
          "label": "Ý kiến về xây dựng Kế hoạch giáo dục của tổ chuyên môn, Kế hoạch bài dạy), Phân phối chương trình từng môn học, từng khối lớp. "
        },
        {
          "type": "textarea",
          "required": true,
          "label": "Ý kiến về triển khai văn bản hướng dẫn nội dung sinh hoạt chuyên môn. ",
          "id": "field-1789530967444-phuz"
        },
        {
          "type": "text",
          "placeholder": "Nhập tổ trưởng thông báo danh sách học sinh khuyết tật về giáo viên trong tổ để biết và có sự quan tâm, hỗ trợ đối với các trường hợp này. về hồ sơ theo quy định nhà trường sẽ có hướng dẫn sau. lưu ý...",
          "id": "fld-1789530482314-jkb4",
          "required": true,
          "label": "Ý kiến về công tác giáo dục hòa nhập (học sinh khuyết tật)"
        },
        {
          "required": true,
          "label": "Ý kiến về thực hiện công tác kiểm tra đánh giá",
          "id": "fld-1789530482314-6yx2",
          "type": "textarea",
          "placeholder": "Nhập thông báo về số cột điểm trong năm học theo môn học để gvbm nắm..."
        },
        {
          "label": "4. Ý kiến của các thành viên trong cuộc họp đối với trường/tổ/cá nhân",
          "type": "text",
          "placeholder": "Nhập 4. ý kiến của các thành viên trong cuộc họp đối với trường/tổ/cá nhân...",
          "required": true,
          "id": "fld-1789530482314-0y0t"
        },
        {
          "placeholder": "Nhập 5. kết luận...",
          "id": "fld-1789530482314-c0rs",
          "required": true,
          "type": "textarea",
          "label": "5. Kết luận"
        },
        {
          "type": "textarea",
          "id": "fld-1789530482314-atct",
          "label": "6. Đề xuất, kiến nghị với nhà trường",
          "required": true,
          "placeholder": "Nhập 6. đề xuất, kiến nghị với nhà trường..."
        },
        {
          "required": true,
          "type": "text",
          "label": "Cuộc họp kết thúc lúc: (.... giờ.... phút)",
          "id": "field-1789618350912-mm68"
        }
      ],
      "defaultTemplateContent": "TRƯỜNG THCS VÀ THPT                CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐỐC BINH KIỀU                                       Độc lập – Tự do – Hạnh Phúc\nTỔ ……..\nĐốc Binh Kiều, ngày    tháng    năm 2026\nBIÊN BẢN\nSinh hoạt tổ chuyên môn lần…. năm học 2026 - 2027\nThời gian:  lúc     giờ   phút, ngày    tháng  năm 2026.\nĐịa điểm: Tại phòng ………..\nThành phần:\nTổng số thành viên của tổ: …\nTổng số thành viên tham dự: …\nVắng: …. Trong đó: có phép: …., lý do: ……\nkhông phép: …….\nChủ trì: …………………….. - Tổ trưởng\nThư ký: …………………………….\nNỘI DUNG\n1. Đánh giá hoạt động của tổ trong thời gian qua\nƯu điểm:…\nHạn chế:…\nNguyên nhân của hạn chế:…\nGiải pháp khắc phục:…\n2. Triển khai các văn bản\nKế hoạch giáo dục nhà trường năm học 2026-2027 (bản dự thảo).\nCông văn số 3284/SGDĐT-GDPT ngày 24 tháng 8 năm 2026 về việc hướng dẫn xây dựng và tổ chức thực hiện kế hoạch giáo dục của nhà trường cấp trung học.\nCông văn số 1061/HD-SGDĐT ngày 28 tháng 8 năm 2026 về hướng dẫn thực hiện nhiệm vụ giáo dục phổ thông năm học 2026 – 2027.\nCông văn số 1091/HD-SGDĐT ngày 08 tháng 9 năm 2026 về việc hướng dẫn tổ chức sinh hoạt chuyên môn tại cơ sở giáo dục phổ thông và sinh hoạt cụm chuyên môn kể từ năm học 2026 – 2027.\n3. Triển khai nội dung công việc trọng tâm của trường/tổ\nGóp ý dự thảo kế hoạch giáo dục nhà trường. Tập trung đánh giá các số liệu, chỉ tiêu trong kế hoạch giáo dục.\nTriển khai các văn bản trọng tâm đầu năm do Sở GDĐT gửi. Ngoài ra, các văn bản về dạy học 2 buổi/ngày, dạy thêm học thêm, STEM/STEAM, giáo dục hòa nhập, khung năng lực AI, khung năng lực số,… nhà trường sẽ triển khai sau.\nXây dựng Kế hoạch giáo dục của tổ chuyên môn, Kế hoạch bài dạy (phụ lục 1,2 công văn 3284). Phân phối chương trình từng môn học, từng khối lớp. Thời gian gửi kế hoạch giáo dục của tổ chuyên môn, phân phối chương trình gửi lại chậm nhất 23/9/2026 (thứ 5 tuần sau).\nTriển khai về nội dung sinh hoạt chuyên môn. Trong đó lưu ý về các biểu mẫu Sở gửi kèm trong công văn 1091. Lưu ý: Trường THCS và THPT Đốc Binh Kiều thuộc cụm 2.\nTổ trưởng thông báo danh sách học sinh khuyết tật về giáo viên trong tổ để biết và có sự quan tâm, hỗ trợ đối với các trường hợp này. Về hồ sơ theo quy định nhà trường sẽ có hướng dẫn sau. Lưu ý: danh sách này chỉ dùng để thông báo cho giáo viên dạy lớp biết, không chia sẻ ra bên ngoài trường (có danh sách kèm theo)\nTheo Công văn 1061 việc kiểm tra, đánh giá học sinh sẽ tiếp tục thực hiện theo Công văn số 471/SGDĐT-GDPT ngày 22 tháng 8 năm 2025 của Sở GDĐT về việc thực hiện kiểm tra, đánh giá đối với cấp THCS và THPT. Tổ trưởng thông báo để giáo viên có định hướng trong việc giảng dạy học sinh.\nThông báo về số cột điểm trong năm học theo môn học để GVBM nắm:\n4. Ý kiến của các thành viên trong cuộc họp đối với trường/tổ/cá nhân\n……………….\n5. Kết luận\n(của chủ trì về các chỉ tiêu, nội dung trọng tâm cần thực hiện trong thời gian tới)\n………………..\n6. Đề xuất, kiến nghị với nhà trường\n……………….\nCuộc họp kết thúc vào lúc… giờ….phút cùng ngày./.\nThư ký                                                                     Chủ trì\n………………………..                                          ……………………………",
      "tables": []
    },
    "createdAt": "2026-10-06T07:19:59.207Z",
    "defaultTemplateContent": "TRƯỜNG THCS VÀ THPT                CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐỐC BINH KIỀU                                       Độc lập – Tự do – Hạnh Phúc\nTỔ ……..\nĐốc Binh Kiều, ngày    tháng    năm 2026\nBIÊN BẢN\nSinh hoạt tổ chuyên môn lần…. năm học 2026 - 2027\nThời gian:  lúc     giờ   phút, ngày    tháng  năm 2026.\nĐịa điểm: Tại phòng ………..\nThành phần:\nTổng số thành viên của tổ: …\nTổng số thành viên tham dự: …\nVắng: …. Trong đó: có phép: …., lý do: ……\nkhông phép: …….\nChủ trì: …………………….. - Tổ trưởng\nThư ký: …………………………….\nNỘI DUNG\n1. Đánh giá hoạt động của tổ trong thời gian qua\nƯu điểm:…\nHạn chế:…\nNguyên nhân của hạn chế:…\nGiải pháp khắc phục:…\n2. Triển khai các văn bản\nKế hoạch giáo dục nhà trường năm học 2026-2027 (bản dự thảo).\nCông văn số 3284/SGDĐT-GDPT ngày 24 tháng 8 năm 2026 về việc hướng dẫn xây dựng và tổ chức thực hiện kế hoạch giáo dục của nhà trường cấp trung học.\nCông văn số 1061/HD-SGDĐT ngày 28 tháng 8 năm 2026 về hướng dẫn thực hiện nhiệm vụ giáo dục phổ thông năm học 2026 – 2027.\nCông văn số 1091/HD-SGDĐT ngày 08 tháng 9 năm 2026 về việc hướng dẫn tổ chức sinh hoạt chuyên môn tại cơ sở giáo dục phổ thông và sinh hoạt cụm chuyên môn kể từ năm học 2026 – 2027.\n3. Triển khai nội dung công việc trọng tâm của trường/tổ\nGóp ý dự thảo kế hoạch giáo dục nhà trường. Tập trung đánh giá các số liệu, chỉ tiêu trong kế hoạch giáo dục.\nTriển khai các văn bản trọng tâm đầu năm do Sở GDĐT gửi. Ngoài ra, các văn bản về dạy học 2 buổi/ngày, dạy thêm học thêm, STEM/STEAM, giáo dục hòa nhập, khung năng lực AI, khung năng lực số,… nhà trường sẽ triển khai sau.\nXây dựng Kế hoạch giáo dục của tổ chuyên môn, Kế hoạch bài dạy (phụ lục 1,2 công văn 3284). Phân phối chương trình từng môn học, từng khối lớp. Thời gian gửi kế hoạch giáo dục của tổ chuyên môn, phân phối chương trình gửi lại chậm nhất 23/9/2026 (thứ 5 tuần sau).\nTriển khai về nội dung sinh hoạt chuyên môn. Trong đó lưu ý về các biểu mẫu Sở gửi kèm trong công văn 1091. Lưu ý: Trường THCS và THPT Đốc Binh Kiều thuộc cụm 2.\nTổ trưởng thông báo danh sách học sinh khuyết tật về giáo viên trong tổ để biết và có sự quan tâm, hỗ trợ đối với các trường hợp này. Về hồ sơ theo quy định nhà trường sẽ có hướng dẫn sau. Lưu ý: danh sách này chỉ dùng để thông báo cho giáo viên dạy lớp biết, không chia sẻ ra bên ngoài trường (có danh sách kèm theo)\nTheo Công văn 1061 việc kiểm tra, đánh giá học sinh sẽ tiếp tục thực hiện theo Công văn số 471/SGDĐT-GDPT ngày 22 tháng 8 năm 2025 của Sở GDĐT về việc thực hiện kiểm tra, đánh giá đối với cấp THCS và THPT. Tổ trưởng thông báo để giáo viên có định hướng trong việc giảng dạy học sinh.\nThông báo về số cột điểm trong năm học theo môn học để GVBM nắm:\n4. Ý kiến của các thành viên trong cuộc họp đối với trường/tổ/cá nhân\n……………….\n5. Kết luận\n(của chủ trì về các chỉ tiêu, nội dung trọng tâm cần thực hiện trong thời gian tới)\n………………..\n6. Đề xuất, kiến nghị với nhà trường\n……………….\nCuộc họp kết thúc vào lúc… giờ….phút cùng ngày./.\nThư ký                                                                     Chủ trì\n………………………..                                          ……………………………",
    "updatedAt": "2026-10-06T07:48:17.995Z",
    "deadline": "2026-10-15T17:00:00.000Z",
    "description": "Yêu cầu nộp báo cáo theo mẫu trực tuyến gồm 22 mục thông tin và 1 bảng số liệu. Thầy/Cô điền trực tiếp vào form trên hệ thống trước thời hạn.",
    "targetDepartmentIds": [
      "all"
    ],
    "isRequired": true,
    "reportType": "hybrid",
    "status": "active"
  },
  {
    "createdAt": "2026-10-04T12:07:25.325Z",
    "formTemplate": {
      "fields": [
        {
          "description": "",
          "type": "text",
          "id": "field-1",
          "required": true,
          "label": "Họ và tên"
        },
        {
          "options": [
            "Tốt (100% đúng giờ)",
            "Khá (Có học sinh đi trễ)",
            "Cần nhắc nhở"
          ],
          "required": true,
          "type": "text",
          "label": "Môn dạy",
          "id": "field-2"
        },
        {
          "label": "Ngày nghỉ phép",
          "required": true,
          "type": "date",
          "id": "field-3"
        },
        {
          "label": "Lý do nghỉ",
          "type": "text",
          "required": true,
          "id": "field-4"
        },
        {
          "required": true,
          "label": "Cách xử lý khi nghỉ phép",
          "id": "field-1791115366139-mhvs",
          "options": [
            "Đổi tiết",
            "Dạy thay"
          ],
          "type": "radio"
        }
      ],
      "defaultTemplateContent": "",
      "tables": [
        {
          "rows": [],
          "headers": [
            "STT",
            "Lớp",
            "Tiết",
            "Người dạy"
          ],
          "title": "THỐNG KÊ CHI TIẾT TIẾT DẠY THAY HOẶC ĐỔI TIẾT",
          "id": "table-1791115587156-rhi2"
        }
      ]
    },
    "targetRoles": [
      "teacher",
      "dept_head"
    ],
    "semester": "HK1",
    "updatedAt": "2026-10-04T12:08:47.207Z",
    "targetAudience": "teachers_only",
    "academicYear": "2026-2027",
    "targetDepartmentIds": [
      "all"
    ],
    "description": "",
    "deadline": "2027-05-30T10:00:00.000Z",
    "isRequired": true,
    "reportType": "hybrid",
    "id": "period-1791115645325",
    "title": "ĐƠN XIN NGHỈ PHÉP",
    "status": "active",
    "startDate": "2026-10-04T12:07:25.324Z",
    "createdBy": "Ban Giám Hiệu",
    "allowMultipleSubmissions": true
  },
  {
    "academicYear": "2026-2027",
    "targetDepartmentIds": [
      "all"
    ],
    "title": "BÁO CÁO KẾT QUẢ HỌP PHỤ HUYNH HỌC SINH ĐẦU NĂM HỌC 2026-2027",
    "formTemplate": {
      "fields": [
        {
          "description": "Ví dụ: 7h30 ngày 27/9/2026",
          "type": "text",
          "label": "Thời gian họp:",
          "required": true,
          "id": "field-1"
        },
        {
          "id": "field-1790419220133-ryfr",
          "description": "Ví dụ: Phòng 10CB1",
          "required": true,
          "type": "text",
          "label": "Địa điểm: "
        },
        {
          "required": true,
          "type": "text",
          "label": "Thành phần: Tập thể Phụ huynh học sinh lớp ___",
          "description": "Chỉ ghi lớp",
          "id": "field-1790419347559-b2zw"
        },
        {
          "label": "Chủ trì cuộc họp:",
          "type": "text",
          "id": "field-1790419220117-ix7d",
          "description": "Ghi họ và tên giáo viên chủ nhiệm",
          "required": true
        },
        {
          "type": "text",
          "id": "field-1790419493477-vunc",
          "required": true,
          "label": "Thư ký cuộc họp:",
          "description": "Ghi họ và tên người ghi biên bản"
        },
        {
          "options": [
            "Tốt (100% đúng giờ)",
            "Khá (Có học sinh đi trễ)",
            "Cần nhắc nhở"
          ],
          "required": true,
          "id": "field-2",
          "type": "text",
          "label": "Sĩ số học sinh"
        },
        {
          "required": true,
          "type": "text",
          "id": "field-3",
          "label": "Số phụ huynh học sinh có mặt"
        },
        {
          "required": true,
          "label": "Họ và tên Trưởng Ban đại diện CMHS",
          "type": "text",
          "id": "field-4"
        },
        {
          "required": true,
          "label": "Số điện thoại Trưởng ban ",
          "id": "field-1790418552805-jc5o",
          "type": "text"
        },
        {
          "required": true,
          "label": "Họ và tên Phó Trưởng ban đại diện CMHS",
          "id": "field-1790418563821-z6ew",
          "type": "text"
        },
        {
          "type": "text",
          "label": "Số điện thoại Phó Trưởng ban ",
          "id": "field-1790418601406-1wye",
          "required": true
        },
        {
          "type": "textarea",
          "label": "Họ và tên Thư ký Ban đại diện CMHS",
          "id": "field-1790418613789-meu3",
          "required": true
        },
        {
          "type": "textarea",
          "label": "Số điện thoại Thư ký ",
          "id": "field-1790418659612-jhsn",
          "required": true
        },
        {
          "label": "Ý kiến của phụ huynh học sinh",
          "type": "textarea",
          "id": "field-1790418670509-u1fk",
          "required": true
        },
        {
          "required": true,
          "description": "Điền vào giờ kết thúc cuộc họp. Ví dụ: 9h00",
          "type": "text",
          "label": "Cuộc họp kết thúc lúc __ giờ __ cùng ngày",
          "id": "field-1790419649408-wulj"
        }
      ],
      "tables": [],
      "defaultTemplateContent": ""
    },
    "deadline": "2026-09-27T10:00:00.000Z",
    "id": "period-1790419110520",
    "targetAudience": "homeroom_teachers",
    "isRequired": true,
    "reportType": "hybrid",
    "updatedAt": "2026-10-04T12:07:43.156Z",
    "createdAt": "2026-09-26T10:38:30.520Z",
    "semester": "HK1",
    "description": "",
    "createdBy": "Ban Giám Hiệu",
    "startDate": "2026-09-26T10:38:30.519Z",
    "targetRoles": [
      "teacher",
      "dept_head"
    ],
    "status": "closed",
    "allowMultipleSubmissions": false
  },
  {
    "reportType": "hybrid",
    "isRequired": true,
    "targetRoles": [
      "teacher",
      "dept_head"
    ],
    "createdBy": "Ban Giám Hiệu",
    "startDate": "2026-09-16T03:58:14.791Z",
    "id": "period-1789531094791",
    "description": "Yêu cầu nộp báo cáo theo mẫu trực tuyến gồm 22 mục thông tin và 1 bảng số liệu. Thầy/Cô điền trực tiếp vào form trên hệ thống trước thời hạn.",
    "targetDepartmentIds": [
      "all"
    ],
    "academicYear": "2026-2027",
    "targetAudience": "specific_users",
    "createdAt": "2026-09-16T03:58:14.791Z",
    "defaultTemplateContent": "TRƯỜNG THCS VÀ THPT                CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐỐC BINH KIỀU                                       Độc lập – Tự do – Hạnh Phúc\nTỔ ……..\nĐốc Binh Kiều, ngày    tháng    năm 2026\nBIÊN BẢN\nSinh hoạt tổ chuyên môn lần…. năm học 2026 - 2027\nThời gian:  lúc     giờ   phút, ngày    tháng  năm 2026.\nĐịa điểm: Tại phòng ………..\nThành phần:\nTổng số thành viên của tổ: …\nTổng số thành viên tham dự: …\nVắng: …. Trong đó: có phép: …., lý do: ……\nkhông phép: …….\nChủ trì: …………………….. - Tổ trưởng\nThư ký: …………………………….\nNỘI DUNG\n1. Đánh giá hoạt động của tổ trong thời gian qua\nƯu điểm:…\nHạn chế:…\nNguyên nhân của hạn chế:…\nGiải pháp khắc phục:…\n2. Triển khai các văn bản\nKế hoạch giáo dục nhà trường năm học 2026-2027 (bản dự thảo).\nCông văn số 3284/SGDĐT-GDPT ngày 24 tháng 8 năm 2026 về việc hướng dẫn xây dựng và tổ chức thực hiện kế hoạch giáo dục của nhà trường cấp trung học.\nCông văn số 1061/HD-SGDĐT ngày 28 tháng 8 năm 2026 về hướng dẫn thực hiện nhiệm vụ giáo dục phổ thông năm học 2026 – 2027.\nCông văn số 1091/HD-SGDĐT ngày 08 tháng 9 năm 2026 về việc hướng dẫn tổ chức sinh hoạt chuyên môn tại cơ sở giáo dục phổ thông và sinh hoạt cụm chuyên môn kể từ năm học 2026 – 2027.\n3. Triển khai nội dung công việc trọng tâm của trường/tổ\nGóp ý dự thảo kế hoạch giáo dục nhà trường. Tập trung đánh giá các số liệu, chỉ tiêu trong kế hoạch giáo dục.\nTriển khai các văn bản trọng tâm đầu năm do Sở GDĐT gửi. Ngoài ra, các văn bản về dạy học 2 buổi/ngày, dạy thêm học thêm, STEM/STEAM, giáo dục hòa nhập, khung năng lực AI, khung năng lực số,… nhà trường sẽ triển khai sau.\nXây dựng Kế hoạch giáo dục của tổ chuyên môn, Kế hoạch bài dạy (phụ lục 1,2 công văn 3284). Phân phối chương trình từng môn học, từng khối lớp. Thời gian gửi kế hoạch giáo dục của tổ chuyên môn, phân phối chương trình gửi lại chậm nhất 23/9/2026 (thứ 5 tuần sau).\nTriển khai về nội dung sinh hoạt chuyên môn. Trong đó lưu ý về các biểu mẫu Sở gửi kèm trong công văn 1091. Lưu ý: Trường THCS và THPT Đốc Binh Kiều thuộc cụm 2.\nTổ trưởng thông báo danh sách học sinh khuyết tật về giáo viên trong tổ để biết và có sự quan tâm, hỗ trợ đối với các trường hợp này. Về hồ sơ theo quy định nhà trường sẽ có hướng dẫn sau. Lưu ý: danh sách này chỉ dùng để thông báo cho giáo viên dạy lớp biết, không chia sẻ ra bên ngoài trường (có danh sách kèm theo)\nTheo Công văn 1061 việc kiểm tra, đánh giá học sinh sẽ tiếp tục thực hiện theo Công văn số 471/SGDĐT-GDPT ngày 22 tháng 8 năm 2025 của Sở GDĐT về việc thực hiện kiểm tra, đánh giá đối với cấp THCS và THPT. Tổ trưởng thông báo để giáo viên có định hướng trong việc giảng dạy học sinh.\nThông báo về số cột điểm trong năm học theo môn học để GVBM nắm:\n4. Ý kiến của các thành viên trong cuộc họp đối với trường/tổ/cá nhân\n……………….\n5. Kết luận\n(của chủ trì về các chỉ tiêu, nội dung trọng tâm cần thực hiện trong thời gian tới)\n………………..\n6. Đề xuất, kiến nghị với nhà trường\n……………….\nCuộc họp kết thúc vào lúc… giờ….phút cùng ngày./.\nThư ký                                                                     Chủ trì\n………………………..                                          ……………………………",
    "semester": "HK1",
    "formTemplate": {
      "fields": [
        {
          "required": true,
          "placeholder": "Nhập thời gian...",
          "label": "Thời gian họp (giờ, phút)",
          "id": "fld-1789530482314-90qm",
          "type": "text"
        },
        {
          "id": "fld-1789530482314-92fp",
          "type": "text",
          "placeholder": "Nhập địa điểm...",
          "required": true,
          "label": "Địa điểm (phòng):"
        },
        {
          "id": "field-1789548985977-nol9",
          "label": "Thành phần",
          "required": true,
          "type": "dropdown",
          "options": [
            "Thành viên tổ Ngữ văn - Thư viện - Thiết bị",
            "Thành viên tổ Toán",
            "Thành viên tổ Vật lý - Hóa học - Sinh học - Công nghệ",
            "Thành viên tổ Lịch sử - Địa lý - GDKTPL",
            "Thành viên tổ Tiếng Anh - Tin học",
            "Thành viên tổ GDTC - GDQPAN- Nghệ thuật",
            "Thành viên tổ Văn phòng"
          ]
        },
        {
          "placeholder": "Nhập tổng số thành viên của tổ...",
          "type": "number",
          "required": true,
          "label": "Tổng số thành viên của tổ",
          "id": "fld-1789530482314-nnl9"
        },
        {
          "label": "Tổng số thành viên tham dự",
          "placeholder": "Nhập tổng số thành viên tham dự...",
          "type": "number",
          "required": true,
          "id": "fld-1789530482314-aig6"
        },
        {
          "type": "text",
          "id": "fld-1789530482314-jmyn",
          "required": true,
          "label": "Vắng có phép (ghi rõ họ và tên, lý do)",
          "placeholder": "Nhập vắng..."
        },
        {
          "placeholder": "Nhập không phép...",
          "required": true,
          "id": "fld-1789530482314-bk9w",
          "label": "Vắng không phép (họ và tên):",
          "type": "text"
        },
        {
          "placeholder": "Nhập chủ trì...",
          "type": "text",
          "id": "fld-1789530482314-z5zt",
          "label": "Chủ trì cuộc họp",
          "required": true
        },
        {
          "label": "Thư ký cuộc họp",
          "id": "fld-1789530482314-gg4q",
          "placeholder": "Nhập thư ký...",
          "type": "text",
          "required": true
        },
        {
          "placeholder": "Nhập 1. đánh giá hoạt động của tổ trong thời gian qua...",
          "required": false,
          "id": "fld-1789530482314-17oq",
          "label": "1. Đánh giá hoạt động của tổ trong thời gian qua",
          "type": "section"
        },
        {
          "required": true,
          "type": "textarea",
          "label": "Ưu điểm",
          "id": "field-1789530878093-a1cx"
        },
        {
          "type": "textarea",
          "required": true,
          "id": "fld-1789530482314-u4qq",
          "placeholder": "Nhập hạn chế...",
          "label": "Hạn chế"
        },
        {
          "required": true,
          "id": "fld-1789530482314-qf0p",
          "label": "Nguyên nhân của hạn chế",
          "type": "textarea",
          "placeholder": "Nhập nguyên nhân của hạn chế..."
        },
        {
          "placeholder": "Nhập giải pháp khắc phục...",
          "required": true,
          "id": "fld-1789530482314-3yoa",
          "type": "text",
          "label": "Giải pháp khắc phục"
        },
        {
          "placeholder": "Nhập 2. triển khai các văn bản...",
          "type": "text",
          "label": "2. Triển khai các văn bản (nêu các vướng mắc, đề xuất nếu có trong quá trình triển khai văn bản)",
          "required": true,
          "id": "fld-1789530482314-ze33"
        },
        {
          "placeholder": "Nhập 3. triển khai nội dung công việc trọng tâm của trường/tổ...",
          "id": "fld-1789530482314-qvc4",
          "required": false,
          "label": "3. Triển khai nội dung công việc trọng tâm của trường/tổ",
          "type": "section"
        },
        {
          "required": true,
          "id": "fld-1789530482314-w6wb",
          "placeholder": "Nhập triển khai về nội dung sinh hoạt chuyên môn. trong đó lưu ý về các biểu mẫu sở gửi kèm trong công văn 1091. lưu ý...",
          "type": "textarea",
          "label": "Nêu những ý kiến về dự thảo kế hoạch giáo dục nhà trường."
        },
        {
          "type": "textarea",
          "required": true,
          "id": "field-1789531414892-v79d",
          "label": "Ý kiến về xây dựng Kế hoạch giáo dục của tổ chuyên môn, Kế hoạch bài dạy), Phân phối chương trình từng môn học, từng khối lớp. "
        },
        {
          "required": true,
          "type": "textarea",
          "label": "Ý kiến về triển khai văn bản hướng dẫn nội dung sinh hoạt chuyên môn. ",
          "id": "field-1789530967444-phuz"
        },
        {
          "required": true,
          "type": "text",
          "placeholder": "Nhập tổ trưởng thông báo danh sách học sinh khuyết tật về giáo viên trong tổ để biết và có sự quan tâm, hỗ trợ đối với các trường hợp này. về hồ sơ theo quy định nhà trường sẽ có hướng dẫn sau. lưu ý...",
          "label": "Ý kiến về công tác giáo dục hòa nhập (học sinh khuyết tật)",
          "id": "fld-1789530482314-jkb4"
        },
        {
          "placeholder": "Nhập thông báo về số cột điểm trong năm học theo môn học để gvbm nắm...",
          "required": true,
          "id": "fld-1789530482314-6yx2",
          "type": "textarea",
          "label": "Ý kiến về thực hiện công tác kiểm tra đánh giá"
        },
        {
          "placeholder": "Nhập 4. ý kiến của các thành viên trong cuộc họp đối với trường/tổ/cá nhân...",
          "type": "text",
          "id": "fld-1789530482314-0y0t",
          "required": true,
          "label": "4. Ý kiến của các thành viên trong cuộc họp đối với trường/tổ/cá nhân"
        },
        {
          "required": true,
          "label": "5. Kết luận",
          "type": "textarea",
          "placeholder": "Nhập 5. kết luận...",
          "id": "fld-1789530482314-c0rs"
        },
        {
          "placeholder": "Nhập 6. đề xuất, kiến nghị với nhà trường...",
          "required": true,
          "type": "textarea",
          "label": "6. Đề xuất, kiến nghị với nhà trường",
          "id": "fld-1789530482314-atct"
        },
        {
          "required": true,
          "type": "text",
          "id": "field-1789618350912-mm68",
          "label": "Cuộc họp kết thúc lúc: (.... giờ.... phút)"
        }
      ],
      "defaultTemplateContent": "TRƯỜNG THCS VÀ THPT                CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐỐC BINH KIỀU                                       Độc lập – Tự do – Hạnh Phúc\nTỔ ……..\nĐốc Binh Kiều, ngày    tháng    năm 2026\nBIÊN BẢN\nSinh hoạt tổ chuyên môn lần…. năm học 2026 - 2027\nThời gian:  lúc     giờ   phút, ngày    tháng  năm 2026.\nĐịa điểm: Tại phòng ………..\nThành phần:\nTổng số thành viên của tổ: …\nTổng số thành viên tham dự: …\nVắng: …. Trong đó: có phép: …., lý do: ……\nkhông phép: …….\nChủ trì: …………………….. - Tổ trưởng\nThư ký: …………………………….\nNỘI DUNG\n1. Đánh giá hoạt động của tổ trong thời gian qua\nƯu điểm:…\nHạn chế:…\nNguyên nhân của hạn chế:…\nGiải pháp khắc phục:…\n2. Triển khai các văn bản\nKế hoạch giáo dục nhà trường năm học 2026-2027 (bản dự thảo).\nCông văn số 3284/SGDĐT-GDPT ngày 24 tháng 8 năm 2026 về việc hướng dẫn xây dựng và tổ chức thực hiện kế hoạch giáo dục của nhà trường cấp trung học.\nCông văn số 1061/HD-SGDĐT ngày 28 tháng 8 năm 2026 về hướng dẫn thực hiện nhiệm vụ giáo dục phổ thông năm học 2026 – 2027.\nCông văn số 1091/HD-SGDĐT ngày 08 tháng 9 năm 2026 về việc hướng dẫn tổ chức sinh hoạt chuyên môn tại cơ sở giáo dục phổ thông và sinh hoạt cụm chuyên môn kể từ năm học 2026 – 2027.\n3. Triển khai nội dung công việc trọng tâm của trường/tổ\nGóp ý dự thảo kế hoạch giáo dục nhà trường. Tập trung đánh giá các số liệu, chỉ tiêu trong kế hoạch giáo dục.\nTriển khai các văn bản trọng tâm đầu năm do Sở GDĐT gửi. Ngoài ra, các văn bản về dạy học 2 buổi/ngày, dạy thêm học thêm, STEM/STEAM, giáo dục hòa nhập, khung năng lực AI, khung năng lực số,… nhà trường sẽ triển khai sau.\nXây dựng Kế hoạch giáo dục của tổ chuyên môn, Kế hoạch bài dạy (phụ lục 1,2 công văn 3284). Phân phối chương trình từng môn học, từng khối lớp. Thời gian gửi kế hoạch giáo dục của tổ chuyên môn, phân phối chương trình gửi lại chậm nhất 23/9/2026 (thứ 5 tuần sau).\nTriển khai về nội dung sinh hoạt chuyên môn. Trong đó lưu ý về các biểu mẫu Sở gửi kèm trong công văn 1091. Lưu ý: Trường THCS và THPT Đốc Binh Kiều thuộc cụm 2.\nTổ trưởng thông báo danh sách học sinh khuyết tật về giáo viên trong tổ để biết và có sự quan tâm, hỗ trợ đối với các trường hợp này. Về hồ sơ theo quy định nhà trường sẽ có hướng dẫn sau. Lưu ý: danh sách này chỉ dùng để thông báo cho giáo viên dạy lớp biết, không chia sẻ ra bên ngoài trường (có danh sách kèm theo)\nTheo Công văn 1061 việc kiểm tra, đánh giá học sinh sẽ tiếp tục thực hiện theo Công văn số 471/SGDĐT-GDPT ngày 22 tháng 8 năm 2025 của Sở GDĐT về việc thực hiện kiểm tra, đánh giá đối với cấp THCS và THPT. Tổ trưởng thông báo để giáo viên có định hướng trong việc giảng dạy học sinh.\nThông báo về số cột điểm trong năm học theo môn học để GVBM nắm:\n4. Ý kiến của các thành viên trong cuộc họp đối với trường/tổ/cá nhân\n……………….\n5. Kết luận\n(của chủ trì về các chỉ tiêu, nội dung trọng tâm cần thực hiện trong thời gian tới)\n………………..\n6. Đề xuất, kiến nghị với nhà trường\n……………….\nCuộc họp kết thúc vào lúc… giờ….phút cùng ngày./.\nThư ký                                                                     Chủ trì\n………………………..                                          ……………………………",
      "tables": []
    },
    "status": "active",
    "title": "BIÊN BẢN HỌP TỔ CHUYÊN MÔN LẦN 2 (17-9-2026)",
    "targetUserIds": [
      "staff-5",
      "staff-34",
      "staff-93",
      "staff-19",
      "staff-67",
      "staff-51",
      "staff-109",
      "staff-2"
    ],
    "deadline": "2026-09-18T10:00:00.000Z",
    "allowMultipleSubmissions": false
  },
  {
    "title": "Danh sách học sinh chưa ra lớp (theo bảng thống kê)",
    "deadline": "2026-09-20T10:00:00.000Z",
    "formTemplate": {
      "tables": [
        {
          "headers": [
            "TT",
            "Họ và tên học sinh",
            "Lớp năm học trước",
            "Nơi ở hiện nay (nếu có thông tin chi tiết càng tốt như ở đường nào, khúc nào, gần những chỗ nào dễ nhận dạng)",
            "Số điện thoại học sinh (nếu có)",
            "Số điện thoại phụ huynh (nếu có)",
            "Lý do chưa ra lớp (nếu biết)"
          ],
          "title": "Danh sách học sinh chưa ra lớp (theo bảng thống kê)",
          "id": "tbl-1789282853300-0-bqe",
          "rows": [
            {
              "Số điện thoại phụ huynh (nếu có)": "",
              "Nơi ở hiện nay (nếu có thông tin chi tiết càng tốt như ở đường nào, khúc nào, gần những chỗ nào dễ nhận dạng)": "",
              "Số điện thoại học sinh (nếu có)": "",
              "Họ và tên học sinh": "",
              "Lớp năm học trước": "",
              "Lý do chưa ra lớp (nếu biết)": "",
              "TT": "1"
            },
            {
              "Họ và tên học sinh": "",
              "Nơi ở hiện nay (nếu có thông tin chi tiết càng tốt như ở đường nào, khúc nào, gần những chỗ nào dễ nhận dạng)": "",
              "Lý do chưa ra lớp (nếu biết)": "",
              "Lớp năm học trước": "",
              "Số điện thoại học sinh (nếu có)": "",
              "Số điện thoại phụ huynh (nếu có)": "",
              "TT": "2"
            },
            {
              "Lớp năm học trước": "",
              "Số điện thoại học sinh (nếu có)": "",
              "TT": "3",
              "Họ và tên học sinh": "",
              "Nơi ở hiện nay (nếu có thông tin chi tiết càng tốt như ở đường nào, khúc nào, gần những chỗ nào dễ nhận dạng)": "",
              "Số điện thoại phụ huynh (nếu có)": "",
              "Lý do chưa ra lớp (nếu biết)": ""
            },
            {
              "Họ và tên học sinh": "",
              "TT": "4",
              "Lý do chưa ra lớp (nếu biết)": "",
              "Lớp năm học trước": "",
              "Nơi ở hiện nay (nếu có thông tin chi tiết càng tốt như ở đường nào, khúc nào, gần những chỗ nào dễ nhận dạng)": "",
              "Số điện thoại phụ huynh (nếu có)": "",
              "Số điện thoại học sinh (nếu có)": ""
            },
            {
              "Số điện thoại phụ huynh (nếu có)": "",
              "Họ và tên học sinh": "",
              "Nơi ở hiện nay (nếu có thông tin chi tiết càng tốt như ở đường nào, khúc nào, gần những chỗ nào dễ nhận dạng)": "",
              "Lớp năm học trước": "",
              "TT": "5",
              "Số điện thoại học sinh (nếu có)": "",
              "Lý do chưa ra lớp (nếu biết)": ""
            }
          ]
        },
        {
          "rows": [
            {
              "Đạt giải": "",
              "TT": "1",
              "Cuộc thi": "Văn nghệ vòng tỉnh, vòng xã",
              "Họ tên học sinh đạt giải": ""
            },
            {
              "Đạt giải": "",
              "TT": "2",
              "Cuộc thi": "Hội khỏe phù đổng",
              "Họ tên học sinh đạt giải": ""
            },
            {
              "Cuộc thi": "Giải thể thao học sinh tỉnh Đồng Tháp",
              "TT": "3",
              "Đạt giải": "",
              "Họ tên học sinh đạt giải": ""
            },
            {
              "Đạt giải": "",
              "TT": "4",
              "Họ tên học sinh đạt giải": "",
              "Cuộc thi": "Sáng tạo thanh thiếu niên nhi đồng"
            },
            {
              "Cuộc thi": "Khoa học kỹ thuật",
              "TT": "5",
              "Họ tên học sinh đạt giải": "",
              "Đạt giải": ""
            },
            {
              "Đạt giải": "",
              "TT": "6",
              "Cuộc thi": "Vẽ tranh",
              "Họ tên học sinh đạt giải": ""
            },
            {
              "Cuộc thi": "Phong trào khác:",
              "TT": "7",
              "Đạt giải": "",
              "Họ tên học sinh đạt giải": ""
            },
            {
              "TT": "8",
              "Họ tên học sinh đạt giải": "",
              "Cuộc thi": "Thành tích khác:",
              "Đạt giải": ""
            }
          ],
          "id": "tbl-1789282853300-1-e26",
          "title": "Thông tin học sinh có thành tích về hội thi, phong trào",
          "headers": [
            "TT",
            "Cuộc thi",
            "Đạt giải",
            "Họ tên học sinh đạt giải"
          ]
        }
      ],
      "fields": [
        {
          "placeholder": "Nhập số học sinh chưa ra lớp đến thời điểm ngày 07/9/2026...",
          "required": false,
          "id": "fld-1789282853301-uj8d",
          "type": "number",
          "label": "Số học sinh chưa ra lớp đến thời điểm ngày 07/9/2026"
        },
        {
          "required": false,
          "placeholder": "Nhập thông tin học sinh có thành tích về hội thi, phong trào...",
          "type": "text",
          "id": "fld-1789282853301-usb6",
          "label": "Thông tin học sinh có thành tích về hội thi, phong trào"
        },
        {
          "type": "text",
          "required": false,
          "id": "fld-1789282853301-28u7",
          "label": "Họ và tên lớp trưởng",
          "placeholder": "Nhập họ và tên lớp trưởng..."
        }
      ],
      "defaultTemplateContent": "Số học sinh chưa ra lớp đến thời điểm ngày 07/9/2026:\nDanh sách học sinh chưa ra lớp (theo bảng thống kê)\nThông tin học sinh có thành tích về hội thi, phong trào:\nHọ và tên lớp trưởng:"
    },
    "id": "period-1789282896984",
    "targetAudience": "specific_users",
    "academicYear": "2026-2027",
    "semester": "HK1",
    "defaultTemplateContent": "Số học sinh chưa ra lớp đến thời điểm ngày 07/9/2026:\nDanh sách học sinh chưa ra lớp (theo bảng thống kê)\nThông tin học sinh có thành tích về hội thi, phong trào:\nHọ và tên lớp trưởng:",
    "createdAt": "2026-09-13T07:01:36.984Z",
    "reportType": "hybrid",
    "isRequired": true,
    "targetDepartmentIds": [
      "all"
    ],
    "targetRoles": [
      "teacher",
      "dept_head"
    ],
    "status": "active",
    "createdBy": "Ban Giám Hiệu",
    "startDate": "2026-09-13T07:01:36.984Z",
    "targetUserIds": [
      "staff-5",
      "staff-9",
      "staff-10",
      "staff-11"
    ],
    "description": "Yêu cầu nộp báo cáo theo mẫu trực tuyến gồm 3 mục thông tin và 2 bảng số liệu. Thầy/Cô điền trực tiếp vào form trên hệ thống trước thời hạn.",
    "allowMultipleSubmissions": false
  },
  {
    "status": "active",
    "targetUserIds": [
      "staff-8",
      "staff-48",
      "staff-9"
    ],
    "deadline": "2026-09-18T10:00:00.000Z",
    "targetDepartmentIds": [
      "all"
    ],
    "createdBy": "Ban Giám Hiệu",
    "startDate": "2026-09-11T13:28:29.130Z",
    "semester": "HK1",
    "id": "period-1789133309131",
    "defaultTemplateContent": "\\- Số học sinh chưa ra lớp đến thời điểm ngày 07/9/2026:\r\n\r\n\\- Danh sách học sinh chưa ra lớp (theo bảng thống kê)\r\n\r\n|**TT**|**Họ và tên học sinh**|**Lớp năm học trước**|**Nơi ở hiện nay (nếu có thông tin chi tiết càng tốt như ở đường nào, khúc nào, gần những chỗ nào dễ nhận dạng)**|**Số điện thoại học sinh (nếu có)**|**Số điện thoại phụ huynh (nếu có)**|**Lý do chưa ra lớp (nếu biết)**|\r\n| :-: | :-: | :-: | :-: | :-: | :-: | :-: |\r\n|**1**|||||||\r\n|**2**|||||||\r\n|**3**|||||||\r\n|**4**|||||||\r\n|**5**|||||||\r\n- Thông tin học sinh có thành tích về hội thi, phong trào:\r\n\r\n|**TT**|**Cuộc thi**|**Đạt giải**|**Họ tên học sinh đạt giải**|\r\n| :-: | :-: | :-: | :-: |\r\n|1|Văn nghệ vòng tỉnh, vòng xã|||\r\n|2|Hội khỏe phù đổng|||\r\n|3|Giải thể thao học sinh tỉnh Đồng Tháp|||\r\n|4|Sáng tạo thanh thiếu niên nhi đồng|||\r\n|5|Khoa học kỹ thuật|||\r\n|6|Vẽ tranh |||\r\n|7|<p>Phong trào khác:</p><p>...............................</p><p>...............................</p>|||\r\n|8|<p>Thành tích khác:</p><p>...............................</p>|||\r\n\\- Họ và tên lớp trưởng: \r\n2\r\n\r\n",
    "targetRoles": [
      "teacher",
      "dept_head"
    ],
    "createdAt": "2026-09-11T13:28:29.131Z",
    "reportType": "hybrid",
    "isRequired": true,
    "description": "Yêu cầu nộp báo cáo theo mẫu trực tuyến gồm 2 mục thông tin và 2 bảng số liệu. Thầy/Cô điền trực tiếp vào form trên hệ thống trước thời hạn.",
    "formTemplate": {
      "tables": [
        {
          "rows": [
            {
              "Họ và tên học sinh": "",
              "Số điện thoại học sinh (nếu có)": "",
              "Nơi ở hiện nay (nếu có thông tin chi tiết càng tốt như ở đường nào, khúc nào, gần những chỗ nào dễ nhận dạng)": "",
              "Lớp năm học trước": "",
              "TT": "1",
              "Lý do chưa ra lớp (nếu biết)": "",
              "Số điện thoại phụ huynh (nếu có)": ""
            },
            {
              "Nơi ở hiện nay (nếu có thông tin chi tiết càng tốt như ở đường nào, khúc nào, gần những chỗ nào dễ nhận dạng)": "",
              "Lớp năm học trước": "",
              "Số điện thoại phụ huynh (nếu có)": "",
              "Số điện thoại học sinh (nếu có)": "",
              "TT": "2",
              "Họ và tên học sinh": "",
              "Lý do chưa ra lớp (nếu biết)": ""
            },
            {
              "Nơi ở hiện nay (nếu có thông tin chi tiết càng tốt như ở đường nào, khúc nào, gần những chỗ nào dễ nhận dạng)": "",
              "Số điện thoại học sinh (nếu có)": "",
              "Số điện thoại phụ huynh (nếu có)": "",
              "Lớp năm học trước": "",
              "Lý do chưa ra lớp (nếu biết)": "",
              "TT": "3",
              "Họ và tên học sinh": ""
            },
            {
              "Họ và tên học sinh": "",
              "Số điện thoại phụ huynh (nếu có)": "",
              "Lý do chưa ra lớp (nếu biết)": "",
              "TT": "4",
              "Nơi ở hiện nay (nếu có thông tin chi tiết càng tốt như ở đường nào, khúc nào, gần những chỗ nào dễ nhận dạng)": "",
              "Số điện thoại học sinh (nếu có)": "",
              "Lớp năm học trước": ""
            },
            {
              "Lớp năm học trước": "",
              "Nơi ở hiện nay (nếu có thông tin chi tiết càng tốt như ở đường nào, khúc nào, gần những chỗ nào dễ nhận dạng)": "",
              "Lý do chưa ra lớp (nếu biết)": "",
              "Số điện thoại phụ huynh (nếu có)": "",
              "TT": "5",
              "Họ và tên học sinh": "",
              "Số điện thoại học sinh (nếu có)": ""
            }
          ],
          "title": "Danh sách học sinh chưa ra lớp (theo bảng thống kê)",
          "id": "tbl-1789133281723-91qi",
          "headers": [
            "TT",
            "Họ và tên học sinh",
            "Lớp năm học trước",
            "Nơi ở hiện nay (nếu có thông tin chi tiết càng tốt như ở đường nào, khúc nào, gần những chỗ nào dễ nhận dạng)",
            "Số điện thoại học sinh (nếu có)",
            "Số điện thoại phụ huynh (nếu có)",
            "Lý do chưa ra lớp (nếu biết)"
          ]
        },
        {
          "headers": [
            "TT",
            "Cuộc thi",
            "Đạt giải",
            "Họ tên học sinh đạt giải"
          ],
          "id": "tbl-1789133281723-vma3",
          "rows": [
            {
              "Họ tên học sinh đạt giải": "",
              "Cuộc thi": "Văn nghệ vòng tỉnh, vòng xã",
              "Đạt giải": "",
              "TT": "1"
            },
            {
              "Họ tên học sinh đạt giải": "",
              "Cuộc thi": "Hội khỏe phù đổng",
              "Đạt giải": "",
              "TT": "2"
            },
            {
              "Đạt giải": "",
              "Họ tên học sinh đạt giải": "",
              "TT": "3",
              "Cuộc thi": "Giải thể thao học sinh tỉnh Đồng Tháp"
            },
            {
              "Họ tên học sinh đạt giải": "",
              "Đạt giải": "",
              "Cuộc thi": "Sáng tạo thanh thiếu niên nhi đồng",
              "TT": "4"
            },
            {
              "Họ tên học sinh đạt giải": "",
              "Đạt giải": "",
              "Cuộc thi": "Khoa học kỹ thuật",
              "TT": "5"
            },
            {
              "TT": "6",
              "Cuộc thi": "Vẽ tranh",
              "Họ tên học sinh đạt giải": "",
              "Đạt giải": ""
            },
            {
              "Cuộc thi": "Phong trào khác:",
              "Đạt giải": "",
              "Họ tên học sinh đạt giải": "",
              "TT": "7"
            },
            {
              "Cuộc thi": "Thành tích khác:",
              "Họ tên học sinh đạt giải": "",
              "Đạt giải": "",
              "TT": "8"
            }
          ],
          "title": "Thông tin học sinh có thành tích về hội thi, phong trào"
        }
      ],
      "defaultTemplateContent": "\\- Số học sinh chưa ra lớp đến thời điểm ngày 07/9/2026:\r\n\r\n\\- Danh sách học sinh chưa ra lớp (theo bảng thống kê)\r\n\r\n|**TT**|**Họ và tên học sinh**|**Lớp năm học trước**|**Nơi ở hiện nay (nếu có thông tin chi tiết càng tốt như ở đường nào, khúc nào, gần những chỗ nào dễ nhận dạng)**|**Số điện thoại học sinh (nếu có)**|**Số điện thoại phụ huynh (nếu có)**|**Lý do chưa ra lớp (nếu biết)**|\r\n| :-: | :-: | :-: | :-: | :-: | :-: | :-: |\r\n|**1**|||||||\r\n|**2**|||||||\r\n|**3**|||||||\r\n|**4**|||||||\r\n|**5**|||||||\r\n- Thông tin học sinh có thành tích về hội thi, phong trào:\r\n\r\n|**TT**|**Cuộc thi**|**Đạt giải**|**Họ tên học sinh đạt giải**|\r\n| :-: | :-: | :-: | :-: |\r\n|1|Văn nghệ vòng tỉnh, vòng xã|||\r\n|2|Hội khỏe phù đổng|||\r\n|3|Giải thể thao học sinh tỉnh Đồng Tháp|||\r\n|4|Sáng tạo thanh thiếu niên nhi đồng|||\r\n|5|Khoa học kỹ thuật|||\r\n|6|Vẽ tranh |||\r\n|7|<p>Phong trào khác:</p><p>...............................</p><p>...............................</p>|||\r\n|8|<p>Thành tích khác:</p><p>...............................</p>|||\r\n\\- Họ và tên lớp trưởng: \r\n2\r\n\r\n",
      "fields": [
        {
          "label": "Số học sinh chưa ra lớp đến thời điểm ngày 07/9/2026",
          "required": false,
          "placeholder": "Nhập số học sinh chưa ra lớp đến thời điểm ngày 07/9/2026...",
          "type": "number",
          "id": "fld-1789133281723-163k"
        },
        {
          "placeholder": "Giá trị mặc định: 2",
          "label": "Họ và tên lớp trưởng",
          "id": "fld-1789133281724-ji7t",
          "type": "text",
          "required": false
        }
      ]
    },
    "targetAudience": "specific_users",
    "title": "Test hệ thống dùm",
    "academicYear": "2026-2027",
    "allowMultipleSubmissions": false
  },
  {
    "targetUserIds": [
      "staff-5",
      "staff-19",
      "staff-67",
      "staff-34",
      "staff-51",
      "staff-109",
      "staff-93"
    ],
    "description": "Yêu cầu nộp báo cáo theo mẫu trực tuyến gồm 0 mục thông tin và 0 bảng số liệu. Thầy/Cô điền trực tiếp vào form trên hệ thống trước thời hạn.",
    "targetAudience": "specific_users",
    "createdAt": "2026-09-10T03:09:40.369Z",
    "title": "Báo cáo Khảo sát theo yêu cầu Công an xã (Kiến thức về ATGT)",
    "id": "period-1789009780369",
    "targetRoles": [
      "teacher",
      "dept_head"
    ],
    "targetDepartmentIds": [
      "all"
    ],
    "deadline": "2026-09-11T08:00:00.000Z",
    "academicYear": "2026-2027",
    "isRequired": true,
    "reportType": "hybrid",
    "semester": "HK1",
    "defaultTemplateContent": "Số thành viên trong tổ: (định dạng number)\n\n\n\nSố đã khảo sát: (định dạng number)\n\n\n\nSố chưa khảo sát: (định dạng number)\n\n\n\nLý do chưa khảo sát: (định dạng text)\n\n\n\n",
    "formTemplate": {
      "fields": [
        {
          "id": "fld-1789009671530-6a0q",
          "required": false,
          "placeholder": "Giá trị mặc định: (định dạng number)",
          "label": "Số thành viên trong tổ",
          "type": "text"
        },
        {
          "id": "fld-1789009671530-48hs",
          "required": false,
          "type": "text",
          "placeholder": "Giá trị mặc định: (định dạng number)",
          "label": "Số đã khảo sát"
        },
        {
          "label": "Số chưa khảo sát",
          "placeholder": "Giá trị mặc định: (định dạng number)",
          "type": "text",
          "required": false,
          "id": "fld-1789009671530-iagn"
        },
        {
          "required": false,
          "label": "Lý do chưa khảo sát",
          "placeholder": "Giá trị mặc định: (định dạng text)",
          "type": "textarea",
          "id": "fld-1789009671530-fpb5"
        }
      ],
      "defaultTemplateContent": "Số thành viên trong tổ: (định dạng number)\n\n\n\nSố đã khảo sát: (định dạng number)\n\n\n\nSố chưa khảo sát: (định dạng number)\n\n\n\nLý do chưa khảo sát: (định dạng text)\n\n\n\n",
      "tables": []
    },
    "status": "active",
    "startDate": "2026-09-10T03:09:40.368Z",
    "createdBy": "Ban Giám Hiệu",
    "allowMultipleSubmissions": false
  },
  {
    "targetDepartmentIds": [
      "all"
    ],
    "status": "active",
    "id": "period-1788535581418",
    "defaultTemplateContent": "\\- Số học sinh chưa ra lớp đến thời điểm ngày 07/9/2026:\r\n\r\n\\- Danh sách học sinh chưa ra lớp (theo bảng thống kê)\r\n\r\n|**TT**|**Họ và tên học sinh**|**Lớp năm học trước**|**Nơi ở hiện nay (nếu có thông tin chi tiết càng tốt như ở đường nào, khúc nào, gần những chỗ nào dễ nhận dạng)**|**Số điện thoại học sinh (nếu có)**|**Số điện thoại phụ huynh (nếu có)**|**Lý do chưa ra lớp (nếu biết)**|\r\n| :-: | :-: | :-: | :-: | :-: | :-: | :-: |\r\n|**1**|||||||\r\n|**2**|||||||\r\n|**3**|||||||\r\n|**4**|||||||\r\n|**5**|||||||\r\n- Thông tin học sinh có thành tích về hội thi, phong trào:\r\n\r\n|**TT**|**Cuộc thi**|**Đạt giải**|**Họ tên học sinh đạt giải**|\r\n| :-: | :-: | :-: | :-: |\r\n|1|Văn nghệ vòng tỉnh, vòng xã|||\r\n|2|Hội khỏe phù đổng|||\r\n|3|Giải thể thao học sinh tỉnh Đồng Tháp|||\r\n|4|Sáng tạo thanh thiếu niên nhi đồng|||\r\n|5|Khoa học kỹ thuật|||\r\n|6|Vẽ tranh |||\r\n|7|<p>Phong trào khác:</p><p>...............................</p><p>...............................</p>|||\r\n|8|<p>Thành tích khác:</p><p>...............................</p>|||\r\n\\- Họ và tên lớp trưởng: \r\n2\r\n\r\n",
    "isRequired": true,
    "reportType": "hybrid",
    "createdBy": "Ban Giám Hiệu",
    "startDate": "2026-09-04T15:26:21.418Z",
    "deadline": "2026-09-11T10:00:00.000Z",
    "title": "Báo cáo kết quả tập trung học sinh đầu năm học 2026-2027",
    "formTemplate": {
      "fields": [
        {
          "placeholder": "Nhập số học sinh chưa ra lớp đến thời điểm ngày 07/9/2026...",
          "id": "fld-1788535567817-w89u",
          "required": false,
          "type": "number",
          "label": "Số học sinh chưa ra lớp đến thời điểm ngày 07/9/2026"
        },
        {
          "type": "text",
          "placeholder": "Giá trị mặc định: 2",
          "required": false,
          "id": "fld-1788535567817-afs9",
          "label": "Họ và tên lớp trưởng"
        }
      ],
      "defaultTemplateContent": "\\- Số học sinh chưa ra lớp đến thời điểm ngày 07/9/2026:\r\n\r\n\\- Danh sách học sinh chưa ra lớp (theo bảng thống kê)\r\n\r\n|**TT**|**Họ và tên học sinh**|**Lớp năm học trước**|**Nơi ở hiện nay (nếu có thông tin chi tiết càng tốt như ở đường nào, khúc nào, gần những chỗ nào dễ nhận dạng)**|**Số điện thoại học sinh (nếu có)**|**Số điện thoại phụ huynh (nếu có)**|**Lý do chưa ra lớp (nếu biết)**|\r\n| :-: | :-: | :-: | :-: | :-: | :-: | :-: |\r\n|**1**|||||||\r\n|**2**|||||||\r\n|**3**|||||||\r\n|**4**|||||||\r\n|**5**|||||||\r\n- Thông tin học sinh có thành tích về hội thi, phong trào:\r\n\r\n|**TT**|**Cuộc thi**|**Đạt giải**|**Họ tên học sinh đạt giải**|\r\n| :-: | :-: | :-: | :-: |\r\n|1|Văn nghệ vòng tỉnh, vòng xã|||\r\n|2|Hội khỏe phù đổng|||\r\n|3|Giải thể thao học sinh tỉnh Đồng Tháp|||\r\n|4|Sáng tạo thanh thiếu niên nhi đồng|||\r\n|5|Khoa học kỹ thuật|||\r\n|6|Vẽ tranh |||\r\n|7|<p>Phong trào khác:</p><p>...............................</p><p>...............................</p>|||\r\n|8|<p>Thành tích khác:</p><p>...............................</p>|||\r\n\\- Họ và tên lớp trưởng: \r\n2\r\n\r\n",
      "tables": [
        {
          "id": "tbl-1788535567817-egt2",
          "title": "Danh sách học sinh chưa ra lớp (theo bảng thống kê)",
          "headers": [
            "TT",
            "Họ và tên học sinh",
            "Lớp năm học trước",
            "Nơi ở hiện nay (nếu có thông tin chi tiết càng tốt như ở đường nào, khúc nào, gần những chỗ nào dễ nhận dạng)",
            "Số điện thoại học sinh (nếu có)",
            "Số điện thoại phụ huynh (nếu có)",
            "Lý do chưa ra lớp (nếu biết)"
          ],
          "rows": [
            {
              "Nơi ở hiện nay (nếu có thông tin chi tiết càng tốt như ở đường nào, khúc nào, gần những chỗ nào dễ nhận dạng)": "",
              "Họ và tên học sinh": "",
              "Số điện thoại học sinh (nếu có)": "",
              "Số điện thoại phụ huynh (nếu có)": "",
              "Lý do chưa ra lớp (nếu biết)": "",
              "TT": "1",
              "Lớp năm học trước": ""
            },
            {
              "TT": "2",
              "Họ và tên học sinh": "",
              "Số điện thoại học sinh (nếu có)": "",
              "Số điện thoại phụ huynh (nếu có)": "",
              "Lý do chưa ra lớp (nếu biết)": "",
              "Lớp năm học trước": "",
              "Nơi ở hiện nay (nếu có thông tin chi tiết càng tốt như ở đường nào, khúc nào, gần những chỗ nào dễ nhận dạng)": ""
            },
            {
              "Họ và tên học sinh": "",
              "Nơi ở hiện nay (nếu có thông tin chi tiết càng tốt như ở đường nào, khúc nào, gần những chỗ nào dễ nhận dạng)": "",
              "Lý do chưa ra lớp (nếu biết)": "",
              "Số điện thoại học sinh (nếu có)": "",
              "Số điện thoại phụ huynh (nếu có)": "",
              "TT": "3",
              "Lớp năm học trước": ""
            },
            {
              "Nơi ở hiện nay (nếu có thông tin chi tiết càng tốt như ở đường nào, khúc nào, gần những chỗ nào dễ nhận dạng)": "",
              "TT": "4",
              "Số điện thoại học sinh (nếu có)": "",
              "Số điện thoại phụ huynh (nếu có)": "",
              "Lý do chưa ra lớp (nếu biết)": "",
              "Họ và tên học sinh": "",
              "Lớp năm học trước": ""
            },
            {
              "Lý do chưa ra lớp (nếu biết)": "",
              "Số điện thoại phụ huynh (nếu có)": "",
              "Họ và tên học sinh": "",
              "Nơi ở hiện nay (nếu có thông tin chi tiết càng tốt như ở đường nào, khúc nào, gần những chỗ nào dễ nhận dạng)": "",
              "Lớp năm học trước": "",
              "TT": "5",
              "Số điện thoại học sinh (nếu có)": ""
            }
          ]
        },
        {
          "headers": [
            "TT",
            "Cuộc thi",
            "Đạt giải",
            "Họ tên học sinh đạt giải"
          ],
          "id": "tbl-1788535567817-fpw0",
          "title": "Thông tin học sinh có thành tích về hội thi, phong trào",
          "rows": [
            {
              "TT": "1",
              "Đạt giải": "",
              "Cuộc thi": "Văn nghệ vòng tỉnh, vòng xã",
              "Họ tên học sinh đạt giải": ""
            },
            {
              "Đạt giải": "",
              "Cuộc thi": "Hội khỏe phù đổng",
              "TT": "2",
              "Họ tên học sinh đạt giải": ""
            },
            {
              "Đạt giải": "",
              "Họ tên học sinh đạt giải": "",
              "Cuộc thi": "Giải thể thao học sinh tỉnh Đồng Tháp",
              "TT": "3"
            },
            {
              "Họ tên học sinh đạt giải": "",
              "TT": "4",
              "Đạt giải": "",
              "Cuộc thi": "Sáng tạo thanh thiếu niên nhi đồng"
            },
            {
              "Đạt giải": "",
              "TT": "5",
              "Cuộc thi": "Khoa học kỹ thuật",
              "Họ tên học sinh đạt giải": ""
            },
            {
              "TT": "6",
              "Họ tên học sinh đạt giải": "",
              "Đạt giải": "",
              "Cuộc thi": "Vẽ tranh"
            },
            {
              "Họ tên học sinh đạt giải": "",
              "Cuộc thi": "Phong trào khác:",
              "Đạt giải": "",
              "TT": "7"
            },
            {
              "Họ tên học sinh đạt giải": "",
              "Đạt giải": "",
              "TT": "8",
              "Cuộc thi": "Thành tích khác:"
            }
          ]
        }
      ]
    },
    "academicYear": "2026-2027",
    "semester": "HK1",
    "targetRoles": [
      "teacher",
      "dept_head"
    ],
    "description": "Yêu cầu nộp báo cáo theo mẫu trực tuyến gồm 2 mục thông tin và 2 bảng số liệu. Thầy/Cô điền trực tiếp vào form trên hệ thống trước thời hạn.",
    "targetAudience": "homeroom_teachers",
    "createdAt": "2026-09-04T15:26:21.418Z",
    "allowMultipleSubmissions": false
  }
];
