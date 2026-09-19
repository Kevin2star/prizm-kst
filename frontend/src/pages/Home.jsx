import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Home.css";

function Home() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();

    // 테스트용으로 입력한 이메일만 저장
    sessionStorage.setItem("prizm_test_email", email);

    // 로그인 성공/실패 검사 없이 무조건 MainPage로 이동
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

        <form
          className="auth-form"
          onSubmit={handleSubmit}
        >
          <label htmlFor="login-email">
            이메일
          </label>

          <input
            id="login-email"
            type="text"
            placeholder="example@email.com"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
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
          />

          <button type="submit">
            로그인
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
