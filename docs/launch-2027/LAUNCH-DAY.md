# Launch day checklist (Sat 16 Jan 2027, or the date the owner picks)

Made by the v1.07 helper "launch", 2 Nov 2026 AEDT. Times AEDT. Tick each line on the day. Vietnamese below.

## A week before (by Sat 9 Jan)

- [ ] **Owner decided the children's data point** (`PLAN.md`, "Before we promise"). If the public build changes, it
      shipped with the owner's "yes, deploy". Then every `[DATA]` mark in `channels/` and `VIDEOS.md` is replaced with
      the final wording.
- [ ] **Launch date set in Studio:** Studio, the Releases page ("Ra mắt"), the line "Public launch date"
      (`publicLaunch`): switch on, start date = launch day. Saved (live at once).
- [ ] **Website says "Coming soon":** open sparklevalley.au/home/ on a phone: the yellow banner at the top reads
      "Coming soon: 16 January 2027 (7 days to go)" in English and "Sắp ra mắt: 16 tháng 1, 2027 (còn 7 ngày)" after
      switching to Tiếng Việt (`home/launch.ts`). Nothing shows if the date is not set.
- [ ] **Videos ready** (`VIDEOS.md`): three, each in Vietnamese and English, with covers.
- [ ] **Flyer printed** and checked (`channels/flyer.html`, print to PDF, A4).
- [ ] **Group admins asked** whether a post is allowed (each Facebook group).

## The day before

- [ ] Studio, Ads page: **"Show ads in the game" is unticked** (the promise "no ads").
- [ ] The live game opens on an iPhone, an iPad and an Android phone; Tap to start works; English and Tiếng Việt both
      speak; a game opens and closes.
- [ ] Offline: open the game, keep the voices (Grown-ups, Sound and voices, "Keep all voices on this device"), turn on
      flight mode, reload: the game still plays.
- [ ] The version on the title screen is the one Release last shipped; no open bug labelled for launch.
- [ ] Netlify: the site is up; the latest deploy is green.

## On the day

- [ ] From midnight (Sydney date) the website banner says **"Sparkle Valley is open! Come and play."** with a
      **Play now** button / "Thung Lũng Lấp Lánh đã mở! Mời cả nhà vào chơi." with **Chơi ngay**. Tap Play now: the
      game opens.
- [ ] Facebook post 1 in each allowed group (`channels/facebook.md`), video 3 attached. Owner only.
- [ ] Watch the comments in the first hours; answer with "Common questions".
- [ ] Evening: Studio Analytics shows new devices; note the number for the look-back on 13 Feb.

## Store text

There is no app store listing: the game is played at sparklevalley.au and added to the home screen. Nothing to submit
for this launch. The text the phone shows when the game is added (`manifest.webmanifest`): name "Sparkle Valley · Thung
Lũng Lấp Lánh", description "An open-world adventure for young children, in English and Vietnamese." The same line is the
page description in `index.html`. Both are fine for launch; if a store listing is ever wanted (owner's decision, paid),
start from the flyer text.

## If something goes wrong

- The banner shows the wrong date: fix the date in Studio Releases (live at once, no deploy).
- The game does not start for families: Release ships the fix with the owner's "yes, deploy"; the posts can wait a day.
- Turn off the banner: switch "Public launch date" off in Studio Releases. The game itself is never held back.

---

# Danh sách việc ngày ra mắt (thứ Bảy 16/1/2027, hoặc ngày anh chọn)

## Trước một tuần (trước thứ Bảy 9/1)

- [ ] **Anh đã quyết điểm dữ liệu của trẻ** (`PLAN.md`, "Trước khi hứa"). Nếu bản công khai thay đổi, đã phát hành với
      "yes, deploy". Rồi thay mọi chỗ `[DATA]` trong `channels/` và `VIDEOS.md` bằng câu cuối cùng.
- [ ] **Đặt ngày ra mắt trong Studio:** Studio, trang Ra mắt (Releases), dòng "Ngày ra mắt chính thức"
      (`publicLaunch`): bật, ngày bắt đầu = ngày ra mắt. Đã lưu (có hiệu lực ngay).
- [ ] **Trang web ghi "Sắp ra mắt":** mở sparklevalley.au/home/ trên điện thoại: dải vàng trên cùng ghi "Sắp ra mắt: 16
      tháng 1, 2027 (còn 7 ngày)" khi chọn Tiếng Việt, và tiếng Anh tương ứng.
- [ ] **Ba video xong**, mỗi video có bản tiếng Việt và tiếng Anh, có ảnh bìa.
- [ ] **Đã in tờ rơi** và kiểm tra.
- [ ] **Đã hỏi quản trị nhóm Facebook** có được đăng không.

## Hôm trước

- [ ] Studio, trang Quảng cáo: **bỏ chọn "Hiện quảng cáo trong game"** (lời hứa không quảng cáo).
- [ ] Game chạy trên iPhone, iPad và một máy Android; bấm Bắt đầu được; tiếng Anh và tiếng Việt đều đọc; mở và đóng một
      trò chơi.
- [ ] Offline: lưu giọng đọc (Người lớn, Âm thanh và giọng nói, "Lưu tất cả giọng đọc vào máy"), bật chế độ máy bay, tải
      lại: game vẫn chơi được.
- [ ] Số phiên bản ở màn hình đầu là bản Release vừa phát hành; không còn lỗi mở nào gắn cho ra mắt.
- [ ] Netlify: trang đang chạy, lần deploy mới nhất màu xanh.

## Trong ngày

- [ ] Từ nửa đêm (giờ Sydney) dải thông báo ghi **"Thung Lũng Lấp Lánh đã mở! Mời cả nhà vào chơi."** với nút **Chơi
      ngay**. Bấm thử: game mở.
- [ ] Đăng bài Facebook 1 ở mỗi nhóm đã cho phép, kèm video 3. Chỉ anh đăng.
- [ ] Theo dõi bình luận trong mấy giờ đầu; trả lời theo "Câu hỏi thường gặp".
- [ ] Buổi tối: xem số máy mới trong Studio Analytics, ghi lại để nhìn lại ngày 13/2.

## Chữ trên store

Không có app trên store: chơi ở sparklevalley.au và thêm vào màn hình chính, nên không có gì để nộp. Tên và mô tả khi
thêm vào màn hình chính lấy từ `manifest.webmanifest` và đã ổn. Nếu sau này muốn lên store (anh quyết, có trả phí), bắt
đầu từ chữ trên tờ rơi.

## Nếu có trục trặc

- Dải thông báo sai ngày: sửa ngày trong Studio Ra mắt (có hiệu lực ngay, không cần deploy).
- Game không mở được: Release phát hành bản sửa khi anh nói "yes, deploy"; bài đăng có thể chờ một ngày.
- Tắt dải thông báo: tắt "Ngày ra mắt chính thức" trong Studio Ra mắt. Bản thân game không bao giờ bị khoá.
