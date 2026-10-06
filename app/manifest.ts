import type { MetadataRoute } from "next";

// 홈 화면에 추가했을 때 앱처럼 열리도록
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "EduPlaza by 미래에이아이랩",
    short_name: "EduPlaza",
    description: "강의 수강부터 퀴즈·과제·학습 리포트까지 한곳에서",
    start_url: "/",
    display: "standalone",
    background_color: "#F5F2E9",
    theme_color: "#131F19",
    lang: "ko",
    icons: [{ src: "/icon.png", sizes: "any", type: "image/png" }],
  };
}
