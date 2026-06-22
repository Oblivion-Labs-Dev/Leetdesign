const ONE_WEEK_SECONDS = 60 * 60 * 24 * 7;

function useSecureCookies() {
  return process.env.NODE_ENV === "production";
}

export function buildAuthCookie(token: string) {
  return {
    name: "leetdesign_token",
    value: token,
    path: "/",
    maxAge: ONE_WEEK_SECONDS,
    sameSite: "lax" as const,
    httpOnly: true,
    secure: useSecureCookies(),
  };
}

export function buildExpiredAuthCookie() {
  return {
    name: "leetdesign_token",
    value: "",
    path: "/",
    maxAge: 0,
    sameSite: "lax" as const,
    httpOnly: true,
    secure: useSecureCookies(),
  };
}
