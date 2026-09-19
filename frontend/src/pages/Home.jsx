import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "./Home.css";

function Home() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setLoading(true);

    // 테스트용:
    // Supabase 로그인은 시도하지만 실패해도 무시
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.log(
          "테스트 모드 - 로그인 오류 무시:",
          error.message
        );
      }
    } catch (error) {
      console.log(
        "테스트 모드 - 로그인 오류 무시:",
        error
      );
    }

    setLoading(false);

    // 로그인 성공/실패 상관없이 메인페이지로 이동
    navigate("/main");
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <Link to="/" className="auth-logo">
          PRIZM
        </Link>

        <h1>로그인</h1>

        <p className="auth-description">
          PRIZM에서 팀의 아이디어를 함께 연결해보세요.
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="login-email">
            이메일
          </label>

          <input
            id="login-email"
            type="email"
            placeholder="example@email.com"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            required
          />

          <label htmlFor="login-password">
            비밀번호
          </label>

          <input
            id="login-password"
            type="password"
            placeholder="비밀번호를 입력하세요"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </form>

        <p className="auth-guide">
          아직 계정이 없나요?{" "}
          <Link to="/signup">
            회원가입
          </Link>
        </p>
      </section>
    </main>
  );
}

export default Home;
