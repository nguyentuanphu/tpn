# FPT Neo: Lê Minh listening test / Nghe thử Lê Minh

Owner selected Lê Minh (`leminh`), not Ban Mai. One short paid API request is authorized to verify the connection, secret and MP3 output before any full-pack work. / Chủ game chọn Lê Minh (`leminh`), không phải Ban Mai. Chỉ gọi API một lần với câu ngắn để kiểm tra kết nối, secret và MP3 trước khi làm cả gói.

- API: `https://token-api.fpt.ai/v1/audio/speech`
- Model: `FPT.AI-VITs`; voice: `leminh`; speed: `1`.
- Credentials: repository Actions secret `FPT_API_KEY`, used only in the recording step. / Khóa chỉ dùng trong bước thu trên GitHub Actions.
- Sample: “Xin chào! Chào mừng con đến Thung Lũng Lấp Lánh.”
- After a successful run: [listen / nghe](leminh-test.mp3), [request and output metadata / thông tin bản thu](result.json), [MP3 decode check / kiểm tra MP3](audio-check.json).

Tooling and outputs stay on `work/fpt-voice-samples-20261025`. No game files, existing recordings, manifest, release version or live site are changed. Full Vietnamese replacement and voice/default policy are not approved by this test. / Công cụ và mẫu nằm trên nhánh riêng. Không đổi game, bản thu cũ, manifest, phiên bản hay trang đang chạy. Lần thử này chưa duyệt thay cả gói tiếng Việt hoặc chính sách giọng mặc định.

Local verification before the real request: 237 unit tests pass (including five FPT request/error tests); all eight remaining changed-file checks pass; the new tool also passes standalone strict TypeScript checking. Workflow YAML and the branch/secret binding were checked. / Kiểm tra cục bộ: 237 unit test và tám kiểm tra liên quan còn lại đều đạt; công cụ mới đạt kiểm tra TypeScript strict. YAML và liên kết nhánh/secret đã được kiểm tra.

First real run: [40167805173](https://github.com/nguyentuanphu/tpn/actions/runs/40167805173) reached FPT and returned HTTP success, but not raw MP3 bytes; no sample was saved. The test now explicitly requests MP3 and can download a single signed link from the FPT storage host in the owner-provided example, without forwarding authorization. Other hosts are rejected. A follow-up test is required; the actual response format is not yet confirmed. / Lần gọi đầu trả HTTP thành công nhưng chưa nhận MP3 trực tiếp. Công cụ đã thêm yêu cầu MP3 và hỗ trợ liên kết lưu trữ FPT; chưa khẳng định lần thử sau đã thành công.

Follow-up run [40168074128](https://github.com/nguyentuanphu/tpn/actions/runs/40168074128): the authenticated Lê Minh recording step succeeded, but the runner had no ffprobe and stopped before saving the audio artifact. Decoder installation now happens before the paid call, and the artifact is retained whenever recording succeeds. A final short test will verify decoding and deliver the clip. The updated tool passed 240 unit tests and standalone strict TypeScript checking. / Lần thử tiếp đã nhận MP3; runner thiếu ffprobe nên chưa lưu được mẫu. Đã sửa bước cài bộ giải mã và giữ tệp nếu các bước sau lỗi.
