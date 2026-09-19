import { supabase } from "./supabaseClient";

const NICKNAME_MIN = 2;
const NICKNAME_MAX = 80;

export function validateNickname(value) {
  const nickname = String(value ?? "").trim();
  if (nickname.length < NICKNAME_MIN || nickname.length > NICKNAME_MAX) {
    return { ok: false, nickname, message: "닉네임은 2자 이상 80자 이하여야 합니다." };
  }
  return { ok: true, nickname, message: "" };
}

export function validateEmail(value) {
  const email = String(value ?? "").trim().toLowerCase();
  if (!/^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$/.test(email)) {
    return { ok: false, email, message: "올바른 이메일을 입력하세요." };
  }
  return { ok: true, email, message: "" };
}

export function validatePassword(value) {
  const password = String(value ?? "");
  if (password.length < 6) {
    return { ok: false, message: "비밀번호는 6자 이상이어야 합니다." };
  }
  return { ok: true, message: "" };
}

export async function loadMemberProfile() {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  const session = sessionData.session;
  if (!session?.user) return null;

  const { data, error } = await supabase
    .from("members")
    .select("id, user_id, email, nickname, created_at")
    .eq("user_id", session.user.id)
    .maybeSingle();
  if (error) throw error;

  return {
    id: data?.user_id ?? session.user.id,
    email: data?.email ?? session.user.email ?? "",
    nickname: data?.nickname ?? session.user.user_metadata?.nickname ?? "",
    createdAt: data?.created_at ?? session.user.created_at ?? null,
  };
}

export async function signOutMember() {
  await supabase.auth.signOut();
}
