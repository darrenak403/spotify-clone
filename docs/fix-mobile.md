Giao diện hiện tại có phong cách dark music app khá ổn, nhưng trên mobile đang giống **giao diện desktop bị thu nhỏ**. Vấn đề lớn nhất là sidebar chiếm quá nhiều chiều ngang, danh sách bài hát quá lớn và khu vực điều khiển nhạc chưa tận dụng tốt không gian.

## 1. Bỏ sidebar bên trái trên mobile

Sidebar hiện tại chiếm gần 20% chiều ngang màn hình, khiến nội dung chính bị bó hẹp. Trên mobile nên thay bằng **bottom navigation**:

```text
Home      Search      Library      Friends/Profile
⌂          ⌕            ♫               ◯
```

Gợi ý 4 tab:

* Home
* Search
* Library
* Profile hoặc Friends

Các playlist đang nằm dọc bên trái có thể chuyển thành section ngang trong trang Home:

```text
Your playlists
[Cover] [Cover] [Cover] [Cover]
```

Cho phép vuốt ngang để xem thêm.

---

## 2. Làm lại header gọn hơn

Header hiện tại hơi cao và có quá nhiều thành phần rời rạc.

Nên đổi thành:

```text
[Evon logo]                      [Search] [Avatar]

Good afternoon, Đạt
What do you want to listen to?
```

Điều chỉnh:

* Header cao khoảng `56–64px`.
* Logo app đặt bên trái.
* Icon grid có thể bỏ hoặc chuyển vào trang Library.
* Nút đăng xuất không nên nằm trực tiếp trên header; đưa vào trang Profile hoặc menu avatar.
* Avatar khoảng `36–40px`.
* Tiêu đề `Good afternoon` khoảng `26–30px`, không cần quá lớn.

---

## 3. Giảm chiều cao phần giới thiệu

Phần:

> Stream trending songs, curated playlists and albums for free on DMusic.

đang chiếm khá nhiều diện tích đầu màn hình. Trên mobile có thể:

* Rút còn một dòng.
* Dùng chữ `14–16px`.
* Hoặc bỏ hoàn toàn vì người dùng đã biết đây là ứng dụng nghe nhạc.

Ví dụ:

```text
Good afternoon, Đạt
Discover music made for your mood.
```

---

## 4. Không nên dùng card lớn cho mọi bài hát

Danh sách bài hát hiện tại có:

* Card cao.
* Khoảng cách giữa các bài lớn.
* Nền card gần giống nền trang.
* Không có nút thao tác cho từng bài.

Nên chuyển thành dạng song row compact:

```text
[56x56]  Neon Tokyo                  ⋮
         Future Pulse               3:42
```

Thông số phù hợp:

* Cover: `52–60px`.
* Chiều cao mỗi dòng: `68–76px`.
* Khoảng cách giữa các dòng: `6–8px`.
* Tên bài: `16px`, semibold.
* Nghệ sĩ: `13–14px`, màu xám.
* Thêm nút `⋮` để mở menu:

  * Add to playlist
  * Add to queue
  * View artist
  * Share

Không nhất thiết mỗi bài phải có một card nền riêng. Có thể dùng nền trong suốt và chỉ đổi màu khi đang phát.

---

## 5. Tạo thứ bậc nội dung cho trang Home

Hiện tại trang gần như chỉ có một danh sách bài hát. Home music app nên chia thành các section rõ ràng:

```text
Good afternoon

Recently played
[Album] [Album] [Album]

Made for you
[Large playlist cards → horizontal scroll]

Trending now
[Compact song list]

New releases
[Album] [Album] [Album]
```

Ưu tiên:

1. Recently played
2. Made for you
3. Trending songs
4. New releases
5. Popular artists

Như vậy giao diện sẽ giống một ứng dụng nghe nhạc thực tế hơn và không bị đơn điệu.

---

## 6. Làm lại thanh phát nhạc phía dưới

Thanh phát nhạc hiện tại quá cao nhưng lại chỉ có ba nút điều khiển. Trên mobile nên dùng **mini player** nằm ngay trên bottom navigation:

```text
┌──────────────────────────────────┐
│ [Cover] Neon Tokyo        ▷   ≡ │
│         Future Pulse             │
│ ━━━━━━━━━━━━━━━                  │
└──────────────────────────────────┘
```

Mini player nên có:

* Ảnh album `44–48px`.
* Tên bài và nghệ sĩ.
* Nút Play/Pause.
* Nút Queue hoặc Next.
* Thanh progress mỏng ở mép trên hoặc dưới.
* Chiều cao khoảng `64–72px`.

Khi nhấn vào mini player, mở trang **Now Playing full screen**:

```text
∨                       ⋮

        [Large album cover]

          Neon Tokyo
         Future Pulse

────────────●──────────
1:24                   3:42

   Shuffle   Previous   Play   Next   Repeat

        Lyrics     Queue     Device
```

---

## 7. Xử lý nút tròn màu xanh

Nút floating màu xanh ở góc phải hiện chưa rõ chức năng và đang che nội dung.

Nếu đó là chức năng bạn bè:

* Đưa vào bottom navigation với tên `Friends`.
* Hoặc đặt trong header dưới dạng icon nhỏ.
* Không nên dùng floating button trừ khi đây là hành động chính như `Create playlist`.

Nếu giữ floating button:

* Kích thước khoảng `52–56px`.
* Cách cạnh phải `16px`.
* Phải nằm phía trên mini player.
* Có tooltip hoặc label rõ ràng.

---

## 8. Giảm số lớp container

Hiện tại có quá nhiều lớp:

```text
Viền ngoài
→ nền app
→ sidebar card
→ content card
→ song card
```

Điều này làm giao diện hơi nặng và giống dashboard quản trị hơn music app.

Nên dùng:

* Một background chính: `#0F0F11`.
* Surface chính: `#18181B`.
* Card nổi bật: `#222226`.
* Không cần viền đen dày bên ngoài.
* Chỉ dùng border nhẹ: `rgba(255,255,255,0.06)`.

---

## 9. Điều chỉnh màu sắc

Màu xanh hiện tại khá nổi nhưng chỉ xuất hiện ở nút Friends, nên chưa tạo thành hệ thống màu thương hiệu.

Có thể dùng accent xanh cho:

* Nút Play.
* Bài hát đang phát.
* Thanh progress.
* Tab đang active.
* Một số badge hoặc trạng thái hover.

Ví dụ:

```css
--background: #0d0d0f;
--surface: #18181b;
--surface-hover: #242428;
--text-primary: #fafafa;
--text-secondary: #a1a1aa;
--accent: #00d29a;
--border: rgba(255, 255, 255, 0.06);
```

Không nên sử dụng accent quá nhiều; chỉ nhấn vào hành động chính.

---

## 10. Khoảng cách và bo góc

Một hệ thống spacing hợp lý cho mobile:

```text
Padding toàn trang:       16px
Khoảng cách section:      24–32px
Khoảng cách card:         10–12px
Bo góc album/card:        12–16px
Bo góc button:            12px hoặc hình tròn
```

Hiện tại sidebar và các container bo góc khá lớn. Trên mobile nên giảm để giao diện gọn hơn.

---

## 11. Cấu trúc mobile đề xuất

```text
┌──────────────────────────────┐
│ Evon                   ⌕  ◯ │
│                              │
│ Good afternoon, Đạt          │
│ Discover your next favorite  │
│                              │
│ Recently played       See all│
│ [Album] [Album] [Album] →    │
│                              │
│ Made for you                 │
│ ┌──────────┐ ┌──────────┐ →  │
│ │ Playlist │ │ Playlist │    │
│ └──────────┘ └──────────┘    │
│                              │
│ Trending now          See all│
│ [img] Song name          ⋮   │
│       Artist                 │
│ [img] Song name          ⋮   │
│       Artist                 │
│                              │
├──────────────────────────────┤
│ [img] Song – Artist    ▶  ≡ │
├──────────────────────────────┤
│  Home   Search  Library  Me  │
└──────────────────────────────┘
```

## Thứ tự nên sửa trước

1. Bỏ sidebar và chuyển sang bottom navigation.
2. Tạo mini player có thông tin bài hát.
3. Thu nhỏ song item.
4. Chia Home thành các section cuộn ngang.
5. Đơn giản hóa header.
6. Bỏ nút logout khỏi màn hình chính.
7. Đồng bộ màu xanh accent cho trạng thái active và playback.

Sau khi sửa theo cấu trúc này, app sẽ có cảm giác gần với Spotify, Apple Music hoặc YouTube Music hơn, nhưng vẫn giữ được phong cách dark tối giản riêng.
