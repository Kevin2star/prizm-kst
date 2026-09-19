import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "./SignUp.css";

function Signup() {
  const navigate = useNavigate();

  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    // 비밀번호가 서로 다른 경우만 막기
    if (password !== passwordConfirm) {
      alert("비밀번호가 서로 일치하지 않습니다.");
      return;
    }

    setLoading(true);

    // 테스트용:
    // Supabase 회원가입은 시도하지만 실패해도 메인페이지로 이동
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nickname: nickname,
          },
        },
      });

      if (error) {
        console.log("테스트 모드 - 회원가입 오류 무시:", error.message);
      }
    } catch (error) {
      console.log("테스트 모드 - 회원가입 오류 무시:", error);
    }

    // Supabase 가입 실패 시에도 MainPage에서
    // 입력한 닉네임을 사용할 수 있도록 임시 저장
    sessionStorage.setItem("prizm_test_nickname", nickname);
    sessionStorage.setItem("prizm_test_email", email);

    setLoading(false);

    // 성공/실패 상관없이 무조건 메인페이지 이동
    navigate("/main");
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <Link to="/" className="auth-logo">
          PRIZM
        </Link>

        <h1>회원가입</h1>

        <p className="auth-description">
          이메일로 가입하고 새로운 협업을 시작하세요.
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="signup-nickname">닉네임</label>
          <input
            id="signup-nickname"
            type="text"
            placeholder="닉네임을 입력하세요"
            value={nickname}
            onChange={(event) => setNickname(event.target.value)}
            required
          />

          <label htmlFor="signup-email">이메일</label>
          <input
            id="signup-email"
            type="email"
            placeholder="example@email.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <label htmlFor="signup-password">비밀번호</label>
          <input
            id="signup-password"
            type="password"
            placeholder="6자 이상 입력하세요"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength="6"
            required
          />

          <label htmlFor="password-confirm">
            비밀번호 확인
          </label>
          <input
            id="password-confirm"
            type="password"
            placeholder="비밀번호를 다시 입력하세요"
            value={passwordConfirm}
            onChange={(event) =>
              setPasswordConfirm(event.target.value)
            }
            minLength="6"
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? "가입 중..." : "회원가입"}
          </button>
        </form>

        <p className="auth-guide">
          이미 계정이 있나요? <Link to="/">로그인</Link>
        </p>
      </section>
    </main>
  );
}

export default Signup;
