export function getSystemUrls() {
  const introUrl = process.env.NEXT_PUBLIC_INTRO_URL || "/";
  const loginUrl = process.env.NEXT_PUBLIC_LOGIN_URL || "/login";
  const loginNextUrl = process.env.NEXT_PUBLIC_LOGIN_NEXT_URL || "/login/next";

  return {
    introUrl,
    loginUrl,
    loginNextUrl,
  };
}
