# Sparkle Valley public launch, Tết 2027: plan

Made by the v1.07 helper "launch", 2 Nov 2026 AEDT. Materials only: nothing here has been posted, emailed, paid for or
sent to anyone. Every contact, post and payment waits for the owner.

Vietnamese version: [below](#ke-hoach-tieng-viet).

## The short version

- **Who for:** Vietnamese families in Australia with children aged 2 to 8 (main: Sydney and Melbourne).
- **The promise to parents:** no ads, no children's data, English and Vietnamese, plays offline. Read
  [Before we promise](#before-we-promise) first: two of the four need a check on launch day.
- **Where:** sparklevalley.au, in the browser, then "Add to Home Screen". No app store.
- **When:** launch week Mon 11 to Sun 17 Jan 2027 (owner's plan, `docs/plan-hoan-thien/KE-HOACH.md`), about three
  weeks before Tết (Sat 6 Feb 2027, Year of the Goat). Proposed launch day: **Sat 16 Jan 2027**, a weekend, when
  parents read the Facebook groups.
- **First channels (owner, 2 Nov 2026 AEDT):** weekend Vietnamese schools and the Sydney/Melbourne Facebook groups.

## Timetable (AEDT)

| When | What | Who |
|---|---|---|
| 7 to 18 Dec 2026 | v1.09 feature freeze. Owner reads every text in `channels/` and marks changes | Owner |
| 19 Dec 2026 | Christmas content (already scheduled) | Release |
| 20 Dec 2026 to 10 Jan 2027 | Make the three videos from `VIDEOS.md` (record voices, cut, covers). Print a test flyer | Release (videos), owner (print) |
| by Sun 3 Jan 2027 | Owner picks the launch date. Release sets it in Studio (Releases page, `publicLaunch`): the website shows "Coming soon" with days to go | Owner, Release |
| Mon 4 to Fri 8 Jan | Owner finds the contact list: Vietnamese schools (NSW Community Languages Schools list), Facebook group admins, fair organisers, SBS Tiếng Việt, libraries. Asks group admins whether a post is allowed | Owner |
| Mon 11 Jan | Email to schools (`channels/schools-email.md`), with the flyer attached | Owner |
| Tue 12 Jan | SBS pitch (`channels/sbs-pitch.md`) | Owner |
| Wed 13 Jan | Library email (`channels/libraries.md`) | Owner |
| **Sat 16 Jan** | **Launch day.** `LAUNCH-DAY.md`. Website says "Open now". Facebook post 1 in each group, video 1 | Owner, Release |
| Sat 23 Jan | Facebook post 2 (Tết in the valley) with video 2. Follow-up email to schools that did not answer | Owner |
| Sat 30 Jan to Sun 7 Feb | Tết fairs (Cabramatta, Bankstown, Footscray): flyer and the stall card (`channels/tet-fairs.md`). A paid stall only if the owner decides | Owner |
| Sat 6 Feb | Tết. Facebook post 3 (Chúc mừng năm mới) with video 3 | Owner |
| Sat 13 Feb | Look back: website visits (Studio Analytics), new devices, questions asked. Decide what to do next | Owner, Release |

School terms: weekend Vietnamese schools usually start their year in the first weeks of February, so the email goes out
in January while principals plan the year. Check each school's dates.

## Channels

| Channel | What we give them | File | Priority |
|---|---|---|---|
| Weekend Vietnamese schools (NSW Community Languages Schools, and Victorian community language schools) | Email to the principal, the flyer, a note for parents to forward | `channels/schools-email.md`, `channels/flyer.html` | 1 |
| Facebook groups, Sydney and Melbourne | Three posts (launch, Tết in the valley, Tết day), each in Vietnamese first then English, with a video | `channels/facebook.md` | 1 |
| Tết fairs: Cabramatta, Bankstown, Footscray | The flyer, a stall card, what to say in 20 seconds | `channels/tet-fairs.md` | 2 |
| SBS Tiếng Việt | A short pitch for a story or interview | `channels/sbs-pitch.md` | 2 |
| Libraries | Email to children's librarians (storytime, school holidays, bilingual collections) | `channels/libraries.md` | 3 |
| Short videos (15 to 30 s) | Three scripts with shot lists | `VIDEOS.md` | with each post |

## Who does what

- **Owner:** decides the date; reads and approves every text; is the only one who contacts anyone (emails, posts,
  phone calls, SBS); decides anything paid (stalls, printing in bulk, paid posts); answers parents' questions.
- **Release chat:** sets the `publicLaunch` date in Studio; checks the website banner; makes the videos from
  `VIDEOS.md`; ships any fix with the owner's "yes, deploy"; reads the numbers after launch.
- **Analytics & Infra:** the privacy point below, before launch day.
- **Helper chats:** prepare and update these materials only.

## Before we promise

The four promises must be true on the day. Checked against v1.06 on 2 Nov 2026 AEDT:

| Promise | True today? | What is needed |
|---|---|---|
| Bilingual | Yes: every word in English and Vietnamese, spoken aloud | Nothing |
| Plays offline | Yes, after the first visit; voices offline after "Keep all voices on this device" | Say that one step in the text (done) |
| No ads | Yes while Studio's Ads page has "Show ads" off. The family-ads feature (`js/ads.js`) would show to every player | Keep it off; it is on the launch-day checklist |
| No children's data | **Not yet.** Analytics (`js/players.ts`) sends each child's first name, age group, games, places, minutes, and the town worked out from the connection, until a grown-up turns Analytics off | Owner decides: (a) the public build sends no first names and no town, or Analytics is off until a parent turns it on; or (b) the promise becomes "no accounts, no sign-up, nothing sold or used for ads". Until then the texts here use a safe wording (below) |

**Safe wording used in the texts** (true today): "No ads. No accounts or sign-up. Nothing about your child is sold or
used for advertising. Bilingual. Plays offline." When the owner settles the data point, the line
"No children's data collected" / "Không thu thập dữ liệu của trẻ" can be put back in each text (marked `[DATA]`).

---

<a id="ke-hoach-tieng-viet"></a>
# Kế hoạch ra mắt Thung Lũng Lấp Lánh dịp Tết 2027

Chỉ là tài liệu chuẩn bị: chưa đăng, chưa gửi, chưa trả tiền, chưa liên hệ ai. Mọi liên hệ, bài đăng và khoản chi đều chờ
anh.

## Tóm tắt

- **Đối tượng:** gia đình người Việt ở Úc có con 2 đến 8 tuổi (chủ yếu Sydney và Melbourne).
- **Lời hứa với bố mẹ:** không quảng cáo, không thu dữ liệu của trẻ, song ngữ, chơi được offline. Xem mục
  "Trước khi hứa": hai lời hứa cần kiểm tra lại vào ngày ra mắt.
- **Chơi ở đâu:** sparklevalley.au trên trình duyệt, rồi "Thêm vào màn hình chính". Không có app trên store.
- **Khi nào:** tuần ra mắt thứ Hai 11 đến Chủ nhật 17/1/2027, khoảng ba tuần trước Tết (thứ Bảy 6/2/2027, năm Đinh Mùi).
  Đề xuất ngày ra mắt: **thứ Bảy 16/1/2027**, cuối tuần, lúc bố mẹ hay đọc nhóm Facebook.
- **Kênh làm trước (anh chọn, 2/11/2026):** trường Việt ngữ cuối tuần và nhóm Facebook ở Sydney và Melbourne.

## Lịch (AEDT)

| Khi nào | Việc | Ai |
|---|---|---|
| 7 đến 18/12/2026 | Đóng băng tính năng v1.09. Anh đọc mọi bài trong `channels/` và ghi chỗ cần sửa | Anh |
| 19/12/2026 | Nội dung Giáng sinh (đã lên lịch) | Release |
| 20/12/2026 đến 10/1/2027 | Làm ba video theo `VIDEOS.md`. In thử tờ rơi | Release (video), anh (in) |
| trước Chủ nhật 3/1/2027 | Anh chọn ngày ra mắt. Release đặt ngày trong Studio (trang Releases, `publicLaunch`): trang web ghi "Sắp ra mắt" và số ngày còn lại | Anh, Release |
| 4 đến 8/1 | Anh tìm danh sách liên hệ: trường Việt ngữ, quản trị nhóm Facebook, ban tổ chức hội chợ, SBS Tiếng Việt, thư viện. Hỏi quản trị nhóm có được đăng không | Anh |
| thứ Hai 11/1 | Gửi email cho các trường, kèm tờ rơi | Anh |
| thứ Ba 12/1 | Gửi thư giới thiệu cho SBS | Anh |
| thứ Tư 13/1 | Gửi email cho thư viện | Anh |
| **thứ Bảy 16/1** | **Ngày ra mắt.** Làm theo `LAUNCH-DAY.md`. Trang web ghi "Đã mở". Bài Facebook 1, video 1 | Anh, Release |
| thứ Bảy 23/1 | Bài Facebook 2 (Tết trong thung lũng), video 2. Nhắc lại các trường chưa trả lời | Anh |
| 30/1 đến 7/2 | Hội chợ Tết (Cabramatta, Bankstown, Footscray): tờ rơi và tấm thẻ ở gian hàng. Gian hàng có trả tiền chỉ khi anh quyết | Anh |
| thứ Bảy 6/2 | Tết. Bài Facebook 3 (Chúc mừng năm mới), video 3 | Anh |
| thứ Bảy 13/2 | Nhìn lại: lượt vào trang web, máy mới, câu hỏi của bố mẹ. Quyết định bước tiếp | Anh, Release |

Trường Việt ngữ cuối tuần thường khai giảng vào mấy tuần đầu tháng 2, nên gửi email trong tháng 1 khi các thầy cô đang
lên kế hoạch năm học. Hỏi lại ngày của từng trường.

## Kênh

| Kênh | Gửi gì | File | Thứ tự |
|---|---|---|---|
| Trường Việt ngữ cuối tuần (NSW Community Languages Schools, và các trường ở Victoria) | Email cho hiệu trưởng, tờ rơi, lời nhắn để chuyển cho phụ huynh | `channels/schools-email.md`, `channels/flyer.html` | 1 |
| Nhóm Facebook ở Sydney và Melbourne | Ba bài (ra mắt, Tết trong thung lũng, ngày Tết), tiếng Việt trước rồi tiếng Anh, kèm video | `channels/facebook.md` | 1 |
| Hội chợ Tết Cabramatta, Bankstown, Footscray | Tờ rơi, thẻ gian hàng, lời giới thiệu 20 giây | `channels/tet-fairs.md` | 2 |
| SBS Tiếng Việt | Thư giới thiệu ngắn cho một bài hoặc buổi phỏng vấn | `channels/sbs-pitch.md` | 2 |
| Thư viện | Email cho thủ thư thiếu nhi | `channels/libraries.md` | 3 |
| Video ngắn 15 đến 30 giây | Ba kịch bản kèm danh sách cảnh | `VIDEOS.md` | đi cùng mỗi bài |

## Ai làm gì

- **Anh:** chọn ngày; đọc và duyệt mọi bài; là người duy nhất liên hệ (email, đăng bài, gọi điện, SBS); quyết mọi khoản
  chi (gian hàng, in số lượng lớn, quảng cáo trả tiền); trả lời câu hỏi của bố mẹ.
- **Release:** đặt ngày `publicLaunch` trong Studio; kiểm tra dải thông báo trên trang web; làm video theo `VIDEOS.md`;
  phát hành bản sửa khi anh nói "yes, deploy"; đọc số liệu sau ra mắt.
- **Analytics & Infra:** điểm về dữ liệu ở dưới, trước ngày ra mắt.
- **Các chat phụ:** chỉ chuẩn bị và cập nhật tài liệu này.

## Trước khi hứa

| Lời hứa | Hôm nay đúng chưa? | Cần gì |
|---|---|---|
| Song ngữ | Đúng | Không |
| Chơi offline | Đúng, sau lần vào đầu tiên; giọng đọc offline sau khi bấm "Lưu tất cả giọng đọc vào máy" | Đã ghi bước này trong các bài |
| Không quảng cáo | Đúng khi trang Quảng cáo trong Studio để tắt "Show ads". Nếu bật, quảng cáo hiện cho mọi người chơi | Giữ tắt; có trong danh sách ngày ra mắt |
| Không thu dữ liệu của trẻ | **Chưa đúng.** Phần Phân tích (`js/players.ts`) gửi tên gọi của từng bé, nhóm tuổi, trò chơi, nơi đã đến, số phút và thành phố (đoán từ mạng), cho tới khi người lớn tắt Phân tích | Anh quyết: (a) bản công khai không gửi tên và thành phố, hoặc Phân tích tắt sẵn cho tới khi bố mẹ bật; hoặc (b) đổi lời hứa thành "không tài khoản, không đăng ký, không bán hay dùng thông tin của bé cho quảng cáo". Trong lúc chờ, các bài dùng câu an toàn ở dưới |

**Câu an toàn dùng trong các bài** (đúng hôm nay): "Không quảng cáo. Không cần tài khoản hay đăng ký. Không bán hay dùng
thông tin của bé cho quảng cáo. Song ngữ. Chơi được offline." Khi anh quyết xong, câu "Không thu thập dữ liệu của trẻ"
có thể đưa lại vào từng bài (chỗ đánh dấu `[DATA]`).
