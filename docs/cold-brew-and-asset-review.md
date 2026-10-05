# Nhập hàng cold brew và trạng thái rà soát hình ảnh

## Phạm vi đã triển khai
- `index.html`: giữ HTML/CSS/JavaScript thuần, không thêm framework/dependency.
- Gợi ý kho tính cà phê và nước cho cả mẻ ủ lẫn đồ uống khác; dùng tồn kho còn hạn.
- Hiện số mẻ, lượng thành phẩm, nguyên liệu ủ và mức cà phê/nước cần giữ sau ủ.
- Xác nhận “Nhập & ủ đủ dự phòng” hoặc “Chỉ nhập hàng”. Có nút ủ toàn bộ phần thiếu khi nguyên liệu đã sẵn.
- Mua và ủ xác thực trên bản sao trước khi ghi kết quả. Thiếu tiền/nguyên liệu không làm mất tiền hay nhập/ủ một phần.
- Giao trễ chỉ đặt hàng, chưa tạo cold brew; giao diện thông báo cần nhận hàng và ủ trước ca.
- Không thay công thức 2 phần cà phê + 2 phần nước → 4 phần cold brew, giá, thời gian, điều kiện mở khóa hay schema save.
- Thêm 12 kiểm tra trong BeanAroundColdProcurementChecks.

## Rà soát repo
Repo có index.html (entry hiện hành), Index.html (bản cũ, không sửa), README.md và 8 PNG ở thư mục gốc. Không có AGENTS.md, package.json, cấu hình build/lint/typecheck hay thư mục dependency trong cây được GitHub trả về (truncated=false).

## Ảnh: chưa thể kiểm tra nội dung thị giác
GitHub fetch_file(base64) trả nội dung rỗng cho PNG lớn; fetch_blob trả UnicodeDecodeError khi giải mã PNG thành UTF-8. Công cụ web nhận URL của bốn ảnh đầu nhưng chỉ trả placeholder ImageDisplayed; không trả ảnh để quan sát. Screenshot web không hỗ trợ PNG. Vì vậy không ảnh nào được coi là đã xem hoặc đã phân loại thành máy/trang trí/screenshot.

| Đường dẫn | Dung lượng nguồn | Nội dung thực tế | Cách dùng / vị trí |
| --- | ---: | --- | --- |
| `285D7DB0-A72A-47FD-877D-6FEEC12C8C67.png` | 1791525 byte | Chưa xác minh được | Chưa tích hợp |
| `91BED739-885C-4EDE-86D0-C0230E711585.png` | 3315286 byte | Chưa xác minh được | Chưa tích hợp |
| `BD22ED46-9766-45FE-8155-74867785CF30.png` | 3344370 byte | Chưa xác minh được | Chưa tích hợp |
| `C333FA76-192C-4195-A0E1-AA4F2B72DE22.png` | 1503025 byte | Chưa xác minh được | Chưa tích hợp |
| `CB7BB580-041C-4C73-98D0-92DFF4E1C919.png` | 3353962 byte | Chưa xác minh được | Chưa tích hợp |
| `DA77149F-17B9-47FD-B76F-2A676CCC2B49.png` | 1560973 byte | Chưa xác minh được | Chưa tích hợp |
| `F6392125-E309-4D22-8B88-3CA7F512D236.png` | 1945036 byte | Chưa xác minh được | Chưa tích hợp |
| `FA06BAA5-36A1-4B9A-B9B3-CA0F43A553B5.png` | 2277377 byte | Chưa xác minh được | Chưa tích hợp |

Chưa thể xác nhận Sanremo Cafe Racer, grinder, blender, juicer hay pour-over nằm trong file nào. Không suy đoán theo tên UUID; không sửa, crop hoặc ghi đè ảnh gốc. Không thay artwork bằng emoji hay hình tượng trưng. Phần nâng cấp hình ảnh **chưa hoàn thành**. Cần cung cấp ảnh đính kèm có thể xem hoặc môi trường đọc ảnh/trình duyệt để tiếp tục.

## Kiểm thử thực tế
- Đọc toàn bộ entry hiện hành và kiểm tra cú pháp JavaScript bằng V8.
- Baseline: 931/931 kiểm tra logic đạt với RNG cố định seed 123456789.
- Sau sửa: 943/943 đạt với cùng RNG; 12 bài mới bao gồm reserve sau ủ, tồn kho còn hạn/hết hạn, đủ/thiếu vốn, không ủ trùng, chi phí thực, giao trễ, save/load và nhu cầu online cao.
- Một lần chạy RNG mặc định gặp bài cũ “enabled waits for real production timers” thất bại; chạy riêng lại đạt. Baseline và bản mới cùng đạt khi cố định RNG. Không sửa logic nhân viên trong thay đổi này.
- Không có công cụ chạy trình duyệt/Safari trong môi trường này. Chưa xác minh thao tác UI thực tế, screenshot trước/sau hoặc các viewport 375×812, 390×844, 430×932, 1280×800.
- Không chạy build/lint/typecheck: repo không có cấu hình cho các bước đó.
- Không merge, không chủ động deploy production.
