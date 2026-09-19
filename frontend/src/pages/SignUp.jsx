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

    // 닉네임 확인
    if (!nickname.trim()) {
      alert("닉네임을 입력해주세요.");
      return;
    }

    // 이메일 확인
    if (!email.trim()) {
      alert("이메일을 입력해주세요.");
      return;
    }

    // 비밀번호 확인
    if (!password) {
      alert("비밀번호를 입력해주세요.");
      return;
    }

    // 비밀번호 일치 확인
    if (password !== passwordConfirm) {
      alert("비밀번호가 서로 일치하지 않습니다.");
      return;
    }

    setLoading(true);

    try {
      // ==============================
      // Supabase 실제 회원가입
      // ==============================
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,

        options: {
          data: {
            nickname: nickname.trim(),
          },
        },
      });

      // 회원가입 실패
      if (error) {
        console.error("회원가입 실패:", error);

        alert("회원가입 실패: " + error.message);

        setLoading(false);
        return;
      }

      console.log("회원가입 성공:", data);

      // ==============================
      // MainPage에서 사용할 정보 저장
      // ==============================
      sessionStorage.setItem(
        "prizm_test_nickname",
        nickname.trim()
      );

      sessionStorage.setItem(
        "prizm_test_email",
        email.trim()
      );

      setLoading(false);

      // ==============================
      // 회원가입 성공 → MainPage
      // ==============================
      navigate("/main");

    } catch (error) {
      console.error("회원가입 중 오류:", error);

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
          PRIZM에서 새로운 협업을 시작해보세요.
        </p>

        <form
          className="auth-form"
          onSubmit={handleSubmit}
        >

          {/* 닉네임 */}
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
            autoComplete="nickname"
          />

          {/* 이메일 */}
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
            autoComplete="email"
          />

          {/* 비밀번호 */}
          <label htmlFor="signup-password">
            비밀번호
          </label>

          <input
            id="signup-password"
            type="password"
            placeholder="비밀번호를 입력하세요"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            autoComplete="new-password"
          />

          {/* 비밀번호 확인 */}
          <label htmlFor="signup-password-confirm">
            비밀번호 확인
          </label>

          <input
            id="signup-password-confirm"
            type="password"
            placeholder="비밀번호를 다시 입력하세요"
            value={passwordConfirm}
            onChange={(event) =>
              setPasswordConfirm(event.target.value)
            }
            autoComplete="new-password"
          />

          {/* 회원가입 버튼 */}
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
