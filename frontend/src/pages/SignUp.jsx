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

    if (password !== passwordConfirm) {
      alert("비밀번호가 서로 일치하지 않습니다.");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,

        options: {
          data: {
            nickname: nickname,
          },
        },
      });

      if (error) {
        console.error("회원가입 오류:", error.message);
        alert("회원가입 실패: " + error.message);
        setLoading(false);
        return;
      }

      console.log("Supabase 회원가입 성공:", data);

      // MainPage에서 바로 사용할 수 있도록 저장
      sessionStorage.setItem(
        "prizm_test_nickname",
        nickname
      );

      sessionStorage.setItem(
        "prizm_test_email",
        email
      );

      setLoading(false);

      // 가입 성공 후 MainPage
      navigate("/main");
    } catch (error) {
      console.error("회원가입 오류:", error);

      alert("회원가입 중 오류가 발생했습니다.");

      setLoading(false);
    }
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

        <form
          className="auth-form"
          onSubmit={handleSubmit}
        >
          <label htmlFor="signup-nickname">
            닉네임
          </label>

          <input
            id="signup-nickname"
            type="text"
            placeholder="닉네임을 입력하세요"
            value={nickname}
            onChange={(event) =>
              setNickname(event.target.value)
            }
            required
          />

          <label htmlFor="signup-email">
            이메일
          </label>

          <input
            id="signup-email"
            type="email"
            placeholder="example@email.com"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            required
          />

          <label htmlFor="signup-password">
            비밀번호
          </label>

          <input
            id="signup-password"
            type="password"
            placeholder="6자 이상 입력하세요"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
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

          <button
            type="submit"
            disabled={loading}
          >
            {loading ? "가입 중..." : "회원가입"}
          </button>
        </form>

        <p className="auth-guide">
          이미 계정이 있나요?{" "}
          <Link to="/">
            로그인
          </Link>
        </p>

      </section>
    </main>
  );
}

export default Signup;
