/** 教室運営ハブ: サブナビ共通（営業は /classroom、その他は /school-general） */

export const CLASSROOM_HUB_SUBNAV = [
  { label: "基本情報", href: "/admin/settings/school-general?t=basic" },
  { label: "基本営業・曜日別・日別例外", href: "/admin/settings/classroom" },
  { label: "ペア設定", href: "/admin/settings/school-general?t=pair" },
  { label: "宿題", href: "/admin/settings/school-general?t=homework" },
];
