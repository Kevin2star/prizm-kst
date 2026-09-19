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

    // 빈칸 확인
    if (!email.trim() || !password.trim()) {
      alert("이메일과 비밀번호를 입력해주세요.");
      return;
    }

    setLoading(true);

    try {
      // Supabase에 실제 로그인 요청
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      // 회원가입하지 않은 계정 / 비밀번호 오류
      if (error) {
        console.error("로그인 실패:", error.message);
        alert("이메일 또는 비밀번호가 올바르지 않습니다.");
        setLoading(false);
        return;
      }

      const user = data.user;

      // 회원가입할 때 Supabase에 저장된 닉네임
      const nickname = user?.user_metadata?.nickname || "";

      // MainPage에서 바로 사용할 수 있도록 저장
      sessionStorage.setItem(
        "prizm_test_nickname",
        nickname
      );

      sessionStorage.setItem(
        "prizm_test_email",
        user?.email || email.trim()
      );

      setLoading(false);

      // 로그인 성공한 경우에만 메인페이지 이동
      navigate("/main");
    } catch (error) {
      console.error("로그인 중 오류:", error);

      alert("로그인 중 오류가 발생했습니다.");

      setLoading(false);
    }
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
            type="email"
            placeholder="example@email.com"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            autoComplete="email"
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
            autoComplete="current-password"
          />

          <button
            type="submit"
            disabled={loading}
          >
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
      </div>
    </main>
  );
}

export default Home;
