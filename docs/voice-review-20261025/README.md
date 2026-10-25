# FPT Neo: Lê Minh listening test / Nghe thử Lê Minh

Owner selected Lê Minh (`leminh`), not Ban Mai. One short paid API request is authorized to verify the connection, secret and MP3 output before any full-pack work. / Chủ game chọn Lê Minh (`leminh`), không phải Ban Mai. Chỉ gọi API một lần với câu ngắn để kiểm tra kết nối, secret và MP3 trước khi làm cả gói.

- API: `https://token-api.fpt.ai/v1/audio/speech`
- Model: `FPT.AI-VITs`; voice: `leminh`; speed: `1`.
- Credentials: repository Actions secret `FPT_API_KEY`, used only in the recording step. / Khóa chỉ dùng trong bước thu trên GitHub Actions.
- Sample: “Xin chào! Chào mừng con đến Thung Lũng Lấp Lánh.”
- After a successful run: [listen / nghe](leminh-test.mp3), [request and output metadata / thông tin bản thu](result.json), [MP3 decode check / kiểm tra MP3](audio-check.json).

Tooling and outputs stay on `work/fpt-voice-samples-20261025`. No game files, existing recordings, manifest, release version or live site are changed. Full Vietnamese replacement and voice/default policy are not approved by this test. / Công cụ và mẫu nằm trên nhánh riêng. Không đổi game, bản thu cũ, manifest, phiên bản hay trang đang chạy. Lần thử này chưa duyệt thay cả gói tiếng Việt hoặc chính sách giọng mặc định.

Local verification before the real request: 237 unit tests pass (including five FPT request/error tests); all eight remaining changed-file checks pass; the new tool also passes standalone strict TypeScript checking. Workflow YAML and the branch/secret binding were checked. / Kiểm tra cục bộ: 237 unit test và tám kiểm tra liên quan còn lại đều đạt; công cụ mới đạt kiểm tra TypeScript strict. YAML và liên kết nhánh/secret đã được kiểm tra.
