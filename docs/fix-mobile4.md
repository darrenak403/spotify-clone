Hiện tại có hai vấn đề chính:

1. Bottom navigation đang là một thanh phẳng toàn chiều rộng, hơi giống giao diện web responsive.
2. Các section có nhiều card nhưng container đang **cắt nội dung** thay vì tạo vùng cuộn ngang độc lập.

Dùng prompt dưới đây để agent sửa. Giao diện vẫn sử dụng hoàn toàn tiếng Anh.

```text
Redesign the mobile bottom navigation and fix horizontal swiping for all music sections.

IMPORTANT

- All user-facing UI text must remain in English.
- Preserve all current API calls, authentication, routing, playback logic, and application state.
- Only refactor the mobile UI, responsive layout, and carousel behavior.
- Continue using Tailwind CSS.
- Keep the current dark theme and green accent color.
- Do not add a new UI library unless absolutely necessary.
- Optimize primarily for mobile widths from 320px to 430px.

==================================================
PART 1 — REDESIGN THE BOTTOM NAVIGATION
==================================================

CURRENT PROBLEM

The current bottom navigation:

- Uses a full-width rectangular bar.
- Occupies too much vertical space.
- Looks like a responsive website footer rather than a native mobile app.
- Has weak visual separation between active and inactive tabs.
- Uses very small icons.
- Does not feel visually connected to the mini player.

Replace it with a floating rounded navigation dock.

TARGET DESIGN

Create a floating bottom navigation with:

- Horizontal margin: 12–16px.
- Rounded pill/card shape.
- Height: approximately 64–68px.
- Dark elevated background.
- Subtle border.
- Soft backdrop blur.
- A small shadow.
- Safe-area support.
- Four navigation tabs:
  - Home
  - Search
  - Library
  - Friends

The navigation must not touch the left, right, or bottom edges directly.

It should visually float above the screen background.

Suggested structure:

<nav
  className="
    fixed inset-x-0 bottom-0 z-50
    px-3
    pb-[max(10px,env(safe-area-inset-bottom))]
  "
>
  <div
    className="
      mx-auto grid h-16 max-w-md grid-cols-4
      rounded-[22px]
      border border-white/[0.08]
      bg-zinc-900/95
      px-2
      shadow-[0_-8px_30px_rgba(0,0,0,0.35)]
      backdrop-blur-xl
    "
  >
    ...
  </div>
</nav>

Do not use a full-width flat rectangle for the navigation background.

NAVIGATION ITEM DESIGN

Each navigation item must contain:

- Icon.
- Label.
- Minimum touch target of 48x48px.
- Clear active and inactive states.
- Smooth transitions.
- `aria-current="page"` on the active item.

Icon size:

- 21–23px.
- Do not use icons smaller than 20px.

Label size:

- 11–12px.
- Medium font weight.
- One line only.

Inactive state:

- Icon and text: zinc-500 or zinc-400.
- Transparent background.

Active state:

Use a soft green pill around the icon and label.

Suggested active design:

<div
  className="
    flex min-w-0 flex-col items-center
    justify-center gap-1
    rounded-2xl
    bg-emerald-400/10
    text-emerald-400
  "
>
  <HomeIcon className="h-[22px] w-[22px]" />
  <span className="text-[11px] font-semibold">
    Home
  </span>
</div>

Alternative acceptable active design:

- Green icon.
- White active label.
- Small green dot or rounded indicator below the icon.
- Very subtle green background.

Do not use an oversized solid green block.

Do not animate the active tab with large movement.

Use only subtle transitions:

- `transition-colors`
- `duration-200`
- Optional `active:scale-95`

NAVIGATION COMPONENT

Create or refactor a reusable component:

MobileBottomNavigation

Suggested item model:

const navigationItems = [
  {
    label: "Home",
    href: "/",
    icon: Home,
  },
  {
    label: "Search",
    href: "/search",
    icon: Search,
  },
  {
    label: "Library",
    href: "/library",
    icon: Library,
  },
  {
    label: "Friends",
    href: "/friends",
    icon: Users,
  },
];

Determine the active tab from the current route.

Do not manually hardcode Home as active.

==================================================
PART 2 — REDESIGN THE MINI PLAYER
==================================================

The mini player must remain separate from the floating navigation.

Place the mini player directly above the navigation dock.

It should also use a floating elevated card style.

Target layout:

┌──────────────────────────────────┐
│ [Cover] Song title        Play   │
│         Artist                   │
└──────────────────────────────────┘

MINI PLAYER POSITION

Use:

- Fixed positioning.
- Horizontal margin: 12–16px.
- Rounded corners: 18–20px.
- Height: approximately 68–72px.
- Bottom position must account for:
  - Floating navigation height.
  - Gap between player and navigation.
  - iPhone safe area.

Suggested positioning:

bottom: calc(
  76px + env(safe-area-inset-bottom)
);

Suggested Tailwind:

<div
  className="
    fixed inset-x-3 z-40
    bottom-[calc(80px+env(safe-area-inset-bottom))]
  "
>
  ...
</div>

MINI PLAYER STYLE

Use:

- Background: elevated dark surface.
- Subtle border.
- Backdrop blur.
- Rounded-[18px].
- Soft shadow.
- Horizontal padding: 10–12px.

Album cover:

- 48x48px.
- Rounded 10px.
- `object-cover`.
- `shrink-0`.

Song information:

- Must use `min-w-0`.
- Song title uses `truncate`.
- Artist uses `truncate`.
- Title size: 14–15px.
- Artist size: 12–13px.

Play button:

- 44–48px.
- White background.
- Black icon.
- Circular.
- Touch target at least 44px.

Add a thin progress indicator at the top or bottom of the player:

- Height: 2px.
- Track: white at low opacity.
- Progress: green accent.
- Rounded ends.

Do not put the mini player inside the navigation component.

Keep them as separate fixed components.

==================================================
PART 3 — FIX HORIZONTAL SWIPING
==================================================

CURRENT PROBLEM

The sections show partially clipped cards, but the user cannot swipe horizontally to see the remaining items.

Affected sections include:

- Featured
- Made for you
- Trending
- Popular right now
- New releases
- Any other section containing multiple music cards

The cards appear to extend outside the viewport, but the container is either:

- Using `overflow-hidden`.
- Using a fixed-width grid.
- Missing `overflow-x-auto`.
- Being clipped by an ancestor.
- Using `flex-wrap`.
- Using incorrect width calculations.
- Capturing touch events incorrectly.
- Preventing horizontal touch gestures.

All music carousels must support native horizontal swipe gestures on mobile.

CAROUSEL REQUIREMENTS

Each horizontal section must use:

- `display: flex`
- `flex-wrap: nowrap`
- `overflow-x: auto`
- `overflow-y: visible`
- `touch-action: pan-x`
- `overscroll-behavior-x: contain`
- `scroll-snap-type: x mandatory` or proximity
- Hidden scrollbar
- Momentum scrolling on iOS
- Cards with `shrink-0`
- Proper horizontal gaps

Suggested reusable structure:

<section className="mt-9">
  <div className="flex items-center justify-between px-4">
    <h2 className="text-2xl font-bold text-white">
      Made for you
    </h2>

    <button className="text-sm font-medium text-zinc-400">
      See all
    </button>
  </div>

  <div
    className="
      mt-4 flex flex-nowrap gap-3
      overflow-x-auto overflow-y-visible
      px-4 pb-3
      snap-x snap-proximity
      overscroll-x-contain
      touch-pan-x
      [-webkit-overflow-scrolling:touch]
      [scrollbar-width:none]
      [&::-webkit-scrollbar]:hidden
    "
  >
    {items.map((item) => (
      <MusicCard
        key={item.id}
        item={item}
        className="shrink-0 snap-start"
      />
    ))}
  </div>
</section>

IMPORTANT:

Do not put this carousel inside a parent that clips horizontal scrolling.

Avoid ancestor classes such as:

- `overflow-hidden`
- `overflow-x-hidden`
- `pointer-events-none`
- `touch-none`
- `select-none` when it interferes with gestures

An outer page container may use `overflow-x-hidden` only if the internal carousel still has its own valid scrolling region.

Do not use `overflow-hidden` directly around the carousel viewport.

BODY VS CAROUSEL SCROLL

The body itself must not horizontally scroll.

Only individual music sections may scroll horizontally.

Root layout:

- `width: 100%`
- `max-width: 100vw`
- `overflow-x: hidden`

Carousel:

- `width: 100%`
- `max-width: 100%`
- `overflow-x: auto`

The page should remain fixed horizontally while the user swipes inside each section.

==================================================
PART 4 — FEATURED CAROUSEL
==================================================

Featured must display large horizontal cards.

Each Featured card should:

- Be wide enough to feel prominent.
- Show one complete card and a small preview of the next card.
- Never cut important text.
- Support swipe gestures.

Recommended card width:

For 320–359px:

width: calc(100vw - 48px);

For 360–430px:

width: calc(100vw - 64px);

Maximum width:

340px.

Minimum width:

270px.

Suggested class:

className="
  w-[calc(100vw-48px)]
  min-w-[270px]
  max-w-[340px]
  shrink-0
  snap-start
  rounded-2xl
"

At 375–390px, approximately one full card and 20–32px of the next card may be visible.

The next card preview must not expose partially readable text.

FEATURED CARD CONTENT

- Height: 108–120px.
- Image: 84–92px.
- Image must be square.
- Text area must use `min-w-0`.
- Song name uses `truncate`.
- Artist name uses `truncate`.
- Use 12px internal gap.
- Use a subtle elevated dark surface.

Do not make Featured a fixed grid.

==================================================
PART 5 — MADE FOR YOU CAROUSEL
==================================================

Made for you must be a horizontal card carousel.

Do not use a multi-column grid on mobile.

Recommended card width:

320–359px screens:

- 142–148px.

360–399px screens:

- 156–164px.

400–430px screens:

- 168–176px.

Suggested responsive class:

className="
  w-[146px]
  min-[360px]:w-[158px]
  min-[400px]:w-[172px]
  shrink-0
  snap-start
"

Each card:

- Rounded 18–20px.
- Padding: 10–12px.
- Dark elevated background.
- Album image uses `aspect-square`.
- Image uses `object-cover`.
- Image border radius: 14–16px.
- Song title uses one-line truncation.
- Artist uses one-line truncation.
- Play button remains inside the bottom-right of the image.

The user should see:

- Around two full cards on common mobile widths.
- A small preview of the next card.
- No large clipped third card.

==================================================
PART 6 — TRENDING CAROUSEL
==================================================

Keep Trending horizontally swipeable as requested.

Do not convert it into a vertical list.

Trending cards can use the same base music-card component as Made for you, but create visual variation.

Suggested differences:

- Slightly different card proportions.
- Optional rank badge such as:
  - 01
  - 02
  - 03
- Smaller secondary text.
- Optional trending indicator.
- Do not add excessive visual decoration.

Trending carousel must use the same reusable horizontal carousel behavior.

==================================================
PART 7 — REUSABLE CAROUSEL COMPONENT
==================================================

Create a reusable component such as:

HorizontalMusicSection

Suggested props:

type HorizontalMusicSectionProps<T> = {
  title: string;
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  onSeeAll?: () => void;
  itemClassName?: string;
  ariaLabel?: string;
};

Example:

<HorizontalMusicSection
  title="Made for you"
  items={recommendedSongs}
  ariaLabel="Made for you songs"
  renderItem={(song) => (
    <MusicCard song={song} />
  )}
/>

The reusable component must handle:

- Horizontal overflow.
- Hidden scrollbar.
- Touch swiping.
- Snap behavior.
- Section spacing.
- Header alignment.
- Optional "See all" action.
- Accessibility label.

Do not duplicate carousel behavior separately in every section.

==================================================
PART 8 — MOUSE AND TRACKPAD SUPPORT
==================================================

Horizontal sections must also work on desktop and mobile simulators.

Support:

- Touch swipe on mobile.
- Trackpad horizontal scrolling.
- Mouse wheel horizontal scrolling when Shift is held.
- Optional click-and-drag scrolling only if already supported without a new dependency.

Do not implement custom drag logic if native scrolling works correctly.

Native scrolling is preferred.

==================================================
PART 9 — PREVENT TOUCH CONFLICTS
==================================================

Interactive buttons inside cards must still work.

Requirements:

- Tapping a card opens the song or playlist.
- Tapping the play button starts playback.
- Horizontal dragging scrolls the carousel.
- A small drag must not accidentally trigger card navigation.
- Do not call `preventDefault()` globally on touch events.
- Do not use `touch-none`.
- Use `touch-pan-x` on carousel containers.
- Use standard button elements for play actions.

Review any existing handlers such as:

- `onTouchStart`
- `onTouchMove`
- `onPointerMove`
- `event.preventDefault()`
- `stopPropagation()`

Remove or limit handlers that block native horizontal scrolling.

==================================================
PART 10 — PAGE CONTENT SPACING
==================================================

The floating mini player and floating navigation require more bottom spacing.

Add sufficient bottom padding to the main scroll area:

padding-bottom:
  calc(176px + env(safe-area-inset-bottom));

Suggested Tailwind:

className="
  pb-[calc(176px+env(safe-area-inset-bottom))]
"

This must ensure that:

- The last carousel can be fully viewed.
- The last card is not hidden behind the mini player.
- The bottom of the page remains scrollable.
- iPhone safe-area is respected.

==================================================
PART 11 — MOBILE CONTENT CONTAINER
==================================================

The current main content container looks too close to the navigation and screen edges.

Use:

- Page horizontal padding only for normal content.
- Carousel padding handled inside each carousel.
- No fixed mobile width.
- Maximum width centered for tablet or desktop.

Suggested layout:

<main
  className="
    min-h-dvh w-full max-w-full
    overflow-x-hidden
    bg-[#111113]
    pb-[calc(176px+env(safe-area-inset-bottom))]
  "
>
  ...
</main>

Do not use:

- Fixed widths larger than the viewport.
- `w-screen` inside a padded parent.
- Large `min-width` values on page containers.
- Negative margins unless they are carefully balanced with carousel padding.

==================================================
PART 12 — VISUAL TOKENS
==================================================

Use consistent colors:

Background:
#111113

Primary surface:
#18181B

Elevated surface:
#202024

Navigation surface:
rgba(24, 24, 27, 0.95)

Primary text:
#FAFAFA

Secondary text:
#A1A1AA

Accent:
#00D698

Border:
rgba(255, 255, 255, 0.07)

Do not introduce a second accent color.

==================================================
PART 13 — ACCESSIBILITY
==================================================

- Navigation links must have accessible names.
- Active navigation item must use `aria-current="page"`.
- Carousels should have an `aria-label`.
- Play buttons need labels such as:
  - "Play Crystal Rain"
  - "Pause Crystal Rain"
- "See all" must be a real button or link.
- Touch targets must be at least 44x44px.
- Keyboard focus indicators must remain visible.
- Do not hide scrollable content from keyboard users.

==================================================
ACCEPTANCE CRITERIA
==================================================

The implementation is complete only when all of these conditions are met:

1. Bottom navigation uses a floating rounded dock design.
2. The navigation no longer fills the entire screen width.
3. Active navigation state is clearly visible.
4. Icons are at least 20px and easy to recognize.
5. Mini player is a separate floating card above the navigation.
6. Featured can be swiped horizontally on a real mobile device.
7. Made for you can be swiped horizontally.
8. Trending can be swiped horizontally.
9. Any other multi-item music section can be swiped horizontally.
10. The page body does not scroll horizontally.
11. Each carousel scrolls independently.
12. Scrollbars are visually hidden.
13. Native momentum scrolling works on iOS.
14. Card buttons still work correctly.
15. Horizontal drag does not accidentally open a card.
16. No carousel is blocked by an `overflow-hidden` ancestor.
17. One full Featured card and a small next-card preview are visible.
18. Around two Made for you cards are visible on a 390px screen.
19. Text inside partially visible cards is not awkwardly clipped.
20. The last page content is not hidden behind the player or navigation.
21. Safe-area works correctly on iPhone.
22. All user-facing text remains in English.
23. Existing routing, API, authentication, and playback logic remain unchanged.
24. No unnecessary dependency is added.

==================================================
DEBUGGING REQUIREMENTS
==================================================

Before completing the task, inspect the existing component tree and identify why horizontal swiping currently fails.

Check specifically for:

- `overflow-hidden` on carousel parents.
- Missing `overflow-x-auto`.
- `flex-wrap` instead of `flex-nowrap`.
- Cards missing `shrink-0`.
- A fixed-width page container.
- Touch handlers calling `preventDefault()`.
- Absolute layers covering the carousel.
- Incorrect `pointer-events`.
- Grid layouts used on mobile.
- An outer element capturing swipe gestures.

Do not solve the issue only by adding `overflow-x-auto`.

Fix the actual conflicting layout or event-handling rule.

Test at these viewport widths:

- 320px
- 360px
- 375px
- 390px
- 430px

Also test using actual touch emulation.

==================================================
AFTER IMPLEMENTATION
==================================================

Provide a concise implementation report containing:

1. Components created.
2. Components modified.
3. The root cause that prevented horizontal swiping.
4. How native touch scrolling was restored.
5. How body overflow was separated from carousel overflow.
6. How the bottom navigation was redesigned.
7. How safe-area and bottom spacing were handled.
8. Viewport sizes tested.
```

Thiết kế sau khi sửa nên có cấu trúc như sau:

```text
┌────────────────────────────────┐
│                                │
│          Page content          │
│                                │
│  Made for you                  │
│  [ Card ] [ Card ] [Card…]  →  │
│                                │
├────────────────────────────────┤
│  [Cover] Song – Artist    ▶    │  Floating mini player
├────────────────────────────────┤
│   Home   Search Library Friends│  Floating rounded dock
└────────────────────────────────┘
```

Điểm quan trọng nhất trong prompt là phần yêu cầu agent kiểm tra `overflow-hidden`, `touch-none`, `preventDefault()` và `shrink-0`. Chỉ thêm `overflow-x-auto` thường chưa đủ nếu một component cha đang chặn cử chỉ kéo.
